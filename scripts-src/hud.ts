import { Entity, Player, system } from "@minecraft/server";
import { BOSS_ID, G, Haki, PIRATE_ID } from "./defs";
import { power, Power } from "./data";
import { chest, particle, privateParticle, vars } from "./fx";
import { clashOf } from "./clash";
import { V } from "./vec";

function bar(value: number, max: number, full: string, half: string, empty: string, n = 10): string {
	const f = Math.max(0, Math.min(1, value / Math.max(1, max))) * n;
	let s = "";
	for (let i = 0; i < n; i++) {
		if (f >= i + 1) s += full;
		else if (f >= i + 0.5) s += half;
		else s += empty;
	}
	return s;
}

const ARROWS = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];

function arrowTo(player: Player, target: Entity): string {
	const view = V.norm(V.flat(player.getViewDirection()));
	const to = V.norm(V.flat(V.sub(target.location, player.location)));
	const viewAng = Math.atan2(view.x, view.z);
	const toAng = Math.atan2(to.x, to.z);
	let rel = ((viewAng - toAng) * 180) / Math.PI;
	rel = ((rel % 360) + 360) % 360;
	return ARROWS[Math.round(rel / 45) % 8];
}

function prettyName(e: Entity): string {
	if (e.typeId === BOSS_ID) return "Crimson King";
	if (e.typeId === PIRATE_ID) return "Pirate";
	if (e.nameTag) return e.nameTag;
	const id = e.typeId.replace(/^[^:]+:/, "").replace(/_/g, " ");
	return id.charAt(0).toUpperCase() + id.slice(1);
}

/** Observation Haki: sense presence, mark it privately and summarise it on the HUD. */
function sense(player: Player, p: Power): string {
	const lvl = p.level(Haki.Observation);
	const radius = 16 + lvl * 0.32;
	const all = player.dimension.getEntities({ location: player.location, maxDistance: radius, excludeFamilies: ["inanimate"], excludeTypes: ["minecraft:item", "minecraft:xp_orb"] });
	let hostile = 0;
	let other = 0;
	let nearest: Entity | undefined;
	let nd = Infinity;
	let marked = 0;
	const mark = system.currentTick % 10 === 0;
	for (const e of all) {
		if (e.id === player.id || !e.getComponent("minecraft:health")) continue;
		let isHostile = false;
		try {
			isHostile = e.matches({ families: ["monster"] }) || e.typeId === BOSS_ID || e.typeId === PIRATE_ID;
		} catch {
			isHostile = false;
		}
		if (isHostile) hostile++;
		else other++;
		const d = V.dist(e.location, player.location);
		if (isHostile && d < nd) {
			nd = d;
			nearest = e;
		}
		if (mark && marked < 16) {
			marked++;
			const color = isHostile ? { red: 1, green: 0.2, blue: 0.2 } : e.typeId === "minecraft:player" ? { red: 1, green: 0.85, blue: 0.3 } : { red: 0.35, green: 1, blue: 0.5 };
			privateParticle(player, "grandline:sense_marker", V.up(e.location, (e.getHeadLocation().y - e.location.y) + 0.8), vars(color));
		}
	}
	let s = `§b◉ §c${hostile}§7 hostile §a${other}§7 other`;
	if (nearest) s += ` §8| §c${prettyName(nearest)} §f${Math.round(nd)}m ${arrowTo(player, nearest)}`;
	return s;
}

export function hudTick(player: Player): void {
	const p = power(player);
	const now = system.currentTick;

	// Armament coating shimmer around the fists.
	if (p.armOn && now % 3 === 0) {
		const dir = V.norm(V.flat(player.getViewDirection()));
		const right = V.perp(dir);
		const base = V.up(player.location, 0.95);
		for (const side of [-1, 1]) {
			const hand = V.add(V.add(base, V.scale(right, 0.38 * side)), V.scale(dir, 0.2));
			particle(player.dimension, "grandline:armament_coat", hand);
		}
		if (p.hasTech("infusion") && now % 9 === 0) particle(player.dimension, "grandline:conqueror_spark", chest(player));
	}

	let senseLine = "";
	if (p.obsOn && (now % 4 === 0 || now % 10 === 0)) senseLine = sense(player, p);
	if (now % 4 !== 0) return;
	if (clashOf(player)) return;
	if (p.notice && p.notice.until > now) return;
	p.notice = undefined;

	const icon = (h: Haki, on: boolean, offG: string, onG: string) => (!p.has(h) ? G.locked : on ? onG : offG);
	const lvl = (h: Haki, c: string) => (p.has(h) ? `${c}${p.level(h)}` : "§8--");
	const conqReady = p.has(Haki.Conqueror) && p.conqCd <= 0;
	let line =
		`${icon(Haki.Armament, p.armOn, G.armOff, G.armOn)}${lvl(Haki.Armament, p.armOn ? "§d" : "§7")} ` +
		`${icon(Haki.Observation, p.obsOn, G.obsOff, G.obsOn)}${lvl(Haki.Observation, p.obsOn ? "§b" : "§7")} ` +
		`${icon(Haki.Conqueror, conqReady, G.conqOff, G.conqOn)}${lvl(Haki.Conqueror, conqReady ? "§c" : "§7")}` +
		(p.has(Haki.Conqueror) && p.conqCd > 0 ? `§8(${Math.ceil(p.conqCd / 20)}s)` : "") +
		`  ${G.haki}${bar(p.saved.haki, p.maxHaki(), G.hakiFull, G.hakiHalf, G.hakiEmpty)}`;
	const f = p.fruit();
	if (f) line += ` ${G.stamina}${bar(p.saved.stamina, p.maxStamina(), G.staFull, G.staHalf, G.staEmpty)}`;
	let second = "";
	if (f) second = `${f.color}${f.name} §7Lv ${p.fruitLevel()}${player.hasTag("gl_seastone") ? " §3[SEALED]" : player.isInWater ? " §9[SINKING]" : ""}`;
	if (senseLine) second = second ? `${second}  ${senseLine}` : senseLine;
	try {
		player.onScreenDisplay.setActionBar(second ? `${line}\n${second}` : line);
	} catch {
		// ignore
	}
}
