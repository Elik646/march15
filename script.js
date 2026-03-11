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
camera.position.set(0, 4.5, 14);

// LEFT drag now rotates; click reveals slices
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = 0.4;
controls.maxPolarAngle = 1.5;
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.ROTATE,
  RIGHT: THREE.MOUSE.ROTATE
};
controls.target.set(0, 1.0, 0);

const ambient = new THREE.AmbientLight(0xffffff, 0.05);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xfff8f0, 0);
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

const rimLight = new THREE.DirectionalLight(0xffd7ee, 0);
rimLight.position.set(-8, 7, -10);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xfff0e0, 0);
fillLight.position.set(0, -4, 8);
scene.add(fillLight);

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

// Cake stand
const cakeStand = new THREE.Group();
group.add(cakeStand);

const standPlate = new THREE.Mesh(
  new THREE.CylinderGeometry(4.9, 5.3, 0.35, 64),
  new THREE.MeshStandardMaterial({ color: 0xf9f6fb, roughness: 0.45, metalness: 0.05 })
);
standPlate.position.y = -0.68;
standPlate.receiveShadow = true;
standPlate.castShadow = true;
cakeStand.add(standPlate);

const standStem = new THREE.Mesh(
  new THREE.CylinderGeometry(1.2, 1.5, 0.7, 48),
  new THREE.MeshStandardMaterial({ color: 0xf3edf7, roughness: 0.55, metalness: 0.04 })
);
standStem.position.y = -1.18;
standStem.castShadow = true;
standStem.receiveShadow = true;
cakeStand.add(standStem);

