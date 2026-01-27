"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface Visualization3DProps {
  audioAnalyser?: AnalyserNode;
  isAudioPlaying: boolean;
  rotationSpeed?: number;
  sphereResolution?: number;
  distortionFactor?: number;
  audioReactivity?: number;
}

export default function Visualization3D({
  audioAnalyser,
  isAudioPlaying,
  rotationSpeed = 1.0,
  sphereResolution = 32,
  distortionFactor = 1.0,
  audioReactivity = 1.0,
}: Visualization3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const sphereGroupRef = useRef<THREE.Group | null>(null);
  const uniformsRef = useRef<any>(null);
  const animationIdRef = useRef<number | null>(null);
  const frequencyDataRef = useRef<Uint8Array | null>(null);

  // Initialize frequency data array
  useEffect(() => {
    frequencyDataRef.current = new Uint8Array(128);
  }, []);
  const rotationSpeedRef = useRef(rotationSpeed);
  const distortionRef = useRef(distortionFactor);
  const reactivityRef = useRef(audioReactivity);

  // Update refs when props change
  useEffect(() => {
    rotationSpeedRef.current = rotationSpeed;
  }, [rotationSpeed]);

  useEffect(() => {
    distortionRef.current = distortionFactor;
    reactivityRef.current = audioReactivity;

    if (uniformsRef.current) {
      uniformsRef.current.u_reactivity.value = audioReactivity;
      uniformsRef.current.u_distortion.value = distortionFactor;
    }
  }, [audioReactivity, distortionFactor]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const clock = new THREE.Clock();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    camera.position.z = 3;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.enableZoom = true;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;

    // Set bounds to keep the anomaly centered, even on different screen sizes
    (controls as any).enablePan = false;
    (controls as any).target.set(0, 0, 0);
    (controls as any).autoRotate = true;
    (controls as any).autoRotateSpeed = 0.5;
    controls.update();

    const geometry = new THREE.SphereGeometry(
      1,
      sphereResolution,
      sphereResolution
    );

    const uniforms = {
      u_time: { type: "f", value: 1.0 },
      u_frequency: { type: "fv1", value: new Array(128).fill(0) },
      u_reactivity: { type: "f", value: audioReactivity },
      u_distortion: { type: "f", value: distortionFactor },
      u_glowColor: { type: "v3", value: new THREE.Color(0xff4e42) },
    };

    // Noise function for more organic distortion
    const noiseFunction = `
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        ${noiseFunction}

        uniform float u_time;
        uniform float u_reactivity;
        uniform float u_distortion;
        uniform float u_frequency[128];

        varying vec3 v_normal;
        varying vec3 v_position;

        void main() {
          v_normal = normalize(normalMatrix * normal);

          float slowTime = u_time * 0.3;
          vec3 pos = position;

          // Audio-based distortion
          float lowFreq = 0.0;
          for(int i = 0; i < 5; i++) lowFreq += u_frequency[i];
          lowFreq = (lowFreq / 5.0) / 255.0;

          float midFreq = 0.0;
          for(int i = 5; i < 30; i++) midFreq += u_frequency[i];
          midFreq = (midFreq / 25.0) / 255.0;

          float highFreq = 0.0;
          for(int i = 30; i < 64; i++) highFreq += u_frequency[i];
          highFreq = (highFreq / 34.0) / 255.0;

          // Noise distortion for organic effect
          float noise = snoise(vec3(position.x * 0.5, position.y * 0.5, position.z * 0.5 + slowTime));

          // Combine all distortions
          float displacement =
            noise * 0.2 * u_distortion +
            lowFreq * 0.3 * u_reactivity * u_distortion +
            midFreq * 0.2 * u_reactivity * u_distortion +
            highFreq * 0.1 * u_reactivity * u_distortion;

          pos += normal * displacement;

          v_position = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform vec3 u_glowColor;
        varying vec3 v_normal;
        varying vec3 v_position;

        void main() {
          vec3 viewDirection = normalize(cameraPosition - v_position);
          float fresnel = 1.0 - max(0.0, dot(viewDirection, v_normal));
          fresnel = pow(fresnel, 2.0);

          float pulse = 0.8 + 0.2 * sin(u_time * 2.0);

          vec3 finalColor = u_glowColor * fresnel * pulse;

          float alpha = fresnel * 0.7;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      wireframe: true,
    });

    // Create a group to ensure the sphere stays centered
    const sphereGroup = new THREE.Group();
    const sphere = new THREE.Mesh(geometry, material);
    sphereGroup.add(sphere); // Add sphere to group
    scene.add(sphereGroup); // Add group to scene

    // Add initial rotation to make it more visible
    sphereGroup.rotation.x = 0.1;
    sphereGroup.rotation.y = 0.1;

    // Update ref to point to the sphere itself, not the group
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    sphereRef.current = sphere; // Keep reference to the sphere mesh
    sphereGroupRef.current = sphereGroup;
    uniformsRef.current = uniforms;

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (uniformsRef.current) {
        uniformsRef.current.u_time.value += 0.05;
      }

      // Debug log to verify animation loop is running
      // console.log('Animation frame running');

      // Rotate the sphere group to ensure it stays centered while rotating
      // Simplified condition for testing
      if (sphereGroupRef.current || sphereRef.current) {
        // Always apply rotation regardless of audio
        let audioRotationFactor = 1;

        // Calculate audio level for rotation if audio is playing
        if (isAudioPlaying && audioAnalyser) {
          const tempData = new Uint8Array(audioAnalyser.frequencyBinCount);
          audioAnalyser.getByteFrequencyData(tempData);
          let sum = 0;
          for (let i = 0; i < tempData.length; i++) {
            sum += tempData[i] || 0;
          }
          const avgLevel = sum / tempData.length / 255; // Normalize to 0-1
          audioRotationFactor = 1 + avgLevel * reactivityRef.current;
        }

        // Base rotation speed with time-based component as fallback - increased for more visible rotation
        const dt = clock.getDelta();
        const baseRotationSpeed = 0.5 * rotationSpeedRef.current * dt; // radians per second
        const timeBasedRotation =
          0.05 * Math.sin(uniformsRef.current.u_time.value * 0.5) * dt;
        const rotationSpeedWithAudio =
          baseRotationSpeed * audioRotationFactor + timeBasedRotation;

        // Apply rotation to the parent group to ensure centered rotation
        // Also apply directly to sphere as fallback
        // console.log('Applying rotation:', rotationSpeedWithAudio);
        const targetGroup = sphereGroupRef.current || sphereRef.current?.parent;
        if (targetGroup) {
          targetGroup.rotation.y += rotationSpeedWithAudio;
          targetGroup.rotation.x += rotationSpeedWithAudio * 0.3;
          targetGroup.rotation.z += rotationSpeedWithAudio * 0.2;
        }
      }

      if (isAudioPlaying && audioAnalyser && uniformsRef.current && frequencyDataRef.current) {
        audioAnalyser.getByteFrequencyData(frequencyDataRef.current as any);
        for (let i = 0; i < 128; i++) {
          uniformsRef.current.u_frequency.value[i] =
            (frequencyDataRef.current[i] || 0) / 255.0;
        }
        uniformsRef.current.u_reactivity.value = reactivityRef.current;
        uniformsRef.current.u_distortion.value = distortionRef.current;

        const avgFreq =
          frequencyDataRef.current.reduce((sum, val) => sum + val, 0) / 128;
        const glowIntensity = avgFreq / 255.0;
        const color = new THREE.Color();
        color.setHSL(0.0, 1.0, 0.5 + glowIntensity * 0.3);
        uniformsRef.current.u_glowColor.value.copy(color);
      } else if (uniformsRef.current) {
        const timeFactor =
          Math.sin(uniformsRef.current.u_time.value * 0.1) * 0.5 + 0.5;
        const color = new THREE.Color();
        color.setHSL(0.0, 1.0, 0.5 + timeFactor * 0.1);
        uniformsRef.current.u_glowColor.value.copy(color);
        for (let i = 0; i < 128; i++) {
          uniformsRef.current.u_frequency.value[i] = 0;
        }
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Ensure camera is looking at center of scene (0,0,0) regardless of screen size
      // Removed camera.lookAt to allow manual control
      // camera.lookAt(0, 0, 0);

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const rect = container.getBoundingClientRect();
      const width = rect.width || container.clientWidth || window.innerWidth;
      const height =
        rect.height || container.clientHeight || window.innerHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
      if (controlsRef.current) {
        (controlsRef.current as any).target.set(0, 0, 0);
        controlsRef.current.update();
      }
    };
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      geometry.dispose();
      material.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
