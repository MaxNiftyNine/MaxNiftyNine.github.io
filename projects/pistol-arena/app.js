import * as THREE from 'three';

// ─── Renderer / Scene ────────────────────────────────────────────────────────
const scene    = new THREE.Scene();
scene.background = new THREE.Color(0x7ab0d8);
scene.fog        = new THREE.FogExp2(0x7ab0d8, 0.012);

const camera = new THREE.PerspectiveCamera(80, innerWidth / innerHeight, 0.05, 400);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = vmCamera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  vmCamera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ─── Lighting ────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.55));
scene.add(new THREE.HemisphereLight(0x87ceeb, 0x4a6a8a, 0.4));
const sun = new THREE.DirectionalLight(0xfff5e0, 1.3);
sun.position.set(25, 60, 15);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left:-70, right:70, top:70, bottom:-70, near:1, far:200 });
scene.add(sun);

// ─── Materials ───────────────────────────────────────────────────────────────
const M = {
  floor : new THREE.MeshLambertMaterial({ color: 0xc8d8e8 }),
  wall  : new THREE.MeshLambertMaterial({ color: 0x3a80cc }),
  wallL : new THREE.MeshLambertMaterial({ color: 0x5aaae8 }),
  block : new THREE.MeshLambertMaterial({ color: 0x2a5080 }),
  accent: new THREE.MeshLambertMaterial({ color: 0x1e3d60 }),
  trim  : new THREE.MeshLambertMaterial({ color: 0x78b8f8 }),
};

// ─── Collider registry ───────────────────────────────────────────────────────
// Each entry is an AABB { min, max } as plain objects for speed
const COLS = [];

function addAABB(cx, cy, cz, hw, hh, hd) {
  COLS.push({
    minX: cx - hw, maxX: cx + hw,
    minY: cy - hh, maxY: cy + hh,
    minZ: cz - hd, maxZ: cz + hd,
  });
}

function spawnBox(w, h, d, cx, cy, cz, mat, collide = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(cx, cy, cz);
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);
  if (collide) addAABB(cx, cy, cz, w/2, h/2, d/2);
  return mesh;
}

// ─── Map ─────────────────────────────────────────────────────────────────────
// Floor
spawnBox(62, 1, 62,  0, -0.5,  0, M.floor);

// Outer walls (thin, no need to step over)
spawnBox(62, 14, 1,   0,  7, -31, M.wall);   // north
spawnBox(62, 14, 1,   0,  7,  31, M.wall);   // south
spawnBox( 1, 14, 62, -31, 7,   0, M.wall);   // west
spawnBox( 1, 14, 62,  31, 7,   0, M.wall);   // east

// Four ramp wedges approximated by stepped boxes
for (let i = 0; i < 5; i++) {
  const h = (i + 1) * 0.45;
  spawnBox(2.2, h, 6 - i * 0.9, -10 + i * 1.8, h / 2,  0, M.trim); // west ramp
  spawnBox(2.2, h, 6 - i * 0.9,  10 - i * 1.8, h / 2,  0, M.trim); // east ramp
  spawnBox(5, h, 2.2,  0, h / 2, -10 + i * 1.8, M.trim); // north ramp
  spawnBox(5, h, 2.2,  0, h / 2,  10 - i * 1.8, M.trim); // south ramp
}

//center
spawnBox(4.9, 5, 4.9, 0, 0, 0, M.block);
for (let i = 0; i < 6; i++) {
  const angle = (i / 6) * Math.PI * 2;
  const r = 15;
  spawnBox(5, 10, 5, Math.round(Math.cos(angle) * r * 10) / 10, 0, Math.round(Math.sin(angle) * r * 10) / 10, M.block);
}

//tower
spawnBox(10, 20, 10, -20, 0,-20, M.block);
spawnBox(9, 1, 9, -20, 16,-20, M.block);
spawnBox(1, 12, 1, -23, 10,-23, M.block);
spawnBox(1, 12, 1, -17, 10,-23, M.block);
spawnBox(1, 12, 1, -23, 10,-17, M.block);
spawnBox(1, 12, 1, -17, 10,-17, M.block);

//tower 2

spawnBox(10, 20, 10, 20, 0,20, M.block);
spawnBox(9, 1, 9, 20, 16,20, M.block);
spawnBox(1, 12, 1, 23, 10,23, M.block);
spawnBox(1, 12, 1, 17, 10,23, M.block);
spawnBox(1, 12, 1, 23, 10,17, M.block);
spawnBox(1, 12, 1, 17, 10,17, M.block);

// great wall
spawnBox(40, 3, 1, -18.5, 0,  22, M.block);
spawnBox(40, 2, 1, -18.5, 5,  22, M.block);
for (let i = 0; i < 10; i++) {
  spawnBox(3, 10, 1, -(i * 5), 0, 22, M.block);
}
for (let i = 1; i < 5; i++) {
  const h = i * 1.3;
  spawnBox(3, h, 2.2, -10, h / 2, 28.5 - i * 1.2, M.trim);
}
for (let i = 0; i < 10; i++) {
  spawnBox(1, 8, 1, -28 + (i * 0.5), 0, 24 + (i * 0.5), M.block);
}

// great wall (mirrored)
spawnBox(40, 3, 1,  18.5, 0, -22, M.block);
spawnBox(40, 2, 1,  18.5, 5, -22, M.block);
for (let i = 0; i < 10; i++) {
  spawnBox(3, 10, 1, (i * 5), 0, -22, M.block);
}
for (let i = 1; i < 5; i++) {
  const h = i * 1.3;
  spawnBox(3, h, 2.2, 10, h / 2, -28.5 + i * 1.2, M.trim);
}
for (let i = 0; i < 10; i++) {
  spawnBox(1, 8, 1, 28 - (i * 0.5), 0, -24 - (i * 0.5), M.block);
}


// ── Jump pad — near the tall tower ─
const matJumpPad = new THREE.MeshLambertMaterial({
  color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.6,
});
// Put jump pad on lower route to launch to upper ring
const JUMP_PAD = { cx: -10, cy: 0.12, cz: -30, hw: 2, hd: 2, launchVel: 28 };
const jumpPadMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 0.22, 4), matJumpPad);
jumpPadMesh.position.set(JUMP_PAD.cx, JUMP_PAD.cy, JUMP_PAD.cz);
jumpPadMesh.receiveShadow = true;
scene.add(jumpPadMesh);
// Point light above the pad for glow effect
const padLight = new THREE.PointLight(0xff5500, 2.5, 8);
padLight.position.set(JUMP_PAD.cx, 2, JUMP_PAD.cz);
scene.add(padLight);

// ── Jump pad 2 — opposite side of map ──
const matJumpPad2 = new THREE.MeshLambertMaterial({
  color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.6,
});
const JUMP_PAD_2 = { cx: 10, cy: 0.12, cz: 20, hw: 2, hd: 2, launchVel: 28 };
const jumpPadMesh2 = new THREE.Mesh(new THREE.BoxGeometry(4, 0.22, 4), matJumpPad2);
jumpPadMesh2.position.set(JUMP_PAD_2.cx, JUMP_PAD_2.cy, JUMP_PAD_2.cz);
jumpPadMesh2.receiveShadow = true;
scene.add(jumpPadMesh2);
const padLight2 = new THREE.PointLight(0xff5500, 2.5, 8);
padLight2.position.set(JUMP_PAD_2.cx, 2, JUMP_PAD_2.cz);
scene.add(padLight2);

// ── Clouds ─
for (let i = 0; i < 18; i++) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(4 + Math.random() * 6, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
  );
  m.position.set((Math.random()-0.5)*300, 45+Math.random()*25, (Math.random()-0.5)*300);
  m.scale.set(2.2, 0.55, 1);
  scene.add(m);
}

// ─── Shoot targets (populated after bots created) ───────────────────────────
let shootTargets = [];
function rebuildShootTargets() {
  shootTargets = [];
  scene.traverse(o => { if (o.isMesh && !o.userData?.noShootTarget) shootTargets.push(o); });
}

// ─── Spawn points ───────────────────────────────────────────────────────────
const SPAWNS = [
  { x:  0, z: 22 }, { x: -20, z: 20 }, { x: 20, z: 20 }, { x: -22, z: 0 },
  { x: 22, z: 0 }, { x: -16, z: -20 }, { x: 16, z: -20 }, { x: 0, z: -4 },
];

