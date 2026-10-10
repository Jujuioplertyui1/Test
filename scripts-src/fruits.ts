import { Entity, EntityDamageCause, GameMode, Player, system, Vector3, world } from "@minecraft/server";
import { FRUITS, FruitInfo, fruitByKey, Haki, HAKI } from "./defs";
import { power, save } from "./data";
import {
	bolt,
	chest,
	CRIMSON,
	CYAN,
	flash,
	isPlayer,
	lightningBurst,
	notice,
	particle,
	segment,
	shake,
	shakeAround,
	sound,
	title,
	vars,
	WHITE,
	YELLOW,
} from "./fx";
import { abilityDamage, giveBound, isKnockedOut, removeItems } from "./haki";
import { clashOf } from "./clash";
import { projectileInfo, registerProjectileOwner } from "./boss";
import { V } from "./vec";

const SKIN = { red: 0.93, green: 0.72, blue: 0.56 };

/** Sealed by Seastone until tick. */
export const sealed = new Map<string, number>();

export function seal(e: Entity, ticks: number): void {
	sealed.set(e.id, Math.max(sealed.get(e.id) ?? 0, system.currentTick + ticks));
	e.addTag("gl_seastone");
	if (isPlayer(e) && power(e).fruit()) notice(e, "§3Seastone saps your Devil Fruit power...", 40);
	particle(e.dimension, "grandline:seastone_drain", chest(e));
}

function scale(p: ReturnType<typeof power>): number {
	return 1 + p.fruitLevel() / 100;
}

function moveLore(f: FruitInfo, i: number): string[] {
	const m = f.moves[i];
	return [`§7${m.desc}`, `§8Cooldown ${(m.cooldown / 20).toFixed(1)}s · Stamina ${m.stamina}`, `${f.color}${f.name}`];
}

/** Gives the player their fruit's skill items (and takes away skills from other fruits). */
export function syncSkillItems(player: Player): void {
	const f = power(player).fruit();
	const keep = new Set(f ? f.moves.map((m) => m.item) : []);
	removeItems(player, (id) => id.startsWith("grandline:skill_") && !keep.has(id));
	if (f) f.moves.forEach((m, i) => giveBound(player, m.item, `${f.color}§l${m.name}`, moveLore(f, i)));
}

/** Eating a Devil Fruit. */
export function eatFruit(player: Player, fruitKey: string): void {
	const f = fruitByKey(fruitKey);
	if (!f) return;
	const p = power(player);
	if (p.saved.fruit) {
		if (player.getGameMode() === GameMode.Creative) {
			player.sendMessage("§cYour body rejects a second Devil Fruit! §7(Creative mode spared you.) Use §f/grandline:fruit none§7 to reset.");
			return;
		}
		player.sendMessage("§4Your body tears itself apart trying to hold the power of two Devil Fruits!");
		particle(player.dimension, "grandline:fruit_rejection", chest(player));
		sound(player.dimension, "random.explode", player.location, 1.5, 0.8);
		flash(player, CRIMSON, 0.05, 0.4, 1.5);
		system.runTimeout(() => {
			if (player.isValid) player.kill();
		}, 4);
		return;
	}
	p.saved.fruit = f.key;
	p.saved.fruitXp = 0;
	p.dirty = true;
	save(player, p);
	title(player, `${f.color}§l${f.jp}`, `${f.color}${f.name} §7— ${f.cls}`, 70, 5, 20);
	player.sendMessage(`§7Ugh... it tastes horrible. §fBut power surges through your body!`);
	player.sendMessage(`${f.color}§l${f.name}§r §8(${f.cls})§r\n§7${f.passive}\n§c⚠ You can no longer swim. The sea will drain your strength.`);
	f.moves.forEach((m, i) => player.sendMessage(`§8 ${i + 1}. ${f.color}${m.name}§7 — ${m.desc}`));
	particle(player.dimension, "grandline:fruit_power", player.location, vars(f.rgb));
	sound(player.dimension, "random.burp", player.location, 1, 0.8);
	sound(player.dimension, "beacon.power", player.location, 1, 0.7);
	flash(player, f.rgb, 0.1, 0.2, 0.8);
	syncSkillItems(player);
}

export function removeFruit(player: Player): void {
	const p = power(player);
	p.saved.fruit = "";
	p.saved.fruitXp = 0;
	p.dirty = true;
	save(player, p);
	syncSkillItems(player);
}

// ---------------------------------------------------------------------------------------------
// Moves
// ---------------------------------------------------------------------------------------------

