// scripts-src/main.ts
import { ButtonState, InputButton, system as system10, world as world4 } from "@minecraft/server";

// scripts-src/defs.ts
var Haki = /* @__PURE__ */ ((Haki2) => {
  Haki2[Haki2["Armament"] = 0] = "Armament";
  Haki2[Haki2["Observation"] = 1] = "Observation";
  Haki2[Haki2["Conqueror"] = 2] = "Conqueror";
  return Haki2;
})(Haki || {});
var HAKI = {
  [0 /* Armament */]: { name: "Armament Haki", kanji: "\u6B66\u88C5\u8272", color: "\xA75", item: "grandline:armament_haki", icon: "textures/grandline/ui/armament" },
  [1 /* Observation */]: { name: "Observation Haki", kanji: "\u898B\u805E\u8272", color: "\xA7b", item: "grandline:observation_haki", icon: "textures/grandline/ui/observation" },
  [2 /* Conqueror */]: { name: "Conqueror's Haki", kanji: "\u8987\u738B\u8272", color: "\xA7c", item: "grandline:conqueror_haki", icon: "textures/grandline/ui/conqueror" }
};
var TECHNIQUES = [
  { id: "hardening", haki: 0 /* Armament */, level: 0, name: "Hardening", kanji: "\u786C\u5316", card: "", desc: "Coat your fists and blade in black steel. More damage, hit Logia users, and break through enemy Armament." },
  { id: "full_body", haki: 0 /* Armament */, level: 20, name: "Full-Body Hardening", kanji: "\u5168\u8EAB\u786C\u5316", card: "Sir Gawain", desc: "While coated you take up to 35% less damage." },
  { id: "emission", haki: 0 /* Armament */, level: 45, name: "Emission", kanji: "\u6D41\u685C", card: "Sir Lancelot", desc: "Coated strikes send a shockwave through your target into the enemies behind it." },
  { id: "ryou", haki: 0 /* Armament */, level: 75, name: "Internal Destruction", kanji: "\u5185\u90E8\u7834\u58CA", card: "Sir Galahad", desc: "Your Haki flows inside the enemy: +30% damage to armored foes and Haki users." },
  { id: "sense", haki: 1 /* Observation */, level: 0, name: "Sense Presence", kanji: "\u6C17\u914D", card: "", desc: "Sense every living thing around you. Threats are marked and tracked on your HUD." },
  { id: "evasion", haki: 1 /* Observation */, level: 15, name: "Evasion", kanji: "\u56DE\u907F", card: "Newton", desc: "Read attacks before they land. Up to 45% chance to dodge." },
  { id: "counter", haki: 1 /* Observation */, level: 45, name: "Counter", kanji: "\u53CD\u6483", card: "Edison", desc: "After a dodge, your next strike within 3s deals +60% damage." },
  { id: "future_sight", haki: 1 /* Observation */, level: 75, name: "Future Sight", kanji: "\u672A\u6765\u8996", card: "Opp E. Heimer", desc: "See the future: automatically dodge one attack every 6s, even ones that can't normally be dodged." },
  { id: "kings_pressure", haki: 2 /* Conqueror */, level: 0, name: "King's Pressure", kanji: "\u8987\u6C17", card: "", desc: "Release your will. Every enemy weaker than you is knocked out cold." },
  { id: "imperial_decree", haki: 2 /* Conqueror */, level: 25, name: "Imperial Decree", kanji: "\u52C5\u4EE4", card: "Julius C. Zar", desc: "Enemies who survive your burst are frozen in place and take 15% more damage." },
  { id: "infusion", haki: 2 /* Conqueror */, level: 50, name: "Conqueror's Infusion", kanji: "\u8987\u738B\u8272\u7E8F\u3044", card: "", desc: "With Armament on, your blows crackle with black lightning (+25% damage, arcs to a second foe) and can clash with other Conquerors without touching." },
  { id: "khans_wrath", haki: 2 /* Conqueror */, level: 80, name: "Khan's Wrath", kanji: "\u8987\u738B\u306E\u6012\u308A", card: "Geng D. Khan", desc: "When you drop below 30% health your will erupts, disabling every attacker for 10s." }
];
function move(fruit, n, name2, desc, cooldown, stamina) {
  return { name: name2, desc, cooldown, stamina, item: `grandline:skill_${fruit}_${n}` };
}
var FRUITS = [
  {
    key: "gomu",
    item: "grandline:gomu_gomu_no_mi",
    name: "Gomu Gomu no Mi",
    jp: "\u30B4\u30E0\u30B4\u30E0\u306E\u5B9F",
    cls: "Paramecia",
    color: "\xA7d",
    rgb: { red: 0.76, green: 0.36, blue: 0.91 },
    passive: "Rubber body: immune to lightning and fall damage.",
    moves: [
      move("gomu", 1, "Gum-Gum Pistol", "Fire a stretching punch across the battlefield.", 30, 12),
      move("gomu", 2, "Gum-Gum Gatling", "A storm of rubber fists in front of you.", 120, 30),
      move("gomu", 3, "Gear Second", "Pump your blood: speed, strength and steam for 20 seconds.", 600, 40)
    ]
  },
  {
    key: "mera",
    item: "grandline:mera_mera_no_mi",
    name: "Mera Mera no Mi",
    jp: "\u30E1\u30E9\u30E1\u30E9\u306E\u5B9F",
    cls: "Logia",
    color: "\xA76",
    rgb: { red: 1, green: 0.42, blue: 0.1 },
    passive: "Body of fire: immune to fire and lava. Attacks without Haki pass through you.",
    moves: [
      move("mera", 1, "Fire Fist", "Hiken! A colossal fist of flame that explodes on impact.", 60, 25),
      move("mera", 2, "Fire Gun", "Higan! Rapid bullets of fire from your fingertips.", 80, 20),
      move("mera", 3, "Flame Pillar", "Erupt into a pillar of fire, scorching everything around you.", 200, 35)
    ]
  },
  {
    key: "hie",
    item: "grandline:hie_hie_no_mi",
    name: "Hie Hie no Mi",
    jp: "\u30D2\u30A8\u30D2\u30A8\u306E\u5B9F",
    cls: "Logia",
    color: "\xA7b",
    rgb: { red: 0.6, green: 0.9, blue: 1 },
    passive: "Body of ice: the sea freezes beneath your feet. Attacks without Haki shatter harmlessly.",
    moves: [
      move("hie", 1, "Ice Partisan", "Hurl a volley of ice spears that freeze on hit.", 50, 20),
      move("hie", 2, "Ice Age", "Freeze the ground, the sea and every enemy around you.", 240, 40),
      move("hie", 3, "Ice Time", "Encase the enemy you are looking at in ice.", 300, 35)
    ]
  },
  {
    key: "goro",
    item: "grandline:goro_goro_no_mi",
    name: "Goro Goro no Mi",
    jp: "\u30B4\u30ED\u30B4\u30ED\u306E\u5B9F",
    cls: "Logia",
    color: "\xA7e",
    rgb: { red: 1, green: 0.88, blue: 0.29 },
    passive: "Body of lightning: immune to lightning. Attacks without Haki pass through you.",
    moves: [
      move("goro", 1, "El Thor", "Call down a pillar of divine lightning where you look.", 80, 30),
      move("goro", 2, "Vari: 1M Volts", "Discharge a million volts into everything around you.", 120, 30),
      move("goro", 3, "Thunder Step", "Travel as a bolt of lightning, shocking everything in your path.", 80, 20)
    ]
  },
  {
    key: "gura",
    item: "grandline:gura_gura_no_mi",
    name: "Gura Gura no Mi",
    jp: "\u30B0\u30E9\u30B0\u30E9\u306E\u5B9F",
    cls: "Paramecia",
    color: "\xA7f",
    rgb: { red: 0.95, green: 0.93, blue: 0.86 },
    passive: "The power to destroy the world: resist knockback and shatter the air itself.",
    moves: [
      move("gura", 1, "Quake Punch", "Crack the air itself and blast enemies away.", 80, 30),
      move("gura", 2, "Seaquake", "Slam the ground and launch everything around you.", 160, 35),
      move("gura", 3, "Tremor Wave", "Send a rolling shockwave tearing forward.", 140, 30)
    ]
  },
  {
    key: "pika",
    item: "grandline:pika_pika_no_mi",
    name: "Pika Pika no Mi",
    jp: "\u30D4\u30AB\u30D4\u30AB\u306E\u5B9F",
    cls: "Logia",
    color: "\xA7e",
    rgb: { red: 1, green: 0.96, blue: 0.69 },
    passive: "Body of light: move at the speed of light. Attacks without Haki pass through you.",
    moves: [
      move("pika", 1, "Yasakani no Magatama", "A blinding barrage of light bullets.", 140, 35),
      move("pika", 2, "Ama no Murakumo", "Form a sword of light and cut everything before you.", 60, 20),
      move("pika", 3, "Yata no Kagami", "Travel at the speed of light to where you look.", 100, 25)
    ]
  }
];
function fruitByKey(key) {
  return FRUITS.find((f) => f.key === key);
}
var BOSS_ID = "grandline:conqueror_pirate";
var PIRATE_ID = "grandline:pirate";
var BOSS_NAME = "Varek, the Crimson King";
var G = {
  armOff: "\uE300",
  armOn: "\uE301",
  obsOff: "\uE302",
  obsOn: "\uE303",
  conqOff: "\uE304",
  conqOn: "\uE305",
  locked: "\uE306",
  stamina: "\uE307",
  haki: "\uE308",
  fruit: "\uE309",
  hakiFull: "\uE310",
  hakiEmpty: "\uE311",
  staFull: "\uE312",
  staEmpty: "\uE313",
  clashMine: "\uE314",
  clashEnemy: "\uE315",
  clashCore: "\uE316",
  capL: "\uE317",
  capR: "\uE318",
  hakiHalf: "\uE319",
  staHalf: "\uE31A"
};

// scripts-src/data.ts
var MAX_LEVEL = 100;
var ARMAMENT_AWAKEN = 250;
var OBSERVATION_AWAKEN = 40;
var Power = class {
  constructor(saved) {
    // runtime
    this.armOn = false;
    this.obsOn = false;
    this.moveCd = [0, 0, 0];
    this.conqCd = 0;
    this.conqCdMax = 1;
    this.futureSightCd = 0;
    this.counterTicks = 0;
    this.khanCd = 0;
    this.gear2 = 0;
    this.clashMeleeCd = 0;
    this.hintCd = 0;
    this.dirty = false;
    this.wasInWater = false;
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
      ...saved ?? {}
    };
  }
  has(h) {
    return this.saved.unlocked[h];
  }
  level(h) {
    return levelForXp(this.saved.xp[h]);
  }
  hasTech(id) {
    const t = TECHNIQUES.find((x) => x.id === id);
    return !!t && this.has(t.haki) && this.level(t.haki) >= t.level;
  }
  fruit() {
    return fruitByKey(this.saved.fruit);
  }
  fruitLevel() {
    return levelForXp(this.saved.fruitXp);
  }
  maxHaki() {
    let total = 0;
    for (const h of [0 /* Armament */, 1 /* Observation */, 2 /* Conqueror */]) if (this.has(h)) total += this.level(h);
    return 100 + total * 0.8;
  }
  maxStamina() {
    return 100 + this.fruitLevel();
  }
  /** Adds Haki mastery. Returns the new level if the player levelled up. */
  addXp(h, amount) {
    if (!this.has(h)) return void 0;
    const before = this.level(h);
    this.saved.xp[h] = Math.min(this.saved.xp[h] + Math.round(amount), totalXpForLevel(MAX_LEVEL));
    this.dirty = true;
    const after = this.level(h);
    return after > before ? after : void 0;
  }
  addFruitXp(amount) {
    if (!this.fruit()) return void 0;
    const before = this.fruitLevel();
    this.saved.fruitXp = Math.min(this.saved.fruitXp + Math.round(amount), totalXpForLevel(MAX_LEVEL));
    this.dirty = true;
    const after = this.fruitLevel();
    return after > before ? after : void 0;
  }
  /** Techniques that were unlocked exactly at this level. */
  static techniquesAt(h, level) {
    return TECHNIQUES.filter((t) => t.haki === h && t.level === level);
  }
};
function costForLevel(level) {
  return 10 + level * 3;
}
function totalXpForLevel(level) {
  let total = 0;
  for (let l = 0; l < level; l++) total += costForLevel(l);
  return total;
}
function levelForXp(xp) {
  let level = 0;
  while (level < MAX_LEVEL && xp >= costForLevel(level)) {
    xp -= costForLevel(level);
    level++;
  }
  return level;
}
function levelProgress(xp) {
  const level = levelForXp(xp);
  if (level >= MAX_LEVEL) return 1;
  return (xp - totalXpForLevel(level)) / costForLevel(level);
}
var KEY = "grandline:power";
var cache = /* @__PURE__ */ new Map();
function power(player) {
  let p = cache.get(player.id);
  if (!p) {
    let saved;
    try {
      const raw = player.getDynamicProperty(KEY);
      if (typeof raw === "string") saved = JSON.parse(raw);
    } catch {
      saved = void 0;
    }
    p = new Power(saved);
    cache.set(player.id, p);
  }
  return p;
}
function save(player, p = power(player)) {
  try {
    player.setDynamicProperty(KEY, JSON.stringify(p.saved));
    p.dirty = false;
  } catch {
  }
}
function forget(playerId) {
  cache.delete(playerId);
}

// scripts-src/fx.ts
import { MolangVariableMap, system } from "@minecraft/server";

