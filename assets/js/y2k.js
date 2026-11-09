import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const root = document.documentElement;
const baseTheme = root.dataset.theme;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================================
   BACKGROUND LAYERS - 3D scene, grid, soft blobs
   ============================================ */

const bg = document.createElement("div");
bg.className = "y2k-bg";
bg.setAttribute("aria-hidden", "true");
bg.innerHTML =
  '<canvas class="y2k-arm"></canvas>' +
  '<div class="y2k-grid"></div>' +
  '<div class="y2k-blob y2k-blob--1"></div>' +
  '<div class="y2k-blob y2k-blob--2"></div>' +
  '<div class="y2k-blob y2k-blob--3"></div>';
document.body.prepend(bg);

/* ============================================
   MENU HOVER - recolor the whole site
   ============================================ */

const topLinks = document.querySelectorAll(".site-nav > .nav-list > .nav-list-item > .nav-list-link");
topLinks.forEach((link) => {
  const theme = window.y2kThemeFor(new URL(link.href).pathname);
  link.dataset.theme = theme;
  link.addEventListener("mouseenter", () => (root.dataset.theme = theme));
  link.addEventListener("focus", () => (root.dataset.theme = theme));
  link.addEventListener("blur", () => (root.dataset.theme = baseTheme));
});
const siteNav = document.querySelector(".site-nav");
if (siteNav) siteNav.addEventListener("mouseleave", () => (root.dataset.theme = baseTheme));

/* ============================================
   THREE.JS ROBOT ARM
   The base stands far back, barely visible in the fog, and a two-link arm
   reaches towards the viewer. Its claw slowly follows the cursor and closes
   while the mouse button is held. When the cursor rests it looks around
   curiously. Its pose is kept in sessionStorage so it carries over between pages.
   ============================================ */

function cssColor(name) {
  return new THREE.Color(getComputedStyle(root).getPropertyValue(name).trim());
}

const canvas = bg.querySelector(".y2k-arm");

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (e) {
  canvas.remove();
}

