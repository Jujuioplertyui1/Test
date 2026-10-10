export const subs = {};
function signal(path) { return { subscribe(cb) { (subs[path] ||= []).push(cb); return cb; }, unsubscribe() {} }; }
function events(prefix) { return new Proxy({}, { get: (_t, k) => signal(`${prefix}.${String(k)}`) }); }
const enumProxy = () => new Proxy({}, { get: (_t, k) => (typeof k === 'string' ? k : undefined) });
const queue = [];
export const system = {
  currentTick: 0,
  beforeEvents: events('system.before'),
  afterEvents: events('system.after'),
  runIntervals: [],
  runInterval(cb) { this.runIntervals.push(cb); return 1; },
  runTimeout(cb, t = 1) { queue.push({ at: this.currentTick + Math.max(1, t), cb }); return 2; },
  run(cb) { queue.push({ at: this.currentTick + 1, cb }); return 3; },
  _tick() {
    this.currentTick++;
    for (const q of queue.filter((q) => q.at <= this.currentTick)) { queue.splice(queue.indexOf(q), 1); q.cb(); }
    for (const f of this.runIntervals) f();
  },
};
export const world = {
  beforeEvents: events('world.before'),
  afterEvents: events('world.after'),
  _players: [], _dim: null,
  getAllPlayers() { return this._players; },
  getDimension() { return this._dim; },
  getEntity(id) { return this._dim.entities.find((e) => e.id === id); },
};
export class MolangVariableMap { setColorRGB() {} setFloat() {} setSpeedAndDirection() {} }
export class ItemStack { constructor(id, n = 1) { this.typeId = id; this.amount = n; } setLore(l) { this.lore = l; } }
export const ButtonState = enumProxy(); export const InputButton = enumProxy(); export const EntityDamageCause = enumProxy();
export const EquipmentSlot = enumProxy(); export const GameMode = enumProxy(); export const InputPermissionCategory = enumProxy();
export const EasingType = enumProxy(); export const ItemLockMode = enumProxy(); export const CommandPermissionLevel = enumProxy();
export const CustomCommandParamType = enumProxy(); export const CustomCommandStatus = enumProxy();
