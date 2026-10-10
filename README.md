# Grand Line: Haki Clash — a One Piece add-on for Minecraft Bedrock

Haki that actually matters, six Devil Fruits, a cinematic **Haki Clash**, and **Varek, the Crimson King**, a Conqueror's Haki pirate captain who clashes wills with you.

> Requires **Minecraft Bedrock 1.26.10 or newer** (Script API `@minecraft/server` 2.6.0, stable). No experimental toggles needed.

## Install

1. Download **[`dist/GrandLine_Haki_Clash.mcaddon`](dist/GrandLine_Haki_Clash.mcaddon)**.
2. Open it (double-click on Windows, or "Open with Minecraft" on mobile). Both packs import automatically.
3. Create or edit a world → **Behavior Packs** → activate *Grand Line: Haki Clash* (the resource pack is added with it).

On first join you get a **Haki Codex** — use it any time to see your progress, techniques and the in-game guide.

## Haki — the power of will

Haki decides fights. Each type awakens through play, levels to mastery 100, and unlocks techniques. Their names and effects nod to the Haki card sets in Rell Seas.

| | How to awaken | What it does | Techniques (mastery) |
|---|---|---|---|
| **Armament** 武装色 | Deal 250 melee damage (bare fists count double) | +damage, hits **Logia** users, breaks the Crimson King's guard; black-steel coating on your fists | Full-Body Hardening (20) · Emission (45) · Internal Destruction (75) |
| **Observation** 見聞色 | Survive 40 hits from enemies | Senses every creature nearby (private markers + HUD radar with direction), dodges attacks | Evasion (15) · Counter (45) · Future Sight (75) |
| **Conqueror's** 覇王色 | Defeat the Crimson King, or resist his Conqueror's Haki once Armament + Observation mastery total 30+ | Burst that knocks out every weaker-willed enemy cold (they collapse with dizzy stars) | Imperial Decree (25) · Conqueror's Infusion (50) · Khan's Wrath (80) |