interface Channel {
	kind: string;
	ticks: number;
	total: number;
	dir: Vector3;
	origin: Vector3;
	hit: Set<string>;
}
const channels = new Map<string, Channel>();
const rubberFists = new Map<string, { fist: Entity; owner: Player }>();

export function useSkill(player: Player, fruitKey: string, slot: number): void {
	const p = power(player);
	const f = p.fruit();
	if (!f || f.key !== fruitKey) {
		notice(player, "§7This power doesn't belong to you anymore.");
		syncSkillItems(player);
		return;
	}
	if (clashOf(player) || isKnockedOut(player)) return;
	if (player.hasTag("gl_seastone")) {
		notice(player, "§3Seastone seals your power!");
		return;
	}
	if (player.isInWater) {
		notice(player, "§9The sea drains your power... you can't use it here!");
		return;
	}
	if (channels.has(player.id)) return;
	const m = f.moves[slot];
	if (p.moveCd[slot] > 0) {
		notice(player, `${f.color}${m.name} §7ready in §f${(p.moveCd[slot] / 20).toFixed(1)}s`, 20);
		return;
	}
	if (p.saved.stamina < m.stamina) {
		notice(player, `§eNot enough stamina! §7(${m.stamina} needed)`, 30);
		return;
	}
	p.saved.stamina -= m.stamina;
	p.moveCd[slot] = m.cooldown;
	p.dirty = true;
	try {
		player.startItemCooldown(`grandline_${f.key}_${slot + 1}`, m.cooldown);
	} catch {
		// ignore
	}
	p.addFruitXp(3);
	const s = scale(p);
	const run = MOVES[f.key]?.[slot];
	if (run) run(player, s);
}

type MoveFn = (player: Player, s: number) => void;

function eye(player: Player): Vector3 {
	return player.getHeadLocation();
}

function spread(dir: Vector3, deg: number): Vector3 {
	if (deg <= 0) return dir;
	const r = (deg * Math.PI) / 180;
	return V.norm(V.add(dir, V.scale(V.randUnit(), Math.tan(r))));
}

function rotateYaw(dir: Vector3, deg: number): Vector3 {
	const r = (deg * Math.PI) / 180;
	const c = Math.cos(r);
	const sn = Math.sin(r);
	return V.norm({ x: dir.x * c - dir.z * sn, y: dir.y, z: dir.x * sn + dir.z * c });
}

function shoot(player: Player, id: string, speed: number, damage: number, kind: string, dir: Vector3 = player.getViewDirection()): Entity | undefined {
	const from = V.add(eye(player), V.scale(dir, 0.9));
	try {
		const proj = player.dimension.spawnEntity(id, from);
		const pc = proj.getComponent("minecraft:projectile");
		if (pc) {
			pc.owner = player;
			pc.shoot(V.scale(dir, speed));
		}
		registerProjectileOwner(proj, player, damage, kind);
		return proj;
	} catch {
		return undefined;
	}
}

/** Living, hittable entities in a cone in front of the player. */
function cone(player: Player, range: number, minDot: number): Entity[] {
	const origin = eye(player);
	const dir = player.getViewDirection();
	const out: Entity[] = [];
	for (const e of player.dimension.getEntities({ location: player.location, maxDistance: range + 1, excludeFamilies: ["inanimate"] })) {
		if (!validTarget(player, e)) continue;
		const to = V.sub(chest(e), origin);
		const d = V.len(to);
		if (d > range || d < 0.01) continue;
		if (V.dot(V.scale(to, 1 / d), dir) >= minDot) out.push(e);
	}
	return out;
}

function around(player: Player, center: Vector3, r: number): Entity[] {
	return player.dimension.getEntities({ location: center, maxDistance: r, excludeFamilies: ["inanimate"] }).filter((e) => validTarget(player, e));
}

function validTarget(player: Player, e: Entity): boolean {
	if (e.id === player.id || !e.isValid || !e.getComponent("minecraft:health")) return false;
	if (e.typeId === "minecraft:item" || e.typeId === "minecraft:xp_orb") return false;
	if (isPlayer(e)) {
		const gm = e.getGameMode();
		if (gm === GameMode.Creative || gm === GameMode.Spectator) return false;
	}
	try {
		const tame = e.getComponent("minecraft:tameable");
		if (tame?.tamedToPlayerId === player.id) return false;
	} catch {
		// ignore
	}
	return true;
}

