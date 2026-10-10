import { EasingType, Entity, EntityDamageCause, GameMode, Player, system, Vector3, world } from "@minecraft/server";
import { BOSS_ID, BOSS_NAME, Haki, PIRATE_ID } from "./defs";
import { power, save } from "./data";
import { aura, BLACK, bolt, chest, CRIMSON, flash, isPlayer, lightningBurst, particle, RED, shakeAround, sound, title, vars } from "./fx";
import { awaken, burst, gainXp, health, isKnockedOut, maxHealth } from "./haki";
import { clashOf } from "./clash";
import { V } from "./vec";

interface BossState {
	phase: number;
	burstCd: number;
	leapCd: number;
	emissionCd: number;
	charge: number;
	leapTicks: number;
	undodgeableUntil: number;
	damagers: Map<string, number>;
	lastSeen: number;
}

const bosses = new Map<string, BossState>();
const bossEntities = new Map<string, Entity>();

function state(e: Entity): BossState {
	let s = bosses.get(e.id);
	if (!s) {
		const phase = (e.getProperty("grandline:phase") as number | undefined) ?? 1;
		s = { phase, burstCd: 160, leapCd: 100, emissionCd: 60, charge: 0, leapTicks: 0, undodgeableUntil: 0, damagers: new Map(), lastSeen: 0 };
		bosses.set(e.id, s);
	}
	return s;
}

export function track(e: Entity): void {
	if (e.typeId === BOSS_ID) bossEntities.set(e.id, e);
}

export function bossClashPower(e: Entity): number {
	return state(e).phase >= 2 ? 132 : 110;
}

/** The Crimson King's infused strikes can only be dodged with Future Sight. */
export function bossUndodgeable(attacker: Entity): boolean {
	if (attacker.typeId !== BOSS_ID) return false;
	const s = bosses.get(attacker.id);
	return !!s && (s.undodgeableUntil > system.currentTick || s.phase >= 2);
}

export function onBossHurt(boss: Entity, _damage: number, attacker: Entity | undefined): void {
	const s = state(boss);
	if (attacker && isPlayer(attacker)) s.damagers.set(attacker.id, system.currentTick);
	if (s.phase === 1 && health(boss) <= maxHealth(boss) * 0.5) enterPhaseTwo(boss, s);
}

function nearbyPlayers(e: Entity, r: number): Player[] {
	return e.dimension.getPlayers({ location: e.location, maxDistance: r, excludeGameModes: [GameMode.Creative, GameMode.Spectator] });
}

function say(boss: Entity, text: string, r = 40): void {
	for (const p of boss.dimension.getPlayers({ location: boss.location, maxDistance: r })) p.sendMessage(`§4${BOSS_NAME}§r: §c${text}`);
}

function enterPhaseTwo(boss: Entity, s: BossState): void {
	s.phase = 2;
	try {
		boss.triggerEvent("grandline:phase_two");
		boss.setProperty("grandline:phase", 2);
	} catch {
		// ignore
	}
	say(boss, "You've got guts... Then witness the will of a KING!");
	for (const p of nearbyPlayers(boss, 48)) {
		title(p, "§4§l覇王色", `§c${BOSS_NAME} unleashes his true will!`, 50, 5, 15);
		flash(p, CRIMSON, 0.1, 0.3, 1.0);
	}
	burst(boss, 120, 18, true);
	summonCrew(boss, 3);
	s.burstCd = 140;
}

function summonCrew(boss: Entity, count: number): void {
	for (let i = 0; i < count; i++) {
		const ang = (i / count) * Math.PI * 2 + Math.random();
		const loc = V.add(boss.location, V.of(Math.cos(ang) * 3, 0.2, Math.sin(ang) * 3));
		try {
			const pirate = boss.dimension.spawnEntity(PIRATE_ID, loc);
			particle(boss.dimension, "grandline:crew_smoke", pirate.location);
		} catch {
			// chunk not loaded
		}
	}
	sound(boss.dimension, "mob.evocation_illager.prepare_summon", boss.location, 1, 0.8);
}

