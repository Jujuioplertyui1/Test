import { Vector3 } from "@minecraft/server";

/** Small vector helpers (the Script API only ships plain {x,y,z} objects). */
export const V = {
	of(x: number, y: number, z: number): Vector3 {
		return { x, y, z };
	},
	add(a: Vector3, b: Vector3): Vector3 {
		return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
	},
	sub(a: Vector3, b: Vector3): Vector3 {
		return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
	},
	scale(a: Vector3, s: number): Vector3 {
		return { x: a.x * s, y: a.y * s, z: a.z * s };
	},
	len(a: Vector3): number {
		return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
	},
	dist(a: Vector3, b: Vector3): number {
		return V.len(V.sub(a, b));
	},
	norm(a: Vector3): Vector3 {
		const l = V.len(a);
		return l < 1e-6 ? { x: 0, y: 0, z: 0 } : V.scale(a, 1 / l);
	},
	dot(a: Vector3, b: Vector3): number {
		return a.x * b.x + a.y * b.y + a.z * b.z;
	},
	cross(a: Vector3, b: Vector3): Vector3 {
		return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
	},
	lerp(a: Vector3, b: Vector3, t: number): Vector3 {
		return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
	},
	up(a: Vector3, dy: number): Vector3 {
		return { x: a.x, y: a.y + dy, z: a.z };
	},
	flat(a: Vector3): Vector3 {
		return { x: a.x, y: 0, z: a.z };
	},
	/** Any unit vector perpendicular to a. */
	perp(a: Vector3): Vector3 {
		const n = V.norm(a);
		const ref = Math.abs(n.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
		return V.norm(V.cross(n, ref));
	},
	randUnit(): Vector3 {
		const t = Math.random() * Math.PI * 2;
		const u = Math.random() * 2 - 1;
		const s = Math.sqrt(1 - u * u);
		return { x: s * Math.cos(t), y: u, z: s * Math.sin(t) };
	},
	/** Horizontal unit vector at the given yaw (degrees, Minecraft convention). */
	fromYaw(yawDeg: number): Vector3 {
		const r = (yawDeg * Math.PI) / 180;
		return { x: -Math.sin(r), y: 0, z: Math.cos(r) };
	},
};

export function clamp(v: number, lo: number, hi: number): number {
	return v < lo ? lo : v > hi ? hi : v;
}

export function chance(p: number): boolean {
	return Math.random() < p;
}

export function randRange(lo: number, hi: number): number {
	return lo + Math.random() * (hi - lo);
}
