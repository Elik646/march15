import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById('scene');
const statusEl = document.getElementById('status');
const resetButton = document.getElementById('resetButton');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf8edf3, 18, 34);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 7.2, 10.6);

const controls = new OrbitControls(camera, canvas);
controls.enablePan = false;
controls.enableDamping = true;
controls.minDistance = 7;
controls.maxDistance = 16;
controls.minPolarAngle = 0.55;
controls.maxPolarAngle = 1.38;
controls.mouseButtons.LEFT = null;
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;

const ambient = new THREE.HemisphereLight(0xfff0f7, 0xd8b1a8, 1.55);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
keyLight.position.set(6, 12, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -12;
keyLight.shadow.camera.right = 12;
keyLight.shadow.camera.top = 12;
keyLight.shadow.camera.bottom = -12;
scene.add(keyLight);

const fillLight = new THREE.PointLight(0xffd5ee, 18, 28, 2);
fillLight.position.set(-6, 4, -4);
scene.add(fillLight);

const root = new THREE.Group();
scene.add(root);

const plateMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xfaf8fb,
  roughness: 0.42,
  metalness: 0.04,
  clearcoat: 0.35,
  clearcoatRoughness: 0.25
});
const plate = new THREE.Mesh(new THREE.CylinderGeometry(4.7, 5, 0.36, 64), plateMaterial);
plate.receiveShadow = true;
plate.position.y = -1.38;
root.add(plate);

const cake = new THREE.Group();
root.add(cake);

const CAKE_RADIUS = 3.35;
const CAKE_HEIGHT = 2.3;
const SLICE_COUNT = 8;
const SLICE_ANGLE = (Math.PI * 2) / SLICE_COUNT;
const CUT_TOLERANCE = 0.18;
const slices = [];
const cutBoundaries = new Array(SLICE_COUNT).fill(false);
let pointerDown = false;
let currentStrokeAngles = [];

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const cutPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const planeHit = new THREE.Vector3();

const textureLoader = new THREE.TextureLoader();

function makeTextTexture(text) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, '#ffd8ef');
  g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#7e3755';
  ctx.font = '700 138px Playfair Display, serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, c.width / 2, 210);
  ctx.font = '500 54px Inter, sans-serif';
  ctx.fillStyle = '#9b6c84';
  ctx.fillText('memory', c.width / 2, 296);
  return new THREE.CanvasTexture(c);
}

function createPlaceholderTexture(index) {
  const c = document.createElement('canvas');
  c.width = 900;
  c.height = 900;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, c.width, c.height);
  grad.addColorStop(0, '#ffd9ea');
  grad.addColorStop(1, '#fbe9c6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = 'rgba(255,255,255,0.48)';
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.arc(140 + i * 85, 130 + (i % 2) * 55, 26 + (i % 3) * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#7a3957';
  ctx.font = '700 120px Playfair Display, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Photo ${index + 1}`, c.width / 2, 420);
  ctx.font = '500 48px Inter, sans-serif';
  ctx.fillStyle = '#9f6f84';
  ctx.fillText('Replace with your own image', c.width / 2, 510);
  return new THREE.CanvasTexture(c);
}

function loadMemoryTexture(index) {
  return new Promise((resolve) => {
    const path = `assets/images/memory-${index + 1}.jpg`;
    textureLoader.load(
      path,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
      },
      undefined,
      () => resolve(createPlaceholderTexture(index))
    );
  });
}

function createSectorShape(start, end, radius) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.absarc(0, 0, radius, start, end, false);
  shape.lineTo(0, 0);
  return shape;
}

