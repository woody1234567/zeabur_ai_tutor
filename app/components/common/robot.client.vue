<!-- components/EyesHero.vue -->
<template>
  <section
    class="relative min-h-[60vh] lg:min-h-screen flex items-end justify-center overflow-hidden mb-6 rounded-lg"
    :class="textColorClass"
  >
    <canvas ref="canvasEl" class="absolute inset-0 w-full h-full"></canvas>

    <!-- Optional headline overlay -->
    <div class="relative z-10 px-6 text-center">
      <h1 class="text-3xl md:text-6xl font-extrabold tracking-tight">
        Meet your AI tutor
      </h1>
      <p class="mt-3 text-base md:text-lg opacity-80">
        Move your cursor — the eyes 👀 will follow.
      </p>
    </div>

    <!-- Subtle vignette -->
    <div
      class="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10"
    ></div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed } from "vue";

const props = withDefaults(defineProps<{ theme?: "light" | "dark" }>(), {
  theme: "light",
});

const textColorClass = computed(() => {
  return props.theme === "dark" ? "text-white" : "text-gray-900";
});

const canvasEl = ref<HTMLCanvasElement | null>(null);

// THREE module reference — set after dynamic import
let THREE: typeof import("three");

let renderer: any;
let scene: any;
let camera: any;
let animationId = 0;

// Eye groups
let leftEye: any;
let rightEye: any;
let leftPupil: any;
let rightPupil: any;

// Reusable objects — initialized after THREE loads
let robotModel: any;
let raycaster: any;
let mouseNDC: any;
let planeZ: any;
let hitPoint: any;

// Track state
let isPointerActive = false;
let idleTime = 0;

const EYE_RADIUS = 0.6;
const PUPIL_RADIUS = 0.18;
const IRIS_RADIUS = 0.28;
const MAX_ROTATION = 0.2;

function buildEye(): { group: any; pupil: any } {
  const group = new THREE.Group();

  const scleraGeo = new THREE.SphereGeometry(EYE_RADIUS, 48, 48);
  const scleraMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.0,
    transmission: 0,
    reflectivity: 0.2,
  });
  const sclera = new THREE.Mesh(scleraGeo, scleraMat);
  group.add(sclera);

  const corneaRadius = EYE_RADIUS + 0.03;
  const corneaGeo = new THREE.SphereGeometry(corneaRadius, 48, 48);
  const corneaMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    metalness: 0,
    transmission: 0.95,
    transparent: true,
    opacity: 0.3,
    ior: 1.38,
    thickness: 0.02,
  });
  const cornea = new THREE.Mesh(corneaGeo, corneaMat);
  group.add(cornea);

  const createCapGeo = (radius: number, capRadius: number) => {
    const theta = Math.asin(capRadius / radius);
    const geo = new THREE.SphereGeometry(
      radius,
      32,
      32,
      0,
      Math.PI * 2,
      0,
      theta
    );
    geo.rotateX(Math.PI / 2);
    geo.rotateY(-Math.PI / 2);
    return geo;
  };

  const irisSphereRadius = EYE_RADIUS + 0.01;
  const irisGeo = createCapGeo(irisSphereRadius, IRIS_RADIUS);
  const irisMat = new THREE.MeshStandardMaterial({
    color: 0x3a6ea5,
    roughness: 0.4,
    metalness: 0.0,
  });
  const iris = new THREE.Mesh(irisGeo, irisMat);
  group.add(iris);

  const ringSphereRadius = irisSphereRadius + 0.001;
  const thetaInner = Math.asin((IRIS_RADIUS * 0.9) / ringSphereRadius);
  const thetaOuter = Math.asin((IRIS_RADIUS * 1.1) / ringSphereRadius);

  const ringGeo = new THREE.SphereGeometry(
    ringSphereRadius,
    32,
    32,
    0,
    Math.PI * 2,
    thetaInner,
    thetaOuter - thetaInner
  );
  ringGeo.rotateX(Math.PI / 2);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  group.add(ring);

  const pupilSphereRadius = irisSphereRadius + 0.005;
  const pupilGeo = createCapGeo(pupilSphereRadius, PUPIL_RADIUS);
  const pupilMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.1,
  });
  const pupil = new THREE.Mesh(pupilGeo, pupilMat);
  group.add(pupil);

  return { group, pupil };
}

