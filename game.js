import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// ============================================================
// Constants
// ============================================================
const CELL = 4;                // world units per maze cell
const WALL_HEIGHT = 3.4;
const WALL_THICKNESS = 0.25;
const PLAYER_RADIUS = 0.35;
const PLAYER_EYE = 1.6;
const CHUNK_SIZE = 12;         // cells per chunk side
const VIEW_CHUNKS = 2;         // chunks loaded around player in each direction
const WALL_DENSITY = 0.34;     // probability of any given wall existing

// ============================================================
// Deterministic hash so the maze is the same every time you
// visit any given coordinate (true infinite world).
// ============================================================
function hash(x, z, seed) {
  let n = ((x | 0) * 374761393) ^ ((z | 0) * 668265263) ^ ((seed | 0) * 1442695041);
  n = ((n ^ (n >>> 13)) * 1274126177) >>> 0;
  n = (n ^ (n >>> 16)) >>> 0;
  return n / 0xFFFFFFFF;
}
const eastWall  = (x, z) => hash(x, z, 1) < WALL_DENSITY;
const southWall = (x, z) => hash(x, z, 2) < WALL_DENSITY;

// Returns true if a wall blocks travel from (x,z) to neighbour
function wallBetween(x, z, dx, dz) {
  if (dx ===  1) return eastWall(x, z);
  if (dx === -1) return eastWall(x - 1, z);
  if (dz ===  1) return southWall(x, z);
  if (dz === -1) return southWall(x, z - 1);
  return false;
}

// ============================================================
// Procedural textures (canvas)
// ============================================================
function sprinkle(ctx, w, h, count, colorFn) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colorFn(Math.random());
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

function wallpaperTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.0, '#b4a253');
  g.addColorStop(0.5, '#c5b25e');
  g.addColorStop(1.0, '#a89248');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  ctx.globalAlpha = 0.45;
  for (let x = 0; x < 256; x += 8) {
    ctx.fillStyle = x % 16 === 0 ? '#8e7b3a' : '#d4c275';
    ctx.fillRect(x, 0, 1, 256);
  }
  ctx.globalAlpha = 1;
  sprinkle(ctx, 256, 256, 2500, t => `rgba(60,40,10,${t * 0.25})`);
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, r = 20 + Math.random() * 40;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(60,40,10,0.4)');
    grad.addColorStop(1, 'rgba(60,40,10,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function carpetTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#7a5a1a'; ctx.fillRect(0, 0, 256, 256);
  sprinkle(ctx, 256, 256, 8000, t => `rgba(${40 + t*40},${20 + t*30},0,${0.3 + t*0.4})`);
  sprinkle(ctx, 256, 256, 3000, t => `rgba(${120 + t*60},${90 + t*40},${30 + t*30},${0.2 + t*0.3})`);
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, r = 30 + Math.random() * 50;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(20,10,0,0.55)');
    grad.addColorStop(1, 'rgba(20,10,0,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function ceilingTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8e0c0'; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#9d9474'; ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 128, 128);
  ctx.strokeRect(128, 0, 128, 128);
  ctx.strokeRect(0, 128, 128, 128);
  ctx.strokeRect(128, 128, 128, 128);
  sprinkle(ctx, 256, 256, 1200, t => `rgba(120,100,60,${t * 0.2})`);
  ctx.fillStyle = 'rgba(255,250,200,0.5)';
  ctx.fillRect(40, 40, 48, 48);
  ctx.fillRect(168, 168, 48, 48);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

// ============================================================
// Shared materials
// ============================================================
const wallTex = wallpaperTexture();
const floorTex = carpetTexture();
floorTex.repeat.set(CHUNK_SIZE * CELL / 2, CHUNK_SIZE * CELL / 2);
const ceilTex = ceilingTexture();
ceilTex.repeat.set(CHUNK_SIZE * CELL / 4, CHUNK_SIZE * CELL / 4);

const wallMat  = new THREE.MeshLambertMaterial({ map: wallTex });
const floorMat = new THREE.MeshLambertMaterial({ map: floorTex });
const ceilMat  = new THREE.MeshLambertMaterial({ map: ceilTex });

// Reusable geometries
const wallGeoEast  = new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, CELL + WALL_THICKNESS);
const wallGeoSouth = new THREE.BoxGeometry(CELL + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS);
const planeGeo = (() => { const g = new THREE.PlaneGeometry(CHUNK_SIZE * CELL, CHUNK_SIZE * CELL); return g; })();

// ============================================================
// Three.js setup
// ============================================================
const scene = new THREE.Scene();
const FOG_COLOR = 0xb09a4a;
scene.background = new THREE.Color(FOG_COLOR);
scene.fog = new THREE.Fog(FOG_COLOR, 8, 38);

const camera = new THREE.PerspectiveCamera(78, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(CELL / 2, PLAYER_EYE, CELL / 2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

scene.add(new THREE.AmbientLight(0xfff3c0, 0.45));

const flicker = new THREE.PointLight(0xfff3c0, 1.3, 22, 1.5);
flicker.position.set(camera.position.x, WALL_HEIGHT - 0.2, camera.position.z);
scene.add(flicker);

// ============================================================
// Controls
// ============================================================
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());

const keys = {};
document.addEventListener('keydown', e => { keys[e.code] = true; });
document.addEventListener('keyup',   e => { keys[e.code] = false; });

const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');
startBtn.addEventListener('click', () => controls.lock());
controls.addEventListener('lock', () => { menu.style.display = 'none'; });
controls.addEventListener('unlock', () => {
  if (gameOver) return;
  menu.style.display = 'flex';
  document.querySelector('#menu h1').textContent = 'PAUSED';
  document.querySelector('#menu .sub').textContent = '— BREATHE —';
  startBtn.textContent = 'RESUME';
});

// ============================================================
// Chunk management (infinite world)
// ============================================================
const chunks = new Map();
const chunkKey = (cx, cz) => cx + ',' + cz;

function buildChunk(cx, cz) {
  const group = new THREE.Group();
  const size = CHUNK_SIZE * CELL;
  const baseX = cx * size, baseZ = cz * size;

  const floor = new THREE.Mesh(planeGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(baseX + size / 2, 0, baseZ + size / 2);
  group.add(floor);

  const ceil = new THREE.Mesh(planeGeo, ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(baseX + size / 2, WALL_HEIGHT, baseZ + size / 2);
  group.add(ceil);

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const gx = cx * CHUNK_SIZE + lx;
      const gz = cz * CHUNK_SIZE + lz;
      if (eastWall(gx, gz)) {
        const m = new THREE.Mesh(wallGeoEast, wallMat);
        m.position.set((gx + 1) * CELL, WALL_HEIGHT / 2, gz * CELL + CELL / 2);
        group.add(m);
      }
      if (southWall(gx, gz)) {
        const m = new THREE.Mesh(wallGeoSouth, wallMat);
        m.position.set(gx * CELL + CELL / 2, WALL_HEIGHT / 2, (gz + 1) * CELL);
        group.add(m);
      }
    }
  }
  return group;
}

function loadChunk(cx, cz) {
  const key = chunkKey(cx, cz);
  if (chunks.has(key)) return;
  const group = buildChunk(cx, cz);
  scene.add(group);
  chunks.set(key, group);
}

function unloadChunk(key) {
  const group = chunks.get(key);
  if (!group) return;
  scene.remove(group);
  chunks.delete(key);
}

function updateChunks() {
  const size = CHUNK_SIZE * CELL;
  const ccx = Math.floor(camera.position.x / size);
  const ccz = Math.floor(camera.position.z / size);
  const needed = new Set();
  for (let dx = -VIEW_CHUNKS; dx <= VIEW_CHUNKS; dx++) {
    for (let dz = -VIEW_CHUNKS; dz <= VIEW_CHUNKS; dz++) {
      const k = chunkKey(ccx + dx, ccz + dz);
      needed.add(k);
      loadChunk(ccx + dx, ccz + dz);
    }
  }
  for (const k of [...chunks.keys()]) {
    if (!needed.has(k)) unloadChunk(k);
  }
}

// ============================================================
// Collision
// ============================================================
function nearbyWalls(px, pz) {
  const cx = Math.floor(px / CELL), cz = Math.floor(pz / CELL);
  const walls = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const x = cx + dx, z = cz + dz;
      if (eastWall(x, z)) {
        walls.push({
          ax: (x + 1) * CELL, az: z * CELL,
          bx: (x + 1) * CELL, bz: (z + 1) * CELL,
        });
      }
      if (southWall(x, z)) {
        walls.push({
          ax: x * CELL,       az: (z + 1) * CELL,
          bx: (x + 1) * CELL, bz: (z + 1) * CELL,
        });
      }
    }
  }
  return walls;
}