// ─── Entity system ──────────────────────────────────────────────────────────
const PLAYER_COLORS = [
  0x44cc44, 0xe84040, 0x4488ee, 0xeeaa22, 0xcc44cc, 0x44cccc, 0xee6622, 0xaaaa44
];
const BOT_NAMES = ['Nova','Phantom','Razor','Viper','Ghost','Blitz','Cipher'];
const BOT_SKILLS = [0.18, 0.24, 0.3, 0.36, 0.28, 0.42, 0.5];
const DMG_PER_SHOT = 25;
const RESPAWN_TIME = 3;
const BOT_H = 1.55;
const BOT_R = 0.3;
const BOT_TURN_SPEED = 2.6;
const BOT_PITCH_SPEED = 3.2;
const BOT_SHOOT_ALIGN_DEG = 8;
const BOT_ACCURACY_NEAR_DIST = 8;
const BOT_ACCURACY_FAR_DIST = 35;
const BOT_FAR_SPREAD_MULT = 2.8;
const PLAYER_H = 1.75;
const PLAYER_R = 0.38;
const ENTITY_HIT_RADIUS = 0.58;
const SPAWN_PROTECT_TIME = 1.0;
const RAGDOLL_LIFETIME = 4.5;
const DEATH_RESPAWN_DELAY = 1;
const AIM_ASSIST_MAX_ANGLE_DEG = 14;
const AIM_ASSIST_DEADZONE_DEG = 0.15;
const AIM_ASSIST_STRENGTH = 6.2;
const AIM_ASSIST_SMOOTH = 9999;
const AIM_ASSIST_DAMPING = 8;
const AIM_ASSIST_MAX_RATE = 6.0;

const entities = []; // index 0 = player
const ragdolls = [];
let aimAssistVelYaw = 0;
let aimAssistVelPitch = 0;
const deathState = {
  killer: null,
  waitTimer: 0,
  canRespawn: false,
};

const RAGDOLL_GEOMS = {
  body: new THREE.CylinderGeometry(0.28, 0.28, 0.7, 8),
  head: new THREE.SphereGeometry(0.22, 8, 6),
  gun: new THREE.BoxGeometry(0.06, 0.06, 0.28),
};
const SHIELD_GEOM = new THREE.SphereGeometry(0.92, 18, 12);
const SHIELD_MAT = new THREE.MeshLambertMaterial({
  color: 0x66ccff,
  emissive: 0x2a78ff,
  emissiveIntensity: 0.65,
  transparent: true,
  opacity: 0.24,
  wireframe: true,
});

function createEntity(name, colorHex, skill, isPlayer) {
  const e = {
    name, skill, isPlayer,
    hp: 100, maxHp: 100, alive: true,
    spawnProtectTimer: 0,
    score: 0, deaths: 0,
    respawnTimer: 0,
    pos: new THREE.Vector3(0, BOT_H, 0),
    vel: new THREE.Vector3(),
    yaw: 0, pitch: 0,
    onGround: false,
    shieldMesh: null,
    mesh: null,
    gunMesh: null,
    googlyEyes: [],
    googlyPupils: [],
    deadEyeCrosses: [],
    prevPos: new THREE.Vector3(),
    prevYaw: 0,
    lastHitDir: new THREE.Vector3(),
    // AI state
    aiState: 'roam', // roam | engage | dead
    target: null,
    waypoint: null,
    stateTimer: 0,
    shootCooldown: 0,
    reactionTimer: 0,
    aimOffset: new THREE.Vector3(),
    aimUpdateTimer: 0,
  };

  if (!isPlayer) {
    // Build bot mesh
    const group = new THREE.Group();
    // Body capsule (cylinder + spheres)
    const bodyMat = new THREE.MeshLambertMaterial({ color: colorHex });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.7, 8), bodyMat);
    body.position.y = 0;
    body.castShadow = true;
    group.add(body);
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), bodyMat);
    head.position.y = 0.56;
    head.castShadow = true;
    group.add(head);
    // Googly eyes (face direction indicator)
    const eyeWhiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), eyeWhiteMat);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), eyeWhiteMat);
    leftEye.frustumCulled = false;
    rightEye.frustumCulled = false;
    leftEye.position.set(-0.065, 0.03, -0.18);
    rightEye.position.set(0.065, 0.03, -0.18);
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), pupilMat);
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), pupilMat);
    leftPupil.frustumCulled = false;
    rightPupil.frustumCulled = false;
    leftPupil.position.set(0, -0.005, -0.045);
    rightPupil.position.set(0, -0.005, -0.045);
    leftPupil.userData.basePos = leftPupil.position.clone();
    rightPupil.userData.basePos = rightPupil.position.clone();
    leftPupil.userData.off = new THREE.Vector2();
    rightPupil.userData.off = new THREE.Vector2();
    leftPupil.userData.vel = new THREE.Vector2();
    rightPupil.userData.vel = new THREE.Vector2();
    leftPupil.userData.phase = Math.random() * Math.PI * 2;
    rightPupil.userData.phase = Math.random() * Math.PI * 2;
    leftEye.add(leftPupil);
    rightEye.add(rightPupil);
    head.add(leftEye);
    head.add(rightEye);
    e.googlyEyes = [leftEye, rightEye];
    e.googlyPupils = [leftPupil, rightPupil];
    // Dead-eye crosses
    const crossMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
    for (const eyePos of [leftEye.position, rightEye.position]) {
      const cross = new THREE.Group();
      const barA = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.012, 0.01), crossMat);
      const barB = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.012, 0.01), crossMat);
      barA.rotation.z = Math.PI * 0.25;
      barB.rotation.z = -Math.PI * 0.25;
      cross.add(barA);
      cross.add(barB);
      cross.position.copy(eyePos);
      cross.visible = false;
      head.add(cross);
      e.deadEyeCrosses.push(cross);
    }
    // Gun
    const gunMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.28), gunMat);
    gun.position.set(0.3, 0.15, -0.1);
    group.add(gun);
    e.gunMesh = gun;

    group.userData.entity = e;
    body.userData.entity = e;
    head.userData.entity = e;
    gun.userData.entity = e;
    scene.add(group);
    e.mesh = group;
  }
  const shield = new THREE.Mesh(SHIELD_GEOM, SHIELD_MAT);
  shield.visible = false;
  shield.userData.noShootTarget = true;
  scene.add(shield);
  e.shieldMesh = shield;
  return e;
}

// Player entity
const playerEntity = createEntity('You', PLAYER_COLORS[0], 0, true);
entities.push(playerEntity);
// Bot entities
for (let i = 0; i < 7; i++) {
  const bot = createEntity(BOT_NAMES[i], PLAYER_COLORS[i + 1], BOT_SKILLS[i], false);
  entities.push(bot);
}

function findSafeSpawn(spawnIdx, radius, height) {
  const base = SPAWNS[spawnIdx % SPAWNS.length];
  const rings = [0, 1.5, 3.0, 4.5, 6.0];
  const perRing = 10;
  for (const ring of rings) {
    const samples = ring === 0 ? 1 : perRing;
    for (let i = 0; i < samples; i++) {
      const ang = ring === 0 ? 0 : (i / samples) * Math.PI * 2;
      const x = base.x + Math.cos(ang) * ring;
      const z = base.z + Math.sin(ang) * ring;
      const g = groundBelow(x, height + 2, z, 0, radius, height);
      if (g === -Infinity) continue;
      const y = g + height;
      if (bodyHit(x, y, z, radius, height)) continue;
      return { x, y, z };
    }
  }
  return { x: base.x, y: height, z: base.z };
}

function getEntityShieldPos(e) {
  const yOff = e.isPlayer ? PLAYER_H * 0.45 : BOT_H * 0.35;
  return new THREE.Vector3(e.pos.x, e.pos.y - yOff, e.pos.z);
}

function updateEntityShield(e) {
  if (!e.shieldMesh) return;
  const active = e.alive && e.spawnProtectTimer > 0 && !e.isPlayer;
  e.shieldMesh.visible = active;
  if (!active) return;
  e.shieldMesh.position.copy(getEntityShieldPos(e));
  const t = performance.now() * 0.001;
  const pulse = 0.85 + 0.15 * Math.sin(t * 14 + entities.indexOf(e) * 0.7);
  const s = e.isPlayer ? 1.22 : 1.1;
  e.shieldMesh.scale.setScalar(s * pulse);
}

function setEntityEyeState(e, dead) {
  if (e.googlyEyes?.length) {
    for (const eye of e.googlyEyes) eye.visible = !dead;
  }
  if (e.deadEyeCrosses?.length) {
    for (const cross of e.deadEyeCrosses) cross.visible = dead;
  }
}

function spawnEntity(e, spawnIdx) {
  const h = e.isPlayer ? PLAYER_H : BOT_H;
  const r = e.isPlayer ? PLAYER_R : BOT_R;
  const sp = findSafeSpawn(spawnIdx, r, h);
  e.pos.set(sp.x, sp.y, sp.z);
  e.vel.set(0, 0, 0);
  e.hp = e.maxHp;
  e.alive = true;
  e.spawnProtectTimer = SPAWN_PROTECT_TIME;
  e.respawnTimer = 0;
  e.aiState = 'roam';
  e.target = null;
  e.waypoint = null;
  e.shootCooldown = 0;
  e.reactionTimer = 0;
  e.prevPos.copy(e.pos);
  e.prevYaw = e.yaw;
  setEntityEyeState(e, false);
  if (e.googlyPupils?.length) {
    for (const pupil of e.googlyPupils) {
      pupil.userData.off.set(0, 0);
      pupil.userData.vel.set(0, 0);
      pupil.position.copy(pupil.userData.basePos);
    }
  }
  if (e.mesh) {
    e.mesh.visible = true;
    e.mesh.position.copy(e.pos);
    e.mesh.position.y -= BOT_H * 0.35;
  }
  updateEntityShield(e);
}

