import { Dimension, Entity, MolangVariableMap, Player, RGB, system, Vector3 } from "@minecraft/server";
import { power } from "./data";
import { V } from "./vec";

export const RED: RGB = { red: 1.0, green: 0.08, blue: 0.1 };
export const CRIMSON: RGB = { red: 0.75, green: 0.0, blue: 0.08 };
export const BLACK: RGB = { red: 0.02, green: 0.0, blue: 0.03 };
export const PURPLE: RGB = { red: 0.55, green: 0.25, blue: 1.0 };
export const GOLD: RGB = { red: 1.0, green: 0.8, blue: 0.25 };
export const WHITE: RGB = { red: 1, green: 1, blue: 1 };
export const CYAN: RGB = { red: 0.35, green: 0.85, blue: 1.0 };
export const YELLOW: RGB = { red: 1.0, green: 0.95, blue: 0.4 };

export function vars(color?: RGB, extra?: Record<string, number>): MolangVariableMap {
	const m = new MolangVariableMap();
	if (color) m.setColorRGB("variable.color", color);
	if (extra) for (const k in extra) m.setFloat(`variable.${k}`, extra[k]);
	return m;
}

export function particle(dim: Dimension, id: string, loc: Vector3, m?: MolangVariableMap): void {
	try {
		dim.spawnParticle(id, loc, m);
	} catch {
		// unloaded chunk or invalid location
	}
}

/** Particle visible only to one player (used by Observation Haki). */
export function privateParticle(player: Player, id: string, loc: Vector3, m?: MolangVariableMap): void {
	try {
		player.spawnParticle(id, loc, m);
	} catch {
		// ignore
	}
}

export function sound(dim: Dimension, id: string, loc: Vector3, volume = 1, pitch = 1): void {
	try {
		dim.playSound(id, loc, { volume, pitch });
	} catch {
		// ignore
	}
}

/** A straight glowing segment from a to b (particles are billboards stretched along the direction). */
export function segment(dim: Dimension, a: Vector3, b: Vector3, color: RGB, width: number, core: boolean, life = 0.18): void {
	const d = V.sub(b, a);
	const len = V.len(d);
	if (len < 0.01) return;
	const n = V.scale(d, 1 / len);
	const mid = V.lerp(a, b, 0.5);
	const m = new MolangVariableMap();
	m.setFloat("variable.dx", n.x);
	m.setFloat("variable.dy", n.y);
	m.setFloat("variable.dz", n.z);
	m.setFloat("variable.len", len);
	m.setFloat("variable.width", width);
	m.setFloat("variable.life", life);
	m.setColorRGB("variable.color", color);
	particle(dim, "grandline:bolt_glow", mid, m);
	if (core) {
		const c = new MolangVariableMap();
		c.setFloat("variable.dx", n.x);
		c.setFloat("variable.dy", n.y);
		c.setFloat("variable.dz", n.z);
		c.setFloat("variable.len", len);
		c.setFloat("variable.width", width * 0.42);
		c.setFloat("variable.life", life);
		c.setColorRGB("variable.color", BLACK);
		particle(dim, "grandline:bolt_core", mid, c);
	}
}

export interface BoltOptions {
	color?: RGB;
	/** Draw a black core inside the glow (black lightning). */
	core?: boolean;
	width?: number;
	/** Sideways jitter as a fraction of length. */
	jitter?: number;
	segments?: number;
	branches?: number;
	life?: number;
}

/** Jagged lightning bolt between two points, with optional forks. */
export function bolt(dim: Dimension, from: Vector3, to: Vector3, o: BoltOptions = {}): void {
	const color = o.color ?? RED;
	const width = o.width ?? 0.16;
	const len = V.dist(from, to);
	const segs = o.segments ?? Math.max(3, Math.min(14, Math.round(len * 1.6)));
	const jitter = (o.jitter ?? 0.12) * len;
	const pts: Vector3[] = [from];
	for (let i = 1; i < segs; i++) {
		const t = i / segs;
		const base = V.lerp(from, to, t);
		const fall = Math.sin(t * Math.PI);
		pts.push(V.add(base, V.scale(V.randUnit(), jitter * fall * (0.4 + Math.random() * 0.6))));
	}
	pts.push(to);
	for (let i = 0; i < pts.length - 1; i++) segment(dim, pts[i], pts[i + 1], color, width, o.core ?? true, o.life);
	const branches = o.branches ?? 1;
	for (let b = 0; b < branches; b++) {
		const i = 1 + Math.floor(Math.random() * Math.max(1, pts.length - 2));
		const start = pts[i];
		const dir = V.norm(V.add(V.norm(V.sub(to, from)), V.scale(V.randUnit(), 1.3)));
		const end = V.add(start, V.scale(dir, len * (0.15 + Math.random() * 0.2)));
		const mid = V.add(V.lerp(start, end, 0.5), V.scale(V.randUnit(), len * 0.05));
		segment(dim, start, mid, color, width * 0.6, o.core ?? true, o.life);
		segment(dim, mid, end, color, width * 0.45, o.core ?? true, o.life);
	}
}

/** Crackling black-and-red lightning bursting out of a point in every direction. */
export function lightningBurst(dim: Dimension, center: Vector3, radius: number, count: number, color: RGB = RED): void {
	for (let i = 0; i < count; i++) {
		const dir = V.randUnit();
		const r = radius * (0.5 + Math.random() * 0.5);
		bolt(dim, center, V.add(center, V.scale(dir, r)), { color, width: 0.12 + radius * 0.01, branches: 1, jitter: 0.18 });
	}
}

export function shake(player: Player, intensity: number, seconds: number): void {
	try {
		player.runCommand(`camerashake add @s ${Math.min(4, intensity).toFixed(2)} ${seconds.toFixed(2)} rotational`);
	} catch {
		// ignore
	}
}

export function shakeAround(dim: Dimension, center: Vector3, radius: number, intensity: number, seconds: number): void {
	for (const p of dim.getPlayers({ location: center, maxDistance: radius })) {
		const falloff = 1 - V.dist(p.location, center) / radius;
		if (falloff > 0.05) shake(p, intensity * falloff, seconds);
	}
}

export function flash(player: Player, color: RGB, fadeIn = 0.05, hold = 0.1, fadeOut = 0.5): void {
	try {
		player.camera.fade({ fadeColor: color, fadeTime: { fadeInTime: fadeIn, holdTime: hold, fadeOutTime: fadeOut } });
	} catch {
		// ignore
	}
}

/** Shows a short message in place of the HUD line for a while. */
export function notice(player: Player, text: string, ticks = 50): void {
	const p = power(player);
	p.notice = { text, until: system.currentTick + ticks };
	try {
		player.onScreenDisplay.setActionBar(text);
	} catch {
		// ignore
	}
}

export function title(player: Player, main: string, sub: string, stay = 50, fadeIn = 5, fadeOut = 15): void {
	try {
		player.onScreenDisplay.setTitle(main, { fadeInDuration: fadeIn, stayDuration: stay, fadeOutDuration: fadeOut, subtitle: sub });
	} catch {
		// ignore
	}
}

export function chest(e: Entity): Vector3 {
	return V.up(e.location, isPlayer(e) ? 1.2 : 1.1);
}

export function isPlayer(e: Entity): e is Player {
	return e.typeId === "minecraft:player";
}

/** Tag used for black-lightning aura particles around an entity. */
export function aura(e: Entity, color: RGB = CRIMSON, scale = 1): void {
	particle(e.dimension, "grandline:haki_aura", e.location, vars(color, { scale }));
}
