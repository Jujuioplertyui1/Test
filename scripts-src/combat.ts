import {
	Entity,
	EntityDamageCause,
	EntityHurtAfterEvent,
	EntityHurtBeforeEvent,
	EquipmentSlot,
	Player,
	system,
	world,
} from "@minecraft/server";
import { BOSS_ID, BOSS_NAME, Haki, PIRATE_ID } from "./defs";
import { ARMAMENT_AWAKEN, OBSERVATION_AWAKEN, power } from "./data";
import { bolt, chest, CYAN, isPlayer, notice, particle, RED, sound, vars, WHITE } from "./fx";
import {
	abilityDamage,
	abilityHits,
	awaken,
	brokenWill,
	gainXp,
	health,
	isKnockedOut,
	khansWrath,
	maxHealth,
} from "./haki";
import { bossUndodgeable, onBossHurt } from "./boss";
import { clashOf, startClash } from "./clash";
import { V } from "./vec";

/** Entities whose next hit (this tick) ignores dodges and intangibility. */
const bypass = new Map<string, number>();
export function markBypass(e: Entity): void {
	bypass.set(e.id, system.currentTick);
}

const BLACK_BLADE = "grandline:black_blade";
const JITTE = "grandline:seastone_jitte";

function mainhand(e: Entity): string | undefined {
	try {
		return e.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId;
	} catch {
		return undefined;
	}
}

/** Is this attack coated in Haki (or Seastone)? Needed to touch Logia users and the Crimson King. */
export function isCoated(attacker: Entity, melee: boolean): boolean {
	if (isPlayer(attacker)) {
		if (power(attacker).armOn) return true;
		if (melee) {
			const held = mainhand(attacker);
			return held === BLACK_BLADE || held === JITTE;
		}
		return false;
	}
	return attacker.typeId === BOSS_ID;
}

export function isSealed(e: Entity): boolean {
	return e.hasTag("gl_seastone") || e.isInWater;
}

function isLogiaPirate(e: Entity): boolean {
	return e.typeId === PIRATE_ID && e.hasTag("gl_logia");
}

function onBeforeHurt(ev: EntityHurtBeforeEvent): void {
	const target = ev.hurtEntity;
	const src = ev.damageSource;
	const now = system.currentTick;
	if (bypass.get(target.id) === now) return;

	// --- Devil Fruit passive immunities ---
	if (isPlayer(target)) {
		const p = power(target);
		const fruit = p.fruit();
		if (fruit && !target.hasTag("gl_seastone")) {
			const c = src.cause;
			if (c === EntityDamageCause.lightning && (fruit.key === "goro" || fruit.key === "gomu")) {
				ev.cancel = true;
				return;
			}
			if ((c === EntityDamageCause.fire || c === EntityDamageCause.fireTick || c === EntityDamageCause.lava || c === EntityDamageCause.magma) && fruit.key === "mera") {
				ev.cancel = true;
				return;
			}
			if (c === EntityDamageCause.fall && fruit.key === "gomu") {
				ev.cancel = true;
				return;
			}
			if (c === EntityDamageCause.freezing && fruit.key === "hie") {
				ev.cancel = true;
				return;
			}
		}
	}

	const attacker = src.damagingEntity;
	if (!attacker || attacker.id === target.id) return;
	const melee = src.cause === EntityDamageCause.entityAttack && !src.damagingProjectile && abilityHits.get(target.id) !== now;
	const coated = isCoated(attacker, melee);

	// --- Observation Haki: dodge ---
	if (isPlayer(target)) {
		const p = power(target);
		if (p.obsOn && p.has(Haki.Observation) && !isKnockedOut(target) && !clashOf(target)) {
			const lvl = p.level(Haki.Observation);
			const futureSight = p.hasTech("future_sight") && p.futureSightCd <= 0;
			const undodgeable = bossUndodgeable(attacker);
			const chance = p.hasTech("evasion") ? Math.min(0.45, 0.15 + lvl * 0.003) : 0.06;
			if (futureSight || (!undodgeable && p.saved.haki >= 4 && Math.random() < chance)) {
				ev.cancel = true;
				system.run(() => onDodge(target, attacker, futureSight));
				return;
			}
		}
		// --- Logia: intangible to attacks without Haki ---
		const fruit = p.fruit();
		if (fruit && fruit.cls === "Logia" && !isSealed(target) && !coated && p.saved.stamina >= 3) {
			ev.cancel = true;
			system.run(() => onIntangible(target, attacker, fruit.key));
			return;
		}
	} else if (isLogiaPirate(target) && !coated) {
		ev.cancel = true;
		system.run(() => onIntangible(target, attacker, "mera"));
		return;
	}

	// --- The Crimson King's own Haki ---
	if (target.typeId === BOSS_ID && isPlayer(attacker) && !isKnockedOut(target) && !clashOf(target)) {
		const p = power(attacker);
		const dodge = p.obsOn ? 0.08 : 0.3;
		if (Math.random() < dodge) {
			ev.cancel = true;
			system.run(() => onBossDodge(target, attacker, p.obsOn));
			return;
		}
		if (!coated) {
			ev.damage *= 0.25;
			system.run(() => hint(attacker, `§c${BOSS_NAME}'s Armament blocks your blow! §7Coat yourself with §5Armament Haki`));
		}
	}

	// --- Damage modifiers ---
	let dmg = ev.damage;
	if (isPlayer(attacker)) {
		const p = power(attacker);
		if (p.armOn && melee) {
			const lvl = p.level(Haki.Armament);
			dmg += 1.5 + lvl * 0.06;
			if (p.hasTech("ryou")) {
				let armored = target.typeId === BOSS_ID;
				try {
					armored = armored || (target.getComponent("minecraft:equippable")?.totalArmor ?? 0) >= 8;
				} catch {
					// ignore
				}
				if (isPlayer(target) && power(target).armOn) armored = true;
				if (armored) dmg *= 1.3;
			}
			if (p.hasTech("infusion")) dmg *= 1.25;
		}
		if (p.counterTicks > 0 && melee) {
			dmg *= 1.6;
			p.counterTicks = 0;
			system.run(() => {
				particle(target.dimension, "grandline:counter_flash", chest(target));
				sound(target.dimension, "random.anvil_land", target.location, 0.4, 1.8);
			});
		}
	}
	if (isPlayer(target)) {
		const p = power(target);
		if (p.armOn && p.hasTech("full_body")) dmg *= 1 - Math.min(0.35, 0.1 + p.level(Haki.Armament) * 0.003);
	}
	const bw = brokenWill.get(target.id);
	if (bw !== undefined && bw > now) dmg *= 1.15;
	ev.damage = dmg;
}

