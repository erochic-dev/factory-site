import { hasWebGL, capDpr, loadThree } from "./webgl.js";

const canvas = document.getElementById("game");
const boot = document.getElementById("boot");
const winEl = document.getElementById("win");
const loseEl = document.getElementById("lose");
const noEl = document.getElementById("nowebgl");
const runBtn = document.getElementById("runBtn");
const runWrap = document.getElementById("runWrap");
const ideasEl = document.getElementById("ideas");
const hitsEl = document.getElementById("hits");
const retry = document.getElementById("retry");

if (!hasWebGL()) {
  boot.classList.add("hidden");
  noEl.classList.remove("hidden");
} else {
  window.setTimeout(() => boot.classList.add("hidden"), 1200);
  bootGame();
}

async function bootGame() {
  const THREE = await loadThree();
  if (!THREE) {
    boot.classList.add("hidden");
    noEl.classList.remove("hidden");
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(capDpr());
  renderer.setClearColor(0x050508, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050508, 8, 42);

  const camera = new THREE.OrthographicCamera(-8, 8, 12, -4, 0.1, 80);
  camera.position.set(0, 13, 10);
  camera.lookAt(0, 0, -5);
  camera.rotation.z = 0;

  scene.add(new THREE.AmbientLight(0x4de1ff, 0.35));
  const lamp = new THREE.PointLight(0x9b5cff, 30, 40);
  lamp.position.set(0, 8, 2);
  scene.add(lamp);

  const railMat = new THREE.MeshStandardMaterial({
    color: 0x4de1ff,
    emissive: 0x4de1ff,
    emissiveIntensity: 1.6,
    roughness: 0.3,
  });
  const railMat2 = new THREE.MeshStandardMaterial({
    color: 0xd6ff3f,
    emissive: 0xd6ff3f,
    emissiveIntensity: 0.9,
    roughness: 0.4,
  });
  [-3.2, 3.2].forEach((x, i) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 70), i ? railMat2 : railMat);
    rail.position.set(x, 0, -20);
    scene.add(rail);
  });
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 70),
    new THREE.MeshStandardMaterial({ color: 0x0b0b12, emissive: 0x101018, emissiveIntensity: 0.4, roughness: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.06, -20);
  scene.add(floor);

  const lanes = [-2, 0, 2];
  const player = new THREE.Group();
  const craft = new THREE.Mesh(
    new THREE.ConeGeometry(0.85, 1.6, 3),
    new THREE.MeshBasicMaterial({ color: 0xd6ff3f })
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.08, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0x00ffa8 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  craft.position.y = 0.8;
  player.add(craft);
  player.add(ring);
  player.position.set(0, 0, 1.2);
  scene.add(player);
  const beacon = new THREE.PointLight(0xd6ff3f, 12, 8);
  beacon.position.set(0, 1.2, 1.2);
  scene.add(beacon);

  const ideaGeo = new THREE.OctahedronGeometry(0.42, 0);
  const ideaMat = new THREE.MeshStandardMaterial({
    color: 0x9b5cff,
    emissive: 0x9b5cff,
    emissiveIntensity: 2.4,
  });
  const hitGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
  const hitMat = new THREE.MeshStandardMaterial({
    color: 0xff2d8a,
    emissive: 0xff2d8a,
    emissiveIntensity: 2.1,
  });

  let lane = 1;
  let targetX = 0;
  let ideas = 0;
  let hits = 0;
  let running = false;
  let ended = false;
  let spawnAcc = 0;
  let speed = 10;
  const objs = [];
  let hidden = false;
  document.addEventListener("visibilitychange", () => { hidden = document.hidden; });

  function setLane(n) {
    lane = Math.max(0, Math.min(2, n));
    targetX = lanes[lane];
  }
  function left() { if (running) setLane(lane - 1); }
  function right() { if (running) setLane(lane + 1); }

  window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") { e.preventDefault(); left(); }
    if (e.code === "ArrowRight" || e.code === "KeyD") { e.preventDefault(); right(); }
    if ((e.code === "ArrowUp" || e.code === "KeyW") && !running && !ended) start();
  });
  document.getElementById("tapL").addEventListener("pointerdown", (e) => { e.preventDefault(); if (!running && !ended) start(); left(); });
  document.getElementById("tapR").addEventListener("pointerdown", (e) => { e.preventDefault(); if (!running && !ended) start(); right(); });
  runBtn.addEventListener("click", start);
  retry.addEventListener("click", () => { reset(); start(); });

  function hud() {
    ideasEl.textContent = String(ideas);
    hitsEl.textContent = String(hits);
  }

  function spawn() {
    const isIdea = Math.random() < 0.58;
    const mesh = new THREE.Mesh(isIdea ? ideaGeo : hitGeo, isIdea ? ideaMat : hitMat);
    const ln = (Math.random() * 3) | 0;
    mesh.position.set(lanes[ln], 0.45, -28);
    mesh.userData = { idea: isIdea, lane: ln, hit: false };
    scene.add(mesh);
    objs.push(mesh);
  }

  function clearObjs() {
    while (objs.length) {
      const o = objs.pop();
      scene.remove(o);
    }
  }

  function reset() {
    ended = false;
    running = false;
    ideas = 0;
    hits = 0;
    speed = 10;
    spawnAcc = 0;
    setLane(1);
    player.position.x = 0;
    player.position.z = 1.2;
    winEl.classList.add("hidden");
    loseEl.classList.add("hidden");
    runWrap.classList.remove("hidden");
    clearObjs();
    hud();
  }

  function finish(win) {
    ended = true;
    running = false;
    runWrap.classList.add("hidden");
    if (win) winEl.classList.remove("hidden");
    else loseEl.classList.remove("hidden");
  }

  function start() {
    if (ended) reset();
    if (running) return;
    running = true;
    runWrap.classList.add("hidden");
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    const viewH = 16;
    const viewW = viewH * aspect;
    camera.left = -viewW / 2;
    camera.right = viewW / 2;
    camera.top = viewH / 2 + 2;
    camera.bottom = -viewH / 2 + 4;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  let last = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (hidden) return;
    player.position.x += (targetX - player.position.x) * Math.min(1, dt * 14);
    player.rotation.z = (targetX - player.position.x) * 0.15;
    beacon.position.x = player.position.x;
    beacon.position.z = player.position.z;
    if (!running) {
      renderer.render(scene, camera);
      return;
    }
    speed = Math.min(18, speed + dt * 0.35);
    spawnAcc += dt;
    if (spawnAcc > 0.62) {
      spawnAcc = 0;
      spawn();
    }
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i];
      o.position.z += speed * dt;
      o.rotation.y += dt * (o.userData.idea ? 3 : 1.2);
      if (!o.userData.hit && o.position.z > 1.4 && o.position.z < 3.1 && o.userData.lane === lane) {
        o.userData.hit = true;
        scene.remove(o);
        objs.splice(i, 1);
        if (o.userData.idea) {
          ideas += 1;
          hud();
          if (ideas >= 7) finish(true);
        } else {
          hits += 1;
          hud();
          if (hits >= 3) finish(false);
        }
        continue;
      }
      if (o.position.z > 10) {
        scene.remove(o);
        objs.splice(i, 1);
      }
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
}
