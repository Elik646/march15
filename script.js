import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const sceneEl = document.getElementById("scene");
const statusText = document.getElementById("statusText");
const resetBtn = document.getElementById("resetBtn");

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sceneEl.clientWidth, sceneEl.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  42,
  sceneEl.clientWidth / sceneEl.clientHeight,
  0.1,
  100
);
camera.position.set(0, 8.4, 12.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = 0.7;
controls.maxPolarAngle = 1.35;
controls.mouseButtons = {
  LEFT: null,
  MIDDLE: THREE.MOUSE.ROTATE,
  RIGHT: THREE.MOUSE.ROTATE
};
controls.target.set(0, 1.6, 0);

const ambient = new THREE.AmbientLight(0xffffff, 1.35);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(8, 14, 10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 40;
keyLight.shadow.camera.left = -14;
keyLight.shadow.camera.right = 14;
keyLight.shadow.camera.top = 14;
keyLight.shadow.camera.bottom = -14;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xffd7ee, 0.9);
rimLight.position.set(-8, 7, -10);
scene.add(rimLight);

const group = new THREE.Group();
scene.add(group);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(10, 80),
  new THREE.ShadowMaterial({ opacity: 0.18 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.06;
floor.receiveShadow = true;
scene.add(floor);

const cakeStand = new THREE.Group();
group.add(cakeStand);

const standPlate = new THREE.Mesh(
  new THREE.CylinderGeometry(4.9, 5.3, 0.35, 64),
  new THREE.MeshStandardMaterial({
    color: 0xf9f6fb,
    roughness: 0.45,
    metalness: 0.05
  })
);
standPlate.position.y = -0.68;
standPlate.receiveShadow = true;
standPlate.castShadow = true;
cakeStand.add(standPlate);

const standStem = new THREE.Mesh(
  new THREE.CylinderGeometry(1.2, 1.5, 0.7, 48),
  new THREE.MeshStandardMaterial({
    color: 0xf3edf7,
    roughness: 0.55,
    metalness: 0.04
  })
);
standStem.position.y = -1.18;
standStem.castShadow = true;
standStem.receiveShadow = true;
cakeStand.add(standStem);

const standBase = new THREE.Mesh(
  new THREE.CylinderGeometry(2.8, 3.5, 0.36, 56),
  new THREE.MeshStandardMaterial({
    color: 0xf6f0f8,
    roughness: 0.5,
    metalness: 0.04
  })
);
standBase.position.y = -1.65;
standBase.castShadow = true;
standBase.receiveShadow = true;
cakeStand.add(standBase);

const cakeRoot = new THREE.Group();
group.add(cakeRoot);

const CAKE_RADIUS = 3.55;
const CAKE_HEIGHT = 2.25;
const SLICE_COUNT = 8;
const SLICE_ANGLE = (Math.PI * 2) / SLICE_COUNT;

const slices = [];
const animatedSlices = [];
const indicatorLines = [];
const pulsingIndicatorSet = new Set();
const _flipAxis = new THREE.Vector3();
const _flipQuat = new THREE.Quaternion();

function createCreamTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#ffe7f1");
  grad.addColorStop(0.45, "#ffd7ea");
  grad.addColorStop(1, "#ffc3df");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < canvas.width; x += 26) {
    const h = 16 + Math.sin(x * 0.05) * 6;
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(x, 20 + h * 0.2, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let x = 0; x < canvas.width; x += 36) {
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.arc(x + 10, 62, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.35, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSpongeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#e8b07d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 2400; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 1 + Math.random() * 5;
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(184,115,68,0.22)" : "rgba(255,231,191,0.22)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const creamTexture = createCreamTexture();
const spongeTexture = createSpongeTexture();
const textureLoader = new THREE.TextureLoader();

function loadMemoryTexture(index) {
  const extensions = ["jpg", "jpeg", "png", "svg"];

  function tryLoad(extIndex) {
    return new Promise((resolve) => {
      if (extIndex >= extensions.length) {
        const canvas = document.createElement("canvas");
        canvas.width = 900;
        canvas.height = 700;
        const ctx = canvas.getContext("2d");

        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#f6bfd9");
        grad.addColorStop(1, "#f1d8a8");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "rgba(255,255,255,0.55)";
        for (let i = 0; i < 18; i += 1) {
          ctx.beginPath();
          ctx.arc(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            20 + Math.random() * 90,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        ctx.fillStyle = "#6a3f57";
        ctx.font = "bold 74px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Memory ${index + 1}`, canvas.width / 2, canvas.height / 2 - 16);

        ctx.fillStyle = "#7a6272";
        ctx.font = "32px Inter, sans-serif";
        ctx.fillText("Add your own photo in assets/images", canvas.width / 2, canvas.height / 2 + 42);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        resolve(texture);
        return;
      }

      const path = `assets/images/memory-${index + 1}.${extensions[extIndex]}`;
      textureLoader.load(
        path,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          resolve(texture);
        },
        undefined,
        () => tryLoad(extIndex + 1).then(resolve)
      );
    });
  }

  return tryLoad(0);
}

function makeCandle(color = 0xffd4ea) {
  const candle = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.08, 0.58, 16),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55
    })
  );
  body.castShadow = true;
  body.position.y = 0.29;
  candle.add(body);

  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8),
    new THREE.MeshStandardMaterial({ color: 0x3b2d2a })
  );
  wick.position.y = 0.62;
  candle.add(wick);

  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 12),
    new THREE.MeshBasicMaterial({
      color: 0xffc25a
    })
  );
  flame.position.y = 0.72;
  flame.scale.set(0.85, 1.25, 0.85);
  candle.add(flame);

  const glow = new THREE.PointLight(0xffbd66, 0.4, 1.5, 2);
  glow.position.y = 0.72;
  candle.add(glow);

  return candle;
}


