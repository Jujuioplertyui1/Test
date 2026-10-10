#!/usr/bin/env python3
"""Static checks for the add-on: JSON validity and every cross-reference between scripts and packs."""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BP = os.path.join(ROOT, "packs", "GrandLine_BP")
RP = os.path.join(ROOT, "packs", "GrandLine_RP")
SRC = os.path.join(ROOT, "scripts-src")

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def load_all(base):
    out = {}
    for path in glob.glob(os.path.join(base, "**", "*.json"), recursive=True):
        rel = os.path.relpath(path, base)
        try:
            with open(path, encoding="utf-8") as f:
                out[rel] = json.load(f)
        except Exception as e:  # noqa: BLE001
            err(f"invalid JSON {rel}: {e}")
    return out


bp = load_all(BP)
rp = load_all(RP)
scripts = "\n".join(open(p, encoding="utf-8").read() for p in glob.glob(os.path.join(SRC, "*.ts")))
bundle_path = os.path.join(BP, "scripts", "main.js")
if not os.path.exists(bundle_path):
    err("missing BP scripts/main.js (run the esbuild step)")

# ---- identifiers defined -------------------------------------------------------------------
bp = {k: v for k, v in bp.items() if isinstance(v, dict)}
rp = {k: v for k, v in rp.items() if isinstance(v, dict)}
items = {d["minecraft:item"]["description"]["identifier"]: (rel, d) for rel, d in bp.items() if "minecraft:item" in d}
blocks = {d["minecraft:block"]["description"]["identifier"]: d for rel, d in bp.items() if "minecraft:block" in d}
entities = {d["minecraft:entity"]["description"]["identifier"]: d for rel, d in bp.items() if "minecraft:entity" in d}
clients = {d["minecraft:client_entity"]["description"]["identifier"]: d for rel, d in rp.items() if "minecraft:client_entity" in d}
particles = {d["particle_effect"]["description"]["identifier"]: d for rel, d in rp.items() if "particle_effect" in d}
animations = {}
controllers = {}
geometries = set()
render_ctrls = set()
for rel, d in rp.items():
    if not isinstance(d, dict):
        continue
    animations.update(d.get("animations", {}) if rel.startswith("animations") else {})
    controllers.update(d.get("animation_controllers", {}))
    for g in d.get("minecraft:geometry", []) or []:
        geometries.add(g["description"]["identifier"])
    render_ctrls.update((d.get("render_controllers") or {}).keys() if rel.startswith("render_controllers") else [])
fogs = {d["minecraft:fog_settings"]["description"]["identifier"] for rel, d in rp.items() if "minecraft:fog_settings" in d}


def png_exists(texture_path):
    return os.path.exists(os.path.join(RP, texture_path + ".png"))


# ---- textures ------------------------------------------------------------------------------
item_tex = rp.get(os.path.join("textures", "item_texture.json"), {}).get("texture_data", {})
for key, v in item_tex.items():
    if not png_exists(v["textures"]):
        err(f"item texture missing: {v['textures']}")
terrain = rp.get(os.path.join("textures", "terrain_texture.json"), {}).get("texture_data", {})
for key, v in terrain.items():
    if not png_exists(v["textures"]):
        err(f"terrain texture missing: {v['textures']}")
for ident, d in particles.items():
    t = d["particle_effect"]["description"]["basic_render_parameters"]["texture"]
    if not png_exists(t):
        err(f"particle {ident} texture missing: {t}")
for ident, d in clients.items():
    desc = d["minecraft:client_entity"]["description"]
    for t in desc.get("textures", {}).values():
        if not png_exists(t):
            err(f"client entity {ident} texture missing: {t}")
    for g in desc.get("geometry", {}).values():
        if g not in geometries:
            err(f"client entity {ident} geometry missing: {g}")
    for a in desc.get("animations", {}).values():
        if a not in animations and a not in controllers:
            err(f"client entity {ident} animation missing: {a}")
    for p in desc.get("particle_effects", {}).values():
        if p not in particles:
            err(f"client entity {ident} particle missing: {p}")
    for rc in desc.get("render_controllers", []):
        name = rc if isinstance(rc, str) else list(rc.keys())[0]
        if name not in render_ctrls:
            err(f"client entity {ident} render controller missing: {name}")
    for s in desc.get("scripts", {}).get("animate", []):
        key = s if isinstance(s, str) else list(s.keys())[0]
        if key not in desc.get("animations", {}):
            err(f"client entity {ident} animates unknown key {key}")
    if ident not in entities:
        err(f"client entity without behavior entity: {ident}")