// Rebuild shoot targets now that bot meshes exist
rebuildShootTargets();
// NOTE: initial spawn deferred until after PL is defined

// ─── Game state ─────────────────────────────────────────────────────────────
const ROUND_TIME = 300; // 5 minutes
const INTERMISSION_TIME = 20;
const GAME = {
  roundTimer: ROUND_TIME,
  intermission: false,
  intermissionTimer: 0,
  roundNum: 1,
};

// ─── Killfeed ───────────────────────────────────────────────────────────────
const killfeedEl = document.getElementById('killfeed');
const killToastEl = document.getElementById('kill-toast');
const killMessages = [];
let killToastTimer = 0;
function addKillMessage(killer, victim) {
  const msg = document.createElement('div');
  msg.className = 'kill-msg';
  msg.innerHTML = `<span style="color:#${killer.isPlayer ? '4f4' : PLAYER_COLORS[entities.indexOf(killer)].toString(16).padStart(6,'0')}">${killer.name}</span> → <span style="color:#${victim.isPlayer ? '4f4' : PLAYER_COLORS[entities.indexOf(victim)].toString(16).padStart(6,'0')}">${victim.name}</span>`;
  killfeedEl.appendChild(msg);
  killMessages.push({ el: msg, time: 4 });
}
function showKillToast(victimName) {
  killToastEl.textContent = `💀 ${victimName}`;
  killToastTimer = 1.1;
  killToastEl.style.opacity = '1';
}

// ─── Bot AI helpers ─────────────────────────────────────────────────────────
function randomWaypoint() {
  return new THREE.Vector3(
    (Math.random() - 0.5) * 52,
    BOT_H,
    (Math.random() - 0.5) * 52
  );
}

function yawOffset(x, y, z, yaw) {
  return new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
}

function getTopSurfaceY(px, pz, maxY = Infinity) {
  let best = -Infinity;
  for (const c of COLS) {
    if (px < c.minX || px > c.maxX) continue;
    if (pz < c.minZ || pz > c.maxZ) continue;
    if (c.maxY > maxY) continue;
    if (c.maxY > best) best = c.maxY;
  }
  return best;
}

function spawnDeathRagdoll(victim, hitDir = null) {
  const idx = entities.indexOf(victim);
  const color = PLAYER_COLORS[Math.max(0, idx)] ?? 0xaaaaaa;
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const gunMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const baseYaw = victim.isPlayer ? PL.yaw : victim.yaw;
  const root = victim.pos.clone().add(new THREE.Vector3(0, -BOT_H * 0.35, 0));
  const inheritedVel = (victim.isPlayer ? PL.vel : victim.vel).clone().multiplyScalar(0.45);
  const shotImpulse = new THREE.Vector3();
  if (hitDir && hitDir.lengthSq() > 0.0001) {
    shotImpulse.copy(hitDir).normalize().multiplyScalar(11);
    shotImpulse.y += 1.9;
  }

  const parts = [];
  const bodyRig = new THREE.Group();
  const ragBody = new THREE.Mesh(RAGDOLL_GEOMS.body, bodyMat);
  ragBody.position.set(0, 0, 0);
  ragBody.castShadow = true;
  ragBody.receiveShadow = true;
  bodyRig.add(ragBody);
  const ragHead = new THREE.Mesh(RAGDOLL_GEOMS.head, bodyMat);
  ragHead.position.set(0, 0.56, 0);
  ragHead.castShadow = true;
  ragHead.receiveShadow = true;
  const ragCrossMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
  for (const sx of [-1, 1]) {
    const cross = new THREE.Group();
    const barA = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.012, 0.01), ragCrossMat);
    const barB = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.012, 0.01), ragCrossMat);
    barA.rotation.z = Math.PI * 0.25;
    barB.rotation.z = -Math.PI * 0.25;
    cross.add(barA);
    cross.add(barB);
    cross.position.set(0.065 * sx, 0.03, -0.18);
    ragHead.add(cross);
  }
  bodyRig.add(ragHead);
  bodyRig.position.copy(root).add(yawOffset(0, 0, 0, baseYaw));
  bodyRig.rotation.set(
    (Math.random() - 0.5) * 0.4,
    baseYaw + (Math.random() - 0.5) * 0.7,
    (Math.random() - 0.5) * 0.4
  );
  scene.add(bodyRig);
  parts.push({
    mesh: bodyRig,
    radius: 0.58,
    vel: inheritedVel.clone().add(shotImpulse.clone().multiplyScalar(0.9 + Math.random() * 0.35)).add(new THREE.Vector3(
      (Math.random() - 0.5) * 5,
      4 + Math.random() * 4,
      (Math.random() - 0.5) * 5
    )),
    angVel: new THREE.Vector3(
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8
    ),
  });

  const ragGun = new THREE.Mesh(RAGDOLL_GEOMS.gun, gunMat);
  ragGun.position.copy(root).add(yawOffset(0.3, 0.15, -0.1, baseYaw));
  ragGun.rotation.set(
    (Math.random() - 0.5) * 0.4,
    baseYaw + (Math.random() - 0.5) * 0.7,
    (Math.random() - 0.5) * 0.4
  );
  ragGun.castShadow = true;
  ragGun.receiveShadow = true;
  scene.add(ragGun);
  parts.push({
    mesh: ragGun,
    radius: 0.18,
    vel: inheritedVel.clone().add(shotImpulse.clone().multiplyScalar(0.75 + Math.random() * 0.35)).add(new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      4 + Math.random() * 4,
      (Math.random() - 0.5) * 6
    )),
    angVel: new THREE.Vector3(
      (Math.random() - 0.5) * 9,
      (Math.random() - 0.5) * 9,
      (Math.random() - 0.5) * 9
    ),
  });

  ragdolls.push({ ttl: RAGDOLL_LIFETIME, parts });
}

function updateRagdolls(dt) {
  for (let i = ragdolls.length - 1; i >= 0; i--) {
    const rag = ragdolls[i];
    rag.ttl -= dt;
    for (const p of rag.parts) {
      p.vel.y -= GRAVITY * dt * 0.95;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += p.angVel.x * dt;
      p.mesh.rotation.y += p.angVel.y * dt;
      p.mesh.rotation.z += p.angVel.z * dt;

      const floor = getTopSurfaceY(p.mesh.position.x, p.mesh.position.z, p.mesh.position.y + 0.25);
      if (floor > -Infinity && p.mesh.position.y - p.radius <= floor) {
        p.mesh.position.y = floor + p.radius;
        if (p.vel.y < 0) p.vel.y *= -0.28;
        p.vel.x *= 0.76;
        p.vel.z *= 0.76;
        p.angVel.multiplyScalar(0.82);
        if (Math.abs(p.vel.y) < 0.6) p.vel.y = 0;
      }
    }

    if (rag.ttl <= 0) {
      for (const p of rag.parts) scene.remove(p.mesh);
      ragdolls.splice(i, 1);
    }
  }
}

function clearRagdolls() {
  for (const rag of ragdolls) {
    for (const p of rag.parts) scene.remove(p.mesh);
  }
  ragdolls.length = 0;
}

function hasLineOfSight(from, to) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const dist = dir.length();
  if (dist < 0.5) return true;
  dir.normalize();
  const ray = new THREE.Raycaster(from, dir, 0.5, dist);
  const hits = ray.intersectObjects(shootTargets, false);
  for (const h of hits) {
    if (h.object.userData.entity) continue; // ignore entity meshes
    return false;
  }
  return true;
}

