#!/usr/bin/env python3
"""Generates every JSON file of the Grand Line add-on (behavior + resource pack).

Run from the repo root:  python3 tools/gen_content.py
Art (PNG textures) is generated separately by tools/gen_art.py.
"""
import json
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from model_defs import (  # noqa: E402
    bullet_bones,
    captain_bones,
    empty_bones,
    fist_bones,
    geometry,
    humanoid_bones,
    spear_bones,
)

ROOT = os.path.dirname(HERE)
BP = os.path.join(ROOT, "packs", "GrandLine_BP")
RP = os.path.join(ROOT, "packs", "GrandLine_RP")

VERSION = [1, 0, 0]
MIN_ENGINE = [1, 26, 10]
BP_UUID = "133b8e21-d30c-4011-86a6-06791e422f5a"
BP_DATA_UUID = "03a2a59d-22dd-4012-ba16-08c342d3897b"
BP_SCRIPT_UUID = "00422abc-ebb6-4070-8bfb-c89dfb9e2855"
RP_UUID = "84916923-8402-4112-90d4-927eaf2698c4"
RP_RES_UUID = "ee2fa52a-cb50-482b-8bb7-e8f401b6bfbf"

ITEM_FMT = "1.21.90"
ENTITY_FMT = "1.21.0"

LANG = {}


