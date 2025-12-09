<!-- components/EyesHero.vue -->
<template>
  <section
    class="relative min-h-[60vh] lg:min-h-screen flex items-end justify-center overflow-hidden mb-6 rounded-lg"
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
import { onMounted, onBeforeUnmount, ref } from "vue";
import * as THREE from "three";
// @ts-ignore
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const canvasEl = ref<HTMLCanvasElement | null>(null);

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let controls: any;
let animationId = 0;

// Eye groups
let leftEye!: THREE.Group;
let rightEye!: THREE.Group;
let leftPupil!: THREE.Mesh;
let rightPupil!: THREE.Mesh;

// Reusable objects
let robotModel: THREE.Group | undefined;
const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();
const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // z=0 plane
const hitPoint = new THREE.Vector3();

// Track state
let isPointerActive = false;
let idleTime = 0;

// Eyeball/pupil sizing helpers
// These values control the relative sizes of the eye components.
const EYE_RADIUS = 0.6; // Radius of the main eyeball sphere
const PUPIL_RADIUS = 0.18; // Radius of the pupil (black center)
const IRIS_RADIUS = 0.28; // Radius of the iris (colored part)

// MAX_ROTATION clamps the pupil's movement to ensure it stays within the eye's bounds
// and doesn't rotate too far off the iris surface.
// Angle ~ 0.04/0.6 = 0.067 rad (approx linear calculation).
// Tweaked to 0.2 to allow natural looking range without clipping.
const MAX_ROTATION = 0.2;

/**
 * buildEye
 * Constructs a complex eye group with layers for realism:
 * 1. Sclera: The white outer sphere.
 * 2. Cornea: A slightly larger, transparent sphere with high specular reflection.
 * 3. Iris: A spherical cap (curved disk) representing the colored eye part.
 * 4. Pupil: A smaller spherical cap sitting on the iris.
 * 5. Occlusion Ring: A subtle shadow ring around the iris edge.
 *
 * All components are "conformal" - they follow the curve of the main sphere.
 */
function buildEye(): { group: THREE.Group; pupil: THREE.Mesh } {
  const group = new THREE.Group();

  // 1. Sclera (White Sphere)
  const scleraGeo = new THREE.SphereGeometry(EYE_RADIUS, 48, 48);
  const scleraMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.25, // slightly glossier
    metalness: 0.0,
    transmission: 0,
    reflectivity: 0.2,
  });
  const sclera = new THREE.Mesh(scleraGeo, scleraMat);
  group.add(sclera);

  // 2. Cornea (Clear bulged sphere over everything)
  // Make it large enough to cover the iris/pupil layers
  const corneaRadius = EYE_RADIUS + 0.03; // 0.63
  const corneaGeo = new THREE.SphereGeometry(corneaRadius, 48, 48);
  const corneaMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    metalness: 0,
    transmission: 0.95, // more transparent
    transparent: true,
    opacity: 0.3,
    ior: 1.38,
    thickness: 0.02,
  });
  const cornea = new THREE.Mesh(corneaGeo, corneaMat);
  group.add(cornea);

  // Helper to create spherical caps (curved disks) facing +Z.
  // Standard SphereGeometry creates a sphere. By using phi/theta start/lengths,
  // we can create just a "cap" (slice) of the sphere.
  //
  // capRadius: The radius of the circular opening of the cap (2D radius of iris/pupil).
  // radius: The radius of the underlying sphere (EYE_RADIUS + layer offset).
  const createCapGeo = (radius: number, capRadius: number) => {
    // Calculat theta angle needed to create a cap of specific 2D radius
    // sin(theta) = opposite/hypotenuse = capRadius/radius
    const theta = Math.asin(capRadius / radius);
    const geo = new THREE.SphereGeometry(
      radius,
      32,
      32,
      0,
      Math.PI * 2, // phiLength (full circle around Y)
      0,
      theta // thetaLength (arc down from North Pole)
    );
    // Rotate the cap so it faces the front (+Z) instead of Up (+Y)
    geo.rotateX(Math.PI / 2); // North pole points to +Z
    geo.rotateY(-Math.PI / 2); // Correct orientation if needed for texture mapping
    return geo;
  };

  // 3. Iris (Colored Cap)
  // Layer it slightly above sclera
  const irisSphereRadius = EYE_RADIUS + 0.01;
  const irisGeo = createCapGeo(irisSphereRadius, IRIS_RADIUS);
  const irisMat = new THREE.MeshStandardMaterial({
    color: 0x3a6ea5,
    roughness: 0.4,
    metalness: 0.0,
  });
  const iris = new THREE.Mesh(irisGeo, irisMat);
  group.add(iris);

  // 4. Occlusion Ring (Dark Band around Iris edge)
  // We can make a slightly larger cap with a hole? No, just a slightly larger black cap underneath?
  // Or a ring texture? Let's use a slightly larger cap behind the iris but larger radius?
  // Actually, original was a "RingGeometry" on top.
  // Let's make a cap that is slightly larger than Iris, black, and sit just below or above?
  // Let's try a "Ring" implementation using a spherical band.
  // Sphere spanning from theta_inner to theta_outer.
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

  // 5. Pupil (Black Cap)
  // Layer above Iris
  const pupilSphereRadius = irisSphereRadius + 0.005; // 0.615
  const pupilGeo = createCapGeo(pupilSphereRadius, PUPIL_RADIUS);
  const pupilMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.1,
  });
  const pupil = new THREE.Mesh(pupilGeo, pupilMat);
  // Pupil is NOT added to group directly if we want to rotate it independently around center?
  // Actually, if we add it to group, we rotate the pupil mesh itself.
  // Since the geometry is centered at (0,0,0), rotating the mesh rotates the cap around the center.
  group.add(pupil);

  return { group, pupil };
}

