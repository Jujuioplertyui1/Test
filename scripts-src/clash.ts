import { EasingType, Entity, GameMode, InputPermissionCategory, Player, system, Vector3 } from "@minecraft/server";
import { BOSS_ID, BOSS_NAME, G, Haki } from "./defs";
import { power, save } from "./data";
import {
	BLACK,
	bolt,
	chest,
	CRIMSON,
	flash,
	GOLD,
	isPlayer,
	lightningBurst,
	particle,
	PURPLE,
	RED,
	shake,
	shakeAround,
	sound,
	title,
	vars,
} from "./fx";
import { conquerorPower, gainXp, health, isBossLike, knockOut, maxHealth, trueDamage, willOf } from "./haki";
import { bossClashPower } from "./boss";
import { clamp, V } from "./vec";

/**
 * A Haki Clash: two Conqueror's Haki users collide and the sky splits.
 * Balance runs from -100 (B wins) to +100 (A wins). Players push by mashing Sneak or their Conqueror item.
 */
interface Clash {
	id: number;
	a: Entity;
	b: Entity;
	balance: number;
	age: number;
	maxAge: number;
	awakening: boolean;
	pushA: number;
	pushB: number;
	lastPush: Map<string, number>;
	posA: Vector3;
	posB: Vector3;
	fogged: Set<string>;
	orbit: number;
}

const clashes: Clash[] = [];
let nextId = 1;
const FOG = "grandline:clash_fog";
const FOG_TAG = "grandline_clash";

export function clashOf(e: Entity): Clash | undefined {
	return clashes.find((c) => c.a.id === e.id || c.b.id === e.id);
}

export function isClashing(e: Entity): boolean {
	return !!clashOf(e);
}

function name(e: Entity): string {
	if (isPlayer(e)) return e.name;
	if (e.typeId === BOSS_ID) return BOSS_NAME;
	return e.nameTag || "???";
}

function clashPower(e: Entity, c: Clash): number {
	if (isPlayer(e)) {
		const p = power(e);
		let pw = conquerorPower(p);
		if (c.awakening) pw += 35;
		if (p.saved.haki <= 0) pw -= 20;
		return pw;
	}
	if (e.typeId === BOSS_ID) return bossClashPower(e);
	return willOf(e);
}

function lock(e: Entity, locked: boolean): void {
	if (isPlayer(e)) {
		try {
			e.inputPermissions.setPermissionCategory(InputPermissionCategory.LateralMovement, !locked);
			e.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, !locked);
		} catch {
			// ignore
		}
	} else {
		try {
			e.triggerEvent(locked ? "grandline:clash_start" : "grandline:clash_end");
		} catch {
			// not one of ours
		}
	}
}

/** Side-on cinematic camera for a participant. */
function cinematic(p: Player, c: Clash, ease: number): void {
	const A = c.a.location;
	const B = c.b.location;
	const mid = V.up(V.lerp(A, B, 0.5), 1.2);
	const axis = V.norm(V.flat(V.sub(B, A)));
	const side = V.cross(axis, V.of(0, 1, 0));
	const dist = Math.max(6, V.dist(A, B) * 1.1 + 3);
	const ang = c.orbit;
	// orbit gently around the clash, always keeping both fighters in frame
	const offset = V.add(V.scale(side, Math.cos(ang) * dist), V.scale(axis, Math.sin(ang) * dist * 0.35));
	let cam = V.up(V.add(mid, offset), 1.6 + Math.sin(ang * 0.7) * 0.6);
	try {
		const block = p.dimension.getBlock(cam);
		if (block && !block.isAir) cam = V.up(V.add(mid, V.scale(offset, -1)), 2.2);
	} catch {
		// outside the world or unloaded: keep the first choice
	}
	try {
		p.camera.setCamera("minecraft:free", {
			location: cam,
			facingLocation: mid,
			easeOptions: { easeTime: ease, easeType: ease > 0.9 ? EasingType.Linear : EasingType.OutCubic },
		});
	} catch {
		// ignore
	}
}

