import { ItemComponentRegistry, ItemStack, Player, PlayerBreakBlockAfterEvent, system } from "@minecraft/server";
import { FRUITS, Haki, PIRATE_ID } from "./defs";
import { chest, isPlayer, notice, particle, sound, vars, GOLD } from "./fx";
import { toggleArmament, toggleObservation, useConqueror } from "./haki";
import { eatFruit, seal, useSkill } from "./fruits";
import { openCodex } from "./menu";
import { summonCaptain } from "./boss";
import { V } from "./vec";

function param(p: unknown, key: string): string | number | undefined {
	if (p && typeof p === "object" && key in p) {
		const v = (p as Record<string, unknown>)[key];
		if (typeof v === "string" || typeof v === "number") return v;
	}
	return undefined;
}

/** Removes one of the item the player is holding. */
function consumeHeld(player: Player): void {
	const inv = player.getComponent("minecraft:inventory")?.container;
	if (!inv) return;
	const slot = player.selectedSlotIndex;
	const it = inv.getItem(slot);
	if (!it) return;
	if (player.getGameMode() === "Creative") return;
	if (it.amount <= 1) inv.setItem(slot, undefined);
	else {
		it.amount -= 1;
		inv.setItem(slot, it);
	}
}

function give(player: Player, stack: ItemStack): void {
	const inv = player.getComponent("minecraft:inventory")?.container;
	const left = inv?.addItem(stack);
	if (left) player.dimension.spawnItem(left, player.location);
}

interface Loot {
	id: string;
	chance: number;
	min: number;
	max: number;
}

const TREASURE: Loot[] = [
	{ id: "minecraft:gold_ingot", chance: 1, min: 2, max: 6 },
	{ id: "minecraft:emerald", chance: 0.6, min: 1, max: 4 },
	{ id: "minecraft:iron_ingot", chance: 0.5, min: 3, max: 8 },
	{ id: "minecraft:diamond", chance: 0.25, min: 1, max: 2 },
	{ id: "grandline:seastone_ingot", chance: 0.2, min: 1, max: 2 },
	{ id: "minecraft:golden_apple", chance: 0.12, min: 1, max: 1 },
	{ id: "minecraft:nautilus_shell", chance: 0.15, min: 1, max: 1 },
];

function openTreasure(player: Player): void {
	consumeHeld(player);
	const got: string[] = [];
	for (const l of TREASURE) {
		if (Math.random() >= l.chance) continue;
		const n = l.min + Math.floor(Math.random() * (l.max - l.min + 1));
		give(player, new ItemStack(l.id, n));
		got.push(`§f${n}x §7${l.id.replace(/^[^:]+:/, "").replace(/_/g, " ")}`);
	}
	if (Math.random() < 0.08) {
		const f = FRUITS[Math.floor(Math.random() * FRUITS.length)];
		give(player, new ItemStack(f.item, 1));
		got.push(`${f.color}§l${f.name}!!`);
		sound(player.dimension, "random.totem", player.location, 0.7, 1.2);
		player.onScreenDisplay.setTitle("§6§lDEVIL FRUIT!", { fadeInDuration: 3, stayDuration: 40, fadeOutDuration: 10, subtitle: `${f.color}${f.name}` });
	}
	particle(player.dimension, "grandline:treasure_burst", V.up(player.location, 1), vars(GOLD));
	sound(player.dimension, "random.chestopen", player.location, 1, 1);
	sound(player.dimension, "random.orb", player.location, 1, 0.8);
	player.sendMessage(`§6✦ Treasure! ${got.join("§8, ")}`);
}

export function registerItemComponents(registry: ItemComponentRegistry): void {
	registry.registerCustomComponent("grandline:haki", {
		onUse(ev, p) {
			const type = param(p.params, "type");
			const player = ev.source;
			system.run(() => {
				if (type === "armament") toggleArmament(player);
				else if (type === "observation") toggleObservation(player);
				else useConqueror(player);
			});
		},
	});
	registry.registerCustomComponent("grandline:skill", {
		onUse(ev, p) {
			const fruit = String(param(p.params, "fruit") ?? "");
			const slot = Number(param(p.params, "slot") ?? 1) - 1;
			const player = ev.source;
			system.run(() => useSkill(player, fruit, slot));
		},
	});
	registry.registerCustomComponent("grandline:devil_fruit", {
		onConsume(ev, p) {
			const fruit = String(param(p.params, "fruit") ?? "");
			const src = ev.source;
			if (isPlayer(src)) system.run(() => eatFruit(src, fruit));
		},
	});
	registry.registerCustomComponent("grandline:codex", {
		onUse(ev) {
			const player = ev.source;
			system.run(() => openCodex(player));
		},
	});
	registry.registerCustomComponent("grandline:treasure", {
		onUse(ev) {
			const player = ev.source;
			system.run(() => openTreasure(player));
		},
	});
	registry.registerCustomComponent("grandline:jolly_roger", {
		onUse(ev) {
			const player = ev.source;
			system.run(() => {
				if (summonCaptain(player)) consumeHeld(player);
			});
		},
	});
	registry.registerCustomComponent("grandline:seastone_weapon", {
		onHitEntity(ev) {
			const target = ev.hitEntity;
			system.run(() => {
				if (target.isValid) seal(target, 100);
			});
		},
	});
}

/** Seastone cuffs: right-click someone to seal their Devil Fruit for 30 seconds. */
export function onInteractEntity(player: Player, target: import("@minecraft/server").Entity, item: ItemStack | undefined): void {
	if (item?.typeId !== "grandline:seastone_cuffs") return;
	if (!target.getComponent("minecraft:health")) return;
	seal(target, 600);
	if (target.typeId === PIRATE_ID && target.hasTag("gl_logia")) {
		target.removeTag("gl_logia");
		system.runTimeout(() => {
			if (target.isValid) target.addTag("gl_logia");
		}, 600);
	}
	consumeHeld(player);
	sound(player.dimension, "random.anvil_use", target.location, 0.6, 1.4);
	notice(player, "§3Seastone cuffs locked on! §7Their Devil Fruit is sealed for 30s.");
	particle(player.dimension, "grandline:seastone_drain", chest(target));
}

const DIGGABLE = new Set(["minecraft:sand", "minecraft:red_sand", "minecraft:gravel", "minecraft:clay", "minecraft:suspicious_sand", "minecraft:mud"]);

/** Rell Seas-style buried treasure: dig on beaches with a shovel. */
export function onBreakBlock(ev: PlayerBreakBlockAfterEvent): void {
	const id = ev.brokenBlockPermutation.type.id;
	if (!DIGGABLE.has(id)) return;
	const tool = ev.itemStackBeforeBreak?.typeId ?? "";
	if (!tool.endsWith("_shovel")) return;
	let beach = false;
	try {
		const biome = ev.dimension.getBiome(ev.block.location).id;
		beach = biome.includes("beach") || biome.includes("ocean") || biome.includes("shore");
	} catch {
		beach = false;
	}
	const chanceOf = beach ? 1 / 60 : 1 / 400;
	if (Math.random() >= chanceOf) return;
	const at = V.add(ev.block.location, V.of(0.5, 0.6, 0.5));
	ev.dimension.spawnItem(new ItemStack("grandline:treasure_chest", 1), at);
	particle(ev.dimension, "grandline:treasure_burst", at, vars(GOLD));
	sound(ev.dimension, "random.orb", at, 1, 0.6);
	notice(ev.player, "§6✦ You dug up a buried treasure chest!", 50);
	void Haki;
}
