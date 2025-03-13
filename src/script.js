// Create the scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

// Calculate viewport bounds based on camera FOV and position
const fov = camera.fov * (Math.PI / 180); // Convert to radians
const bounds = {
  y: Math.tan(fov / 2) * camera.position.z, // height = tan(fov/2) * distance
  x: Math.tan(fov / 2) * camera.position.z * camera.aspect // width = height * aspect ratio
};

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Vertex Shader
const vertexShader = `
  uniform float time;
  uniform float impact;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float wobble = impact * 0.5 * sin(time * 10.0);
    pos.x += sin(time + pos.y * 3.0) * (0.2 + wobble);
    pos.y += cos(time + pos.x * 3.0) * (0.2 + wobble);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment Shader
const fragmentShader = `
  uniform float time;
  uniform float impact;
  varying vec2 vUv;
  void main() {
    vec3 color = vec3(vUv, abs(sin(time)));
    color += vec3(impact * 0.3);
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Shader material with impact uniform
const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    time: { value: 0.0 },
    impact: { value: 0.0 }
  }
});

// Create Geometry & Meshes
const geometry = new THREE.SphereGeometry(1.5, 32, 32);
const mesh1 = new THREE.Mesh(geometry, shaderMaterial.clone());
const mesh2 = new THREE.Mesh(geometry, shaderMaterial.clone());
const mesh3 = new THREE.Mesh(geometry, shaderMaterial.clone());

scene.add(mesh1, mesh2, mesh3);
mesh2.position.set(2, 2, 0);
mesh3.position.set(-2, -2, 0);

// Animation Setup
const clock = new THREE.Clock();
const spheres = [
  { mesh: mesh1, velocity: { x: 0.05, y: 0.03 }, impactDecay: 0.0 },
  { mesh: mesh2, velocity: { x: -0.04, y: 0.05 }, impactDecay: 0.0 },
  { mesh: mesh3, velocity: { x: 0.03, y: -0.04 }, impactDecay: 0.0 }
];

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  spheres.forEach(sphere => {
    sphere.mesh.material.uniforms.time.value = time;
    sphere.impactDecay *= 0.95;
    sphere.mesh.material.uniforms.impact.value = sphere.impactDecay;
    sphere.mesh.rotation.y += 0.005;
    sphere.mesh.rotation.x += 0.003;
    sphere.mesh.position.x += sphere.velocity.x;
    sphere.mesh.position.y += sphere.velocity.y;

    // Check wall collisions
    const radius = 1.5;
    if (Math.abs(sphere.mesh.position.x) > bounds.x - radius) {
      sphere.velocity.x *= -1;
      sphere.impactDecay = 1.0;
      sphere.mesh.position.x = (bounds.x - radius) * Math.sign(sphere.mesh.position.x);
    }
    if (Math.abs(sphere.mesh.position.y) > bounds.y - radius) {
      sphere.velocity.y *= -1;
      sphere.impactDecay = 1.0;
      sphere.mesh.position.y = (bounds.y - radius) * Math.sign(sphere.mesh.position.y);
    }
  });

  // Check sphere-to-sphere collisions
  for (let i = 0; i < spheres.length; i++) {
    for (let j = i + 1; j < spheres.length; j++) {
      const sphere1 = spheres[i];
      const sphere2 = spheres[j];
      const dx = sphere2.mesh.position.x - sphere1.mesh.position.x;
      const dy = sphere2.mesh.position.y - sphere1.mesh.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 3) {
        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = 3 - distance;
        sphere1.mesh.position.x -= (overlap / 2) * nx;
        sphere1.mesh.position.y -= (overlap / 2) * ny;
        sphere2.mesh.position.x += (overlap / 2) * nx;
        sphere2.mesh.position.y += (overlap / 2) * ny;

        // Swap velocities
        [sphere1.velocity, sphere2.velocity] = [sphere2.velocity, sphere1.velocity];

        sphere1.impactDecay = 1.0;
        sphere2.impactDecay = 1.0;
      }
    }
  }

  renderer.render(scene, camera);
}
animate();

// Handle Window Resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