export function startClash(a: Entity, b: Entity, awakening: boolean): void {
	if (!a.isValid || !b.isValid || a.id === b.id) return;
	if (clashOf(a) || clashOf(b)) return;
	if (a.dimension.id !== b.dimension.id) return;
	const c: Clash = {
		id: nextId++,
		a,
		b,
		balance: 0,
		age: 0,
		maxAge: 200,
		awakening,
		pushA: 0,
		pushB: 0,
		lastPush: new Map(),
		posA: a.location,
		posB: b.location,
		fogged: new Set(),
		orbit: 0,
	};
	clashes.push(c);
	lock(a, true);
	lock(b, true);
	try {
		a.teleport(a.location, { facingLocation: chest(b) });
		b.teleport(b.location, { facingLocation: chest(a) });
	} catch {
		// ignore
	}
	const mid = V.lerp(chest(a), chest(b), 0.5);
	const dim = a.dimension;
	for (const pl of dim.getPlayers({ location: mid, maxDistance: 64 })) {
		try {
			pl.runCommand(`fog @s push ${FOG} ${FOG_TAG}`);
			c.fogged.add(pl.id);
		} catch {
			// ignore
		}
		flash(pl, BLACK, 0.05, 0.25, 0.6);
		shake(pl, 1.2, 1.2);
	}
	for (const e of [a, b]) {
		if (isPlayer(e)) {
			const other = e.id === a.id ? b : a;
			title(e, "§4§l覇王色 §r§c§lCLASH!", `§7Your will against §c${name(other)}§7 — §eMASH SNEAK!`, 40, 2, 10);
			cinematic(e, c, 0.8);
			try {
				e.playAnimation("animation.grandline.player.clash", { blendOutTime: 0.3, controller: "grandline_pose" });
			} catch {
				// ignore
			}
		} else {
			try {
				e.playAnimation("animation.grandline.captain.clash", { blendOutTime: 0.3 });
			} catch {
				// ignore
			}
		}
	}
	sound(dim, "mob.warden.sonic_boom", mid, 4, 0.5);
	sound(dim, "ambient.weather.thunder", mid, 4, 0.6);
	sound(dim, "mob.enderdragon.growl", mid, 1, 0.5);
	particle(dim, "grandline:haoshoku_wave_boss", mid, vars(undefined, { radius: 14 }));
	lightningBurst(dim, mid, 6, 12);
}

export function pushClash(player: Player): void {
	const c = clashOf(player);
	if (!c) return;
	const now = system.currentTick;
	if (now - (c.lastPush.get(player.id) ?? -10) < 2) return;
	c.lastPush.set(player.id, now);
	const pw = clashPower(player, c);
	const p = power(player);
	let amount = 3 + pw * 0.02;
	if (p.saved.haki <= 0) amount *= 0.5;
	if (player.id === c.a.id) c.pushA += amount;
	else c.pushB += amount;
	const mine = player.id === c.a.id ? c.a : c.b;
	particle(mine.dimension, "grandline:conqueror_spark", chest(mine));
}

function clashPoint(c: Clash): Vector3 {
	const t = 0.5 + (c.balance / 100) * 0.38;
	return V.lerp(chest(c.a), chest(c.b), t);
}

function bar(myBalance: number): string {
	const n = 24;
	const marker = Math.round(clamp(n / 2 + (myBalance / 100) * (n / 2), 0, n));
	let s = `§r${G.capL}`;
	for (let i = 0; i < n; i++) {
		if (i === marker) s += G.clashCore;
		s += i < marker ? G.clashMine : G.clashEnemy;
	}
	if (marker >= n) s += G.clashCore;
	return s + G.capR;
}