function createCakeSlice(index, memoryTexture) {
  const start = index * SLICE_ANGLE;
  const end = start + SLICE_ANGLE;
  const mid = (start + end) / 2;

  const group = new THREE.Group();
  group.userData = {
    index,
    startBoundary: index,
    endBoundary: (index + 1) % SLICE_COUNT,
    isOpen: false,
    lift: 0,
    targetLift: 0,
    push: 0,
    targetPush: 0,
    midAngle: mid,
    imagePlane: null,
    cutHighlight: null
  };

  const bodyGeom = new THREE.ExtrudeGeometry(createSectorShape(start, end, CAKE_RADIUS), {
    depth: CAKE_HEIGHT,
    bevelEnabled: false,
    curveSegments: 32,
    steps: 1
  });
  bodyGeom.rotateX(Math.PI / 2);
  bodyGeom.translate(0, CAKE_HEIGHT / 2 - 1.1, 0);

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8a179, roughness: 0.78, metalness: 0.02 });
  const cakeBody = new THREE.Mesh(bodyGeom, bodyMat);
  cakeBody.castShadow = true;
  cakeBody.receiveShadow = true;
  group.add(cakeBody);

  const icingGeom = new THREE.ExtrudeGeometry(createSectorShape(start, end, CAKE_RADIUS + 0.03), {
    depth: 0.42,
    bevelEnabled: false,
    curveSegments: 32,
    steps: 1
  });
  icingGeom.rotateX(Math.PI / 2);
  icingGeom.translate(0, CAKE_HEIGHT + 0.01 - 1.1, 0);

  const icingMat = new THREE.MeshPhysicalMaterial({
    color: 0xffd3e8,
    roughness: 0.38,
    metalness: 0.01,
    clearcoat: 0.55,
    clearcoatRoughness: 0.15
  });
  const icing = new THREE.Mesh(icingGeom, icingMat);
  icing.castShadow = true;
  icing.receiveShadow = true;
  group.add(icing);

  const dripCount = 5;
  for (let i = 0; i < dripCount; i += 1) {
    const t = (i + 1) / (dripCount + 1);
    const ang = start + (end - start) * t;
    const h = 0.38 + (i % 3) * 0.14;
    const drip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.12, h, 12),
      icingMat
    );
    drip.position.set(Math.cos(ang) * (CAKE_RADIUS - 0.03), CAKE_HEIGHT - h / 2 - 1.1, Math.sin(ang) * (CAKE_RADIUS - 0.03));
    drip.castShadow = true;
    group.add(drip);
  }

  const memoryPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 1.9),
    new THREE.MeshBasicMaterial({ map: memoryTexture, transparent: true })
  );
  memoryPlane.rotation.x = -Math.PI / 2;
  memoryPlane.position.set(Math.cos(mid) * 1.25, -1.08, Math.sin(mid) * 1.25);
  memoryPlane.visible = false;
  root.add(memoryPlane);
  group.userData.imagePlane = memoryPlane;

  const highlightMat = new THREE.MeshBasicMaterial({ color: 0xff7fb9, transparent: true, opacity: 0 });
  const edgeLength = CAKE_RADIUS + 0.1;
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.06, CAKE_HEIGHT + 0.5, edgeLength), highlightMat);
  edge.position.y = 0.08;
  edge.rotation.y = -start;
  group.add(edge);
  group.userData.cutHighlight = edge;

  cake.add(group);
  slices.push(group);
}

function addCandles() {
  const candlePalette = [0xff8fb8, 0xffddb3, 0xffa4f0, 0xffe08a];
  const candleRing = new THREE.Group();
  root.add(candleRing);

  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    const color = candlePalette[i % candlePalette.length];
    const candle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.7, 18),
      new THREE.MeshStandardMaterial({ color, roughness: 0.5 })
    );
    candle.position.set(Math.cos(angle) * 2.15, CAKE_HEIGHT + 0.26 - 1.1, Math.sin(angle) * 2.15);
    candle.castShadow = true;
    candleRing.add(candle);

    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0xffd769 })
    );
    flame.scale.set(0.7, 1.5, 0.7);
    flame.position.copy(candle.position).add(new THREE.Vector3(0, 0.46, 0));
    candleRing.add(flame);

    const glow = new THREE.PointLight(0xffbb56, 0.45, 2.7, 2);
    glow.position.copy(flame.position);
    candleRing.add(glow);
  }

  const topperTexture = makeTextTexture('MAMA');
  topperTexture.colorSpace = THREE.SRGBColorSpace;
  const topper = new THREE.Mesh(
    new THREE.PlaneGeometry(2.15, 1.05),
    new THREE.MeshBasicMaterial({ map: topperTexture, transparent: true })
  );
  topper.position.set(0, CAKE_HEIGHT + 0.55 - 1.1, 0);
  topper.rotation.x = -Math.PI / 2;
  root.add(topper);
}

function addBoardDecor() {
  const crumbs = new THREE.Group();
  root.add(crumbs);
  for (let i = 0; i < 26; i += 1) {
    const s = 0.03 + Math.random() * 0.08;
    const crumb = new THREE.Mesh(
      new THREE.SphereGeometry(s, 10, 10),
      new THREE.MeshStandardMaterial({ color: i % 2 ? 0xe6a179 : 0xffd3e8, roughness: 0.95 })
    );
    const ang = Math.random() * Math.PI * 2;
    const dist = 3.8 + Math.random() * 1.2;
    crumb.position.set(Math.cos(ang) * dist, -1.18 + Math.random() * 0.02, Math.sin(ang) * dist);
    crumbs.add(crumb);
  }
}

