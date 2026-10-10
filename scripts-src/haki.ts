import { Entity, EntityDamageCause, ItemLockMode, ItemStack, Player, system } from "@minecraft/server";
import { BOSS_ID, Haki, HAKI, PIRATE_ID, TECHNIQUES } from "./defs";
import { ARMAMENT_AWAKEN, OBSERVATION_AWAKEN, power, Power, save } from "./data";
import {
	aura,
	BLACK,
	bolt,
	chest,
	CRIMSON,
	flash,
	isPlayer,
	lightningBurst,
	notice,
	particle,
	RED,
	shake,
	shakeAround,
	sound,
	title,
	vars,
} from "./fx";
import { clashOf, pushClash, startClash } from "./clash";
import { markBypass } from "./combat";
import { V } from "./vec";

/** Entity ids that are currently knocked out, with the tick they wake up. */
export const knockedOut = new Map<string, number>();
/** Entities whose will was broken by Imperial Decree (take +15% damage) until tick. */
export const brokenWill = new Map<string, number>();

const BOSSLIKE = new Set([
	"minecraft:ender_dragon",
	"minecraft:wither",
	"minecraft:warden",
	"minecraft:elder_guardian",
	BOSS_ID,
]);

export function isBossLike(e: Entity): boolean {
	return BOSSLIKE.has(e.typeId);
}

export function maxHealth(e: Entity): number {
	try {
		return e.getComponent("minecraft:health")?.effectiveMax ?? 20;
	} catch {
		return 20;
	}
}

export function health(e: Entity): number {
	try {
		return e.getComponent("minecraft:health")?.currentValue ?? 0;
	} catch {
		return 0;
	}
}

/** How hard an entity is to knock out with Conqueror's Haki. */
export function willOf(e: Entity): number {
	if (isPlayer(e)) {
		const p = power(e);
		let w = 15 + (p.level(Haki.Armament) + p.level(Haki.Observation)) * 0.6;
		if (p.has(Haki.Conqueror)) w += 60 + p.level(Haki.Conqueror);
		if (p.obsOn) w += 10;
		return w;
	}
	let armor = 0;
	try {
		armor = e.getComponent("minecraft:equippable")?.totalArmor ?? 0;
	} catch {
		armor = 0;
	}
	return maxHealth(e) + armor * 1.5;
}

export function conquerorPower(p: Power): number {
	return 26 + p.level(Haki.Conqueror) * 1.5;
}

export function isKnockedOut(e: Entity): boolean {
	const until = knockedOut.get(e.id);
	return until !== undefined && until > system.currentTick;
}

/** Knock an entity out cold: it collapses, can't move or hurt anyone, and sees stars. */
export function knockOut(e: Entity, ticks: number): void {
	if (!e.isValid) return;
	const until = system.currentTick + ticks;
	knockedOut.set(e.id, Math.max(knockedOut.get(e.id) ?? 0, until));
	const opts = { amplifier: 255, showParticles: false };
	try {
		e.addEffect("slowness", ticks, opts);
		e.addEffect("weakness", ticks, opts);
		e.addEffect("mining_fatigue", ticks, { amplifier: 5, showParticles: false });
		if (isPlayer(e)) {
			e.addEffect("blindness", Math.min(ticks, 60), { amplifier: 0, showParticles: false });
			e.addEffect("nausea", ticks + 40, { amplifier: 0, showParticles: false });
			title(e, "§8§l. . .", "§7Your consciousness fades...", Math.max(10, ticks - 10), 5, 10);
			e.playAnimation("animation.grandline.player.ko", {
				controller: "grandline_pose",
				blendOutTime: 0.4,
				stopExpression: `query.anim_time >= ${(ticks / 20).toFixed(2)}`,
			});
		} else if (e.typeId === BOSS_ID || e.typeId === PIRATE_ID) {
			e.triggerEvent("grandline:stunned");
			system.runTimeout(() => {
				if (e.isValid) e.triggerEvent("grandline:recover");
			}, ticks);
		}
	} catch {
		// entity might not accept effects
	}
	particle(e.dimension, "grandline:ko_stars", V.up(e.location, 2.1));
}

