import {
	CommandPermissionLevel,
	CustomCommandOrigin,
	CustomCommandParamType,
	CustomCommandRegistry,
	CustomCommandResult,
	CustomCommandStatus,
	Entity,
	Player,
	system,
} from "@minecraft/server";
import { FRUITS, Haki, HAKI } from "./defs";
import { power, save, totalXpForLevel } from "./data";
import { isPlayer } from "./fx";
import { awaken, giveBound, hakiItemLore, removeItems } from "./haki";
import { eatFruit, removeFruit, syncSkillItems } from "./fruits";
import { summonCaptain } from "./boss";
import { openCodex } from "./menu";

const HAKI_NAMES: Record<string, Haki | "all"> = {
	armament: Haki.Armament,
	observation: Haki.Observation,
	conqueror: Haki.Conqueror,
	all: "all",
};

function ok(message?: string): CustomCommandResult {
	return { status: CustomCommandStatus.Success, message };
}

function fail(message: string): CustomCommandResult {
	return { status: CustomCommandStatus.Failure, message };
}

function targets(origin: CustomCommandOrigin, selected: unknown): Player[] {
	if (Array.isArray(selected)) return (selected as Entity[]).filter(isPlayer);
	const src = origin.sourceEntity ?? origin.initiator;
	return src && isPlayer(src) ? [src] : [];
}

export function setHakiLevel(player: Player, h: Haki, level: number): void {
	const p = power(player);
	if (!p.has(h)) awaken(player, h, "Granted by command.");
	p.saved.xp[h] = totalXpForLevel(Math.max(0, Math.min(100, level)));
	p.dirty = true;
	save(player, p);
}

export function resetPlayer(player: Player): void {
	const p = power(player);
	p.saved.unlocked = [false, false, false];
	p.saved.xp = [0, 0, 0];
	p.saved.armProg = 0;
	p.saved.obsProg = 0;
	p.saved.resisted = 0;
	p.armOn = false;
	p.obsOn = false;
	removeItems(player, (id) => id === HAKI[Haki.Armament].item || id === HAKI[Haki.Observation].item || id === HAKI[Haki.Conqueror].item);
	removeFruit(player);
	save(player, p);
}

export function registerCommands(reg: CustomCommandRegistry): void {
	reg.registerEnum("grandline:haki_action", ["unlock", "level", "reset"]);
	reg.registerEnum("grandline:haki_type", ["armament", "observation", "conqueror", "all"]);
	reg.registerEnum("grandline:fruit_name", [...FRUITS.map((f) => f.key), "none"]);

	reg.registerCommand(
		{
			name: "grandline:haki",
			description: "Unlock, level or reset Haki (testing / admin).",
			permissionLevel: CommandPermissionLevel.GameDirectors,
			cheatsRequired: true,
			mandatoryParameters: [{ name: "grandline:haki_action", type: CustomCommandParamType.Enum }],
			optionalParameters: [
				{ name: "grandline:haki_type", type: CustomCommandParamType.Enum },
				{ name: "level", type: CustomCommandParamType.Integer },
				{ name: "players", type: CustomCommandParamType.PlayerSelector },
			],
		},
		(origin, action: string, type?: string, level?: number, players?: unknown) => {
			const list = targets(origin, players);
			if (list.length === 0) return fail("No target players.");
			const t = HAKI_NAMES[type ?? "all"] ?? "all";
			const kinds = t === "all" ? [Haki.Armament, Haki.Observation, Haki.Conqueror] : [t];
			system.run(() => {
				for (const pl of list) {
					if (action === "reset") resetPlayer(pl);
					else if (action === "unlock") for (const h of kinds) awaken(pl, h, "Granted by command.");
					else for (const h of kinds) setHakiLevel(pl, h, level ?? 50);
				}
			});
			return ok(`Haki ${action} applied to ${list.length} player(s).`);
		},
	);

	reg.registerCommand(
		{
			name: "grandline:fruit",
			description: "Give a player a Devil Fruit power (or 'none' to remove it).",
			permissionLevel: CommandPermissionLevel.GameDirectors,
			cheatsRequired: true,
			mandatoryParameters: [{ name: "grandline:fruit_name", type: CustomCommandParamType.Enum }],
			optionalParameters: [{ name: "players", type: CustomCommandParamType.PlayerSelector }],
		},
		(origin, fruit: string, players?: unknown) => {
			const list = targets(origin, players);
			if (list.length === 0) return fail("No target players.");
			system.run(() => {
				for (const pl of list) {
					removeFruit(pl);
					if (fruit !== "none") eatFruit(pl, fruit);
				}
			});
			return ok(fruit === "none" ? "Devil Fruit removed." : `Granted ${fruit}.`);
		},
	);

	reg.registerCommand(
		{
			name: "grandline:captain",
			description: "Summon Varek, the Crimson King in front of you.",
			permissionLevel: CommandPermissionLevel.GameDirectors,
			cheatsRequired: true,
		},
		(origin) => {
			const src = origin.sourceEntity ?? origin.initiator;
			if (!src || !isPlayer(src)) return fail("Run this as a player.");
			system.run(() => summonCaptain(src));
			return ok();
		},
	);

	reg.registerCommand(
		{
			name: "grandline:codex",
			description: "Open the Haki Codex and restore your Haki and skill items.",
			permissionLevel: CommandPermissionLevel.Any,
		},
		(origin) => {
			const src = origin.sourceEntity ?? origin.initiator;
			if (!src || !isPlayer(src)) return fail("Run this as a player.");
			system.run(() => {
				restoreKit(src);
				openCodex(src);
			});
			return ok();
		},
	);
}

/** Makes sure the player carries the Codex, their Haki items and their fruit's skills. */
export function restoreKit(player: Player): void {
	const p = power(player);
	giveBound(player, "grandline:haki_codex", undefined, ["§7Use: §fopen the Haki Codex", "§8Stats, techniques, Devil Fruit and guide"]);
	for (const h of [Haki.Armament, Haki.Observation, Haki.Conqueror]) if (p.has(h)) giveBound(player, HAKI[h].item, undefined, hakiItemLore(h));
	syncSkillItems(player);
}