const standBase = new THREE.Mesh(
  new THREE.CylinderGeometry(2.8, 3.5, 0.36, 56),
  new THREE.MeshStandardMaterial({ color: 0xf6f0f8, roughness: 0.5, metalness: 0.04 })
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
const candlesList = [];

// ---------------------------------------------------------------------------
// Textures — improved to look more like real cake
// ---------------------------------------------------------------------------

function createFrostingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // Smooth cream base
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#fff9fd");
  grad.addColorStop(0.45, "#fde6f2");
  grad.addColorStop(1, "#f9cfea");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 256);

  // Vertical piping strokes
  for (let x = 0; x < 1024; x += 18) {
    const gx = ctx.createLinearGradient(x - 9, 0, x + 9, 0);
    gx.addColorStop(0, "rgba(255,255,255,0)");
    gx.addColorStop(0.5, "rgba(255,255,255,0.42)");
    gx.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gx;
    ctx.fillRect(x - 9, 0, 18, 256);
  }

  // Soft highlight band at top
  const topHighlight = ctx.createLinearGradient(0, 0, 0, 28);
  topHighlight.addColorStop(0, "rgba(255,255,255,0.5)");
  topHighlight.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = topHighlight;
  ctx.fillRect(0, 0, 1024, 28);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(2.2, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSpongeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Warm golden-brown sponge base
  ctx.fillStyle = "#c8783a";
  ctx.fillRect(0, 0, 512, 512);

  // Cream filling layers at 1/3 and 2/3 height
  [170, 340].forEach((y) => {
    const lg = ctx.createLinearGradient(0, y - 15, 0, y + 15);
    lg.addColorStop(0, "rgba(245,205,140,0)");
    lg.addColorStop(0.3, "rgba(255,238,185,0.95)");
    lg.addColorStop(0.5, "rgba(255,250,225,1)");
    lg.addColorStop(0.7, "rgba(255,238,185,0.95)");
    lg.addColorStop(1, "rgba(245,205,140,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(0, y - 15, 512, 30);
  });

  // Sponge crumb texture
  for (let i = 0; i < 3200; i += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 0.5 + Math.random() * 2.8;
    ctx.fillStyle =
      Math.random() > 0.5
        ? `rgba(160,85,28,${0.12 + Math.random() * 0.18})`
        : `rgba(235,185,105,${0.1 + Math.random() * 0.15})`;
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

function createTopFrostingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 280);
  grad.addColorStop(0, "#fff0f9");
  grad.addColorStop(0.6, "#fde0f0");
  grad.addColorStop(1, "#f9cee8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Swirl / piped rosette effect
  for (let i = 0; i < 80; i += 1) {
    const angle = (i / 80) * Math.PI * 2;
    const r = 60 + Math.random() * 160;
    const x = 256 + Math.cos(angle) * r;
    const z = 256 + Math.sin(angle) * r;
    const size = 10 + Math.random() * 22;
    const g = ctx.createRadialGradient(x, z, 0, x, z, size);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, z, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const frostingTexture = createFrostingTexture();
const spongeTexture = createSpongeTexture();
const topFrostingTexture = createTopFrostingTexture();
const textureLoader = new THREE.TextureLoader();

// ---------------------------------------------------------------------------
// Memory texture loader
// ---------------------------------------------------------------------------

function loadMemoryTexture(index) {
  const extensions = ["jpg", "jpeg", "png", "svg"];

  function tryLoad(extIndex) {
    return new Promise((resolve) => {
      if (extIndex >= extensions.length) {
        // Fallback placeholder
        const canvas = document.createElement("canvas");
        canvas.width = 900;
        canvas.height = 700;
        const ctx = canvas.getContext("2d");

        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#f6bfd9");
        grad.addColorStop(1, "#f1d8a8");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
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

// ---------------------------------------------------------------------------
// Candle
// ---------------------------------------------------------------------------

function makeCandle(color = 0xffd4ea) {
  const candle = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.08, 0.58, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.55 })
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
    new THREE.SphereGeometry(0.065, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffc25a })
  );
  flame.position.y = 0.72;
  flame.scale.set(0.85, 1.3, 0.85);
  flame.visible = false;
  candle.add(flame);

  // Inner bright flame core
  const flameCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff4a0 })
  );
  flameCore.position.y = 0.715;
  flameCore.visible = false;
  candle.add(flameCore);

  const glow = new THREE.PointLight(0xffbd66, 0, 1.6, 2);
  glow.position.y = 0.72;
  candle.add(glow);

  candle.userData.flame = flame;
  candle.userData.flameCore = flameCore;
  candle.userData.glow = glow;

  return candle;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function createSliceShape(startAngle, endAngle, radius) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(Math.cos(startAngle) * radius, Math.sin(startAngle) * radius);

  const steps = 32;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const a = startAngle + (endAngle - startAngle) * t;
    shape.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }

  shape.lineTo(0, 0);
  return shape;
}

// ---------------------------------------------------------------------------
// Image planes — one rectangle on each cut face of the slice (startAngle and
// endAngle), so the photo is visible from any camera angle as the slice slides out.
// ---------------------------------------------------------------------------

function imagePlanesForSlice(startAngle, endAngle, texture) {
  // Nudge each plane slightly in front of its cut face to avoid z-fighting.
  const FACE_OFFSET = 0.04;
  // Scale factor so the image doesn't quite reach the cake edges.
  const IMAGE_SCALE = 0.9;
  const planes = [];

  // ---- Face at startAngle ----
  // Outward normal: (sin(startAngle), 0, -cos(startAngle))
  // A PlaneGeometry faces +Z; rotation.y = π - startAngle aligns the normal.
  {
    const geo = new THREE.PlaneGeometry(CAKE_RADIUS * IMAGE_SCALE, CAKE_HEIGHT * IMAGE_SCALE);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.rotation.y = Math.PI - startAngle;
    plane.position.set(
      (CAKE_RADIUS / 2) * Math.cos(startAngle) + FACE_OFFSET * Math.sin(startAngle),
      CAKE_HEIGHT / 2,
      (CAKE_RADIUS / 2) * Math.sin(startAngle) - FACE_OFFSET * Math.cos(startAngle)
    );
    planes.push(plane);
  }

  // ---- Face at endAngle ----
  // Outward normal: (-sin(endAngle), 0, cos(endAngle))
  // rotation.y = -endAngle aligns the plane normal with that direction.
  {
    const geo = new THREE.PlaneGeometry(CAKE_RADIUS * IMAGE_SCALE, CAKE_HEIGHT * IMAGE_SCALE);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.rotation.y = -endAngle;
    plane.position.set(
      (CAKE_RADIUS / 2) * Math.cos(endAngle) - FACE_OFFSET * Math.sin(endAngle),
      CAKE_HEIGHT / 2,
      (CAKE_RADIUS / 2) * Math.sin(endAngle) + FACE_OFFSET * Math.cos(endAngle)
    );
    planes.push(plane);
  }

  return planes;
}

// ---------------------------------------------------------------------------
// Per-slice decorations (candles, dollops, drips) — added to each slice group
// so they travel with the slice during the reveal animation
// ---------------------------------------------------------------------------

function addSliceDecorations(sliceGroup, sliceIndex) {
  const topY = CAKE_HEIGHT + 0.08;
  const startAngle = sliceIndex * SLICE_ANGLE;
  const endAngle = startAngle + SLICE_ANGLE;

  const dripMat = new THREE.MeshStandardMaterial({
    color: 0xfff2f7,
    roughness: 0.22,
    metalness: 0
  });

  // ---- Dollops (3 per slice along outer ring) ----
  for (let j = 0; j < 3; j += 1) {
    const t = (j + 0.5) / 3;
    const a = startAngle + t * SLICE_ANGLE;
    const x = Math.cos(a) * (CAKE_RADIUS * 0.84);
    const z = Math.sin(a) * (CAKE_RADIUS * 0.84);

    const dollop = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xfff0f8, roughness: 0.42 })
    );
    dollop.scale.set(1, 0.78, 1);
    dollop.position.set(x, topY, z);
    dollop.castShadow = true;
    sliceGroup.add(dollop);
  }

  // ---- Candles (2 per slice) ----
  const candleOffsets = [0.28, 0.72];
  candleOffsets.forEach((t, ci) => {
    const a = startAngle + t * SLICE_ANGLE;
    const r = CAKE_RADIUS * 0.63;
    const candle = makeCandle(ci === 0 ? 0xffd2ea : 0xfff1b8);
    candle.position.set(Math.cos(a) * r, topY, Math.sin(a) * r);
    sliceGroup.add(candle);
    candlesList.push(candle);
  });

  // ---- Frosting drips (4 per slice along outer edge) ----
  for (let j = 0; j < 4; j += 1) {
    const t = (j + 0.5 + (Math.random() - 0.5) * 0.35) / 4;
    const a = startAngle + t * SLICE_ANGLE;
    const dripLen = 0.22 + Math.random() * 0.46;
    const dripR = 0.072 + Math.random() * 0.042;

    const drip = new THREE.Mesh(
      new THREE.CapsuleGeometry(dripR, dripLen, 4, 8),
      dripMat
    );

    const r = CAKE_RADIUS * (0.91 + Math.random() * 0.06);
    drip.position.set(
      Math.cos(a) * r,
      CAKE_HEIGHT - dripLen / 2 - dripR,
      Math.sin(a) * r
    );
    drip.castShadow = true;
    sliceGroup.add(drip);
  }

  // ---- Small berry/sprinkle accent on top ----
  const berryColors = [0xff6b8a, 0xc0392b, 0xe74c6f, 0xff8fab];
  for (let j = 0; j < 2; j += 1) {
    const t = (j + 0.35 + Math.random() * 0.3) / 2;
    const a = startAngle + t * SLICE_ANGLE;
    const r = CAKE_RADIUS * (0.45 + Math.random() * 0.3);
    const berry = new THREE.Mesh(
      new THREE.SphereGeometry(0.1 + Math.random() * 0.06, 10, 10),
      new THREE.MeshStandardMaterial({
        color: berryColors[Math.floor(Math.random() * berryColors.length)],
        roughness: 0.35,
        metalness: 0.05
      })
    );
    berry.position.set(Math.cos(a) * r, topY + 0.08, Math.sin(a) * r);
    berry.castShadow = true;
    sliceGroup.add(berry);
  }
}