// scripts-src/vec.ts
var V = {
  of(x, y, z) {
    return { x, y, z };
  },
  add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  },
  sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  },
  scale(a, s) {
    return { x: a.x * s, y: a.y * s, z: a.z * s };
  },
  len(a) {
    return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  },
  dist(a, b) {
    return V.len(V.sub(a, b));
  },
  norm(a) {
    const l = V.len(a);
    return l < 1e-6 ? { x: 0, y: 0, z: 0 } : V.scale(a, 1 / l);
  },
  dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  },
  cross(a, b) {
    return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
  },
  lerp(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
  },
  up(a, dy) {
    return { x: a.x, y: a.y + dy, z: a.z };
  },
  flat(a) {
    return { x: a.x, y: 0, z: a.z };
  },
  /** Any unit vector perpendicular to a. */
  perp(a) {
    const n = V.norm(a);
    const ref = Math.abs(n.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    return V.norm(V.cross(n, ref));
  },
  randUnit() {
    const t = Math.random() * Math.PI * 2;
    const u = Math.random() * 2 - 1;
    const s = Math.sqrt(1 - u * u);
    return { x: s * Math.cos(t), y: u, z: s * Math.sin(t) };
  },
  /** Horizontal unit vector at the given yaw (degrees, Minecraft convention). */
  fromYaw(yawDeg) {
    const r = yawDeg * Math.PI / 180;
    return { x: -Math.sin(r), y: 0, z: Math.cos(r) };
  }
};
function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// scripts-src/fx.ts
var RED = { red: 1, green: 0.08, blue: 0.1 };
var CRIMSON = { red: 0.75, green: 0, blue: 0.08 };
var BLACK = { red: 0.02, green: 0, blue: 0.03 };
var PURPLE = { red: 0.55, green: 0.25, blue: 1 };
var GOLD = { red: 1, green: 0.8, blue: 0.25 };
var WHITE = { red: 1, green: 1, blue: 1 };
var CYAN = { red: 0.35, green: 0.85, blue: 1 };
var YELLOW = { red: 1, green: 0.95, blue: 0.4 };
function vars(color, extra) {
  const m = new MolangVariableMap();
  if (color) m.setColorRGB("variable.color", color);
  if (extra) for (const k in extra) m.setFloat(`variable.${k}`, extra[k]);
  return m;
}
function particle(dim, id, loc, m) {
  try {
    dim.spawnParticle(id, loc, m);
  } catch {
  }
}
function privateParticle(player, id, loc, m) {
  try {
    player.spawnParticle(id, loc, m);
  } catch {
  }
}
function sound(dim, id, loc, volume = 1, pitch = 1) {
  try {
    dim.playSound(id, loc, { volume, pitch });
  } catch {
  }
}
function segment(dim, a, b, color, width, core, life = 0.18) {
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
function bolt(dim, from, to, o = {}) {
  const color = o.color ?? RED;
  const width = o.width ?? 0.16;
  const len = V.dist(from, to);
  const segs = o.segments ?? Math.max(3, Math.min(14, Math.round(len * 1.6)));
  const jitter = (o.jitter ?? 0.12) * len;
  const pts = [from];
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
function lightningBurst(dim, center, radius, count, color = RED) {
  for (let i = 0; i < count; i++) {
    const dir = V.randUnit();
    const r = radius * (0.5 + Math.random() * 0.5);
    bolt(dim, center, V.add(center, V.scale(dir, r)), { color, width: 0.12 + radius * 0.01, branches: 1, jitter: 0.18 });
  }
}
function shake(player, intensity, seconds) {
  try {
    player.runCommand(`camerashake add @s ${Math.min(4, intensity).toFixed(2)} ${seconds.toFixed(2)} rotational`);
  } catch {
  }
}
function shakeAround(dim, center, radius, intensity, seconds) {
  for (const p of dim.getPlayers({ location: center, maxDistance: radius })) {
    const falloff = 1 - V.dist(p.location, center) / radius;
    if (falloff > 0.05) shake(p, intensity * falloff, seconds);
  }
}
function flash(player, color, fadeIn = 0.05, hold = 0.1, fadeOut = 0.5) {
  try {
    player.camera.fade({ fadeColor: color, fadeTime: { fadeInTime: fadeIn, holdTime: hold, fadeOutTime: fadeOut } });
  } catch {
  }
}
function notice(player, text, ticks = 50) {
  const p = power(player);
  p.notice = { text, until: system.currentTick + ticks };
  try {
    player.onScreenDisplay.setActionBar(text);
  } catch {
  }
}
function title(player, main, sub, stay = 50, fadeIn = 5, fadeOut = 15) {
  try {
    player.onScreenDisplay.setTitle(main, { fadeInDuration: fadeIn, stayDuration: stay, fadeOutDuration: fadeOut, subtitle: sub });
  } catch {
  }
}
function chest(e) {
  return V.up(e.location, isPlayer(e) ? 1.2 : 1.1);
}
function isPlayer(e) {
  return e.typeId === "minecraft:player";
}
function aura(e, color = CRIMSON, scale2 = 1) {
  particle(e.dimension, "grandline:haki_aura", e.location, vars(color, { scale: scale2 }));
}

// scripts-src/haki.ts
import { EntityDamageCause as EntityDamageCause3, ItemLockMode, ItemStack, system as system5 } from "@minecraft/server";

// scripts-src/clash.ts
import { EasingType as EasingType2, GameMode as GameMode2, InputPermissionCategory, system as system3 } from "@minecraft/server";

// scripts-src/boss.ts
import { EasingType, EntityDamageCause, GameMode, system as system2, world } from "@minecraft/server";
var bosses = /* @__PURE__ */ new Map();
var bossEntities = /* @__PURE__ */ new Map();
function state(e) {
  let s = bosses.get(e.id);
  if (!s) {
    const phase = e.getProperty("grandline:phase") ?? 1;
    s = { phase, burstCd: 160, leapCd: 100, emissionCd: 60, charge: 0, leapTicks: 0, undodgeableUntil: 0, damagers: /* @__PURE__ */ new Map(), lastSeen: 0 };
    bosses.set(e.id, s);
  }
  return s;
}
function track(e) {
  if (e.typeId === BOSS_ID) bossEntities.set(e.id, e);
}
function bossClashPower(e) {
  return state(e).phase >= 2 ? 132 : 110;
}
function bossUndodgeable(attacker) {
  if (attacker.typeId !== BOSS_ID) return false;
  const s = bosses.get(attacker.id);
  return !!s && (s.undodgeableUntil > system2.currentTick || s.phase >= 2);
}
function onBossHurt(boss, _damage, attacker) {
  const s = state(boss);
  if (attacker && isPlayer(attacker)) s.damagers.set(attacker.id, system2.currentTick);
  if (s.phase === 1 && health(boss) <= maxHealth(boss) * 0.5) enterPhaseTwo(boss, s);
}
function nearbyPlayers(e, r) {
  return e.dimension.getPlayers({ location: e.location, maxDistance: r, excludeGameModes: [GameMode.Creative, GameMode.Spectator] });
}
function say(boss, text, r = 40) {
  for (const p of boss.dimension.getPlayers({ location: boss.location, maxDistance: r })) p.sendMessage(`\xA74${BOSS_NAME}\xA7r: \xA7c${text}`);
}
function enterPhaseTwo(boss, s) {
  s.phase = 2;
  try {
    boss.triggerEvent("grandline:phase_two");
    boss.setProperty("grandline:phase", 2);
  } catch {
  }
  say(boss, "You've got guts... Then witness the will of a KING!");
  for (const p of nearbyPlayers(boss, 48)) {
    title(p, "\xA74\xA7l\u8987\u738B\u8272", `\xA7c${BOSS_NAME} unleashes his true will!`, 50, 5, 15);
    flash(p, CRIMSON, 0.1, 0.3, 1);
  }
  burst(boss, 120, 18, true);
  summonCrew(boss, 3);
  s.burstCd = 140;
}
function summonCrew(boss, count) {
  for (let i = 0; i < count; i++) {
    const ang = i / count * Math.PI * 2 + Math.random();
    const loc = V.add(boss.location, V.of(Math.cos(ang) * 3, 0.2, Math.sin(ang) * 3));
    try {
      const pirate = boss.dimension.spawnEntity(PIRATE_ID, loc);
      particle(boss.dimension, "grandline:crew_smoke", pirate.location);
    } catch {
    }
  }
  sound(boss.dimension, "mob.evocation_illager.prepare_summon", boss.location, 1, 0.8);
}
function tickBoss(boss) {
  const s = state(boss);
  s.lastSeen = system2.currentTick;
  const dim = boss.dimension;
  if (s.phase >= 2 && system2.currentTick % 4 === 0) aura(boss, BLACK, 1.2);
  if (clashOf(boss) || isKnockedOut(boss)) return;
  if (s.burstCd > 0) s.burstCd--;
  if (s.leapCd > 0) s.leapCd--;
  if (s.emissionCd > 0) s.emissionCd--;
  const targets2 = nearbyPlayers(boss, 30);
  if (targets2.length === 0) return;
  let target = targets2[0];
  let best = Infinity;
  for (const t of targets2) {
    const d = V.dist(t.location, boss.location);
    if (d < best) {
      best = d;
      target = t;
    }
  }
  const dist = best;
  if (s.charge > 0) {
    s.charge--;
    aura(boss, CRIMSON, 1.6);
    particle(dim, "grandline:charge_in", chest(boss));
    if (s.charge % 6 === 0) bolt(dim, chest(boss), V.add(chest(boss), V.scale(V.randUnit(), 2.5)), { width: 0.12, branches: 0 });
    if (s.charge === 0) {
      try {
        boss.setProperty("grandline:charging", false);
      } catch {
      }
      burst(boss, s.phase >= 2 ? 125 : 105, s.phase >= 2 ? 20 : 16, true);
    }
    return;
  }
  if (s.leapTicks > 0) {
    s.leapTicks++;
    particle(dim, "grandline:haki_aura", boss.location, vars(BLACK, { scale: 0.8 }));
    if (s.leapTicks > 6 && boss.isOnGround || s.leapTicks > 40) {
      s.leapTicks = 0;
      slam(boss, s);
    }
    return;
  }
  if (s.burstCd <= 0 && dist < 15) {
    s.charge = 24;
    s.burstCd = s.phase >= 2 ? 220 : 320;
    try {
      boss.setProperty("grandline:charging", true);
      boss.playAnimation("animation.grandline.captain.charge", { blendOutTime: 0.3 });
    } catch {
    }
    say(boss, ["Feel the weight of my will!", "Kneel.", "Only a king may stand before me!"][Math.floor(Math.random() * 3)], 30);
    sound(dim, "mob.warden.roar", boss.location, 2, 0.6);
    return;
  }
  if (s.leapCd <= 0 && dist > 4 && dist < 14 && boss.isOnGround) {
    const dir = V.norm(V.sub(target.location, boss.location));
    try {
      boss.applyImpulse({ x: dir.x * Math.min(1.6, dist * 0.13), y: 0.75, z: dir.z * Math.min(1.6, dist * 0.13) });
      boss.playAnimation("animation.grandline.captain.leap", { blendOutTime: 0.2 });
    } catch {
    }
    s.leapTicks = 1;
    s.leapCd = s.phase >= 2 ? 100 : 150;
    s.undodgeableUntil = system2.currentTick + 40;
    sound(dim, "mob.ravager.roar", boss.location, 1, 1.2);
    return;
  }
  if (s.emissionCd <= 0 && dist > 6 && dist < 22) {
    s.emissionCd = s.phase >= 2 ? 70 : 100;
    shootWave(boss, target);
  }
}
function slam(boss, s) {
  const dim = boss.dimension;
  const at = boss.location;
  const r = 4;
  particle(dim, "grandline:shockwave_ring", V.up(at, 0.15), vars(CRIMSON, { radius: 7 }));
  particle(dim, "grandline:ground_debris", at);
  lightningBurst(dim, V.up(at, 0.6), 4, 8);
  sound(dim, "random.explode", at, 2, 0.7);
  sound(dim, "ambient.weather.lightning.impact", at, 2, 0.8);
  shakeAround(dim, at, 18, 1.1, 0.7);
  s.undodgeableUntil = system2.currentTick + 2;
  for (const e of dim.getEntities({ location: at, maxDistance: r, excludeFamilies: ["inanimate"] })) {
    if (e.id === boss.id || e.typeId === PIRATE_ID || !e.getComponent("minecraft:health")) continue;
    if (isPlayer(e) && (e.getGameMode() === GameMode.Creative || e.getGameMode() === GameMode.Spectator)) continue;
    try {
      e.applyDamage(s.phase >= 2 ? 15 : 11, { cause: EntityDamageCause.entityAttack, damagingEntity: boss });
      const away = V.norm(V.flat(V.sub(e.location, at)));
      e.applyKnockback({ x: away.x * 1.4, z: away.z * 1.4 }, 0.55);
    } catch {
    }
  }
}
function shootWave(boss, target) {
  const from = V.up(boss.location, 1.5);
  const dir = V.norm(V.sub(chest(target), from));
  try {
    boss.playAnimation("animation.grandline.captain.punch", { blendOutTime: 0.2 });
    const proj = boss.dimension.spawnEntity("grandline:haki_wave", V.add(from, V.scale(dir, 1.2)));
    const pc = proj.getComponent("minecraft:projectile");
    if (pc) {
      pc.owner = boss;
      pc.shoot(V.scale(dir, 1.9));
    }
    registerProjectileOwner(proj, boss, 10, "haki_wave");
  } catch {
  }
  sound(boss.dimension, "mob.warden.attack_impact", from, 1.5, 0.6);
}
var projectileInfo = /* @__PURE__ */ new Map();
function registerProjectileOwner(proj, owner, damage, kind) {
  projectileInfo.set(proj.id, { owner, damage, kind });
  system2.runTimeout(() => projectileInfo.delete(proj.id), 200);
}
function tickBosses() {
  for (const [id, e] of bossEntities) {
    if (!e.isValid) {
      bossEntities.delete(id);
      continue;
    }
    tickBoss(e);
  }
  if (system2.currentTick % 100 === 0) {
    for (const dimId of ["overworld", "nether", "the_end"]) {
      try {
        for (const e of world.getDimension(dimId).getEntities({ type: BOSS_ID })) track(e);
      } catch {
      }
    }
    for (const [id, s] of bosses) if (system2.currentTick - s.lastSeen > 1200) bosses.delete(id);
  }
}
function onBossDeath(boss, killer) {
  const s = bosses.get(boss.id);
  const dim = boss.dimension;
  const at = boss.location;
  bosses.delete(boss.id);
  bossEntities.delete(boss.id);
  lightningBurst(dim, chest(boss), 7, 14);
  bolt(dim, chest(boss), V.up(at, 30), { width: 0.5, segments: 14, branches: 4, color: RED });
  sound(dim, "mob.enderdragon.death", at, 1.2, 1.2);
  const credited = /* @__PURE__ */ new Set();
  if (killer && isPlayer(killer)) credited.add(killer.id);
  if (s) {
    for (const [pid, tick] of s.damagers) if (system2.currentTick - tick < 1200) credited.add(pid);
  }
  for (const p of dim.getPlayers({ location: at, maxDistance: 64 })) {
    title(p, "\xA76\xA7lVICTORY", `\xA7e${BOSS_NAME} has fallen!`, 70, 5, 20);
    if (!credited.has(p.id)) continue;
    const pw = power(p);
    pw.saved.bossKills++;
    pw.dirty = true;
    if (!pw.has(2 /* Conqueror */)) {
      system2.runTimeout(() => {
        if (!p.isValid) return;
        p.sendMessage(`\xA74${BOSS_NAME}\xA7r: \xA77...Heh. So that's your will. Then carry it... king.`);
        awaken(p, 2 /* Conqueror */, "Defeating the Crimson King awakened the qualities of a king within you.");
      }, 50);
    } else {
      gainXp(p, 2 /* Conqueror */, 200);
    }
    save(p, pw);
  }
}
function summonCaptain(player) {
  const dim = player.dimension;
  const dir = V.norm(V.flat(player.getViewDirection()));
  const want = V.add(player.location, V.scale(dir, 9));
  const top = dim.getTopmostBlock({ x: want.x, z: want.z });
  const spot = top ? V.of(want.x, top.location.y + 1, want.z) : want;
  if (Math.abs(spot.y - player.location.y) > 12) {
    player.sendMessage("\xA7cThe Crimson King needs solid ground nearby to land on.");
    return false;
  }
  for (const pl of dim.getPlayers({ location: spot, maxDistance: 48 })) {
    flash(pl, BLACK, 0.4, 0.6, 1.2);
  }
  sound(dim, "ambient.weather.thunder", spot, 5, 0.5);
  system2.runTimeout(() => {
    if (!player.isValid) return;
    let boss;
    try {
      boss = dim.spawnEntity(BOSS_ID, spot);
    } catch {
      player.sendMessage("\xA7cCouldn't summon the Crimson King here.");
      return;
    }
    track(boss);
    lightningBurst(dim, V.up(spot, 1), 5, 12);
    for (let i = 0; i < 4; i++) bolt(dim, V.up(spot, 30), V.up(spot, 0.2), { width: 0.45, segments: 14, branches: 3 });
    particle(dim, "grandline:haoshoku_wave_boss", V.up(spot, 1), vars(void 0, { radius: 14 }));
    particle(dim, "grandline:shockwave_ring", V.up(spot, 0.15), vars(CRIMSON, { radius: 10 }));
    sound(dim, "mob.warden.sonic_boom", spot, 5, 0.5);
    shakeAround(dim, spot, 40, 1.4, 1.5);
    summonCrew(boss, 3);
    const faceDir = V.norm(V.flat(V.sub(player.location, spot)));
    const camAt = V.up(V.add(spot, V.scale(faceDir, 5)), 2.2);
    for (const pl of dim.getPlayers({ location: spot, maxDistance: 32 })) {
      try {
        pl.camera.setCamera("minecraft:free", { location: camAt, facingLocation: V.up(spot, 1.7), easeOptions: { easeTime: 0.8, easeType: EasingType.OutCubic } });
      } catch {
      }
      title(pl, "\xA74\xA7lVAREK", "\xA7cThe Crimson King \xA77\u2014 captain of the Crimson Tide Pirates", 50, 10, 15);
      const pr = pl;
      system2.runTimeout(() => {
        try {
          if (pr.isValid) pr.camera.clear();
        } catch {
        }
      }, 60);
    }
    try {
      boss.teleport(spot, { facingLocation: player.location });
      boss.playAnimation("animation.grandline.captain.roar", { blendOutTime: 0.5 });
    } catch {
    }
    say(boss, "So you're the one waving that flag around. Let's see if your will can stand before mine!", 48);
  }, 30);
  return true;
}

// scripts-src/clash.ts
var clashes = [];
var nextId = 1;
var FOG = "grandline:clash_fog";
var FOG_TAG = "grandline_clash";
function clashOf(e) {
  return clashes.find((c) => c.a.id === e.id || c.b.id === e.id);
}
function name(e) {
  if (isPlayer(e)) return e.name;
  if (e.typeId === BOSS_ID) return BOSS_NAME;
  return e.nameTag || "???";
}
function clashPower(e, c) {
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
function lock(e, locked) {
  if (isPlayer(e)) {
    try {
      e.inputPermissions.setPermissionCategory(InputPermissionCategory.LateralMovement, !locked);
      e.inputPermissions.setPermissionCategory(InputPermissionCategory.Jump, !locked);
    } catch {
    }
  } else {
    try {
      e.triggerEvent(locked ? "grandline:clash_start" : "grandline:clash_end");
    } catch {
    }
  }
}
function cinematic(p, c, ease) {
  const A = c.a.location;
  const B = c.b.location;
  const mid = V.up(V.lerp(A, B, 0.5), 1.2);
  const axis = V.norm(V.flat(V.sub(B, A)));
  const side = V.cross(axis, V.of(0, 1, 0));
  const dist = Math.max(6, V.dist(A, B) * 1.1 + 3);
  const ang = c.orbit;
  const offset = V.add(V.scale(side, Math.cos(ang) * dist), V.scale(axis, Math.sin(ang) * dist * 0.35));
  let cam = V.up(V.add(mid, offset), 1.6 + Math.sin(ang * 0.7) * 0.6);
  try {
    const block = p.dimension.getBlock(cam);
    if (block && !block.isAir) cam = V.up(V.add(mid, V.scale(offset, -1)), 2.2);
  } catch {
  }
  try {
    p.camera.setCamera("minecraft:free", {
      location: cam,
      facingLocation: mid,
      easeOptions: { easeTime: ease, easeType: ease > 0.9 ? EasingType2.Linear : EasingType2.OutCubic }
    });
  } catch {
  }
}
function startClash(a, b, awakening) {
  if (!a.isValid || !b.isValid || a.id === b.id) return;
  if (clashOf(a) || clashOf(b)) return;
  if (a.dimension.id !== b.dimension.id) return;
  const c = {
    id: nextId++,
    a,
    b,
    balance: 0,
    age: 0,
    maxAge: 200,
    awakening,
    pushA: 0,
    pushB: 0,
    lastPush: /* @__PURE__ */ new Map(),
    posA: a.location,
    posB: b.location,
    fogged: /* @__PURE__ */ new Set(),
    orbit: 0
  };
  clashes.push(c);
  lock(a, true);
  lock(b, true);
  try {
    a.teleport(a.location, { facingLocation: chest(b) });
    b.teleport(b.location, { facingLocation: chest(a) });
  } catch {
  }
  const mid = V.lerp(chest(a), chest(b), 0.5);
  const dim = a.dimension;
  for (const pl of dim.getPlayers({ location: mid, maxDistance: 64 })) {
    try {
      pl.runCommand(`fog @s push ${FOG} ${FOG_TAG}`);
      c.fogged.add(pl.id);
    } catch {
    }
    flash(pl, BLACK, 0.05, 0.25, 0.6);
    shake(pl, 1.2, 1.2);
  }
  for (const e of [a, b]) {
    if (isPlayer(e)) {
      const other = e.id === a.id ? b : a;
      title(e, "\xA74\xA7l\u8987\u738B\u8272 \xA7r\xA7c\xA7lCLASH!", `\xA77Your will against \xA7c${name(other)}\xA77 \u2014 \xA7eMASH SNEAK!`, 40, 2, 10);
      cinematic(e, c, 0.8);
      try {
        e.playAnimation("animation.grandline.player.clash", { blendOutTime: 0.3, controller: "grandline_pose" });
      } catch {
      }
    } else {
      try {
        e.playAnimation("animation.grandline.captain.clash", { blendOutTime: 0.3 });
      } catch {
      }
    }
  }
  sound(dim, "mob.warden.sonic_boom", mid, 4, 0.5);
  sound(dim, "ambient.weather.thunder", mid, 4, 0.6);
  sound(dim, "mob.enderdragon.growl", mid, 1, 0.5);
  particle(dim, "grandline:haoshoku_wave_boss", mid, vars(void 0, { radius: 14 }));
  lightningBurst(dim, mid, 6, 12);
}
function pushClash(player) {
  const c = clashOf(player);
  if (!c) return;
  const now = system3.currentTick;
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
function clashPoint(c) {
  const t = 0.5 + c.balance / 100 * 0.38;
  return V.lerp(chest(c.a), chest(c.b), t);
}
function bar(myBalance) {
  const n = 24;
  const marker = Math.round(clamp(n / 2 + myBalance / 100 * (n / 2), 0, n));
  let s = `\xA7r${G.capL}`;
  for (let i = 0; i < n; i++) {
    if (i === marker) s += G.clashCore;
    s += i < marker ? G.clashMine : G.clashEnemy;
  }
  if (marker >= n) s += G.clashCore;
  return s + G.capR;
}
function tickClash(c) {
  const { a, b } = c;
  if (!a.isValid || !b.isValid || health(a) <= 0 || health(b) <= 0 || a.dimension.id !== b.dimension.id || V.dist(a.location, b.location) > 24) {
    endClash(c, void 0);
    return false;
  }
  c.age++;
  const dim = a.dimension;
  if (c.age % 5 === 0) {
    for (const [e, home, other] of [
      [a, c.posA, b],
      [b, c.posB, a]
    ]) {
      if (V.dist(e.location, home) > 0.6 || !isPlayer(e)) {
        try {
          e.teleport(home, { facingLocation: chest(other) });
        } catch {
        }
      }
    }
  }
  const pa = clashPower(a, c);
  const pb = clashPower(b, c);
  let autoA = 0;
  let autoB = 0;
  if (!isPlayer(a)) autoA = autoPush(a);
  if (!isPlayer(b)) autoB = autoPush(b);
  const drift = (pa - pb) * 4e-3;
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
    particle(dim, "grandline:haoshoku_wave", P, vars(void 0, { radius: 6 }));
  }
  if (c.age % 20 === 10) c.orbit += 0.5;
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
          subtitle: `\xA7c${e.name} \xA7f${secs}s \xA75${name(other)}`
        });
        e.onScreenDisplay.setActionBar(c.age % 8 < 4 ? "\xA7e\xA7l>> MASH SNEAK / USE CONQUEROR'S HAKI <<" : "\xA76\xA7l>> MASH SNEAK / USE CONQUEROR'S HAKI <<");
      } catch {
      }
      if (c.age % 20 === 10) cinematic(e, c, 1);
    }
  }
  if (Math.abs(c.balance) >= 100 || c.age >= c.maxAge) {
    if (Math.abs(c.balance) < 5) endClash(c, void 0);
    else endClash(c, c.balance > 0 ? a : b);
    return false;
  }
  return true;
}
function autoPush(e) {
  let base = e.typeId === BOSS_ID ? bossClashPower(e) / 72 : 1;
  base *= 0.6 + Math.random() * 0.8;
  if (Math.random() < 0.03) {
    base += 10;
    for (const p of e.dimension.getPlayers({ location: e.location, maxDistance: 24 })) {
      p.sendMessage(`\xA74${BOSS_NAME}\xA7r: \xA7c${["KNEEL!", "Is that all?!", "Your will is NOTHING!", "Bow before a king!"][Math.floor(Math.random() * 4)]}`);
    }
    particle(e.dimension, "grandline:haoshoku_wave", chest(e), vars(void 0, { radius: 4 }));
  }
  return base;
}
function bystanders(c, P) {
  for (const e of c.a.dimension.getEntities({ location: P, maxDistance: 10, excludeFamilies: ["inanimate"] })) {
    if (e.id === c.a.id || e.id === c.b.id || !e.getComponent("minecraft:health")) continue;
    if (isPlayer(e)) {
      const gm = e.getGameMode();
      if (gm === GameMode2.Creative || gm === GameMode2.Spectator) continue;
      if (!power(e).has(2 /* Conqueror */)) {
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
    }
  }
}
function endClash(c, winner) {
  const i = clashes.indexOf(c);
  if (i >= 0) clashes.splice(i, 1);
  const { a, b } = c;
  const dim = a.isValid ? a.dimension : b.dimension;
  const P = a.isValid && b.isValid ? clashPoint(c) : a.isValid ? a.location : b.location;
  for (const e of [a, b]) if (e.isValid) lock(e, false);
  for (const pl of dim.getPlayers()) {
    if (c.fogged.has(pl.id)) {
      try {
        pl.runCommand(`fog @s remove ${FOG_TAG}`);
      } catch {
      }
    }
  }
  particle(dim, "grandline:haoshoku_wave_boss", P, vars(void 0, { radius: 18 }));
  particle(dim, "grandline:clash_finale", P);
  lightningBurst(dim, P, 8, 16);
  sound(dim, "mob.warden.sonic_boom", P, 5, 0.45);
  sound(dim, "random.explode", P, 3, 0.6);
  sound(dim, "ambient.weather.thunder", P, 4, 0.5);
  shakeAround(dim, P, 40, 1.6, 1.4);
  const loser = winner ? winner.id === a.id ? b : a : void 0;
  for (const e of [a, b]) {
    if (!e.isValid || !isPlayer(e)) continue;
    try {
      e.onScreenDisplay.setActionBar("");
    } catch {
    }
    if (!winner) {
      flash(e, BLACK, 0.05, 0.2, 0.6);
      title(e, "\xA77\xA7lSTALEMATE", "\xA78Neither will gave way...", 40);
    } else if (e.id === winner.id) {
      flash(e, GOLD, 0.05, 0.15, 0.7);
      title(e, "\xA7c\xA7l\u8987\u738B", "\xA76Your will prevails!", 50);
      const vsBoss = loser?.typeId === BOSS_ID;
      gainXp(e, 2 /* Conqueror */, vsBoss ? 120 : 60);
      if (c.awakening) e.sendMessage("\xA76\u2726 You overpowered a king's will with a newly awakened Conqueror's Haki!");
    } else {
      flash(e, CRIMSON, 0.05, 0.3, 0.8);
      title(e, "\xA78\xA7lDEFEATED", "\xA77Your will faltered...", 50);
      gainXp(e, 2 /* Conqueror */, 25);
    }
    try {
      e.playAnimation("animation.grandline.player.release", { blendOutTime: 0.2, controller: "grandline_pose" });
    } catch {
    }
    const camPlayer = e;
    system3.runTimeout(() => {
      try {
        if (camPlayer.isValid) camPlayer.camera.clear();
      } catch {
      }
    }, 6);
    save(e);
  }
  const knock2 = (victim, from, strength) => {
    const away = V.norm(V.flat(V.sub(victim.location, from.location)));
    try {
      victim.applyKnockback({ x: away.x * strength, z: away.z * strength }, 0.55);
    } catch {
    }
  };
  if (winner && loser && loser.isValid) {
    knock2(loser, winner, 2.6);
    const winPower = clashPower(winner, c);
    const dmg = loser.typeId === BOSS_ID ? maxHealth(loser) * 0.08 : 4 + winPower * 0.06;
    trueDamage(loser, dmg, winner);
    knockOut(loser, loser.typeId === BOSS_ID ? 80 : 50);
    particle(dim, "grandline:ko_stars", V.up(loser.location, 2.1));
    if (loser.typeId === BOSS_ID) {
      for (const p of dim.getPlayers({ location: loser.location, maxDistance: 32 })) {
        p.sendMessage(`\xA74${BOSS_NAME}\xA7r: \xA7c...Impossible! My will... \xA77(He's stunned \u2014 strike now!)`);
      }
    }
  } else if (a.isValid && b.isValid) {
    knock2(a, b, 1.4);
    knock2(b, a, 1.4);
  }
  if (winner?.isValid) bolt(dim, chest(winner), V.up(winner.location, 25), { width: 0.4, segments: 12, branches: 3, color: RED });
}
function tickClashes() {
  for (const c of [...clashes]) tickClash(c);
}

// scripts-src/combat.ts
import {
  EntityDamageCause as EntityDamageCause2,
  EquipmentSlot,
  system as system4,
  world as world2
} from "@minecraft/server";
var bypass = /* @__PURE__ */ new Map();
function markBypass(e) {
  bypass.set(e.id, system4.currentTick);
}
var BLACK_BLADE = "grandline:black_blade";
var JITTE = "grandline:seastone_jitte";
function mainhand(e) {
  try {
    return e.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand)?.typeId;
  } catch {
    return void 0;
  }
}
function isCoated(attacker, melee) {
  if (isPlayer(attacker)) {
    if (power(attacker).armOn) return true;
    if (melee) {
      const held = mainhand(attacker);
      return held === BLACK_BLADE || held === JITTE;
    }
    return false;
  }
  return attacker.typeId === BOSS_ID;
}
function isSealed(e) {
  return e.hasTag("gl_seastone") || e.isInWater;
}
function isLogiaPirate(e) {
  return e.typeId === PIRATE_ID && e.hasTag("gl_logia");
}
function onBeforeHurt(ev) {
  const target = ev.hurtEntity;
  const src = ev.damageSource;
  const now = system4.currentTick;
  if (bypass.get(target.id) === now) return;
  if (isPlayer(target)) {
    const p = power(target);
    const fruit = p.fruit();
    if (fruit && !target.hasTag("gl_seastone")) {
      const c = src.cause;
      if (c === EntityDamageCause2.lightning && (fruit.key === "goro" || fruit.key === "gomu")) {
        ev.cancel = true;
        return;
      }
      if ((c === EntityDamageCause2.fire || c === EntityDamageCause2.fireTick || c === EntityDamageCause2.lava || c === EntityDamageCause2.magma) && fruit.key === "mera") {
        ev.cancel = true;
        return;
      }
      if (c === EntityDamageCause2.fall && fruit.key === "gomu") {
        ev.cancel = true;
        return;
      }
      if (c === EntityDamageCause2.freezing && fruit.key === "hie") {
        ev.cancel = true;
        return;
      }
    }
  }
  const attacker = src.damagingEntity;
  if (!attacker || attacker.id === target.id) return;
  const melee = src.cause === EntityDamageCause2.entityAttack && !src.damagingProjectile && abilityHits.get(target.id) !== now;
  const coated = isCoated(attacker, melee);
  if (isPlayer(target)) {
    const p = power(target);
    if (p.obsOn && p.has(1 /* Observation */) && !isKnockedOut(target) && !clashOf(target)) {
      const lvl = p.level(1 /* Observation */);
      const futureSight = p.hasTech("future_sight") && p.futureSightCd <= 0;
      const undodgeable = bossUndodgeable(attacker);
      const chance = p.hasTech("evasion") ? Math.min(0.45, 0.15 + lvl * 3e-3) : 0.06;
      if (futureSight || !undodgeable && p.saved.haki >= 4 && Math.random() < chance) {
        ev.cancel = true;
        system4.run(() => onDodge(target, attacker, futureSight));
        return;
      }
    }
    const fruit = p.fruit();
    if (fruit && fruit.cls === "Logia" && !isSealed(target) && !coated && p.saved.stamina >= 3) {
      ev.cancel = true;
      system4.run(() => onIntangible(target, attacker, fruit.key));
      return;
    }
  } else if (isLogiaPirate(target) && !coated) {
    ev.cancel = true;
    system4.run(() => onIntangible(target, attacker, "mera"));
    return;
  }
  if (target.typeId === BOSS_ID && isPlayer(attacker) && !isKnockedOut(target) && !clashOf(target)) {
    const p = power(attacker);
    const dodge = p.obsOn ? 0.08 : 0.3;
    if (Math.random() < dodge) {
      ev.cancel = true;
      system4.run(() => onBossDodge(target, attacker, p.obsOn));
      return;
    }
    if (!coated) {
      ev.damage *= 0.25;
      system4.run(() => hint(attacker, `\xA7c${BOSS_NAME}'s Armament blocks your blow! \xA77Coat yourself with \xA75Armament Haki`));
    }
  }
  let dmg = ev.damage;
  if (isPlayer(attacker)) {
    const p = power(attacker);
    if (p.armOn && melee) {
      const lvl = p.level(0 /* Armament */);
      dmg += 1.5 + lvl * 0.06;
      if (p.hasTech("ryou")) {
        let armored = target.typeId === BOSS_ID;
        try {
          armored = armored || (target.getComponent("minecraft:equippable")?.totalArmor ?? 0) >= 8;
        } catch {
        }
        if (isPlayer(target) && power(target).armOn) armored = true;
        if (armored) dmg *= 1.3;
      }
      if (p.hasTech("infusion")) dmg *= 1.25;
    }
    if (p.counterTicks > 0 && melee) {
      dmg *= 1.6;
      p.counterTicks = 0;
      system4.run(() => {
        particle(target.dimension, "grandline:counter_flash", chest(target));
        sound(target.dimension, "random.anvil_land", target.location, 0.4, 1.8);
      });
    }
  }
  if (isPlayer(target)) {
    const p = power(target);
    if (p.armOn && p.hasTech("full_body")) dmg *= 1 - Math.min(0.35, 0.1 + p.level(0 /* Armament */) * 3e-3);
  }
  const bw = brokenWill.get(target.id);
  if (bw !== void 0 && bw > now) dmg *= 1.15;
  ev.damage = dmg;
}
function onAfterHurt(ev) {
  const target = ev.hurtEntity;
  const src = ev.damageSource;
  const attacker = src.damagingEntity;
  const now = system4.currentTick;
  if (!target.isValid) return;
  const ability = abilityHits.get(target.id) === now;
  const melee = src.cause === EntityDamageCause2.entityAttack && !src.damagingProjectile && !ability;
  if (target.typeId === BOSS_ID) onBossHurt(target, ev.damage, attacker);
  if (attacker && isPlayer(attacker) && attacker.id !== target.id && ev.damage > 0) {
    const p = power(attacker);
    if (melee) {
      if (!p.has(0 /* Armament */)) {
        const bare = !mainhand(attacker);
        p.saved.armProg += ev.damage * (bare ? 2 : 1);
        p.dirty = true;
        if (p.saved.armProg >= ARMAMENT_AWAKEN) awaken(attacker, 0 /* Armament */, "Your fists have hardened through countless battles.");
      } else if (p.armOn) {
        gainXp(attacker, 0 /* Armament */, 2 + ev.damage * 0.3);
        coatedHitFx(attacker, target, p.hasTech("infusion"));
        if (p.hasTech("emission")) emission(attacker, target, ev.damage);
        if (p.hasTech("infusion")) infusionArc(attacker, target, ev.damage);
      }
      if (p.armOn && p.hasTech("infusion") && p.clashMeleeCd <= 0 && !clashOf(attacker) && !clashOf(target)) {
        const targetInfused = target.typeId === BOSS_ID || isPlayer(target) && power(target).armOn && power(target).hasTech("infusion");
        const theyHitMe = p.lastHitBy && p.lastHitBy.id === target.id && now - p.lastHitBy.tick <= 15;
        if (targetInfused && theyHitMe && Math.random() < 0.35) {
          p.clashMeleeCd = 300;
          startClash(attacker, target, false);
        }
      }
    }
    if (ability) p.addFruitXp(2 + ev.damage * 0.25);
  }
  if (isPlayer(target) && attacker && attacker.id !== target.id) {
    const p = power(target);
    p.lastHitBy = { id: attacker.id, tick: now };
    if (!p.has(1 /* Observation */)) {
      p.saved.obsProg++;
      p.dirty = true;
      if (p.saved.obsProg >= OBSERVATION_AWAKEN) awaken(target, 1 /* Observation */, "You've taken so many hits that you can feel the next one coming.");
    } else if (p.obsOn) {
      gainXp(target, 1 /* Observation */, 1);
    }
    if (p.hasTech("khans_wrath") && p.khanCd <= 0 && health(target) < maxHealth(target) * 0.3) khansWrath(target);
  }
}
function onDodge(player, attacker, futureSight) {
  const p = power(player);
  if (futureSight) p.futureSightCd = 120;
  else p.saved.haki = Math.max(0, p.saved.haki - 4);
  if (p.hasTech("counter")) p.counterTicks = 60;
  gainXp(player, 1 /* Observation */, futureSight ? 4 : 6);
  const away = V.norm(V.flat(V.sub(player.location, attacker.location)));
  const side = V.cross(away, V.of(0, 1, 0));
  const dir = V.norm(V.add(V.scale(side, Math.random() < 0.5 ? 1 : -1), V.scale(away, 0.4)));
  try {
    player.applyKnockback({ x: dir.x * 0.9, z: dir.z * 0.9 }, 0.15);
  } catch {
  }
  particle(player.dimension, "grandline:dodge_afterimage", player.location, vars(futureSight ? { red: 1, green: 0.4, blue: 1 } : CYAN));
  sound(player.dimension, "mob.illusioner.mirror_move", player.location, 1, futureSight ? 0.7 : 1.3);
  notice(player, futureSight ? "\xA7d\xA7l\u672A\u6765\u8996 \xA7r\xA7dFuture Sight!" : "\xA7b\u2726 Dodged!", 20);
  if (isPlayer(attacker)) notice(attacker, "\xA77They read your attack...", 20);
}
function onIntangible(target, attacker, element) {
  const at = chest(target);
  if (isPlayer(target)) {
    const p = power(target);
    p.saved.stamina = Math.max(0, p.saved.stamina - 3);
  }
  particle(target.dimension, `grandline:logia_${element}`, at);
  const snd = { mera: "mob.blaze.shoot", hie: "random.glass", goro: "random.fizz", pika: "beacon.power" };
  sound(target.dimension, snd[element] ?? "random.fizz", at, 0.6, 1.4);
  if (isPlayer(attacker)) hint(attacker, "\xA76Your attack passed right through! \xA77Coat it with \xA75Armament Haki\xA77 (or Seastone)");
}
function onBossDodge(boss, player, hadObservation) {
  particle(boss.dimension, "grandline:dodge_afterimage", boss.location, vars(RED));
  sound(boss.dimension, "mob.illusioner.mirror_move", boss.location, 1, 0.8);
  hint(player, hadObservation ? "\xA7cVarek read your attack." : "\xA7cVarek saw that coming! \xA77Use \xA7bObservation Haki\xA77 to read his moves");
}
function hint(player, text) {
  const p = power(player);
  if (p.hintCd > 0) return;
  p.hintCd = 60;
  notice(player, text, 50);
}
function coatedHitFx(attacker, target, infused) {
  const at = chest(target);
  particle(target.dimension, "grandline:armament_impact", at);
  if (infused) {
    for (let i = 0; i < 3; i++) bolt(target.dimension, at, V.add(at, V.scale(V.randUnit(), 1.6)), { width: 0.1, branches: 0 });
    sound(target.dimension, "ambient.weather.lightning.impact", at, 0.35, 1.6);
  }
  sound(attacker.dimension, "random.anvil_land", at, 0.15, 1.9);
}
function emission(attacker, target, dmg) {
  const dir = V.norm(V.flat(V.sub(target.location, attacker.location)));
  const origin = target.location;
  particle(target.dimension, "grandline:emission_wave", V.up(V.add(origin, V.scale(dir, 1.2)), 1), vars(void 0, { dx: dir.x, dz: dir.z }));
  for (const e of target.dimension.getEntities({ location: V.add(origin, V.scale(dir, 2)), maxDistance: 2.5, excludeFamilies: ["inanimate"] })) {
    if (e.id === target.id || e.id === attacker.id || !e.getComponent("minecraft:health")) continue;
    abilityDamage(e, dmg * 0.4, attacker);
    try {
      e.applyKnockback({ x: dir.x * 1.2, z: dir.z * 1.2 }, 0.3);
    } catch {
    }
  }
}
function infusionArc(attacker, target, dmg) {
  const near = target.dimension.getEntities({ location: target.location, maxDistance: 5, excludeFamilies: ["inanimate"], closest: 4 });
  for (const e of near) {
    if (e.id === target.id || e.id === attacker.id || !e.getComponent("minecraft:health")) continue;
    if (isPlayer(e) && e.getGameMode() !== "Survival" && e.getGameMode() !== "Adventure") continue;
    bolt(target.dimension, chest(target), chest(e), { width: 0.14, branches: 1 });
    abilityDamage(e, dmg * 0.35, attacker);
    break;
  }
}
function initCombat() {
  world2.beforeEvents.entityHurt.subscribe(onBeforeHurt);
  world2.afterEvents.entityHurt.subscribe(onAfterHurt);
}

