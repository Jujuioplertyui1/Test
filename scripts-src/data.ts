import { Player } from "@minecraft/server";
import { FruitInfo, fruitByKey, Haki, TECHNIQUES, TechniqueInfo } from "./defs";

export const MAX_LEVEL = 100;
/** Melee damage dealt needed to awaken Armament Haki. */
export const ARMAMENT_AWAKEN = 250;
/** Hits taken from enemies needed to awaken Observation Haki. */
export const OBSERVATION_AWAKEN = 40;

/** Persistent part, saved as JSON in a player dynamic property. */
export interface SavedPower {
	unlocked: boolean[];
	xp: number[];
	armProg: number;
	obsProg: number;
	resisted: number;
	fruit: string;
	fruitXp: number;
	haki: number;
	stamina: number;
	welcomed: boolean;
	bossKills: number;
}

export class Power {
	saved: SavedPower;
	// runtime
	armOn = false;
	obsOn = false;
	moveCd = [0, 0, 0];
	conqCd = 0;
	conqCdMax = 1;
	futureSightCd = 0;
	counterTicks = 0;
	khanCd = 0;
	gear2 = 0;
	clashMeleeCd = 0;
	lastHitBy: { id: string; tick: number } | undefined;
	notice: { text: string; until: number } | undefined;
	hintCd = 0;
	dirty = false;
	wasInWater = false;

	constructor(saved?: Partial<SavedPower>) {
		this.saved = {
			unlocked: [false, false, false],
			xp: [0, 0, 0],
			armProg: 0,
			obsProg: 0,
			resisted: 0,
			fruit: "",
			fruitXp: 0,
			haki: 100,
			stamina: 100,
			welcomed: false,
			bossKills: 0,
			...(saved ?? {}),
		};
	}

	has(h: Haki): boolean {
		return this.saved.unlocked[h];
	}

	level(h: Haki): number {
		return levelForXp(this.saved.xp[h]);
	}

	hasTech(id: string): boolean {
		const t = TECHNIQUES.find((x) => x.id === id);
		return !!t && this.has(t.haki) && this.level(t.haki) >= t.level;
	}

	fruit(): FruitInfo | undefined {
		return fruitByKey(this.saved.fruit);
	}

	fruitLevel(): number {
		return levelForXp(this.saved.fruitXp);
	}

	maxHaki(): number {
		let total = 0;
		for (const h of [Haki.Armament, Haki.Observation, Haki.Conqueror]) if (this.has(h)) total += this.level(h);
		return 100 + total * 0.8;
	}

	maxStamina(): number {
		return 100 + this.fruitLevel();
	}

	/** Adds Haki mastery. Returns the new level if the player levelled up. */
	addXp(h: Haki, amount: number): number | undefined {
		if (!this.has(h)) return undefined;
		const before = this.level(h);
		this.saved.xp[h] = Math.min(this.saved.xp[h] + Math.round(amount), totalXpForLevel(MAX_LEVEL));
		this.dirty = true;
		const after = this.level(h);
		return after > before ? after : undefined;
	}

	addFruitXp(amount: number): number | undefined {
		if (!this.fruit()) return undefined;
		const before = this.fruitLevel();
		this.saved.fruitXp = Math.min(this.saved.fruitXp + Math.round(amount), totalXpForLevel(MAX_LEVEL));
		this.dirty = true;
		const after = this.fruitLevel();
		return after > before ? after : undefined;
	}

	/** Techniques that were unlocked exactly at this level. */
	static techniquesAt(h: Haki, level: number): TechniqueInfo[] {
		return TECHNIQUES.filter((t) => t.haki === h && t.level === level);
	}
}

export function costForLevel(level: number): number {
	return 10 + level * 3;
}

export function totalXpForLevel(level: number): number {
	let total = 0;
	for (let l = 0; l < level; l++) total += costForLevel(l);
	return total;
}

export function levelForXp(xp: number): number {
	let level = 0;
	while (level < MAX_LEVEL && xp >= costForLevel(level)) {
		xp -= costForLevel(level);
		level++;
	}
	return level;
}

export function levelProgress(xp: number): number {
	const level = levelForXp(xp);
	if (level >= MAX_LEVEL) return 1;
	return (xp - totalXpForLevel(level)) / costForLevel(level);
}

const KEY = "grandline:power";
const cache = new Map<string, Power>();

export function power(player: Player): Power {
	let p = cache.get(player.id);
	if (!p) {
		let saved: Partial<SavedPower> | undefined;
		try {
			const raw = player.getDynamicProperty(KEY);
			if (typeof raw === "string") saved = JSON.parse(raw) as Partial<SavedPower>;
		} catch {
			saved = undefined;
		}
		p = new Power(saved);
		cache.set(player.id, p);
	}
	return p;
}

export function save(player: Player, p: Power = power(player)): void {
	try {
		player.setDynamicProperty(KEY, JSON.stringify(p.saved));
		p.dirty = false;
	} catch {
		// player may have left
	}
}

export function forget(playerId: string): void {
	cache.delete(playerId);
}