function knock(e: Entity, dir: Vector3, h: number, v: number): void {
	try {
		e.applyKnockback({ x: dir.x * h, z: dir.z * h }, v);
	} catch {
		// ignore
	}
}

function blockAhead(player: Player, range: number): Vector3 {
	const dir = player.getViewDirection();
	const hit = player.getBlockFromViewDirection({ maxDistance: range });
	if (hit) return V.add(hit.block.location, hit.faceLocation);
	return V.add(eye(player), V.scale(dir, range));
}

/** Safe landing spot for dashes: just short of the first block in the way. */
function dashTarget(player: Player, range: number): Vector3 {
	const dir = player.getViewDirection();
	const start = player.location;
	const hit = player.dimension.getBlockFromRay(V.up(start, 0.9), dir, { maxDistance: range });
	const dist = hit ? Math.max(0, V.dist(V.up(start, 0.9), V.add(hit.block.location, hit.faceLocation)) - 1.2) : range;
	return V.add(start, V.scale(dir, dist));
}

const MOVES: Record<string, MoveFn[]> = {
	gomu: [
		// Gum-Gum Pistol
		(player, s) => {
			const fist = shoot(player, "grandline:rubber_fist", 2.4, 7 * s, "rubber");
			if (fist) {
				rubberFists.set(fist.id, { fist, owner: player });
				system.runTimeout(() => {
					rubberFists.delete(fist.id);
					try {
						if (fist.isValid) fist.remove();
					} catch {
						// ignore
					}
				}, 9);
			}
			sound(player.dimension, "random.bow", player.location, 1, 0.5);
			sound(player.dimension, "mob.slime.big", player.location, 0.8, 1.2);
			try {
				player.playAnimation("animation.grandline.player.punch", { blendOutTime: 0.2, controller: "grandline_pose" });
			} catch {
				// ignore
			}
		},
		// Gum-Gum Gatling
		(player) => {
			channels.set(player.id, { kind: "gatling", ticks: 30, total: 30, dir: player.getViewDirection(), origin: player.location, hit: new Set() });
			title(player, "", "§d§lGUM-GUM GATLING!", 25, 0, 8);
		},
		// Gear Second
		(player) => {
			const p = power(player);
			p.gear2 = 400;
			const o = { showParticles: false };
			player.addEffect("speed", 400, { amplifier: 2, ...o });
			player.addEffect("strength", 400, { amplifier: 1, ...o });
			player.addEffect("haste", 400, { amplifier: 1, ...o });
			player.addEffect("jump_boost", 400, { amplifier: 1, ...o });
			title(player, "§d§lGEAR SECOND", "§7Your blood pumps like an engine", 40, 3, 10);
			particle(player.dimension, "grandline:steam_burst", player.location);
			sound(player.dimension, "random.fizz", player.location, 1.2, 0.6);
			sound(player.dimension, "tile.piston.out", player.location, 1, 0.6);
			shake(player, 0.4, 0.5);
		},
	],
	mera: [
		// Fire Fist
		(player, s) => {
			shoot(player, "grandline:fire_fist", 1.5, 11 * s, "fire_fist");
			title(player, "", "§6§l火拳 HIKEN!", 20, 0, 8);
			sound(player.dimension, "mob.blaze.shoot", player.location, 1.5, 0.6);
			sound(player.dimension, "mob.ghast.fireball", player.location, 1, 0.8);
			try {
				player.playAnimation("animation.grandline.player.punch", { blendOutTime: 0.2, controller: "grandline_pose" });
			} catch {
				// ignore
			}
		},
		// Fire Gun
		(player) => {
			channels.set(player.id, { kind: "fire_gun", ticks: 14, total: 14, dir: player.getViewDirection(), origin: player.location, hit: new Set() });
		},
		// Flame Pillar
		(player, s) => {
			const at = player.location;
			particle(player.dimension, "grandline:flame_pillar", at);
			particle(player.dimension, "grandline:shockwave_ring", V.up(at, 0.15), vars({ red: 1, green: 0.45, blue: 0.1 }, { radius: 7 }));
			sound(player.dimension, "mob.ghast.fireball", at, 2, 0.5);
			sound(player.dimension, "random.explode", at, 1, 1.2);
			shakeAround(player.dimension, at, 14, 0.6, 0.5);
			for (const e of around(player, at, 6)) {
				abilityDamage(e, 9 * s, player, EntityDamageCause.fire);
				e.setOnFire(8, true);
				knock(e, V.norm(V.flat(V.sub(e.location, at))), 0.9, 0.6);
			}
		},
	],
	hie: [
		// Ice Partisan
		(player, s) => {
			const dir = player.getViewDirection();
			for (const yaw of [-12, -6, 0, 6, 12]) shoot(player, "grandline:ice_spear", 2.1, 5 * s, "ice", rotateYaw(dir, yaw));
			sound(player.dimension, "random.glass", player.location, 1, 1.4);
			sound(player.dimension, "random.bow", player.location, 1, 1.2);
		},
		// Ice Age
		(player, s) => {
			const at = player.location;
			const dim = player.dimension;
			const r = 9;
			for (let dx = -r; dx <= r; dx++) {
				for (let dz = -r; dz <= r; dz++) {
					if (dx * dx + dz * dz > r * r) continue;
					for (let dy = -3; dy <= 1; dy++) {
						const loc = V.of(Math.floor(at.x) + dx, Math.floor(at.y) + dy, Math.floor(at.z) + dz);
						try {
							const b = dim.getBlock(loc);
							const above = dim.getBlock(V.up(loc, 1));
							if (b && above && b.typeId === "minecraft:water" && above.isAir) b.setType("minecraft:frosted_ice");
						} catch {
							// unloaded
						}
					}
				}
			}
			particle(dim, "grandline:ice_age", at);
			particle(dim, "grandline:shockwave_ring", V.up(at, 0.15), vars(CYAN, { radius: r }));
			sound(dim, "random.glass", at, 2, 0.5);
			sound(dim, "mob.wither.break_block", at, 0.6, 1.6);
			for (const e of around(player, at, r)) {
				abilityDamage(e, 5 * s, player, EntityDamageCause.freezing);
				e.addEffect("slowness", 100, { amplifier: 4, showParticles: false });
				e.addEffect("mining_fatigue", 100, { amplifier: 2, showParticles: false });
				particle(dim, "grandline:frozen_shell", e.location);
			}
		},
		// Ice Time
		(player, s) => {
			const hits = player.getEntitiesFromViewDirection({ maxDistance: 24 });
			const target = hits.map((h) => h.entity).find((e) => validTarget(player, e));
			if (!target) {
				notice(player, "§bNo target in sight.", 20);
				power(player).moveCd[2] = 20;
				return;
			}
			encaseInIce(target);
			abilityDamage(target, 6 * s, player, EntityDamageCause.freezing);
			target.addEffect("slowness", 100, { amplifier: 255, showParticles: false });
			target.addEffect("weakness", 100, { amplifier: 255, showParticles: false });
			sound(player.dimension, "random.glass", target.location, 2, 0.4);
			title(player, "", "§b§lICE TIME", 20, 0, 8);
			segment(player.dimension, chest(player), chest(target), CYAN, 0.25, false, 0.4);
		},
	],
	goro: [
		// El Thor
		(player, s) => {
			const at = blockAhead(player, 50);
			const dim = player.dimension;
			try {
				dim.spawnEntity("minecraft:lightning_bolt", at);
			} catch {
				// ignore
			}
			for (let i = 0; i < 4; i++) bolt(dim, V.add(at, V.of((Math.random() - 0.5) * 3, 30, (Math.random() - 0.5) * 3)), at, { color: YELLOW, core: false, width: 0.6, segments: 12, branches: 3 });
			particle(dim, "grandline:el_thor", at);
			particle(dim, "grandline:shockwave_ring", V.up(at, 0.2), vars(YELLOW, { radius: 6 }));
			shakeAround(dim, at, 30, 1.0, 0.8);
			for (const e of around(player, at, 4)) abilityDamage(e, 12 * s, player, EntityDamageCause.lightning);
			title(player, "", "§e§lEL THOR!", 20, 0, 8);
		},
		// Vari: 1 Million Volts
		(player, s) => {
			const at = chest(player);
			const dim = player.dimension;
			lightningBurst(dim, at, 6, 16, YELLOW);
			particle(dim, "grandline:electric_dome", player.location);
			sound(dim, "ambient.weather.lightning.impact", at, 2, 1.2);
			sound(dim, "beacon.deactivate", at, 1, 2);
			for (const e of around(player, at, 6)) {
				abilityDamage(e, 8 * s, player, EntityDamageCause.lightning);
				e.addEffect("slowness", 50, { amplifier: 3, showParticles: false });
				segment(dim, at, chest(e), YELLOW, 0.2, false, 0.25);
			}
		},
		// Thunder Step
		(player, s) => {
			const from = player.location;
			const to = dashTarget(player, 24);
			const dim = player.dimension;
			const dir = V.norm(V.sub(to, from));
			const len = V.dist(from, to);
			for (const h of dim.getEntitiesFromRay(V.up(from, 1), dir, { maxDistance: len + 1 })) {
				if (validTarget(player, h.entity)) abilityDamage(h.entity, 6 * s, player, EntityDamageCause.lightning);
			}
			try {
				player.teleport(to, { keepVelocity: false, checkForBlocks: true });
			} catch {
				// ignore
			}
			bolt(dim, V.up(from, 1), V.up(to, 1), { color: YELLOW, core: false, width: 0.45, branches: 3, jitter: 0.08, life: 0.35 });
			sound(dim, "ambient.weather.lightning.impact", from, 1.5, 1.3);
			sound(dim, "ambient.weather.lightning.impact", to, 1.5, 1.1);
			particle(dim, "grandline:spark_burst", V.up(to, 1));
		},
	],
	gura: [
		// Quake Punch
		(player, s) => {
			const dim = player.dimension;
			const dir = player.getViewDirection();
			const at = V.add(eye(player), V.scale(dir, 1.6));
			airCrack(dim, at, 2.2);
			for (const e of cone(player, 9, 0.68)) {
				abilityDamage(e, 11 * s, player);
				knock(e, V.norm(V.flat(dir)), 2.6, 0.45);
				if (isPlayer(e)) shake(e, 1.2, 0.6);
			}
			sound(dim, "random.explode", at, 1.5, 0.6);
			sound(dim, "random.glass", at, 1.5, 0.5);
			shakeAround(dim, at, 20, 0.9, 0.6);
			title(player, "", "§f§lSHIN... GURA!", 20, 0, 8);
			try {
				player.playAnimation("animation.grandline.player.punch", { blendOutTime: 0.2, controller: "grandline_pose" });
			} catch {
				// ignore
			}
		},
		// Seaquake
		(player, s) => {
			const dim = player.dimension;
			const at = player.location;
			particle(dim, "grandline:ground_debris", at);
			particle(dim, "grandline:shockwave_ring", V.up(at, 0.15), vars(WHITE, { radius: 9 }));
			airCrack(dim, V.up(at, 0.4), 1.6);
			sound(dim, "random.explode", at, 2, 0.5);
			sound(dim, "dig.stone", at, 2, 0.5);
			shakeAround(dim, at, 26, 1.3, 0.9);
			for (const e of around(player, at, 8)) {
				abilityDamage(e, 8 * s, player);
				knock(e, V.norm(V.flat(V.sub(e.location, at))), 0.6, 1.05);
			}
		},
		// Tremor Wave
		(player) => {
			channels.set(player.id, { kind: "tremor", ticks: 12, total: 12, dir: V.norm(V.flat(player.getViewDirection())), origin: player.location, hit: new Set() });
			sound(player.dimension, "random.explode", player.location, 1, 0.5);
		},
	],
	pika: [
		// Yasakani no Magatama
		(player) => {
			channels.set(player.id, { kind: "yasakani", ticks: 20, total: 20, dir: player.getViewDirection(), origin: player.location, hit: new Set() });
			title(player, "", "§e§l八尺瓊勾玉", 20, 0, 8);
		},
		// Ama no Murakumo
		(player, s) => {
			const dim = player.dimension;
			const dir = player.getViewDirection();
			const side = V.perp(V.flat(dir));
			const hand = V.add(eye(player), V.scale(side, 0.4));
			segment(dim, hand, V.add(hand, V.scale(dir, 3.5)), YELLOW, 0.3, false, 0.5);
			particle(dim, "grandline:light_slash", V.add(eye(player), V.scale(dir, 2)), vars(YELLOW, { dx: dir.x, dz: dir.z }));
			for (const e of cone(player, 5.5, 0.25)) abilityDamage(e, 12 * s, player);
			sound(dim, "beacon.power", player.location, 1, 1.8);
			sound(dim, "random.orb", player.location, 1, 0.6);
		},
		// Yata no Kagami
		(player) => {
			const from = player.location;
			const to = dashTarget(player, 40);
			const dim = player.dimension;
			try {
				player.teleport(to, { keepVelocity: false, checkForBlocks: true });
			} catch {
				// ignore
			}
			segment(dim, V.up(from, 1), V.up(to, 1), YELLOW, 0.5, false, 0.5);
			segment(dim, V.up(from, 1), V.up(to, 1), WHITE, 0.2, false, 0.35);
			particle(dim, "grandline:light_flash", V.up(from, 1));
			particle(dim, "grandline:light_flash", V.up(to, 1));
			sound(dim, "mob.endermen.portal", from, 1, 1.8);
			sound(dim, "beacon.activate", to, 1, 2);
		},
	],
};