// scripts-src/haki.ts
var knockedOut = /* @__PURE__ */ new Map();
var brokenWill = /* @__PURE__ */ new Map();
var BOSSLIKE = /* @__PURE__ */ new Set([
  "minecraft:ender_dragon",
  "minecraft:wither",
  "minecraft:warden",
  "minecraft:elder_guardian",
  BOSS_ID
]);
function isBossLike(e) {
  return BOSSLIKE.has(e.typeId);
}
function maxHealth(e) {
  try {
    return e.getComponent("minecraft:health")?.effectiveMax ?? 20;
  } catch {
    return 20;
  }
}
function health(e) {
  try {
    return e.getComponent("minecraft:health")?.currentValue ?? 0;
  } catch {
    return 0;
  }
}
function willOf(e) {
  if (isPlayer(e)) {
    const p = power(e);
    let w = 15 + (p.level(0 /* Armament */) + p.level(1 /* Observation */)) * 0.6;
    if (p.has(2 /* Conqueror */)) w += 60 + p.level(2 /* Conqueror */);
    if (p.obsOn) w += 10;
    return w;
  }
  let armor = 0;
  try {
    armor = e.getComponent("minecraft:equippable")?.totalArmor ?? 0;
  } catch {
    armor = 0;
  }
  return maxHealth(e) + armor * 1.5;
}
function conquerorPower(p) {
  return 26 + p.level(2 /* Conqueror */) * 1.5;
}
function isKnockedOut(e) {
  const until = knockedOut.get(e.id);
  return until !== void 0 && until > system5.currentTick;
}
function knockOut(e, ticks) {
  if (!e.isValid) return;
  const until = system5.currentTick + ticks;
  knockedOut.set(e.id, Math.max(knockedOut.get(e.id) ?? 0, until));
  const opts = { amplifier: 255, showParticles: false };
  try {
    e.addEffect("slowness", ticks, opts);
    e.addEffect("weakness", ticks, opts);
    e.addEffect("mining_fatigue", ticks, { amplifier: 5, showParticles: false });
    if (isPlayer(e)) {
      e.addEffect("blindness", Math.min(ticks, 60), { amplifier: 0, showParticles: false });
      e.addEffect("nausea", ticks + 40, { amplifier: 0, showParticles: false });
      title(e, "\xA78\xA7l. . .", "\xA77Your consciousness fades...", Math.max(10, ticks - 10), 5, 10);
      e.playAnimation("animation.grandline.player.ko", {
        controller: "grandline_pose",
        blendOutTime: 0.4,
        stopExpression: `query.anim_time >= ${(ticks / 20).toFixed(2)}`
      });
    } else if (e.typeId === BOSS_ID || e.typeId === PIRATE_ID) {
      e.triggerEvent("grandline:stunned");
      system5.runTimeout(() => {
        if (e.isValid) e.triggerEvent("grandline:recover");
      }, ticks);
    }
  } catch {
  }
  particle(e.dimension, "grandline:ko_stars", V.up(e.location, 2.1));
}
function tickKnockouts() {
  const now = system5.currentTick;
  for (const [id, until] of knockedOut) {
    if (until <= now) knockedOut.delete(id);
  }
  for (const [id, until] of brokenWill) {
    if (until <= now) brokenWill.delete(id);
  }
}
function giveBound(player, itemId, name2, lore) {
  const inv = player.getComponent("minecraft:inventory")?.container;
  if (!inv) return;
  for (let i = 0; i < inv.size; i++) {
    if (inv.getItem(i)?.typeId === itemId) return;
  }
  const stack = new ItemStack(itemId, 1);
  stack.keepOnDeath = true;
  stack.lockMode = ItemLockMode.inventory;
  if (name2) stack.nameTag = name2;
  if (lore) stack.setLore(lore);
  const left = inv.addItem(stack);
  if (left) player.dimension.spawnItem(left, player.location);
}
function removeItems(player, predicate) {
  const inv = player.getComponent("minecraft:inventory")?.container;
  if (!inv) return;
  for (let i = 0; i < inv.size; i++) {
    const it = inv.getItem(i);
    if (it && predicate(it.typeId)) inv.setItem(i, void 0);
  }
}
function hakiItemLore(h) {
  switch (h) {
    case 0 /* Armament */:
      return ["\xA77Use: \xA7fcoat yourself in black steel", "\xA78Hits Logia users and breaks enemy Armament"];
    case 1 /* Observation */:
      return ["\xA77Use: \xA7fopen your senses", "\xA78Sense enemies, dodge attacks, see the future"];
    case 2 /* Conqueror */:
      return ["\xA77Use: \xA7crelease your will", "\xA78During a clash: tap or press Sneak rapidly!"];
  }
}
function awaken(player, h, reason) {
  const p = power(player);
  if (p.has(h)) return;
  p.saved.unlocked[h] = true;
  p.dirty = true;
  save(player, p);
  const info = HAKI[h];
  title(player, `${info.color}\xA7l${info.kanji}`, `${info.color}${info.name} \xA7fAWAKENED`, 70, 5, 20);
  player.sendMessage(`\xA76\u2726 \xA7l${info.name} awakened!\xA7r \xA77${reason}`);
  player.sendMessage(`\xA77  ${hakiItemLore(h).join(" \xA78| ")}`);
  const color = h === 2 /* Conqueror */ ? RED : h === 0 /* Armament */ ? { red: 0.55, green: 0.3, blue: 0.9 } : { red: 0.3, green: 0.85, blue: 1 };
  particle(player.dimension, "grandline:awaken_pillar", player.location, vars(color));
  sound(player.dimension, "random.totem", player.location, 0.8, 0.8);
  sound(player.dimension, "ambient.weather.thunder", player.location, 0.6, 1.4);
  flash(player, h === 2 /* Conqueror */ ? CRIMSON : BLACK, 0.05, 0.15, 0.8);
  shake(player, 0.6, 0.8);
  giveBound(player, info.item, void 0, hakiItemLore(h));
  if (h === 2 /* Conqueror */) lightningBurst(player.dimension, chest(player), 4, 6);
}
function onLevelUp(player, h, level) {
  const info = HAKI[h];
  notice(player, `${info.color}${info.name} \xA7fmastery \xA7e${level}`, 50);
  sound(player.dimension, "random.levelup", player.location, 0.5, 1.4);
  for (const t of TECHNIQUES) {
    if (t.haki === h && t.level === level) {
      title(player, `${info.color}\xA7l${t.kanji}`, `\xA7fNew technique: ${info.color}${t.name}`, 50);
      player.sendMessage(`\xA76\u2726 New technique: ${info.color}\xA7l${t.name}\xA7r ${t.card ? `\xA78(${t.card})` : ""}
\xA77  ${t.desc}`);
    }
  }
}
function gainXp(player, h, amount) {
  const lvl = power(player).addXp(h, amount);
  if (lvl !== void 0) onLevelUp(player, h, lvl);
}
function toggleArmament(player) {
  const p = power(player);
  if (!p.has(0 /* Armament */)) {
    notice(player, `\xA77Armament Haki is still asleep... \xA78(deal melee damage: ${Math.floor(p.saved.armProg)}/${ARMAMENT_AWAKEN})`);
    return;
  }
  if (!p.armOn && p.saved.haki < 5) {
    notice(player, "\xA75Not enough Haki!");
    return;
  }
  p.armOn = !p.armOn;
  p.dirty = true;
  if (p.armOn) {
    sound(player.dimension, "armor.equip_netherite", player.location, 1, 0.7);
    sound(player.dimension, "random.anvil_land", player.location, 0.25, 1.6);
    particle(player.dimension, "grandline:armament_burst", chest(player));
    notice(player, "\xA75\xA7l\u6B66\u88C5\u8272 \xA7r\xA7fArmament Haki \xA7aON", 30);
  } else {
    sound(player.dimension, "armor.equip_generic", player.location, 0.8, 0.8);
    notice(player, "\xA75Armament Haki \xA77off", 25);
  }
}
function toggleObservation(player) {
  const p = power(player);
  if (!p.has(1 /* Observation */)) {
    notice(player, `\xA77Observation Haki is still asleep... \xA78(survive hits: ${p.saved.obsProg}/${OBSERVATION_AWAKEN})`);
    return;
  }
  if (!p.obsOn && p.saved.haki < 5) {
    notice(player, "\xA7bNot enough Haki!");
    return;
  }
  p.obsOn = !p.obsOn;
  p.dirty = true;
  if (p.obsOn) {
    sound(player.dimension, "block.amethyst_block.chime", player.location, 1.2, 0.6);
    sound(player.dimension, "beacon.activate", player.location, 0.5, 1.8);
    particle(player.dimension, "grandline:observation_pulse", player.location);
    notice(player, "\xA7b\xA7l\u898B\u805E\u8272 \xA7r\xA7fObservation Haki \xA7aON", 30);
  } else {
    sound(player.dimension, "beacon.deactivate", player.location, 0.5, 1.8);
    notice(player, "\xA7bObservation Haki \xA77off", 25);
  }
}
function useConqueror(player) {
  if (clashOf(player)) {
    pushClash(player);
    return;
  }
  const p = power(player);
  if (!p.has(2 /* Conqueror */)) {
    notice(player, "\xA77Only those with the qualities of a king can use Conqueror's Haki... \xA78(defeat the Crimson King)");
    return;
  }
  if (p.conqCd > 0) {
    notice(player, `\xA7cConqueror's Haki recovering: \xA7f${Math.ceil(p.conqCd / 20)}s`);
    return;
  }
  if (p.saved.haki < 30) {
    notice(player, "\xA7cNot enough Haki! \xA77(30 needed)");
    return;
  }
  if (isKnockedOut(player)) return;
  const lvl = p.level(2 /* Conqueror */);
  p.saved.haki -= 30;
  p.conqCdMax = Math.max(140, 300 - Math.floor(lvl * 1.5));
  p.conqCd = p.conqCdMax;
  p.dirty = true;
  const radius = 8 + lvl * 0.12;
  burst(player, conquerorPower(p), radius, false);
}
function burst(user, pw, radius, isBoss) {
  const dim = user.dimension;
  const center = user.location;
  const userPower = isPlayer(user) ? power(user) : void 0;
  try {
    user.playAnimation(isPlayer(user) ? "animation.grandline.player.haoshoku" : "animation.grandline.captain.roar", { blendOutTime: 0.4, controller: "grandline_pose" });
  } catch {
  }
  particle(dim, isBoss ? "grandline:haoshoku_wave_boss" : "grandline:haoshoku_wave", V.up(center, 1.1), vars(void 0, { radius }));
  particle(dim, "grandline:shockwave_ring", V.up(center, 0.15), vars(CRIMSON, { radius }));
  lightningBurst(dim, chest(user), Math.min(6, radius * 0.45), isBoss ? 10 : 7);
  for (let i = 0; i < (isBoss ? 3 : 2); i++) {
    const top = V.add(center, V.of((Math.random() - 0.5) * radius, 18 + Math.random() * 10, (Math.random() - 0.5) * radius));
    bolt(dim, V.up(center, 2), top, { width: 0.3, segments: 12, branches: 3, jitter: 0.1 });
  }
  sound(dim, "mob.warden.sonic_boom", center, 3, isBoss ? 0.5 : 0.65);
  sound(dim, "ambient.weather.thunder", center, 2.5, isBoss ? 0.5 : 0.7);
  sound(dim, "mob.enderdragon.growl", center, 0.6, isBoss ? 0.5 : 0.8);
  shakeAround(dim, center, radius * 2.2, isBoss ? 1.4 : 1, 1.1);
  for (const pl of dim.getPlayers({ location: center, maxDistance: radius * 1.6 })) {
    flash(pl, CRIMSON, 0.04, 0.06, 0.45);
  }
  const targets2 = dim.getEntities({
    location: center,
    maxDistance: radius,
    excludeFamilies: ["inanimate"],
    excludeTypes: ["minecraft:item", "minecraft:xp_orb", "minecraft:arrow", "minecraft:armor_stand"]
  });
  let clashTarget;
  let clashDist = Infinity;
  let knocked = 0;
  const decree = userPower?.hasTech("imperial_decree") ?? isBoss;
  for (const t of targets2) {
    if (t.id === user.id || !t.isValid) continue;
    if (!t.getComponent("minecraft:health")) continue;
    if (isAlly(user, t)) continue;
    if (isPlayer(t)) {
      const gm = t.getGameMode();
      if (gm === "Creative" || gm === "Spectator") continue;
    }
    const d = V.dist(t.location, center);
    const tIsConqueror = isPlayer(t) && power(t).has(2 /* Conqueror */) && power(t).saved.haki >= 10 || t.typeId === BOSS_ID;
    if (tIsConqueror && !clashOf(t) && d < clashDist) {
      clashTarget = t;
      clashDist = d;
      continue;
    }
    if (isPlayer(t) && isBoss) {
      bossBurstOnPlayer(user, t, pw);
      continue;
    }
    const will = willOf(t);
    if (isBossLike(t)) {
      t.addEffect("slowness", 60, { amplifier: 1, showParticles: false });
      continue;
    }
    if (will <= pw) {
      knockOut(t, Math.round(100 + pw));
      knocked++;
    } else {
      t.addEffect("slowness", 70, { amplifier: 2, showParticles: false });
      t.addEffect("weakness", 70, { amplifier: 0, showParticles: false });
      if (isPlayer(t)) {
        t.addEffect("nausea", 80, { amplifier: 0, showParticles: false });
        notice(t, "\xA7cAn overwhelming will washes over you...");
      }
      if (decree) {
        t.addEffect("slowness", 60, { amplifier: 255, showParticles: false });
        brokenWill.set(t.id, system5.currentTick + 200);
        particle(dim, "grandline:bind_chains", t.location);
      }
    }
  }
  if (isPlayer(user)) {
    const p = power(user);
    gainXp(user, 2 /* Conqueror */, 6 + knocked * 4);
    p.dirty = true;
    if (knocked > 0) notice(user, `\xA7c\xA7l\u8987\u738B\u8272 \xA7r\xA7fKnocked out \xA7c${knocked}\xA7f enemies`, 40);
  }
  if (clashTarget) {
    const awakened = false;
    system5.runTimeout(() => {
      if (user.isValid && clashTarget && clashTarget.isValid) startClash(user, clashTarget, awakened);
    }, 6);
  }
}
function bossBurstOnPlayer(boss, player, pw) {
  const p = power(player);
  const canAwaken = p.has(0 /* Armament */) && p.has(1 /* Observation */) && p.level(0 /* Armament */) + p.level(1 /* Observation */) >= 30;
  if (canAwaken && (Math.random() < 0.35 || p.saved.resisted >= 2)) {
    awaken(player, 2 /* Conqueror */, "Your will refused to break before a king!");
    player.sendMessage("\xA74Varek\xA7r: \xA7c...Ha! So you have it too. Show me your will!");
    system5.runTimeout(() => {
      if (boss.isValid && player.isValid) startClash(boss, player, true);
    }, 30);
    return;
  }
  const will = willOf(player);
  if (will < pw * 0.6) {
    knockOut(player, 60);
    player.sendMessage("\xA74Varek\xA7r: \xA77Weak. Come back when your will can stand before mine.");
  } else {
    p.saved.resisted++;
    p.dirty = true;
    player.addEffect("slowness", 80, { amplifier: 2, showParticles: false });
    player.addEffect("nausea", 100, { amplifier: 0, showParticles: false });
    notice(player, "\xA76You withstood the Conqueror's Haki! \xA77Your will is growing...", 60);
    if (canAwaken) player.sendMessage("\xA78Something inside you stirs... (keep resisting his Conqueror's Haki)");
  }
}
function isAlly(a, b) {
  const pirate = (e) => e.typeId === BOSS_ID || e.typeId === PIRATE_ID;
  return pirate(a) && pirate(b);
}
function khansWrath(player) {
  const p = power(player);
  p.khanCd = 1800;
  const dim = player.dimension;
  title(player, "\xA74\xA7l\u8987\u738B\u306E\u6012\u308A", "\xA7cKhan's Wrath!", 30, 2, 10);
  particle(dim, "grandline:haoshoku_wave", V.up(player.location, 1.1), vars(void 0, { radius: 9 }));
  lightningBurst(dim, chest(player), 6, 10);
  sound(dim, "mob.warden.sonic_boom", player.location, 3, 0.5);
  shakeAround(dim, player.location, 20, 1.2, 1);
  for (const t of dim.getEntities({ location: player.location, maxDistance: 9, excludeFamilies: ["inanimate"] })) {
    if (t.id === player.id || !t.getComponent("minecraft:health")) continue;
    if (isPlayer(t) && (t.getGameMode() === "Creative" || t.getGameMode() === "Spectator")) continue;
    knockOut(t, isBossLike(t) ? 60 : 200);
  }
}
function abilityDamage(target, amount, attacker, cause = EntityDamageCause3.entityAttack) {
  if (!target.isValid) return false;
  markAbility(target);
  try {
    return target.applyDamage(amount, { cause, damagingEntity: attacker });
  } catch {
    return false;
  }
}
function trueDamage(target, amount, attacker) {
  if (!target.isValid) return;
  markBypass(target);
  try {
    target.applyDamage(amount, { cause: EntityDamageCause3.entityAttack, damagingEntity: attacker });
  } catch {
  }
}
var abilityHits = /* @__PURE__ */ new Map();
function markAbility(target) {
  abilityHits.set(target.id, system5.currentTick);
}