// ---------------------------------------------------------------------------
// Build cake
// ---------------------------------------------------------------------------

function buildCake(memoryTextures) {
  for (let i = 0; i < SLICE_COUNT; i += 1) {
    const startAngle = i * SLICE_ANGLE;
    const endAngle = startAngle + SLICE_ANGLE;
    const midAngle = (startAngle + endAngle) / 2;

    const sliceGroup = new THREE.Group();
    sliceGroup.userData.index = i;

    const shape = createSliceShape(startAngle, endAngle, CAKE_RADIUS);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: CAKE_HEIGHT,
      bevelEnabled: false,
      curveSegments: 36
    });

    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, CAKE_HEIGHT, 0);

    // material[0] = extruded walls (outer frosting + cut faces)
    // material[1] = top cap (after rotation & translation: the top face)
    // material[2] = bottom cap (bottom face, usually hidden by stand)
    const materials = [
      new THREE.MeshStandardMaterial({
        map: frostingTexture,
        roughness: 0.62,
        metalness: 0,
        side: THREE.DoubleSide
      }),
      new THREE.MeshStandardMaterial({
        map: topFrostingTexture,
        roughness: 0.5,
        metalness: 0
      }),
      new THREE.MeshStandardMaterial({
        map: spongeTexture,
        roughness: 0.88,
        metalness: 0,
        side: THREE.DoubleSide
      })
    ];

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sliceGroup.add(mesh);

    // Image planes on both cut faces — visible when slice is pulled out
    const imgPlanes = imagePlanesForSlice(startAngle, endAngle, memoryTextures[i]);
    imgPlanes.forEach((p) => sliceGroup.add(p));

    // Decorations belonging to this slice
    addSliceDecorations(sliceGroup, i);

    sliceGroup.userData.radialCenter = midAngle;
    sliceGroup.userData.startAngle = startAngle;
    sliceGroup.userData.endAngle = endAngle;
    sliceGroup.userData.imagePlanes = imgPlanes;
    sliceGroup.userData.state = {
      opened: false,
      lift: 0,
      closing: false,
      targetYRotation: 0
    };

    cakeRoot.add(sliceGroup);
    slices.push(sliceGroup);
  }

  // Shared centre dome removed — it appeared as an unwanted floating circle.

  // Rim of piped cream along the outer top edge — distributed to per-slice groups
  // so each blob rises together with its slice during the reveal animation.
  const rimCount = 48;
  for (let i = 0; i < rimCount; i += 1) {
    const a = (i / rimCount) * Math.PI * 2;
    const rimBlob = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xffeef7, roughness: 0.4 })
    );
    rimBlob.scale.y = 0.7;
    rimBlob.position.set(
      Math.cos(a) * CAKE_RADIUS * 0.97,
      CAKE_HEIGHT + 0.04,
      Math.sin(a) * CAKE_RADIUS * 0.97
    );
    // Assign to the slice whose angular range contains this blob
    const sliceIdx = Math.floor((i / rimCount) * SLICE_COUNT) % SLICE_COUNT;
    slices[sliceIdx].add(rimBlob);
  }
}