function airCrack(dim: Entity["dimension"], at: Vector3, size: number): void {
	particle(dim, "grandline:air_crack", at, vars(undefined, { size }));
	for (let i = 0; i < 7; i++) {
		const dir = V.randUnit();
		bolt(dim, at, V.add(at, V.scale(dir, size * (0.8 + Math.random()))), { color: WHITE, core: false, width: 0.07, jitter: 0.25, branches: 1, life: 0.45 });
	}
}

const iceShells: { blocks: Vector3[]; until: number; dim: Entity["dimension"] }[] = [];

function encaseInIce(target: Entity): void {
	const dim = target.dimension;
	const base = V.of(Math.floor(target.location.x), Math.floor(target.location.y), Math.floor(target.location.z));
	const placed: Vector3[] = [];
	for (let dx = -1; dx <= 1; dx++) {
		for (let dz = -1; dz <= 1; dz++) {
			for (let dy = 0; dy <= 2; dy++) {
				const shell = Math.abs(dx) === 1 || Math.abs(dz) === 1 || dy === 2;
				if (!shell) continue;
				const loc = V.of(base.x + dx, base.y + dy, base.z + dz);
				try {
					const b = dim.getBlock(loc);
					if (b && b.isAir) {
						b.setType("minecraft:packed_ice");
						placed.push(loc);
					}
				} catch {
					// ignore
				}
			}
		}
	}
	particle(dim, "grandline:frozen_shell", target.location);
	iceShells.push({ blocks: placed, until: system.currentTick + 100, dim });
}