function onAfterHurt(ev: EntityHurtAfterEvent): void {
	const target = ev.hurtEntity;
	const src = ev.damageSource;
	const attacker = src.damagingEntity;
	const now = system.currentTick;
	if (!target.isValid) return;
	const ability = abilityHits.get(target.id) === now;
	const melee = src.cause === EntityDamageCause.entityAttack && !src.damagingProjectile && !ability;

	if (target.typeId === BOSS_ID) onBossHurt(target, ev.damage, attacker);

	// --- Attacker progression ---
	if (attacker && isPlayer(attacker) && attacker.id !== target.id && ev.damage > 0) {
		const p = power(attacker);
		if (melee) {
			if (!p.has(Haki.Armament)) {
				const bare = !mainhand(attacker);
				p.saved.armProg += ev.damage * (bare ? 2 : 1);
				p.dirty = true;
				if (p.saved.armProg >= ARMAMENT_AWAKEN) awaken(attacker, Haki.Armament, "Your fists have hardened through countless battles.");
			} else if (p.armOn) {
				gainXp(attacker, Haki.Armament, 2 + ev.damage * 0.3);
				coatedHitFx(attacker, target, p.hasTech("infusion"));
				if (p.hasTech("emission")) emission(attacker, target, ev.damage);
				if (p.hasTech("infusion")) infusionArc(attacker, target, ev.damage);
			}
			// Conqueror's Infusion: two infused blows meeting = clash without touching.
			if (p.armOn && p.hasTech("infusion") && p.clashMeleeCd <= 0 && !clashOf(attacker) && !clashOf(target)) {
				const targetInfused = target.typeId === BOSS_ID || (isPlayer(target) && power(target).armOn && power(target).hasTech("infusion"));
				const theyHitMe = p.lastHitBy && p.lastHitBy.id === target.id && now - p.lastHitBy.tick <= 15;
				if (targetInfused && theyHitMe && Math.random() < 0.35) {
					p.clashMeleeCd = 300;
					startClash(attacker, target, false);
				}
			}
		}
		if (ability) p.addFruitXp(2 + ev.damage * 0.25);
	}

	// --- Target progression and Khan's Wrath ---
	if (isPlayer(target) && attacker && attacker.id !== target.id) {
		const p = power(target);
		p.lastHitBy = { id: attacker.id, tick: now };
		if (!p.has(Haki.Observation)) {
			p.saved.obsProg++;
			p.dirty = true;
			if (p.saved.obsProg >= OBSERVATION_AWAKEN) awaken(target, Haki.Observation, "You've taken so many hits that you can feel the next one coming.");
		} else if (p.obsOn) {
			gainXp(target, Haki.Observation, 1);
		}
		if (p.hasTech("khans_wrath") && p.khanCd <= 0 && health(target) < maxHealth(target) * 0.3) khansWrath(target);
	}
}

