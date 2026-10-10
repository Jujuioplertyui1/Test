import { Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { FRUITS, Haki, HAKI, TECHNIQUES } from "./defs";
import { ARMAMENT_AWAKEN, levelProgress, OBSERVATION_AWAKEN, power } from "./data";
import { toggleArmament, toggleObservation } from "./haki";

const ICON_FRUIT = "textures/grandline/items/";

function progressBar(frac: number, n = 20, on = "§a", off = "§8"): string {
	const k = Math.round(Math.max(0, Math.min(1, frac)) * n);
	return `${on}${"|".repeat(k)}${off}${"|".repeat(n - k)}`;
}

/** The Haki Codex: stats, techniques (Rell Seas-style cards) and your Devil Fruit. */
export function openCodex(player: Player): void {
	const p = power(player);
	const f = p.fruit();
	const status = (h: Haki) => (p.has(h) ? `§aLv ${p.level(h)}` : "§8Dormant");
	const form = new ActionFormData()
		.title("§l§4覇気 §0Haki Codex")
		.body(
			`§7Pirate §f${player.name}\n` +
				`§5Haki §f${Math.floor(p.saved.haki)}§7/${Math.floor(p.maxHaki())}   §eStamina §f${Math.floor(p.saved.stamina)}§7/${Math.floor(p.maxStamina())}\n` +
				`§7Crimson Kings defeated: §c${p.saved.bossKills}`,
		)
		.button(`§5Armament Haki §r${status(Haki.Armament)}`, HAKI[Haki.Armament].icon)
		.button(`§3Observation Haki §r${status(Haki.Observation)}`, HAKI[Haki.Observation].icon)
		.button(`§4Conqueror's Haki §r${status(Haki.Conqueror)}`, HAKI[Haki.Conqueror].icon)
		.button(f ? `§0Devil Fruit: ${f.color}${f.name}` : "§0Devil Fruit: §8none", f ? `${ICON_FRUIT}${f.item.replace("grandline:", "")}` : "textures/grandline/items/gomu_gomu_no_mi")
		.button("§0How to play", "textures/grandline/ui/guide");
	form.show(player).then((res) => {
		if (res.canceled || res.selection === undefined) return;
		if (res.selection <= 2) openHaki(player, res.selection as Haki);
		else if (res.selection === 3) openFruit(player);
		else openGuide(player);
	});
}

function openHaki(player: Player, h: Haki): void {
	const p = power(player);
	const info = HAKI[h];
	let body = `${info.color}§l${info.kanji}  ${info.name}§r\n`;
	if (p.has(h)) {
		body += `§7Mastery §f${p.level(h)}§7/100  ${progressBar(levelProgress(p.saved.xp[h]))}\n\n`;
	} else {
		const how =
			h === Haki.Armament
				? `Deal melee damage to awaken it (bare fists count double): §f${Math.floor(p.saved.armProg)}/${ARMAMENT_AWAKEN}`
				: h === Haki.Observation
					? `Survive hits from enemies to awaken it: §f${p.saved.obsProg}/${OBSERVATION_AWAKEN}`
					: "Only one in millions has it. Defeat §cVarek, the Crimson King§7 — or stand firm against his Conqueror's Haki once your Armament and Observation are strong (combined mastery 30+).";
		body += `§8Dormant.\n§7${how}\n\n`;
	}
	for (const t of TECHNIQUES.filter((x) => x.haki === h)) {
		const unlocked = p.has(h) && p.level(h) >= t.level;
		body += `${unlocked ? "§a[✔]" : `§8[Lv ${t.level}]`} ${unlocked ? info.color : "§7"}§l${t.name}§r §8${t.kanji}${t.card ? ` · ${t.card}` : ""}\n§7${t.desc}\n\n`;
	}
	const form = new ActionFormData().title(`${info.color}§l${info.name}`).body(body);
	const toggleable = p.has(h) && h !== Haki.Conqueror;
	if (toggleable) {
		const on = h === Haki.Armament ? p.armOn : p.obsOn;
		form.button(on ? "§cTurn off" : "§aTurn on", info.icon);
	}
	form.button("§0Back");
	form.show(player).then((res) => {
		if (res.canceled || res.selection === undefined) return;
		if (toggleable && res.selection === 0) {
			if (h === Haki.Armament) toggleArmament(player);
			else toggleObservation(player);
			return;
		}
		openCodex(player);
	});
}

function openFruit(player: Player): void {
	const p = power(player);
	const f = p.fruit();
	let body: string;
	if (!f) {
		body =
			"§7You haven't eaten a Devil Fruit.\n\n§fWhere to find them:\n§7• Dig with a shovel on beaches to unearth §6Treasure Chests\n§7• Buried treasure and shipwreck chests\n§7• Pirates sometimes carry one\n§7• The Crimson King always drops one\n\n§fKnown fruits:\n" +
			FRUITS.map((x) => `${x.color}• ${x.name} §8(${x.cls})`).join("\n") +
			"\n\n§cYou can only ever eat one. A second fruit will tear your body apart.";
	} else {
		body =
			`${f.color}§l${f.jp}  ${f.name}§r §8(${f.cls})\n§7Mastery §f${p.fruitLevel()}§7/100  ${progressBar(levelProgress(p.saved.fruitXp))}\n§7${f.passive}\n\n` +
			f.moves.map((m, i) => `${f.color}§l${i + 1}. ${m.name}§r\n§7${m.desc}\n§8Cooldown ${(m.cooldown / 20).toFixed(1)}s · Stamina ${m.stamina}`).join("\n\n") +
			"\n\n§9Weakness: the sea and Seastone drain your power. You can't swim.";
	}
	new ActionFormData()
		.title(f ? `${f.color}§l${f.name}` : "§lDevil Fruits")
		.body(body)
		.button("§0Back")
		.show(player)
		.then((res) => {
			if (!res.canceled) openCodex(player);
		});
}

function openGuide(player: Player): void {
	const body = [
		"§6§lThe Grand Line§r",
		"§7Haki is the power of will. It decides every serious fight.",
		"",
		"§5§lArmament Haki§r §7— awaken it by fighting (melee damage). Coat yourself to hit harder, hit §6Logia§7 users (they're intangible otherwise!), and break through the Crimson King's guard (he shrugs off 75% of uncoated hits).",
		"",
		"§3§lObservation Haki§r §7— awaken it by surviving hits. Sense enemies around you, dodge attacks, and at mastery 75 see the future. Without it the Crimson King dodges 30% of your attacks.",
		"",
		"§4§lConqueror's Haki§r §7— the qualities of a king. Knock out weak-willed foes. When two Conquerors collide, a §cHaki Clash§7 begins: §emash Sneak§7 (or tap your Conqueror's Haki) to overpower their will. The winner stuns the loser.",
		"",
		"§c§lVarek, the Crimson King§r §7— summon him with a §fJolly Roger§7 (crafted: black wool, bone, gold ingot, stick). He has all three Haki. Beat him to awaken your Conqueror's Haki.",
		"",
		"§e§lDevil Fruits§r §7— eat one for three powers (skill items appear in your inventory). Logia fruits make you intangible to attacks without Haki. But you'll sink in the sea, and §3Seastone§7 seals your power.",
		"",
		"§8Inspired by One Piece and Rell Seas.",
	].join("\n");
	new ActionFormData()
		.title("§lHow to play")
		.body(body)
		.button("§0Back")
		.show(player)
		.then((res) => {
			if (!res.canceled) openCodex(player);
		});
}
