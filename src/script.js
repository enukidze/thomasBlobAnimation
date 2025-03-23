// Create the scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Use window dimensions instead of fixed size
const renderer = new THREE.WebGLRenderer({
    antialias: true
});
// Set renderer size to match window
renderer.setSize(window.innerWidth, window.innerHeight);
// Add some CSS to fill the viewport
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
document.body.appendChild(renderer.domElement);

// Camera with dynamic aspect ratio
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3;

// Calculate viewport bounds based on camera FOV and position
const fov = camera.fov * (Math.PI / 180);
const height = 2 * Math.tan(fov / 2) * camera.position.z;
const width = height * camera.aspect;

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
  uniform float seed;
  uniform float speed;
  uniform float complexity;
  uniform float colorIntensity;
  uniform float grainAmount;
  uniform float sphereEffect;
  uniform float layerCompression;
  uniform vec3 darkestGreen;
  uniform vec3 mainGreen;
  uniform vec3 darkestOrange;
  uniform vec3 mainOrange;
  uniform vec3 darkestSand;
  uniform vec3 mainSand;
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
    
    // Modify distance calculation based on sphereEffect
    float modifiedDist = mix(dist, pow(dist, 2.0 - sphereEffect), sphereEffect);
    
    // Add seed to time calculations for randomization
    vec2 rotUv1 = rotate(uv, (time + seed) * 0.1);
    vec2 rotUv2 = rotate(uv, -(time + seed) * 0.15 + 1.0);
    vec2 rotUv3 = rotate(uv, (time + seed) * 0.08 - 0.5);
    
    // Add complexity to noise calculations
    float baseNoise = snoise(vec2(
      rotUv1.x * 0.8 * complexity + (time + seed) * 0.1, 
      rotUv1.y * 1.2 * complexity + (time + seed) * 0.15
    )) * 0.7;
    
    float noise2 = snoise(vec2(
      rotUv2.x * 1.5 * complexity + (time + seed) * 0.08, 
      rotUv2.y * 2.0 * complexity + (time + seed) * 0.12
    )) * 0.4;
    
    float noise3 = snoise(vec2(
      rotUv3.x * 2.2 * complexity - (time + seed) * 0.05, 
      rotUv3.y * 1.8 * complexity - (time + seed) * 0.07
    )) * 0.3;
    
    float noise4 = snoise(vec2(
      uv.x * 2.5 * complexity + sin((time + seed) * 0.2), 
      uv.y * 2.3 * complexity + cos((time + seed) * 0.2)
    )) * 0.25;
    
    // Compress noise effects based on layerCompression
    float compressedNoise = (baseNoise + noise2 + noise3 + noise4) * (1.0 - layerCompression * 0.5);
    
    // More complex blob shape, modified for sphere effect
    float blobShape = smoothstep(
      1.1 - sphereEffect * 0.5, 
      0.2 + sphereEffect * 0.7, 
      modifiedDist + compressedNoise
    );
    
    // Use custom colors from uniforms
    vec3 darkGreen = mix(darkestGreen, mainGreen, 0.3);
    vec3 lightGreen = mix(mainGreen, vec3(1.0), 0.3);
    
    vec3 darkOrange = mix(darkestOrange, mainOrange, 0.3);
    vec3 lightOrange = mix(mainOrange, vec3(1.0), 0.3);
    
    vec3 darkSand = mix(darkestSand, mainSand, 0.3);
    vec3 lightSand = mix(mainSand, vec3(1.0), 0.3);
    
    // Compress UV coordinates for color calculations based on layerCompression
    vec2 compressedUv1 = rotUv1 * (1.0 - layerCompression * 0.3);
    vec2 compressedUv2 = rotUv2 * (1.0 - layerCompression * 0.3);
    vec2 compressedUv3 = rotUv3 * (1.0 - layerCompression * 0.3);
    
    // Multiple layers of color noise with varying patterns
    float colorNoise1 = snoise(compressedUv1 * 0.6 * complexity + (time + seed) * 0.07) * 0.5 + 0.5;
    float colorNoise2 = snoise(compressedUv2 * 0.9 * complexity - (time + seed) * 0.05) * 0.5 + 0.5;
    float colorNoise3 = snoise(compressedUv3 * 1.2 * complexity + (time + seed) * 0.03) * 0.5 + 0.5;
    float colorNoise4 = snoise(uv * (1.5 - layerCompression * 0.5) * complexity - (time + seed) * 0.04) * 0.5 + 0.5;
    float colorNoise5 = snoise(rotate(uv, (time + seed) * 0.05) * (1.8 - layerCompression * 0.6) * complexity) * 0.5 + 0.5;
    
    // Complex transitions
    float transitionSharpness = 0.2 - layerCompression * 0.1;
    colorNoise1 = smoothstep(0.5 - transitionSharpness, 0.5 + transitionSharpness, colorNoise1);
    colorNoise2 = smoothstep(0.5 - transitionSharpness, 0.5 + transitionSharpness, colorNoise2);
    colorNoise3 = smoothstep(0.5 - transitionSharpness, 0.5 + transitionSharpness, colorNoise3);
    colorNoise4 = smoothstep(0.5 - transitionSharpness, 0.5 + transitionSharpness, colorNoise4);
    colorNoise5 = smoothstep(0.5 - transitionSharpness, 0.5 + transitionSharpness, colorNoise5);
    
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
    
    // Apply color intensity
    finalColor = mix(vec3(0.5), finalColor, colorIntensity);
    
    // Multi-scale grain with adjustable amount
    float fineGrain = snoise(uv * 400.0 + (time + seed) * 0.1) * 0.12 * grainAmount;
    float mediumGrain = snoise(rotUv1 * 200.0 - (time + seed) * 0.05) * 0.08 * grainAmount;
    float largeGrain = snoise(rotUv2 * 100.0 + (time + seed) * 0.03) * 0.05 * grainAmount;
    float extraGrain = snoise(rotUv3 * 150.0 - (time + seed) * 0.04) * 0.03 * grainAmount;
    
    // Modify grain mask based on sphere effect
    float grainMask = smoothstep(1.2 - sphereEffect * 0.2, 0.2 + sphereEffect * 0.1, modifiedDist);
    vec3 grain = vec3(max(fineGrain + mediumGrain + largeGrain + extraGrain, 0.0)) * grainMask;
    finalColor += grain;
    
    // Enhanced edge treatment adjusted for sphere effect
    float edgeFade = smoothstep(0.4 - sphereEffect * 0.3, 1.0, modifiedDist);
    finalColor = mix(finalColor, vec3(1.0), pow(edgeFade, 1.2 - sphereEffect * 0.6));
    
    // Adjust alpha for more spherical shape
    float alpha = blobShape * smoothstep(1.2 - sphereEffect * 0.4, 0.0, modifiedDist);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Create a wider plane geometry