function onDodge(player: Player, attacker: Entity, futureSight: boolean): void {
	const p = power(player);
	if (futureSight) p.futureSightCd = 120;
	else p.saved.haki = Math.max(0, p.saved.haki - 4);
	if (p.hasTech("counter")) p.counterTicks = 60;
	gainXp(player, Haki.Observation, futureSight ? 4 : 6);
	const away = V.norm(V.flat(V.sub(player.location, attacker.location)));
	const side = V.cross(away, V.of(0, 1, 0));
	const dir = V.norm(V.add(V.scale(side, Math.random() < 0.5 ? 1 : -1), V.scale(away, 0.4)));
	try {
		player.applyKnockback({ x: dir.x * 0.9, z: dir.z * 0.9 }, 0.15);
	} catch {
		// ignore
	}
	particle(player.dimension, "grandline:dodge_afterimage", player.location, vars(futureSight ? { red: 1, green: 0.4, blue: 1 } : CYAN));
	sound(player.dimension, "mob.illusioner.mirror_move", player.location, 1, futureSight ? 0.7 : 1.3);
	notice(player, futureSight ? "§d§l未来視 §r§dFuture Sight!" : "§b✦ Dodged!", 20);
	if (isPlayer(attacker)) notice(attacker, "§7They read your attack...", 20);
}

function onIntangible(target: Entity, attacker: Entity, element: string): void {
	const at = chest(target);
	if (isPlayer(target)) {
		const p = power(target);
		p.saved.stamina = Math.max(0, p.saved.stamina - 3);
	}
	particle(target.dimension, `grandline:logia_${element}`, at);
	const snd: Record<string, string> = { mera: "mob.blaze.shoot", hie: "random.glass", goro: "random.fizz", pika: "beacon.power" };
	sound(target.dimension, snd[element] ?? "random.fizz", at, 0.6, 1.4);
	if (isPlayer(attacker)) hint(attacker, "§6Your attack passed right through! §7Coat it with §5Armament Haki§7 (or Seastone)");
}

function onBossDodge(boss: Entity, player: Player, hadObservation: boolean): void {
	particle(boss.dimension, "grandline:dodge_afterimage", boss.location, vars(RED));
	sound(boss.dimension, "mob.illusioner.mirror_move", boss.location, 1, 0.8);
	hint(player, hadObservation ? "§cVarek read your attack." : "§cVarek saw that coming! §7Use §bObservation Haki§7 to read his moves");
}

function hint(player: Player, text: string): void {
	const p = power(player);
	if (p.hintCd > 0) return;
	p.hintCd = 60;
	notice(player, text, 50);
}

function coatedHitFx(attacker: Player, target: Entity, infused: boolean): void {
	const at = chest(target);
	particle(target.dimension, "grandline:armament_impact", at);
	if (infused) {
		for (let i = 0; i < 3; i++) bolt(target.dimension, at, V.add(at, V.scale(V.randUnit(), 1.6)), { width: 0.1, branches: 0 });
		sound(target.dimension, "ambient.weather.lightning.impact", at, 0.35, 1.6);
	}
	sound(attacker.dimension, "random.anvil_land", at, 0.15, 1.9);
}

/** Emission: the shockwave passes through the target into enemies behind it. */
function emission(attacker: Player, target: Entity, dmg: number): void {
	const dir = V.norm(V.flat(V.sub(target.location, attacker.location)));
	const origin = target.location;
	particle(target.dimension, "grandline:emission_wave", V.up(V.add(origin, V.scale(dir, 1.2)), 1), vars(undefined, { dx: dir.x, dz: dir.z }));
	for (const e of target.dimension.getEntities({ location: V.add(origin, V.scale(dir, 2)), maxDistance: 2.5, excludeFamilies: ["inanimate"] })) {
		if (e.id === target.id || e.id === attacker.id || !e.getComponent("minecraft:health")) continue;
		abilityDamage(e, dmg * 0.4, attacker);
		try {
			e.applyKnockback({ x: dir.x * 1.2, z: dir.z * 1.2 }, 0.3);
		} catch {
			// ignore
		}
	}
}

/** Conqueror's Infusion: black lightning arcs to a second enemy. */
function infusionArc(attacker: Player, target: Entity, dmg: number): void {
	const near = target.dimension.getEntities({ location: target.location, maxDistance: 5, excludeFamilies: ["inanimate"], closest: 4 });
	for (const e of near) {
		if (e.id === target.id || e.id === attacker.id || !e.getComponent("minecraft:health")) continue;
		if (isPlayer(e) && e.getGameMode() !== "Survival" && e.getGameMode() !== "Adventure") continue;
		bolt(target.dimension, chest(target), chest(e), { width: 0.14, branches: 1 });
		abilityDamage(e, dmg * 0.35, attacker);
		break;
	}
}

export function initCombat(): void {
	world.beforeEvents.entityHurt.subscribe(onBeforeHurt);
	world.afterEvents.entityHurt.subscribe(onAfterHurt);
	// unused import guard for WHITE (keeps palette import stable for future effects)
	void WHITE;
}