// scripts-src/fruits.ts
import { EntityDamageCause as EntityDamageCause4, GameMode as GameMode3, system as system6, world as world3 } from "@minecraft/server";
var SKIN = { red: 0.93, green: 0.72, blue: 0.56 };
var sealed = /* @__PURE__ */ new Map();
function seal(e, ticks) {
  sealed.set(e.id, Math.max(sealed.get(e.id) ?? 0, system6.currentTick + ticks));
  e.addTag("gl_seastone");
  if (isPlayer(e) && power(e).fruit()) notice(e, "\xA73Seastone saps your Devil Fruit power...", 40);
  particle(e.dimension, "grandline:seastone_drain", chest(e));
}
function scale(p) {
  return 1 + p.fruitLevel() / 100;
}
function moveLore(f, i) {
  const m = f.moves[i];
  return [`\xA77${m.desc}`, `\xA78Cooldown ${(m.cooldown / 20).toFixed(1)}s \xB7 Stamina ${m.stamina}`, `${f.color}${f.name}`];
}
function syncSkillItems(player) {
  const f = power(player).fruit();
  const keep = new Set(f ? f.moves.map((m) => m.item) : []);
  removeItems(player, (id) => id.startsWith("grandline:skill_") && !keep.has(id));
  if (f) f.moves.forEach((m, i) => giveBound(player, m.item, `${f.color}\xA7l${m.name}`, moveLore(f, i)));
}
function eatFruit(player, fruitKey) {
  const f = fruitByKey(fruitKey);
  if (!f) return;
  const p = power(player);
  if (p.saved.fruit) {
    if (player.getGameMode() === GameMode3.Creative) {
      player.sendMessage("\xA7cYour body rejects a second Devil Fruit! \xA77(Creative mode spared you.) Use \xA7f/grandline:fruit none\xA77 to reset.");
      return;
    }
    player.sendMessage("\xA74Your body tears itself apart trying to hold the power of two Devil Fruits!");
    particle(player.dimension, "grandline:fruit_rejection", chest(player));
    sound(player.dimension, "random.explode", player.location, 1.5, 0.8);
    flash(player, CRIMSON, 0.05, 0.4, 1.5);
    system6.runTimeout(() => {
      if (player.isValid) player.kill();
    }, 4);
    return;
  }
  p.saved.fruit = f.key;
  p.saved.fruitXp = 0;
  p.dirty = true;
  save(player, p);
  title(player, `${f.color}\xA7l${f.jp}`, `${f.color}${f.name} \xA77\u2014 ${f.cls}`, 70, 5, 20);
  player.sendMessage(`\xA77Ugh... it tastes horrible. \xA7fBut power surges through your body!`);
  player.sendMessage(`${f.color}\xA7l${f.name}\xA7r \xA78(${f.cls})\xA7r
\xA77${f.passive}
\xA7c\u26A0 You can no longer swim. The sea will drain your strength.`);
  f.moves.forEach((m, i) => player.sendMessage(`\xA78 ${i + 1}. ${f.color}${m.name}\xA77 \u2014 ${m.desc}`));
  particle(player.dimension, "grandline:fruit_power", player.location, vars(f.rgb));
  sound(player.dimension, "random.burp", player.location, 1, 0.8);
  sound(player.dimension, "beacon.power", player.location, 1, 0.7);
  flash(player, f.rgb, 0.1, 0.2, 0.8);
  syncSkillItems(player);
}
function removeFruit(player) {
  const p = power(player);
  p.saved.fruit = "";
  p.saved.fruitXp = 0;
  p.dirty = true;
  save(player, p);
  syncSkillItems(player);
}
var channels = /* @__PURE__ */ new Map();
var rubberFists = /* @__PURE__ */ new Map();
function useSkill(player, fruitKey, slot) {
  const p = power(player);
  const f = p.fruit();
  if (!f || f.key !== fruitKey) {
    notice(player, "\xA77This power doesn't belong to you anymore.");
    syncSkillItems(player);
    return;
  }
  if (clashOf(player) || isKnockedOut(player)) return;
  if (player.hasTag("gl_seastone")) {
    notice(player, "\xA73Seastone seals your power!");
    return;
  }
  if (player.isInWater) {
    notice(player, "\xA79The sea drains your power... you can't use it here!");
    return;
  }
  if (channels.has(player.id)) return;
  const m = f.moves[slot];
  if (p.moveCd[slot] > 0) {
    notice(player, `${f.color}${m.name} \xA77ready in \xA7f${(p.moveCd[slot] / 20).toFixed(1)}s`, 20);
    return;
  }
  if (p.saved.stamina < m.stamina) {
    notice(player, `\xA7eNot enough stamina! \xA77(${m.stamina} needed)`, 30);
    return;
  }
  p.saved.stamina -= m.stamina;
  p.moveCd[slot] = m.cooldown;
  p.dirty = true;
  try {
    player.startItemCooldown(`grandline_${f.key}_${slot + 1}`, m.cooldown);
  } catch {
  }
  p.addFruitXp(3);
  const s = scale(p);
  const run = MOVES[f.key]?.[slot];
  if (run) run(player, s);
}
function eye(player) {
  return player.getHeadLocation();
}
function spread(dir, deg) {
  if (deg <= 0) return dir;
  const r = deg * Math.PI / 180;
  return V.norm(V.add(dir, V.scale(V.randUnit(), Math.tan(r))));
}
function rotateYaw(dir, deg) {
  const r = deg * Math.PI / 180;
  const c = Math.cos(r);
  const sn = Math.sin(r);
  return V.norm({ x: dir.x * c - dir.z * sn, y: dir.y, z: dir.x * sn + dir.z * c });
}
function shoot(player, id, speed, damage, kind, dir = player.getViewDirection()) {
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
    return void 0;
  }
}
function cone(player, range, minDot) {
  const origin = eye(player);
  const dir = player.getViewDirection();
  const out = [];
  for (const e of player.dimension.getEntities({ location: player.location, maxDistance: range + 1, excludeFamilies: ["inanimate"] })) {
    if (!validTarget(player, e)) continue;
    const to = V.sub(chest(e), origin);
    const d = V.len(to);
    if (d > range || d < 0.01) continue;
    if (V.dot(V.scale(to, 1 / d), dir) >= minDot) out.push(e);
  }
  return out;
}
function around(player, center, r) {
  return player.dimension.getEntities({ location: center, maxDistance: r, excludeFamilies: ["inanimate"] }).filter((e) => validTarget(player, e));
}
function validTarget(player, e) {
  if (e.id === player.id || !e.isValid || !e.getComponent("minecraft:health")) return false;
  if (e.typeId === "minecraft:item" || e.typeId === "minecraft:xp_orb") return false;
  if (isPlayer(e)) {
    const gm = e.getGameMode();
    if (gm === GameMode3.Creative || gm === GameMode3.Spectator) return false;
  }
  try {
    const tame = e.getComponent("minecraft:tameable");
    if (tame?.tamedToPlayerId === player.id) return false;
  } catch {
  }
  return true;
}
function knock(e, dir, h, v) {
  try {
    e.applyKnockback({ x: dir.x * h, z: dir.z * h }, v);
  } catch {
  }
}
function blockAhead(player, range) {
  const dir = player.getViewDirection();
  const hit = player.getBlockFromViewDirection({ maxDistance: range });
  if (hit) return V.add(hit.block.location, hit.faceLocation);
  return V.add(eye(player), V.scale(dir, range));
}
function dashTarget(player, range) {
  const dir = player.getViewDirection();
  const start = player.location;
  const hit = player.dimension.getBlockFromRay(V.up(start, 0.9), dir, { maxDistance: range });
  const dist = hit ? Math.max(0, V.dist(V.up(start, 0.9), V.add(hit.block.location, hit.faceLocation)) - 1.2) : range;
  return V.add(start, V.scale(dir, dist));
}
var MOVES = {
  gomu: [
    // Gum-Gum Pistol
    (player, s) => {
      const fist = shoot(player, "grandline:rubber_fist", 2.4, 7 * s, "rubber");
      if (fist) {
        rubberFists.set(fist.id, { fist, owner: player });
        system6.runTimeout(() => {
          rubberFists.delete(fist.id);
          try {
            if (fist.isValid) fist.remove();
          } catch {
          }
        }, 9);
      }
      sound(player.dimension, "random.bow", player.location, 1, 0.5);
      sound(player.dimension, "mob.slime.big", player.location, 0.8, 1.2);
      try {
        player.playAnimation("animation.grandline.player.punch", { blendOutTime: 0.2, controller: "grandline_pose" });
      } catch {
      }
    },
    // Gum-Gum Gatling
    (player) => {
      channels.set(player.id, { kind: "gatling", ticks: 30, total: 30, dir: player.getViewDirection(), origin: player.location, hit: /* @__PURE__ */ new Set() });
      title(player, "", "\xA7d\xA7lGUM-GUM GATLING!", 25, 0, 8);
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
      title(player, "\xA7d\xA7lGEAR SECOND", "\xA77Your blood pumps like an engine", 40, 3, 10);
      particle(player.dimension, "grandline:steam_burst", player.location);
      sound(player.dimension, "random.fizz", player.location, 1.2, 0.6);
      sound(player.dimension, "tile.piston.out", player.location, 1, 0.6);
      shake(player, 0.4, 0.5);
    }
  ],
  mera: [
    // Fire Fist
    (player, s) => {
      shoot(player, "grandline:fire_fist", 1.5, 11 * s, "fire_fist");
      title(player, "", "\xA76\xA7l\u706B\u62F3 HIKEN!", 20, 0, 8);
      sound(player.dimension, "mob.blaze.shoot", player.location, 1.5, 0.6);
      sound(player.dimension, "mob.ghast.fireball", player.location, 1, 0.8);
      try {
        player.playAnimation("animation.grandline.player.punch", { blendOutTime: 0.2, controller: "grandline_pose" });
      } catch {
      }
    },
    // Fire Gun
    (player) => {
      channels.set(player.id, { kind: "fire_gun", ticks: 14, total: 14, dir: player.getViewDirection(), origin: player.location, hit: /* @__PURE__ */ new Set() });
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
        abilityDamage(e, 9 * s, player, EntityDamageCause4.fire);
        e.setOnFire(8, true);
        knock(e, V.norm(V.flat(V.sub(e.location, at))), 0.9, 0.6);
      }
    }
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
            }
          }
        }
      }
      particle(dim, "grandline:ice_age", at);
      particle(dim, "grandline:shockwave_ring", V.up(at, 0.15), vars(CYAN, { radius: r }));
      sound(dim, "random.glass", at, 2, 0.5);
      sound(dim, "mob.wither.break_block", at, 0.6, 1.6);
      for (const e of around(player, at, r)) {
        abilityDamage(e, 5 * s, player, EntityDamageCause4.freezing);
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
        notice(player, "\xA7bNo target in sight.", 20);
        power(player).moveCd[2] = 20;
        return;
      }
      encaseInIce(target);
      abilityDamage(target, 6 * s, player, EntityDamageCause4.freezing);
      target.addEffect("slowness", 100, { amplifier: 255, showParticles: false });
      target.addEffect("weakness", 100, { amplifier: 255, showParticles: false });
      sound(player.dimension, "random.glass", target.location, 2, 0.4);
      title(player, "", "\xA7b\xA7lICE TIME", 20, 0, 8);
      segment(player.dimension, chest(player), chest(target), CYAN, 0.25, false, 0.4);
    }
  ],
  goro: [
    // El Thor
    (player, s) => {
      const at = blockAhead(player, 50);
      const dim = player.dimension;
      try {
        dim.spawnEntity("minecraft:lightning_bolt", at);
      } catch {
      }
      for (let i = 0; i < 4; i++) bolt(dim, V.add(at, V.of((Math.random() - 0.5) * 3, 30, (Math.random() - 0.5) * 3)), at, { color: YELLOW, core: false, width: 0.6, segments: 12, branches: 3 });
      particle(dim, "grandline:el_thor", at);
      particle(dim, "grandline:shockwave_ring", V.up(at, 0.2), vars(YELLOW, { radius: 6 }));
      shakeAround(dim, at, 30, 1, 0.8);
      for (const e of around(player, at, 4)) abilityDamage(e, 12 * s, player, EntityDamageCause4.lightning);
      title(player, "", "\xA7e\xA7lEL THOR!", 20, 0, 8);
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
        abilityDamage(e, 8 * s, player, EntityDamageCause4.lightning);
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
        if (validTarget(player, h.entity)) abilityDamage(h.entity, 6 * s, player, EntityDamageCause4.lightning);
      }
      try {
        player.teleport(to, { keepVelocity: false, checkForBlocks: true });
      } catch {
      }
      bolt(dim, V.up(from, 1), V.up(to, 1), { color: YELLOW, core: false, width: 0.45, branches: 3, jitter: 0.08, life: 0.35 });
      sound(dim, "ambient.weather.lightning.impact", from, 1.5, 1.3);
      sound(dim, "ambient.weather.lightning.impact", to, 1.5, 1.1);
      particle(dim, "grandline:spark_burst", V.up(to, 1));
    }
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
      title(player, "", "\xA7f\xA7lSHIN... GURA!", 20, 0, 8);
      try {
        player.playAnimation("animation.grandline.player.punch", { blendOutTime: 0.2, controller: "grandline_pose" });
      } catch {
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
      channels.set(player.id, { kind: "tremor", ticks: 12, total: 12, dir: V.norm(V.flat(player.getViewDirection())), origin: player.location, hit: /* @__PURE__ */ new Set() });
      sound(player.dimension, "random.explode", player.location, 1, 0.5);
    }
  ],
  pika: [
    // Yasakani no Magatama
    (player) => {
      channels.set(player.id, { kind: "yasakani", ticks: 20, total: 20, dir: player.getViewDirection(), origin: player.location, hit: /* @__PURE__ */ new Set() });
      title(player, "", "\xA7e\xA7l\u516B\u5C3A\u74CA\u52FE\u7389", 20, 0, 8);
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
      }
      segment(dim, V.up(from, 1), V.up(to, 1), YELLOW, 0.5, false, 0.5);
      segment(dim, V.up(from, 1), V.up(to, 1), WHITE, 0.2, false, 0.35);
      particle(dim, "grandline:light_flash", V.up(from, 1));
      particle(dim, "grandline:light_flash", V.up(to, 1));
      sound(dim, "mob.endermen.portal", from, 1, 1.8);
      sound(dim, "beacon.activate", to, 1, 2);
    }
  ]
};
function airCrack(dim, at, size) {
  particle(dim, "grandline:air_crack", at, vars(void 0, { size }));
  for (let i = 0; i < 7; i++) {
    const dir = V.randUnit();
    bolt(dim, at, V.add(at, V.scale(dir, size * (0.8 + Math.random()))), { color: WHITE, core: false, width: 0.07, jitter: 0.25, branches: 1, life: 0.45 });
  }
}
var iceShells = [];
function encaseInIce(target) {
  const dim = target.dimension;
  const base = V.of(Math.floor(target.location.x), Math.floor(target.location.y), Math.floor(target.location.z));
  const placed = [];
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
        }
      }
    }
  }
  particle(dim, "grandline:frozen_shell", target.location);
  iceShells.push({ blocks: placed, until: system6.currentTick + 100, dim });
}
function meltIce() {
  const now = system6.currentTick;
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
      }
    }
    sound(s.dim, "random.glass", s.blocks[0] ?? V.of(0, 0, 0), 1, 0.8);
    iceShells.splice(i, 1);
  }
}
function tickChannel(player, c) {
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
function tickFruitPlayer(player) {
  const p = power(player);
  const f = p.fruit();
  const now = system6.currentTick;
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
  if (player.isInWater) {
    if (!p.wasInWater) notice(player, "\xA79The sea drains your strength! \xA77You're sinking...", 50);
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
      }
    }
    p.saved.stamina = Math.max(0, p.saved.stamina - 0.4);
    p.saved.haki = Math.max(0, p.saved.haki - 0.15);
    p.armOn = false;
    p.obsOn = false;
  } else {
    p.wasInWater = false;
  }
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
        }
      }
    }
  }
  if (f.key === "mera" && !sealedNow && now % 8 === 0 && !player.isInWater) particle(player.dimension, "grandline:ember", V.up(player.location, 1));
  if (f.key === "goro" && !sealedNow && now % 14 === 0) particle(player.dimension, "grandline:spark_small", V.up(player.location, 1));
  if (f.key === "pika" && !sealedNow && now % 12 === 0) particle(player.dimension, "grandline:light_mote", V.up(player.location, 1));
}
function tickFruitWorld() {
  for (const [id, r] of rubberFists) {
    if (!r.fist.isValid || !r.owner.isValid) {
      rubberFists.delete(id);
      continue;
    }
    const dir = r.owner.getViewDirection();
    const shoulder = V.add(V.up(r.owner.location, 1.35), V.scale(V.perp(V.flat(dir)), -0.35));
    segment(r.owner.dimension, shoulder, r.fist.location, SKIN, 0.22, false, 0.08);
  }
  if (system6.currentTick % 10 === 0) meltIce();
  const now = system6.currentTick;
  for (const [id, until] of sealed) {
    if (until > now) continue;
    sealed.delete(id);
    for (const pl of world3.getAllPlayers()) {
      if (pl.id === id) {
        pl.removeTag("gl_seastone");
        if (power(pl).fruit()) notice(pl, "\xA7aYour Devil Fruit power returns.", 30);
      }
    }
  }
}
function onProjectileHitEntity(projectile, hit, source) {
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
      abilityDamage(hit, dmg, owner, EntityDamageCause4.fire);
      hit.setOnFire(4, true);
      break;
    case "ice":
      abilityDamage(hit, dmg, owner, EntityDamageCause4.freezing);
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
      abilityDamage(hit, dmg, owner, EntityDamageCause4.projectile);
  }
}
function onProjectileHitBlock(projectile, at, source) {
  const info = projectileInfo.get(projectile.id);
  const kind = info?.kind ?? DEFAULT_KIND[projectile.typeId];
  const owner = info?.owner ?? source;
  if (kind === "fire_fist" && owner) explodeFire(owner, at, info?.damage ?? 11);
  else if (kind === "ice") particle(projectile.dimension, "grandline:ice_shatter", at);
  else if (kind === "light") particle(projectile.dimension, "grandline:light_flash", at);
}
function explodeFire(owner, at, dmg) {
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
    abilityDamage(e, dmg * (d < 1.8 ? 1 : 0.6), owner, EntityDamageCause4.fire);
    e.setOnFire(6, true);
    knock(e, V.norm(V.flat(V.sub(e.location, at))), 0.8, 0.4);
  }
}
var DEFAULT_KIND = {
  "grandline:fire_fist": "fire_fist",
  "grandline:fire_bullet": "fire",
  "grandline:ice_spear": "ice",
  "grandline:light_bullet": "light",
  "grandline:rubber_fist": "rubber",
  "grandline:haki_wave": "haki_wave",
  "grandline:pirate_bullet": "bullet"
};
var DEFAULT_DAMAGE = { fire_fist: 8, fire: 4, ice: 4, light: 4, rubber: 6, haki_wave: 9, bullet: 5 };
function tickCooldowns(player) {
  const p = power(player);
  for (let i = 0; i < 3; i++) if (p.moveCd[i] > 0) p.moveCd[i]--;
}