const geometry = new THREE.PlaneGeometry(5, 4, 128, 128);

// Create settings object to control with GUI
const settings = {
  speed: 1.0,
  complexity: 1.0,
  colorIntensity: 1.0,
  grainAmount: 1.0,
  // Add new sphere and layer controls
  sphereEffect: 0.0,
  layerCompression: 0.0,
  // Update ALL gradients to be different shades of orange
  gradient1Start: "#993300", // Deep burnt orange
  gradient1End: "#cc4400",   // Dark orange
  gradient2Start: "#c94d00", // Reddish orange
  gradient2End: "#ff7700",   // Vibrant medium orange
  gradient3Start: "#ff8800", // Bright orange
  gradient3End: "#ffaa33",   // Golden orange
  regenerate: function() {
    // Regenerate with a new seed
    material.uniforms.seed.value = Math.random() * 1000;
  },
  exportToHTML: function() {
    // Get current values from uniforms to ensure we use the actual values
    const currentSettings = {
      speed: material.uniforms.speed.value,
      complexity: material.uniforms.complexity.value, 
      colorIntensity: material.uniforms.colorIntensity.value,
      grainAmount: material.uniforms.grainAmount.value,
      sphereEffect: material.uniforms.sphereEffect.value,
      layerCompression: material.uniforms.layerCompression.value,
      seed: material.uniforms.seed.value,
      darkestGreen: material.uniforms.darkestGreen.value,
      mainGreen: material.uniforms.mainGreen.value,
      darkestOrange: material.uniforms.darkestOrange.value,
      mainOrange: material.uniforms.mainOrange.value,
      darkestSand: material.uniforms.darkestSand.value,
      mainSand: material.uniforms.mainSand.value
    };
    
    // Create HTML content
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported WebGL Animation</title>
  <style>
    body { margin: 0; overflow: hidden; }
    #animation-container { 
      position: relative;
      width: 100vw;
      height: 100vh;
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
  <div id="animation-container"></div>
  
  <script>
    // Create the scene, camera, and renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    
    // Use container dimensions
    const container = document.getElementById('animation-container');
    const renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    // Camera with dynamic aspect ratio
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 4;
    
    // Calculate viewport bounds based on camera FOV and position
    const fov = camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * camera.position.z;
    const width = height * camera.aspect;
    
    // Vertex Shader
    const vertexShader = \`${vertexShader}\`;
    
    // Fragment Shader
    const fragmentShader = \`${fragmentShader}\`;
    
    // Create a wider plane geometry
    const geometry = new THREE.PlaneGeometry(5, 4, 128, 128);
    
    // Create material with current settings from GUI
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0.0 },
        seed: { value: ${currentSettings.seed} },
        speed: { value: ${currentSettings.speed} },
        complexity: { value: ${currentSettings.complexity} },
        colorIntensity: { value: ${currentSettings.colorIntensity} },
        grainAmount: { value: ${currentSettings.grainAmount} },
        sphereEffect: { value: ${currentSettings.sphereEffect} },
        layerCompression: { value: ${currentSettings.layerCompression} },
        darkestGreen: { value: [${currentSettings.darkestGreen.join(',')}] },
        mainGreen: { value: [${currentSettings.mainGreen.join(',')}] },
        darkestOrange: { value: [${currentSettings.darkestOrange.join(',')}] },
        mainOrange: { value: [${currentSettings.mainOrange.join(',')}] },
        darkestSand: { value: [${currentSettings.darkestSand.join(',')}] },
        mainSand: { value: [${currentSettings.mainSand.join(',')}] }
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
      mesh.material.uniforms.time.value = time * ${currentSettings.speed};
      renderer.render(scene, camera);
    }
    animate();
    
    // Handle Window Resizing
    window.addEventListener("resize", () => {
      // Update renderer
      renderer.setSize(container.clientWidth, container.clientHeight);
      
      // Update camera aspect ratio
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    });
  </script>
</body>
</html>`;

    // Create a temporary element to copy to clipboard
    const tempElement = document.createElement('textarea');
    tempElement.value = htmlContent;
    document.body.appendChild(tempElement);
    tempElement.select();
    document.execCommand('copy');
    document.body.removeChild(tempElement);
    
    // Create and show a styled notification instead of an alert
    const notification = document.createElement('div');
    notification.textContent = 'HTML copied to clipboard!';
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '16px 32px';
    notification.style.borderRadius = '4px';
    notification.style.textAlign = 'center';
    notification.style.zIndex = '1000';
    notification.style.fontSize = '18px';
    notification.style.boxShadow = '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-in-out';
    
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
};

// Convert hex to RGB for shader
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : {r: 0, g: 0, b: 0};
}