export function tickKnockouts(): void {
	const now = system.currentTick;
	for (const [id, until] of knockedOut) {
		if (until <= now) knockedOut.delete(id);
	}
	for (const [id, until] of brokenWill) {
		if (until <= now) brokenWill.delete(id);
	}
}

/** Gives the player an item if they don't already carry one; Haki and skill items are bound to the player. */
export function giveBound(player: Player, itemId: string, name?: string, lore?: string[]): void {
	const inv = player.getComponent("minecraft:inventory")?.container;
	if (!inv) return;
	for (let i = 0; i < inv.size; i++) {
		if (inv.getItem(i)?.typeId === itemId) return;
	}
	const stack = new ItemStack(itemId, 1);
	stack.keepOnDeath = true;
	stack.lockMode = ItemLockMode.inventory;
	if (name) stack.nameTag = name;
	if (lore) stack.setLore(lore);
	const left = inv.addItem(stack);
	if (left) player.dimension.spawnItem(left, player.location);
}

export function removeItems(player: Player, predicate: (id: string) => boolean): void {
	const inv = player.getComponent("minecraft:inventory")?.container;
	if (!inv) return;
	for (let i = 0; i < inv.size; i++) {
		const it = inv.getItem(i);
		if (it && predicate(it.typeId)) inv.setItem(i, undefined);
	}
}

export function hakiItemLore(h: Haki): string[] {
	switch (h) {
		case Haki.Armament:
			return ["§7Use: §fcoat yourself in black steel", "§8Hits Logia users and breaks enemy Armament"];
		case Haki.Observation:
			return ["§7Use: §fopen your senses", "§8Sense enemies, dodge attacks, see the future"];
		case Haki.Conqueror:
			return ["§7Use: §crelease your will", "§8During a clash: tap or press Sneak rapidly!"];
	}
}

/** Awakens a type of Haki with a cinematic moment. */
export function awaken(player: Player, h: Haki, reason: string): void {
	const p = power(player);
	if (p.has(h)) return;
	p.saved.unlocked[h] = true;
	p.dirty = true;
	save(player, p);
	const info = HAKI[h];
	title(player, `${info.color}§l${info.kanji}`, `${info.color}${info.name} §fAWAKENED`, 70, 5, 20);
	player.sendMessage(`§6✦ §l${info.name} awakened!§r §7${reason}`);
	player.sendMessage(`§7  ${hakiItemLore(h).join(" §8| ")}`);
	const color = h === Haki.Conqueror ? RED : h === Haki.Armament ? { red: 0.55, green: 0.3, blue: 0.9 } : { red: 0.3, green: 0.85, blue: 1 };
	particle(player.dimension, "grandline:awaken_pillar", player.location, vars(color));
	sound(player.dimension, "random.totem", player.location, 0.8, 0.8);
	sound(player.dimension, "ambient.weather.thunder", player.location, 0.6, 1.4);
	flash(player, h === Haki.Conqueror ? CRIMSON : BLACK, 0.05, 0.15, 0.8);
	shake(player, 0.6, 0.8);
	giveBound(player, info.item, undefined, hakiItemLore(h));
	if (h === Haki.Conqueror) lightningBurst(player.dimension, chest(player), 4, 6);
}

export function onLevelUp(player: Player, h: Haki, level: number): void {
	const info = HAKI[h];
	notice(player, `${info.color}${info.name} §fmastery §e${level}`, 50);
	sound(player.dimension, "random.levelup", player.location, 0.5, 1.4);
	for (const t of TECHNIQUES) {
		if (t.haki === h && t.level === level) {
			title(player, `${info.color}§l${t.kanji}`, `§fNew technique: ${info.color}${t.name}`, 50);
			player.sendMessage(`§6✦ New technique: ${info.color}§l${t.name}§r ${t.card ? `§8(${t.card})` : ""}\n§7  ${t.desc}`);
		}
	}
}

