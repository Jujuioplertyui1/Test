/** Static game data: Haki types, techniques (Rell Seas-style cards) and Devil Fruits. */

export const NS = "grandline";

export enum Haki {
	Armament = 0,
	Observation = 1,
	Conqueror = 2,
}

export interface HakiInfo {
	name: string;
	kanji: string;
	color: string;
	item: string;
	icon: string;
}

export const HAKI: Record<Haki, HakiInfo> = {
	[Haki.Armament]: { name: "Armament Haki", kanji: "武装色", color: "§5", item: "grandline:armament_haki", icon: "textures/grandline/ui/armament" },
	[Haki.Observation]: { name: "Observation Haki", kanji: "見聞色", color: "§b", item: "grandline:observation_haki", icon: "textures/grandline/ui/observation" },
	[Haki.Conqueror]: { name: "Conqueror's Haki", kanji: "覇王色", color: "§c", item: "grandline:conqueror_haki", icon: "textures/grandline/ui/conqueror" },
};

export interface TechniqueInfo {
	id: string;
	haki: Haki;
	level: number;
	name: string;
	kanji: string;
	card: string;
	desc: string;
}

/** Unlocked by mastery level. Card names nod to the Haki card sets in Rell Seas. */
export const TECHNIQUES: TechniqueInfo[] = [
	{ id: "hardening", haki: Haki.Armament, level: 0, name: "Hardening", kanji: "硬化", card: "", desc: "Coat your fists and blade in black steel. More damage, hit Logia users, and break through enemy Armament." },
	{ id: "full_body", haki: Haki.Armament, level: 20, name: "Full-Body Hardening", kanji: "全身硬化", card: "Sir Gawain", desc: "While coated you take up to 35% less damage." },
	{ id: "emission", haki: Haki.Armament, level: 45, name: "Emission", kanji: "流桜", card: "Sir Lancelot", desc: "Coated strikes send a shockwave through your target into the enemies behind it." },
	{ id: "ryou", haki: Haki.Armament, level: 75, name: "Internal Destruction", kanji: "内部破壊", card: "Sir Galahad", desc: "Your Haki flows inside the enemy: +30% damage to armored foes and Haki users." },
	{ id: "sense", haki: Haki.Observation, level: 0, name: "Sense Presence", kanji: "気配", card: "", desc: "Sense every living thing around you. Threats are marked and tracked on your HUD." },
	{ id: "evasion", haki: Haki.Observation, level: 15, name: "Evasion", kanji: "回避", card: "Newton", desc: "Read attacks before they land. Up to 45% chance to dodge." },
	{ id: "counter", haki: Haki.Observation, level: 45, name: "Counter", kanji: "反撃", card: "Edison", desc: "After a dodge, your next strike within 3s deals +60% damage." },
	{ id: "future_sight", haki: Haki.Observation, level: 75, name: "Future Sight", kanji: "未来視", card: "Opp E. Heimer", desc: "See the future: automatically dodge one attack every 6s, even ones that can't normally be dodged." },
	{ id: "kings_pressure", haki: Haki.Conqueror, level: 0, name: "King's Pressure", kanji: "覇気", card: "", desc: "Release your will. Every enemy weaker than you is knocked out cold." },
	{ id: "imperial_decree", haki: Haki.Conqueror, level: 25, name: "Imperial Decree", kanji: "勅令", card: "Julius C. Zar", desc: "Enemies who survive your burst are frozen in place and take 15% more damage." },
	{ id: "infusion", haki: Haki.Conqueror, level: 50, name: "Conqueror's Infusion", kanji: "覇王色纏い", card: "", desc: "With Armament on, your blows crackle with black lightning (+25% damage, arcs to a second foe) and can clash with other Conquerors without touching." },
	{ id: "khans_wrath", haki: Haki.Conqueror, level: 80, name: "Khan's Wrath", kanji: "覇王の怒り", card: "Geng D. Khan", desc: "When you drop below 30% health your will erupts, disabling every attacker for 10s." },
];

export interface MoveInfo {
	name: string;
	desc: string;
	/** Cooldown in ticks. */
	cooldown: number;
	stamina: number;
	item: string;
}

export interface FruitInfo {
	key: string;
	item: string;
	name: string;
	jp: string;
	cls: "Paramecia" | "Logia" | "Zoan";
	color: string;
	rgb: { red: number; green: number; blue: number };
	passive: string;
	moves: MoveInfo[];
}

function move(fruit: string, n: number, name: string, desc: string, cooldown: number, stamina: number): MoveInfo {
	return { name, desc, cooldown, stamina, item: `grandline:skill_${fruit}_${n}` };
}

