/**
 * Grand Line: Haki Clash — a One Piece add-on for Minecraft Bedrock.
 * Entry point: registers components and commands, wires events and runs the game loop.
 */
import { ButtonState, InputButton, Player, system, world } from "@minecraft/server";
import { BOSS_ID, Haki, PIRATE_ID } from "./defs";
import { forget, power, save } from "./data";
import { notice, particle } from "./fx";
import { isKnockedOut, knockedOut, tickKnockouts } from "./haki";
import { initCombat } from "./combat";
import { clashOf, pushClash, tickClashes } from "./clash";
import { onBossDeath, tickBosses, track } from "./boss";
import { onProjectileHitBlock, onProjectileHitEntity, tickCooldowns, tickFruitPlayer, tickFruitWorld } from "./fruits";
import { hudTick } from "./hud";
import { onBreakBlock, onInteractEntity, registerItemComponents } from "./items";
import { registerCommands, restoreKit } from "./commands";
import { V } from "./vec";

system.beforeEvents.startup.subscribe((ev) => {
	registerItemComponents(ev.itemComponentRegistry);
	registerCommands(ev.customCommandRegistry);
});

initCombat();

world.afterEvents.playerSpawn.subscribe((ev) => {
	const player = ev.player;
	const p = power(player);
	if (!p.saved.welcomed) {
		p.saved.welcomed = true;
		p.dirty = true;
		system.runTimeout(() => {
			if (!player.isValid) return;
			player.sendMessage("§6§l⚓ Welcome to the Grand Line!§r");
			player.sendMessage("§7Haki is the power of will. §5Armament§7 awakens through fighting, §3Observation§7 by surviving hits, and §4Conqueror's§7 only before a king...");
			player.sendMessage("§7Open your §fHaki Codex§7 any time to see your progress. Dig on beaches with a shovel for buried treasure — and Devil Fruits.");
			player.onScreenDisplay.setTitle("§6§lGRAND LINE", { fadeInDuration: 10, stayDuration: 60, fadeOutDuration: 20, subtitle: "§7Haki · Devil Fruits · Haki Clash" });
			restoreKit(player);
			save(player);
		}, 40);
	} else {
		system.runTimeout(() => {
			if (player.isValid) restoreKit(player);
		}, 20);
	}
	p.armOn = false;
	p.obsOn = false;
});

world.beforeEvents.playerLeave.subscribe((ev) => {
	const player = ev.player;
	const id = player.id;
	const p = power(player);
	const data = JSON.stringify(p.saved);
	system.run(() => forget(id));
	try {
		player.setDynamicProperty("grandline:power", data);
	} catch {
		// read-only context: saved on the periodic autosave instead
	}
});

// Mash Sneak during a Haki Clash.
world.afterEvents.playerButtonInput.subscribe((ev) => {
	if (ev.button === InputButton.Sneak && ev.newButtonState === ButtonState.Pressed && clashOf(ev.player)) pushClash(ev.player);
});

world.afterEvents.entityDie.subscribe((ev) => {
	const dead = ev.deadEntity;
	if (dead.typeId === BOSS_ID) onBossDeath(dead, ev.damageSource.damagingEntity);
	knockedOut.delete(dead.id);
});

world.afterEvents.entitySpawn.subscribe((ev) => {
	const e = ev.entity;
	if (e.typeId === BOSS_ID) track(e);
	if (e.typeId === PIRATE_ID) {
		system.runTimeout(() => {
			try {
				if (e.isValid && e.getComponent("minecraft:variant")?.value === 2) e.addTag("gl_logia");
			} catch {
				// ignore
			}
		}, 2);
	}
});

world.afterEvents.entityLoad.subscribe((ev) => {
	if (ev.entity.typeId === BOSS_ID) track(ev.entity);
});

world.afterEvents.projectileHitEntity.subscribe((ev) => {
	try {
		onProjectileHitEntity(ev.projectile, ev.getEntityHit().entity, ev.source);
	} catch {
		// projectile or target already gone
	}
});

world.afterEvents.projectileHitBlock.subscribe((ev) => {
	try {
		onProjectileHitBlock(ev.projectile, ev.location, ev.source);
	} catch {
		// projectile already gone
	}
});