// scripts-src/hud.ts
import { system as system7 } from "@minecraft/server";
function bar2(value, max, full, half, empty, n = 10) {
  const f = Math.max(0, Math.min(1, value / Math.max(1, max))) * n;
  let s = "";
  for (let i = 0; i < n; i++) {
    if (f >= i + 1) s += full;
    else if (f >= i + 0.5) s += half;
    else s += empty;
  }
  return s;
}
var ARROWS = ["\u2191", "\u2197", "\u2192", "\u2198", "\u2193", "\u2199", "\u2190", "\u2196"];
function arrowTo(player, target) {
  const view = V.norm(V.flat(player.getViewDirection()));
  const to = V.norm(V.flat(V.sub(target.location, player.location)));
  const viewAng = Math.atan2(view.x, view.z);
  const toAng = Math.atan2(to.x, to.z);
  let rel = (viewAng - toAng) * 180 / Math.PI;
  rel = (rel % 360 + 360) % 360;
  return ARROWS[Math.round(rel / 45) % 8];
}
function prettyName(e) {
  if (e.typeId === BOSS_ID) return "Crimson King";
  if (e.typeId === PIRATE_ID) return "Pirate";
  if (e.nameTag) return e.nameTag;
  const id = e.typeId.replace(/^[^:]+:/, "").replace(/_/g, " ");
  return id.charAt(0).toUpperCase() + id.slice(1);
}
function sense(player, p) {
  const lvl = p.level(1 /* Observation */);
  const radius = 16 + lvl * 0.32;
  const all = player.dimension.getEntities({ location: player.location, maxDistance: radius, excludeFamilies: ["inanimate"], excludeTypes: ["minecraft:item", "minecraft:xp_orb"] });
  let hostile = 0;
  let other = 0;
  let nearest;
  let nd = Infinity;
  let marked = 0;
  const mark = system7.currentTick % 10 === 0;
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
      privateParticle(player, "grandline:sense_marker", V.up(e.location, e.getHeadLocation().y - e.location.y + 0.8), vars(color));
    }
  }
  let s = `\xA7b\u25C9 \xA7c${hostile}\xA77 hostile \xA7a${other}\xA77 other`;
  if (nearest) s += ` \xA78| \xA7c${prettyName(nearest)} \xA7f${Math.round(nd)}m ${arrowTo(player, nearest)}`;
  return s;
}
function hudTick(player) {
  const p = power(player);
  const now = system7.currentTick;
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
  p.notice = void 0;
  const icon = (h, on, offG, onG) => !p.has(h) ? G.locked : on ? onG : offG;
  const lvl = (h, c) => p.has(h) ? `${c}${p.level(h)}` : "\xA78--";
  const conqReady = p.has(2 /* Conqueror */) && p.conqCd <= 0;
  let line = `${icon(0 /* Armament */, p.armOn, G.armOff, G.armOn)}${lvl(0 /* Armament */, p.armOn ? "\xA7d" : "\xA77")} ${icon(1 /* Observation */, p.obsOn, G.obsOff, G.obsOn)}${lvl(1 /* Observation */, p.obsOn ? "\xA7b" : "\xA77")} ${icon(2 /* Conqueror */, conqReady, G.conqOff, G.conqOn)}${lvl(2 /* Conqueror */, conqReady ? "\xA7c" : "\xA77")}` + (p.has(2 /* Conqueror */) && p.conqCd > 0 ? `\xA78(${Math.ceil(p.conqCd / 20)}s)` : "") + `  ${G.haki}${bar2(p.saved.haki, p.maxHaki(), G.hakiFull, G.hakiHalf, G.hakiEmpty)}`;
  const f = p.fruit();
  if (f) line += ` ${G.stamina}${bar2(p.saved.stamina, p.maxStamina(), G.staFull, G.staHalf, G.staEmpty)}`;
  let second = "";
  if (f) second = `${f.color}${f.name} \xA77Lv ${p.fruitLevel()}${player.hasTag("gl_seastone") ? " \xA73[SEALED]" : player.isInWater ? " \xA79[SINKING]" : ""}`;
  if (senseLine) second = second ? `${second}  ${senseLine}` : senseLine;
  try {
    player.onScreenDisplay.setActionBar(second ? `${line}
${second}` : line);
  } catch {
  }
}