function angleWrap(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function getLookDirFromYawPitch(yaw, pitch) {
  const cp = Math.cos(pitch);
  return new THREE.Vector3(
    -Math.sin(yaw) * cp,
    Math.sin(pitch),
    -Math.cos(yaw) * cp
  );
}

function resolveRayHitEntity(origin, dir, shooter, maxDist = 60) {
  const ray = new THREE.Raycaster(origin, dir, 0.5, maxDist);
  const hits = ray.intersectObjects(shootTargets, true);

  let hitEntity = null;
  let worldHitDist = Infinity;
  for (const h of hits) {
    let obj = h.object;
    while (obj) {
      if (obj.userData?.entity && obj.userData.entity !== shooter && obj.userData.entity.alive) {
        hitEntity = obj.userData.entity;
        break;
      }
      obj = obj.parent;
    }
    if (hitEntity) return hitEntity;
    if (!h.object.userData?.entity) { worldHitDist = h.distance; break; }
  }

  const hitR2 = ENTITY_HIT_RADIUS * ENTITY_HIT_RADIUS;
  let best = null;
  let bestT = Infinity;
  for (const e of entities) {
    if (e === shooter || !e.alive) continue;
    const center = e.isPlayer ? PL.pos : e.pos;
    const toCenter = new THREE.Vector3().subVectors(center, origin);
    const t = toCenter.dot(dir);
    if (t <= 0.5 || t >= bestT || t >= worldHitDist || t > maxDist) continue;
    const closest = origin.clone().addScaledVector(dir, t);
    if (closest.distanceToSquared(center) <= hitR2) {
      best = e;
      bestT = t;
    }
  }
  return best;
}

function getPlayerCrosshairHitEntity() {
  const lookDir = getLookDirFromYawPitch(PL.yaw, PL.pitch);
  return resolveRayHitEntity(PL.pos, lookDir, playerEntity, 60);
}

function applyAimAssist(dt) {
  const damp = Math.exp(-AIM_ASSIST_DAMPING * dt);
  if (!locked || !playerEntity.alive) {
    aimAssistVelYaw *= damp;
    aimAssistVelPitch *= damp;
    return;
  }
  if (getPlayerCrosshairHitEntity()) {
    aimAssistVelYaw *= damp;
    aimAssistVelPitch *= damp;
    return;
  }

  const eye = PL.pos;
  const lookDir = getLookDirFromYawPitch(PL.yaw, PL.pitch);
  const maxAngle = THREE.MathUtils.degToRad(AIM_ASSIST_MAX_ANGLE_DEG);
  const deadzone = THREE.MathUtils.degToRad(AIM_ASSIST_DEADZONE_DEG);

  let best = null;
  let bestAngle = Infinity;
  for (const e of entities) {
    if (!e.alive || e.isPlayer) continue;
    const toEnemy = new THREE.Vector3().subVectors(e.pos, eye);
    const dist = toEnemy.length();
    if (dist < 0.001) continue;
    toEnemy.multiplyScalar(1 / dist);
    const dot = THREE.MathUtils.clamp(lookDir.dot(toEnemy), -1, 1);
    const angle = Math.acos(dot);
    if (angle > maxAngle || angle >= bestAngle) continue;
    if (!hasLineOfSight(eye, e.pos)) continue;
    best = e;
    bestAngle = angle;
  }
  if (!best) {
    aimAssistVelYaw *= damp;
    aimAssistVelPitch *= damp;
    return;
  }

  const dx = best.pos.x - eye.x;
  const dz = best.pos.z - eye.z;
  const dy = best.pos.y - eye.y;
  const desiredYaw = Math.atan2(-dx, -dz);
  const desiredPitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
  const yawDelta = angleWrap(desiredYaw - PL.yaw);
  const pitchDelta = desiredPitch - PL.pitch;
  if (Math.abs(yawDelta) < deadzone && Math.abs(pitchDelta) < deadzone) {
    aimAssistVelYaw *= damp;
    aimAssistVelPitch *= damp;
    return;
  }

  const weight = Math.max(0.25, 1 - bestAngle / maxAngle);
  const desiredRateYaw = THREE.MathUtils.clamp(yawDelta * AIM_ASSIST_STRENGTH * weight, -AIM_ASSIST_MAX_RATE, AIM_ASSIST_MAX_RATE);
  const desiredRatePitch = THREE.MathUtils.clamp(pitchDelta * AIM_ASSIST_STRENGTH * weight, -AIM_ASSIST_MAX_RATE, AIM_ASSIST_MAX_RATE);
  const blend = Math.min(1, AIM_ASSIST_SMOOTH * dt);
  aimAssistVelYaw += (desiredRateYaw - aimAssistVelYaw) * blend;
  aimAssistVelPitch += (desiredRatePitch - aimAssistVelPitch) * blend;

  PL.yaw += aimAssistVelYaw * dt;
  PL.pitch += aimAssistVelPitch * dt;
  PL.pitch = Math.max(-1.5, Math.min(1.5, PL.pitch));
}

function killEntity(victim, killer) {
  if (!victim.alive) return;
  victim.alive = false;
  victim.hp = 0;
  victim.spawnProtectTimer = 0;
  victim.respawnTimer = RESPAWN_TIME;
  victim.deaths++;
  if (killer) killer.score++;
  if (victim.isPlayer) {
    deathState.killer = killer && killer !== victim ? killer : null;
    deathState.waitTimer = DEATH_RESPAWN_DELAY;
    deathState.canRespawn = false;
  }
  setEntityEyeState(victim, true);
  spawnDeathRagdoll(victim, victim.lastHitDir);
  victim.lastHitDir.set(0, 0, 0);
  updateEntityShield(victim);
  if (victim.mesh) victim.mesh.visible = false;
  addKillMessage(killer || victim, victim);
}

function damageEntity(victim, amount, attacker, hitDir = null) {
  if (!victim.alive) return;
  if (victim.spawnProtectTimer > 0) return;
  if (hitDir && hitDir.lengthSq() > 0.0001) victim.lastHitDir.copy(hitDir).normalize();
  killEntity(victim, attacker);
}

function updateSpawnProtection(dt) {
  for (const e of entities) {
    if (e.alive && e.spawnProtectTimer > 0) {
      e.spawnProtectTimer = Math.max(0, e.spawnProtectTimer - dt);
    }
    updateEntityShield(e);
  }
}

function updateGooglyEyes(e, dt) {
  if (!e.googlyPupils?.length) return;
  const safeDt = Math.max(0.001, dt);
  const vx = (e.pos.x - e.prevPos.x) / safeDt;
  const vz = (e.pos.z - e.prevPos.z) / safeDt;
  const turnRate = angleWrap(e.yaw - e.prevYaw) / safeDt;

  const rightX = Math.cos(e.yaw);
  const rightZ = -Math.sin(e.yaw);
  const velRight = vx * rightX + vz * rightZ;

  // Inertial target offset from lateral acceleration + turn rate.
  const targetX = THREE.MathUtils.clamp(-velRight * 0.007 - turnRate * 0.01, -0.02, 0.02);
  const targetY = THREE.MathUtils.clamp(-e.vel.y * 0.0025, -0.014, 0.014);

  for (const pupil of e.googlyPupils) {
    const off = pupil.userData.off;
    const vel = pupil.userData.vel;
    const base = pupil.userData.basePos;
    const phase = pupil.userData.phase || 0;
    const wobbleX = Math.sin(performance.now() * 0.006 + phase) * 0.002;
    const wobbleY = Math.cos(performance.now() * 0.007 + phase) * 0.0015;

    const springK = 80;
    const damping = 9;
    vel.x += ((targetX + wobbleX) - off.x) * springK * safeDt;
    vel.y += ((targetY + wobbleY) - off.y) * springK * safeDt;
    const dampMul = Math.exp(-damping * safeDt);
    vel.multiplyScalar(dampMul);
    off.x += vel.x * safeDt;
    off.y += vel.y * safeDt;
    off.x = THREE.MathUtils.clamp(off.x, -0.02, 0.02);
    off.y = THREE.MathUtils.clamp(off.y, -0.014, 0.014);

    pupil.position.set(base.x + off.x, base.y + off.y, base.z);
  }

  e.prevPos.copy(e.pos);
  e.prevYaw = e.yaw;
}

// ─── Bot update ─────────────────────────────────────────────────────────────
const _botFw = new THREE.Vector3();
const _botToTarget = new THREE.Vector3();
const _botRayOrigin = new THREE.Vector3();

function updateBot(e, dt) {
  if (!e.alive) {
    updateGooglyEyes(e, dt);
    e.respawnTimer -= dt;
    if (e.respawnTimer <= 0) {
      const idx = Math.floor(Math.random() * SPAWNS.length);
      spawnEntity(e, idx);
    }
    return;
  }

  e.shootCooldown -= dt;
  e.stateTimer -= dt;
  e.aimUpdateTimer -= dt;

  // Find nearest visible alive enemy
  let nearestDist = Infinity;
  let nearest = null;
  const eyePos = new THREE.Vector3(e.pos.x, e.pos.y, e.pos.z);
  for (const other of entities) {
    if (other === e || !other.alive) continue;
    const otherEye = other.isPlayer
      ? new THREE.Vector3(PL.pos.x, PL.pos.y, PL.pos.z)
      : new THREE.Vector3(other.pos.x, other.pos.y, other.pos.z);
    const d = eyePos.distanceTo(otherEye);
    if (d < nearestDist && hasLineOfSight(eyePos, otherEye)) {
      nearestDist = d;
      nearest = other;
    }
  }

  // State transitions
  if (e.aiState === 'roam') {
    if (nearest && nearestDist < 40) {
      e.aiState = 'engage';
      e.target = nearest;
      e.reactionTimer = (1 - e.skill) * 0.8 + Math.random() * 0.3;
    }
    if (!e.waypoint || e.stateTimer <= 0 || e.pos.distanceTo(e.waypoint) < 2) {
      e.waypoint = randomWaypoint();
      e.stateTimer = 4 + Math.random() * 4;
    }
  } else if (e.aiState === 'engage') {
    if (!nearest || nearestDist > 50 || !e.target?.alive) {
      e.aiState = 'roam';
      e.target = null;
      e.waypoint = randomWaypoint();
      e.stateTimer = 3;
    }
  }

  // Movement
  const moveSpeed = 9 * (0.6 + e.skill * 0.4);
  _botFw.set(-Math.sin(e.yaw), 0, -Math.cos(e.yaw));

  if (e.aiState === 'roam' && e.waypoint) {
    const toWP = new THREE.Vector3().subVectors(e.waypoint, e.pos);
    toWP.y = 0;
    if (toWP.lengthSq() > 1) {
      toWP.normalize();
      e.yaw = Math.atan2(-toWP.x, -toWP.z);
      const nx = e.pos.x + toWP.x * moveSpeed * dt;
      const nz = e.pos.z + toWP.z * moveSpeed * dt;
      if (!bodyHit(nx, e.pos.y, nz, BOT_R, BOT_H)) {
        e.pos.x = nx; e.pos.z = nz;
      } else {
        e.waypoint = randomWaypoint();
      }
    }
  } else if (e.aiState === 'engage' && e.target) {
    const targetPos = e.target.isPlayer
      ? new THREE.Vector3(PL.pos.x, PL.pos.y, PL.pos.z)
      : e.target.pos.clone();

    // Turn toward target (no snap aim)
    const dx = targetPos.x - e.pos.x;
    const dz = targetPos.z - e.pos.z;
    const dy = targetPos.y - e.pos.y;
    const desiredYaw = Math.atan2(-dx, -dz);
    const desiredPitch = Math.atan2(dy, Math.sqrt(dx*dx + dz*dz));
    const yawDelta = angleWrap(desiredYaw - e.yaw);
    const turnScale = 0.75 + e.skill * 0.75;
    const yawStep = BOT_TURN_SPEED * turnScale * dt;
    const pitchStep = BOT_PITCH_SPEED * turnScale * dt;
    e.yaw += THREE.MathUtils.clamp(yawDelta, -yawStep, yawStep);
    e.pitch += THREE.MathUtils.clamp(desiredPitch - e.pitch, -pitchStep, pitchStep);
    e.pitch = Math.max(-1.25, Math.min(1.25, e.pitch));

    // Strafe or approach
    const dist = Math.sqrt(dx*dx + dz*dz);
    if (dist > 12) {
      // Move toward target
      const toT = new THREE.Vector3(dx, 0, dz).normalize();
      const nx = e.pos.x + toT.x * moveSpeed * dt;
      const nz = e.pos.z + toT.z * moveSpeed * dt;
      if (!bodyHit(nx, e.pos.y, nz, BOT_R, BOT_H)) {
        e.pos.x = nx; e.pos.z = nz;
      }
    } else if (dist > 5) {
      // Strafe
      const strafeDir = Math.sin(clock.elapsedTime * 2 + entities.indexOf(e)) > 0 ? 1 : -1;
      const srt = new THREE.Vector3(Math.cos(e.yaw), 0, -Math.sin(e.yaw));
      const nx = e.pos.x + srt.x * strafeDir * moveSpeed * 0.6 * dt;
      const nz = e.pos.z + srt.z * strafeDir * moveSpeed * 0.6 * dt;
      if (!bodyHit(nx, e.pos.y, nz, BOT_R, BOT_H)) {
        e.pos.x = nx; e.pos.z = nz;
      }
    }

    // Shoot
    e.reactionTimer -= dt;
    const alignYaw = Math.abs(angleWrap(desiredYaw - e.yaw));
    const alignPitch = Math.abs(desiredPitch - e.pitch);
    const alignMax = THREE.MathUtils.degToRad(BOT_SHOOT_ALIGN_DEG + (1 - e.skill) * 5);
    if (e.reactionTimer <= 0 && e.shootCooldown <= 0 && nearestDist < 35 &&
        alignYaw <= alignMax && alignPitch <= alignMax * 0.8) {
      // Aim with spread based on skill (lower skill = more spread)
      if (e.aimUpdateTimer <= 0) {
        const shotDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const distT = THREE.MathUtils.clamp(
          (shotDist - BOT_ACCURACY_NEAR_DIST) / (BOT_ACCURACY_FAR_DIST - BOT_ACCURACY_NEAR_DIST),
          0, 1
        );
        const spreadMult = THREE.MathUtils.lerp(1, BOT_FAR_SPREAD_MULT, distT);
        const spread = (1 - e.skill) * 3.5 * spreadMult;
        e.aimOffset.set(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread * 0.6,
          (Math.random() - 0.5) * spread
        );
        e.aimUpdateTimer = 0.15 + (1 - e.skill) * 0.3;
      }

      const aimAt = targetPos.clone().add(e.aimOffset);
      const shootDir = new THREE.Vector3().subVectors(aimAt, eyePos).normalize();
      const hitEntity = resolveRayHitEntity(eyePos, shootDir, e, 60);

      if (hitEntity) {
        damageEntity(hitEntity, DMG_PER_SHOT, e, shootDir);
      }

      e.shootCooldown = 0.8 + (1 - e.skill) * 0.6;
      // Animate gun recoil
      if (e.gunMesh) {
        e.gunMesh.position.z += 0.08;
        setTimeout(() => { if (e.gunMesh) e.gunMesh.position.z = -0.1; }, 100);
      }
    }
  }

  // Bot gravity & ground
  e.vel.y -= GRAVITY * dt;
  e.pos.y += e.vel.y * dt;
  const g = groundBelow(e.pos.x, e.pos.y, e.pos.z, 0, BOT_R, BOT_H);
  const feetFloor = g + BOT_H;
  if (e.pos.y <= feetFloor) {
    e.pos.y = feetFloor;
    e.vel.y = 0;
    e.onGround = true;
  } else {
    e.onGround = false;
  }

  // Kill plane
  if (e.pos.y < -15) {
    killEntity(e, null);
  }

  // Jump pads
  if (e.onGround) {
    for (const pad of [JUMP_PAD, JUMP_PAD_2]) {
      const dx = e.pos.x - pad.cx;
      const dz = e.pos.z - pad.cz;
      if (Math.abs(dx) < pad.hw + BOT_R && Math.abs(dz) < pad.hd + BOT_R) {
        e.vel.y = pad.launchVel;
        e.onGround = false;
        break;
      }
    }
  }

  // Update mesh
  if (e.mesh) {
    e.mesh.position.copy(e.pos);
    e.mesh.position.y -= BOT_H * 0.35;
    e.mesh.rotation.y = e.yaw;
  }
  updateGooglyEyes(e, dt);
}

// ─── HUD update helpers ─────────────────────────────────────────────────────
const timerEl = document.getElementById('timer');
const scoreboardEl = document.getElementById('scoreboard');
const deathOverlay = document.getElementById('death-overlay');
const deathTitleEl = document.getElementById('death-title');
const respawnTimerEl = document.getElementById('respawn-timer');
const intermissionOverlay = document.getElementById('intermission-overlay');
const intermissionTimerEl = document.getElementById('intermission-timer');

function updateScoreboard() {
  const sorted = [...entities].sort((a, b) => b.score - a.score);
  scoreboardEl.innerHTML = sorted.map(e => {
    const idx = entities.indexOf(e);
    const col = '#' + PLAYER_COLORS[idx].toString(16).padStart(6, '0');
    return `<div class="sb-entry${e.isPlayer ? ' you' : ''}" style="border-top:3px solid ${col}">
      <span class="sb-name">${e.name}</span><span class="sb-score">${e.score}</span>
    </div>`;
  }).join('');
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── Viewmodel scene ─────────────────────────────────────────────────────────
const vmScene  = new THREE.Scene();
const vmCamera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.01, 20);
vmScene.add(new THREE.AmbientLight(0xffffff, 0.9));
const vmSun = new THREE.DirectionalLight(0xffffff, 1.2);
vmSun.position.set(0.5, 1, 0.5);
vmScene.add(vmSun);

// ── Gun materials ──
const matSlide   = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
const matGrip    = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
const matBarrel  = new THREE.MeshLambertMaterial({ color: 0x333333 });
const matAccent2 = new THREE.MeshLambertMaterial({ color: 0x555555 });

// ── Build pistol ──
const gunGroup = new THREE.Group();
function gunBox(w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  gunGroup.add(m);
  return m;
}
gunBox(0.055, 0.055, 0.24,   0,      0,      -0.02,  matSlide);   // slide
gunBox(0.057, 0.018, 0.07,   0,      0.012,   0.03,  matAccent2); // ejection port
gunBox(0.026, 0.026, 0.07,   0,     -0.001,  -0.155, matBarrel);  // barrel
const grip = gunBox(0.05, 0.11, 0.065, 0.001, -0.082, 0.055, matGrip); // grip
grip.rotation.x = 0.18;
gunBox(0.008, 0.024, 0.055,  0,     -0.038,   0.005, matAccent2); // trigger guard
gunBox(0.007, 0.014, 0.006,  0,      0.032,  -0.14,  matAccent2); // front sight
gunBox(0.032, 0.012, 0.006,  0,      0.032,   0.085, matAccent2); // rear sight
vmCamera.add(gunGroup);
vmScene.add(vmCamera);

// ── Gun state ──
const GUN = {
  restPos : new THREE.Vector3(0.17, -0.17, -0.32),
  curPos  : new THREE.Vector3(0.17, -0.17, -0.32),
  curRot  : new THREE.Euler(),
  recoil  : 0,
  cooldown: 0,
  RELOAD  : 1.0,
};

// ── Audio ──
const AC = new (window.AudioContext || window.webkitAudioContext)();

function playShot() {
  const t = AC.currentTime;

  // --- low thump (body of the shot) ---
  const osc = AC.createOscillator();
  const oscGain = AC.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  oscGain.gain.setValueAtTime(1.2, t);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(oscGain);
  oscGain.connect(AC.destination);
  osc.start(t); osc.stop(t + 0.18);

  // --- sharp crack (noise burst) ---
  const bufSize = AC.sampleRate * 0.08;
  const buf = AC.createBuffer(1, bufSize, AC.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
  const noise = AC.createBufferSource();
  noise.buffer = buf;

  // high-pass to make it crackly
  const hp = AC.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1800;

  const noiseGain = AC.createGain();
  noiseGain.gain.setValueAtTime(0.9, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

  noise.connect(hp);
  hp.connect(noiseGain);
  noiseGain.connect(AC.destination);
  noise.start(t); noise.stop(t + 0.08);
}

function playKillConfirm() {
  const t = AC.currentTime;
  const osc = AC.createOscillator();
  const gain = AC.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(920, t);
  osc.frequency.exponentialRampToValueAtTime(1320, t + 0.06);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  osc.connect(gain);
  gain.connect(AC.destination);
  osc.start(t);
  osc.stop(t + 0.12);
}

function vibrateKill() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = pads ? Array.from(pads).find(Boolean) : null;
  if (!gp) return;
  if (gp.vibrationActuator?.playEffect) {
    gp.vibrationActuator.playEffect('dual-rumble', {
      duration: 140,
      startDelay: 0,
      weakMagnitude: 0.75,
      strongMagnitude: 1.0,
    }).catch(() => {});
    return;
  }
  const hap = gp.hapticActuators?.[0];
  if (hap?.pulse) hap.pulse(0.95, 120).catch(() => {});
}

// ── Shooting ──
const RAY = new THREE.Raycaster();

function shoot() {
  if (GUN.cooldown > 0 || !playerEntity.alive) return;
  GUN.cooldown = GUN.RELOAD;
  GUN.recoil   = 1.0;
  if (AC.state === 'suspended') AC.resume();
  playShot();
  RAY.setFromCamera({ x: 0, y: 0 }, camera);
  const hitEntity = resolveRayHitEntity(RAY.ray.origin, RAY.ray.direction, playerEntity, 60);
  if (!hitEntity) return;
  const wasAlive = hitEntity.alive;
  damageEntity(hitEntity, DMG_PER_SHOT, playerEntity, RAY.ray.direction);
  if (wasAlive && !hitEntity.alive) {
    playKillConfirm();
    vibrateKill();
    showKillToast(hitEntity.name);
  }
}

renderer.domElement.addEventListener('click', () => { if (locked) shoot(); });
// Right-click = ADS
let rightMouseHeld = false;
renderer.domElement.addEventListener('mousedown', e => { if (e.button === 2) rightMouseHeld = true; });
renderer.domElement.addEventListener('mouseup',   e => { if (e.button === 2) rightMouseHeld = false; });
renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

// Controller right trigger (btn 7) handled in loop

// ─── Player ──────────────────────────────────────────────────────────────────
const PL = {
  pos: new THREE.Vector3(0, PLAYER_H, 22),
  vel: new THREE.Vector3(),
  yaw: 0, pitch: 0,
  onGround: false,
  H: PLAYER_H,      // current eye height (animated)
  R: PLAYER_R,
};

// ─── Movement state ──────────────────────────────────────────────────────────
const State = {
  sprinting    : true,   // true = sprint speed; false = trigger/shift held (walk)
  sliding      : false,
  slideVel     : new THREE.Vector3(),
  slideTimer   : 0,
  slideCooldown: 0,
};

// ─── Animated camera values ──────────────────────────────────────────────────
let fovCur    = 80,  fovTgt    = 80;
let adsHeld   = false;
let rollCur   = 0,   rollTgt   = 0;
let heightCur = 1.75, heightTgt = 1.75;
let bobPhase  = 0,   bobAmt    = 0;

// ─── Input ───────────────────────────────────────────────────────────────────
const keys = {};
let locked = false;
let respawnInputQueued = false;
let prevAnyGamepadPressed = false;

const reloadRing = document.getElementById('reload-ring');
const rctx = reloadRing.getContext('2d');

renderer.domElement.addEventListener('click', () => {
  if (!locked) renderer.domElement.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  locked = !!document.pointerLockElement;
  document.getElementById('crosshair').style.display = locked ? 'block' : 'none';
});
document.addEventListener('mousemove', e => {
  if (!locked) return;
  const sens = adsHeld ? 0.0006 : 0.0022;
  PL.yaw   -= e.movementX * sens;
  PL.pitch  = Math.max(-1.5, Math.min(1.5, PL.pitch - e.movementY * sens));
});
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (!playerEntity.alive && deathState.canRespawn) respawnInputQueued = true;
  e.preventDefault();
});
document.addEventListener('keyup',   e => { keys[e.code] = false; });
renderer.domElement.addEventListener('mousedown', () => {
  if (!playerEntity.alive && deathState.canRespawn) respawnInputQueued = true;
});

