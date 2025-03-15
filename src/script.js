// Create the scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

// Calculate viewport bounds based on camera FOV and position
const fov = camera.fov * (Math.PI / 180);
const height = 2 * Math.tan(fov / 2) * camera.position.z;
const width = height * camera.aspect;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Vertex Shader
const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader
const fragmentShader = `
  uniform float time;
  varying vec2 vUv;

  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
    
  void main() {
    vec2 uv = vUv;
    
    // Slow-moving base noise
    float baseNoise = snoise(vec2(uv.x * 2.0 + time * 0.1, uv.y * 2.0 + time * 0.15)) * 0.5 + 0.5;
    
    // Additional layer of finer, faster noise
    float detailNoise = snoise(vec2(uv.x * 4.0 - time * 0.05, uv.y * 4.0 - time * 0.075)) * 0.25;
    
    // Combine noise layers
    float combinedNoise = baseNoise + detailNoise;
    
    // New vibrant colors
    vec3 greenColor = vec3(0.2, 0.8, 0.4);    // Vibrant green
    vec3 orangeColor = vec3(1.0, 0.6, 0.2);   // Vibrant orange
    vec3 baseColor = mix(greenColor, orangeColor, combinedNoise);
    
    // Add stronger white noise
    float whiteNoise = snoise(vec2(uv.x * 1000.0, uv.y * 1000.0 + time)) * 0.03;
    baseColor += vec3(whiteNoise);
    
    // Enhanced vignette effect
    float vignette = 1.0 - smoothstep(0.5, 1.5, length(uv - 0.5) * 2.0);
    baseColor *= 0.95 + (vignette * 0.05);
    
    gl_FragColor = vec4(baseColor, 1.0);
  }



//   void main() {
//     vec2 uv = vUv;
    
//     // Create softer, larger scale base noise
//     float baseNoise = snoise(vec2(
//       uv.x * 1.5 + time * 0.05, 
//       uv.y * 1.5 + time * 0.07
//     )) * 0.5 + 0.5;
    
//     // Add multiple layers of noise at different scales for cloudlike effect
//     float noise1 = snoise(vec2(
//       uv.x * 2.0 + time * 0.03, 
//       uv.y * 2.0 + time * 0.04
//     )) * 0.25;
    
//     float noise2 = snoise(vec2(
//       uv.x * 3.0 - time * 0.02, 
//       uv.y * 3.0 - time * 0.03
//     )) * 0.125;
    
//     // Combine noises with smooth falloff
//     float combinedNoise = smoothstep(0.2, 0.8, baseNoise + noise1 + noise2);
    
//     // Softer color transition
//     vec3 greenColor = vec3(0.4, 0.85, 0.4);    // Softer green
//     vec3 creamColor = vec3(0.95, 0.92, 0.85);  // Warm cream color
    
//     // Create soft edges using distance from center
//     vec2 center = vec2(0.5, 0.5);
//     float dist = length(uv - center);
//     float softEdge = 1.0 - smoothstep(0.0, 1.0, dist * 1.5);
    
//     // Mix colors with soft edges
//     vec3 baseColor = mix(creamColor, greenColor, combinedNoise * softEdge);
    
//     // Add very fine grain for texture
//     float grain = snoise(vec2(uv.x * 200.0, uv.y * 200.0)) * 0.015;
//     baseColor += vec3(grain);
    
//     // Fade edges to white
//     vec3 white = vec3(1.0);
//     float edgeFade = smoothstep(0.4, 1.0, dist);
//     baseColor = mix(baseColor, white, edgeFade);
    
//     gl_FragColor = vec4(baseColor, 1.0);
//   }
`;

// Create a single large plane that covers the viewport
const geometry = new THREE.PlaneGeometry(width, height, 1, 1);

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    time: { value: 0.0 }
  }
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Animation Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  mesh.material.uniforms.time.value = time;
  renderer.render(scene, camera);
}
animate();

// Handle Window Resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // Update plane size
  const height = 2 * Math.tan(fov / 2) * camera.position.z;
  const width = height * camera.aspect;
  mesh.scale.set(width, height, 1);
});