for ident in entities:
    if ident not in clients:
        err(f"entity without client entity: {ident}")
for ctrl, d in controllers.items():
    for state in d["states"].values():
        for a in state.get("animations", []):
            name = a if isinstance(a, str) else list(a.keys())[0]
            # controller animation names refer to the client entity's short names; checked loosely
            if not any(name in c["minecraft:client_entity"]["description"].get("animations", {}) for c in clients.values()):
                err(f"controller {ctrl} uses unknown animation short name {name}")

# items
for ident, (rel, d) in items.items():
    comps = d["minecraft:item"]["components"]
    icon = comps.get("minecraft:icon")
    if isinstance(icon, str) and icon not in item_tex:
        err(f"item {ident} icon key not in item_texture.json: {icon}")
    for k in comps:
        if k.startswith("grandline:") and f'"{k}"' not in scripts:
            err(f"item {ident} uses custom component {k} that scripts never register")
for ident, d in blocks.items():
    for mi in d["minecraft:block"]["components"].get("minecraft:material_instances", {}).values():
        if mi["texture"] not in terrain:
            err(f"block {ident} texture key missing: {mi['texture']}")

# ---- lang -----------------------------------------------------------------------------------
lang = {}
with open(os.path.join(RP, "texts", "en_US.lang"), encoding="utf-8") as f:
    for line in f:
        if "=" in line:
            k, v = line.rstrip("\n").split("=", 1)
            lang[k] = v
for ident, (rel, d) in items.items():
    dn = d["minecraft:item"]["components"].get("minecraft:display_name", {}).get("value")
    if dn and dn not in lang:
        err(f"lang key missing for {ident}: {dn}")
for ident in entities:
    if f"entity.{ident}.name" not in lang:
        err(f"lang missing entity name {ident}")
for ident in blocks:
    if f"tile.{ident}.name" not in lang:
        err(f"lang missing block name {ident}")

# ---- loot tables, recipes -------------------------------------------------------------------
known_items = set(items) | set(blocks)


def check_loot(rel, table):
    for pool in table.get("pools", []):
        for e in pool.get("entries", []):
            if e.get("type") == "item":
                name = e["name"]
                if name.startswith("grandline:") and name not in known_items:
                    err(f"loot {rel} references unknown item {name}")


for rel, d in bp.items():
    if rel.startswith("loot_tables"):
        check_loot(rel, d)
for ident, d in entities.items():
    ent = d["minecraft:entity"]
    groups = [ent["components"]] + list(ent.get("component_groups", {}).values())
    for g in groups:
        for key in ("minecraft:loot", "minecraft:equipment"):
            if key in g:
                path = g[key]["table"]
                if not os.path.exists(os.path.join(BP, path)):
                    err(f"entity {ident} {key} table missing: {path}")
        sh = g.get("minecraft:shooter")
        if sh and sh["def"] not in entities:
            err(f"entity {ident} shoots unknown projectile {sh['def']}")
for rel, d in bp.items():
    for k in ("minecraft:recipe_shaped", "minecraft:recipe_furnace", "minecraft:recipe_shapeless"):
        if k in d:
            r = d[k]
            refs = []
            if "key" in r:
                refs += [v["item"] for v in r["key"].values()]
            if "result" in r:
                refs.append(r["result"]["item"])
            for f in ("input", "output"):
                if f in r:
                    refs.append(r[f])
            for ref in refs:
                if ref.startswith("grandline:") and ref not in known_items:
                    err(f"recipe {rel} references unknown {ref}")

# ---- scripts → packs ------------------------------------------------------------------------
script_ids = set(re.findall(r'"(grandline:[a-z0-9_]+)"', scripts))
script_particles = {s for s in script_ids if s in particles}
used_particle_calls = set(re.findall(r'(?:particle|privateParticle)\([^,]+,\s*"(grandline:[a-z0-9_]+)"', scripts))
used_particle_calls |= set(re.findall(r'particle\(\w+(?:\.\w+)?,\s*"(grandline:[a-z0-9_]+)"', scripts))
used_particle_calls |= set(re.findall(r'"(grandline:bolt_(?:glow|core))"', scripts))
for p in used_particle_calls:
    if p not in particles:
        err(f"script spawns undefined particle {p}")
