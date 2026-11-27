'use client';

/**
 * ChartStage — the captain's chart table.
 *
 * One canvas, one clock, no new dependencies (three is already in the project).
 * This is the *picture*; the DOM grid on top is the *interface*. All hit
 * testing, focus order, aria labels and tooltips stay in the DOM, so adding the
 * 3D layer cannot regress accessibility (DESIGN.md §1, §8.7).
 *
 * Data flow is one-way and dumb: the parent hands over cells, ships and intel,
 * we upload a texture and draw. No game rules live here.
 */

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { chartFragment, chartVertex, fogFragment, fogVertex } from './chartShaders';
import { prefersReducedMotion } from '@/lib/motion';

export type ChartOwner = 'none' | 'me' | 'enemy' | 'other';

export interface ChartCell {
  /** 0 water, 1 island, 2 port, 3 treasure, 4 storm, 5 reef, 6 whirlpool */
  type: number;
  owner: ChartOwner;
  /** 0 hidden, 1 stale, 2 current */
  intel: 0 | 1 | 2;
}

export interface ChartShip {
  id: string;
  x: number;
  y: number;
  kind: 'sloop' | 'frigate' | 'galleon' | 'flagship';
  owner: Exclude<ChartOwner, 'none'>;
  /** 0..1 */
  healthPct: number;
  selected?: boolean;
}

export interface ChartStageProps {
  gridSize: number;
  /** Row-major, length gridSize * gridSize. */
  cells: ChartCell[];
  ships: ChartShip[];
  selected?: { x: number; y: number } | null;
  /** 0..1 — how much wick is left. Drives the lantern. */
  turnProgress?: number;
  /** When false the loop stops and the canvas fades out (flat chart view). */
  active?: boolean;
  /**
   * Set to a fresh non-null value (e.g. the match id) to play the 3.4s
   * intro glide (MOTION.md 09 GLIDE) from wide to the fitted framing.
   * Skipped under reduced motion.
   */
  glideKey?: string | number | null;
  className?: string;
}

const OWNER_INDEX: Record<ChartOwner, number> = {
  none: 0,
  me: 1,
  enemy: 2,
  other: 3,
};

const SHIP_SCALE: Record<ChartShip['kind'], number> = {
  sloop: 0.82,
  frigate: 1,
  galleon: 1.18,
  flagship: 1.3,
};

/** Sheet is slightly larger than the playable board so the torn edge sits outside it. */
const SHEET_MARGIN = 1.08;
/** Half the margin, as a fraction of the board box. The canvas overscans by this
 * amount so the shader's inner 10x10 chart lands exactly under the DOM hit grid. */
const CANVAS_OVERSCAN = (SHEET_MARGIN - 1) / 2;
/** Near-top-down play camera. A lower angle is more cinematic, but perspective
 * shears the 3D grid away from the invisible DOM hit grid; 70° keeps the theatre
 * without making clicks lie. */
const PLAY_TILT_DEG = 70;