export function gainXp(player: Player, h: Haki, amount: number): void {
	const lvl = power(player).addXp(h, amount);
	if (lvl !== undefined) onLevelUp(player, h, lvl);
}

export function toggleArmament(player: Player): void {
	const p = power(player);
	if (!p.has(Haki.Armament)) {
		notice(player, `§7Armament Haki is still asleep... §8(deal melee damage: ${Math.floor(p.saved.armProg)}/${ARMAMENT_AWAKEN})`);
		return;
	}
	if (!p.armOn && p.saved.haki < 5) {
		notice(player, "§5Not enough Haki!");
		return;
	}
	p.armOn = !p.armOn;
	p.dirty = true;
	if (p.armOn) {
		sound(player.dimension, "armor.equip_netherite", player.location, 1, 0.7);
		sound(player.dimension, "random.anvil_land", player.location, 0.25, 1.6);
		particle(player.dimension, "grandline:armament_burst", chest(player));
		notice(player, "§5§l武装色 §r§fArmament Haki §aON", 30);
	} else {
		sound(player.dimension, "armor.equip_generic", player.location, 0.8, 0.8);
		notice(player, "§5Armament Haki §7off", 25);
	}
}

export function toggleObservation(player: Player): void {
	const p = power(player);
	if (!p.has(Haki.Observation)) {
		notice(player, `§7Observation Haki is still asleep... §8(survive hits: ${p.saved.obsProg}/${OBSERVATION_AWAKEN})`);
		return;
	}
	if (!p.obsOn && p.saved.haki < 5) {
		notice(player, "§bNot enough Haki!");
		return;
	}
	p.obsOn = !p.obsOn;
	p.dirty = true;
	if (p.obsOn) {
		sound(player.dimension, "block.amethyst_block.chime", player.location, 1.2, 0.6);
		sound(player.dimension, "beacon.activate", player.location, 0.5, 1.8);
		particle(player.dimension, "grandline:observation_pulse", player.location);
		notice(player, "§b§l見聞色 §r§fObservation Haki §aON", 30);
	} else {
		sound(player.dimension, "beacon.deactivate", player.location, 0.5, 1.8);
		notice(player, "§bObservation Haki §7off", 25);
	}
}

/** Conqueror's Haki item / key: push in a clash, otherwise release a burst. */
export function useConqueror(player: Player): void {
	if (clashOf(player)) {
		pushClash(player);
		return;
	}
	const p = power(player);
	if (!p.has(Haki.Conqueror)) {
		notice(player, "§7Only those with the qualities of a king can use Conqueror's Haki... §8(defeat the Crimson King)");
		return;
	}
	if (p.conqCd > 0) {
		notice(player, `§cConqueror's Haki recovering: §f${Math.ceil(p.conqCd / 20)}s`);
		return;
	}
	if (p.saved.haki < 30) {
		notice(player, "§cNot enough Haki! §7(30 needed)");
		return;
	}
	if (isKnockedOut(player)) return;
	const lvl = p.level(Haki.Conqueror);
	p.saved.haki -= 30;
	p.conqCdMax = Math.max(140, 300 - Math.floor(lvl * 1.5));
	p.conqCd = p.conqCdMax;
	p.dirty = true;
	const radius = 8 + lvl * 0.12;
	burst(player, conquerorPower(p), radius, false);
}

/**
 * Releases a wave of Conqueror's Haki from `user`.
 * Weak-willed enemies are knocked out; another Conqueror in range starts a Haki Clash instead.
 */