function meltIce(): void {
	const now = system.currentTick;
	for (let i = iceShells.length - 1; i >= 0; i--) {
		const s = iceShells[i];
		if (s.until > now) continue;
		for (const loc of s.blocks) {
			try {
				const b = s.dim.getBlock(loc);
				if (b && b.typeId === "minecraft:packed_ice") {
					b.setType("minecraft:air");
					particle(s.dim, "grandline:ice_shatter", V.add(loc, V.of(0.5, 0.5, 0.5)));
				}
			} catch {
				// ignore
			}
		}
		sound(s.dim, "random.glass", s.blocks[0] ?? V.of(0, 0, 0), 1, 0.8);
		iceShells.splice(i, 1);
	}
}

function tickChannel(player: Player, c: Channel): void {
	const p = power(player);
	const s = scale(p);
	const step = c.total - c.ticks;
	const dim = player.dimension;
	switch (c.kind) {
		case "gatling": {
			const dir = player.getViewDirection();
			const front = V.add(eye(player), V.scale(dir, 1.5));
			particle(dim, "grandline:gatling_fists", front, vars(SKIN, { dx: dir.x, dy: dir.y, dz: dir.z }));
			if (step % 2 === 0) sound(dim, "game.player.attack.strong", front, 0.7, 1.2 + Math.random() * 0.6);
			if (step % 10 === 0) {
				for (const e of cone(player, 5.5, 0.55)) {
					abilityDamage(e, 5 * s, player);
					knock(e, V.norm(V.flat(dir)), 0.4, 0.1);
				}
			}
			break;
		}
		case "fire_gun":
			if (step % 2 === 0) {
				shoot(player, "grandline:fire_bullet", 2.6, 4.5 * s, "fire", spread(player.getViewDirection(), 4));
				sound(dim, "mob.blaze.shoot", player.location, 0.8, 1.6);
			}
			break;
		case "yasakani":
			if (step % 2 === 0) {
				shoot(player, "grandline:light_bullet", 3.4, 4 * s, "light", spread(player.getViewDirection(), 6));
				sound(dim, "beacon.power", player.location, 0.5, 2);
			}
			break;
		case "tremor": {
			const at = V.add(c.origin, V.scale(c.dir, 2 * (step + 1)));
			particle(dim, "grandline:tremor_burst", V.up(at, 0.5));
			if (step % 2 === 0) sound(dim, "random.explode", at, 0.8, 0.7);
			shakeAround(dim, at, 12, 0.5, 0.3);
			for (const e of around(player, V.up(at, 0.5), 2.6)) {
				if (c.hit.has(e.id)) continue;
				c.hit.add(e.id);
				abilityDamage(e, 9 * s, player);
				knock(e, c.dir, 1.6, 0.5);
			}
			break;
		}
	}
}