function onPointerMove(e: PointerEvent) {
  if (!renderer || !camera) return;
  isPointerActive = true;
  const rect = renderer.domElement.getBoundingClientRect();
  mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

function onPointerLeave() {
  isPointerActive = false;
}

function onResize() {
  if (!renderer || !camera) return;
  const el = renderer.domElement;
  const w = el.clientWidth;
  const h = el.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function updateSceneBackground() {
  const isDark = props.theme === "dark";

  if (scene && scene.userData.bgMaterial) {
    const mat = scene.userData.bgMaterial;
    if (isDark) {
      mat.uniforms.colorTop.value.setHex(0x5a2ff7);
      mat.uniforms.colorMid.value.setHex(0x1a1f2e);
      mat.uniforms.colorBottom.value.setHex(0x5a2ff7);
    } else {
      mat.uniforms.colorTop.value.setHex(0xffffff);
      mat.uniforms.colorMid.value.setHex(0xe0f2fe);
      mat.uniforms.colorBottom.value.setHex(0xbae6fd);
    }
  }

  const color = isDark ? 0x1d232a : 0xf6f7fb;
  if (renderer) renderer.setClearColor(color, 1);
}

watch(
  () => props.theme,
  () => {
    updateSceneBackground();
  }
);

function createScene(canvas: HTMLCanvasElement, GLTFLoader: any) {
  scene = new THREE.Scene();

  const bgGeometry = new THREE.SphereGeometry(50, 64, 64);
  const bgMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      colorTop: { value: new THREE.Color(0x0d1117) },
      colorMid: { value: new THREE.Color(0x1a1f2e) },
      colorBottom: { value: new THREE.Color(0xb52b12) },
    },
    vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform vec3 colorTop;
    uniform vec3 colorMid;
    uniform vec3 colorBottom;
    varying vec3 vWorldPosition;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    void main() {
      vec3 dir = normalize(vWorldPosition);
      float h = dir.y * 0.5 + 0.5;

      vec3 color;
      if (h > 0.5) {
        color = mix(colorMid, colorTop, (h - 0.5) * 2.0);
      } else {
        color = mix(colorBottom, colorMid, h * 2.0);
      }

      float n = noise(dir.xz * 8.0) * 0.03;
      color += vec3(n);

      float vignette = 1.0 - length(dir.xz) * 0.3;
      color *= vignette;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
  });
  const bgSphere = new THREE.Mesh(bgGeometry, bgMaterial);
  scene.add(bgSphere);

  (scene as any).userData = { bgMaterial };

  updateSceneBackground();

  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 3.25, 20);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    alpha: true,
  });
  renderer.setClearColor(0x000000, 0);
  onResize();

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.4);
  rim.position.set(-4, 2, -2);
  scene.add(rim);

  // Load Robot Model
  const loader = new GLTFLoader();
  loader.load("/models/robot/scene.gltf", (gltf: any) => {
    robotModel = gltf.scene;
    if (robotModel) {
      robotModel.position.y = -2;
      robotModel.rotation.y = 0;
      scene.add(robotModel);
    }

    ({ group: leftEye, pupil: leftPupil } = buildEye());
    ({ group: rightEye, pupil: rightPupil } = buildEye());

    const EYE_SCALE = 1.1;
    leftEye.scale.set(EYE_SCALE, EYE_SCALE, EYE_SCALE);
    rightEye.scale.set(EYE_SCALE, EYE_SCALE, EYE_SCALE);

    if (robotModel) {
      robotModel.add(leftEye, rightEye);
      leftEye.position.set(-1.5, 6.7, -0.7);
      rightEye.position.set(-1.5, 6.7, 0.7);
    } else {
      scene.add(leftEye, rightEye);
      leftEye.position.set(-0.7, 4.7, 1.5);
      rightEye.position.set(0.7, 4.7, 1.5);
    }
  });

  const floorGeo = new THREE.CircleGeometry(6, 64);
  const floorMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.05,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.0;
  floor.position.z = -0.5;
  scene.add(floor);
}