export function burst(user: Entity, pw: number, radius: number, isBoss: boolean): void {
	const dim = user.dimension;
	const center = user.location;
	const userPower = isPlayer(user) ? power(user) : undefined;

	// --- visuals and sound ---
	try {
		user.playAnimation(isPlayer(user) ? "animation.grandline.player.haoshoku" : "animation.grandline.captain.roar", { blendOutTime: 0.4, controller: "grandline_pose" });
	} catch {
		// ignore
	}
	particle(dim, isBoss ? "grandline:haoshoku_wave_boss" : "grandline:haoshoku_wave", V.up(center, 1.1), vars(undefined, { radius }));
	particle(dim, "grandline:shockwave_ring", V.up(center, 0.15), vars(CRIMSON, { radius }));
	lightningBurst(dim, chest(user), Math.min(6, radius * 0.45), isBoss ? 10 : 7);
	for (let i = 0; i < (isBoss ? 3 : 2); i++) {
		const top = V.add(center, V.of((Math.random() - 0.5) * radius, 18 + Math.random() * 10, (Math.random() - 0.5) * radius));
		bolt(dim, V.up(center, 2), top, { width: 0.3, segments: 12, branches: 3, jitter: 0.1 });
	}
	sound(dim, "mob.warden.sonic_boom", center, 3, isBoss ? 0.5 : 0.65);
	sound(dim, "ambient.weather.thunder", center, 2.5, isBoss ? 0.5 : 0.7);
	sound(dim, "mob.enderdragon.growl", center, 0.6, isBoss ? 0.5 : 0.8);
	shakeAround(dim, center, radius * 2.2, isBoss ? 1.4 : 1.0, 1.1);
	for (const pl of dim.getPlayers({ location: center, maxDistance: radius * 1.6 })) {
		flash(pl, CRIMSON, 0.04, 0.06, 0.45);
	}

	// --- effects on everything nearby ---
	const targets = dim.getEntities({
		location: center,
		maxDistance: radius,
		excludeFamilies: ["inanimate"],
		excludeTypes: ["minecraft:item", "minecraft:xp_orb", "minecraft:arrow", "minecraft:armor_stand"],
	});
	let clashTarget: Entity | undefined;
	let clashDist = Infinity;
	let knocked = 0;
	const decree = userPower?.hasTech("imperial_decree") ?? isBoss;
	for (const t of targets) {
		if (t.id === user.id || !t.isValid) continue;
		if (!t.getComponent("minecraft:health")) continue;
		if (isAlly(user, t)) continue;
		if (isPlayer(t)) {
			const gm = t.getGameMode();
			if (gm === "Creative" || gm === "Spectator") continue;
		}
		const d = V.dist(t.location, center);
		// Another Conqueror? Their wills collide.
		const tIsConqueror = (isPlayer(t) && power(t).has(Haki.Conqueror) && power(t).saved.haki >= 10) || t.typeId === BOSS_ID;
		if (tIsConqueror && !clashOf(t) && d < clashDist) {
			clashTarget = t;
			clashDist = d;
			continue;
		}
		if (isPlayer(t) && isBoss) {
			bossBurstOnPlayer(user, t, pw);
			continue;
		}
		const will = willOf(t);
		if (isBossLike(t)) {
			t.addEffect("slowness", 60, { amplifier: 1, showParticles: false });
			continue;
		}
		if (will <= pw) {
			knockOut(t, Math.round(100 + pw));
			knocked++;
		} else {
			t.addEffect("slowness", 70, { amplifier: 2, showParticles: false });
			t.addEffect("weakness", 70, { amplifier: 0, showParticles: false });
			if (isPlayer(t)) {
				t.addEffect("nausea", 80, { amplifier: 0, showParticles: false });
				notice(t, "§cAn overwhelming will washes over you...");
			}
			if (decree) {
				t.addEffect("slowness", 60, { amplifier: 255, showParticles: false });
				brokenWill.set(t.id, system.currentTick + 200);
				particle(dim, "grandline:bind_chains", t.location);
			}
		}
	}
	if (isPlayer(user)) {
		const p = power(user);
		gainXp(user, Haki.Conqueror, 6 + knocked * 4);
		p.dirty = true;
		if (knocked > 0) notice(user, `§c§l覇王色 §r§fKnocked out §c${knocked}§f enemies`, 40);
	}
	if (clashTarget) {
		const awakened = false;
		system.runTimeout(() => {
			if (user.isValid && clashTarget && clashTarget.isValid) startClash(user, clashTarget, awakened);
		}, 6);
	}
}