// scripts-src/items.ts
import { ItemStack as ItemStack2, system as system8 } from "@minecraft/server";

// scripts-src/menu.ts
import { ActionFormData } from "@minecraft/server-ui";
var ICON_FRUIT = "textures/grandline/items/";
function progressBar(frac, n = 20, on = "\xA7a", off = "\xA78") {
  const k = Math.round(Math.max(0, Math.min(1, frac)) * n);
  return `${on}${"|".repeat(k)}${off}${"|".repeat(n - k)}`;
}
function openCodex(player) {
  const p = power(player);
  const f = p.fruit();
  const status = (h) => p.has(h) ? `\xA7aLv ${p.level(h)}` : "\xA78Dormant";
  const form = new ActionFormData().title("\xA7l\xA74\u8987\u6C17 \xA70Haki Codex").body(
    `\xA77Pirate \xA7f${player.name}
\xA75Haki \xA7f${Math.floor(p.saved.haki)}\xA77/${Math.floor(p.maxHaki())}   \xA7eStamina \xA7f${Math.floor(p.saved.stamina)}\xA77/${Math.floor(p.maxStamina())}
\xA77Crimson Kings defeated: \xA7c${p.saved.bossKills}`
  ).button(`\xA75Armament Haki \xA7r${status(0 /* Armament */)}`, HAKI[0 /* Armament */].icon).button(`\xA73Observation Haki \xA7r${status(1 /* Observation */)}`, HAKI[1 /* Observation */].icon).button(`\xA74Conqueror's Haki \xA7r${status(2 /* Conqueror */)}`, HAKI[2 /* Conqueror */].icon).button(f ? `\xA70Devil Fruit: ${f.color}${f.name}` : "\xA70Devil Fruit: \xA78none", f ? `${ICON_FRUIT}${f.item.replace("grandline:", "")}` : "textures/grandline/items/gomu_gomu_no_mi").button("\xA70How to play", "textures/grandline/ui/guide");
  form.show(player).then((res) => {
    if (res.canceled || res.selection === void 0) return;
    if (res.selection <= 2) openHaki(player, res.selection);
    else if (res.selection === 3) openFruit(player);
    else openGuide(player);
  });
}
function openHaki(player, h) {
  const p = power(player);
  const info = HAKI[h];
  let body = `${info.color}\xA7l${info.kanji}  ${info.name}\xA7r
`;
  if (p.has(h)) {
    body += `\xA77Mastery \xA7f${p.level(h)}\xA77/100  ${progressBar(levelProgress(p.saved.xp[h]))}

`;
  } else {
    const how = h === 0 /* Armament */ ? `Deal melee damage to awaken it (bare fists count double): \xA7f${Math.floor(p.saved.armProg)}/${ARMAMENT_AWAKEN}` : h === 1 /* Observation */ ? `Survive hits from enemies to awaken it: \xA7f${p.saved.obsProg}/${OBSERVATION_AWAKEN}` : "Only one in millions has it. Defeat \xA7cVarek, the Crimson King\xA77 \u2014 or stand firm against his Conqueror's Haki once your Armament and Observation are strong (combined mastery 30+).";
    body += `\xA78Dormant.
\xA77${how}

`;
  }
  for (const t of TECHNIQUES.filter((x) => x.haki === h)) {
    const unlocked = p.has(h) && p.level(h) >= t.level;
    body += `${unlocked ? "\xA7a[\u2714]" : `\xA78[Lv ${t.level}]`} ${unlocked ? info.color : "\xA77"}\xA7l${t.name}\xA7r \xA78${t.kanji}${t.card ? ` \xB7 ${t.card}` : ""}
\xA77${t.desc}

`;
  }
  const form = new ActionFormData().title(`${info.color}\xA7l${info.name}`).body(body);
  const toggleable = p.has(h) && h !== 2 /* Conqueror */;
  if (toggleable) {
    const on = h === 0 /* Armament */ ? p.armOn : p.obsOn;
    form.button(on ? "\xA7cTurn off" : "\xA7aTurn on", info.icon);
  }
  form.button("\xA70Back");
  form.show(player).then((res) => {
    if (res.canceled || res.selection === void 0) return;
    if (toggleable && res.selection === 0) {
      if (h === 0 /* Armament */) toggleArmament(player);
      else toggleObservation(player);
      return;
    }
    openCodex(player);
  });
}
function openFruit(player) {
  const p = power(player);
  const f = p.fruit();
  let body;
  if (!f) {
    body = "\xA77You haven't eaten a Devil Fruit.\n\n\xA7fWhere to find them:\n\xA77\u2022 Dig with a shovel on beaches to unearth \xA76Treasure Chests\n\xA77\u2022 Buried treasure and shipwreck chests\n\xA77\u2022 Pirates sometimes carry one\n\xA77\u2022 The Crimson King always drops one\n\n\xA7fKnown fruits:\n" + FRUITS.map((x) => `${x.color}\u2022 ${x.name} \xA78(${x.cls})`).join("\n") + "\n\n\xA7cYou can only ever eat one. A second fruit will tear your body apart.";
  } else {
    body = `${f.color}\xA7l${f.jp}  ${f.name}\xA7r \xA78(${f.cls})
\xA77Mastery \xA7f${p.fruitLevel()}\xA77/100  ${progressBar(levelProgress(p.saved.fruitXp))}
\xA77${f.passive}

` + f.moves.map((m, i) => `${f.color}\xA7l${i + 1}. ${m.name}\xA7r
\xA77${m.desc}
\xA78Cooldown ${(m.cooldown / 20).toFixed(1)}s \xB7 Stamina ${m.stamina}`).join("\n\n") + "\n\n\xA79Weakness: the sea and Seastone drain your power. You can't swim.";
  }
  new ActionFormData().title(f ? `${f.color}\xA7l${f.name}` : "\xA7lDevil Fruits").body(body).button("\xA70Back").show(player).then((res) => {
    if (!res.canceled) openCodex(player);
  });
}
function openGuide(player) {
  const body = [
    "\xA76\xA7lThe Grand Line\xA7r",
    "\xA77Haki is the power of will. It decides every serious fight.",
    "",
    "\xA75\xA7lArmament Haki\xA7r \xA77\u2014 awaken it by fighting (melee damage). Coat yourself to hit harder, hit \xA76Logia\xA77 users (they're intangible otherwise!), and break through the Crimson King's guard (he shrugs off 75% of uncoated hits).",
    "",
    "\xA73\xA7lObservation Haki\xA7r \xA77\u2014 awaken it by surviving hits. Sense enemies around you, dodge attacks, and at mastery 75 see the future. Without it the Crimson King dodges 30% of your attacks.",
    "",
    "\xA74\xA7lConqueror's Haki\xA7r \xA77\u2014 the qualities of a king. Knock out weak-willed foes. When two Conquerors collide, a \xA7cHaki Clash\xA77 begins: \xA7emash Sneak\xA77 (or tap your Conqueror's Haki) to overpower their will. The winner stuns the loser.",
    "",
    "\xA7c\xA7lVarek, the Crimson King\xA7r \xA77\u2014 summon him with a \xA7fJolly Roger\xA77 (crafted: black wool, bone, gold ingot, stick). He has all three Haki. Beat him to awaken your Conqueror's Haki.",
    "",
    "\xA7e\xA7lDevil Fruits\xA7r \xA77\u2014 eat one for three powers (skill items appear in your inventory). Logia fruits make you intangible to attacks without Haki. But you'll sink in the sea, and \xA73Seastone\xA77 seals your power.",
    "",
    "\xA78Inspired by One Piece and Rell Seas."
  ].join("\n");
  new ActionFormData().title("\xA7lHow to play").body(body).button("\xA70Back").show(player).then((res) => {
    if (!res.canceled) openCodex(player);
  });
}