// ─── Physics helpers ─────────────────────────────────────────────────────────
const GRAVITY    = 30;
const STEP_H     = 0.55;   // auto-step-up height
const JUMP_VEL   = 9.5;

// Returns the highest surface top-Y that is directly below the player (XZ overlap, top ≤ eyeY - H + STEP_H + ε)
function groundBelow(px, py, pz, extraUp = 0, r = PL.R, h = PL.H) {
  let best = -Infinity;
  for (const c of COLS) {
    if (px + r <= c.minX || px - r >= c.maxX) continue;
    if (pz + r <= c.minZ || pz - r >= c.maxZ) continue;
    const top = c.maxY;
    if (top > py - h + STEP_H + extraUp + 0.02) continue;
    if (top < py - h - 4) continue;
    if (top > best) best = top;
  }
  return best;
}

function bodyHit(px, py, pz, r = PL.R, h = PL.H) {
  const footY  = py - h;
  const stepTop = footY + STEP_H;
  for (const c of COLS) {
    if (px + r <= c.minX || px - r >= c.maxX) continue;
    if (pz + r <= c.minZ || pz - r >= c.maxZ) continue;
    if (c.maxY <= stepTop)   continue;
    if (c.minY >= py + 0.15) continue;
    return true;
  }
  return false;
}