for el in ("mera", "hie", "goro", "pika"):
    if f"grandline:logia_{el}" not in particles:
        err(f"missing logia particle grandline:logia_{el}")
for m in re.findall(r'spawnEntity\(\s*"(grandline:[a-z0-9_]+)"', scripts):
    if m not in entities:
        err(f"script spawns unknown entity {m}")
for m in re.findall(r'spawnEntity\(\s*([A-Z_]+_ID)', scripts):
    pass
for m in re.findall(r'(?:ItemStack|giveBound\([^,]+,)\(?\s*"(grandline:[a-z0-9_]+)"', scripts):
    if m not in known_items:
        err(f"script gives unknown item {m}")
for m in re.findall(r'item: "(grandline:[a-z0-9_]+)"', scripts):
    if m not in known_items:
        err(f"script definition references unknown item {m}")
for m in re.findall(r'`grandline:skill_\$\{fruit\}_\$\{n\}`', scripts):
    pass
fruit_keys = re.findall(r'key: "([a-z]+)", item: "grandline:([a-z_]+)"', scripts)
for key, it in fruit_keys:
    for n in (1, 2, 3):
        if f"grandline:skill_{key}_{n}" not in items:
            err(f"missing skill item grandline:skill_{key}_{n}")
        cd = items[f"grandline:skill_{key}_{n}"][1]["minecraft:item"]["components"].get("minecraft:cooldown", {}).get("category") if f"grandline:skill_{key}_{n}" in items else None
        if cd != f"grandline_{key}_{n}":
            err(f"skill {key}_{n} cooldown category mismatch: {cd}")
for anim in set(re.findall(r'"(animation\.grandline\.[a-z_.]+)"', scripts)):
    if anim not in animations:
        err(f"script plays undefined animation {anim}")
for ev in set(re.findall(r'triggerEvent\(\s*"(grandline:[a-z_]+)"', scripts)) | {"grandline:clash_start", "grandline:clash_end"}:
    owners = [i for i, d in entities.items() if ev in d["minecraft:entity"].get("events", {})]
    if not owners:
        err(f"script triggers event {ev} that no entity defines")
for prop in set(re.findall(r'(?:set|get)Property\(\s*"(grandline:[a-z_]+)"', scripts)):
    owners = [i for i, d in entities.items() if prop in d["minecraft:entity"]["description"].get("properties", {})]
    if not owners:
        err(f"script uses property {prop} that no entity declares")
for fog in set(re.findall(r'const FOG = "(grandline:[a-z_]+)"', scripts)):
    if fog not in fogs:
        err(f"script pushes undefined fog {fog}")
for icon in set(re.findall(r'"(textures/grandline/[a-z_/]+)"', scripts)):
    if icon.endswith("/"):
        continue
    if not png_exists(icon):
        err(f"script UI icon missing: {icon}")
for it in items:
    if it.startswith("grandline:") and it.endswith("_no_mi"):
        if not png_exists(f"textures/grandline/items/{it.split(':')[1]}"):
            err(f"codex fruit icon missing for {it}")

# glyphs
if not os.path.exists(os.path.join(RP, "font", "glyph_E3.png")):
    err("missing font/glyph_E3.png")

# manifests
for base, name in ((BP, "BP"), (RP, "RP")):
    m = json.load(open(os.path.join(base, "manifest.json")))
    if not os.path.exists(os.path.join(base, "pack_icon.png")):
        err(f"{name} pack_icon.png missing")
    for mod in m["modules"]:
        if mod["type"] == "script" and not os.path.exists(os.path.join(base, mod["entry"])):
            err(f"{name} script entry missing: {mod['entry']}")

print(f"items={len(items)} blocks={len(blocks)} entities={len(entities)} particles={len(particles)} animations={len(animations)}")
for w in warnings:
    print("warning:", w)
if errors:
    for e in errors:
        print("ERROR:", e)
    sys.exit(1)
print("validation OK")