function tickBoss(boss: Entity): void {
	const s = state(boss);
	s.lastSeen = system.currentTick;
	const dim = boss.dimension;
	if (s.phase >= 2 && system.currentTick % 4 === 0) aura(boss, BLACK, 1.2);
	if (clashOf(boss) || isKnockedOut(boss)) return;
	if (s.burstCd > 0) s.burstCd--;
	if (s.leapCd > 0) s.leapCd--;
	if (s.emissionCd > 0) s.emissionCd--;

	const targets = nearbyPlayers(boss, 30);
	if (targets.length === 0) return;
	let target = targets[0];
	let best = Infinity;
	for (const t of targets) {
		const d = V.dist(t.location, boss.location);
		if (d < best) {
			best = d;
			target = t;
		}
	}
	const dist = best;

	// charging Conqueror's Haki
	if (s.charge > 0) {
		s.charge--;
		aura(boss, CRIMSON, 1.6);
		particle(dim, "grandline:charge_in", chest(boss));
		if (s.charge % 6 === 0) bolt(dim, chest(boss), V.add(chest(boss), V.scale(V.randUnit(), 2.5)), { width: 0.12, branches: 0 });
		if (s.charge === 0) {
			try {
				boss.setProperty("grandline:charging", false);
			} catch {
				// ignore
			}
			burst(boss, s.phase >= 2 ? 125 : 105, s.phase >= 2 ? 20 : 16, true);
		}
		return;
	}

	// leap slam in progress
	if (s.leapTicks > 0) {
		s.leapTicks++;
		particle(dim, "grandline:haki_aura", boss.location, vars(BLACK, { scale: 0.8 }));
		if ((s.leapTicks > 6 && boss.isOnGround) || s.leapTicks > 40) {
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
			// ignore
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
			// ignore
		}
		s.leapTicks = 1;
		s.leapCd = s.phase >= 2 ? 100 : 150;
		s.undodgeableUntil = system.currentTick + 40;
		sound(dim, "mob.ravager.roar", boss.location, 1, 1.2);
		return;
	}
	if (s.emissionCd <= 0 && dist > 6 && dist < 22) {
		s.emissionCd = s.phase >= 2 ? 70 : 100;
		shootWave(boss, target);
	}
}

function slam(boss: Entity, s: BossState): void {
	const dim = boss.dimension;
	const at = boss.location;
	const r = 4;
	particle(dim, "grandline:shockwave_ring", V.up(at, 0.15), vars(CRIMSON, { radius: 7 }));
	particle(dim, "grandline:ground_debris", at);
	lightningBurst(dim, V.up(at, 0.6), 4, 8);
	sound(dim, "random.explode", at, 2, 0.7);
	sound(dim, "ambient.weather.lightning.impact", at, 2, 0.8);
	shakeAround(dim, at, 18, 1.1, 0.7);
	s.undodgeableUntil = system.currentTick + 2;
	for (const e of dim.getEntities({ location: at, maxDistance: r, excludeFamilies: ["inanimate"] })) {
		if (e.id === boss.id || e.typeId === PIRATE_ID || !e.getComponent("minecraft:health")) continue;
		if (isPlayer(e) && (e.getGameMode() === GameMode.Creative || e.getGameMode() === GameMode.Spectator)) continue;
		try {
			e.applyDamage(s.phase >= 2 ? 15 : 11, { cause: EntityDamageCause.entityAttack, damagingEntity: boss });
			const away = V.norm(V.flat(V.sub(e.location, at)));
			e.applyKnockback({ x: away.x * 1.4, z: away.z * 1.4 }, 0.55);
		} catch {
			// ignore
		}
	}
}

function shootWave(boss: Entity, target: Entity): void {
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
		// ignore
	}
	sound(boss.dimension, "mob.warden.attack_impact", from, 1.5, 0.6);
}

/** Projectiles spawned by scripts remember who fired them and how hard they hit. */
export const projectileInfo = new Map<string, { owner: Entity; damage: number; kind: string }>();
export function registerProjectileOwner(proj: Entity, owner: Entity, damage: number, kind: string): void {
	projectileInfo.set(proj.id, { owner, damage, kind });
	system.runTimeout(() => projectileInfo.delete(proj.id), 200);
}

export function tickBosses(): void {
	for (const [id, e] of bossEntities) {
		if (!e.isValid) {
			bossEntities.delete(id);
			continue;
		}
		tickBoss(e);
	}
	if (system.currentTick % 100 === 0) {
		for (const dimId of ["overworld", "nether", "the_end"]) {
			try {
				for (const e of world.getDimension(dimId).getEntities({ type: BOSS_ID })) track(e);
			} catch {
				// ignore
			}
		}
		for (const [id, s] of bosses) if (system.currentTick - s.lastSeen > 1200) bosses.delete(id);
	}
}