function createSliceShape(startAngle, endAngle, radius) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(Math.cos(startAngle) * radius, Math.sin(startAngle) * radius);

  const steps = 30;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const a = startAngle + (endAngle - startAngle) * t;
    shape.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }

  shape.lineTo(0, 0);
  return shape;
}

function imagePlaneForSlice(startAngle, endAngle, texture) {
  // Use a pie-sector shape matching the slice footprint.
  // The ShapeGeometry is in local XY; rotation.x = PI/2 maps it to local XZ
  // so it lies flat at the bottom of the slice, facing down (-Y in local space).
  // After the flip animation (180° around the tangential axis) it faces up.
  const shape = createSliceShape(startAngle, endAngle, CAKE_RADIUS * 0.96);
  const geo = new THREE.ShapeGeometry(shape, 32);

  const plane = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    })
  );

  // Lay flat in XZ plane, just above the base of the slice
  plane.rotation.x = Math.PI / 2;
  plane.position.y = 0.04;

  return plane;
}

function addSliceIndicators() {
  for (let i = 0; i < SLICE_COUNT; i += 1) {
    const angle = i * SLICE_ANGLE;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Each indicator gets its own material so it can be highlighted independently
    const mat = new THREE.MeshStandardMaterial({
      color: 0xb05070,
      roughness: 0.3,
      metalness: 0.05,
      transparent: true,
      opacity: 0.85,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0
    });

    const lineLen = CAKE_RADIUS * 0.95;
    const lineGeo = new THREE.BoxGeometry(lineLen, 0.03, 0.052);
    const lineMesh = new THREE.Mesh(lineGeo, mat);
    lineMesh.position.set(
      cosA * (lineLen / 2),
      CAKE_HEIGHT + 0.022,
      sinA * (lineLen / 2)
    );
    lineMesh.rotation.y = -angle;
    cakeRoot.add(lineMesh);

    const notchGeo = new THREE.BoxGeometry(0.055, CAKE_HEIGHT * 0.38, 0.055);
    const notchMesh = new THREE.Mesh(notchGeo, mat);
    notchMesh.position.set(
      cosA * (CAKE_RADIUS - 0.04),
      CAKE_HEIGHT * 0.62,
      sinA * (CAKE_RADIUS - 0.04)
    );
    cakeRoot.add(notchMesh);

    indicatorLines[i] = { line: lineMesh, notch: notchMesh, material: mat };
  }
}