const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        time: { value: 0.0 },
        seed: { value: Math.random() * 1000 },
        speed: { value: settings.speed },
        complexity: { value: settings.complexity },
        colorIntensity: { value: settings.colorIntensity },
        grainAmount: { value: settings.grainAmount },
        sphereEffect: { value: settings.sphereEffect },
        layerCompression: { value: settings.layerCompression },
        // Map the new gradient names to the original shader uniform names
        darkestGreen: { value: [0.2, 0.55, 0.1] },  // gradient1Start
        mainGreen: { value: [0.32, 0.8, 0.22] },    // gradient1End
        darkestOrange: { value: [0.7, 0.4, 0.05] }, // gradient2Start
        mainOrange: { value: [1.0, 0.65, 0.15] },   // gradient2End
        darkestSand: { value: [0.75, 0.65, 0.35] }, // gradient3Start
        mainSand: { value: [0.98, 0.85, 0.55] }     // gradient3End
    },
    transparent: true,
    depthWrite: false,
    depthTest: false
});

// Update initial uniform colors from settings
const updateColorUniform = (settingName, uniformName) => {
  const rgb = hexToRgb(settings[settingName]);
  material.uniforms[uniformName].value = [rgb.r, rgb.g, rgb.b];
};

// Map settings names to uniform names
updateColorUniform('gradient1Start', 'darkestGreen');
updateColorUniform('gradient1End', 'mainGreen');
updateColorUniform('gradient2Start', 'darkestOrange');
updateColorUniform('gradient2End', 'mainOrange');
updateColorUniform('gradient3Start', 'darkestSand');
updateColorUniform('gradient3End', 'mainSand');

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// First, let's clear any existing GUI to prevent duplicates
if (window.guiInstance) {
  window.guiInstance.destroy();
  window.guiInstance = null;
}