/** Called every tick for every player with a fruit. */
export function tickFruitPlayer(player: Player): void {
	const p = power(player);
	const f = p.fruit();
	const now = system.currentTick;
	const c = channels.get(player.id);
	if (c) {
		if (!player.isValid || clashOf(player) || isKnockedOut(player)) channels.delete(player.id);
		else {
			tickChannel(player, c);
			c.ticks--;
			if (c.ticks <= 0) channels.delete(player.id);
		}
	}
	if (p.gear2 > 0) {
		p.gear2--;
		if (now % 3 === 0) particle(player.dimension, "grandline:steam", player.location);
	}
	if (!f) return;

	const sealedNow = player.hasTag("gl_seastone");
	// The sea rejects Devil Fruit users.
	if (player.isInWater) {
		if (!p.wasInWater) notice(player, "§9The sea drains your strength! §7You're sinking...", 50);
		p.wasInWater = true;
		if (now % 10 === 0) {
			player.addEffect("slowness", 30, { amplifier: 2, showParticles: false });
			player.addEffect("weakness", 30, { amplifier: 1, showParticles: false });
			player.addEffect("mining_fatigue", 30, { amplifier: 1, showParticles: false });
		}
		if (now % 2 === 0) {
			try {
				player.applyKnockback({ x: 0, z: 0 }, -0.12);
			} catch {
				// ignore
			}
		}
		p.saved.stamina = Math.max(0, p.saved.stamina - 0.4);
		p.saved.haki = Math.max(0, p.saved.haki - 0.15);
		p.armOn = false;
		p.obsOn = false;
	} else {
		p.wasInWater = false;
	}

	// Hie Hie: the sea freezes beneath your feet.
	if (f.key === "hie" && !sealedNow && !player.isSneaking && now % 2 === 0) {
		const dim = player.dimension;
		const fy = Math.floor(player.location.y) - 1;
		for (let dx = -2; dx <= 2; dx++) {
			for (let dz = -2; dz <= 2; dz++) {
				if (dx * dx + dz * dz > 5) continue;
				const loc = V.of(Math.floor(player.location.x) + dx, fy, Math.floor(player.location.z) + dz);
				try {
					const b = dim.getBlock(loc);
					const above = dim.getBlock(V.up(loc, 1));
					if (b && above && b.typeId === "minecraft:water" && above.isAir) {
						b.setType("minecraft:frosted_ice");
						if (Math.random() < 0.3) particle(dim, "grandline:ice_shatter", V.add(loc, V.of(0.5, 1.1, 0.5)));
					}
				} catch {
					// ignore
				}
			}
		}
	}
	// Mera Mera: embers drift off your body.
	if (f.key === "mera" && !sealedNow && now % 8 === 0 && !player.isInWater) particle(player.dimension, "grandline:ember", V.up(player.location, 1));
	if (f.key === "goro" && !sealedNow && now % 14 === 0) particle(player.dimension, "grandline:spark_small", V.up(player.location, 1));
	if (f.key === "pika" && !sealedNow && now % 12 === 0) particle(player.dimension, "grandline:light_mote", V.up(player.location, 1));
}