function highlightIndicator(sliceIndex, side) {
  const boundaryIdx = side === "A" ? sliceIndex : (sliceIndex + 1) % SLICE_COUNT;
  const otherBoundaryIdx = side === "A" ? (sliceIndex + 1) % SLICE_COUNT : sliceIndex;

  // Mark the cut boundary as gold
  const ind = indicatorLines[boundaryIdx];
  if (ind) {
    ind.material.color.setHex(0xffcc00);
    ind.material.emissive.setHex(0xffaa00);
    ind.material.emissiveIntensity = 0.6;
    pulsingIndicatorSet.delete(boundaryIdx);
  }

  // Check if the other side is still uncut – if so, pulse it to guide the user
  const slice = slices[sliceIndex];
  const state = slice.userData.state;
  const otherAlreadyCut = side === "A" ? state.cutB : state.cutA;

  if (!otherAlreadyCut) {
    const otherInd = indicatorLines[otherBoundaryIdx];
    if (otherInd && !pulsingIndicatorSet.has(otherBoundaryIdx)) {
      pulsingIndicatorSet.add(otherBoundaryIdx);
      otherInd.material.color.setHex(0xff8822);
      otherInd.material.emissive.setHex(0xff6600);
    }
  } else {
    // Both sides now cut – stop pulsing the other boundary too
    pulsingIndicatorSet.delete(otherBoundaryIdx);
    const otherInd = indicatorLines[otherBoundaryIdx];
    if (otherInd) {
      otherInd.material.color.setHex(0xffcc00);
      otherInd.material.emissive.setHex(0xffaa00);
      otherInd.material.emissiveIntensity = 0.6;
    }
  }
}

function animateIndicators() {
  if (pulsingIndicatorSet.size === 0) return;
  const t = performance.now();
  const pulse = 0.3 + 0.55 * Math.abs(Math.sin(t * 0.0035));
  for (const idx of pulsingIndicatorSet) {
    const ind = indicatorLines[idx];
    if (ind) {
      ind.material.emissiveIntensity = pulse;
    }
  }
}

function addFrostingDrips() {
  const dripMat = new THREE.MeshStandardMaterial({
    color: 0xfff0f6,
    roughness: 0.25,
    metalness: 0.0
  });

  const dripCount = 30;
  for (let i = 0; i < dripCount; i += 1) {
    const a = (i / dripCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.18;
    const dripLen = 0.2 + Math.random() * 0.5;
    const dripR = 0.07 + Math.random() * 0.045;

    const drip = new THREE.Mesh(
      new THREE.CapsuleGeometry(dripR, dripLen, 4, 8),
      dripMat
    );

    const r = CAKE_RADIUS * (0.9 + Math.random() * 0.08);
    // Position so the top of the capsule sits at CAKE_HEIGHT (top edge)
    drip.position.set(
      Math.cos(a) * r,
      CAKE_HEIGHT - dripLen / 2 - dripR,
      Math.sin(a) * r
    );
    drip.castShadow = true;
    cakeRoot.add(drip);
  }
}

function buildCake(memoryTextures) {
  for (let i = 0; i < SLICE_COUNT; i += 1) {
    const startAngle = i * SLICE_ANGLE;
    const endAngle = startAngle + SLICE_ANGLE;

    const outerGroup = new THREE.Group();
    outerGroup.userData.index = i;

    const shape = createSliceShape(startAngle, endAngle, CAKE_RADIUS);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: CAKE_HEIGHT,
      bevelEnabled: false,
      curveSegments: 36
    });

    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, CAKE_HEIGHT, 0);

    const materials = [
      new THREE.MeshStandardMaterial({
        map: creamTexture,
        roughness: 0.72,
        metalness: 0,
        side: THREE.DoubleSide
      }),
      new THREE.MeshStandardMaterial({
        color: 0xffdff0,
        roughness: 0.58,
        metalness: 0.02
      }),
      new THREE.MeshStandardMaterial({
        map: spongeTexture,
        roughness: 0.85,
        metalness: 0,
        side: THREE.DoubleSide
      })
    ];

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    outerGroup.add(mesh);

    const imgPlane = imagePlaneForSlice(startAngle, endAngle, memoryTextures[i]);
    imgPlane.visible = false;
    outerGroup.add(imgPlane);

    const radialCenter = (startAngle + endAngle) / 2;
    outerGroup.userData.radialCenter = radialCenter;
    outerGroup.userData.startAngle = startAngle;
    outerGroup.userData.endAngle = endAngle;
    outerGroup.userData.imagePlane = imgPlane;
    outerGroup.userData.state = {
      cutA: false,
      cutB: false,
      opened: false,
      lift: 0
    };

    cakeRoot.add(outerGroup);
    slices.push(outerGroup);
  }

  addTopDecoration();
}