function markBoundaryCut(boundaryIndex) {
  if (cutBoundaries[boundaryIndex]) return;
  cutBoundaries[boundaryIndex] = true;
  const slice = slices[boundaryIndex];
  if (slice) {
    slice.userData.cutHighlight.material.opacity = 0.9;
  }
}

function updateCompletedSlices() {
  for (const slice of slices) {
    const { startBoundary, endBoundary, isOpen } = slice.userData;
    if (!isOpen && cutBoundaries[startBoundary] && cutBoundaries[endBoundary]) {
      slice.userData.isOpen = true;
      slice.userData.targetLift = 1.45;
      slice.userData.targetPush = 1.1;
      slice.userData.imagePlane.visible = true;
      statusEl.textContent = `Slice ${slice.userData.index + 1} opened. Keep cutting the next memory.`;
    }
  }

  if (slices.every((slice) => slice.userData.isOpen)) {
    statusEl.textContent = 'All 8 memories are revealed.';
  }
}

function analyzeStroke() {
  if (currentStrokeAngles.length < 2) return;
  for (let boundary = 0; boundary < SLICE_COUNT; boundary += 1) {
    const boundaryAngle = boundary * SLICE_ANGLE;
    for (const a of currentStrokeAngles) {
      let diff = Math.atan2(Math.sin(a - boundaryAngle), Math.cos(a - boundaryAngle));
      diff = Math.abs(diff);
      if (diff < CUT_TOLERANCE) {
        markBoundaryCut(boundary);
        break;
      }
    }
  }
  updateCompletedSlices();
}

function setPointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  document.body.style.setProperty('--knife-x', `${event.clientX}px`);
  document.body.style.setProperty('--knife-y', `${event.clientY}px`);
}

function collectCutPoint(event) {
  setPointer(event);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.ray.intersectPlane(cutPlane, planeHit)) {
    const radius = Math.hypot(planeHit.x, planeHit.z);
    if (radius <= CAKE_RADIUS + 0.2) {
      currentStrokeAngles.push(Math.atan2(planeHit.z, planeHit.x));
    }
  }
}

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('pointerdown', (event) => {
  setPointer(event);
  if (event.button === 0) {
    pointerDown = true;
    currentStrokeAngles = [];
    document.body.classList.add('cutting');
    statusEl.textContent = 'Knife down. Swipe across one edge of a slice.';
    collectCutPoint(event);
  }
});

window.addEventListener('pointermove', (event) => {
  if (!pointerDown) return;
  collectCutPoint(event);
});

window.addEventListener('pointerup', () => {
  if (!pointerDown) return;
  pointerDown = false;
  document.body.classList.remove('cutting');
  analyzeStroke();
  currentStrokeAngles = [];
});

resetButton.addEventListener('click', () => {
  for (let i = 0; i < cutBoundaries.length; i += 1) cutBoundaries[i] = false;
  for (const slice of slices) {
    slice.userData.isOpen = false;
    slice.userData.targetLift = 0;
    slice.userData.targetPush = 0;
    slice.userData.imagePlane.visible = false;
    slice.userData.cutHighlight.material.opacity = 0;
  }
  statusEl.textContent = 'Cake reset. Swipe one cut line, then the matching second line.';
});

async function buildScene() {
  for (let i = 0; i < SLICE_COUNT; i += 1) {
    const tex = await loadMemoryTexture(i);
    createCakeSlice(i, tex);
  }
  addCandles();
  addBoardDecor();
  statusEl.textContent = 'Ready. Use right-click drag to orbit, then left-click drag to cut a slice edge.';
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();
await buildScene();

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  controls.update();

  for (const slice of slices) {
    slice.userData.lift += (slice.userData.targetLift - slice.userData.lift) * 0.08;
    slice.userData.push += (slice.userData.targetPush - slice.userData.push) * 0.08;

    const ang = slice.userData.midAngle;
    slice.position.set(
      Math.cos(ang) * slice.userData.push,
      slice.userData.lift,
      Math.sin(ang) * slice.userData.push
    );

    if (!slice.userData.isOpen) {
      slice.userData.cutHighlight.material.opacity *= 0.94;
    }
  }

  for (const obj of root.children) {
    if (obj.type === 'Group' || obj.type === 'Mesh') {
      if (obj !== plate && obj.parent === root) {
        obj.rotation.y += obj === cake ? 0 : 0;
      }
    }
  }

  const topper = root.children.find((child) => child.material?.map && child.geometry?.type === 'PlaneGeometry');
  if (topper) {
    topper.rotation.z = Math.sin(t * 1.7) * 0.02;
  }

  renderer.render(scene, camera);
}

animate();