// ---------------------------------------------------------------------------
// Click-to-reveal interaction
// ---------------------------------------------------------------------------

const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();

// Reused each frame to avoid per-frame allocations in the animation loop
const _cameraXZ = new THREE.Vector3();

let pointerDownX = 0;
let pointerDownY = 0;
let didDrag = false;
const DRAG_THRESHOLD_SQ = 36; // 6px²
let openSlice = null; // the slice that is currently open or opening

renderer.domElement.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  pointerDownX = e.clientX;
  pointerDownY = e.clientY;
  didDrag = false;
});

window.addEventListener("pointermove", (e) => {
  const dx = e.clientX - pointerDownX;
  const dy = e.clientY - pointerDownY;
  if (dx * dx + dy * dy > DRAG_THRESHOLD_SQ) {
    didDrag = true;
  }
});

renderer.domElement.addEventListener("click", (e) => {
  if (didDrag) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouseNDC, camera);

  // Collect all meshes of unrevealed slices
  const meshTargets = [];
  for (const slice of slices) {
    if (slice.userData.state.opened) continue;
    slice.traverse((child) => {
      if (child.isMesh) meshTargets.push(child);
    });
  }

  const hits = raycaster.intersectObjects(meshTargets, false);
  if (hits.length === 0) return;

  const hitMesh = hits[0].object;

  // Map hit mesh back to its slice group
  let targetSlice = null;
  for (const slice of slices) {
    if (slice.userData.state.opened) continue;
    let found = false;
    slice.traverse((child) => {
      if (child === hitMesh) found = true;
    });
    if (found) {
      targetSlice = slice;
      break;
    }
  }

  if (!targetSlice) return;

  // Ignore clicks on a slice that is already opening or open
  if (targetSlice.userData.state.opened) return;

  // Close the previously open slice so only one is revealed at a time
  if (openSlice && openSlice !== targetSlice) {
    openSlice.userData.state.closing = true;
    if (!animatedSlices.includes(openSlice)) animatedSlices.push(openSlice);
  }

  openSlice = targetSlice;
  targetSlice.userData.state.opened = true;
  targetSlice.userData.state.closing = false;
  targetSlice.userData.state.lift = 0.001;

  // Compute the Y rotation needed so the inner cut face (at startAngle) faces the camera.
  // The true outward normal of the startAngle face is (sin(startAngle), 0, -cos(startAngle)).
  // After rotating the slice group by θ around Y that normal becomes (sin(camAngle), 0, cos(camAngle))
  // (pointing toward camera) when θ = startAngle + camAngle - π.
  // Normalise to (-π, π] to prevent spinning more than 180°.
  _cameraXZ.set(camera.position.x, 0, camera.position.z);
  if (_cameraXZ.lengthSq() < 1e-6) _cameraXZ.set(0, 0, 1);
  else _cameraXZ.normalize();
  const camAngle = Math.atan2(_cameraXZ.x, _cameraXZ.z);
  const rawRot = targetSlice.userData.startAngle + camAngle - Math.PI;
  targetSlice.userData.state.targetYRotation = Math.atan2(Math.sin(rawRot), Math.cos(rawRot));

  if (!animatedSlices.includes(targetSlice)) animatedSlices.push(targetSlice);

  const remaining = SLICE_COUNT - slices.filter((s) => s.userData.state.opened).length;
  updateStatus(
    `Memory ${targetSlice.userData.index + 1} revealed! ✨  ${remaining} slice${remaining !== 1 ? "s" : ""} left.`
  );
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

resetBtn.addEventListener("click", () => {
  group.rotation.y = 0;
  openSlice = null;

  for (const slice of slices) {
    slice.position.set(0, 0, 0);
    slice.rotation.set(0, 0, 0);
    slice.scale.setScalar(1);
    slice.userData.imagePlanes.forEach((p) => { p.material.opacity = 0; });
    slice.userData.state.opened = false;
    slice.userData.state.lift = 0;
    slice.userData.state.closing = false;
  }

  animatedSlices.length = 0;
  controls.reset();
  controls.target.set(0, 1.0, 0);
  controls.update();
  updateStatus("Cake reset — click on any slice to reveal a memory! 🎂");
});

// ---------------------------------------------------------------------------
// Slice reveal animation
// ---------------------------------------------------------------------------

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function animateSlices() {
  for (let i = animatedSlices.length - 1; i >= 0; i -= 1) {
    const slice = animatedSlices[i];
    const state = slice.userData.state;

    if (state.closing) {
      // Animate back to original position (faster return than opening)
      state.lift = Math.max(state.lift - 0.012, 0);

      if (state.lift === 0) {
        // Fully returned — reset everything
        slice.position.set(0, 0, 0);
        slice.rotation.set(0, 0, 0);
        slice.scale.setScalar(1);
        slice.userData.imagePlanes.forEach((p) => { p.material.opacity = 0; });
        state.opened = false;
        state.closing = false;
        animatedSlices.splice(i, 1);
        continue;
      }
    } else {
      if (state.lift >= 1) continue; // fully open, nothing to do

      // Slow, smooth rise — 0.009 per frame ≈ ~7 s at 60 fps
      state.lift = Math.min(state.lift + 0.009, 1);
    }

    const t = state.lift;

    const angle = slice.userData.radialCenter;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // ---- Phase 1 (t: 0 → 0.45): slide horizontally outward from cake ----
    const phase1 = Math.min(t / 0.45, 1);
    const te1 = easeOutCubic(phase1);

    // ---- Phase 2 (t: 0.45 → 1): rotate Y to face camera ----
    const phase2 = Math.max((t - 0.45) / 0.55, 0);
    const te2 = easeOutCubic(phase2);

    // Pull radially outward in the XZ plane — no vertical rise
    // Use just over the cake radius (3.55) to fully clear the slice from the cake
    const outward = 3.8 * te1;

    // Push the slice gently toward the camera (XZ direction) during phase 2
    _cameraXZ.set(camera.position.x, 0, camera.position.z);
    if (_cameraXZ.lengthSq() < 1e-6) _cameraXZ.set(0, 0, 1);
    else _cameraXZ.normalize();
    const approachDist = 2.5 * te2;

    slice.position.set(
      cosA * outward + _cameraXZ.x * approachDist,
      0,
      sinA * outward + _cameraXZ.z * approachDist
    );

    // ---- Rotate around Y so the inner cut face faces the camera ----
    // targetYRotation was computed at click time from the camera azimuth.
    const targetRot = state.targetYRotation;
    slice.rotation.set(0, targetRot * te2, 0);

    // ---- Image planes fade-in: start during Phase 1 so both cross-section ----
    // faces are visible as the slice slides clear of the cake.
    const imgPlanes = slice.userData.imagePlanes;
    if (!state.closing && phase1 > 0.55) {
      const fadeT = Math.min((phase1 - 0.55) / 0.45, 1);
      const opacity = easeOutCubic(fadeT);
      imgPlanes.forEach((p) => { p.material.opacity = opacity; });
    } else {
      imgPlanes.forEach((p) => { p.material.opacity = 0; });
    }
  }
}

// ---------------------------------------------------------------------------
// Status helper
// ---------------------------------------------------------------------------

function updateStatus(text) {
  statusText.textContent = text;
}

// ---------------------------------------------------------------------------
// Resize
// ---------------------------------------------------------------------------

function onResize() {
  camera.aspect = sceneEl.clientWidth / sceneEl.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(sceneEl.clientWidth, sceneEl.clientHeight);
}

window.addEventListener("resize", onResize);

// ---------------------------------------------------------------------------
// Candle intro sequence
// ---------------------------------------------------------------------------

function lightCandle(candleGroup) {
  const { flame, flameCore, glow } = candleGroup.userData;
  flame.visible = true;
  flameCore.visible = true;

  const startTime = performance.now();
  const duration = 450;

  function tick() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const easedT = easeOutCubic(t);
    // Brief flicker effect while the flame ignites
    const flicker = t < 0.7 ? 0.5 + 0.5 * Math.abs(Math.sin(elapsed * 0.045)) : 1;
    glow.intensity = 0.45 * easedT * flicker;
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      glow.intensity = 0.45;
    }
  }

  tick();
}