export function onBossDeath(boss: Entity, killer: Entity | undefined): void {
	const s = bosses.get(boss.id);
	const dim = boss.dimension;
	const at = boss.location;
	bosses.delete(boss.id);
	bossEntities.delete(boss.id);
	lightningBurst(dim, chest(boss), 7, 14);
	bolt(dim, chest(boss), V.up(at, 30), { width: 0.5, segments: 14, branches: 4, color: RED });
	sound(dim, "mob.enderdragon.death", at, 1.2, 1.2);
	const credited = new Set<string>();
	if (killer && isPlayer(killer)) credited.add(killer.id);
	if (s) for (const [pid, tick] of s.damagers) if (system.currentTick - tick < 1200) credited.add(pid);
	for (const p of dim.getPlayers({ location: at, maxDistance: 64 })) {
		title(p, "§6§lVICTORY", `§e${BOSS_NAME} has fallen!`, 70, 5, 20);
		if (!credited.has(p.id)) continue;
		const pw = power(p);
		pw.saved.bossKills++;
		pw.dirty = true;
		if (!pw.has(Haki.Conqueror)) {
			system.runTimeout(() => {
				if (!p.isValid) return;
				p.sendMessage(`§4${BOSS_NAME}§r: §7...Heh. So that's your will. Then carry it... king.`);
				awaken(p, Haki.Conqueror, "Defeating the Crimson King awakened the qualities of a king within you.");
			}, 50);
		} else {
			gainXp(p, Haki.Conqueror, 200);
		}
		save(p, pw);
	}
}

/** Jolly Roger: challenge the Crimson King. Cinematic arrival with his crew. */
export function summonCaptain(player: Player): boolean {
	const dim = player.dimension;
	const dir = V.norm(V.flat(player.getViewDirection()));
	const want = V.add(player.location, V.scale(dir, 9));
	const top = dim.getTopmostBlock({ x: want.x, z: want.z });
	const spot: Vector3 = top ? V.of(want.x, top.location.y + 1, want.z) : want;
	if (Math.abs(spot.y - player.location.y) > 12) {
		player.sendMessage("§cThe Crimson King needs solid ground nearby to land on.");
		return false;
	}
	for (const pl of dim.getPlayers({ location: spot, maxDistance: 48 })) {
		flash(pl, BLACK, 0.4, 0.6, 1.2);
	}
	sound(dim, "ambient.weather.thunder", spot, 5, 0.5);
	system.runTimeout(() => {
		if (!player.isValid) return;
		let boss: Entity;
		try {
			boss = dim.spawnEntity(BOSS_ID, spot);
		} catch {
			player.sendMessage("§cCouldn't summon the Crimson King here.");
			return;
		}
		track(boss);
		lightningBurst(dim, V.up(spot, 1), 5, 12);
		for (let i = 0; i < 4; i++) bolt(dim, V.up(spot, 30), V.up(spot, 0.2), { width: 0.45, segments: 14, branches: 3 });
		particle(dim, "grandline:haoshoku_wave_boss", V.up(spot, 1), vars(undefined, { radius: 14 }));
		particle(dim, "grandline:shockwave_ring", V.up(spot, 0.15), vars(CRIMSON, { radius: 10 }));
		sound(dim, "mob.warden.sonic_boom", spot, 5, 0.5);
		shakeAround(dim, spot, 40, 1.4, 1.5);
		summonCrew(boss, 3);
		// cinematic introduction for everyone nearby
		const faceDir = V.norm(V.flat(V.sub(player.location, spot)));
		const camAt = V.up(V.add(spot, V.scale(faceDir, 5)), 2.2);
		for (const pl of dim.getPlayers({ location: spot, maxDistance: 32 })) {
			try {
				pl.camera.setCamera("minecraft:free", { location: camAt, facingLocation: V.up(spot, 1.7), easeOptions: { easeTime: 0.8, easeType: EasingType.OutCubic } });
			} catch {
				// ignore
			}
			title(pl, "§4§lVAREK", "§cThe Crimson King §7— captain of the Crimson Tide Pirates", 50, 10, 15);
			const pr = pl;
			system.runTimeout(() => {
				try {
					if (pr.isValid) pr.camera.clear();
				} catch {
					// ignore
				}
			}, 60);
		}
		try {
			boss.teleport(spot, { facingLocation: player.location });
			boss.playAnimation("animation.grandline.captain.roar", { blendOutTime: 0.5 });
		} catch {
			// ignore
		}
		say(boss, "So you're the one waving that flag around. Let's see if your will can stand before mine!", 48);
	}, 30);
	return true;
}

export { flash };