// scripts-src/items.ts
function param(p, key) {
  if (p && typeof p === "object" && key in p) {
    const v = p[key];
    if (typeof v === "string" || typeof v === "number") return v;
  }
  return void 0;
}
function consumeHeld(player) {
  const inv = player.getComponent("minecraft:inventory")?.container;
  if (!inv) return;
  const slot = player.selectedSlotIndex;
  const it = inv.getItem(slot);
  if (!it) return;
  if (player.getGameMode() === "Creative") return;
  if (it.amount <= 1) inv.setItem(slot, void 0);
  else {
    it.amount -= 1;
    inv.setItem(slot, it);
  }
}
function give(player, stack) {
  const inv = player.getComponent("minecraft:inventory")?.container;
  const left = inv?.addItem(stack);
  if (left) player.dimension.spawnItem(left, player.location);
}
var TREASURE = [
  { id: "minecraft:gold_ingot", chance: 1, min: 2, max: 6 },
  { id: "minecraft:emerald", chance: 0.6, min: 1, max: 4 },
  { id: "minecraft:iron_ingot", chance: 0.5, min: 3, max: 8 },
  { id: "minecraft:diamond", chance: 0.25, min: 1, max: 2 },
  { id: "grandline:seastone_ingot", chance: 0.2, min: 1, max: 2 },
  { id: "minecraft:golden_apple", chance: 0.12, min: 1, max: 1 },
  { id: "minecraft:nautilus_shell", chance: 0.15, min: 1, max: 1 }
];
function openTreasure(player) {
  consumeHeld(player);
  const got = [];
  for (const l of TREASURE) {
    if (Math.random() >= l.chance) continue;
    const n = l.min + Math.floor(Math.random() * (l.max - l.min + 1));
    give(player, new ItemStack2(l.id, n));
    got.push(`\xA7f${n}x \xA77${l.id.replace(/^[^:]+:/, "").replace(/_/g, " ")}`);
  }
  if (Math.random() < 0.08) {
    const f = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    give(player, new ItemStack2(f.item, 1));
    got.push(`${f.color}\xA7l${f.name}!!`);
    sound(player.dimension, "random.totem", player.location, 0.7, 1.2);
    player.onScreenDisplay.setTitle("\xA76\xA7lDEVIL FRUIT!", { fadeInDuration: 3, stayDuration: 40, fadeOutDuration: 10, subtitle: `${f.color}${f.name}` });
  }
  particle(player.dimension, "grandline:treasure_burst", V.up(player.location, 1), vars(GOLD));
  sound(player.dimension, "random.chestopen", player.location, 1, 1);
  sound(player.dimension, "random.orb", player.location, 1, 0.8);
  player.sendMessage(`\xA76\u2726 Treasure! ${got.join("\xA78, ")}`);
}
function registerItemComponents(registry) {
  registry.registerCustomComponent("grandline:haki", {
    onUse(ev, p) {
      const type = param(p.params, "type");
      const player = ev.source;
      system8.run(() => {
        if (type === "armament") toggleArmament(player);
        else if (type === "observation") toggleObservation(player);
        else useConqueror(player);
      });
    }
  });
  registry.registerCustomComponent("grandline:skill", {
    onUse(ev, p) {
      const fruit = String(param(p.params, "fruit") ?? "");
      const slot = Number(param(p.params, "slot") ?? 1) - 1;
      const player = ev.source;
      system8.run(() => useSkill(player, fruit, slot));
    }
  });
  registry.registerCustomComponent("grandline:devil_fruit", {
    onConsume(ev, p) {
      const fruit = String(param(p.params, "fruit") ?? "");
      const src = ev.source;
      if (isPlayer(src)) system8.run(() => eatFruit(src, fruit));
    }
  });
  registry.registerCustomComponent("grandline:codex", {
    onUse(ev) {
      const player = ev.source;
      system8.run(() => openCodex(player));
    }
  });
  registry.registerCustomComponent("grandline:treasure", {
    onUse(ev) {
      const player = ev.source;
      system8.run(() => openTreasure(player));
    }
  });
  registry.registerCustomComponent("grandline:jolly_roger", {
    onUse(ev) {
      const player = ev.source;
      system8.run(() => {
        if (summonCaptain(player)) consumeHeld(player);
      });
    }
  });
  registry.registerCustomComponent("grandline:seastone_weapon", {
    onHitEntity(ev) {
      const target = ev.hitEntity;
      system8.run(() => {
        if (target.isValid) seal(target, 100);
      });
    }
  });
}
function onInteractEntity(player, target, item) {
  if (item?.typeId !== "grandline:seastone_cuffs") return;
  if (!target.getComponent("minecraft:health")) return;
  seal(target, 600);
  if (target.typeId === PIRATE_ID && target.hasTag("gl_logia")) {
    target.removeTag("gl_logia");
    system8.runTimeout(() => {
      if (target.isValid) target.addTag("gl_logia");
    }, 600);
  }
  consumeHeld(player);
  sound(player.dimension, "random.anvil_use", target.location, 0.6, 1.4);
  notice(player, "\xA73Seastone cuffs locked on! \xA77Their Devil Fruit is sealed for 30s.");
  particle(player.dimension, "grandline:seastone_drain", chest(target));
}
var DIGGABLE = /* @__PURE__ */ new Set(["minecraft:sand", "minecraft:red_sand", "minecraft:gravel", "minecraft:clay", "minecraft:suspicious_sand", "minecraft:mud"]);
function onBreakBlock(ev) {
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
  ev.dimension.spawnItem(new ItemStack2("grandline:treasure_chest", 1), at);
  particle(ev.dimension, "grandline:treasure_burst", at, vars(GOLD));
  sound(ev.dimension, "random.orb", at, 1, 0.6);
  notice(ev.player, "\xA76\u2726 You dug up a buried treasure chest!", 50);
}

