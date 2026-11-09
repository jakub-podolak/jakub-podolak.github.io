// 3D background: a wireframe "loss landscape" with a ball doing gradient
// descent on it. Rendered on a fixed canvas behind the page content.
//
// Disable on a single page with `background_3d: false` in its front matter,
// or site-wide with `background_3d: false` in _config.yml.

import * as THREE from "./lib/three.module.min.js";

const CONFIG = {
  size: 44,             // world-space width/depth of the landscape
  segments: 64,         // grid resolution (lines per axis)
  lineColor: 0x000000,
  lineOpacity: 0.16,    // keep low so text stays readable
  ballColor: 0xffff00,  // matches the yellow nav highlight
  bgColor: 0xffffff,    // fog fades distant lines into the page background
  orbitSpeed: 0.025,    // camera orbit, radians per second
  learningRate: 0.035,
  momentum: 0.92,
  trailLength: 400,
};

// The "loss" surface: a gentle bowl with a few basins and ripples.
function loss(x, z) {
  return (
    1.1 * Math.sin(0.33 * x) * Math.cos(0.29 * z) +
    0.35 * Math.sin(0.9 * x + 0.4 * z) -
    2.6 * Math.exp(-((x - 6) ** 2 + (z + 4) ** 2) / 18) -
    1.9 * Math.exp(-((x + 7) ** 2 + (z - 6) ** 2) / 14) -
    1.4 * Math.exp(-((x + 2) ** 2 + (z + 10) ** 2) / 10) +
    0.0045 * (x * x + z * z)
  );
}

function grad(x, z) {
  const h = 1e-3;
  return [
    (loss(x + h, z) - loss(x - h, z)) / (2 * h),
    (loss(x, z + h) - loss(x, z - h)) / (2 * h),
  ];
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {
    return false;
  }
}

function buildGrid() {
  const { size, segments } = CONFIG;
  const half = size / 2;
  const step = size / segments;
  const positions = [];
  // Lines along X and along Z (no triangle diagonals, unlike WireframeGeometry).
  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j < segments; j++) {
      const a = -half + i * step;
      const b0 = -half + j * step;
      const b1 = b0 + step;
      positions.push(a, loss(a, b0), b0, a, loss(a, b1), b1);
      positions.push(b0, loss(b0, a), a, b1, loss(b1, a), a);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color: CONFIG.lineColor,
    transparent: true,
    opacity: CONFIG.lineOpacity,
    depthWrite: false,
  });
  return new THREE.LineSegments(geo, mat);
}

function buildBall() {
  const group = new THREE.Group();
  const r = 0.3;
  const fill = new THREE.Mesh(
    new THREE.SphereGeometry(r, 24, 16),
    new THREE.MeshBasicMaterial({ color: CONFIG.ballColor })
  );
  // Black outline: a slightly larger back-face sphere behind the fill.
  const outline = new THREE.Mesh(
    new THREE.SphereGeometry(r * 1.22, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide })
  );
  group.add(outline, fill);
  return group;
}

function buildTrail() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(CONFIG.trailLength * 3), 3)
  );
  geo.setDrawRange(0, 0);
  const mat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 });
  return new THREE.Line(geo, mat);
}

function init() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.createElement("canvas");
  canvas.id = "bg3d";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(CONFIG.bgColor, 18, 52);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);

  scene.add(buildGrid());
  const ball = buildBall();
  const trail = buildTrail();
  scene.add(ball, trail);

  // --- gradient descent state ---
  const lim = CONFIG.size / 2 - 2;
  let px, pz, vx, vz, still, trailCount;
  function respawn() {
    px = (Math.random() * 2 - 1) * lim * 0.9;
    pz = (Math.random() * 2 - 1) * lim * 0.9;
    vx = vz = 0;
    still = 0;
    trailCount = 0;
    trail.geometry.setDrawRange(0, 0);
  }
  respawn();

  function stepDescent(k) {
    const [gx, gz] = grad(px, pz);
    vx = CONFIG.momentum * vx - CONFIG.learningRate * gx * k;
    vz = CONFIG.momentum * vz - CONFIG.learningRate * gz * k;
    px += vx * k;
    pz += vz * k;
    if (Math.abs(px) > lim || Math.abs(pz) > lim) return respawn();
    // Converged: linger in the minimum for a bit, then start a new run.
    if (Math.hypot(vx, vz) < 0.004) still += k;
    else still = 0;
    if (still > 150) return respawn();

    const y = loss(px, pz) + 0.3;
    ball.position.set(px, y, pz);
    const pos = trail.geometry.attributes.position;
    if (trailCount < CONFIG.trailLength) {
      pos.setXYZ(trailCount++, px, y - 0.2, pz);
    } else {
      pos.array.copyWithin(0, 3);
      pos.setXYZ(CONFIG.trailLength - 1, px, y - 0.2, pz);
    }
    pos.needsUpdate = true;
    trail.geometry.setDrawRange(0, trailCount);
  }

  // --- camera: slow orbit plus a little mouse parallax ---
  let mx = 0, my = 0, smx = 0, smy = 0;
  let radius = 30;
  window.addEventListener("pointermove", (e) => {
    mx = e.clientX / window.innerWidth - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  function placeCamera(t) {
    smx += (mx - smx) * 0.04;
    smy += (my - smy) * 0.04;
    const angle = t * CONFIG.orbitSpeed + smx * 0.6;
    camera.position.set(Math.cos(angle) * radius, 13 + smy * 4, Math.sin(angle) * radius);
    camera.lookAt(0, -1, 0);
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Portrait screens have a narrow horizontal view: back the camera off
    // so the landscape doesn't fill the screen up close.
    radius = 30 / Math.pow(Math.min(camera.aspect, 1), 0.6);
    scene.fog.near = radius - 12;
    scene.fog.far = radius + 22;
  }
  window.addEventListener("resize", resize);
  resize();

  if (reduceMotion) {
    // Static frame: show a finished descent run, no animation.
    for (let i = 0; i < 300; i++) stepDescent(1);
    placeCamera(0);
    renderer.render(scene, camera);
    window.addEventListener("resize", () => renderer.render(scene, camera));
    return;
  }

  let last = performance.now();
  let elapsed = 0;
  let running = true;
  function frame(now) {
    if (!running) return;
    const dtMs = Math.min(now - last, 50); // clamp after tab switches / hitches
    last = now;
    elapsed += dtMs / 1000;
    stepDescent(dtMs / 16.67);
    placeCamera(elapsed);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Don't burn battery when the tab isn't visible.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
  });
}

if (hasWebGL()) init();
