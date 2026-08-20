import { hasWebGL, prefersReducedMotion, capDpr, loadThree } from "./webgl.js";

const canvas = document.getElementById("core");
if (!canvas) {
  // nothing
} else if (!hasWebGL() || prefersReducedMotion()) {
  canvas.style.display = "none";
} else {
  boot();
}

async function boot() {
  const THREE = await loadThree();
  if (!THREE) {
    canvas.style.display = "none";
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(capDpr());
  renderer.setClearColor(0x050508, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050508, 0.045);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.position.set(0.6, 0.35, 7.2);
  let coreX = 0;

  const key = new THREE.PointLight(0x9b5cff, 18, 24);
  key.position.set(4, 2, 4);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0x4de1ff, 0.25));
  const fill = new THREE.PointLight(0xd6ff3f, 6, 16);
  fill.position.set(-3, -1, 3);
  scene.add(fill);

  const nucleusMat = new THREE.MeshStandardMaterial({
    color: 0x101018,
    emissive: 0x4de1ff,
    emissiveIntensity: 1.4,
    roughness: 0.25,
    metalness: 0.7,
  });
  const nucleus = new THREE.Mesh(new THREE.TorusKnotGeometry(1.15, 0.32, 128, 18), nucleusMat);
  scene.add(nucleus);

  const crew = [0xd6ff3f, 0xff2d8a, 0x9b5cff, 0x4de1ff, 0x00ffa8, 0xffb020];
  const nodes = crew.map((hex, i) => {
    const m = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.18, 0),
      new THREE.MeshStandardMaterial({
        color: hex,
        emissive: hex,
        emissiveIntensity: 2.2,
        roughness: 0.4,
      })
    );
    m.userData.phase = (i / 6) * Math.PI * 2;
    scene.add(m);
    return m;
  });

  const pointer = { x: 0.3, y: 0.1 };
  window.addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    coreX = window.innerWidth >= 900 ? 2.4 : 0;
    nucleus.position.x = coreX;
  }
  resize();
  window.addEventListener("resize", resize);

  let t0 = performance.now();
  let hidden = false;
  document.addEventListener("visibilitychange", () => { hidden = document.hidden; });

  function tick(now) {
    requestAnimationFrame(tick);
    if (hidden) return;
    const t = (now - t0) / 1000;
    nucleus.rotation.x = t * 0.22;
    nucleus.rotation.y = t * 0.31;
    nodes.forEach((n, i) => {
      const a = n.userData.phase + t * 0.55;
      const r = 2.35 + Math.sin(t * 0.7 + i) * 0.12;
      n.position.set(coreX + Math.cos(a) * r, Math.sin(a * 0.9) * 1.05, Math.sin(a) * r * 0.55);
    });
    key.position.set(3.5 + pointer.x * 2.5, 1.5 + pointer.y * 2, 4);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
}