function lookAtPointForEye(eye: any, pupil: any, target: any) {
  const local = eye.worldToLocal(target.clone());

  const offset = new THREE.Vector2(local.x, local.y);
  offset.multiplyScalar(0.4);

  if (offset.length() > MAX_ROTATION) {
    offset.setLength(MAX_ROTATION);
  }

  const targetRotX = target.y > 0 ? -offset.y : offset.y;
  const targetRotY = target.x > 0 ? -offset.x : offset.x;

  pupil.rotation.x = THREE.MathUtils.lerp(pupil.rotation.x, targetRotX, 0.2);
  pupil.rotation.y = THREE.MathUtils.lerp(pupil.rotation.y, targetRotY, 0.2);

  const ROT_MAX = 0.5;
  eye.rotation.y = THREE.MathUtils.clamp(
    THREE.MathUtils.lerp(eye.rotation.y, offset.x * 0.5, 0.18),
    -ROT_MAX,
    ROT_MAX
  );
  eye.rotation.x = THREE.MathUtils.clamp(
    THREE.MathUtils.lerp(eye.rotation.x, offset.y * 0.5, 0.18),
    -ROT_MAX,
    ROT_MAX
  );
}

function animate() {
  animationId = requestAnimationFrame(animate);

  if (robotModel) {
    let targetBodyRot = 1.57;
    if (isPointerActive) {
      const rotOffset = mouseNDC.x * 0.5;
      targetBodyRot = 1.57 + rotOffset;
    }

    robotModel.rotation.y = THREE.MathUtils.lerp(
      robotModel.rotation.y,
      targetBodyRot,
      0.05
    );
  }

  if (!leftEye || !rightEye) return;

  let target: any;
  if (isPointerActive) {
    raycaster.setFromCamera(mouseNDC, camera);
    raycaster.ray.intersectPlane(planeZ, hitPoint);
    target = hitPoint;
    idleTime = 0;
  } else {
    idleTime += 0.016;
    const r = 0.6;
    const x = Math.cos(idleTime * 0.6) * r;
    const y = Math.sin(idleTime * 0.9) * r * 0.6;
    target = new THREE.Vector3(x, y, 0);
  }

  lookAtPointForEye(leftEye, leftPupil, target);
  lookAtPointForEye(rightEye, rightPupil, target);

  renderer.render(scene, camera);
}

function onVisibilityChange() {
  if (document.hidden) {
    cancelAnimationFrame(animationId);
  } else {
    animate();
  }
}

onMounted(async () => {
  if (!canvasEl.value) return;

  // Dynamically import Three.js — only loads when this component mounts
  const [threeModule, gltfModule] = await Promise.all([
    import("three"),
    import("three/examples/jsm/loaders/GLTFLoader"),
  ]);
  THREE = threeModule;

  // Initialize reusable objects now that THREE is available
  raycaster = new THREE.Raycaster();
  mouseNDC = new THREE.Vector2();
  planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  hitPoint = new THREE.Vector3();

  createScene(canvasEl.value, gltfModule.GLTFLoader);

  // Events
  window.addEventListener("resize", onResize, { passive: true });
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerenter", onPointerMove);
  renderer.domElement.addEventListener("pointerleave", onPointerLeave);
  document.addEventListener("visibilitychange", onVisibilityChange);

  animate();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener("resize", onResize);
  if (renderer) {
    const el = renderer.domElement;
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerenter", onPointerMove);
    el.removeEventListener("pointerleave", onPointerLeave);
  }
  document.removeEventListener("visibilitychange", onVisibilityChange);

  scene?.traverse((obj: any) => {
    if (obj.geometry) obj.geometry.dispose?.();
    const mat = obj.material;
    if (Array.isArray(mat)) mat.forEach((m: any) => m.dispose?.());
    else mat?.dispose?.();
  });
  renderer?.dispose();
});
</script>

<style scoped>
section {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
canvas {
  display: block;
}
</style>