// ─── Gamepad helpers ─────────────────────────────────────────────────────────
function getGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const p of pads) if (p) return p;
  return null;
}
function anyGamepadPressed(p) {
  if (!p) return false;
  return p.buttons.some(b => b && (b.pressed || b.value > 0.65));
}
const DEAD = 0.18; // stick dead zone
function axis(p, i) { const v = p.axes[i] ?? 0; return Math.abs(v) > DEAD ? v : 0; }
function btn(p, i)  { return p.buttons[i]?.pressed ?? false; }

function respawnPlayerNow() {
  const idx = Math.floor(Math.random() * SPAWNS.length);
  spawnEntity(playerEntity, idx);
  PL.pos.copy(playerEntity.pos);
  PL.vel.set(0, 0, 0);
  State.sliding = false;
  PL.onGround = true;
  heightCur = heightTgt = 1.75;
  PL.H = 1.75;
  deathState.killer = null;
  deathState.waitTimer = 0;
  deathState.canRespawn = false;
  respawnInputQueued = false;
  deathOverlay.style.display = 'none';
}

// ─── Initial spawn (deferred until PL exists) ──────────────────────────────
entities.forEach((e, i) => spawnEntity(e, i));
PL.pos.copy(playerEntity.pos);

// ─── Game loop ───────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let prevCrouch = false;