function clampOffset(vec: THREE.Vector3, maxLen: number) {
  const len = Math.hypot(vec.x, vec.y);
  if (len > maxLen && len > 0) {
    const s = maxLen / len;
    // function clampOffset end
  }
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

function createScene(canvas: HTMLCanvasElement) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf6f7fb);

  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 10, 30); // Moved back slightly to see the whole robot

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    alpha: true, // Enable transparency for the canvas
  });
  renderer.setClearColor(0x000000, 0); // Transparent background
  onResize();

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.8);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.4);
  rim.position.set(-4, 2, -2);
  scene.add(rim);

  // Load Robot Model asynchronously
  // The logic inside handles setup once the model is loaded.
  const loader = new GLTFLoader();
  loader.load("/models/robot/scene.gltf", (gltf: any) => {
    robotModel = gltf.scene;
    // Adjust scale and position based on typical model sizes; may need tuning
    // robotModel.scale.set(1.5, 1.5, 1.5);
    if (robotModel) {
      robotModel.position.y = -2; // Move down to center the face
      robotModel.rotation.y = 0; // Initial rotation (facing forward?)
      scene.add(robotModel);
    }

    // Create Eyes and attach to robot or scene
    // Because the robot might have its own transforms, let's add eyes to the scene for now
    // and position them where the robot's eyes likely are.

    ({ group: leftEye, pupil: leftPupil } = buildEye());
    ({ group: rightEye, pupil: rightPupil } = buildEye());

    // Scale eyes down to fit the robot face (assuming robot head is roughly human-sized scaled up)
    const EYE_SCALE = 1.1;
    leftEye.scale.set(EYE_SCALE, EYE_SCALE, EYE_SCALE);
    rightEye.scale.set(EYE_SCALE, EYE_SCALE, EYE_SCALE);

    // Attach eyes to the robot model so they rotate with it
    if (robotModel) {
      robotModel.add(leftEye, rightEye);

      // Calculated local positions to match previous world positions roughly
      // World (-0.7, 4.7, 1.5) -> Local (-1.5, 6.7, -0.7)
      // World (0.7, 4.7, 1.5) -> Local (-1.5, 6.7, 0.7)
      leftEye.position.set(-1.5, 6.7, -0.7);
      rightEye.position.set(-1.5, 6.7, 0.7);
    } else {
      // Fallback if robot model failed to load for some reason (unlikely here)
      scene.add(leftEye, rightEye);
      leftEye.position.set(-0.7, 4.7, 1.5);
      rightEye.position.set(0.7, 4.7, 1.5);
    }
  });

  // Soft floor to ground the scene visually
  // (Optional: we can keep or remove the floor if the classroom has one,
  // but let's keep it for now or make it more transparent if needed)
  const floorGeo = new THREE.CircleGeometry(6, 64);
  const floorMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.05,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.0; // aligned with robot feet
  floor.position.z = -0.5;
  scene.add(floor);

  // // Grid Helper
  // const gridHelper = new THREE.GridHelper(20, 20);
  // gridHelper.position.y = -2.0;
  // scene.add(gridHelper);

  // // axis helper
  // const axesHelper = new THREE.AxesHelper(5);
  // scene.add(axesHelper);
}

