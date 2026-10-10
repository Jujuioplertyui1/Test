// Headless smoke test: runs the bundled add-on script against a mocked @minecraft/server API and plays
// through a session (join, awaken Haki, summon the Crimson King, Haki Clash, every Devil Fruit move, boss kill).
// Usage: npm run smoke
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const tmp = join(here, '.run');
mkdirSync(tmp, { recursive: true });
const bundle = readFileSync(join(here, '..', '..', 'packs', 'GrandLine_BP', 'scripts', 'main.js'), 'utf8')
  .replaceAll('"@minecraft/server-ui"', JSON.stringify(join(here, 'mock-server-ui.mjs')))
  .replaceAll('"@minecraft/server"', JSON.stringify(join(here, 'mock-server.mjs')));
writeFileSync(join(tmp, 'main.mjs'), bundle);
import { subs, system, world } from './mock-server.mjs';
let warnings = 0, particles = 0, sounds = 0, titles = 0, cams = 0;
const origWarn = console.warn; console.warn = (...a) => { warnings++; origWarn('WARN', ...a); };
let nid = 1;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
class Ent {
  constructor(typeId, loc, dim) { Object.assign(this, { typeId, location: loc, dimension: dim, id: String(nid++), isValid: true, tags: new Set(), props: {}, nameTag: '', isOnGround: true, isInWater: false, isSneaking: false, hp: typeId.includes('conqueror') ? 400 : 20, max: typeId.includes('conqueror') ? 400 : 20 }); }
  getComponent(id) {
    if (id === 'minecraft:health') return { currentValue: this.hp, effectiveMax: this.max, setCurrentValue: (v) => (this.hp = v) };
    if (id === 'minecraft:equippable') return { totalArmor: 0, getEquipment: () => undefined };
    if (id === 'minecraft:inventory') return this.container ? { container: this.container } : undefined;
    if (id === 'minecraft:projectile') return { shoot() {}, owner: undefined };
    if (id === 'minecraft:variant') return { value: 2 };
    if (id === 'minecraft:tameable') return undefined;
  }
  addEffect() {} removeEffect() {} addTag(t) { this.tags.add(t); } removeTag(t) { this.tags.delete(t); } hasTag(t) { return this.tags.has(t); }
  triggerEvent() {} setProperty(k, v) { this.props[k] = v; } getProperty(k) { return this.props[k]; } playAnimation() {}
  teleport(l) { this.location = l; } applyKnockback() {} applyImpulse() {} setOnFire() {} remove() { this.isValid = false; } kill() { this.hp = 0; }
  applyDamage(a, opts) {
    const ev = { hurtEntity: this, damageSource: { cause: opts?.cause ?? 'entityAttack', damagingEntity: opts?.damagingEntity }, damage: a, cancel: false };
    for (const cb of subs['world.before.entityHurt'] || []) cb(ev);
    if (ev.cancel) return false;
    this.hp -= ev.damage;
    for (const cb of subs['world.after.entityHurt'] || []) cb({ hurtEntity: this, damageSource: ev.damageSource, damage: ev.damage });
    return true;
  }
  getHeadLocation() { return { x: this.location.x, y: this.location.y + 1.6, z: this.location.z }; }
  getViewDirection() { return { x: 0, y: 0, z: 1 }; } getRotation() { return { x: 0, y: 0 }; }
  matches() { return this.typeId !== 'minecraft:player'; } getEntitiesFromViewDirection() { return this.dimension.entities.filter((e) => e !== this).map((e) => ({ entity: e, distance: 3 })); }
  getBlockFromViewDirection() { return undefined; } getDynamicProperty() { return undefined; } setDynamicProperty() {}
}
class Container { constructor(n) { this.size = n; this.items = new Array(n); } getItem(i) { return this.items[i]; } setItem(i, v) { this.items[i] = v; } addItem(it) { const i = this.items.findIndex((x) => !x); if (i < 0) return it; this.items[i] = it; } }
class Player extends Ent {
  constructor(loc, dim) { super('minecraft:player', loc, dim); this.name = 'Luffy'; this.container = new Container(36); this.selectedSlotIndex = 0; this.hp = 20; this.max = 20;
    this.onScreenDisplay = { setActionBar() {}, setTitle() { titles++; }, updateSubtitle() {} };
    this.camera = { fade() {}, setCamera() { cams++; }, clear() {} }; this.inputPermissions = { setPermissionCategory() {} }; }
  getGameMode() { return 'Survival'; } sendMessage(m) {} runCommand() { return { successCount: 1 }; } startItemCooldown() {} spawnParticle() { particles++; } playSound() {}
}
const dim = {
  id: 'minecraft:overworld', entities: [],
  getEntities(o = {}) { return this.entities.filter((e) => e.isValid && (!o.type || e.typeId === o.type) && (!o.location || dist(e.location, o.location) <= (o.maxDistance ?? 1e9))); },
  getPlayers(o = {}) { return this.getEntities(o).filter((e) => e.typeId === 'minecraft:player'); },
  spawnParticle() { particles++; }, playSound() { sounds++; },
  spawnEntity(id, loc) { const e = new Ent(id, loc, this); this.entities.push(e); return e; }, spawnItem() {},
  getBlock(l) { return { isAir: true, typeId: 'minecraft:air', setType() {}, location: l }; },
  getBlockFromRay() { return undefined; }, getEntitiesFromRay() { return []; },
  getTopmostBlock(l) { return { location: { x: l.x, y: 63, z: l.z } }; }, getBiome() { return { id: 'minecraft:beach' }; }, runCommand() {},
};
world._dim = dim;
await import(join(tmp, 'main.mjs'));
const comps = {}, cmds = {};
for (const cb of subs['system.before.startup']) cb({ itemComponentRegistry: { registerCustomComponent: (n, c) => (comps[n] = c) }, customCommandRegistry: { registerCommand: (c, f) => (cmds[c.name] = f), registerEnum() {} } });
for (const cb of subs['world.after.worldLoad']) cb({});
const p = new Player({ x: 0, y: 64, z: 0 }, dim); dim.entities.push(p); world._players.push(p);
const ticks = (n) => { for (let i = 0; i < n; i++) system._tick(); };
for (const cb of subs['world.after.playerSpawn']) cb({ player: p, initialSpawn: true });
ticks(60);
console.log('kit after join:', p.container.items.filter(Boolean).map((i) => i.typeId).join(', '));
// Fight a zombie bare-handed to awaken Armament
const z = dim.spawnEntity('minecraft:zombie', { x: 1, y: 64, z: 1 });
for (let i = 0; i < 70; i++) { z.hp = 20; z.applyDamage(4, { damagingEntity: p }); }
ticks(5);
console.log('kit after fighting:', p.container.items.filter(Boolean).map((i) => i.typeId).join(', '));
// Admin: max all haki
cmds['grandline:haki']({ sourceEntity: p }, 'level', 'all', 80, undefined);
ticks(5);
const use = (name, params) => comps[name].onUse({ source: p }, { params });
use('grandline:haki', { type: 'armament' }); use('grandline:haki', { type: 'observation' }); ticks(30);
// Mobs hit the player (dodges / logia)
for (let i = 0; i < 20; i++) { p.hp = 20; p.applyDamage(3, { damagingEntity: z }); ticks(2); }
// Summon the Crimson King and burst -> clash
cmds['grandline:captain']({ sourceEntity: p });
ticks(120);
const boss = dim.entities.find((e) => e.typeId === 'grandline:conqueror_pirate');
console.log('boss spawned:', !!boss, 'crew:', dim.entities.filter((e) => e.typeId === 'grandline:pirate').length);
boss.location = { x: 0, y: 64, z: 5 };
use('grandline:haki', { type: 'conqueror' }); ticks(10);
for (let i = 0; i < 220; i++) { if (i % 3 === 0) for (const cb of subs['world.after.playerButtonInput']) cb({ player: p, button: 'Sneak', newButtonState: 'Pressed' }); system._tick(); }
console.log('boss hp after clash:', Math.round(boss.hp));
// Hit the boss: armament on vs off
for (let i = 0; i < 30; i++) { boss.applyDamage(8, { damagingEntity: p }); ticks(3); }
console.log('boss hp after 30 coated hits:', Math.round(boss.hp), 'phase:', boss.props['grandline:phase']);
ticks(400);
// Devil fruits: every move
for (const f of ['gomu', 'mera', 'hie', 'goro', 'gura', 'pika']) {
  cmds['grandline:fruit']({ sourceEntity: p }, f, undefined); ticks(5);
  for (let s = 1; s <= 3; s++) { p.props.st = 0; comps['grandline:skill'].onUse({ source: p }, { params: { fruit: f, slot: s } }); ticks(40); }
  ticks(300);
}
// Kill the boss -> rewards
boss.hp = 1; boss.applyDamage(50, { damagingEntity: p });
for (const cb of subs['world.after.entityDie']) cb({ deadEntity: boss, damageSource: { cause: 'entityAttack', damagingEntity: p } });
ticks(80);
console.log(`warnings=${warnings} particles=${particles} sounds=${sounds} titles=${titles} cameraMoves=${cams}`);
console.log(warnings === 0 ? 'SIM OK' : 'SIM HAD WARNINGS');
if (warnings) process.exit(1);