export function tickFruitWorld(): void {
	// Gum-Gum Pistol: draw the stretched arm from the shoulder to the fist.
	for (const [id, r] of rubberFists) {
		if (!r.fist.isValid || !r.owner.isValid) {
			rubberFists.delete(id);
			continue;
		}
		const dir = r.owner.getViewDirection();
		const shoulder = V.add(V.up(r.owner.location, 1.35), V.scale(V.perp(V.flat(dir)), -0.35));
		segment(r.owner.dimension, shoulder, r.fist.location, SKIN, 0.22, false, 0.08);
	}
	if (system.currentTick % 10 === 0) meltIce();
	const now = system.currentTick;
	for (const [id, until] of sealed) {
		if (until > now) continue;
		sealed.delete(id);
		for (const pl of world.getAllPlayers()) {
			if (pl.id === id) {
				pl.removeTag("gl_seastone");
				if (power(pl).fruit()) notice(pl, "§aYour Devil Fruit power returns.", 30);
			}
		}
	}
}

/** Projectile hits from fruit moves, the Crimson King's Emission and pirate guns. */
export function onProjectileHitEntity(projectile: Entity, hit: Entity | undefined, source: Entity | undefined): void {
	if (!hit) return;
	const info = projectileInfo.get(projectile.id);
	const kind = info?.kind ?? DEFAULT_KIND[projectile.typeId] ?? "bullet";
	const owner = info?.owner ?? source;
	if (!owner || owner.id === hit.id) return;
	if (!hit.getComponent("minecraft:health")) return;
	const dmg = info?.damage ?? DEFAULT_DAMAGE[kind] ?? 4;
	const dim = hit.dimension;
	switch (kind) {
		case "fire_fist":
			explodeFire(owner, hit.location, dmg);
			return;
		case "fire":
			abilityDamage(hit, dmg, owner, EntityDamageCause.fire);
			hit.setOnFire(4, true);
			break;
		case "ice":
			abilityDamage(hit, dmg, owner, EntityDamageCause.freezing);
			hit.addEffect("slowness", 60, { amplifier: 2, showParticles: false });
			particle(dim, "grandline:ice_shatter", chest(hit));
			break;
		case "light":
			abilityDamage(hit, dmg, owner);
			particle(dim, "grandline:light_flash", chest(hit));
			break;
		case "rubber": {
			abilityDamage(hit, dmg, owner);
			const dir = V.norm(V.flat(V.sub(hit.location, owner.location)));
			knock(hit, dir, 1.8, 0.35);
			sound(dim, "game.player.attack.strong", hit.location, 1, 0.8);
			particle(dim, "grandline:punch_impact", chest(hit));
			break;
		}
		case "haki_wave": {
			abilityDamage(hit, dmg, owner);
			const dir = V.norm(V.flat(V.sub(hit.location, owner.location)));
			knock(hit, dir, 1.4, 0.3);
			particle(dim, "grandline:armament_impact", chest(hit));
			sound(dim, "mob.warden.attack_impact", hit.location, 1, 0.7);
			break;
		}
		default:
			abilityDamage(hit, dmg, owner, EntityDamageCause.projectile);
	}
}