/**
 * lookAtPointForEye
 * Calculates rotation for the pupil and the eye group to track a target point.
 *
 * @param eye - The entire eye group (contains sclera, iris, pupil etc)
 * @param pupil - The pupil mesh (child of eye group)
 * @param target - 3D point in world space to look at
 */
function lookAtPointForEye(
  eye: THREE.Group,
  pupil: THREE.Mesh,
  target: THREE.Vector3
) {
  const local = eye.worldToLocal(target.clone());

  // We mapped target to local space.
  // We want to calculate rotation angles for the pupil.
  // local.x maps to Yaw (Rotation Y). local.y maps to Pitch (Rotation X).
  // Note: +X is right, requires negative rotation around Y to face right?
  // Wait, Right Hand Rule: Thumb +Y, fingers curl +Z -> +X.
  // Rotate around +Y: +Z moves to +X. So positive rotation Y looks Right.
  // Let's just use linear approximation for small angles.

  const offset = new THREE.Vector2(local.x, local.y);

  // Scale down sensitivity
  offset.multiplyScalar(0.4);

  // Clamp magnitude
  if (offset.length() > MAX_ROTATION) {
    offset.setLength(MAX_ROTATION);
  }

  // Animate pupil rotation
  // We rotate the pupil MESH.
  // Axis X rotation controls Up/Down (Y). +X rotation looks DOWN. -X rotation looks UP.
  // Axis Y rotation controls Left/Right (X). +Y rotation looks RIGHT. -Y rotation looks LEFT.
  // Target Y > 0 (Up) -> Need Negative X rotation.
  // Target X > 0 (Right) -> Need Positive Y rotation.

  const targetRotX = target.y > 0 ? -offset.y : offset.y;
  const targetRotY = target.x > 0 ? -offset.x : offset.x;

  pupil.rotation.x = THREE.MathUtils.lerp(pupil.rotation.x, targetRotX, 0.2);
  pupil.rotation.y = THREE.MathUtils.lerp(pupil.rotation.y, targetRotY, 0.2);

  // Slight eyeball rotation (the whole group)
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

/**
 * animate
 * Main render loop. Handles interaction and physics simulation logic.
 */
function animate() {
  animationId = requestAnimationFrame(animate);

  if (controls) controls.update();

  // Robot Body Rotation
  if (robotModel) {
    let targetBodyRot = 1.57; // Base rotation (PI/2)
    if (isPointerActive) {
      // Map mouseNDC.x (-1 to 1) to a small rotation offset
      // e.g. -0.5 to 0.5 radians
      const rotOffset = mouseNDC.x * 0.5;
      targetBodyRot = 1.57 + rotOffset;
    }

    // Smoothly interpolate current rotation to target
    // Lower factor = slower, lazier movement
    robotModel.rotation.y = THREE.MathUtils.lerp(
      robotModel.rotation.y,
      targetBodyRot,
      0.05
    );
  }

  // Ensure eyes exist before trying to move them
  if (!leftEye || !rightEye) return;

  // Determine where to look
  // raycaster + planeZ calculates where the mouse ray hits the Z=0 plane (screen depth)
  let target: THREE.Vector3;
  if (isPointerActive) {
    raycaster.setFromCamera(mouseNDC, camera);
    raycaster.ray.intersectPlane(planeZ, hitPoint);
    target = hitPoint;
    idleTime = 0; // Reset idle timer when user is active
  } else {
    // Idle Animation:
    // If user interacts, pupil tracks mouse.
    // If idle, pupil wanders slowly in a small figure-8 or circle to feel alive.
    idleTime += 0.016;
    const r = 0.6; // radius of wandering
    const x = Math.cos(idleTime * 0.6) * r;
    const y = Math.sin(idleTime * 0.9) * r * 0.6;
    target = new THREE.Vector3(x, y, 0);
  }

  // Update both eyes to look at the calculated target
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

onMounted(() => {
  if (!canvasEl.value) return;
  createScene(canvasEl.value);

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

  // Dispose
  scene?.traverse((obj: any) => {
    if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose?.();
    const mat = (obj as THREE.Mesh).material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose?.());
    else (mat as THREE.Material)?.dispose?.();
  });
  renderer?.dispose();
});
</script>

<style scoped>
section {
  /* Smoothens the canvas edges on some displays */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
canvas {
  display: block;
}
</style>