function addTopDecoration() {
  const topY = CAKE_HEIGHT + 0.08;

  // Subtle frosted dome in the centre
  const domeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(CAKE_RADIUS * 0.55, 48, 12, 0, Math.PI * 2, 0, 0.22),
    new THREE.MeshStandardMaterial({ color: 0xffeef7, roughness: 0.38 })
  );
  domeMesh.position.y = CAKE_HEIGHT + 0.02;
  cakeRoot.add(domeMesh);

  const dollops = 24;
  for (let i = 0; i < dollops; i += 1) {
    const a = (i / dollops) * Math.PI * 2;
    const x = Math.cos(a) * (CAKE_RADIUS * 0.84);
    const z = Math.sin(a) * (CAKE_RADIUS * 0.84);

    const dollop = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 14, 14),
      new THREE.MeshStandardMaterial({
        color: 0xffeef7,
        roughness: 0.44
      })
    );
    dollop.scale.y = 0.8;
    dollop.position.set(x, topY, z);
    dollop.castShadow = true;
    cakeRoot.add(dollop);
  }

  const candleCount = 12;
  for (let i = 0; i < candleCount; i += 1) {
    const a = (i / candleCount) * Math.PI * 2;
    const r = CAKE_RADIUS * 0.63;
    const candle = makeCandle(i % 2 === 0 ? 0xffd2ea : 0xfff1b8);
    candle.position.set(Math.cos(a) * r, topY, Math.sin(a) * r);
    cakeRoot.add(candle);
  }

  addFrostingDrips();
  addSliceIndicators();
}

function angleFromScreenPosition(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((clientY - rect.top) / rect.height) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera({ x, y }, camera);

  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const point = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, point);

  return Math.atan2(point.z, point.x);
}

function normalizeAngle(a) {
  let value = a % (Math.PI * 2);
  if (value < 0) value += Math.PI * 2;
  return value;
}

function smallestAngleDiff(a, b) {
  let diff = normalizeAngle(a) - normalizeAngle(b);
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff);
}

let rotateKeyHeld = false;

window.addEventListener("keydown", (e) => {
  if (e.key === "Control" || e.key === "Meta") {
    rotateKeyHeld = true;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "Control" || e.key === "Meta") {
    rotateKeyHeld = false;
  }
});

let isCtrlDragging = false;
let isLeftDragging = false;
let lastDragAngle = null;
let lastCutTime = 0;
const ROTATION_SENSITIVITY = 0.008;
// Angular tolerance (radians) for registering a drag as a cut on a slice boundary.
// ~12.6° — wide enough to be comfortable, narrow enough to not span two boundaries.
const CUT_THRESHOLD = 0.22;
// Fraction of the animation at which the rise phase ends and the flip begins.
const FLIP_PHASE_START = 0.45;

function updateStatus(text) {
  statusText.textContent = text;
}

function tryCutAtAngle(worldAngle) {
  const now = performance.now();
  if (now - lastCutTime < 120) return;
  lastCutTime = now;

  const localAngle = normalizeAngle(worldAngle - group.rotation.y);

  let bestSlice = null;
  let bestSide = null;
  let bestDistance = Infinity;

  for (let i = 0; i < slices.length; i += 1) {
    const slice = slices[i];
    const data = slice.userData;
    const state = data.state;

    if (state.opened) continue;

    const dStart = smallestAngleDiff(localAngle, data.startAngle);
    const dEnd = smallestAngleDiff(localAngle, data.endAngle);
    const threshold = CUT_THRESHOLD;

    if (dStart < threshold && dStart < bestDistance) {
      bestDistance = dStart;
      bestSlice = slice;
      bestSide = "A";
    }

    if (dEnd < threshold && dEnd < bestDistance) {
      bestDistance = dEnd;
      bestSlice = slice;
      bestSide = "B";
    }
  }

  if (!bestSlice) return;

  const state = bestSlice.userData.state;
  let madeCut = false;

  if (bestSide === "A" && !state.cutA) {
    state.cutA = true;
    madeCut = true;
    highlightIndicator(bestSlice.userData.index, "A");
  }

  if (bestSide === "B" && !state.cutB) {
    state.cutB = true;
    madeCut = true;
    highlightIndicator(bestSlice.userData.index, "B");
  }

  if (!madeCut) return;

  if (state.cutA && state.cutB && !state.opened) {
    state.opened = true;
    state.lift = 0.001;
    animatedSlices.push(bestSlice);
    updateStatus(`Slice ${bestSlice.userData.index + 1} released! Watch it flip!`);
  } else {
    updateStatus(`Slice ${bestSlice.userData.index + 1}: one side cut — now cut the other side.`);
  }
}