function resolveCollision(px, pz) {
  const r = PLAYER_RADIUS + WALL_THICKNESS / 2;
  for (let iter = 0; iter < 3; iter++) {
    const walls = nearbyWalls(px, pz);
    let moved = false;
    for (const w of walls) {
      const dxs = w.bx - w.ax, dzs = w.bz - w.az;
      const len2 = dxs * dxs + dzs * dzs;
      let t = ((px - w.ax) * dxs + (pz - w.az) * dzs) / len2;
      t = Math.max(0, Math.min(1, t));
      const cx = w.ax + t * dxs, cz = w.az + t * dzs;
      const dx = px - cx, dz = pz - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-8) {
          const d = Math.sqrt(d2);
          px += (dx / d) * (r - d);
          pz += (dz / d) * (r - d);
        } else {
          // perpendicular push
          const len = Math.sqrt(len2);
          px += -dzs / len * r;
          pz +=  dxs / len * r;
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
  return [px, pz];
}

// ============================================================
// The Entity
// ============================================================
const entity = (() => {
  const group = new THREE.Group();
  const dark = new THREE.MeshBasicMaterial({ color: 0x060606 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 2.2, 10), dark);
  body.position.y = 1.1; group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), dark);
  head.position.y = 2.35; group.add(head);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2010 });
  const eyeGeo = new THREE.SphereGeometry(0.055, 6, 6);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.11, 2.40, 0.30); group.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set( 0.11, 2.40, 0.30); group.add(eyeR);

  const glow = new THREE.PointLight(0xff1010, 0.6, 4, 2);
  glow.position.set(0, 2.4, 0.3); group.add(glow);

  group.visible = false;
  scene.add(group);
  return {
    group, alive: false, speed: 2.5, sinceSpawn: 0,
    cellTarget: null,  // [gx, gz] cell currently moving toward
  };
})();

function spawnEntity() {
  const angle = Math.random() * Math.PI * 2;
  const dist = (8 + Math.random() * 6) * CELL;
  const sx = camera.position.x + Math.cos(angle) * dist;
  const sz = camera.position.z + Math.sin(angle) * dist;
  // Snap to cell center
  const gx = Math.floor(sx / CELL), gz = Math.floor(sz / CELL);
  entity.group.position.set(gx * CELL + CELL / 2, 0, gz * CELL + CELL / 2);
  entity.alive = true;
  entity.group.visible = true;
  entity.sinceSpawn = 0;
  entity.cellTarget = null;
}

function despawnEntity() {
  entity.alive = false;
  entity.group.visible = false;
}

