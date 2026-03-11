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
  const angleMid = (startAngle + endAngle) / 2;
  const innerRadius = CAKE_RADIUS * 0.48;
  const width = CAKE_RADIUS * 1.6 * Math.sin((endAngle - startAngle) / 2) * 2;
  const height = CAKE_HEIGHT * 0.78;

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.max(width, 1.3), height),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    })
  );

  plane.position.set(
    Math.cos(angleMid) * innerRadius,
    CAKE_HEIGHT * 0.5,
    Math.sin(angleMid) * innerRadius
  );
  plane.lookAt(
    Math.cos(angleMid) * (innerRadius + 1.2),
    CAKE_HEIGHT * 0.5,
    Math.sin(angleMid) * (innerRadius + 1.2)
  );

  return plane;
}

function addSliceIndicators() {
  const indicatorMat = new THREE.MeshStandardMaterial({
    color: 0xb05070,
    roughness: 0.3,
    metalness: 0.05,
    transparent: true,
    opacity: 0.82
  });

  for (let i = 0; i < SLICE_COUNT; i += 1) {
    const angle = i * SLICE_ANGLE;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const lineLen = CAKE_RADIUS * 0.95;
    const lineGeo = new THREE.BoxGeometry(lineLen, 0.03, 0.048);
    const lineMesh = new THREE.Mesh(lineGeo, indicatorMat);
    lineMesh.position.set(
      cosA * (lineLen / 2),
      CAKE_HEIGHT + 0.022,
      sinA * (lineLen / 2)
    );
    lineMesh.rotation.y = -angle;
    lineMesh.castShadow = false;
    cakeRoot.add(lineMesh);

    const notchGeo = new THREE.BoxGeometry(0.055, CAKE_HEIGHT * 0.38, 0.055);
    const notchMesh = new THREE.Mesh(notchGeo, indicatorMat);
    notchMesh.position.set(
      cosA * (CAKE_RADIUS - 0.04),
      CAKE_HEIGHT * 0.62,
      sinA * (CAKE_RADIUS - 0.04)
    );
    cakeRoot.add(notchMesh);
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
    const threshold = 0.17;

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

  if (bestSide === "A" && !state.cutA) {
    state.cutA = true;
    updateStatus(`Slice ${bestSlice.userData.index + 1}: first side cut. Now cut the other side.`);
    return;
  }

  if (bestSide === "B" && !state.cutB) {
    state.cutB = true;
    updateStatus(`Slice ${bestSlice.userData.index + 1}: first side cut. Now cut the other side.`);
    return;
  }

  if (state.cutA && state.cutB && !state.opened) {
    state.opened = true;
    state.lift = 0.001;
    bestSlice.userData.imagePlane.visible = true;
    animatedSlices.push(bestSlice);
    updateStatus(`Slice ${bestSlice.userData.index + 1} opened.`);
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

    state.lift = Math.min(state.lift + 0.035, 1);

    const t = state.lift;
    const angle = slice.userData.radialCenter;
    const outward = 1.35 * easeOutCubic(t);
    const up = 0.82 * easeOutCubic(t);
    const tilt = -0.28 * easeOutCubic(t);

    slice.position.set(
      Math.cos(angle) * outward,
      up,
      Math.sin(angle) * outward
    );
    slice.rotation.x = tilt;
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
  renderer.render(scene, camera);
}

init();
animate();