renderer.domElement.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

renderer.domElement.addEventListener("pointerdown", (event) => {
  if (event.button === 0) {
    if (rotateKeyHeld) {
      isCtrlDragging = true;
      sceneEl.classList.add("rotate-mode");
    } else {
      isLeftDragging = true;
      sceneEl.classList.add("knife-mode");
      lastDragAngle = angleFromScreenPosition(event.clientX, event.clientY);
    }
  }
});

window.addEventListener("pointerup", () => {
  isLeftDragging = false;
  isCtrlDragging = false;
  sceneEl.classList.remove("knife-mode");
  sceneEl.classList.remove("rotate-mode");
  lastDragAngle = null;
});

window.addEventListener("pointermove", (event) => {
  if (isCtrlDragging) {
    group.rotation.y += event.movementX * ROTATION_SENSITIVITY;
    return;
  }

  if (!isLeftDragging) return;

  const currentAngle = angleFromScreenPosition(event.clientX, event.clientY);

  if (lastDragAngle !== null) {
    const delta = smallestAngleDiff(currentAngle, lastDragAngle);
    if (delta > 0.02) {
      tryCutAtAngle(currentAngle);
    }
  }

  lastDragAngle = currentAngle;
});

resetBtn.addEventListener("click", () => {
  group.rotation.y = 0;

  for (let i = 0; i < slices.length; i += 1) {
    const slice = slices[i];
    slice.position.set(0, 0, 0);
    slice.rotation.set(0, 0, 0);
    slice.userData.imagePlane.visible = false;
    slice.userData.state.cutA = false;
    slice.userData.state.cutB = false;
    slice.userData.state.opened = false;
    slice.userData.state.lift = 0;
  }

  // Reset all indicator colours
  pulsingIndicatorSet.clear();
  for (let i = 0; i < indicatorLines.length; i += 1) {
    const ind = indicatorLines[i];
    if (ind) {
      ind.material.color.setHex(0xb05070);
      ind.material.emissive.setHex(0x000000);
      ind.material.emissiveIntensity = 0;
    }
  }

  animatedSlices.length = 0;
  controls.reset();
  controls.target.set(0, 1.6, 0);
  controls.update();
  updateStatus("Cake reset. Cut one side of a slice to begin.");
});

function animateSlices() {
  for (let i = 0; i < animatedSlices.length; i += 1) {
    const slice = animatedSlices[i];
    const state = slice.userData.state;

    if (state.lift >= 1) continue;

    state.lift = Math.min(state.lift + 0.022, 1);
    const t = state.lift;

    const angle = slice.userData.radialCenter;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const PHASE1 = FLIP_PHASE_START;

    if (t <= PHASE1) {
      // Phase 1: rise and move outward
      const p = easeOutCubic(t / PHASE1);
      slice.position.set(cosA * 1.8 * p, 1.6 * p, sinA * 1.8 * p);
      slice.quaternion.identity();
    } else {
      // Phase 2: flip 180° around the tangential axis
      const p = easeOutCubic((t - PHASE1) / (1 - PHASE1));
      const flipAngle = Math.PI * p;

      slice.position.set(cosA * 1.8, 1.6 - 0.25 * p, sinA * 1.8);

      // Tangential axis is perpendicular to the radial direction in XZ
      _flipAxis.set(-sinA, 0, cosA);
      _flipQuat.setFromAxisAngle(_flipAxis, flipAngle);
      slice.quaternion.copy(_flipQuat);

      // Reveal the image once the flip is roughly halfway done
      if (p > 0.45 && !slice.userData.imagePlane.visible) {
        slice.userData.imagePlane.visible = true;
      }
    }
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function onResize() {
  camera.aspect = sceneEl.clientWidth / sceneEl.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(sceneEl.clientWidth, sceneEl.clientHeight);
}

window.addEventListener("resize", onResize);

async function init() {
  updateStatus("Loading cake...");

  const memoryTextures = await Promise.all(
    Array.from({ length: SLICE_COUNT }, (_, i) => loadMemoryTexture(i))
  );

  buildCake(memoryTextures);
  cakeRoot.position.y = -0.3;
  updateStatus("Cake ready. Left-drag over one cut edge, then the other edge of the same slice.");
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  animateSlices();
  animateIndicators();
  renderer.render(scene, camera);
}

init();
animate();