function tickClash(c: Clash): boolean {
	const { a, b } = c;
	if (!a.isValid || !b.isValid || health(a) <= 0 || health(b) <= 0 || a.dimension.id !== b.dimension.id || V.dist(a.location, b.location) > 24) {
		endClash(c, undefined);
		return false;
	}
	c.age++;
	const dim = a.dimension;

	// hold both fighters in place
	if (c.age % 5 === 0) {
		for (const [e, home, other] of [
			[a, c.posA, b],
			[b, c.posB, a],
		] as [Entity, Vector3, Entity][]) {
			if (V.dist(e.location, home) > 0.6 || !isPlayer(e)) {
				try {
					e.teleport(home, { facingLocation: chest(other) });
				} catch {
					// ignore
				}
			}
		}
	}

	// the struggle
	const pa = clashPower(a, c);
	const pb = clashPower(b, c);
	let autoA = 0;
	let autoB = 0;
	if (!isPlayer(a)) autoA = autoPush(a);
	if (!isPlayer(b)) autoB = autoPush(b);
	const drift = (pa - pb) * 0.004;
	const speed = 1 + c.age / 120;
	c.balance += (drift + c.pushA - c.pushB + autoA - autoB) * speed;
	c.pushA = 0;
	c.pushB = 0;
	for (const e of [a, b]) {
		if (isPlayer(e)) {
			const p = power(e);
			p.saved.haki = Math.max(0, p.saved.haki - 0.25);
		}
	}

	// --- spectacle ---
	const P = clashPoint(c);
	if (c.age % 2 === 0) {
		bolt(dim, chest(a), P, { width: 0.22, branches: 2, jitter: 0.16 });
		bolt(dim, chest(b), P, { width: 0.22, branches: 2, jitter: 0.16 });
		particle(dim, "grandline:clash_core", P);
		for (let i = 0; i < 2; i++) {
			const dir = V.norm(V.add(V.randUnit(), V.of(0, 0.3, 0)));
			bolt(dim, P, V.add(P, V.scale(dir, 2 + Math.random() * 3)), { width: 0.14, branches: 1 });
		}
	}
	if (c.age % 6 === 0) {
		const top = V.add(P, V.of((Math.random() - 0.5) * 16, 22 + Math.random() * 14, (Math.random() - 0.5) * 16));
		bolt(dim, P, top, { width: 0.32, segments: 14, branches: 3, jitter: 0.09, life: 0.3 });
	}
	if (c.age % 3 === 0) {
		particle(dim, "grandline:haki_aura", a.location, vars(CRIMSON, { scale: 1.3 }));
		particle(dim, "grandline:haki_aura", b.location, vars(isPlayer(b) ? CRIMSON : BLACK, { scale: 1.3 }));
	}
	if (c.age % 10 === 0) {
		particle(dim, "grandline:shockwave_ring", V.up(V.of(P.x, Math.min(a.location.y, b.location.y), P.z), 0.15), vars(CRIMSON, { radius: 9 }));
		sound(dim, "ambient.weather.lightning.impact", P, 2, 0.7 + Math.random() * 0.5);
		shakeAround(dim, P, 30, 0.5, 0.6);
		bystanders(c, P);
	}
	if (c.age % 20 === 0) {
		sound(dim, "mob.warden.heartbeat", P, 3, 0.8);
		particle(dim, "grandline:haoshoku_wave", P, vars(undefined, { radius: 6 }));
	}
	if (c.age % 20 === 10) c.orbit += 0.5;

	// --- HUD for the fighters ---
	if (c.age % 2 === 0) {
		for (const e of [a, b]) {
			if (!isPlayer(e)) continue;
			const mine = e.id === a.id ? c.balance : -c.balance;
			const other = e.id === a.id ? b : a;
			const secs = Math.max(0, Math.ceil((c.maxAge - c.age) / 20));
			try {
				e.onScreenDisplay.setTitle(bar(mine), {
					fadeInDuration: 0,
					stayDuration: 6,
					fadeOutDuration: 2,
					subtitle: `§c${e.name} §f${secs}s §5${name(other)}`,
				});
				e.onScreenDisplay.setActionBar(c.age % 8 < 4 ? "§e§l>> MASH SNEAK / USE CONQUEROR'S HAKI <<" : "§6§l>> MASH SNEAK / USE CONQUEROR'S HAKI <<");
			} catch {
				// ignore
			}
			if (c.age % 20 === 10) cinematic(e, c, 1.0);
		}
	}

	if (Math.abs(c.balance) >= 100 || c.age >= c.maxAge) {
		if (Math.abs(c.balance) < 5) endClash(c, undefined);
		else endClash(c, c.balance > 0 ? a : b);
		return false;
	}
	return true;
}

/** Mobs push on their own, with the occasional surge of will. */
function autoPush(e: Entity): number {
	let base = e.typeId === BOSS_ID ? bossClashPower(e) / 72 : 1.0;
	base *= 0.6 + Math.random() * 0.8;
	if (Math.random() < 0.03) {
		base += 10;
		for (const p of e.dimension.getPlayers({ location: e.location, maxDistance: 24 })) {
			p.sendMessage(`§4${BOSS_NAME}§r: §c${["KNEEL!", "Is that all?!", "Your will is NOTHING!", "Bow before a king!"][Math.floor(Math.random() * 4)]}`);
		}
		particle(e.dimension, "grandline:haoshoku_wave", chest(e), vars(undefined, { radius: 4 }));
	}
	return base;
}

/** Conqueror's Haki clashing is enough to knock out the weak-willed around it. */
function bystanders(c: Clash, P: Vector3): void {
	for (const e of c.a.dimension.getEntities({ location: P, maxDistance: 10, excludeFamilies: ["inanimate"] })) {
		if (e.id === c.a.id || e.id === c.b.id || !e.getComponent("minecraft:health")) continue;
		if (isPlayer(e)) {
			const gm = e.getGameMode();
			if (gm === GameMode.Creative || gm === GameMode.Spectator) continue;
			if (!power(e).has(Haki.Conqueror)) {
				e.addEffect("nausea", 80, { amplifier: 0, showParticles: false });
				e.addEffect("slowness", 40, { amplifier: 1, showParticles: false });
			}
		} else if (!isBossLike(e) && willOf(e) < 30) {
			knockOut(e, 100);
		}
		const away = V.norm(V.flat(V.sub(e.location, P)));
		try {
			e.applyKnockback({ x: away.x * 0.8, z: away.z * 0.8 }, 0.25);
		} catch {
			// ignore
		}
	}
}

