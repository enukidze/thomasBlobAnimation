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
  uniform float seed;  // Add new uniform for randomization
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
  
  // Add rotation function for more complex movement
  vec2 rotate(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    mat2 m = mat2(c, -s, s, c);
    return m * v;
  }
    
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= 1.4;
    float dist = length(uv);
    
    // Add seed to time calculations for randomization
    vec2 rotUv1 = rotate(uv, (time + seed) * 0.1);
    vec2 rotUv2 = rotate(uv, -(time + seed) * 0.15 + 1.0);
    vec2 rotUv3 = rotate(uv, (time + seed) * 0.08 - 0.5);
    
    // Add seed to noise calculations
    float baseNoise = snoise(vec2(
      rotUv1.x * 0.8 + (time + seed) * 0.1, 
      rotUv1.y * 1.2 + (time + seed) * 0.15
    )) * 0.7;
    
    float noise2 = snoise(vec2(
      rotUv2.x * 1.5 + (time + seed) * 0.08, 
      rotUv2.y * 2.0 + (time + seed) * 0.12
    )) * 0.4;
    
    float noise3 = snoise(vec2(
      rotUv3.x * 2.2 - (time + seed) * 0.05, 
      rotUv3.y * 1.8 - (time + seed) * 0.07
    )) * 0.3;
    
    float noise4 = snoise(vec2(
      uv.x * 2.5 + sin((time + seed) * 0.2), 
      uv.y * 2.3 + cos((time + seed) * 0.2)
    )) * 0.25;
    
    // More complex blob shape
    float blobShape = smoothstep(1.1, 0.2, dist + baseNoise + noise2 + noise3 + noise4);
    
    // Extended color palette with more shades
    vec3 darkestGreen = vec3(0.2, 0.55, 0.1);
    vec3 darkGreen = vec3(0.25, 0.65, 0.15);
    vec3 mainGreen = vec3(0.32, 0.8, 0.22);
    vec3 lightGreen = vec3(0.4, 0.85, 0.3);
    
    vec3 darkestOrange = vec3(0.7, 0.4, 0.05);
    vec3 darkOrange = vec3(0.85, 0.5, 0.1);
    vec3 mainOrange = vec3(1.0, 0.65, 0.15);
    vec3 lightOrange = vec3(1.0, 0.75, 0.25);
    
    vec3 darkestSand = vec3(0.75, 0.65, 0.35);
    vec3 darkSand = vec3(0.85, 0.75, 0.45);
    vec3 mainSand = vec3(0.98, 0.85, 0.55);
    vec3 lightSand = vec3(1.0, 0.9, 0.65);
    
    // Multiple layers of color noise with varying patterns
    float colorNoise1 = snoise(rotUv1 * 0.6 + (time + seed) * 0.07) * 0.5 + 0.5;
    float colorNoise2 = snoise(rotUv2 * 0.9 - (time + seed) * 0.05) * 0.5 + 0.5;
    float colorNoise3 = snoise(rotUv3 * 1.2 + (time + seed) * 0.03) * 0.5 + 0.5;
    float colorNoise4 = snoise(uv * 1.5 - (time + seed) * 0.04) * 0.5 + 0.5;
    float colorNoise5 = snoise(rotate(uv, (time + seed) * 0.05) * 1.8) * 0.5 + 0.5;
    
    // Complex transitions
    colorNoise1 = smoothstep(0.3, 0.7, colorNoise1);
    colorNoise2 = smoothstep(0.4, 0.6, colorNoise2);
    colorNoise3 = smoothstep(0.45, 0.55, colorNoise3);
    colorNoise4 = smoothstep(0.35, 0.65, colorNoise4);
    colorNoise5 = smoothstep(0.25, 0.75, colorNoise5);
    
    // Multi-layered color mixing
    vec3 greenLayer = mix(darkestGreen, darkGreen, colorNoise1);
    greenLayer = mix(greenLayer, mainGreen, colorNoise2);
    greenLayer = mix(greenLayer, lightGreen, colorNoise3);
    
    vec3 orangeLayer = mix(darkestOrange, darkOrange, colorNoise2);
    orangeLayer = mix(orangeLayer, mainOrange, colorNoise3);
    orangeLayer = mix(orangeLayer, lightOrange, colorNoise4);
    
    vec3 sandLayer = mix(darkestSand, darkSand, colorNoise3);
    sandLayer = mix(sandLayer, mainSand, colorNoise4);
    sandLayer = mix(sandLayer, lightSand, colorNoise5);
    
    // Complex color blending
    vec3 color1 = mix(orangeLayer, sandLayer, 
      colorNoise1 * 0.5 + 
      colorNoise2 * 0.3 + 
      colorNoise5 * 0.2
    );
    
    vec3 finalColor = mix(color1, greenLayer, 
      colorNoise3 * 0.4 + 
      colorNoise4 * 0.3 + 
      colorNoise5 * 0.3
    );
    
    // Multi-scale grain
    float fineGrain = snoise(uv * 400.0 + (time + seed) * 0.1) * 0.12;
    float mediumGrain = snoise(rotUv1 * 200.0 - (time + seed) * 0.05) * 0.08;
    float largeGrain = snoise(rotUv2 * 100.0 + (time + seed) * 0.03) * 0.05;
    float extraGrain = snoise(rotUv3 * 150.0 - (time + seed) * 0.04) * 0.03;
    
    float grainMask = smoothstep(1.2, 0.2, dist);
    vec3 grain = vec3(max(fineGrain + mediumGrain + largeGrain + extraGrain, 0.0)) * grainMask;
    finalColor += grain;
    
    // Enhanced edge treatment
    float edgeFade = smoothstep(0.4, 1.0, dist);
    finalColor = mix(finalColor, vec3(1.0), pow(edgeFade, 1.2));
    
    float alpha = blobShape * smoothstep(1.2, 0.0, dist);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Create a wider plane geometry
const geometry = new THREE.PlaneGeometry(5, 4, 128, 128);

const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        time: { value: 0.0 },
        seed: { value: Math.random() * 1000 }  // Add random seed uniform
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