export function onProjectileHitBlock(projectile: Entity, at: Vector3, source: Entity | undefined): void {
	const info = projectileInfo.get(projectile.id);
	const kind = info?.kind ?? DEFAULT_KIND[projectile.typeId];
	const owner = info?.owner ?? source;
	if (kind === "fire_fist" && owner) explodeFire(owner, at, info?.damage ?? 11);
	else if (kind === "ice") particle(projectile.dimension, "grandline:ice_shatter", at);
	else if (kind === "light") particle(projectile.dimension, "grandline:light_flash", at);
}

function explodeFire(owner: Entity, at: Vector3, dmg: number): void {
	const dim = owner.dimension;
	particle(dim, "grandline:fire_explosion", at);
	particle(dim, "grandline:shockwave_ring", V.up(at, 0.2), vars({ red: 1, green: 0.4, blue: 0.05 }, { radius: 5 }));
	sound(dim, "random.explode", at, 1.6, 0.9);
	sound(dim, "mob.ghast.fireball", at, 1.4, 0.6);
	shakeAround(dim, at, 18, 0.7, 0.5);
	for (const e of dim.getEntities({ location: at, maxDistance: 3.8, excludeFamilies: ["inanimate"] })) {
		if (e.id === owner.id || !e.getComponent("minecraft:health")) continue;
		if (isPlayer(owner) && !validTarget(owner, e)) continue;
		const d = V.dist(e.location, at);
		abilityDamage(e, dmg * (d < 1.8 ? 1 : 0.6), owner, EntityDamageCause.fire);
		e.setOnFire(6, true);
		knock(e, V.norm(V.flat(V.sub(e.location, at))), 0.8, 0.4);
	}
}

const DEFAULT_KIND: Record<string, string> = {
	"grandline:fire_fist": "fire_fist",
	"grandline:fire_bullet": "fire",
	"grandline:ice_spear": "ice",
	"grandline:light_bullet": "light",
	"grandline:rubber_fist": "rubber",
	"grandline:haki_wave": "haki_wave",
	"grandline:pirate_bullet": "bullet",
};
const DEFAULT_DAMAGE: Record<string, number> = { fire_fist: 8, fire: 4, ice: 4, light: 4, rubber: 6, haki_wave: 9, bullet: 5 };

export function tickCooldowns(player: Player): void {
	const p = power(player);
	for (let i = 0; i < 3; i++) if (p.moveCd[i] > 0) p.moveCd[i]--;
}

export { FRUITS, HAKI, Haki };