export default function ChartStage({
  gridSize,
  cells,
  ships,
  selected = null,
  turnProgress = 1,
  active = true,
  glideKey = null,
  className,
}: ChartStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  // Latest props, read by the render loop without re-creating the scene.
  const live = useRef({ selected, turnProgress, gridSize });
  live.current = { selected, turnProgress, gridSize };

  // Seed values for the init effect, and the current data for later syncs.
  const cellsRef = useRef(cells);
  const shipsRef = useRef(ships);
  const selectedRef = useRef(selected);
  cellsRef.current = cells;
  shipsRef.current = ships;
  selectedRef.current = selected;

  const api = useRef<{
    syncTerrain: (cells: ChartCell[], gridSize: number) => void;
    syncShips: (ships: ChartShip[], selected: { x: number; y: number } | null) => void;
    setActive: (active: boolean) => void;
    startGlide: () => void;
  } | null>(null);

  // Rebuild tokens only when something visible about them actually changed.
  // Without this the whole token set is rebuilt on every parent render (the
  // turn clock ticks often), which would reset the bob phase and waste work.
  const shipSignature = useMemo(
    () =>
      ships
        .map((s) => `${s.id}:${s.x}:${s.y}:${s.kind}:${s.owner}:${Math.round(s.healthPct * 20)}`)
        .join('|'),
    [ships],
  );
  const selectionSignature = selected ? `${selected.x},${selected.y}` : '';

  // ---------------------------------------------------------------- scene init
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = prefersReducedMotion();
    const size = live.current.gridSize;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.style.cssText =
      'display:block;width:100%;height:100%;transition:opacity 400ms cubic-bezier(.16,1,.3,1)';
    host.appendChild(renderer.domElement);

    // ---- palette, in the renderer's working colour space
    const palette = {
      ink: new THREE.Color('#0b1418'),
      vellum: new THREE.Color('#e8dfc8'),
      brass: new THREE.Color('#9a7b3f'),
      signal: new THREE.Color('#4fb3a8'),
      threat: new THREE.Color('#c2453c'),
      lamp: new THREE.Color('#f0b24a'),
    };

    // ---- table: dark wood, barely visible, gives the chart something to sit on
    const tableGeo = new THREE.PlaneGeometry(size * 3.4, size * 3.4);
    const tableMat = new THREE.MeshStandardMaterial({
      color: '#160f0b',
      roughness: 0.92,
      metalness: 0.0,
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.rotation.x = -Math.PI / 2;
    table.position.y = -0.03;
    scene.add(table);

    // ---- data textures
    const makeDataTexture = (filter: THREE.MagnificationTextureFilter) => {
      const tex = new THREE.DataTexture(
        new Uint8Array(size * size * 4),
        size,
        size,
        THREE.RGBAFormat,
      );
      tex.minFilter = filter;
      tex.magFilter = filter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
      return tex;
    };
    const terrainTex = makeDataTexture(THREE.NearestFilter);
    const intelTex = makeDataTexture(THREE.LinearFilter);

    // ---- the chart sheet
    const chartUniforms = {
      uTerrain: { value: terrainTex },
      uGrid: { value: new THREE.Vector2(size, size) },
      uUvScale: { value: SHEET_MARGIN },
      uTime: { value: 0 },
      uLamp: { value: new THREE.Vector2(size * 0.5, size * 0.42) },
      uLampPower: { value: 1 },
      uSelected: { value: new THREE.Vector2(-9, -9) },
      uInk: { value: palette.ink },
      uVellum: { value: palette.vellum },
      uBrass: { value: palette.brass },
      uSignal: { value: palette.signal },
      uThreat: { value: palette.threat },
      uLampCol: { value: palette.lamp },
    };

    const chartGeo = new THREE.PlaneGeometry(size * SHEET_MARGIN, size * SHEET_MARGIN);
    const chartMat = new THREE.ShaderMaterial({
      uniforms: chartUniforms,
      vertexShader: chartVertex,
      fragmentShader: chartFragment,
    });
    const chart = new THREE.Mesh(chartGeo, chartMat);
    chart.rotation.x = -Math.PI / 2;
    scene.add(chart);

    // ---- fog layer, a hair above the chart
    const fogUniforms = {
      uIntel: { value: intelTex },
      uGrid: { value: new THREE.Vector2(size, size) },
      uTime: { value: 0 },
      uDensity: { value: 1 },
    };
    const fogGeo = new THREE.PlaneGeometry(size, size);
    const fogMat = new THREE.ShaderMaterial({
      uniforms: fogUniforms,
      vertexShader: fogVertex,
      fragmentShader: fogFragment,
      transparent: true,
      depthWrite: false,
    });
    const fog = new THREE.Mesh(fogGeo, fogMat);
    fog.rotation.x = -Math.PI / 2;
    fog.position.y = 0.012;
    scene.add(fog);

    // ---- light: one lantern, one cold rim, one ambient floor
    scene.add(new THREE.AmbientLight('#20303a', 0.85));

    const moon = new THREE.DirectionalLight('#8fb4c9', 0.35);
    moon.position.set(-6, 9, -7);
    scene.add(moon);

    const lantern = new THREE.PointLight(palette.lamp.clone(), 26, size * 3.2, 1.8);
    lantern.position.set(0, 4.2, 0.8);
    scene.add(lantern);

    // ---- ships
    const tokenRoot = new THREE.Group();
    tokenRoot.position.y = 0.02;
    scene.add(tokenRoot);

    // Shared geometry, built once.
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-0.34, 0);
    hullShape.lineTo(-0.2, 0.135);
    hullShape.lineTo(0.16, 0.135);
    hullShape.lineTo(0.36, 0);
    hullShape.lineTo(0.16, -0.135);
    hullShape.lineTo(-0.2, -0.135);
    hullShape.closePath();
    const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
      depth: 0.09,
      bevelEnabled: false,
      curveSegments: 1,
    });
    hullGeo.rotateX(-Math.PI / 2);

    const sailGeo = new THREE.BufferGeometry();
    sailGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [-0.04, 0.115, 0.13, -0.04, 0.115, -0.13, 0.3, 0.115, 0.0],
        3,
      ),
    );
    sailGeo.computeVertexNormals();

    const mastGeo = new THREE.CylinderGeometry(0.012, 0.016, 0.16, 6);
    const ringGeo = new THREE.RingGeometry(0.3, 0.365, 40);
    ringGeo.rotateX(-Math.PI / 2);

    const ownerColor = (owner: ChartShip['owner']) =>
      owner === 'me' ? palette.signal : owner === 'enemy' ? palette.threat : palette.brass;

    let tokenDisposables: Array<{ dispose: () => void }> = [];

    const clearTokens = () => {
      tokenRoot.clear();
      tokenDisposables.forEach((d) => d.dispose());
      tokenDisposables = [];
    };

    const buildTokens = (list: ChartShip[], sel: { x: number; y: number } | null) => {
      clearTokens();
      const half = (size - 1) / 2;
      const enemies = list.filter((s) => s.owner === 'enemy');

      for (const ship of list) {
        const group = new THREE.Group();
        const base = ownerColor(ship.owner).clone();
        // Damaged ships run hot: the sail tints toward oxide as HP drops.
        const sailColor = base.clone().lerp(palette.threat, (1 - ship.healthPct) * 0.55);

        const hullMat = new THREE.MeshStandardMaterial({
          color: base.clone().lerp(palette.ink, 0.45),
          roughness: 0.48,
          metalness: 0.35,
        });
        const sailMat = new THREE.MeshStandardMaterial({
          color: sailColor,
          roughness: 0.78,
          metalness: 0.05,
          side: THREE.DoubleSide,
          emissive: sailColor.clone().multiplyScalar(0.18),
        });
        const mastMat = new THREE.MeshStandardMaterial({
          color: '#241a12',
          roughness: 0.9,
          metalness: 0.1,
        });

        const hull = new THREE.Mesh(hullGeo, hullMat);
        const sail = new THREE.Mesh(sailGeo, sailMat);
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(-0.04, 0.19, 0);

        group.add(hull, sail, mast);
        group.scale.setScalar(SHIP_SCALE[ship.kind] ?? 1);

        // Heading: bow toward the nearest enemy reads as intent without needing
        // a heading field in the game state.
        let heading = ship.owner === 'enemy' ? Math.PI : 0;
        if (ship.owner !== 'enemy' && enemies.length) {
          const nearest = enemies.reduce((a, b) => {
            const da = (a.x - ship.x) ** 2 + (a.y - ship.y) ** 2;
            const db = (b.x - ship.x) ** 2 + (b.y - ship.y) ** 2;
            return db < da ? b : a;
          });
          heading = Math.atan2(-(nearest.y - ship.y), nearest.x - ship.x);
        }
        group.rotation.y = heading;

        group.position.set(ship.x - half, 0, ship.y - half);
        const isSelected =
          ship.selected || (!!sel && sel.x === ship.x && sel.y === ship.y);
        group.userData = {
          phase: (ship.id.charCodeAt(0) + ship.x * 3 + ship.y * 7) % 100,
          selected: isSelected,
        };

        if (isSelected) {
          const ringMat = new THREE.MeshBasicMaterial({
            color: palette.lamp,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.position.y = 0.005;
          group.add(ring);
          tokenDisposables.push(ringMat);
        }

        tokenRoot.add(group);
        tokenDisposables.push(hullMat, sailMat, mastMat);
      }
    };

    // ---- camera framing: fit the whole board, portrait or landscape
    const fitted = new THREE.Vector3(0, 10, 8);
    const fitCamera = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      const aspect = w / h;
      camera.aspect = aspect;

      const vFov = (camera.fov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
      // Fit the physical sheet, not the sheet plus breathing room. The canvas is
      // overscanned by exactly the sheet margin, so this framing puts the inner
      // playable chart under the DOM grid instead of shrinking it by another 6%.
      const need = size * SHEET_MARGIN;
      const distV = need / 2 / Math.tan(vFov / 2);
      const distH = need / 2 / Math.tan(hFov / 2);
      const dist = Math.max(distV, distH);

      const tilt = (PLAY_TILT_DEG * Math.PI) / 180;
      fitted.set(0, Math.sin(tilt) * dist, Math.cos(tilt) * dist);
      camera.position.copy(fitted);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    fitCamera();

    // ---- data upload
    const syncTerrain = (list: ChartCell[], n: number) => {
      const terrain = new Uint8Array(n * n * 4);
      const intel = new Uint8Array(n * n * 4);
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const src = y * n + x;
          // Texture v=0 is the bottom of the plane; row A is the top of the board.
          const dst = ((n - 1 - y) * n + x) * 4;
          const cell = list[src];
          if (!cell) continue;
          terrain[dst + 0] = (cell.type + 1) * 16;
          terrain[dst + 1] = OWNER_INDEX[cell.owner] * 32;
          terrain[dst + 2] = Math.round((cell.intel / 2) * 255);
          terrain[dst + 3] = 255;
          intel[dst + 2] = Math.round((cell.intel / 2) * 255);
          intel[dst + 3] = 255;
        }
      }
      (terrainTex.image.data as Uint8Array).set(terrain);
      (intelTex.image.data as Uint8Array).set(intel);
      terrainTex.needsUpdate = true;
      intelTex.needsUpdate = true;
    };

    // ---- pointer parallax: the table leans very slightly as you look around
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (!reduced) window.addEventListener('pointermove', onPointerMove, { passive: true });

    // ---- resize
    const ro = new ResizeObserver(fitCamera);
    ro.observe(host);

    // ---- the loop
    const clock = new THREE.Clock();
    let elapsed = 0;
    const lampTarget = new THREE.Vector3();

    // Intro glide state (MOTION.md 09 GLIDE, 3400ms linear). Null when idle.
    const glide = {
      active: false,
      t0: 0,
      from: new THREE.Vector3(),
    };
    const GLIDE_MS = 3400;

    const render = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = reduced ? 0 : (elapsed += dt);
      const { selected: liveSel, turnProgress: progress } = live.current;

      // The wick burns down: light dims and reddens with the turn timer (06 BURN-DOWN).
      const wick = THREE.MathUtils.clamp(progress, 0, 1);
      const flicker = reduced ? 1 : 1 + 0.05 * Math.sin(t * 11.3) + 0.03 * Math.sin(t * 17.7);
      lantern.intensity = (6 + 24 * wick) * flicker;
      lantern.color.copy(palette.lamp).lerp(palette.threat, (1 - wick) * 0.65);

      chartUniforms.uTime.value = t;
      chartUniforms.uLampPower.value = (0.35 + 0.75 * wick) * flicker;
      fogUniforms.uTime.value = t;
      fogUniforms.uDensity.value = 0.85 + 0.15 * wick;

      // The lamp follows the selected cell, so the chart is lit where you act.
      if (liveSel) {
        chartUniforms.uLamp.value.set(liveSel.x + 0.5, liveSel.y + 0.5);
        chartUniforms.uSelected.value.set(liveSel.x + 0.5, liveSel.y + 0.5);
        lampTarget.set(liveSel.x - (size - 1) / 2, 4.2, liveSel.y - (size - 1) / 2);
      } else {
        chartUniforms.uLamp.value.set(size * 0.5, size * 0.42);
        chartUniforms.uSelected.value.set(-9, -9);
        lampTarget.set(0, 4.2, 0.8);
      }
      lantern.position.lerp(lampTarget, 1 - Math.pow(0.001, dt));

      // Intro glide: wide framing settles onto the fitted table (09 GLIDE).
      if (glide.active) {
        const k = Math.min(1, (performance.now() - glide.t0) / GLIDE_MS);
        camera.position.lerpVectors(glide.from, fitted, k);
        camera.lookAt(0, 0, 0);
        if (k >= 1) glide.active = false;
      }

      // Tokens bob; the selected one lifts toward the light (01 RAISE).
      for (const child of tokenRoot.children) {
        const phase = (child.userData['phase'] as number) ?? 0;
        const lift = child.userData['selected'] ? 0.055 : 0;
        child.position.y = lift + (reduced ? 0 : Math.sin(t * 1.15 + phase) * 0.014);
      }

      // Camera parallax, clamped hard so the grid never becomes unreadable.
      if (!reduced) {
        camera.position.set(
          fitted.x + pointer.x * 0.42,
          fitted.y - pointer.y * 0.22,
          fitted.z,
        );
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(render);

    api.current = {
      syncTerrain,
      syncShips: buildTokens,
      setActive: (isActive: boolean) => {
        renderer.setAnimationLoop(isActive ? render : null);
        renderer.domElement.style.opacity = isActive ? '1' : '0';
      },
      startGlide: () => {
        if (reduced) return;
        glide.from.copy(camera.position);
        // Pull back and up: the table is revealed from the cabin dark.
        glide.from.multiplyScalar(1.45);
        glide.from.y += size * 0.55;
        camera.position.copy(glide.from);
        glide.t0 = performance.now();
        glide.active = true;
      },
    };

    // Seed with whatever the first render already had.
    syncTerrain(cellsRef.current, size);
    buildTokens(shipsRef.current, selectedRef.current ?? null);

    // ---- teardown
    return () => {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      clearTokens();
      hullGeo.dispose();
      sailGeo.dispose();
      mastGeo.dispose();
      ringGeo.dispose();
      terrainTex.dispose();
      intelTex.dispose();
      chartMat.dispose();
      fogMat.dispose();
      tableMat.dispose();
      tableGeo.dispose();
      chartGeo.dispose();
      fogGeo.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
    // The scene is built once per grid size. Data changes flow through api.current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridSize]);

  // ------------------------------------------------------- prop → scene syncing
  useEffect(() => {
    api.current?.syncTerrain(cells, gridSize);
  }, [cells, gridSize]);

  useEffect(() => {
    api.current?.syncShips(shipsRef.current, selectedRef.current ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipSignature, selectionSignature]);

  useEffect(() => {
    api.current?.setActive(active);
  }, [active]);

  useEffect(() => {
    if (glideKey !== null && glideKey !== undefined) api.current?.startGlide();
    // Glide fires on key change only; the scene reads it imperatively.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glideKey]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        inset: `${-CANVAS_OVERSCAN * 100}%`,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    />
  );
}