Why Haki matters:
- **Logia users are intangible.** Attacks without Haki (or Seastone) pass straight through them — including the fire-wielding pirates on beaches.
- **The Crimson King shrugs off 75% of uncoated hits** and dodges 30% of attacks from anyone without Observation Haki active.
- **Conqueror's Haki** knocks out whole crowds; Khan's Wrath saves you at low health.
- Haki items appear in your inventory when awakened (they're bound to you and kept on death). A shared **Haki** bar (purple) powers them.

## ⚡ The Haki Clash

When two Conqueror's Haki users release their will near each other, the sky splits:

- Both fighters are locked in place and the camera swings to a **cinematic side view**.
- **Black lightning with a red glow** arcs between you and the clash point, bolts tear into the sky, crimson fog rolls in and shockwaves knock bystanders back (weak-willed onlookers pass out).
- A clash bar fills the screen. **Mash Sneak** (or tap your Conqueror's Haki) to push your will forward. Higher Conqueror mastery pushes harder.
- The winner stuns the loser and earns big Conqueror mastery.

Clashes trigger when you burst near another Conqueror (player or the Crimson King), when the Crimson King bursts at you and you have Conqueror's Haki, and — with **Conqueror's Infusion** — when infused blows meet without touching.

## 👑 Varek, the Crimson King

A red-haired captain in a crimson-lined black greatcoat with a skull-and-crossbones crest, a gold-trimmed tricorne and the **Black Blade**.

- Summon him with a **Jolly Roger** (black wool, bone, gold ingot, stick), which brings a cinematic arrival with lightning and his crew. Or use his spawn egg.
- He uses all three Haki: Armament defense, Observation dodges, and charged **Conqueror's Haki bursts** that knock out the weak and clash with Conquerors.
- He leaps in with undodgeable black-lightning slams and fires Armament **Emission** shockwaves at range.
- **Phase two** at half health: his eyes burn red, his coat whips in the wind, he moves faster, hits harder, and calls his crew.
- Drops: a Devil Fruit, the Black Blade, gold, diamonds, Seastone and treasure. Beating him **awakens Conqueror's Haki**.

## 🍎 Devil Fruits

Eat one to gain three powers (skill items appear in your hotbar with native cooldown overlays). You can only ever eat one, because a second tears your body apart. Fruit users **sink in water** and can't use powers there, and **Seastone** seals them.

| Fruit | Type | Moves |
|---|---|---|
| Gomu Gomu no Mi | Paramecia | Gum-Gum Pistol (stretching arm), Gatling, Gear Second · immune to lightning & fall damage |
| Mera Mera no Mi | Logia | Fire Fist (explodes), Fire Gun, Flame Pillar · immune to fire & lava |
| Hie Hie no Mi | Logia | Ice Partisan, Ice Age (freezes sea + enemies), Ice Time (encases a target in ice) · freezes the sea as you walk |
| Goro Goro no Mi | Logia | El Thor, Vari: 1M Volts, Thunder Step · immune to lightning |
| Gura Gura no Mi | Paramecia | Quake Punch (cracks the air), Seaquake, Tremor Wave |
| Pika Pika no Mi | Logia | Yasakani no Magatama, Ama no Murakumo, Yata no Kagami (light-speed travel) |

Where to find fruits: **dig with a shovel on beaches** for Buried Treasure Chests (a Rell Seas mechanic), buried treasure / shipwreck / dungeon chests, pirates (rare), and the Crimson King (always).

## More

- **Pirates** spawn on beaches at night: cutlass brawlers, gunners, and flame-wielding Logia pirates that you can only hurt with Haki or Seastone.
- **Seastone** ore generates under oceans and beaches. Smelt it into ingots and craft the **Seastone Jitte** (hits seal Devil Fruits) and **Seastone Cuffs** (seal a target for 30s).
- **Swords**: Wado Ichimonji (craftable) and the Black Blade (the Crimson King's sword; counts as Haki-coated).
- **HUD**: Haki and stamina bars, Haki levels/cooldowns, fruit status, and an Observation radar on the action bar, drawn with custom icon glyphs.

## Commands (cheats on)

| Command | Effect |
|---|---|
| `/grandline:codex` | Open the Codex and restore your Haki/skill items (works without cheats) |
| `/grandline:haki <unlock\|level\|reset> [armament\|observation\|conqueror\|all] [level] [players]` | Testing / admin |
| `/grandline:fruit <gomu\|mera\|hie\|goro\|gura\|pika\|none> [players]` | Give or remove a fruit power |
| `/grandline:captain` | Summon the Crimson King in front of you |

Quick test: `/grandline:haki level all 60`, `/grandline:fruit mera`, `/grandline:captain`, then use Conqueror's Haki near him.

## Research notes

- **One Piece**: the three Haki colours (Armament hardening/Emission/Ryou, Observation/Future Sight, Conqueror's knock-outs, infusion, and the "clash without touching"), Logia intangibility, the sea and Seastone weakness, and one-fruit-only.
- **Rell Seas** (Roblox): Haki as card-like technique sets (knight-themed Armament cards, scientist-themed Observation cards, conqueror cards like Julius C. Zar's immobilize + defense shred and Geng D. Khan's "disable your attackers when knocked"), clash mechanics, stamina, treasure dug up with a shovel, and Armament as the key counter to Logia.

## Building from source

```bash
npm install
npm run build   # type-check → generate JSON + textures → bundle scripts → validate → dist/*.mcaddon
npm run smoke   # headless play-through against a mocked Script API
```

- `scripts-src/` — TypeScript game logic (type-checked against the official `@minecraft/server` 2.6.0 typings, bundled with esbuild).
- `tools/gen_content.py` — generates every behavior/resource-pack JSON (items, entities, models, animations, particles, loot, worldgen).
- `tools/gen_art.py` — draws every texture (pixel art, entity skins, particles, HUD glyphs, pack icons).
- `tools/validate.py` — checks every ID referenced by the scripts exists in the packs (particles, animations, items, events, properties, textures).

*Fan-made add-on, not affiliated with Eiichiro Oda, Shueisha, Toei Animation, or RELL Games.*