// Create the GUI
window.guiInstance = new dat.GUI();

// Position the GUI at the top-right
const guiContainer = window.guiInstance.domElement.parentElement;
guiContainer.style.position = 'absolute';
guiContainer.style.top = '0';
guiContainer.style.right = '0';
guiContainer.style.zIndex = '1000'; // Make sure GUI is above the canvas

// Shape controls
const shapeFolder = window.guiInstance.addFolder('Shape');
shapeFolder.add(settings, 'sphereEffect', 0.0, 0.5).onChange(function(value) {
  material.uniforms.sphereEffect.value = value;
});
shapeFolder.add(settings, 'layerCompression', 0.0, 1.0).onChange(function(value) {
  material.uniforms.layerCompression.value = value;
});
shapeFolder.open();

// Animation controls
const animFolder = window.guiInstance.addFolder('Animation');
animFolder.add(settings, 'speed', 0.1, 3.0).onChange(function(value) {
  material.uniforms.speed.value = value;
});
animFolder.add(settings, 'complexity', 0.1, 2.0).onChange(function(value) {
  material.uniforms.complexity.value = value;
});
animFolder.add(settings, 'colorIntensity', 0.1, 2.0).onChange(function(value) {
  material.uniforms.colorIntensity.value = value;
});
animFolder.open();

// Texture controls
const textureFolder = window.guiInstance.addFolder('Texture');
textureFolder.add(settings, 'grainAmount', 0.0, 2.0).onChange(function(value) {
  material.uniforms.grainAmount.value = value;
});
textureFolder.open();

// Color controls - simplified to basic gradient numbering
const colorFolder = window.guiInstance.addFolder('Orange Gradients');
colorFolder.addColor(settings, 'gradient1Start').name('Gradient 1 Start').onChange(function(value) {
  const rgb = hexToRgb(value);
  material.uniforms.darkestGreen.value = [rgb.r, rgb.g, rgb.b];
});
colorFolder.addColor(settings, 'gradient1End').name('Gradient 1 End').onChange(function(value) {
  const rgb = hexToRgb(value);
  material.uniforms.mainGreen.value = [rgb.r, rgb.g, rgb.b];
});
colorFolder.addColor(settings, 'gradient2Start').name('Gradient 2 Start').onChange(function(value) {
  const rgb = hexToRgb(value);
  material.uniforms.darkestOrange.value = [rgb.r, rgb.g, rgb.b];
});
colorFolder.addColor(settings, 'gradient2End').name('Gradient 2 End').onChange(function(value) {
  const rgb = hexToRgb(value);
  material.uniforms.mainOrange.value = [rgb.r, rgb.g, rgb.b];
});
colorFolder.addColor(settings, 'gradient3Start').name('Gradient 3 Start').onChange(function(value) {
  const rgb = hexToRgb(value);
  material.uniforms.darkestSand.value = [rgb.r, rgb.g, rgb.b];
});
colorFolder.addColor(settings, 'gradient3End').name('Gradient 3 End').onChange(function(value) {
  const rgb = hexToRgb(value);
  material.uniforms.mainSand.value = [rgb.r, rgb.g, rgb.b];
});
colorFolder.open();

// Regenerate button
window.guiInstance.add(settings, 'regenerate').name('New Random Seed');

// Add the export button to the GUI
window.guiInstance.add(settings, 'exportToHTML').name('Export to HTML');

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    mesh.material.uniforms.time.value = time * settings.speed;
    renderer.render(scene, camera);
}
animate();

// Handle Window Resizing
window.addEventListener("resize", () => {
    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});