def w(base, rel, obj):
    path = os.path.join(base, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def clean():
    """Remove generated folders (keeps scripts/ which tsc writes)."""
    for base, keep in ((BP, {"scripts"}), (RP, {"textures"})):
        if not os.path.isdir(base):
            continue
        for name in os.listdir(base):
            if name in keep:
                continue
            p = os.path.join(base, name)
            if os.path.isdir(p):
                shutil.rmtree(p)
            else:
                os.remove(p)


# ---------------------------------------------------------------------------------------------
# Manifests
# ---------------------------------------------------------------------------------------------

def manifests():
    w(BP, "manifest.json", {
        "format_version": 2,
        "header": {
            "name": "§l§cGrand Line: Haki Clash §r§7(Behavior)",
            "description": "One Piece add-on: Haki, Devil Fruits, Haki Clash and Varek the Crimson King. Inspired by One Piece & Rell Seas.",
            "uuid": BP_UUID,
            "version": VERSION,
            "min_engine_version": MIN_ENGINE,
        },
        "modules": [
            {"type": "data", "uuid": BP_DATA_UUID, "version": VERSION},
            {"type": "script", "language": "javascript", "uuid": BP_SCRIPT_UUID, "version": VERSION, "entry": "scripts/main.js"},
        ],
        "dependencies": [
            {"uuid": RP_UUID, "version": VERSION},
            {"module_name": "@minecraft/server", "version": "2.6.0"},
            {"module_name": "@minecraft/server-ui", "version": "2.0.0"},
        ],
        "metadata": {"authors": ["Jujuioplertyui1"], "license": "MIT"},
    })
    w(RP, "manifest.json", {
        "format_version": 2,
        "header": {
            "name": "§l§cGrand Line: Haki Clash §r§7(Resources)",
            "description": "Textures, models, particles and effects for Grand Line: Haki Clash.",
            "uuid": RP_UUID,
            "version": VERSION,
            "min_engine_version": MIN_ENGINE,
        },
        "modules": [{"type": "resources", "uuid": RP_RES_UUID, "version": VERSION}],
        "dependencies": [{"uuid": BP_UUID, "version": VERSION}],
        "metadata": {"authors": ["Jujuioplertyui1"], "license": "MIT"},
    })


# ---------------------------------------------------------------------------------------------
# Data shared with the scripts (keep in sync with scripts-src/defs.ts)
# ---------------------------------------------------------------------------------------------

FRUITS = [
    ("gomu", "Gomu Gomu no Mi", "§d", ["Gum-Gum Pistol", "Gum-Gum Gatling", "Gear Second"], [30, 120, 600]),
    ("mera", "Mera Mera no Mi", "§6", ["Fire Fist", "Fire Gun", "Flame Pillar"], [60, 80, 200]),
    ("hie", "Hie Hie no Mi", "§b", ["Ice Partisan", "Ice Age", "Ice Time"], [50, 240, 300]),
    ("goro", "Goro Goro no Mi", "§e", ["El Thor", "Vari: 1M Volts", "Thunder Step"], [80, 120, 80]),
    ("gura", "Gura Gura no Mi", "§f", ["Quake Punch", "Seaquake", "Tremor Wave"], [80, 160, 140]),
    ("pika", "Pika Pika no Mi", "§e", ["Yasakani no Magatama", "Ama no Murakumo", "Yata no Kagami"], [140, 60, 100]),
]


def item(identifier, name, components, category="items", group=None, icon=None):
    short = identifier.split(":")[1]
    key = f"item.grandline.{short}.name"
    LANG[key] = name
    desc = {"identifier": identifier, "menu_category": {"category": category}}
    if group:
        desc["menu_category"]["group"] = group
    comps = {
        "minecraft:icon": icon or f"grandline_{short}",
        "minecraft:display_name": {"value": key},
    }
    comps.update(components)
    w(BP, f"items/{short}.json", {"format_version": ITEM_FMT, "minecraft:item": {"description": desc, "components": comps}})
    return f"grandline_{short}"


ITEM_TEXTURES = {}


def items():
    def reg(identifier, name, components, category="items", group=None, tex=None):
        short = identifier.split(":")[1]
        key = item(identifier, name, components, category, group)
        ITEM_TEXTURES[key] = f"textures/grandline/items/{tex or short}"

    # Haki
    reg("grandline:armament_haki", "§5Armament Haki", {"minecraft:max_stack_size": 1, "grandline:haki": {"type": "armament"}}, "equipment")
    reg("grandline:observation_haki", "§3Observation Haki", {"minecraft:max_stack_size": 1, "grandline:haki": {"type": "observation"}}, "equipment")
    reg("grandline:conqueror_haki", "§4Conqueror's Haki", {"minecraft:max_stack_size": 1, "minecraft:glint": True, "grandline:haki": {"type": "conqueror"}}, "equipment")
    reg("grandline:haki_codex", "§6Haki Codex", {"minecraft:max_stack_size": 1, "grandline:codex": {}}, "equipment")

    # Devil fruits
    for key, name, color, _moves, _cds in FRUITS:
        reg(f"grandline:{key}_{key}_no_mi", f"{color}{name}", {
            "minecraft:max_stack_size": 16,
            "minecraft:food": {"nutrition": 2, "saturation_modifier": 0.3, "can_always_eat": True},
            "minecraft:use_animation": "eat",
            "minecraft:use_modifiers": {"use_duration": 1.6, "movement_modifier": 0.35},
            "grandline:devil_fruit": {"fruit": key},
        }, "items")

    # Skills (one item per move, hidden from the creative menu)
    for key, name, color, moves, cds in FRUITS:
        for i, (m, cd) in enumerate(zip(moves, cds), start=1):
            reg(f"grandline:skill_{key}_{i}", f"{color}{m}", {
                "minecraft:max_stack_size": 1,
                "minecraft:cooldown": {"category": f"grandline_{key}_{i}", "duration": round(cd / 20, 2)},
                "grandline:skill": {"fruit": key, "slot": i},
            }, "none")

    # Seastone
    reg("grandline:raw_seastone", "§3Raw Seastone", {"minecraft:max_stack_size": 64}, "items")
    reg("grandline:seastone_ingot", "§3Seastone Ingot", {"minecraft:max_stack_size": 64}, "items")
    reg("grandline:seastone_cuffs", "§3Seastone Cuffs", {"minecraft:max_stack_size": 16}, "equipment")
    reg("grandline:seastone_jitte", "§3Seastone Jitte", weapon(6, 1200, "grandline:seastone_ingot", {"grandline:seastone_weapon": {}}), "equipment", "minecraft:itemGroup.name.sword")

    # Swords
    reg("grandline:wado_ichimonji", "§fWado Ichimonji", weapon(8, 2000, "minecraft:iron_ingot"), "equipment", "minecraft:itemGroup.name.sword")
    reg("grandline:black_blade", "§8§lBlack Blade §r§7(Kokuto)", weapon(11, 4000, "minecraft:netherite_ingot", {"minecraft:glint": True}), "equipment", "minecraft:itemGroup.name.sword")

    # Treasure and the Crimson King's flag
    reg("grandline:treasure_chest", "§6Buried Treasure Chest", {"minecraft:max_stack_size": 16, "grandline:treasure": {}}, "items")
    reg("grandline:jolly_roger", "§4Jolly Roger §7(Challenge the Crimson King)", {"minecraft:max_stack_size": 1, "grandline:jolly_roger": {}}, "items")

    # Block item texture for the ore lives in terrain atlas; spawn eggs come from the client entities.
    w(RP, "textures/item_texture.json", {"resource_pack_name": "grandline", "texture_name": "atlas.items", "texture_data": {k: {"textures": v} for k, v in ITEM_TEXTURES.items()}})


def weapon(damage, durability, repair, extra=None):
    c = {
        "minecraft:max_stack_size": 1,
        "minecraft:hand_equipped": True,
        "minecraft:damage": {"value": damage},
        "minecraft:durability": {"max_durability": durability},
        "minecraft:enchantable": {"slot": "sword", "value": 14},
        "minecraft:can_destroy_in_creative": False,
        "minecraft:repairable": {"repair_items": [{"items": [repair], "repair_amount": durability // 4}]},
        "minecraft:tags": {"tags": ["minecraft:is_sword"]},
    }
    if extra:
        c.update(extra)
    return c


# ---------------------------------------------------------------------------------------------
# Blocks, worldgen
# ---------------------------------------------------------------------------------------------

def blocks():
    w(BP, "blocks/seastone_ore.json", {
        "format_version": ITEM_FMT,
        "minecraft:block": {
            "description": {"identifier": "grandline:seastone_ore", "menu_category": {"category": "nature", "group": "minecraft:itemGroup.name.ore"}},
            "components": {
                "minecraft:destructible_by_mining": {"seconds_to_destroy": 3.5},
                "minecraft:destructible_by_explosion": {"explosion_resistance": 6},
                "minecraft:light_emission": 4,
                "minecraft:map_color": "#3E8C9C",
                "minecraft:loot": "loot_tables/blocks/seastone_ore.json",
                "minecraft:geometry": "minecraft:geometry.full_block",
                "minecraft:material_instances": {"*": {"texture": "grandline_seastone_ore", "render_method": "opaque"}},
                "tag:stone": {},
            },
        },
    })
    LANG["tile.grandline:seastone_ore.name"] = "§3Seastone Ore"
    w(RP, "textures/terrain_texture.json", {
        "resource_pack_name": "grandline",
        "texture_name": "atlas.terrain",
        "padding": 8,
        "num_mip_levels": 4,
        "texture_data": {"grandline_seastone_ore": {"textures": "textures/grandline/blocks/seastone_ore"}},
    })
    w(RP, "blocks.json", {"format_version": "1.21.40", "grandline:seastone_ore": {"sound": "stone"}})

    w(BP, "features/seastone_ore_feature.json", {
        "format_version": "1.17.0",
        "minecraft:ore_feature": {
            "description": {"identifier": "grandline:seastone_ore_feature"},
            "count": 6,
            "replace_rules": [{
                "places_block": "grandline:seastone_ore",
                "may_replace": ["minecraft:stone", "minecraft:deepslate", "minecraft:gravel", "minecraft:andesite", "minecraft:diorite", "minecraft:granite", "minecraft:tuff"],
            }],
        },
    })
    w(BP, "feature_rules/seastone_ore_rule.json", {
        "format_version": "1.13.0",
        "minecraft:feature_rules": {
            "description": {"identifier": "grandline:seastone_ore_rule", "places_feature": "grandline:seastone_ore_feature"},
            "conditions": {
                "placement_pass": "underground_pass",
                "minecraft:biome_filter": [{"any_of": [
                    {"test": "has_biome_tag", "operator": "==", "value": "ocean"},
                    {"test": "has_biome_tag", "operator": "==", "value": "beach"},
                ]}],
            },
            "distribution": {
                "iterations": 7,
                "coordinate_eval_order": "zyx",
                "x": {"distribution": "uniform", "extent": [0, 16]},
                "y": {"distribution": "uniform", "extent": [-48, 40]},
                "z": {"distribution": "uniform", "extent": [0, 16]},
            },
        },
    })


# ---------------------------------------------------------------------------------------------
# Loot tables, recipes, spawn rules
# ---------------------------------------------------------------------------------------------

def fruit_entries(weight=1):
    return [{"type": "item", "name": f"grandline:{k}_{k}_no_mi", "weight": weight} for k, *_ in FRUITS]


def loot():
    w(BP, "loot_tables/blocks/seastone_ore.json", {"pools": [{"rolls": 1, "entries": [{"type": "item", "name": "grandline:raw_seastone", "functions": [{"function": "set_count", "count": {"min": 1, "max": 2}}]}]}]})
    w(BP, "loot_tables/entities/conqueror_pirate.json", {"pools": [
        {"rolls": 1, "entries": fruit_entries()},
        {"rolls": 1, "entries": [{"type": "item", "name": "grandline:black_blade"}]},
        {"rolls": 1, "entries": [{"type": "item", "name": "minecraft:gold_ingot", "functions": [{"function": "set_count", "count": {"min": 8, "max": 16}}]}]},
        {"rolls": 1, "entries": [{"type": "item", "name": "grandline:treasure_chest", "functions": [{"function": "set_count", "count": {"min": 2, "max": 3}}]}]},
        {"rolls": 1, "entries": [{"type": "item", "name": "grandline:seastone_ingot", "functions": [{"function": "set_count", "count": {"min": 2, "max": 4}}]}]},
        {"rolls": 1, "entries": [{"type": "item", "name": "minecraft:diamond", "functions": [{"function": "set_count", "count": {"min": 2, "max": 5}}]}]},
    ]})
    w(BP, "loot_tables/entities/pirate.json", {"pools": [
        {"rolls": 1, "entries": [{"type": "item", "name": "minecraft:gold_nugget", "functions": [{"function": "set_count", "count": {"min": 1, "max": 4}}, {"function": "looting_enchant", "count": {"min": 0, "max": 2}}]}]},
        {"rolls": 1, "entries": [{"type": "item", "name": "minecraft:bone", "weight": 1}, {"type": "empty", "weight": 2}]},
        {"rolls": 1, "entries": [{"type": "item", "name": "grandline:treasure_chest", "weight": 3}, {"type": "empty", "weight": 97}]},
        {"rolls": 1, "entries": fruit_entries(1) + [{"type": "empty", "weight": 594}]},
    ]})
    w(BP, "loot_tables/equipment/conqueror_pirate_gear.json", {"pools": [{"rolls": 1, "entries": [{"type": "item", "name": "grandline:black_blade"}]}]})
    w(BP, "loot_tables/equipment/pirate_brawler.json", {"pools": [{"rolls": 1, "entries": [{"type": "item", "name": "minecraft:iron_sword", "weight": 3}, {"type": "item", "name": "minecraft:stone_sword", "weight": 2}]}]})

    # Vanilla chests with a chance of Devil Fruits and treasure (copies of vanilla tables + one pool).
    extra = {
        "buriedtreasure": [
            {"rolls": 1, "entries": fruit_entries(1) + [{"type": "empty", "weight": 10}]},
            {"rolls": 1, "entries": [{"type": "item", "name": "grandline:treasure_chest", "functions": [{"function": "set_count", "count": {"min": 1, "max": 2}}]}]},
        ],
        "shipwrecktreasure": [{"rolls": 1, "entries": fruit_entries(1) + [{"type": "empty", "weight": 40}]}],
        "simple_dungeon": [{"rolls": 1, "entries": fruit_entries(1) + [{"type": "empty", "weight": 110}]}],
    }
    for name, pools in extra.items():
        src = os.path.join(HERE, "vanilla_loot", f"{name}.json")
        with open(src, encoding="utf-8") as f:
            table = json.load(f)
        table["pools"] = table["pools"] + pools
        w(BP, f"loot_tables/chests/{name}.json", table)


def recipe_shaped(rid, pattern, key, result, count=1, unlock=None):
    w(BP, f"recipes/{rid}.json", {
        "format_version": "1.20.10",
        "minecraft:recipe_shaped": {
            "description": {"identifier": f"grandline:{rid}"},
            "tags": ["crafting_table"],
            "pattern": pattern,
            "key": {k: {"item": v} for k, v in key.items()},
            "unlock": [{"item": unlock or list(key.values())[0]}],
            "result": {"item": result, "count": count},
        },
    })


def recipes():
    recipe_shaped("jolly_roger", ["WBW", "WGW", " S "], {"W": "minecraft:black_wool", "B": "minecraft:bone", "G": "minecraft:gold_ingot", "S": "minecraft:stick"}, "grandline:jolly_roger", unlock="minecraft:bone")
    recipe_shaped("wado_ichimonji", ["  D", " I ", "S  "], {"D": "minecraft:diamond", "I": "minecraft:iron_ingot", "S": "minecraft:stick"}, "grandline:wado_ichimonji", unlock="minecraft:diamond")
    recipe_shaped("seastone_jitte", ["N N", " N ", " S "], {"N": "grandline:seastone_ingot", "S": "minecraft:stick"}, "grandline:seastone_jitte")
    recipe_shaped("seastone_cuffs", ["NIN"], {"N": "grandline:seastone_ingot", "I": "minecraft:iron_ingot"}, "grandline:seastone_cuffs", 2)
    w(BP, "recipes/seastone_ingot.json", {
        "format_version": "1.20.10",
        "minecraft:recipe_furnace": {
            "description": {"identifier": "grandline:seastone_ingot"},
            "tags": ["furnace", "blast_furnace"],
            "input": "grandline:raw_seastone",
            "output": "grandline:seastone_ingot",
        },
    })


def spawn_rules():
    w(BP, "spawn_rules/pirate.json", {
        "format_version": "1.8.0",
        "minecraft:spawn_rules": {
            "description": {"identifier": "grandline:pirate", "population_control": "monster"},
            "conditions": [{
                "minecraft:spawns_on_surface": {},
                "minecraft:brightness_filter": {"min": 0, "max": 7, "adjust_for_weather": True},
                "minecraft:difficulty_filter": {"min": "easy", "max": "hard"},
                "minecraft:weight": {"default": 45},
                "minecraft:herd": {"min_size": 2, "max_size": 4},
                "minecraft:density_limit": {"surface": 6},
                "minecraft:biome_filter": {"any_of": [{"test": "has_biome_tag", "value": "beach"}, {"test": "has_biome_tag", "value": "stone_beach"}]},
            }],
        },
    })


# ---------------------------------------------------------------------------------------------
# Entities (behavior)
# ---------------------------------------------------------------------------------------------

def prop_bool():
    return {"type": "bool", "default": False, "client_sync": True}


HOSTILE_TARGETS = {
    "priority": 2,
    "must_see": False,
    "reselect_targets": True,
    "within_radius": 40,
    "entity_types": [
        {"filters": {"test": "is_family", "subject": "other", "value": "player"}, "max_dist": 40},
        {"filters": {"test": "is_family", "subject": "other", "value": "irongolem"}, "max_dist": 20},
    ],
}


def boss_entity():
    w(BP, "entities/conqueror_pirate.json", {
        "format_version": ENTITY_FMT,
        "minecraft:entity": {
            "description": {
                "identifier": "grandline:conqueror_pirate",
                "is_spawnable": True,
                "is_summonable": True,
                "properties": {
                    "grandline:phase": {"type": "int", "range": [1, 2], "default": 1, "client_sync": True},
                    "grandline:charging": prop_bool(),
                    "grandline:clashing": prop_bool(),
                    "grandline:stunned": prop_bool(),
                },
            },
            "component_groups": {
                "grandline:enraged": {"minecraft:movement": {"value": 0.36}, "minecraft:attack": {"damage": 15}},
            },
            "components": {
                "minecraft:type_family": {"family": ["pirate", "conqueror", "monster", "mob"]},
                "minecraft:health": {"value": 400, "max": 400},
                "minecraft:attack": {"damage": 11},
                "minecraft:movement": {"value": 0.31},
                "minecraft:movement.basic": {},
                "minecraft:jump.static": {},
                "minecraft:navigation.walk": {"can_path_over_water": True, "avoid_water": True, "can_open_doors": True},
                "minecraft:collision_box": {"width": 0.7, "height": 2.15},
                "minecraft:physics": {},
                "minecraft:pushable": {"is_pushable": False, "is_pushable_by_piston": True},
                "minecraft:knockback_resistance": {"value": 0.75},
                "minecraft:follow_range": {"value": 48, "max": 48},
                "minecraft:boss": {"hud_range": 55, "should_darken_sky": True},
                "minecraft:persistent": {},
                "minecraft:nameable": {"always_show": False, "allow_name_tag_renaming": False},
                "minecraft:breathable": {"total_supply": 15, "suffocate_time": 0},
                "minecraft:loot": {"table": "loot_tables/entities/conqueror_pirate.json"},
                "minecraft:equipment": {"table": "loot_tables/equipment/conqueror_pirate_gear.json", "slot_drop_chance": [{"slot": "slot.weapon.mainhand", "drop_chance": 0}]},
                "minecraft:experience_reward": {"on_death": "250"},
                "minecraft:damage_sensor": {"triggers": [{"cause": "fall", "deals_damage": False}]},
                "minecraft:behavior.float": {"priority": 0},
                "minecraft:behavior.hurt_by_target": {"priority": 1, "entity_types": {"filters": {"test": "is_family", "subject": "other", "operator": "!=", "value": "pirate"}}},
                "minecraft:behavior.melee_attack": {"priority": 2, "speed_multiplier": 1.25, "track_target": True},
                "minecraft:behavior.nearest_attackable_target": HOSTILE_TARGETS,
                "minecraft:behavior.random_stroll": {"priority": 7, "speed_multiplier": 0.8},
                "minecraft:behavior.look_at_player": {"priority": 8, "look_distance": 16},
                "minecraft:behavior.random_look_around": {"priority": 9},
            },
            "events": {
                "grandline:phase_two": {"add": {"component_groups": ["grandline:enraged"]}, "set_property": {"grandline:phase": 2}},
                "grandline:clash_start": {"set_property": {"grandline:clashing": True}},
                "grandline:clash_end": {"set_property": {"grandline:clashing": False}},
                "grandline:stunned": {"set_property": {"grandline:stunned": True}},
                "grandline:recover": {"set_property": {"grandline:stunned": False}},
            },
        },
    })
    LANG["entity.grandline:conqueror_pirate.name"] = "Varek, the Crimson King"
    LANG["item.spawn_egg.entity.grandline:conqueror_pirate.name"] = "Spawn Varek, the Crimson King"


def pirate_entity():
    ranged = {"priority": 3, "attack_interval_min": 1.5, "attack_interval_max": 2.5, "attack_radius": 14}
    w(BP, "entities/pirate.json", {
        "format_version": ENTITY_FMT,
        "minecraft:entity": {
            "description": {
                "identifier": "grandline:pirate",
                "is_spawnable": True,
                "is_summonable": True,
                "properties": {"grandline:stunned": prop_bool()},
            },
            "component_groups": {
                "grandline:brawler": {
                    "minecraft:variant": {"value": 0},
                    "minecraft:equipment": {"table": "loot_tables/equipment/pirate_brawler.json", "slot_drop_chance": [{"slot": "slot.weapon.mainhand", "drop_chance": 0.05}]},
                    "minecraft:behavior.melee_attack": {"priority": 3, "speed_multiplier": 1.2, "track_target": True},
                    "minecraft:health": {"value": 24, "max": 24},
                },
                "grandline:gunner": {
                    "minecraft:variant": {"value": 1},
                    "minecraft:shooter": {"def": "grandline:pirate_bullet"},
                    "minecraft:behavior.ranged_attack": ranged,
                    "minecraft:health": {"value": 20, "max": 20},
                },
                "grandline:flame": {
                    "minecraft:variant": {"value": 2},
                    "minecraft:shooter": {"def": "grandline:fire_bullet"},
                    "minecraft:behavior.ranged_attack": ranged,
                    "minecraft:health": {"value": 30, "max": 30},
                    "minecraft:fire_immune": {},
                },
            },
            "components": {
                "minecraft:type_family": {"family": ["pirate", "monster", "mob"]},
                "minecraft:health": {"value": 24, "max": 24},
                "minecraft:attack": {"damage": 5},
                "minecraft:movement": {"value": 0.3},
                "minecraft:movement.basic": {},
                "minecraft:jump.static": {},
                "minecraft:navigation.walk": {"can_path_over_water": True, "avoid_water": True, "can_open_doors": True},
                "minecraft:collision_box": {"width": 0.6, "height": 1.9},
                "minecraft:physics": {},
                "minecraft:pushable": {"is_pushable": True, "is_pushable_by_piston": True},
                "minecraft:follow_range": {"value": 32, "max": 32},
                "minecraft:breathable": {"total_supply": 15, "suffocate_time": 0},
                "minecraft:nameable": {},
                "minecraft:loot": {"table": "loot_tables/entities/pirate.json"},
                "minecraft:experience_reward": {"on_death": "query.last_hit_by_player ? 8 : 0"},
                "minecraft:despawn": {"despawn_from_distance": {"min_distance": 32, "max_distance": 128}},
                "minecraft:behavior.float": {"priority": 0},
                "minecraft:behavior.hurt_by_target": {"priority": 1, "alert_same_type": True},
                "minecraft:behavior.nearest_attackable_target": HOSTILE_TARGETS,
                "minecraft:behavior.random_stroll": {"priority": 7, "speed_multiplier": 0.9},
                "minecraft:behavior.look_at_player": {"priority": 8, "look_distance": 10},
                "minecraft:behavior.random_look_around": {"priority": 9},
            },
            "events": {
                "minecraft:entity_spawned": {"randomize": [
                    {"weight": 60, "add": {"component_groups": ["grandline:brawler"]}},
                    {"weight": 28, "add": {"component_groups": ["grandline:gunner"]}},
                    {"weight": 12, "add": {"component_groups": ["grandline:flame"]}},
                ]},
                "grandline:stunned": {"set_property": {"grandline:stunned": True}},
                "grandline:recover": {"set_property": {"grandline:stunned": False}},
            },
        },
    })
    LANG["entity.grandline:pirate.name"] = "Pirate"
    LANG["item.spawn_egg.entity.grandline:pirate.name"] = "Spawn Pirate"


PROJECTILES = {
    # id: (collision, power, gravity, lifetime seconds)
    "fire_fist": (0.7, 1.5, 0.0, 4),
    "fire_bullet": (0.3, 2.4, 0.0, 3),
    "ice_spear": (0.35, 2.0, 0.01, 3),
    "light_bullet": (0.3, 3.2, 0.0, 2.5),
    "rubber_fist": (0.5, 2.4, 0.0, 1),
    "haki_wave": (0.6, 1.9, 0.0, 3),
    "pirate_bullet": (0.2, 2.6, 0.01, 3),
}


def projectiles():
    for pid, (size, power, gravity, life) in PROJECTILES.items():
        w(BP, f"entities/{pid}.json", {
            "format_version": ENTITY_FMT,
            "minecraft:entity": {
                "description": {"identifier": f"grandline:{pid}", "is_spawnable": False, "is_summonable": True, "runtime_identifier": "minecraft:snowball"},
                "component_groups": {"grandline:despawn": {"minecraft:instant_despawn": {}}},
                "components": {
                    "minecraft:type_family": {"family": ["projectile", "grandline_projectile"]},
                    "minecraft:collision_box": {"width": size, "height": size},
                    "minecraft:projectile": {
                        "on_hit": {"remove_on_hit": {}},
                        "power": power,
                        "gravity": gravity,
                        "inertia": 1.0,
                        "liquid_inertia": 0.6,
                        "anchor": 1,
                        "offset": [0, -0.1, 0],
                        "uncertainty_base": 1 if pid == "pirate_bullet" else 0,
                        "uncertainty_multiplier": 0,
                        "should_bounce": False,
                    },
                    "minecraft:physics": {},
                    "minecraft:pushable": {"is_pushable": False, "is_pushable_by_piston": False},
                    "minecraft:timer": {"time": life, "looping": False, "time_down_event": {"event": "grandline:expire", "target": "self"}},
                },
                "events": {"grandline:expire": {"add": {"component_groups": ["grandline:despawn"]}}},
            },
        })
        LANG[f"entity.grandline:{pid}.name"] = pid.replace("_", " ").title()


# ---------------------------------------------------------------------------------------------
# Client side: geometry, animations, controllers, client entities
# ---------------------------------------------------------------------------------------------

def models():
    w(RP, "models/entity/grandline_captain.geo.json", geometry("geometry.grandline.captain", captain_bones(), 128, 64, (3, 3.5)))
    w(RP, "models/entity/grandline_pirate.geo.json", geometry("geometry.grandline.pirate", humanoid_bones(), 64, 64, (2.5, 3)))
    w(RP, "models/entity/grandline_fist.geo.json", geometry("geometry.grandline.fist", fist_bones(), 32, 32, (1, 1)))
    w(RP, "models/entity/grandline_spear.geo.json", geometry("geometry.grandline.spear", spear_bones(), 32, 32, (2, 1)))
    w(RP, "models/entity/grandline_bullet.geo.json", geometry("geometry.grandline.bullet", bullet_bones(), 16, 16, (1, 1)))
    w(RP, "models/entity/grandline_empty.geo.json", geometry("geometry.grandline.empty", empty_bones(), 16, 16, (2, 2)))


WALK = "math.cos(query.modified_distance_moved * 38.17) * query.modified_move_speed * 57.3"
ATTACK_T = "(variable.attack_time ?? 0.0)"


def animations():
    anims = {
        "animation.grandline.humanoid.walk": {"loop": True, "bones": {
            "rightArm": {"rotation": [f"-{WALK}", 0, 0]},
            "leftArm": {"rotation": [f"{WALK}", 0, 0]},
            "rightLeg": {"rotation": [f"{WALK} * 1.4", 0, 0]},
            "leftLeg": {"rotation": [f"-{WALK} * 1.4", 0, 0]},
        }},
        "animation.grandline.humanoid.look": {"loop": True, "bones": {"head": {"rotation": ["query.target_x_rotation", "query.target_y_rotation", 0]}}},
        "animation.grandline.humanoid.idle": {"loop": True, "bones": {
            "rightArm": {"rotation": [-8, 0, "math.cos(query.life_time * 103.2) * 2.865 + 2.865"]},
            "leftArm": {"rotation": [0, 0, "-(math.cos(query.life_time * 103.2) * 2.865 + 2.865)"]},
        }},
        "animation.grandline.humanoid.attack": {"loop": True, "bones": {
            "rightArm": {"rotation": [f"-math.sin(math.sqrt({ATTACK_T}) * 180.0) * 95.0", f"math.sin(math.sqrt({ATTACK_T}) * 360.0) * 20.0", 0]},
            "body": {"rotation": [0, f"math.sin(math.sqrt({ATTACK_T}) * 360.0) * 11.46", 0]},
        }},
        "animation.grandline.humanoid.ko": {"loop": True, "bones": {
            "root": {"rotation": [90, 0, 0], "position": [0, 2, 6]},
            "head": {"rotation": [0, "math.sin(query.life_time * 200) * 15", 0]},
        }},
        "animation.grandline.captain.coat": {"loop": True, "bones": {
            "coat": {"rotation": [
                "-(6.0 + query.modified_move_speed * 50.0 + math.sin(query.life_time * 90.0) * 3.0 + (query.property('grandline:phase') == 2 ? math.sin(query.life_time * 420.0) * 7.0 + 10.0 : 0.0))",
                0, 0]},
        }},
        "animation.grandline.captain.roar": {"animation_length": 1.4, "bones": {
            "body": {"rotation": {"0.0": [0, 0, 0], "0.25": [-14, 0, 0], "1.1": [-14, 0, 0], "1.4": [0, 0, 0]}},
            "head": {"rotation": {"0.0": [0, 0, 0], "0.25": [-25, 0, 0], "1.1": [-25, 0, 0], "1.4": [0, 0, 0]}},
            "rightArm": {"rotation": {"0.0": [0, 0, 0], "0.25": [-20, 0, 60], "1.1": [-20, 0, 65], "1.4": [0, 0, 0]}},
            "leftArm": {"rotation": {"0.0": [0, 0, 0], "0.25": [-20, 0, -60], "1.1": [-20, 0, -65], "1.4": [0, 0, 0]}},
        }},
        "animation.grandline.captain.charge": {"animation_length": 1.2, "bones": {
            "body": {"rotation": {"0.0": [0, 0, 0], "0.3": [12, 0, 0], "1.2": [12, 0, 0]}, "position": {"0.0": [0, 0, 0], "0.3": [0, -1, 0], "1.2": ["math.sin(query.life_time * 2000) * 0.3", -1, 0]}},
            "rightArm": {"rotation": {"0.0": [0, 0, 0], "0.3": [-60, 30, 0], "1.2": [-60, 30, 0]}},
            "leftArm": {"rotation": {"0.0": [0, 0, 0], "0.3": [-60, -30, 0], "1.2": [-60, -30, 0]}},
        }},
        "animation.grandline.captain.clash": {"loop": True, "bones": {
            "body": {"rotation": [14, 0, 0]},
            "rightArm": {"rotation": ["-85 + math.sin(query.life_time * 1500) * 3", 0, 0]},
            "leftArm": {"rotation": [10, 0, -15]},
            "rightLeg": {"rotation": [-18, 0, 0]},
            "leftLeg": {"rotation": [18, 0, 0]},
        }},
        "animation.grandline.captain.leap": {"animation_length": 0.9, "bones": {
            "rightArm": {"rotation": {"0.0": [0, 0, 0], "0.2": [-170, 0, 0], "0.7": [-170, 0, 0], "0.9": [-30, 0, 0]}},
            "leftArm": {"rotation": {"0.0": [0, 0, 0], "0.2": [-170, 0, 0], "0.7": [-170, 0, 0], "0.9": [-30, 0, 0]}},
        }},
        "animation.grandline.captain.punch": {"animation_length": 0.5, "bones": {
            "rightArm": {"rotation": {"0.0": [0, 0, 0], "0.12": [-90, -10, 0], "0.35": [-90, -10, 0], "0.5": [0, 0, 0]}},
            "body": {"rotation": {"0.0": [0, 0, 0], "0.12": [0, -20, 0], "0.5": [0, 0, 0]}},
        }},
        # Played on players by the scripts.
        "animation.grandline.player.haoshoku": {"animation_length": 1.2, "bones": {
            "body": {"rotation": {"0.0": [0, 0, 0], "0.15": [-12, 0, 0], "0.95": [-12, 0, 0], "1.2": [0, 0, 0]}},
            "head": {"rotation": {"0.0": [0, 0, 0], "0.15": [-20, 0, 0], "0.95": [-20, 0, 0], "1.2": [0, 0, 0]}},
            "rightArm": {"rotation": {"0.0": [0, 0, 0], "0.15": [0, 0, 25], "0.95": [0, 0, 25], "1.2": [0, 0, 0]}},
            "leftArm": {"rotation": {"0.0": [0, 0, 0], "0.15": [0, 0, -25], "0.95": [0, 0, -25], "1.2": [0, 0, 0]}},
        }},
        "animation.grandline.player.clash": {"animation_length": 10.0, "bones": {
            "body": {"rotation": [12, 0, 0]},
            "rightArm": {"rotation": ["-85 + math.sin(query.life_time * 1500) * 3", 0, 0]},
            "leftArm": {"rotation": [10, 0, -15]},
            "rightLeg": {"rotation": [-15, 0, 0]},
            "leftLeg": {"rotation": [15, 0, 0]},
        }},
        "animation.grandline.player.punch": {"animation_length": 0.4, "bones": {
            "rightArm": {"rotation": {"0.0": [0, 0, 0], "0.08": [-90, -15, 0], "0.3": [-90, -15, 0], "0.4": [0, 0, 0]}},
        }},
        "animation.grandline.player.ko": {"loop": True, "bones": {
            "root": {"rotation": [90, 0, 0], "position": [0, 2, 6]},
        }},
        "animation.grandline.player.release": {"animation_length": 0.3, "bones": {
            "rightArm": {"rotation": {"0.0": [-60, 0, 0], "0.3": [0, 0, 0]}},
        }},
        # Particle trails for projectiles (emitter fires once; long length so it never restarts).
        "animation.grandline.projectile.trail": {"loop": True, "animation_length": 30, "particle_effects": {"0.0": {"effect": "trail"}}},
        "animation.grandline.projectile.spin": {"loop": True, "bones": {"root": {"rotation": [0, 0, "query.life_time * 720"]}}},
        "animation.grandline.pirate.flames": {"loop": True, "animation_length": 30, "particle_effects": {"0.0": {"effect": "flames"}}},
    }
    w(RP, "animations/grandline.animation.json", {"format_version": "1.8.0", "animations": anims})

    controllers = {
        "controller.animation.grandline.ko": {"initial_state": "default", "states": {
            "default": {"transitions": [{"ko": "query.property('grandline:stunned')"}]},
            "ko": {"animations": ["ko"], "transitions": [{"default": "!query.property('grandline:stunned')"}], "blend_transition": 0.25},
        }},
        "controller.animation.grandline.captain_clash": {"initial_state": "default", "states": {
            "default": {"transitions": [{"clash": "query.property('grandline:clashing')"}]},
            "clash": {"animations": ["clash_pose"], "transitions": [{"default": "!query.property('grandline:clashing')"}], "blend_transition": 0.2},
        }},
        "controller.animation.grandline.pirate_flames": {"initial_state": "default", "states": {
            "default": {"transitions": [{"burning": "query.variant == 2"}]},
            "burning": {"animations": ["flames"]},
        }},
    }
    w(RP, "animation_controllers/grandline.animation_controllers.json", {"format_version": "1.10.0", "animation_controllers": controllers})


def render_controllers():
    w(RP, "render_controllers/grandline.render_controllers.json", {"format_version": "1.8.0", "render_controllers": {
        "controller.render.grandline.default": {
            "geometry": "Geometry.default",
            "materials": [{"*": "Material.default"}],
            "textures": ["Texture.default"],
        },
        "controller.render.grandline.eyes": {
            "geometry": "Geometry.default",
            "materials": [{"*": "Material.eyes"}],
            "textures": ["Texture.eyes"],
        },
        "controller.render.grandline.pirate": {
            "arrays": {"textures": {"Array.skins": ["Texture.brawler", "Texture.gunner", "Texture.flame"]}},
            "geometry": "Geometry.default",
            "materials": [{"*": "Material.default"}],
            "textures": ["Array.skins[query.variant]"],
        },
    }})


def client_entities():
    w(RP, "entity/conqueror_pirate.entity.json", {"format_version": "1.10.0", "minecraft:client_entity": {"description": {
        "identifier": "grandline:conqueror_pirate",
        "materials": {"default": "entity_alphatest", "eyes": "entity_emissive_alpha"},
        "textures": {"default": "textures/grandline/entity/conqueror_pirate", "eyes": "textures/grandline/entity/conqueror_pirate_eyes"},
        "geometry": {"default": "geometry.grandline.captain"},
        "spawn_egg": {"base_color": "#14080A", "overlay_color": "#C21B1B"},
        "scripts": {"scale": "1.12", "animate": ["walk", "look", "idle", "attack", "coat", "ctrl_ko", "ctrl_clash"]},
        "animations": {
            "walk": "animation.grandline.humanoid.walk",
            "look": "animation.grandline.humanoid.look",
            "idle": "animation.grandline.humanoid.idle",
            "attack": "animation.grandline.humanoid.attack",
            "coat": "animation.grandline.captain.coat",
            "ko": "animation.grandline.humanoid.ko",
            "clash_pose": "animation.grandline.captain.clash",
            "ctrl_ko": "controller.animation.grandline.ko",
            "ctrl_clash": "controller.animation.grandline.captain_clash",
        },
        "render_controllers": [
            "controller.render.grandline.default",
            {"controller.render.grandline.eyes": "query.property('grandline:phase') == 2 || query.property('grandline:charging') || query.property('grandline:clashing')"},
        ],
        "enable_attachables": True,
    }}})
    w(RP, "entity/pirate.entity.json", {"format_version": "1.10.0", "minecraft:client_entity": {"description": {
        "identifier": "grandline:pirate",
        "materials": {"default": "entity_alphatest"},
        "textures": {
            "brawler": "textures/grandline/entity/pirate_brawler",
            "gunner": "textures/grandline/entity/pirate_gunner",
            "flame": "textures/grandline/entity/pirate_flame",
        },
        "geometry": {"default": "geometry.grandline.pirate"},
        "spawn_egg": {"base_color": "#2B3A67", "overlay_color": "#E8E1D0"},
        "particle_effects": {"flames": "grandline:pirate_flames"},
        "scripts": {"animate": ["walk", "look", "idle", "attack", "ctrl_ko", "ctrl_flames"]},
        "animations": {
            "walk": "animation.grandline.humanoid.walk",
            "look": "animation.grandline.humanoid.look",
            "idle": "animation.grandline.humanoid.idle",
            "attack": "animation.grandline.humanoid.attack",
            "ko": "animation.grandline.humanoid.ko",
            "flames": "animation.grandline.pirate.flames",
            "ctrl_ko": "controller.animation.grandline.ko",
            "ctrl_flames": "controller.animation.grandline.pirate_flames",
        },
        "render_controllers": ["controller.render.grandline.pirate"],
        "enable_attachables": True,
    }}})

    def projectile(pid, geo, tex, trail=None, spin=False, material="entity_alphatest"):
        desc = {
            "identifier": f"grandline:{pid}",
            "materials": {"default": material},
            "textures": {"default": f"textures/grandline/entity/{tex}"},
            "geometry": {"default": geo},
            "render_controllers": ["controller.render.grandline.default"],
            "scripts": {"animate": []},
            "animations": {},
        }
        if trail:
            desc["particle_effects"] = {"trail": trail}
            desc["animations"]["trail"] = "animation.grandline.projectile.trail"
            desc["scripts"]["animate"].append("trail")
        if spin:
            desc["animations"]["spin"] = "animation.grandline.projectile.spin"
            desc["scripts"]["animate"].append("spin")
        w(RP, f"entity/{pid}.entity.json", {"format_version": "1.10.0", "minecraft:client_entity": {"description": desc}})

    projectile("fire_fist", "geometry.grandline.empty", "blank", "grandline:fire_fist_trail")
    projectile("fire_bullet", "geometry.grandline.empty", "blank", "grandline:fire_bullet_trail")
    projectile("ice_spear", "geometry.grandline.spear", "ice_spear", "grandline:ice_trail", spin=True)
    projectile("light_bullet", "geometry.grandline.empty", "blank", "grandline:light_trail")
    projectile("rubber_fist", "geometry.grandline.fist", "rubber_fist")
    projectile("haki_wave", "geometry.grandline.empty", "blank", "grandline:haki_wave_trail")
    projectile("pirate_bullet", "geometry.grandline.bullet", "pirate_bullet", "grandline:bullet_trail")


def fog():
    w(RP, "fogs/clash_fog.json", {
        "format_version": "1.16.100",
        "minecraft:fog_settings": {
            "description": {"identifier": "grandline:clash_fog"},
            "distance": {
                "air": {"fog_start": 6.0, "fog_end": 72.0, "fog_color": "#2A0207", "render_distance_type": "fixed"},
                "weather": {"fog_start": 4.0, "fog_end": 48.0, "fog_color": "#1A0104", "render_distance_type": "fixed"},
            },
        },
    })


# ---------------------------------------------------------------------------------------------
# Particles
# ---------------------------------------------------------------------------------------------

TEX = "textures/grandline/particle/"
COLOR_VAR = ["variable.color.r ?? 1", "variable.color.g ?? 0.1", "variable.color.b ?? 0.1"]
FADE = "1 - v.particle_age / v.particle_lifetime"


def full_uv(size):
    return {"texture_width": size[0], "texture_height": size[1], "uv": [0, 0], "uv_size": list(size)}


TEX_SIZES = {
    "glow": (32, 32), "spark": (16, 16), "bolt": (32, 8), "core": (32, 8), "ring": (64, 64), "smoke": (32, 32),
    "flame": (16, 16), "star": (16, 16), "crack": (64, 64), "shard": (16, 16), "flake": (8, 8), "fist": (32, 32),
    "chain": (16, 16), "coin": (16, 16), "marker": (16, 16), "wave": (32, 32),
}


def particle(pid, tex, material, components, curves=None, fmt="1.10.0"):
    pe = {
        "description": {"identifier": f"grandline:{pid}", "basic_render_parameters": {"material": material, "texture": TEX + tex}},
        "components": components,
    }
    if curves:
        pe["curves"] = curves
    w(RP, f"particles/{pid}.json", {"format_version": fmt, "particle_effect": pe})


def burst(pid, tex, material, n, life, size, speed, color, *, shape=None, drag=1.0, accel=(0, 0, 0), alpha=FADE, shrink=True, rotate=False, active=0.05, rate=None, extra=None, facing="lookat_xyz"):
    """Generic emitter: instant (or short steady) burst of billboards."""
    c = {}
    if rate:
        c["minecraft:emitter_rate_steady"] = {"spawn_rate": rate, "max_particles": 400}
        c["minecraft:emitter_lifetime_once"] = {"active_time": active}
    else:
        c["minecraft:emitter_rate_instant"] = {"num_particles": n}
        c["minecraft:emitter_lifetime_once"] = {"active_time": active}
    c.update(shape or {"minecraft:emitter_shape_sphere": {"radius": 0.2, "direction": "outwards"}})
    c["minecraft:particle_lifetime_expression"] = {"max_lifetime": life}
    c["minecraft:particle_initial_speed"] = speed
    c["minecraft:particle_motion_dynamic"] = {"linear_acceleration": list(accel), "linear_drag_coefficient": drag}
    if rotate:
        c["minecraft:particle_initial_spin"] = {"rotation": "math.random(0, 360)", "rotation_rate": "math.random(-180, 180)"}
    sz = size if isinstance(size, (int, float, str)) else size
    s = f"({sz}) * (1 - v.particle_age / v.particle_lifetime * 0.7)" if shrink else f"{sz}"
    c["minecraft:particle_appearance_billboard"] = {"size": [s, s], "facing_camera_mode": facing, "uv": full_uv(TEX_SIZES[tex])}
    c["minecraft:particle_appearance_tinting"] = {"color": list(color[:3]) + [alpha]} if not isinstance(color, dict) else color
    if extra:
        c.update(extra)
    particle(pid, tex, material, c)


def gradient(stops, interp="v.particle_age / v.particle_lifetime"):
    return {"color": {"gradient": {f"{k:.2f}": v for k, v in stops.items()}, "interpolant": interp}}


def halo(pid, tex, material, start, end, life, color, alpha="1 - v.particle_age / v.particle_lifetime"):
    """A single camera-facing sprite that grows (shockwaves, flashes)."""
    c = {
        "minecraft:emitter_rate_instant": {"num_particles": 1},
        "minecraft:emitter_lifetime_once": {"active_time": 0.05},
        "minecraft:emitter_shape_point": {},
        "minecraft:particle_lifetime_expression": {"max_lifetime": life},
        "minecraft:particle_initial_speed": 0,
        "minecraft:particle_motion_dynamic": {},
        "minecraft:particle_appearance_billboard": {
            "size": [f"math.lerp({start}, {end}, math.pow(v.particle_age / v.particle_lifetime, 0.6))"] * 2,
            "facing_camera_mode": "lookat_xyz",
            "uv": full_uv(TEX_SIZES[tex]),
        },
        "minecraft:particle_appearance_tinting": {"color": list(color[:3]) + [alpha]} if not isinstance(color, dict) else color,
    }
    particle(pid, tex, material, c)


def segment_particle(pid, tex, material):
    particle(pid, tex, material, fmt="1.21.0", components={
        "minecraft:emitter_rate_instant": {"num_particles": 1},
        "minecraft:emitter_lifetime_once": {"active_time": 0.05},
        "minecraft:emitter_shape_point": {},
        "minecraft:particle_lifetime_expression": {"max_lifetime": "variable.life ?? 0.18"},
        "minecraft:particle_initial_speed": 0,
        "minecraft:particle_motion_dynamic": {},
        "minecraft:particle_appearance_billboard": {
            "size": ["(variable.len ?? 1.0) * 0.5 + 0.03", "(variable.width ?? 0.15) * (1.0 - v.particle_age / v.particle_lifetime * 0.6)"],
            "facing_camera_mode": "lookat_direction",
            "direction": {"mode": "custom", "custom_direction": ["variable.dx ?? 1.0", "variable.dy ?? 0.0", "variable.dz ?? 0.0"]},
            "uv": full_uv(TEX_SIZES[tex]),
        },
        "minecraft:particle_appearance_tinting": {"color": COLOR_VAR + ["(1 - v.particle_age / v.particle_lifetime) * (0.75 + math.random(0, 0.25))"]},
    })


def trail(pid, tex, material, rate, life, size, color, spread=0.15, accel=(0, 0, 0), rotate=True, offset=(0, 0, 0)):
    c = {
        "minecraft:emitter_rate_steady": {"spawn_rate": rate, "max_particles": 200},
        "minecraft:emitter_lifetime_expression": {"activation_expression": 1, "expiration_expression": 0},
        "minecraft:emitter_shape_sphere": {"radius": spread, "direction": "outwards", "offset": list(offset)},
        "minecraft:particle_lifetime_expression": {"max_lifetime": life},
        "minecraft:particle_initial_speed": 0.3,
        "minecraft:particle_motion_dynamic": {"linear_acceleration": list(accel), "linear_drag_coefficient": 2},
        "minecraft:particle_appearance_billboard": {"size": [f"{size} * (1 - v.particle_age / v.particle_lifetime * 0.8)"] * 2, "facing_camera_mode": "lookat_xyz", "uv": full_uv(TEX_SIZES[tex])},
        "minecraft:particle_appearance_tinting": color if isinstance(color, dict) else {"color": list(color[:3]) + [FADE]},
    }
    if rotate:
        c["minecraft:particle_initial_spin"] = {"rotation": "math.random(0, 360)", "rotation_rate": "math.random(-90, 90)"}
    particle(pid, tex, material, c)


def particles():
    ADD = "particles_add"
    BLEND = "particles_blend"
    ALPHA = "particles_alpha"
    fire_grad = gradient({0.0: [1.0, 0.95, 0.6, 1.0], 0.3: [1.0, 0.6, 0.12, 0.95], 0.7: [0.85, 0.18, 0.02, 0.6], 1.0: [0.3, 0.05, 0.02, 0.0]})
    dark_grad = gradient({0.0: [0.9, 0.05, 0.08, 0.9], 0.4: [0.35, 0.0, 0.04, 0.8], 1.0: [0.02, 0.0, 0.02, 0.0]})

    # Lightning segments (black core + coloured glow)
    segment_particle("bolt_glow", "bolt", ADD)
    segment_particle("bolt_core", "core", BLEND)

    # Conqueror's Haki
    halo("haoshoku_wave", "ring", ADD, 0.5, "(variable.radius ?? 8) * 2.2", 0.55, gradient({0.0: [1, 0.15, 0.15, 1], 0.5: [0.8, 0.0, 0.05, 0.7], 1.0: [0.3, 0.0, 0.0, 0.0]}))
    halo("haoshoku_wave_boss", "ring", BLEND, 0.5, "(variable.radius ?? 12) * 2.4", 0.7, gradient({0.0: [0.05, 0.0, 0.02, 0.95], 0.4: [0.45, 0.0, 0.05, 0.75], 1.0: [0.1, 0.0, 0.0, 0.0]}))
    burst("shockwave_ring", "glow", ADD, "math.clamp((variable.radius ?? 6) * 12, 24, 160)", 0.65, 0.45, "(variable.radius ?? 6) * 2.4", COLOR_VAR,
          shape={"minecraft:emitter_shape_disc": {"radius": 0.4, "surface_only": True, "plane_normal": "y", "direction": "outwards"}}, drag=2.2)
    burst("conqueror_spark", "spark", ADD, 7, "math.random(0.12, 0.3)", 0.22, 3, [1, 0.12, 0.12], rotate=True, drag=4)
    burst("haki_aura", "smoke", BLEND, "8 * (variable.scale ?? 1)", "math.random(0.4, 0.8)", "0.35 * (variable.scale ?? 1)", 0.4, COLOR_VAR,
          shape={"minecraft:emitter_shape_disc": {"radius": "0.55 * (variable.scale ?? 1)", "plane_normal": "y", "direction": [0, 1, 0]}},
          accel=(0, 2.5, 0), rotate=True)
    burst("charge_in", "spark", ADD, 10, 0.35, 0.18, -8, [1, 0.1, 0.1],
          shape={"minecraft:emitter_shape_sphere": {"radius": 3, "surface_only": True, "direction": "outwards"}}, drag=0)
    halo("clash_core", "glow", ADD, 1.6, 0.8, 0.14, [1, 0.12, 0.1], "0.9")
    halo("clash_finale", "glow", ADD, 1, 18, 0.7, gradient({0.0: [1, 1, 1, 1], 0.3: [1, 0.2, 0.15, 0.9], 1.0: [0.4, 0, 0, 0]}))
    burst("bind_chains", "chain", ALPHA, 6, 1.5, 0.3, 0, [0.8, 0.8, 0.85],
          shape={"minecraft:emitter_shape_disc": {"radius": 0.7, "surface_only": True, "plane_normal": "y", "offset": [0, 1, 0]}}, shrink=False,
          alpha="1")
    burst("awaken_pillar", "glow", ADD, 0, 1.3, 0.4, 7, COLOR_VAR, rate=140, active=0.6,
          shape={"minecraft:emitter_shape_disc": {"radius": 1.0, "plane_normal": "y", "direction": [0, 1, 0]}}, drag=0.5)

    # Armament
    burst("armament_coat", "flake", BLEND, 3, 0.35, 0.1, 0.3, [0.12, 0.05, 0.2], rotate=True, accel=(0, 0.6, 0))
    burst("armament_burst", "flake", BLEND, 26, 0.6, 0.16, 2.2, [0.1, 0.03, 0.18],
          shape={"minecraft:emitter_shape_sphere": {"radius": 0.8, "surface_only": True, "direction": "inwards"}}, rotate=True, drag=2)
    burst("armament_impact", "shard", BLEND, 14, 0.4, 0.22, 5, [0.08, 0.02, 0.12], rotate=True, drag=3, accel=(0, -6, 0))
    halo("emission_wave", "ring", BLEND, 0.3, 3.2, 0.35, [0.18, 0.05, 0.3])

    # Observation
    halo("observation_pulse", "ring", ADD, 0.4, 9, 0.7, [0.3, 0.85, 1.0])
    halo("counter_flash", "spark", ADD, 2.2, 0.4, 0.25, [0.6, 0.95, 1.0])
    burst("dodge_afterimage", "glow", ADD, 18, 0.35, 0.3, 0.4, COLOR_VAR,
          shape={"minecraft:emitter_shape_box": {"half_dimensions": [0.25, 0.9, 0.25], "offset": [0, 0.9, 0], "direction": "outwards"}}, drag=2)
    particle("sense_marker", "marker", ADD, {
        "minecraft:emitter_rate_instant": {"num_particles": 1},
        "minecraft:emitter_lifetime_once": {"active_time": 0.05},
        "minecraft:emitter_shape_point": {},
        "minecraft:particle_lifetime_expression": {"max_lifetime": 0.55},
        "minecraft:particle_initial_speed": 0,
        "minecraft:particle_motion_parametric": {"relative_position": [0, "math.sin(v.particle_age * 360) * 0.08", 0]},
        "minecraft:particle_appearance_billboard": {"size": [0.22, 0.22], "facing_camera_mode": "lookat_xyz", "uv": full_uv(TEX_SIZES["marker"])},
        "minecraft:particle_appearance_tinting": {"color": COLOR_VAR + ["math.min(1, (1 - v.particle_age / v.particle_lifetime) * 3)"]},
    })

    # Knock-out stars
    particle("ko_stars", "star", ALPHA, {
        "minecraft:emitter_rate_instant": {"num_particles": 3},
        "minecraft:emitter_lifetime_once": {"active_time": 0.05},
        "minecraft:emitter_shape_point": {},
        "minecraft:particle_lifetime_expression": {"max_lifetime": 0.32},
        "minecraft:particle_initial_speed": 0,
        "minecraft:particle_motion_parametric": {"relative_position": [
            "math.cos(v.particle_age * 600 + v.particle_random_1 * 360) * 0.4",
            "math.sin(v.particle_age * 900) * 0.05",
            "math.sin(v.particle_age * 600 + v.particle_random_1 * 360) * 0.4"]},
        "minecraft:particle_appearance_billboard": {"size": [0.13, 0.13], "facing_camera_mode": "lookat_xyz", "uv": full_uv(TEX_SIZES["star"])},
        "minecraft:particle_appearance_tinting": {"color": [1, 0.92, 0.3, 1]},
    })

    # General impacts / ambience
    burst("punch_impact", "spark", ADD, 10, 0.25, 0.3, 4, [1, 1, 0.9], rotate=True, drag=5)
    burst("crew_smoke", "smoke", BLEND, 22, 1.0, 0.7, 1.4, [0.35, 0.33, 0.36], rotate=True, drag=2, accel=(0, 0.8, 0),
          shape={"minecraft:emitter_shape_box": {"half_dimensions": [0.4, 0.9, 0.4], "offset": [0, 0.9, 0], "direction": "outwards"}})
    burst("ground_debris", "shard", BLEND, 40, 1.0, 0.25, 7, [0.42, 0.36, 0.3], rotate=True, drag=0.5, accel=(0, -18, 0),
          shape={"minecraft:emitter_shape_disc": {"radius": 1.5, "plane_normal": "y", "direction": [0, 1, 0]}})
    burst("treasure_burst", "coin", ALPHA, 26, 0.9, 0.18, 4, [1, 1, 1], rotate=True, accel=(0, -12, 0), drag=0.5, alpha="1",
          shape={"minecraft:emitter_shape_point": {"direction": ["math.random(-0.5, 0.5)", 1, "math.random(-0.5, 0.5)"]}})
    burst("seastone_drain", "smoke", BLEND, 14, 0.9, 0.3, 0.6, [0.25, 0.45, 0.55], rotate=True, accel=(0, -1, 0))
    burst("fruit_power", "glow", ADD, 0, 1.0, 0.3, 2.5, COLOR_VAR, rate=90, active=0.8, accel=(0, 3, 0),
          shape={"minecraft:emitter_shape_disc": {"radius": 1.0, "surface_only": True, "plane_normal": "y", "direction": "inwards"}}, drag=1)
    burst("fruit_rejection", "smoke", BLEND, 40, 1.2, 0.6, 5, [0.35, 0.02, 0.05], rotate=True, drag=2)

    # Fire
    burst("ember", "glow", ADD, 1, 0.8, 0.08, 0.4, [1, 0.5, 0.1], accel=(0, 1.5, 0),
          shape={"minecraft:emitter_shape_box": {"half_dimensions": [0.3, 0.6, 0.3], "direction": "outwards"}})
    burst("fire_explosion", "flame", ADD, 70, "math.random(0.4, 0.8)", 0.8, 7, fire_grad, rotate=True, drag=3, accel=(0, 2, 0))
    burst("flame_pillar", "flame", ADD, 0, "math.random(0.5, 0.9)", 0.9, 4, fire_grad, rate=260, active=0.7, rotate=True, accel=(0, 9, 0), drag=1,
          shape={"minecraft:emitter_shape_disc": {"radius": 2.2, "plane_normal": "y", "direction": [0, 1, 0]}})
    burst("logia_mera", "flame", ADD, 22, 0.45, 0.4, 2.5, fire_grad, rotate=True, drag=3, accel=(0, 3, 0))
    trail("fire_fist_trail", "flame", ADD, 70, 0.45, 1.1, fire_grad, spread=0.45, accel=(0, 1.5, 0))
    trail("fire_bullet_trail", "flame", ADD, 40, 0.25, 0.35, fire_grad, spread=0.1)
    trail("pirate_flames", "flame", ADD, 12, 0.5, 0.3, fire_grad, spread=0.5, accel=(0, 2, 0), offset=(0, 1.0, 0))

    # Ice
    ice = [0.65, 0.92, 1.0]
    burst("ice_shatter", "shard", ALPHA, 12, 0.6, 0.18, 3.5, ice, rotate=True, accel=(0, -14, 0), alpha="1")
    burst("ice_age", "shard", ALPHA, 160, 1.4, 0.3, 14, ice, rotate=True, drag=1.6, alpha="1",
          shape={"minecraft:emitter_shape_disc": {"radius": 0.6, "plane_normal": "y", "direction": "outwards", "offset": [0, 0.3, 0]}})
    burst("frozen_shell", "shard", ALPHA, 30, 2.0, 0.25, 0.05, ice, rotate=True, alpha="1",
          shape={"minecraft:emitter_shape_box": {"half_dimensions": [0.5, 1.0, 0.5], "offset": [0, 1, 0], "surface_only": True, "direction": "outwards"}}, shrink=False)
    burst("logia_hie", "shard", ALPHA, 16, 0.5, 0.2, 3, ice, rotate=True, accel=(0, -10, 0), alpha="1")
    trail("ice_trail", "shard", ALPHA, 24, 0.4, 0.15, ice, spread=0.1)

    # Lightning / light
    yellow = [1, 0.92, 0.4]
    burst("spark_burst", "spark", ADD, 30, 0.35, 0.25, 6, yellow, rotate=True, drag=4)
    burst("spark_small", "spark", ADD, 3, 0.2, 0.12, 1.5, yellow, rotate=True,
          shape={"minecraft:emitter_shape_box": {"half_dimensions": [0.35, 0.8, 0.35], "direction": "outwards"}})
    burst("electric_dome", "spark", ADD, 90, 0.35, 0.3, 0.5, yellow, rotate=True,
          shape={"minecraft:emitter_shape_sphere": {"radius": 5.5, "surface_only": True, "direction": "outwards", "offset": [0, 1, 0]}})
    burst("el_thor", "glow", ADD, 160, 0.45, 0.9, 1, gradient({0.0: [1, 1, 1, 1], 0.4: [1, 0.95, 0.5, 0.8], 1.0: [1, 0.8, 0.2, 0]}),
          shape={"minecraft:emitter_shape_box": {"half_dimensions": [1.1, 16, 1.1], "offset": [0, 16, 0], "direction": "outwards"}}, drag=3)
    burst("logia_goro", "spark", ADD, 16, 0.25, 0.25, 4, yellow, rotate=True, drag=4)
    burst("light_mote", "glow", ADD, 1, 0.7, 0.1, 0.3, [1, 0.97, 0.7],
          shape={"minecraft:emitter_shape_box": {"half_dimensions": [0.35, 0.8, 0.35], "direction": "outwards"}})
    halo("light_flash", "glow", ADD, 0.4, 2.6, 0.28, [1, 0.98, 0.75])
    burst("light_slash", "spark", ADD, 50, 0.3, 0.3, 1.5, [1, 0.96, 0.6], rotate=True, drag=4,
          shape={"minecraft:emitter_shape_disc": {"radius": 2.6, "surface_only": True, "plane_normal": "y", "direction": "outwards"}})
    burst("logia_pika", "glow", ADD, 14, 0.3, 0.25, 3, [1, 0.97, 0.7], drag=4)
    trail("light_trail", "glow", ADD, 60, 0.3, 0.4, [1, 0.97, 0.7], spread=0.05, rotate=False)

    # Rubber / quake / misc
    burst("gatling_fists", "fist", ALPHA, 4, 0.14, 0.45, 9, COLOR_VAR, shrink=False, alpha="1",
          shape={"minecraft:emitter_shape_sphere": {"radius": 0.8, "direction": ["variable.dx ?? 0", "variable.dy ?? 0", "variable.dz ?? 1"]}}, drag=0)
    burst("steam", "smoke", BLEND, 3, 0.8, 0.35, 0.6, [0.95, 0.9, 0.95], rotate=True, accel=(0, 1.5, 0),
          shape={"minecraft:emitter_shape_box": {"half_dimensions": [0.35, 0.9, 0.35], "offset": [0, 0.9, 0], "direction": "outwards"}})
    burst("steam_burst", "smoke", BLEND, 30, 1.0, 0.6, 2.5, [0.95, 0.88, 0.95], rotate=True, drag=2, accel=(0, 1, 0),
          shape={"minecraft:emitter_shape_box": {"half_dimensions": [0.35, 0.9, 0.35], "offset": [0, 0.9, 0], "direction": "outwards"}})
    halo("air_crack", "crack", ALPHA, "(variable.size ?? 2) * 0.6", "(variable.size ?? 2) * 1.1", 0.6, [1, 1, 1], "1 - math.pow(v.particle_age / v.particle_lifetime, 3)")
    burst("tremor_burst", "smoke", BLEND, 14, 0.6, 0.6, 3, [0.6, 0.56, 0.5], rotate=True, drag=3, accel=(0, 2, 0))
    trail("haki_wave_trail", "ring", BLEND, 30, 0.3, 0.9, [0.15, 0.03, 0.25], spread=0.05, rotate=False)
    trail("bullet_trail", "smoke", BLEND, 20, 0.3, 0.12, [0.6, 0.6, 0.6], spread=0.02)


# ---------------------------------------------------------------------------------------------
# Language, font, misc
# ---------------------------------------------------------------------------------------------

def lang():
    LANG["pack.name"] = "Grand Line: Haki Clash"
    LANG["pack.description"] = "Haki, Devil Fruits and the Haki Clash."
    lines = [f"{k}={v}" for k, v in sorted(LANG.items())]
    for base in (RP,):
        os.makedirs(os.path.join(base, "texts"), exist_ok=True)
        with open(os.path.join(base, "texts", "en_US.lang"), "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        w(base, "texts/languages.json", ["en_US"])
    os.makedirs(os.path.join(BP, "texts"), exist_ok=True)
    with open(os.path.join(BP, "texts", "en_US.lang"), "w", encoding="utf-8") as f:
        f.write("pack.name=Grand Line: Haki Clash\npack.description=Haki, Devil Fruits and the Haki Clash.\n")
    w(BP, "texts/languages.json", ["en_US"])


def main():
    clean()
    manifests()
    items()
    blocks()
    loot()
    recipes()
    spawn_rules()
    boss_entity()
    pirate_entity()
    projectiles()
    models()
    animations()
    render_controllers()
    client_entities()
    fog()
    particles()
    lang()
    print("content generated")


if __name__ == "__main__":
    main()