function updateEntity(dt) {
  if (!entity.alive) return;
  entity.sinceSpawn += dt;

  const mx = entity.group.position.x, mz = entity.group.position.z;
  const playerDist = Math.hypot(camera.position.x - mx, camera.position.z - mz);

  if (playerDist > 32 && entity.sinceSpawn > 6) { despawnEntity(); return; }

  const myCell = [Math.floor(mx / CELL), Math.floor(mz / CELL)];

  // Pick / refresh target cell when reached or none
  if (!entity.cellTarget) {
    let best = null, bestScore = Infinity;
    for (const [ddx, ddz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      if (wallBetween(myCell[0], myCell[1], ddx, ddz)) continue;
      const nx = myCell[0] + ddx, nz = myCell[1] + ddz;
      const cx = nx * CELL + CELL / 2, cz = nz * CELL + CELL / 2;
      const score = Math.hypot(cx - camera.position.x, cz - camera.position.z);
      if (score < bestScore) { bestScore = score; best = [nx, nz]; }
    }
    entity.cellTarget = best || [myCell[0], myCell[1]];
  }

  const tx = entity.cellTarget[0] * CELL + CELL / 2;
  const tz = entity.cellTarget[1] * CELL + CELL / 2;
  const dx = tx - mx, dz = tz - mz;
  const tlen = Math.hypot(dx, dz);
  const speed = entity.speed * (playerDist < 8 ? 1.5 : 1);
  if (tlen < 0.05) {
    entity.cellTarget = null;
  } else {
    const step = Math.min(speed * dt, tlen);
    entity.group.position.x += (dx / tlen) * step;
    entity.group.position.z += (dz / tlen) * step;
  }

  entity.group.lookAt(camera.position.x, entity.group.position.y + 2.35, camera.position.z);

  if (playerDist < 1.0) damagePlayer(70 * dt);
}

// ============================================================
// Game state
// ============================================================
let health = 100, sanity = 100;
let gameOver = false;
let timeAlive = 0;
let spawnTimer = 18;
let heardSubtitleShown = false;

function damagePlayer(amount) {
  health = Math.max(0, health - amount);
  if (health <= 0 && !gameOver) triggerGameOver();
}

function triggerGameOver() {
  gameOver = true;
  controls.unlock();
  document.querySelector('#menu h1').textContent = 'YOU DIED';
  document.querySelector('#menu .sub').textContent = '— IT FOUND YOU —';
  document.querySelector('#menu p').innerHTML =
    `You wandered the Backrooms for <b>${Math.floor(timeAlive)}</b> seconds<br>before reality finished consuming you.`;
  // Remove the second/third paragraphs
  const ps = document.querySelectorAll('#menu p');
  for (let i = 1; i < ps.length; i++) ps[i].style.display = 'none';
  document.querySelector('#menu .keys').style.display = 'none';
  startBtn.textContent = 'TRY AGAIN';
  startBtn.onclick = () => location.reload();
  menu.style.display = 'flex';
}

function showSubtitle(text, ms = 3500) {
  const el = document.getElementById('subtitle');
  el.textContent = text;
  el.style.opacity = 1;
  clearTimeout(showSubtitle._t);
  showSubtitle._t = setTimeout(() => { el.style.opacity = 0; }, ms);
}

// ============================================================
// Main loop
// ============================================================
const _forward = new THREE.Vector3();
const _right   = new THREE.Vector3();
let lastTime = performance.now();
let flickerPhase = 0;

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (controls.isLocked && !gameOver) {
    timeAlive += dt;

    const wf = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
    const wr = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
    let mlen = Math.hypot(wf, wr);
    const sprint = (keys['ShiftLeft'] || keys['ShiftRight']) ? 1.7 : 1;
    const speed = 3.4 * sprint;

    if (mlen > 0) {
      const fx = wf / mlen, fy = wr / mlen;
      camera.getWorldDirection(_forward);
      _forward.y = 0; _forward.normalize();
      _right.set(-_forward.z, 0, _forward.x);   // right of camera

      const obj = controls.getObject();
      const dx = (_forward.x * fx + _right.x * fy) * speed * dt;
      const dz = (_forward.z * fx + _right.z * fy) * speed * dt;
      const nx = obj.position.x + dx;
      const nz = obj.position.z + dz;
      const [rx, rz] = resolveCollision(nx, nz);
      obj.position.x = rx;
      obj.position.z = rz;
    }
    controls.getObject().position.y = PLAYER_EYE;

    updateChunks();

    // Entity spawn cadence
    spawnTimer -= dt;
    if (spawnTimer <= 0 && !entity.alive) {
      if (Math.random() < 0.6) {
        spawnEntity();
        if (!heardSubtitleShown) {
          showSubtitle('You hear footsteps in the distance...');
          heardSubtitleShown = true;
        } else {
          showSubtitle('Something is moving.');
        }
      }
      spawnTimer = 12 + Math.random() * 18;
    }
    updateEntity(dt);

    // Sanity dynamics
    if (entity.alive) {
      const d = camera.position.distanceTo(entity.group.position);
      if (d < 15) sanity = Math.max(0, sanity - (15 - d) * dt * 1.6);
    } else {
      sanity = Math.min(100, sanity + dt * 2.5);
    }
    if (sanity < 20) damagePlayer(dt * 5);
    if (health < 100 && !entity.alive) health = Math.min(100, health + dt * 1.5);

    // Light
    const obj = controls.getObject();
    flicker.position.set(obj.position.x, WALL_HEIGHT - 0.2, obj.position.z);
    flickerPhase += dt;
    flicker.intensity = 1.1 + Math.sin(flickerPhase * 17) * 0.12 + (Math.random() < 0.015 ? -0.55 : 0);

    // HUD
    document.getElementById('coords').textContent =
      `pos ${Math.floor(obj.position.x / CELL)}, ${Math.floor(obj.position.z / CELL)}   ·   survived ${Math.floor(timeAlive)}s`;
    document.getElementById('health-fill').style.width = health + '%';
    document.getElementById('sanity-fill').style.width = sanity + '%';

    const v = 0.5 + (1 - sanity / 100) * 0.5 + (1 - health / 100) * 0.4;
    document.getElementById('vignette').style.boxShadow =
      `inset 0 0 ${180 + v * 220}px ${50 + v * 100}px rgba(0,0,0,${0.55 + v * 0.35})`;
  }

  renderer.render(scene, camera);
}

updateChunks();
requestAnimationFrame(animate);