world.afterEvents.playerBreakBlock.subscribe(onBreakBlock);

world.afterEvents.playerInteractWithEntity.subscribe((ev) => {
	onInteractEntity(ev.player, ev.target, ev.beforeItemStack);
});

/** Per-player upkeep: Haki drain/regen, cooldowns, Devil Fruit weaknesses and the HUD. */
function tickPlayer(player: Player): void {
	const p = power(player);
	const now = system.currentTick;

	// Haki energy
	let drain = 0;
	if (p.armOn) drain += Math.max(0.04, 0.1 - p.level(Haki.Armament) * 0.0006);
	if (p.obsOn) drain += Math.max(0.03, 0.075 - p.level(Haki.Observation) * 0.0004);
	const maxH = p.maxHaki();
	const regen = 0.12 + (p.level(Haki.Armament) + p.level(Haki.Observation) + p.level(Haki.Conqueror)) * 0.0015;
	p.saved.haki = Math.min(maxH, p.saved.haki + (drain > 0 ? regen * 0.25 - drain : regen));
	if (p.saved.haki <= 0) {
		p.saved.haki = 0;
		if (p.armOn || p.obsOn) {
			p.armOn = false;
			p.obsOn = false;
			notice(player, "§5Your Haki is exhausted!", 40);
		}
	}
	if (isKnockedOut(player) && (p.armOn || p.obsOn)) {
		p.armOn = false;
		p.obsOn = false;
	}
	// Stamina
	if (!player.isInWater) p.saved.stamina = Math.min(p.maxStamina(), p.saved.stamina + 0.25 + p.fruitLevel() * 0.002);

	// Cooldowns and timers
	if (p.conqCd > 0) p.conqCd--;
	if (p.futureSightCd > 0) p.futureSightCd--;
	if (p.counterTicks > 0) p.counterTicks--;
	if (p.khanCd > 0) p.khanCd--;
	if (p.clashMeleeCd > 0) p.clashMeleeCd--;
	if (p.hintCd > 0) p.hintCd--;
	tickCooldowns(player);

	// Observation passively trains while active
	if (p.obsOn && now % 40 === 0) {
		const lvl = p.addXp(Haki.Observation, 1);
		if (lvl !== undefined) notice(player, `§bObservation Haki §fmastery §e${lvl}`, 40);
	}
	// Future Sight ready ping
	if (p.obsOn && p.hasTech("future_sight") && p.futureSightCd === 1) particle(player.dimension, "grandline:observation_pulse", player.location);

	tickFruitPlayer(player);
	hudTick(player);

	if (now % 40 === 0) restoreKitQuiet(player);
	if (now % 100 === 0 && p.dirty) save(player, p);
}

function restoreKitQuiet(player: Player): void {
	try {
		restoreKit(player);
	} catch {
		// inventory might be unavailable mid-respawn
	}
}

world.afterEvents.worldLoad.subscribe(() => {
	system.runInterval(() => {
		for (const player of world.getAllPlayers()) {
			try {
				tickPlayer(player);
			} catch (e) {
				console.warn(`[grandline] player tick: ${e}`);
			}
		}
		try {
			tickClashes();
			tickBosses();
			tickFruitWorld();
			tickKnockouts();
			if (system.currentTick % 6 === 0) koStars();
		} catch (e) {
			console.warn(`[grandline] world tick: ${e}`);
		}
	}, 1);
	console.info("[grandline] Grand Line: Haki Clash loaded. The great pirate era begins!");
});

/** Dizzy stars spin above everything that's been knocked out. */
function koStars(): void {
	for (const [id] of knockedOut) {
		const e = world.getEntity(id);
		if (!e || !e.isValid) continue;
		particle(e.dimension, "grandline:ko_stars", V.up(e.getHeadLocation(), 0.55));
	}
}

system.afterEvents.scriptEventReceive.subscribe((ev) => {
	if (ev.id !== "grandline:kit") return;
	const src = ev.sourceEntity;
	if (src && src.typeId === "minecraft:player") restoreKit(src as Player);
});