// scripts-src/commands.ts
import {
  CommandPermissionLevel,
  CustomCommandParamType,
  CustomCommandStatus,
  system as system9
} from "@minecraft/server";
var HAKI_NAMES = {
  armament: 0 /* Armament */,
  observation: 1 /* Observation */,
  conqueror: 2 /* Conqueror */,
  all: "all"
};
function ok(message) {
  return { status: CustomCommandStatus.Success, message };
}
function fail(message) {
  return { status: CustomCommandStatus.Failure, message };
}
function targets(origin, selected) {
  if (Array.isArray(selected)) return selected.filter(isPlayer);
  const src = origin.sourceEntity ?? origin.initiator;
  return src && isPlayer(src) ? [src] : [];
}
function setHakiLevel(player, h, level) {
  const p = power(player);
  if (!p.has(h)) awaken(player, h, "Granted by command.");
  p.saved.xp[h] = totalXpForLevel(Math.max(0, Math.min(100, level)));
  p.dirty = true;
  save(player, p);
}
function resetPlayer(player) {
  const p = power(player);
  p.saved.unlocked = [false, false, false];
  p.saved.xp = [0, 0, 0];
  p.saved.armProg = 0;
  p.saved.obsProg = 0;
  p.saved.resisted = 0;
  p.armOn = false;
  p.obsOn = false;
  removeItems(player, (id) => id === HAKI[0 /* Armament */].item || id === HAKI[1 /* Observation */].item || id === HAKI[2 /* Conqueror */].item);
  removeFruit(player);
  save(player, p);
}
function registerCommands(reg) {
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
        { name: "players", type: CustomCommandParamType.PlayerSelector }
      ]
    },
    (origin, action, type, level, players) => {
      const list = targets(origin, players);
      if (list.length === 0) return fail("No target players.");
      const t = HAKI_NAMES[type ?? "all"] ?? "all";
      const kinds = t === "all" ? [0 /* Armament */, 1 /* Observation */, 2 /* Conqueror */] : [t];
      system9.run(() => {
        for (const pl of list) {
          if (action === "reset") resetPlayer(pl);
          else if (action === "unlock") for (const h of kinds) awaken(pl, h, "Granted by command.");
          else for (const h of kinds) setHakiLevel(pl, h, level ?? 50);
        }
      });
      return ok(`Haki ${action} applied to ${list.length} player(s).`);
    }
  );
  reg.registerCommand(
    {
      name: "grandline:fruit",
      description: "Give a player a Devil Fruit power (or 'none' to remove it).",
      permissionLevel: CommandPermissionLevel.GameDirectors,
      cheatsRequired: true,
      mandatoryParameters: [{ name: "grandline:fruit_name", type: CustomCommandParamType.Enum }],
      optionalParameters: [{ name: "players", type: CustomCommandParamType.PlayerSelector }]
    },
    (origin, fruit, players) => {
      const list = targets(origin, players);
      if (list.length === 0) return fail("No target players.");
      system9.run(() => {
        for (const pl of list) {
          removeFruit(pl);
          if (fruit !== "none") eatFruit(pl, fruit);
        }
      });
      return ok(fruit === "none" ? "Devil Fruit removed." : `Granted ${fruit}.`);
    }
  );
  reg.registerCommand(
    {
      name: "grandline:captain",
      description: "Summon Varek, the Crimson King in front of you.",
      permissionLevel: CommandPermissionLevel.GameDirectors,
      cheatsRequired: true
    },
    (origin) => {
      const src = origin.sourceEntity ?? origin.initiator;
      if (!src || !isPlayer(src)) return fail("Run this as a player.");
      system9.run(() => summonCaptain(src));
      return ok();
    }
  );
  reg.registerCommand(
    {
      name: "grandline:codex",
      description: "Open the Haki Codex and restore your Haki and skill items.",
      permissionLevel: CommandPermissionLevel.Any
    },
    (origin) => {
      const src = origin.sourceEntity ?? origin.initiator;
      if (!src || !isPlayer(src)) return fail("Run this as a player.");
      system9.run(() => {
        restoreKit(src);
        openCodex(src);
      });
      return ok();
    }
  );
}
function restoreKit(player) {
  const p = power(player);
  giveBound(player, "grandline:haki_codex", void 0, ["\xA77Use: \xA7fopen the Haki Codex", "\xA78Stats, techniques, Devil Fruit and guide"]);
  for (const h of [0 /* Armament */, 1 /* Observation */, 2 /* Conqueror */]) if (p.has(h)) giveBound(player, HAKI[h].item, void 0, hakiItemLore(h));
  syncSkillItems(player);
}

// scripts-src/main.ts
system10.beforeEvents.startup.subscribe((ev) => {
  registerItemComponents(ev.itemComponentRegistry);
  registerCommands(ev.customCommandRegistry);
});
initCombat();
world4.afterEvents.playerSpawn.subscribe((ev) => {
  const player = ev.player;
  const p = power(player);
  if (!p.saved.welcomed) {
    p.saved.welcomed = true;
    p.dirty = true;
    system10.runTimeout(() => {
      if (!player.isValid) return;
      player.sendMessage("\xA76\xA7l\u2693 Welcome to the Grand Line!\xA7r");
      player.sendMessage("\xA77Haki is the power of will. \xA75Armament\xA77 awakens through fighting, \xA73Observation\xA77 by surviving hits, and \xA74Conqueror's\xA77 only before a king...");
      player.sendMessage("\xA77Open your \xA7fHaki Codex\xA77 any time to see your progress. Dig on beaches with a shovel for buried treasure \u2014 and Devil Fruits.");
      player.onScreenDisplay.setTitle("\xA76\xA7lGRAND LINE", { fadeInDuration: 10, stayDuration: 60, fadeOutDuration: 20, subtitle: "\xA77Haki \xB7 Devil Fruits \xB7 Haki Clash" });
      restoreKit(player);
      save(player);
    }, 40);
  } else {
    system10.runTimeout(() => {
      if (player.isValid) restoreKit(player);
    }, 20);
  }
  p.armOn = false;
  p.obsOn = false;
});
world4.beforeEvents.playerLeave.subscribe((ev) => {
  const player = ev.player;
  const id = player.id;
  const p = power(player);
  const data = JSON.stringify(p.saved);
  system10.run(() => forget(id));
  try {
    player.setDynamicProperty("grandline:power", data);
  } catch {
  }
});
world4.afterEvents.playerButtonInput.subscribe((ev) => {
  if (ev.button === InputButton.Sneak && ev.newButtonState === ButtonState.Pressed && clashOf(ev.player)) pushClash(ev.player);
});
world4.afterEvents.entityDie.subscribe((ev) => {
  const dead = ev.deadEntity;
  if (dead.typeId === BOSS_ID) onBossDeath(dead, ev.damageSource.damagingEntity);
  knockedOut.delete(dead.id);
});
world4.afterEvents.entitySpawn.subscribe((ev) => {
  const e = ev.entity;
  if (e.typeId === BOSS_ID) track(e);
  if (e.typeId === PIRATE_ID) {
    system10.runTimeout(() => {
      try {
        if (e.isValid && e.getComponent("minecraft:variant")?.value === 2) e.addTag("gl_logia");
      } catch {
      }
    }, 2);
  }
});
world4.afterEvents.entityLoad.subscribe((ev) => {
  if (ev.entity.typeId === BOSS_ID) track(ev.entity);
});
world4.afterEvents.projectileHitEntity.subscribe((ev) => {
  try {
    onProjectileHitEntity(ev.projectile, ev.getEntityHit().entity, ev.source);
  } catch {
  }
});
world4.afterEvents.projectileHitBlock.subscribe((ev) => {
  try {
    onProjectileHitBlock(ev.projectile, ev.location, ev.source);
  } catch {
  }
});
world4.afterEvents.playerBreakBlock.subscribe(onBreakBlock);
world4.afterEvents.playerInteractWithEntity.subscribe((ev) => {
  onInteractEntity(ev.player, ev.target, ev.beforeItemStack);
});
function tickPlayer(player) {
  const p = power(player);
  const now = system10.currentTick;
  let drain = 0;
  if (p.armOn) drain += Math.max(0.04, 0.1 - p.level(0 /* Armament */) * 6e-4);
  if (p.obsOn) drain += Math.max(0.03, 0.075 - p.level(1 /* Observation */) * 4e-4);
  const maxH = p.maxHaki();
  const regen = 0.12 + (p.level(0 /* Armament */) + p.level(1 /* Observation */) + p.level(2 /* Conqueror */)) * 15e-4;
  p.saved.haki = Math.min(maxH, p.saved.haki + (drain > 0 ? regen * 0.25 - drain : regen));
  if (p.saved.haki <= 0) {
    p.saved.haki = 0;
    if (p.armOn || p.obsOn) {
      p.armOn = false;
      p.obsOn = false;
      notice(player, "\xA75Your Haki is exhausted!", 40);
    }
  }
  if (isKnockedOut(player) && (p.armOn || p.obsOn)) {
    p.armOn = false;
    p.obsOn = false;
  }
  if (!player.isInWater) p.saved.stamina = Math.min(p.maxStamina(), p.saved.stamina + 0.25 + p.fruitLevel() * 2e-3);
  if (p.conqCd > 0) p.conqCd--;
  if (p.futureSightCd > 0) p.futureSightCd--;
  if (p.counterTicks > 0) p.counterTicks--;
  if (p.khanCd > 0) p.khanCd--;
  if (p.clashMeleeCd > 0) p.clashMeleeCd--;
  if (p.hintCd > 0) p.hintCd--;
  tickCooldowns(player);
  if (p.obsOn && now % 40 === 0) {
    const lvl = p.addXp(1 /* Observation */, 1);
    if (lvl !== void 0) notice(player, `\xA7bObservation Haki \xA7fmastery \xA7e${lvl}`, 40);
  }
  if (p.obsOn && p.hasTech("future_sight") && p.futureSightCd === 1) particle(player.dimension, "grandline:observation_pulse", player.location);
  tickFruitPlayer(player);
  hudTick(player);
  if (now % 40 === 0) restoreKitQuiet(player);
  if (now % 100 === 0 && p.dirty) save(player, p);
}
function restoreKitQuiet(player) {
  try {
    restoreKit(player);
  } catch {
  }
}
world4.afterEvents.worldLoad.subscribe(() => {
  system10.runInterval(() => {
    for (const player of world4.getAllPlayers()) {
      try {
        tickPlayer(player);
      } catch (e) {
        console.warn(`[grandline] player tick: ${e}`);
      }
    }
    try {
      tickClashes();
      tickBosses();
      tickFruitWorld();
      tickKnockouts();
      if (system10.currentTick % 6 === 0) koStars();
    } catch (e) {
      console.warn(`[grandline] world tick: ${e}`);
    }
  }, 1);
  console.info("[grandline] Grand Line: Haki Clash loaded. The great pirate era begins!");
});
function koStars() {
  for (const [id] of knockedOut) {
    const e = world4.getEntity(id);
    if (!e || !e.isValid) continue;
    particle(e.dimension, "grandline:ko_stars", V.up(e.getHeadLocation(), 0.55));
  }
}
system10.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (ev.id !== "grandline:kit") return;
  const src = ev.sourceEntity;
  if (src && src.typeId === "minecraft:player") restoreKit(src);
});