function update() {
  requestAnimationFrame(update);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (locked && playerEntity.alive) {
    // ── Gamepad poll ──
    const gp = getGamepad();

    // Right stick → look
    if (gp) {
      const gpSens = adsHeld ? 1.5 : 5.5;
      PL.yaw   -= axis(gp, 2) * gpSens * dt;
      PL.pitch  = Math.max(-1.5, Math.min(1.5, PL.pitch - axis(gp, 3) * gpSens * dt));
    }
    applyAimAssist(dt);

    // ── Directions ──
    const fw = new THREE.Vector3(-Math.sin(PL.yaw), 0, -Math.cos(PL.yaw));
    const rt = new THREE.Vector3( Math.cos(PL.yaw), 0, -Math.sin(PL.yaw));

    // ── Raw input (keyboard + left stick) ──
    const inputDir = new THREE.Vector3();
    if (keys['KeyW'] || keys['ArrowUp'])    inputDir.addScaledVector(fw,  1);
    if (keys['KeyS'] || keys['ArrowDown'])  inputDir.addScaledVector(fw, -1);
    if (keys['KeyD'] || keys['ArrowRight']) inputDir.addScaledVector(rt,  1);
    if (keys['KeyA'] || keys['ArrowLeft'])  inputDir.addScaledVector(rt, -1);
    if (gp) {
      inputDir.addScaledVector(fw, -axis(gp, 1));
      inputDir.addScaledVector(rt,  axis(gp, 0));
    }
    const forwardInput = inputDir.dot(fw);
    const strafeInput = inputDir.dot(rt);
    const isMoving = inputDir.lengthSq() > 0.01;

    // ── Cooldown tick ──
    if (State.slideCooldown > 0) State.slideCooldown -= dt;

    // ── Always sprinting — left trigger (btn 6 / axes[2]) or Shift = walk ──
    // Left trigger: button 6 analog value only (0 = released → 1 = fully pressed)
    // Dropping the axes[2] fallback — it maps to random axes on non-Xbox controllers and causes flickering
    const ltValue = gp ? (gp.buttons[6]?.value ?? 0) : 0;
    adsHeld = ltValue > 0.1 || rightMouseHeld;
    State.sprinting = !adsHeld && !State.sliding;

    // ── Slide trigger: C / Ctrl (keyboard) or L3 left-stick click (btn 10) ──
    const gpSlideKey = gp ? btn(gp, 10) : false;
    const slideKey   = keys['KeyC'] || keys['ControlLeft'] || keys['ControlRight']
                    || keys['ShiftLeft'] || keys['ShiftRight'] || gpSlideKey;
    const slideTrigger = slideKey && !prevCrouch;
    prevCrouch = slideKey;

    if (slideTrigger && PL.onGround && !State.sliding && State.slideCooldown <= 0 && isMoving) {
      State.sliding = true;
      // Explicit sideways slide when lateral input dominates.
      const sideDominant = Math.abs(strafeInput) > Math.abs(forwardInput) * 0.9;
      const slideDir = sideDominant
        ? rt.clone().multiplyScalar(Math.sign(strafeInput) || 1)
        : inputDir.clone().normalize();
      const launchSpeed = sideDominant
        ? (State.sprinting ? 20 : 14)
        : (State.sprinting ? 17 : 10);
      State.slideVel.copy(slideDir).multiplyScalar(launchSpeed);
      State.sprinting = false;
    }

    // ── Gamepad jump (btn 0 = A / Cross) ──
    if (gp && btn(gp, 0)) keys['Space'] = true;

    // ── Speed: always fast unless trigger held ──
    const SPEED = State.sprinting ? 17 : adsHeld ? 4 : 7;

    // ── Build move delta ──
    const mv = new THREE.Vector3();

    if (State.sliding) {
      // Direction locked — gentle friction
      State.slideVel.multiplyScalar(Math.max(0, 1 - 2.8 * dt));
      mv.copy(State.slideVel).multiplyScalar(dt);

      // End slide on key/button release
      if (!slideKey) {
        State.sliding       = false;
        State.slideCooldown = 0.55;
        State.slideVel.set(0, 0, 0);
      }
    } else {
      if (isMoving) inputDir.normalize().multiplyScalar(SPEED * dt);
      mv.copy(inputDir);
    }

    // ── Jump: works during sprint without interrupting it; also slide-jump ──
    if (keys['Space'] && PL.onGround) {
      if (State.sliding) {
        PL.vel.x = State.slideVel.x * 0.65;
        PL.vel.z = State.slideVel.z * 0.65;
        State.sliding       = false;
        State.slideCooldown = 0.3;
        State.slideVel.set(0, 0, 0);
      }
      PL.vel.y    = JUMP_VEL;
      PL.onGround = false;
      // Sprint continues — no state reset needed
    }

    // ── Eye-height: slides down during slide, instant recovery after ──
    heightTgt = State.sliding ? 1.0 : 1.75;
    heightCur += (heightTgt - heightCur) * Math.min(1, 14 * dt);
    PL.H = heightCur;

    // ── Horizontal movement with step-up ──
    function tryMoveAxis(axis, delta) {
      const nx = axis === 'x' ? PL.pos.x + delta : PL.pos.x;
      const nz = axis === 'z' ? PL.pos.z + delta : PL.pos.z;
      if (!bodyHit(nx, PL.pos.y, nz)) {
        if (axis === 'x') PL.pos.x = nx; else PL.pos.z = nz;
      } else {
        // Step up?
        const g = groundBelow(nx, PL.pos.y + STEP_H, nz, STEP_H);
        if (g > -Infinity && g + PL.H <= PL.pos.y + STEP_H && !bodyHit(nx, g + PL.H, nz)) {
          if (axis === 'x') PL.pos.x = nx; else PL.pos.z = nz;
          PL.pos.y = g + PL.H;
          PL.vel.y = 0; PL.onGround = true;
        } else {
          // Wall hit during slide — kill lateral momentum on that axis
          if (State.sliding) {
            if (axis === 'x') State.slideVel.x = 0;
            else              State.slideVel.z = 0;
            if (State.slideVel.lengthSq() < 4) {
              State.sliding = false;
              State.slideCooldown = 0.3;
            }
          }
        }
      }
    }
    tryMoveAxis('x', mv.x);
    tryMoveAxis('z', mv.z);

    // ── Gravity ──
    PL.vel.y -= GRAVITY * dt;
    PL.pos.y += PL.vel.y * dt;

    const g = groundBelow(PL.pos.x, PL.pos.y, PL.pos.z);
    const feetFloor = g + PL.H;
    if (PL.pos.y <= feetFloor) {
      PL.pos.y    = feetFloor;
      PL.vel.y    = 0;
      PL.onGround = true;
    } else {
      PL.onGround = false;
    }

    // Ceiling bonk
    for (const c of COLS) {
      if (PL.pos.x + PL.R <= c.minX || PL.pos.x - PL.R >= c.maxX) continue;
      if (PL.pos.z + PL.R <= c.minZ || PL.pos.z - PL.R >= c.maxZ) continue;
      if (c.minY < PL.pos.y && c.minY > PL.pos.y - PL.H) {
        PL.pos.y = c.minY - PL.H;
        if (PL.vel.y > 0) PL.vel.y = 0;
      }
    }

    // Kill plane
    if (PL.pos.y < -15) {
      if (playerEntity.alive) killEntity(playerEntity, null);
    }

    // Clear single-frame gamepad button injections
    if (gp) keys['Space'] = false;

    // ── Jump pads ──
    if (PL.onGround) {
      for (const pad of [JUMP_PAD, JUMP_PAD_2]) {
        const dx = PL.pos.x - pad.cx;
        const dz = PL.pos.z - pad.cz;
        const feetY = PL.pos.y - PL.H;
        if (Math.abs(dx) < pad.hw + PL.R &&
            Math.abs(dz) < pad.hd + PL.R &&
            feetY < pad.cy + 0.3) {
          PL.vel.y    = pad.launchVel;
          PL.onGround = false;
          if (State.sliding) { State.sliding = false; State.slideVel.set(0,0,0); }
          break;
        }
      }
    }

    // ── Head bob (suppressed while sliding) ──
    if (isMoving && PL.onGround && !State.sliding) {
      bobPhase += (State.sprinting ? 15 : 9) * dt;
      bobAmt   += (0.045 * (State.sprinting ? 1.6 : 1) - bobAmt) * Math.min(1, 8 * dt);
    } else {
      bobAmt += (0 - bobAmt) * Math.min(1, 8 * dt);
    }

    // ── FOV ──
    fovTgt = State.sliding ? 108 : State.sprinting ? 96 : adsHeld ? 35 : 80;
    fovCur += (fovTgt - fovCur) * Math.min(1, 10 * dt);
    camera.fov = fovCur;
    camera.updateProjectionMatrix();

    // ── Camera roll: lean on slide direction, subtle lean on strafe ──
    // During slide the roll is fixed to the locked travel direction, not WASD input
    const strafe = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);
    rollTgt  = State.sliding
      ? -Math.sign(State.slideVel.dot(rt)) * 0.08
      : strafe * -0.013;
    rollCur += (rollTgt - rollCur) * Math.min(1, 10 * dt);
  }

  // ── Player entity sync ──
  playerEntity.pos.copy(PL.pos);
  if (!playerEntity.alive) {
    deathOverlay.style.display = 'flex';
    deathTitleEl.textContent = deathState.killer
      ? `ELIMINATED BY ${deathState.killer.name.toUpperCase()}`
      : 'ELIMINATED';
    if (deathState.waitTimer > 0) {
      deathState.waitTimer -= dt;
      deathState.canRespawn = false;
      respawnInputQueued = false;
      prevAnyGamepadPressed = anyGamepadPressed(getGamepad());
      respawnTimerEl.textContent = '';
    } else {
      deathState.canRespawn = true;
      respawnTimerEl.textContent = 'Press any key/button to respawn';
      const gpDead = getGamepad();
      const gpPressed = anyGamepadPressed(gpDead);
      if (gpPressed && !prevAnyGamepadPressed) respawnInputQueued = true;
      prevAnyGamepadPressed = gpPressed;
      if (respawnInputQueued) respawnPlayerNow();
    }
  } else {
    prevAnyGamepadPressed = anyGamepadPressed(getGamepad());
  }

  // ── Game timer & intermission ──
  if (GAME.intermission) {
    GAME.intermissionTimer -= dt;
    intermissionOverlay.style.display = 'flex';
    intermissionTimerEl.textContent = `Next round in ${Math.ceil(GAME.intermissionTimer)}s`;
    timerEl.textContent = '0:00';
    if (GAME.intermissionTimer <= 0) {
      GAME.intermission = false;
      GAME.roundTimer = ROUND_TIME;
      GAME.roundNum++;
      intermissionOverlay.style.display = 'none';
      // Reset scores and respawn all
      entities.forEach((e, i) => {
        e.score = 0; e.deaths = 0;
        spawnEntity(e, i);
      });
      clearRagdolls();
      deathState.killer = null;
      deathState.waitTimer = 0;
      deathState.canRespawn = false;
      respawnInputQueued = false;
      PL.pos.copy(playerEntity.pos);
      PL.vel.set(0, 0, 0);
      deathOverlay.style.display = 'none';
    }
  } else {
    GAME.roundTimer -= dt;
    if (GAME.roundTimer <= 0) {
      GAME.roundTimer = 0;
      GAME.intermission = true;
      GAME.intermissionTimer = INTERMISSION_TIME;
    }
    timerEl.textContent = formatTime(GAME.roundTimer);
  }
  updateSpawnProtection(dt);

  // ── Update bots ──
  for (let i = 1; i < entities.length; i++) {
    if (!GAME.intermission) updateBot(entities[i], dt);
  }
  updateRagdolls(dt);

  // ── Killfeed decay ──
  for (let i = killMessages.length - 1; i >= 0; i--) {
    killMessages[i].time -= dt;
    if (killMessages[i].time <= 0.5) killMessages[i].el.style.opacity = killMessages[i].time / 0.5;
    if (killMessages[i].time <= 0) {
      killMessages[i].el.remove();
      killMessages.splice(i, 1);
    }
  }
  if (killToastTimer > 0) {
    killToastTimer -= dt;
    if (killToastTimer <= 0) {
      killToastEl.style.opacity = '0';
    } else if (killToastTimer < 0.25) {
      killToastEl.style.opacity = String(killToastTimer / 0.25);
    } else {
      killToastEl.style.opacity = '1';
    }
  }

  // ── HUD ──
  updateScoreboard();

  // ── Jump pad pulse ──
  const pulse = 0.4 + 0.4 * Math.abs(Math.sin(clock.elapsedTime * 3));
  matJumpPad.emissiveIntensity = pulse;
  matJumpPad2.emissiveIntensity = pulse;
  padLight.intensity = 1.5 + 1.5 * Math.abs(Math.sin(clock.elapsedTime * 3));
  padLight2.intensity = padLight.intensity;

  // ── Reload ring UI ──
  if (GUN.cooldown > 0) {
    reloadRing.style.display = 'block';
    const prog = 1 - GUN.cooldown / GUN.RELOAD;  // 0 → 1 as reload completes
    const R = 26, cx = 32, cy = 32, stroke = 4;
    const TAU = Math.PI * 2;
    rctx.clearRect(0, 0, 64, 64);
    // background track
    rctx.beginPath();
    rctx.arc(cx, cy, R, 0, TAU);
    rctx.strokeStyle = 'rgba(255,255,255,0.15)';
    rctx.lineWidth = stroke;
    rctx.stroke();
    // progress arc — starts at top (-PI/2), sweeps clockwise
    rctx.beginPath();
    rctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * prog);
    rctx.strokeStyle = prog > 0.95 ? '#88ff88' : 'rgba(255,255,255,0.9)';
    rctx.lineWidth = stroke;
    rctx.lineCap = 'round';
    rctx.stroke();
  } else {
    reloadRing.style.display = 'none';
  }

  // ── Gun cooldown + controller right trigger ──
  if (GUN.cooldown > 0) GUN.cooldown -= dt;
  if (locked) {
    const gp2 = getGamepad();
    if (gp2) {
      const rtVal = Math.max(gp2.buttons[7]?.value ?? 0, ((gp2.axes[5] ?? -1) + 1) / 2);
      if (rtVal > 0.1) shoot();
    }
  }

  // ── Camera ──
  if (!playerEntity.alive) {
    fovCur = 80;
    fovTgt = 80;
    if (camera.fov !== 80) {
      camera.fov = 80;
      camera.updateProjectionMatrix();
    }
  }
  const spectatingKiller = !playerEntity.alive && deathState.killer && deathState.killer.alive;
  if (spectatingKiller) {
    const fw = new THREE.Vector3(
      -Math.sin(deathState.killer.yaw),
      0,
      -Math.cos(deathState.killer.yaw)
    );
    const camPos = deathState.killer.pos.clone()
      .addScaledVector(fw, 2.8)
      .add(new THREE.Vector3(0, 0.7, 0));
    const lookAt = deathState.killer.pos.clone().add(new THREE.Vector3(0, 0.2, 0));
    camera.position.copy(camPos);
    camera.rotation.order = 'YXZ';
    camera.lookAt(lookAt);
    camera.rotation.order = 'YXZ';
    camera.rotation.z = 0;
  } else {
    camera.position.copy(PL.pos);
    camera.position.y += Math.sin(bobPhase) * bobAmt;
    camera.rotation.order = 'YXZ';
    camera.rotation.y = PL.yaw;
    camera.rotation.x = PL.pitch;
    camera.rotation.z = rollCur;
  }
  gunGroup.visible = playerEntity.alive;

  // ── Gun animation ──
  GUN.recoil = Math.max(0, GUN.recoil - dt * 7);
  const reloadFrac = GUN.cooldown / GUN.RELOAD;
  const bobSway = Math.sin(bobPhase) * bobAmt * 0.6;
  const bobDip  = Math.abs(Math.sin(bobPhase)) * bobAmt * -0.4;
  const slideOff   = State.sliding ? -0.04 : 0;
  const reloadTilt = reloadFrac * 0.18;

  const adsPos = adsHeld
    ? new THREE.Vector3(0, -0.06, -0.32)   // centered, pulled in tight
    : new THREE.Vector3(GUN.restPos.x + bobSway * 0.015, GUN.restPos.y + bobDip * 0.015 + slideOff, GUN.restPos.z);
  GUN.curPos.x += (adsPos.x                      - GUN.curPos.x) * Math.min(1, 18 * dt);
  GUN.curPos.y += (adsPos.y                      - GUN.curPos.y) * Math.min(1, 18 * dt);
  GUN.curPos.z += (adsPos.z + GUN.recoil * 0.055 - GUN.curPos.z) * Math.min(1, 18 * dt);
  GUN.curRot.x += (-GUN.recoil * 0.018  - GUN.curRot.x) * Math.min(1, 16 * dt);
  GUN.curRot.z += (reloadTilt           - GUN.curRot.z) * Math.min(1, 10 * dt);

  gunGroup.position.copy(GUN.curPos);
  gunGroup.rotation.set(GUN.curRot.x, 0, GUN.curRot.z);

  vmCamera.aspect = camera.aspect;
  vmCamera.updateProjectionMatrix();

  // ── Render ──
  renderer.render(scene, camera);
  renderer.autoClear = false;
  renderer.clearDepth();
  renderer.render(vmScene, vmCamera);
  renderer.autoClear = true;
}

update();