function endClash(c: Clash, winner: Entity | undefined): void {
	const i = clashes.indexOf(c);
	if (i >= 0) clashes.splice(i, 1);
	const { a, b } = c;
	const dim = a.isValid ? a.dimension : b.dimension;
	const P = a.isValid && b.isValid ? clashPoint(c) : a.isValid ? a.location : b.location;
	for (const e of [a, b]) if (e.isValid) lock(e, false);

	// clear fog for everyone we fogged
	for (const pl of dim.getPlayers()) {
		if (c.fogged.has(pl.id)) {
			try {
				pl.runCommand(`fog @s remove ${FOG_TAG}`);
			} catch {
				// ignore
			}
		}
	}

	particle(dim, "grandline:haoshoku_wave_boss", P, vars(undefined, { radius: 18 }));
	particle(dim, "grandline:clash_finale", P);
	lightningBurst(dim, P, 8, 16);
	sound(dim, "mob.warden.sonic_boom", P, 5, 0.45);
	sound(dim, "random.explode", P, 3, 0.6);
	sound(dim, "ambient.weather.thunder", P, 4, 0.5);
	shakeAround(dim, P, 40, 1.6, 1.4);

	const loser = winner ? (winner.id === a.id ? b : a) : undefined;
	for (const e of [a, b]) {
		if (!e.isValid || !isPlayer(e)) continue;
		try {
			e.onScreenDisplay.setActionBar("");
		} catch {
			// ignore
		}
		if (!winner) {
			flash(e, BLACK, 0.05, 0.2, 0.6);
			title(e, "§7§lSTALEMATE", "§8Neither will gave way...", 40);
		} else if (e.id === winner.id) {
			flash(e, GOLD, 0.05, 0.15, 0.7);
			title(e, "§c§l覇王", "§6Your will prevails!", 50);
			const vsBoss = loser?.typeId === BOSS_ID;
			gainXp(e, Haki.Conqueror, vsBoss ? 120 : 60);
			if (c.awakening) e.sendMessage("§6✦ You overpowered a king's will with a newly awakened Conqueror's Haki!");
		} else {
			flash(e, CRIMSON, 0.05, 0.3, 0.8);
			title(e, "§8§lDEFEATED", "§7Your will faltered...", 50);
			gainXp(e, Haki.Conqueror, 25);
		}
		try {
			e.playAnimation("animation.grandline.player.release", { blendOutTime: 0.2, controller: "grandline_pose" });
		} catch {
			// ignore
		}
		const camPlayer = e;
		system.runTimeout(() => {
			try {
				if (camPlayer.isValid) camPlayer.camera.clear();
			} catch {
				// ignore
			}
		}, 6);
		save(e);
	}

	const knock = (victim: Entity, from: Entity, strength: number) => {
		const away = V.norm(V.flat(V.sub(victim.location, from.location)));
		try {
			victim.applyKnockback({ x: away.x * strength, z: away.z * strength }, 0.55);
		} catch {
			// ignore
		}
	};
	if (winner && loser && loser.isValid) {
		knock(loser, winner, 2.6);
		const winPower = clashPower(winner, c);
		const dmg = loser.typeId === BOSS_ID ? maxHealth(loser) * 0.08 : 4 + winPower * 0.06;
		trueDamage(loser, dmg, winner);
		knockOut(loser, loser.typeId === BOSS_ID ? 80 : 50);
		particle(dim, "grandline:ko_stars", V.up(loser.location, 2.1));
		if (loser.typeId === BOSS_ID) {
			for (const p of dim.getPlayers({ location: loser.location, maxDistance: 32 })) {
				p.sendMessage(`§4${BOSS_NAME}§r: §c...Impossible! My will... §7(He's stunned — strike now!)`);
			}
		}
	} else if (a.isValid && b.isValid) {
		knock(a, b, 1.4);
		knock(b, a, 1.4);
	}
	if (winner?.isValid) bolt(dim, chest(winner), V.up(winner.location, 25), { width: 0.4, segments: 12, branches: 3, color: RED });
	void PURPLE;
}

export function tickClashes(): void {
	for (const c of [...clashes]) tickClash(c);
}

export function clashCount(): number {
	return clashes.length;
}