if (renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(0xffffff, 25, 95);

  const camera = new THREE.PerspectiveCamera(45, 1, 1, 140);
  camera.position.set(0, 0, 18);

  scene.add(new THREE.AmbientLight(0xffffff, 2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-6, 10, 12);
  scene.add(sun);

  /* ---------- materials ---------- */

  // Links are a pale version of the theme tint, joints stronger, cables and edges the full tint.
  const white = new THREE.Color(0xffffff);
  const tint = () => cssColor("--tint");
  const palette = {
    link: () => tint().lerp(white, 0.72),
    joint: () => tint().lerp(white, 0.4),
    cable: () => tint().lerp(white, 0.15),
    edge: tint,
    logo: tint,
  };

  // JP TECH logo, drawn white so the material color can tint it.
  const logoCanvas = document.createElement("canvas");
  logoCanvas.width = 768;
  logoCanvas.height = 256;
  const logoTexture = new THREE.CanvasTexture(logoCanvas);
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.anisotropy = 4;

  function drawLogo() {
    const c = logoCanvas.getContext("2d");
    c.clearRect(0, 0, 768, 256);
    c.strokeStyle = c.fillStyle = "#ffffff";
    c.lineWidth = 8;
    c.beginPath();
    c.roundRect(12, 12, 744, 232, 36);
    c.stroke();
    c.fontStretch = "ultra-expanded";
    c.font = '200 150px "Google Sans Flex", "Helvetica Neue", Arial, sans-serif';
    c.textBaseline = "middle";
    c.fillText("JP", 52, 132);
    c.fillRect(300, 60, 6, 140);
    c.font = '200 64px "Google Sans Flex", "Helvetica Neue", Arial, sans-serif';
    c.fillText("TECH", 340, 104);
    c.fontStretch = "normal";
    c.font = '34px "Space Mono", monospace';
    c.fillText("UNIT-01 // AMS", 342, 180);
    logoTexture.needsUpdate = true;
  }
  drawLogo();
  if (document.fonts) document.fonts.load('200 64px "Google Sans Flex"').then(drawLogo, () => {});

  const flat = { flatShading: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
  const materials = {
    link: new THREE.MeshLambertMaterial({ color: palette.link(), ...flat }),
    joint: new THREE.MeshLambertMaterial({ color: palette.joint(), ...flat }),
    cable: new THREE.MeshLambertMaterial({ color: palette.cable() }),
    edge: new THREE.LineBasicMaterial({ color: palette.edge() }),
    logo: new THREE.MeshBasicMaterial({ color: palette.logo(), map: logoTexture, transparent: true, depthWrite: false }),
  };

  function part(geometry, material = materials.link, edges = materials.edge) {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geometry, material));
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), edges));
    return group;
  }

  // Cylinder lying along X, used as a hinge.
  function hinge(radius, width) {
    const geometry = new THREE.CylinderGeometry(radius, radius, width, 10);
    geometry.rotateZ(Math.PI / 2);
    return part(geometry, materials.joint);
  }

  // Box running from y = 0 to y = length.
  function beam(width, length, depth, material) {
    const geometry = new THREE.BoxGeometry(width, length, depth);
    geometry.translate(0, length / 2, 0);
    return part(geometry, material);
  }

  // Logo decals on both broad faces of a beam, text running along the beam.
  function addLogo(target, length, depth, size, along) {
    [1, -1].forEach((side) => {
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(size * 3, size), materials.logo);
      decal.position.set(0, length * along, side * (depth / 2 + 0.03));
      decal.rotation.set(0, side > 0 ? 0 : Math.PI, Math.PI / 2 * side);
      target.add(decal);
    });
  }

  /* ---------- arm ---------- */

  const UPPER = 50;
  const FORE = 46;
  const basePosition = new THREE.Vector3(28, -24, -62);
  const shoulder = basePosition.clone().add(new THREE.Vector3(0, 4.5, 0));

  const arm = new THREE.Group();
  scene.add(arm);

  const pedestal = part(new THREE.CylinderGeometry(4, 5.5, 3, 8));
  pedestal.position.copy(basePosition);
  const pedestalRing = part(new THREE.CylinderGeometry(5.8, 5.8, 0.6, 16), materials.joint);
  pedestalRing.position.copy(basePosition).add(new THREE.Vector3(0, -1.2, 0));
  const turret = part(new THREE.CylinderGeometry(2.6, 3.2, 3, 8), materials.joint);
  turret.position.copy(basePosition).add(new THREE.Vector3(0, 2.6, 0));

  const shoulderJoint = hinge(2.4, 4.2);
  const shoulderMotor = part(new THREE.BoxGeometry(1.6, 3, 3));
  shoulderMotor.position.x = 2.9;
  shoulderJoint.add(shoulderMotor);

  const upperArm = beam(2.6, UPPER, 2.2);
  addLogo(upperArm, UPPER, 2.2, 2.2, 0.55);
  const upperRib = beam(3, 1.2, 2.6, materials.joint);
  upperRib.position.y = UPPER * 0.2;
  upperArm.add(upperRib);

  const elbowJoint = hinge(1.8, 3.2);
  const elbowMotor = part(new THREE.CylinderGeometry(1.1, 1.1, 1.4, 8), materials.link);
  elbowMotor.rotation.z = Math.PI / 2;
  elbowMotor.position.x = -2.2;
  elbowJoint.add(elbowMotor);

  const foreArm = beam(1.9, FORE, 1.5);
  // Near the wrist, where the depth of field keeps it sharp.
  addLogo(foreArm, FORE, 1.5, 1.7, 0.85);
  const foreRib = beam(2, 0.8, 1.9, materials.joint);
  foreRib.position.y = FORE * 0.93;
  foreArm.add(foreRib);

  arm.add(pedestal, pedestalRing, turret, shoulderJoint, upperArm, elbowJoint, foreArm);

  /* ---------- two-finger industrial gripper ----------
     gripper (at the wrist, +Y = where it points)
       wrist hinge + short wrist link
       head (rolls around +Y for a little head tilt)
         collar, actuator housing with rail, two parallel sliding fingers */

  const GRIPPER_SCALE = 1.0;
  const FINGER_OPEN = 1.15;
  const gripper = new THREE.Group();
  gripper.add(hinge(0.75, 1.7));
  gripper.add(beam(0.9, 1.4, 0.9, materials.link));

  const head = new THREE.Group();
  head.position.y = 1.4;
  const collar = part(new THREE.CylinderGeometry(0.75, 0.75, 0.4, 10), materials.joint);
  collar.position.y = 0.2;
  const housing = part(new THREE.BoxGeometry(2.8, 0.9, 1.2));
  housing.position.y = 0.85;
  const rail = part(new THREE.BoxGeometry(3, 0.18, 0.5), materials.joint);
  rail.position.y = 1.36;
  head.add(collar, housing, rail);

  // Small logo plates on the housing, facing front and back.
  [1, -1].forEach((side) => {
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.7), materials.logo);
    plate.position.set(0, 0.85, side * 0.62);
    plate.rotation.y = side > 0 ? 0 : Math.PI;
    head.add(plate);
  });

  const fingers = [-1, 1].map((side) => {
    const finger = new THREE.Group();
    const carriage = part(new THREE.BoxGeometry(0.5, 0.35, 0.9), materials.joint);
    carriage.position.y = 1.5;
    const jaw = beam(0.3, 1.8, 0.9);
    jaw.position.y = 1.3;
    const pad = part(new THREE.BoxGeometry(0.1, 0.8, 0.7), materials.joint);
    pad.position.set(-side * 0.2, 2.65, 0);
    finger.add(carriage, jaw, pad);
    finger.userData.side = side;
    finger.position.x = side * FINGER_OPEN;
    head.add(finger);
    return finger;
  });

  gripper.add(head);
  gripper.scale.setScalar(GRIPPER_SCALE);
  arm.add(gripper);

  // Distance from the wrist to the middle of the jaws, in world units.
  const CLAW_REACH = (1.4 + 2.35) * GRIPPER_SCALE;
  const FINGER_CLOSED = 0.3;

  /* ---------- cables ---------- */

  const cables = [
    { side: 1.7, sag: 2.6, radius: 0.32, mesh: new THREE.Mesh(undefined, materials.cable) },
    { side: -1.5, sag: 1.8, radius: 0.24, mesh: new THREE.Mesh(undefined, materials.cable) },
  ];
  cables.forEach((cable) => arm.add(cable.mesh));

  /* ---------- gears ----------
     Three meshing spur gears in the top-left corner, faint and turning slowly.
     They live in their own scene, drawn after the depth-of-field pass so they stay crisp. */

  const gearScene = new THREE.Scene();
  gearScene.fog = scene.fog;
  gearScene.add(new THREE.AmbientLight(0xffffff, 2), sun.clone());

  const gearMaterial = new THREE.MeshLambertMaterial({ color: palette.link(), transparent: true, opacity: 0.6, ...flat });
  const gearEdges = new THREE.LineBasicMaterial({ color: palette.edge(), transparent: true, opacity: 0.5 });

  // Pitch radius is proportional to tooth count so neighbouring gears mesh.
  function makeGear(teeth) {
    const radius = teeth * 0.2;
    const step = (Math.PI * 2) / teeth;
    const shape = new THREE.Shape();
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      const at = (angle, r) => [Math.cos(angle) * r, Math.sin(angle) * r];
      [[a, radius - 0.3], [a + step * 0.15, radius + 0.3], [a + step * 0.45, radius + 0.3], [a + step * 0.6, radius - 0.3]]
        .forEach(([angle, r], k) => (i === 0 && k === 0 ? shape.moveTo(...at(angle, r)) : shape.lineTo(...at(angle, r))));
    }
    const hole = (x, y, r) => {
      const path = new THREE.Path();
      path.absarc(x, y, r, 0, Math.PI * 2, true);
      shape.holes.push(path);
    };
    hole(0, 0, radius * 0.18);
    if (teeth > 8) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        hole(Math.cos(a) * radius * 0.55, Math.sin(a) * radius * 0.55, radius * 0.17);
      }
    }
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false, curveSegments: 8 });
    geometry.translate(0, 0, -0.25);
    const gear = part(geometry, gearMaterial, gearEdges);
    const hubGeometry = new THREE.CylinderGeometry(radius * 0.3, radius * 0.3, 0.9, 12);
    hubGeometry.rotateX(Math.PI / 2);
    gear.add(part(hubGeometry, gearMaterial, gearEdges));
    gear.userData.ratio = 16 / teeth;
    return gear;
  }

  const gears = new THREE.Group();
  const gearA = makeGear(16);
  const gearB = makeGear(10);
  gearB.position.set(4.26, -2.98, 0);
  gearB.userData.phase = Math.PI / 10;
  const gearC = makeGear(7);
  gearC.position.set(-1.57, -4.32, 0);
  gearC.userData.phase = Math.PI / 7;
  gears.add(gearA, gearB, gearC);
  gears.rotation.set(-0.25, 0.45, 0);
  // Pushed back into the fog and scaled up so they still fill the corner.
  gears.scale.setScalar(2);
  gearScene.add(gears);
  const GEARS_DEPTH = -40;

  function turnGears(t) {
    const spin = (t * Math.PI * 2) / 180;
    gearA.rotation.z = spin;
    gearB.rotation.z = -spin * gearB.userData.ratio + gearB.userData.phase;
    gearC.rotation.z = -spin * gearC.userData.ratio + gearC.userData.phase;
  }

  /* ---------- kinematics ---------- */

  const basis = new THREE.Matrix4();
  const xAxis = new THREE.Vector3();
  const zAxis = new THREE.Vector3();

  // Place an object at `at` with its +Y along `dir` and +X along `axis` (made perpendicular to dir).
  function orient(object, at, dir, axis) {
    xAxis.copy(axis).addScaledVector(dir, -axis.dot(dir));
    if (xAxis.lengthSq() < 1e-6) xAxis.set(1, 0, 0);
    xAxis.normalize();
    zAxis.crossVectors(xAxis, dir);
    basis.makeBasis(xAxis, dir, zAxis);
    object.position.copy(at);
    object.quaternion.setFromRotationMatrix(basis);
  }

  const elbow = new THREE.Vector3();
  const wrist = new THREE.Vector3();
  const reach = new THREE.Vector3();
  const pole = new THREE.Vector3();
  const bendAxis = new THREE.Vector3();
  const upperDir = new THREE.Vector3();
  const foreDir = new THREE.Vector3();
  const down = new THREE.Vector3(0, -1, 0);

  // Two-bone inverse kinematics: place the elbow so the wrist lands on the target,
  // then point the gripper along `look`.
  function solve(target, look) {
    reach.copy(target).sub(shoulder);
    const distance = THREE.MathUtils.clamp(reach.length(), 6, UPPER + FORE - 0.01);
    reach.normalize();
    wrist.copy(shoulder).addScaledVector(reach, distance);

    const cosA = (UPPER * UPPER + distance * distance - FORE * FORE) / (2 * UPPER * distance);
    const angle = Math.acos(THREE.MathUtils.clamp(cosA, -1, 1));
    // Bend the elbow upwards, like an industrial arm.
    pole.set(0, 1, 0.2).normalize();
    pole.addScaledVector(reach, -pole.dot(reach)).normalize();
    elbow.copy(shoulder)
      .addScaledVector(reach, Math.cos(angle) * UPPER)
      .addScaledVector(pole, Math.sin(angle) * UPPER);

    bendAxis.crossVectors(reach, pole).normalize();
    upperDir.copy(elbow).sub(shoulder).normalize();
    foreDir.copy(wrist).sub(elbow).normalize();

    turret.rotation.y = Math.atan2(reach.x, reach.z);
    orient(shoulderJoint, shoulder, upperDir, bendAxis);
    orient(upperArm, shoulder, upperDir, bendAxis);
    orient(elbowJoint, elbow, foreDir, bendAxis);
    orient(foreArm, elbow, foreDir, bendAxis);
    orient(gripper, wrist, look, bendAxis);
  }

  const cablePoint = (at, axis, side, sag) => at.clone().addScaledVector(axis, side).addScaledVector(down, sag);

  function updateCables() {
    const upperMid = shoulder.clone().addScaledVector(upperDir, UPPER / 2);
    const foreMid = elbow.clone().addScaledVector(foreDir, FORE / 2);
    for (const { side, sag, radius, mesh } of cables) {
      const curve = new THREE.CatmullRomCurve3([
        cablePoint(turret.position, bendAxis, side * 1.2, -1),
        cablePoint(shoulder, bendAxis, side, 1.5),
        cablePoint(upperMid, bendAxis, side, sag * 1.4),
        cablePoint(elbow, bendAxis, side * 1.4, sag),
        cablePoint(foreMid, bendAxis, side * 0.8, sag),
        cablePoint(wrist, bendAxis, side * 0.5, 0.4),
      ]);
      if (mesh.geometry) mesh.geometry.dispose();
      mesh.geometry = new THREE.TubeGeometry(curve, 80, radius, 6, false);
    }
  }

  /* ---------- pointer + persisted pose ---------- */

  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  // The claw tips follow the cursor on a plane a little behind the page content.
  const FOLLOW_DEPTH = -3;
  const followPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -FOLLOW_DEPTH);
  const goal = new THREE.Vector3(-2, 0, FOLLOW_DEPTH);
  const current = new THREE.Vector3(6, -2, FOLLOW_DEPTH);
  const look = new THREE.Vector3(-0.3, -0.4, 1).normalize();
  let pointerSeen = false;
  let pressed = false;
  let lastMove = -10;

  window.addEventListener("pointermove", (e) => {
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    raycaster.ray.intersectPlane(followPlane, goal);
    pointerSeen = true;
    lastMove = clock.elapsedTime;
  });
  // Hold the mouse button to close the claw.
  window.addEventListener("pointerdown", () => (pressed = true));
  window.addEventListener("pointerup", () => (pressed = false));
  window.addEventListener("blur", () => (pressed = false));

  const STORAGE_KEY = "y2k-arm";
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    if (saved) {
      current.fromArray(saved.current);
      goal.fromArray(saved.goal);
      look.fromArray(saved.look).normalize();
      pointerSeen = saved.pointerSeen;
    }
  } catch (e) {}

  function save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        current: current.toArray(), goal: goal.toArray(), look: look.toArray(), pointerSeen,
      }));
    } catch (e) {}
  }
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => document.hidden && save());

  /* ---------- curiosity ----------
     When the cursor rests, every so often glance somewhere new with a little head tilt. */

  const glance = new THREE.Vector3().copy(camera.position);
  const glanceGoal = new THREE.Vector3().copy(camera.position);
  let tiltGoal = 0;
  let tilt = 0;
  let nextGlance = 0;

  function pickGlance(t) {
    const options = [camera.position, camera.position, goal, new THREE.Vector3(-14, 6, 0), new THREE.Vector3(6, -8, 2)];
    glanceGoal.copy(options[Math.floor(Math.random() * options.length)]);
    glanceGoal.x += (Math.random() - 0.5) * 4;
    glanceGoal.y += (Math.random() - 0.5) * 4;
    tiltGoal = (Math.random() - 0.5) * 0.8;
    nextGlance = t + 1.5 + Math.random() * 2.5;
  }

  /* ---------- rendering ---------- */

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 18, aperture: 0.0025, maxblur: 0.012 });
  composer.addPass(bokeh);
  const gearPass = new RenderPass(gearScene, camera);
  gearPass.clear = false;
  gearPass.clearDepth = true;
  composer.addPass(gearPass);
  composer.addPass(new OutputPass());

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const halfHeight = (camera.position.z - GEARS_DEPTH) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    gears.position.set(-halfHeight * camera.aspect + 4.5, halfHeight - 4.5, GEARS_DEPTH);
  }
  window.addEventListener("resize", resize);
  resize();

  // Start with the arm already in place so it does not swing in on every page.
  solve(current, look);

  let last = 0;
  function frame() {
    const t = clock.getElapsedTime();
    const dt = Math.min(t - last, 0.1);
    last = t;

    // Ease the arm and gears towards the current theme tint.
    for (const key in palette) materials[key].color.lerp(palette[key](), 0.06);
    gearMaterial.color.copy(materials.link.color);
    gearEdges.color.copy(materials.edge.color);

    const ease = (rate) => 1 - Math.exp(-dt * rate);
    // 0 while the cursor moves, ramps to 1 after it has rested for a couple of seconds.
    const curious = THREE.MathUtils.smoothstep(t - lastMove, 1.5, 3.5);

    if (!reduceMotion) {
      turnGears(t);
      // Drift lazily until the visitor moves the mouse.
      if (!pointerSeen) goal.set(Math.sin(t * 0.3) * 5 - 2, Math.cos(t * 0.23) * 2.5, FOLLOW_DEPTH);
      if (t > nextGlance) pickGlance(t);
      current.lerp(goal, ease(1.5));
    } else {
      current.copy(goal);
    }

    // Look at the viewer while following; glance around when curious.
    glance.lerp(curious > 0.5 ? glanceGoal : camera.position, ease(3));
    tilt += (tiltGoal * curious - tilt) * ease(3);
    const lookGoal = glance.clone().sub(current).normalize().lerp(foreDir, 0.3).lerp(down, 0.15).normalize();
    look.lerp(lookGoal, ease(4)).normalize();

    // Small breathing motion, a bit livelier while idle, then place the wrist so the claw tips land on the target.
    const sway = reduceMotion ? 0 : 0.15 + curious * 0.35;
    const tip = current.clone().add(new THREE.Vector3(Math.sin(t * 1.3), Math.sin(t * 1.7 + 1), Math.sin(t * 0.9)).multiplyScalar(sway));
    solve(tip.addScaledVector(look, -CLAW_REACH), look);

    head.rotation.y = tilt;
    const gap = pressed ? FINGER_CLOSED : FINGER_OPEN;
    fingers.forEach((finger) => {
      finger.position.x += (finger.userData.side * gap - finger.position.x) * ease(pressed ? 14 : 8);
    });
    updateCables();

    // Keep the gripper in focus so the far end of the arm blurs.
    bokeh.uniforms.focus.value = camera.position.distanceTo(gripper.position);

    composer.render();
    requestAnimationFrame(frame);
  }
  frame();
}