/** The Crimson King's Conqueror's Haki hitting a player who is not (yet) a Conqueror. */
function bossBurstOnPlayer(boss: Entity, player: Player, pw: number): void {
	const p = power(player);
	const canAwaken = p.has(Haki.Armament) && p.has(Haki.Observation) && p.level(Haki.Armament) + p.level(Haki.Observation) >= 30;
	if (canAwaken && (Math.random() < 0.35 || p.saved.resisted >= 2)) {
		awaken(player, Haki.Conqueror, "Your will refused to break before a king!");
		player.sendMessage("§4Varek§r: §c...Ha! So you have it too. Show me your will!");
		system.runTimeout(() => {
			if (boss.isValid && player.isValid) startClash(boss, player, true);
		}, 30);
		return;
	}
	const will = willOf(player);
	if (will < pw * 0.6) {
		knockOut(player, 60);
		player.sendMessage("§4Varek§r: §7Weak. Come back when your will can stand before mine.");
	} else {
		p.saved.resisted++;
		p.dirty = true;
		player.addEffect("slowness", 80, { amplifier: 2, showParticles: false });
		player.addEffect("nausea", 100, { amplifier: 0, showParticles: false });
		notice(player, "§6You withstood the Conqueror's Haki! §7Your will is growing...", 60);
		if (canAwaken) player.sendMessage("§8Something inside you stirs... (keep resisting his Conqueror's Haki)");
	}
}

export function isAlly(a: Entity, b: Entity): boolean {
	const pirate = (e: Entity) => e.typeId === BOSS_ID || e.typeId === PIRATE_ID;
	return pirate(a) && pirate(b);
}

/** Khan's Wrath: an eruption of will when the player is about to fall. */
export function khansWrath(player: Player): void {
	const p = power(player);
	p.khanCd = 1800;
	const dim = player.dimension;
	title(player, "§4§l覇王の怒り", "§cKhan's Wrath!", 30, 2, 10);
	particle(dim, "grandline:haoshoku_wave", V.up(player.location, 1.1), vars(undefined, { radius: 9 }));
	lightningBurst(dim, chest(player), 6, 10);
	sound(dim, "mob.warden.sonic_boom", player.location, 3, 0.5);
	shakeAround(dim, player.location, 20, 1.2, 1);
	for (const t of dim.getEntities({ location: player.location, maxDistance: 9, excludeFamilies: ["inanimate"] })) {
		if (t.id === player.id || !t.getComponent("minecraft:health")) continue;
		if (isPlayer(t) && (t.getGameMode() === "Creative" || t.getGameMode() === "Spectator")) continue;
		knockOut(t, isBossLike(t) ? 60 : 200);
	}
}

/** Small damage helper used by abilities: marks the hit so combat knows it was a technique. */
export function abilityDamage(target: Entity, amount: number, attacker: Entity, cause: EntityDamageCause = EntityDamageCause.entityAttack): boolean {
	if (!target.isValid) return false;
	markAbility(target);
	try {
		return target.applyDamage(amount, { cause, damagingEntity: attacker });
	} catch {
		return false;
	}
}

/** Damage that ignores dodges, intangibility and Armament (clash results, Conqueror's lightning). */
export function trueDamage(target: Entity, amount: number, attacker?: Entity): void {
	if (!target.isValid) return;
	markBypass(target);
	try {
		target.applyDamage(amount, { cause: EntityDamageCause.entityAttack, damagingEntity: attacker });
	} catch {
		// ignore
	}
}

export const abilityHits = new Map<string, number>();
export function markAbility(target: Entity): void {
	abilityHits.set(target.id, system.currentTick);
}

export { aura };