export const FRUITS: FruitInfo[] = [
	{
		key: "gomu", item: "grandline:gomu_gomu_no_mi", name: "Gomu Gomu no Mi", jp: "ゴムゴムの実", cls: "Paramecia", color: "§d",
		rgb: { red: 0.76, green: 0.36, blue: 0.91 },
		passive: "Rubber body: immune to lightning and fall damage.",
		moves: [
			move("gomu", 1, "Gum-Gum Pistol", "Fire a stretching punch across the battlefield.", 30, 12),
			move("gomu", 2, "Gum-Gum Gatling", "A storm of rubber fists in front of you.", 120, 30),
			move("gomu", 3, "Gear Second", "Pump your blood: speed, strength and steam for 20 seconds.", 600, 40),
		],
	},
	{
		key: "mera", item: "grandline:mera_mera_no_mi", name: "Mera Mera no Mi", jp: "メラメラの実", cls: "Logia", color: "§6",
		rgb: { red: 1.0, green: 0.42, blue: 0.1 },
		passive: "Body of fire: immune to fire and lava. Attacks without Haki pass through you.",
		moves: [
			move("mera", 1, "Fire Fist", "Hiken! A colossal fist of flame that explodes on impact.", 60, 25),
			move("mera", 2, "Fire Gun", "Higan! Rapid bullets of fire from your fingertips.", 80, 20),
			move("mera", 3, "Flame Pillar", "Erupt into a pillar of fire, scorching everything around you.", 200, 35),
		],
	},
	{
		key: "hie", item: "grandline:hie_hie_no_mi", name: "Hie Hie no Mi", jp: "ヒエヒエの実", cls: "Logia", color: "§b",
		rgb: { red: 0.6, green: 0.9, blue: 1.0 },
		passive: "Body of ice: the sea freezes beneath your feet. Attacks without Haki shatter harmlessly.",
		moves: [
			move("hie", 1, "Ice Partisan", "Hurl a volley of ice spears that freeze on hit.", 50, 20),
			move("hie", 2, "Ice Age", "Freeze the ground, the sea and every enemy around you.", 240, 40),
			move("hie", 3, "Ice Time", "Encase the enemy you are looking at in ice.", 300, 35),
		],
	},
	{
		key: "goro", item: "grandline:goro_goro_no_mi", name: "Goro Goro no Mi", jp: "ゴロゴロの実", cls: "Logia", color: "§e",
		rgb: { red: 1.0, green: 0.88, blue: 0.29 },
		passive: "Body of lightning: immune to lightning. Attacks without Haki pass through you.",
		moves: [
			move("goro", 1, "El Thor", "Call down a pillar of divine lightning where you look.", 80, 30),
			move("goro", 2, "Vari: 1M Volts", "Discharge a million volts into everything around you.", 120, 30),
			move("goro", 3, "Thunder Step", "Travel as a bolt of lightning, shocking everything in your path.", 80, 20),
		],
	},
	{
		key: "gura", item: "grandline:gura_gura_no_mi", name: "Gura Gura no Mi", jp: "グラグラの実", cls: "Paramecia", color: "§f",
		rgb: { red: 0.95, green: 0.93, blue: 0.86 },
		passive: "The power to destroy the world: resist knockback and shatter the air itself.",
		moves: [
			move("gura", 1, "Quake Punch", "Crack the air itself and blast enemies away.", 80, 30),
			move("gura", 2, "Seaquake", "Slam the ground and launch everything around you.", 160, 35),
			move("gura", 3, "Tremor Wave", "Send a rolling shockwave tearing forward.", 140, 30),
		],
	},
	{
		key: "pika", item: "grandline:pika_pika_no_mi", name: "Pika Pika no Mi", jp: "ピカピカの実", cls: "Logia", color: "§e",
		rgb: { red: 1.0, green: 0.96, blue: 0.69 },
		passive: "Body of light: move at the speed of light. Attacks without Haki pass through you.",
		moves: [
			move("pika", 1, "Yasakani no Magatama", "A blinding barrage of light bullets.", 140, 35),
			move("pika", 2, "Ama no Murakumo", "Form a sword of light and cut everything before you.", 60, 20),
			move("pika", 3, "Yata no Kagami", "Travel at the speed of light to where you look.", 100, 25),
		],
	},
];

export function fruitByKey(key: string): FruitInfo | undefined {
	return FRUITS.find((f) => f.key === key);
}

export function fruitByItem(item: string): FruitInfo | undefined {
	return FRUITS.find((f) => f.item === item);
}

export const BOSS_ID = "grandline:conqueror_pirate";
export const PIRATE_ID = "grandline:pirate";
export const BOSS_NAME = "Varek, the Crimson King";

/** HUD glyphs from font/glyph_E3.png. */
export const G = {
	armOff: "",
	armOn: "",
	obsOff: "",
	obsOn: "",
	conqOff: "",
	conqOn: "",
	locked: "",
	stamina: "",
	haki: "",
	fruit: "",
	hakiFull: "",
	hakiEmpty: "",
	staFull: "",
	staEmpty: "",
	clashMine: "",
	clashEnemy: "",
	clashCore: "",
	capL: "",
	capR: "",
	hakiHalf: "",
	staHalf: "",
};
