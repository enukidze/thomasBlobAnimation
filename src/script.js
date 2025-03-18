// Create the scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Set a larger size for the element
const WIDTH = 600;
const HEIGHT = 600;

const camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
camera.position.z = 4;

// Calculate viewport bounds based on camera FOV and position
const fov = camera.fov * (Math.PI / 180);
const height = 2 * Math.tan(fov / 2) * camera.position.z;
const width = height * camera.aspect;

const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(WIDTH, HEIGHT);
// Add some CSS to center the element
renderer.domElement.style.margin = 'auto';
renderer.domElement.style.display = 'block';
document.body.appendChild(renderer.domElement);

// Vertex Shader
const vertexShader = `
  uniform float time;
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
  
  // Include noise functions from fragment shader
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
    vec2 uv = vUv * 2.0 - 1.0;
    float dist = length(uv) * 0.8;
    
    // Create three layers of noise for more complex movement
    float baseNoise = snoise(vec2(
      uv.x * 1.2 + time * 0.15, 
      uv.y * 1.2 + time * 0.17
    )) * 0.6;
    
    float noise2 = snoise(vec2(
      uv.x * 2.0 - time * 0.12, 
      uv.y * 2.0 - time * 0.14
    )) * 0.4;
    
    float noise3 = snoise(vec2(
      uv.x * 1.5 + time * 0.08, 
      uv.y * 1.5 + time * 0.09
    )) * 0.5;
    
    float blobShape = smoothstep(1.0, 0.3, dist + baseNoise + noise2);
    
    // Define three colors
    vec3 orangeColor = vec3(1.0, 0.4, 0.1);    // Vibrant orange
    vec3 sandColor = vec3(0.95, 0.8, 0.5);     // Warm sand/beige
    vec3 greenColor = vec3(0.3, 0.85, 0.2);    // Vibrant green
    
    // Create two noise patterns for color mixing
    float colorNoise1 = snoise(vec2(
      uv.x * 1.5 + time * 0.1, 
      uv.y * 1.5 + time * 0.12
    )) * 0.5 + 0.5;
    
    float colorNoise2 = snoise(vec2(
      uv.x * 1.8 - time * 0.08, 
      uv.y * 1.8 - time * 0.1
    )) * 0.5 + 0.5;
    
    // Create smooth transitions between all three colors
    colorNoise1 = smoothstep(0.2, 0.8, colorNoise1);
    colorNoise2 = smoothstep(0.3, 0.7, colorNoise2);
    
    // Mix all three colors
    vec3 color1 = mix(orangeColor, sandColor, colorNoise1);
    vec3 finalColor = mix(color1, greenColor, colorNoise2);
    
    // Add grain
    float grain = snoise(vec2(uv.x * 250.0, uv.y * 250.0)) * 0.03;
    finalColor += vec3(grain);
    
    // Edge handling
    float edgeFade = smoothstep(0.4, 0.8, dist);
    finalColor = mix(finalColor, vec3(1.0), pow(edgeFade, 1.5));
    
    float alpha = smoothstep(0.9, 0.2, dist) * blobShape;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Create a plane geometry
const geometry = new THREE.PlaneGeometry(3, 3, 128, 128);

const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        time: {
            value: 0.0
        }
    },
    transparent: true,
    depthWrite: false,
    depthTest: false
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
    // Remove this event listener since we want fixed size
    // Alternatively, you could update it if the element needs to be responsive
});