function revealMainLights(onComplete) {
  const startTime = performance.now();
  const duration = 1800;
  const overlay = document.getElementById("dark-overlay");
  overlay.style.opacity = "0";

  function tick() {
    const t = Math.min((performance.now() - startTime) / duration, 1);
    const et = easeOutCubic(t);
    ambient.intensity = 0.05 + 1.35 * et;
    keyLight.intensity = 1.7 * et;
    rimLight.intensity = 0.85 * et;
    fillLight.intensity = 0.5 * et;
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      if (onComplete) onComplete();
    }
  }

  tick();
}

function revealUI() {
  const hero = document.querySelector(".hero");
  const uiPanel = document.querySelector(".ui-panel");
  hero.classList.add("ui-revealed");
  setTimeout(() => {
    uiPanel.classList.add("ui-revealed");
  }, 300);
}

// ---------------------------------------------------------------------------
// Init & render loop
// ---------------------------------------------------------------------------

async function init() {
  const memoryTextures = await Promise.all(
    Array.from({ length: SLICE_COUNT }, (_, i) => loadMemoryTexture(i))
  );

  buildCake(memoryTextures);
  cakeRoot.position.y = -0.3;

  // Light candles one by one, then reveal scene lights and UI
  const CANDLE_INTERVAL = 300; // ms between each candle lighting
  candlesList.forEach((candle, i) => {
    setTimeout(() => lightCandle(candle), i * CANDLE_INTERVAL);
  });

  const allLitDelay = candlesList.length * CANDLE_INTERVAL + 600;
  setTimeout(() => {
    revealMainLights(() => {
      updateStatus("Click on any slice to reveal a memory! 🎂");
      revealUI();
    });
  }, allLitDelay);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  animateSlices();
  renderer.render(scene, camera);
}

init();
animate();
