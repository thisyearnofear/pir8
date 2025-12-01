"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const MusicPlayer = () => {
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  // Refs for all the DOM elements that the script interacts with
  const loadingOverlayRef = useRef<HTMLDivElement>(null);
  const preloaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const timestampRef = useRef<HTMLDivElement>(null);
  const stabilityBarRef = useRef<HTMLDivElement>(null);
  const stabilityValueRef = useRef<HTMLSpanElement>(null);
  const massValueRef = useRef<HTMLSpanElement>(null);
  const energyValueRef = useRef<HTMLSpanElement>(null);
  const varianceValueRef = useRef<HTMLSpanElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const peakValueRef = useRef<HTMLSpanElement>(null);
  const amplitudeValueRef = useRef<HTMLSpanElement>(null);
  const phaseValueRef = useRef<HTMLSpanElement>(null);
  const rotationSliderRef = useRef<HTMLInputElement>(null);
  const rotationValueRef = useRef<HTMLSpanElement>(null);
  const resolutionSliderRef = useRef<HTMLInputElement>(null);
  const resolutionValueRef = useRef<HTMLSpanElement>(null);
  const distortionSliderRef = useRef<HTMLInputElement>(null);
  const distortionValueRef = useRef<HTMLSpanElement>(null);
  const reactivitySliderRef = useRef<HTMLInputElement>(null);
  const reactivityValueRef = useRef<HTMLSpanElement>(null);
  const resetBtnRef = useRef<HTMLButtonElement>(null);
  const analyzeBtnRef = useRef<HTMLButtonElement>(null);
  const terminalContentRef = useRef<HTMLDivElement>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const fileBtnRef = useRef<HTMLButtonElement>(null);
  const fileLabelRef = useRef<HTMLDivElement>(null);
  const sensitivitySliderRef = useRef<HTMLInputElement>(null);
  const sensitivityValueRef = useRef<HTMLSpanElement>(null);
  const demoTrackButtonsRef = useRef<HTMLDivElement>(null);
  const controlPanelRef = useRef<HTMLDivElement>(null);
  const controlPanelHandleRef = useRef<HTMLSpanElement>(null);
  const spectrumAnalyzerRef = useRef<HTMLDivElement>(null);
  const spectrumHandleRef = useRef<HTMLSpanElement>(null);
  const circularCanvasRef = useRef<HTMLCanvasElement>(null);
  const floatingParticlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Capture ref values for cleanup
    const rotationSlider = rotationSliderRef.current;
    const resolutionSlider = resolutionSliderRef.current;
    const distortionSlider = distortionSliderRef.current;
    const reactivitySlider = reactivitySliderRef.current;
    const resetBtn = resetBtnRef.current;
    const analyzeBtn = analyzeBtnRef.current;
    const fileBtn = fileBtnRef.current;
    const audioFileInput = audioFileInputRef.current;
    const audioPlayer = audioPlayerRef.current;
    const threeContainer = threeContainerRef.current;

    let animationFrameId: number;

    const setupExpandingCirclesPreloader = () => {
      const canvasEl = preloaderCanvasRef.current;
      if (!canvasEl) return;
      const ctx = canvasEl.getContext("2d") as CanvasRenderingContext2D;
      const centerX = canvasEl.width / 2;
      const centerY = canvasEl.height / 2;
      let time = 0;
      let lastTime = 0;
      const maxRadius = 80;
      const circleCount = 5;
      const dotCount = 24;

      function animate(timestamp: number) {
        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        time += deltaTime * 0.001;
        ctx.clearRect(0, 0, canvasEl!.width, canvasEl!.height);
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 78, 66, 0.9)";
        ctx.fill();
        for (let c = 0; c < circleCount; c++) {
          const circlePhase = (time * 0.3 + c / circleCount) % 1;
          const radius = circlePhase * maxRadius;
          const opacity = 1 - circlePhase;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 78, 66, ${opacity * 0.2})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          for (let i = 0; i < dotCount; i++) {
            const angle = (i / dotCount) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            const size = 2 * (1 - circlePhase * 0.5);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = `rgba(255, 78, 66, ${opacity * 0.1})`;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 78, 66, ${opacity * 0.9})`;
            ctx.fill();
          }
        }
        if (
          loadingOverlayRef.current &&
          loadingOverlayRef.current.style.display !== "none"
        ) {
          animationFrameId = requestAnimationFrame(animate);
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    setupExpandingCirclesPreloader();

    let audioContext: AudioContext | null = null;
    let audioAnalyser: AnalyserNode | null = null;
    let audioSource: MediaElementAudioSourceNode | null = null;
    let audioData: Uint8Array;
    let frequencyData: Uint8Array;
    let audioReactivity = 1.0;
    let isAudioInitialized = false;
    let isAudioPlaying = false;

    const initAudio = () => {
      if (isAudioInitialized) return true;
      try {
        audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        audioAnalyser = audioContext.createAnalyser();
        audioAnalyser.fftSize = 2048;
        audioAnalyser.smoothingTimeConstant = 0.8;
        audioData = new Uint8Array(audioAnalyser.frequencyBinCount);
        frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
        audioAnalyser.connect(audioContext.destination);
        isAudioInitialized = true;
        addTerminalMessage("AUDIO ANALYSIS SYSTEM INITIALIZED.");
        showNotification("AUDIO ANALYSIS SYSTEM ONLINE");
        return true;
      } catch (error) {
        console.error("Audio initialization error:", error);
        addTerminalMessage("ERROR: AUDIO SYSTEM INITIALIZATION FAILED.");
        showNotification("AUDIO SYSTEM ERROR");
        return false;
      }
    };

    const ensureAudioContextStarted = () => {
      if (audioContext && audioContext.state === "suspended") {
        audioContext.resume().then(() => {
          console.log("AudioContext resumed successfully");
          addTerminalMessage("AUDIO CONTEXT RESUMED.");
        });
      }
    };

    const loadAudio = (url: string) => {
      if (!initAudio()) return;
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = "";
        if (audioSource) {
          audioSource.disconnect();
        }
      }

      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = url;
        audioPlayerRef.current.crossOrigin = "anonymous";
        audioPlayerRef.current.loop = true;

        const onCanPlay = () => {
          if (audioContext && audioPlayerRef.current && !audioSource) {
            audioSource = audioContext.createMediaElementSource(
              audioPlayerRef.current
            );
            if (audioAnalyser) {
              audioSource.connect(audioAnalyser);
              audioSource.connect(audioContext.destination);
            }
          }
          audioPlayerRef.current?.play();
          isAudioPlaying = true;
          addTerminalMessage(`LOADING AUDIO: ${url.split("/").pop()}`);
          showNotification(`PLAYING: ${url.split("/").pop()}`);
          updateTimestamp();
        };
        audioPlayerRef.current.addEventListener("canplaythrough", onCanPlay);

        const onError = (e: any) => {
          console.error("Audio loading error:", e);
          addTerminalMessage(`ERROR LOADING AUDIO: ${url.split("/").pop()}`);
          showNotification("AUDIO LOAD ERROR");
          isAudioPlaying = false;
        };
        audioPlayerRef.current.addEventListener("error", onError);

        const onPause = () => {
          isAudioPlaying = false;
          addTerminalMessage("AUDIO PAUSED.");
        };
        audioPlayerRef.current.addEventListener("pause", onPause);

        const onPlay = () => {
          isAudioPlaying = true;
          addTerminalMessage("AUDIO PLAYING.");
          ensureAudioContextStarted();
        };

        audioPlayerRef.current.addEventListener("play", onPlay);
      }
    };

    const loadFileAudio = (file: File) => {
      if (!initAudio()) return;
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = "";
        if (audioSource) {
          audioSource.disconnect();
        }
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        if (audioPlayerRef.current && e.target) {
          audioPlayerRef.current.src = e.target.result as string;
          audioPlayerRef.current.crossOrigin = "anonymous";
          audioPlayerRef.current.loop = true;

          const onCanPlay = () => {
            if (audioContext && audioPlayerRef.current && !audioSource) {
              audioSource = audioContext.createMediaElementSource(
                audioPlayerRef.current
              );
              if (audioAnalyser) {
                audioSource.connect(audioAnalyser);
                audioSource.connect(audioContext.destination);
              }
            }
            audioPlayerRef.current?.play();
            isAudioPlaying = true;
            addTerminalMessage(`LOADING FILE: ${file.name}`);
            showNotification(`PLAYING: ${file.name}`);
            updateTimestamp();
          };
          audioPlayerRef.current.addEventListener("canplaythrough", onCanPlay);

          const onError = (e: any) => {
            console.error("Audio loading error:", e);
            addTerminalMessage(`ERROR LOADING FILE: ${file.name}`);
            showNotification("AUDIO LOAD ERROR");
            isAudioPlaying = false;
          };
          audioPlayerRef.current.addEventListener("error", onError);
        }
      };
      reader.readAsDataURL(file);
    };

    let scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
      renderer: THREE.WebGLRenderer,
      controls: OrbitControls;
    let sphere: THREE.Mesh;
    let uniforms: any;
    let rotationSpeed = 1.0;
    let sphereResolution = 32;
    let distortionFactor = 1.0;

    const initThree = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (threeContainerRef.current) {
        threeContainerRef.current.innerHTML = "";
        threeContainerRef.current.appendChild(renderer.domElement);
      }

      camera.position.z = 5;

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.enableZoom = true;
      controls.minDistance = 2;
      controls.maxDistance = 10;
      controls.maxPolarAngle = Math.PI / 2;

      const geometry = new THREE.SphereGeometry(
        2,
        sphereResolution,
        sphereResolution
      );

      uniforms = {
        u_time: { type: "f", value: 1.0 },
        u_frequency: { type: "fv1", value: new Array(128).fill(0) },
        u_reactivity: { type: "f", value: audioReactivity },
        u_distortion: { type: "f", value: distortionFactor },
        u_glowColor: { type: "v3", value: new THREE.Color(0xff4e42) },
      };

      const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
                uniform float u_time;
                uniform float u_reactivity;
                uniform float u_distortion;
                uniform float u_frequency[128];
                varying float v_displacement;
                varying vec3 v_normal;
                varying vec3 v_position;

                void main() {
                  v_normal = normal;
                  v_position = position;

                  float displacement = 0.0;
                  float freqSum = 0.0;
                  for(int i = 0; i < 128; i++) {
                    freqSum += u_frequency[i];
                  }
                  freqSum /= 128.0;

                  float lowFreq = u_frequency[0] + u_frequency[1] + u_frequency[2];
                  lowFreq /= 3.0;

                  float midFreq = 0.0;
                  for(int i = 3; i < 10; i++) {
                    midFreq += u_frequency[i];
                  }
                  midFreq /= 7.0;

                  float highFreq = 0.0;
                  for(int i = 10; i < 30; i++) {
                    highFreq += u_frequency[i];
                  }
                  highFreq /= 20.0;

                  lowFreq = lowFreq / 255.0;
                  midFreq = midFreq / 255.0;
                  highFreq = highFreq / 255.0;

                  displacement += lowFreq * 0.5 * u_reactivity * u_distortion;
                  displacement += midFreq * 0.3 * u_reactivity * u_distortion;
                  displacement += highFreq * 0.2 * u_reactivity * u_distortion;

                  displacement += sin(position.x * 10.0 + u_time * 0.5) * 0.05 * u_distortion;
                  displacement += cos(position.y * 12.0 + u_time * 0.7) * 0.04 * u_distortion;

                  v_displacement = displacement;

                  vec3 newPosition = position + normal * displacement * 0.5;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
              `,
        fragmentShader: `
                uniform float u_time;
                uniform vec3 u_glowColor;
                varying float v_displacement;
                varying vec3 v_normal;
                varying vec3 v_position;

                void main() {
                  vec3 baseColor = vec3(0.1, 0.1, 0.15);
                  vec3 lightDirection = normalize(vec3(0.5, 1.0, 0.5));
                  float diffuse = max(dot(v_normal, lightDirection), 0.0);
                  baseColor += diffuse * 0.2;
                  float glow = smoothstep(0.0, 1.0, v_displacement * 2.0);
                  vec3 finalColor = baseColor + u_glowColor * glow * 0.8;
                  float scanline = sin(v_position.y * 100.0) * 0.02 + 0.98;
                  finalColor *= scanline;
                  gl_FragColor = vec4(finalColor, 1.0);
                }
              `,
        transparent: true,
        blending: THREE.AdditiveBlending,
      });

      sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);

      window.addEventListener("resize", onWindowResize, false);
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const animateThree = () => {
      animationFrameId = requestAnimationFrame(animateThree);

      uniforms.u_time.value += 0.05;
      if (sphere) {
        sphere.rotation.y += 0.005 * rotationSpeed;
        sphere.rotation.x += 0.002 * rotationSpeed;
      }

      if (isAudioPlaying && audioAnalyser) {
        audioAnalyser.getByteFrequencyData(frequencyData);
        for (let i = 0; i < 128; i++) {
          uniforms.u_frequency.value[i] = frequencyData[i] / 255.0;
        }
        uniforms.u_reactivity.value = audioReactivity;
        uniforms.u_distortion.value = distortionFactor;

        let avgFreq =
          frequencyData.reduce((sum, val) => sum + val, 0) /
          frequencyData.length;
        let glowIntensity = avgFreq / 255.0;
        let color = new THREE.Color();
        color.setHSL(0.0, 1.0, 0.5 + glowIntensity * 0.3);
        uniforms.u_glowColor.value.copy(color);
      } else {
        let timeFactor = Math.sin(uniforms.u_time.value * 0.1) * 0.5 + 0.5;
        let color = new THREE.Color();
        color.setHSL(0.0, 1.0, 0.5 + timeFactor * 0.1);
        uniforms.u_glowColor.value.copy(color);
        for (let i = 0; i < 128; i++) {
          uniforms.u_frequency.value[i] = 0;
        }
        uniforms.u_reactivity.value = 0.5;
        uniforms.u_distortion.value = 0.5;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    const updateSphereResolution = (newResolution: number) => {
      if (sphere) {
        sphere.geometry.dispose();
        sphere.geometry = new THREE.SphereGeometry(
          2,
          newResolution,
          newResolution
        );
      }
    };

    const addTerminalMessage = (message: string, isCommand = false) => {
      if (!terminalContentRef.current) return;
      const line = document.createElement("div");
      line.classList.add("terminal-line");
      if (isCommand) {
        line.classList.add("command-line");
      }
      line.textContent = message;
      terminalContentRef.current.appendChild(line);
      terminalContentRef.current.scrollTop =
        terminalContentRef.current.scrollHeight;
    };

    let notificationTimeout: NodeJS.Timeout;
    const showNotification = (message: string) => {
      if (!notificationRef.current) return;
      notificationRef.current.textContent = message;
      notificationRef.current.style.opacity = "1";
      clearTimeout(notificationTimeout);
      notificationTimeout = setTimeout(() => {
        if (notificationRef.current)
          notificationRef.current.style.opacity = "0";
      }, 3000);
    };

    let timestampInterval: NodeJS.Timeout;
    const updateTimestamp = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      if (timestampRef.current)
        timestampRef.current.textContent = `TIME: ${hours}:${minutes}:${seconds}`;
    };

    const handleRotationChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      rotationSpeed = parseFloat(target.value);
      if (rotationValueRef.current)
        rotationValueRef.current.textContent = rotationSpeed.toFixed(1);
    };
    const handleResolutionChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      sphereResolution = parseInt(target.value);
      if (resolutionValueRef.current)
        resolutionValueRef.current.textContent = sphereResolution.toString();
      updateSphereResolution(sphereResolution);
    };
    const handleDistortionChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      distortionFactor = parseFloat(target.value);
      if (distortionValueRef.current)
        distortionValueRef.current.textContent = distortionFactor.toFixed(1);
    };
    const handleReactivityChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      audioReactivity = parseFloat(target.value);
      if (reactivityValueRef.current)
        reactivityValueRef.current.textContent = audioReactivity.toFixed(1);
    };

    const handleFileChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        if (fileLabelRef.current) fileLabelRef.current.textContent = file.name;
        loadFileAudio(file);
        if (demoTrackButtonsRef.current) {
          demoTrackButtonsRef.current
            .querySelectorAll(".demo-track-btn")
            .forEach((btn) => btn.classList.remove("active"));
        }
      } else {
        if (fileLabelRef.current)
          fileLabelRef.current.textContent = "NO FILE SELECTED";
      }
    };

    const handleReset = () => {
      rotationSpeed = 1.0;
      sphereResolution = 32;
      distortionFactor = 1.0;
      audioReactivity = 1.0;

      if (rotationSliderRef.current)
        rotationSliderRef.current.value = rotationSpeed.toString();
      if (rotationValueRef.current)
        rotationValueRef.current.textContent = rotationSpeed.toFixed(1);
      if (resolutionSliderRef.current)
        resolutionSliderRef.current.value = sphereResolution.toString();
      if (resolutionValueRef.current)
        resolutionValueRef.current.textContent = sphereResolution.toString();
      if (distortionSliderRef.current)
        distortionSliderRef.current.value = distortionFactor.toString();
      if (distortionValueRef.current)
        distortionValueRef.current.textContent = distortionFactor.toFixed(1);
      if (reactivitySliderRef.current)
        reactivitySliderRef.current.value = audioReactivity.toString();
      if (reactivityValueRef.current)
        reactivityValueRef.current.textContent = audioReactivity.toFixed(1);

      updateSphereResolution(sphereResolution);
      addTerminalMessage("PARAMETERS RESET TO DEFAULT.");
      showNotification("SYSTEM RESET");
    };

    const handleAnalyze = () => {
      addTerminalMessage("INITIATING DEEP SCAN ANALYSIS...");
      showNotification("ANALYSIS INITIATED");
      setTimeout(() => {
        addTerminalMessage("SCAN COMPLETE. NO CRITICAL ANOMALIES DETECTED.");
        showNotification("ANALYSIS COMPLETE");
      }, 3000);
    };

    // Event listeners
    rotationSliderRef.current?.addEventListener("input", handleRotationChange);
    resolutionSliderRef.current?.addEventListener(
      "input",
      handleResolutionChange
    );
    distortionSliderRef.current?.addEventListener(
      "input",
      handleDistortionChange
    );
    reactivitySliderRef.current?.addEventListener(
      "input",
      handleReactivityChange
    );
    resetBtnRef.current?.addEventListener("click", handleReset);
    analyzeBtnRef.current?.addEventListener("click", handleAnalyze);
    fileBtnRef.current?.addEventListener("click", () =>
      audioFileInputRef.current?.click()
    );
    audioFileInputRef.current?.addEventListener("change", handleFileChange);

    if (demoTrackButtonsRef.current) {
      const buttons =
        demoTrackButtonsRef.current.querySelectorAll(".demo-track-btn");
      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const url = (button as HTMLButtonElement).dataset.url;
          if (url) {
            loadAudio(url);
            buttons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");
          }
        });
      });
    }

    // Initial calls
    initThree();
    animateThree();
    timestampInterval = setInterval(updateTimestamp, 1000);

    // Hide loading overlay after a delay
    setTimeout(() => {
      if (loadingOverlayRef.current) {
        loadingOverlayRef.current.style.opacity = "0";
        setTimeout(() => {
          if (loadingOverlayRef.current)
            loadingOverlayRef.current.style.display = "none";
        }, 500);
      }
    }, 3000);

    return () => {
      // Cleanup
      window.removeEventListener("resize", onWindowResize);
      cancelAnimationFrame(animationFrameId);
      clearInterval(timestampInterval);
      clearTimeout(notificationTimeout);

      rotationSlider?.removeEventListener("input", handleRotationChange);
      resolutionSlider?.removeEventListener("input", handleResolutionChange);
      distortionSlider?.removeEventListener("input", handleDistortionChange);
      reactivitySlider?.removeEventListener("input", handleReactivityChange);
      resetBtn?.removeEventListener("click", handleReset);
      analyzeBtn?.removeEventListener("click", handleAnalyze);
      fileBtn?.removeEventListener("click", () => audioFileInput?.click());
      audioFileInput?.removeEventListener("change", handleFileChange);

      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
      }
      if (audioSource) {
        audioSource.disconnect();
      }
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close();
      }
      if (renderer) {
        renderer.dispose();
      }
      if (threeContainer) {
        threeContainer.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="music-player">
      <div className="space-background"></div>

      <div className="loading-overlay" ref={loadingOverlayRef}>
        <div className="loading-container">
          <div className="preloader-canvas-container">
            <canvas
              ref={preloaderCanvasRef}
              className="preloader-canvas"
              width="180"
              height="180"
            ></canvas>
          </div>
          <div className="loading-text">INITIALIZING SCANNER</div>
        </div>
      </div>

      <div className="notification" ref={notificationRef}>
        Anomaly detected
      </div>

      <div id="three-container" ref={threeContainerRef}></div>

      <div className="grid-overlay"></div>

      <div className="circular-visualizer">
        <canvas id="circular-canvas" ref={circularCanvasRef}></canvas>
      </div>

      <div className="audio-wave" id="audio-wave"></div>

      <div
        className="floating-particles"
        id="floating-particles"
        ref={floatingParticlesRef}
      ></div>

      <div className="interface-container">
        <div className="header">
          <div className="header-item"></div>
          <div className="header-item">
            GSAP.INERTIA.WEBFLOW.TIMELINE
            <br />
            v3.13.0
          </div>
          <div className="header-item" id="timestamp" ref={timestampRef}>
            TIME: 00:00:00
          </div>
        </div>

        <div className="scanner-frame">
          <div className="corner-tl"></div>
          <div className="corner-tr"></div>
          <div className="corner-bl"></div>
          <div className="corner-br"></div>
          <div className="scanner-id">
            GSAP.TIMELINE({`{ONSTART: WEBFLOW.INIT}`})
          </div>
          <div className="scanner-id-right">IX2.ANIMATION.SEQUENCE(0x4F2E)</div>
        </div>
      </div>

      <div
        className="data-panel"
        style={{ position: "absolute", top: "20px", left: "20px" }}
      >
        <div className="data-panel-title">
          <span>ANOMALY METRICS</span>
          <span id="status-indicator">●</span>
        </div>
        <div className="data-bar">
          <div
            className="data-bar-fill"
            id="stability-bar"
            ref={stabilityBarRef}
            style={{ width: "75%" }}
          ></div>
        </div>
        <div className="data-readouts">
          <div className="data-row">
            <span className="data-label">STABILITY INDEX:</span>
            <span
              className="data-value"
              id="stability-value"
              ref={stabilityValueRef}
            >
              75%
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">MASS COEFFICIENT:</span>
            <span className="data-value" id="mass-value" ref={massValueRef}>
              1.728
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">ENERGY SIGNATURE:</span>
            <span className="data-value" id="energy-value" ref={energyValueRef}>
              5.3e8 J
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">QUANTUM VARIANCE:</span>
            <span
              className="data-value"
              id="variance-value"
              ref={varianceValueRef}
            >
              0.0042
            </span>
          </div>
        </div>
      </div>

      <div
        className="data-panel"
        style={{ position: "absolute", top: "20px", right: "20px" }}
      >
        <div className="data-panel-title">ANOMALY METRICS</div>
        <div className="waveform">
          <canvas
            id="waveform-canvas"
            className="waveform-canvas"
            ref={waveformCanvasRef}
          ></canvas>
        </div>
        <div className="data-readouts">
          <div className="data-row">
            <span className="data-label">PEAK FREQUENCY:</span>
            <span className="data-value" id="peak-value" ref={peakValueRef}>
              127.3 HZ
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">AMPLITUDE:</span>
            <span
              className="data-value"
              id="amplitude-value"
              ref={amplitudeValueRef}
            >
              0.56
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">PHASE SHIFT:</span>
            <span className="data-value" id="phase-value" ref={phaseValueRef}>
              π/4
            </span>
          </div>
        </div>
      </div>

      <div
        className="control-panel"
        ref={controlPanelRef}
        style={{ top: "35%", left: "20px", transform: "translateY(-50%)" }}
      >
        <div className="panel-header">
          <span className="data-panel-title">ANOMALY CONTROLS</span>
          <span
            className="drag-handle"
            id="control-panel-handle"
            ref={controlPanelHandleRef}
          >
            ⋮⋮
          </span>
        </div>
        <div className="control-group">
          <div className="control-row">
            <span className="control-label">ROTATION SPEED</span>
            <span
              className="control-value"
              id="rotation-value"
              ref={rotationValueRef}
            >
              1.0
            </span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="5"
              defaultValue="1"
              step="0.1"
              className="slider"
              id="rotation-slider"
              ref={rotationSliderRef}
            />
          </div>
        </div>

        <div className="control-group">
          <div className="control-row">
            <span className="control-label">RESOLUTION</span>
            <span
              className="control-value"
              id="resolution-value"
              ref={resolutionValueRef}
            >
              32
            </span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="12"
              max="64"
              defaultValue="32"
              step="4"
              className="slider"
              id="resolution-slider"
              ref={resolutionSliderRef}
            />
          </div>
        </div>

        <div className="control-group">
          <div className="control-row">
            <span className="control-label">DISTORTION</span>
            <span
              className="control-value"
              id="distortion-value"
              ref={distortionValueRef}
            >
              1.0
            </span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="3"
              defaultValue="1"
              step="0.1"
              className="slider"
              id="distortion-slider"
              ref={distortionSliderRef}
            />
          </div>
        </div>

        <div className="control-group">
          <div className="control-row">
            <span className="control-label">AUDIO REACTIVITY</span>
            <span
              className="control-value"
              id="reactivity-value"
              ref={reactivityValueRef}
            >
              1.0
            </span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="2"
              defaultValue="1"
              step="0.1"
              className="slider"
              id="reactivity-slider"
              ref={reactivitySliderRef}
            />
          </div>
        </div>

        <div className="buttons">
          <button className="btn" id="reset-btn" ref={resetBtnRef}>
            RESET
          </button>
          <button className="btn" id="analyze-btn" ref={analyzeBtnRef}>
            ANALYZE
          </button>
        </div>
      </div>

      <div className="terminal-panel">
        <div className="terminal-header">
          <span>SYSTEM TERMINAL</span>
          <span id="terminal-status">ONLINE</span>
        </div>
        <div
          className="terminal-content"
          id="terminal-content"
          ref={terminalContentRef}
        >
          <div className="terminal-line">
            NEXUS v3.7.2 INITIALIZED. SECURE CONNECTION ESTABLISHED.
          </div>
          <div className="terminal-line command-line">
            gsap.inertia.init(throwProps: true, resistance: 0.35);
          </div>
          <div className="terminal-line regular-line">{`Draggable.create({bounds: window, inertia: true, edgeResistance: 0.65});`}</div>
          <div className="terminal-line command-line">{`webflow.interactions.trigger('IX2', {value: 'anomaly-detection'});`}</div>
          <div className="terminal-line typing"></div>
        </div>
      </div>

      <div className="spectrum-analyzer" ref={spectrumAnalyzerRef}>
        <div className="spectrum-header">
          <span>AUDIO SPECTRUM ANALYZER</span>
          <span
            className="drag-handle"
            id="spectrum-handle"
            ref={spectrumHandleRef}
          >
            ⋮⋮
          </span>
        </div>
        <div className="spectrum-content">
          <canvas
            id="spectrum-canvas"
            className="spectrum-canvas"
            ref={spectrumCanvasRef}
          ></canvas>
        </div>
        <div className="audio-controls">
          <div className="demo-tracks" ref={demoTrackButtonsRef}>
            <span className="demo-tracks-label">DEMO TRACKS:</span>
            <button
              className="demo-track-btn"
              data-url="https://assets.codepen.io/7558/Merkaba.mp3"
            >
              MERKABA
            </button>
            <button
              className="demo-track-btn"
              data-url="https://assets.codepen.io/7558/Dhamika.mp3"
            >
              DHAMIKA
            </button>
            <button
              className="demo-track-btn"
              data-url="https://assets.codepen.io/7558/Vacant.mp3"
            >
              VACANT
            </button>
            <button
              className="demo-track-btn"
              data-url="https://assets.codepen.io/7558/lxstnght-back_1.mp3"
            >
              LXSTNGHT
            </button>
          </div>

          <input
            type="file"
            id="audio-file-input"
            className="audio-file-input"
            accept="audio/*"
            ref={audioFileInputRef}
          />
          <button className="audio-file-btn" id="file-btn" ref={fileBtnRef}>
            UPLOAD AUDIO FILE
          </button>
          <div className="audio-file-label" id="file-label" ref={fileLabelRef}>
            NO FILE SELECTED
          </div>

          <audio
            id="audio-player"
            className="audio-player"
            crossOrigin="anonymous"
            ref={audioPlayerRef}
          ></audio>

          <div className="controls-row">
            <div className="audio-sensitivity" style={{ flex: 1 }}>
              <div className="audio-sensitivity-label">
                <span>SENSITIVITY</span>
                <span
                  className="audio-sensitivity-value"
                  id="sensitivity-value"
                  ref={sensitivityValueRef}
                >
                  5.0
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                defaultValue="5"
                step="0.1"
                className="slider"
                id="sensitivity-slider"
                ref={sensitivitySliderRef}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
