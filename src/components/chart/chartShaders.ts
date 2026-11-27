/**
 * Shaders for the chart table. See DESIGN.md §1 and MOTION.md.
 *
 * Two materials do all the visual work:
 *   1. The chart surface — ink-wash sea, vellum land, brass grid, lantern falloff.
 *   2. The fog layer  — density driven by the real intel projection, so the
 *      signature visual is the game's actual hidden information.
 *
 * Both read from a 10x10 data texture. The texture is the single source of
 * truth for what the board looks like, which is why the board cannot drift out
 * of sync with the rules.
 */

export const noiseChunk = /* glsl */ `
  float p8Hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float p8Noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(p8Hash(i), p8Hash(i + vec2(1.0, 0.0)), u.x),
      mix(p8Hash(i + vec2(0.0, 1.0)), p8Hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float p8Fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * p8Noise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }
`;

export const chartVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const chartFragment = /* glsl */ `
  precision highp float;

  ${noiseChunk}

  uniform sampler2D uTerrain;
  uniform vec2  uGrid;
  uniform float uUvScale;    // >1 shrinks the playable area inside the sheet
  uniform float uUnroll;     // 03 UNROLL: 0 = rolled shut, 1 = fully laid out
  uniform float uTime;
  uniform vec2  uLamp;       // lamp position in cell space
  uniform float uLampPower;
  uniform vec2  uSelected;   // selected cell in cell space, or (-9,-9)

  uniform vec3 uInk;
  uniform vec3 uVellum;
  uniform vec3 uBrass;
  uniform vec3 uSignal;
  uniform vec3 uThreat;
  uniform vec3 uLampCol;

  varying vec2 vUv;

  float p8Segment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
  }

  float p8Line(vec2 p, vec2 a, vec2 b, float width) {
    return 1.0 - smoothstep(width, width + 0.008, p8Segment(p, a, b));
  }

  // Cell type ids, matching TerritoryCellType order on the CPU side.
  // 0 water, 1 island, 2 port, 3 treasure, 4 storm, 5 reef, 6 whirlpool
  vec3 terrainColor(float t) {
    if (t < 0.5) return uInk;
    if (t < 1.5) return mix(uInk, uVellum, 0.50);
    if (t < 2.5) return mix(uInk, uBrass, 0.62);
    if (t < 3.5) return mix(uInk, uLampCol, 0.42);
    if (t < 4.5) return mix(uInk, uThreat, 0.32);
    if (t < 5.5) return mix(uInk, uVellum, 0.20);
    return mix(uInk, uSignal, 0.28);
  }

  void main() {
    // uvc: 0..1 across the playable board, <0 or >1 outside the sheet
    vec2 uvc = (vUv - 0.5) * uUvScale + 0.5;

    // 03 UNROLL: the chart lays itself left to right behind a soft roll edge.
    if (uvc.x > uUnroll) discard;
    float rollEdge = smoothstep(uUnroll - 0.035, uUnroll, uvc.x);

    vec4 data = texture2D(uTerrain, uvc);
    float type  = floor(data.r * 16.0 + 0.5) - 1.0;
    float owner = floor(data.g * 8.0 + 0.5);
    float intel = data.b;

    vec2 p = uvc * uGrid;

    // ---- ink wash: two octaves of drifting noise, slow enough to read as water
    float n1 = p8Fbm(p * 1.6 + vec2(uTime * 0.030, uTime * 0.021));
    float n2 = p8Fbm(p * 3.4 - vec2(uTime * 0.050, uTime * 0.040));
    float wash = n1 * 0.65 + n2 * 0.35;

    vec3 col = terrainColor(type);
    col += (wash - 0.5) * 0.075 * uVellum;
    float waterMask = step(type, 0.5);

    vec2 cellUv = fract(p);
    vec2 cellId = floor(p);
    vec2 q = cellUv - 0.5;
    float seed = p8Hash(cellId + vec2(3.7, 9.1));

    // ---- sea-chart soundings: fine contour lines, not a flat blue fill
    float contour = smoothstep(
      0.965,
      1.0,
      abs(sin((n1 * 4.2 + p.x * 0.17 + p.y * 0.11) * 3.14159265))
    );
    col += contour * uVellum * 0.035 * waterMask;

    // ---- hand-drawn chart symbology. Terrain is shape as well as colour, so
    // the board stays readable for colour-blind players and under fog edges.
    if (type > 0.5 && type < 1.5) {
      // Island: an irregular inked coast instead of a flat tinted square.
      float angle = atan(q.y, q.x);
      float radius = length(q);
      float coast = 0.24
        + 0.045 * sin(angle * 3.0 + seed * 6.2831853)
        + 0.025 * sin(angle * 5.0 - seed * 4.0);
      float fill = 1.0 - smoothstep(coast, coast + 0.018, radius);
      float shoreline = 1.0 - smoothstep(0.0, 0.014, abs(radius - coast));
      col = mix(col, mix(uInk, uVellum, 0.58), fill * 0.78);
      col = mix(col, uVellum, shoreline * 0.38);
    }

    if (type > 1.5 && type < 2.5) {
      // Port: anchor/harbour mark in brass ink.
      float ring = 1.0 - smoothstep(0.010, 0.020, abs(length(q) - 0.18));
      float stem = p8Line(q, vec2(0.0, -0.16), vec2(0.0, 0.18), 0.012);
      float crossbar = p8Line(q, vec2(-0.12, 0.055), vec2(0.12, 0.055), 0.012);
      float anchorMark = max(ring, max(stem, crossbar));
      col = mix(col, uBrass * 1.22, anchorMark * 0.75);
    }

    if (type > 2.5 && type < 3.5) {
      // Treasure: a surveyed X, in the same lamp ink as the reward itself.
      float xA = p8Line(q, vec2(-0.14, -0.14), vec2(0.14, 0.14), 0.014);
      float xB = p8Line(q, vec2(-0.14, 0.14), vec2(0.14, -0.14), 0.014);
      col = mix(col, uLampCol, max(xA, xB) * 0.88);
    }

    if (type > 3.5 && type < 4.5) {
      // Storm: one hard-edged lightning sigil.
      float bolt = max(
        p8Line(q, vec2(0.05, 0.23), vec2(-0.05, 0.03), 0.016),
        max(
          p8Line(q, vec2(-0.05, 0.03), vec2(0.07, 0.02), 0.016),
          p8Line(q, vec2(0.07, 0.02), vec2(-0.03, -0.22), 0.016)
        )
      );
      col = mix(col, uThreat * 1.15, bolt * 0.85);
    }

    if (type > 4.5 && type < 5.5) {
      // Reef: three pale rocks breaking the surface.
      float rockA = 1.0 - smoothstep(0.035, 0.055, length(q - vec2(-0.12, 0.08)));
      float rockB = 1.0 - smoothstep(0.030, 0.050, length(q - vec2(0.08, 0.12)));
      float rockC = 1.0 - smoothstep(0.040, 0.060, length(q - vec2(0.04, -0.10)));
      float rocks = max(rockA, max(rockB, rockC));
      col = mix(col, uVellum, rocks * 0.46);
    }

    if (type > 5.5) {
      // Whirlpool: concentric sounding rings in verdigris ink.
      float radius = length(q);
      float ringA = 1.0 - smoothstep(0.0, 0.012, abs(radius - 0.085));
      float ringB = 1.0 - smoothstep(0.0, 0.012, abs(radius - 0.165));
      float ringC = 1.0 - smoothstep(0.0, 0.012, abs(radius - 0.245));
      float swirl = max(ringA, max(ringB * 0.85, ringC * 0.65));
      col = mix(col, uSignal, swirl * 0.55);
    }

    // ---- lantern glint on open water
    float ridge = pow(smoothstep(0.70, 0.98, n2), 6.0);
    col += ridge * uLampCol * 0.55 * uLampPower * mix(0.18, 1.0, waterMask);

    // ---- brass grid, drawn as hairlines on the cell boundaries
    vec2 toEdge = min(cellUv, 1.0 - cellUv);
    float edgeDist = min(toEdge.x, toEdge.y);
    float hairline = 1.0 - smoothstep(0.0, 0.022, edgeDist);
    col = mix(col, uBrass * 1.15, hairline * 0.16);

    // ---- ownership wash (never the only signal: the DOM adds a text flag)
    if (owner > 0.5) {
      vec3 ownCol = owner < 1.5 ? uSignal : (owner < 2.5 ? uThreat : uBrass);
      float breathe = 0.14 + 0.05 * sin(uTime * 0.9 + p.x * 0.7 + p.y * 0.4);
      col = mix(col, ownCol, breathe * mix(0.35, 1.0, intel));
    }

    // ---- stale intel is desaturated, not just dimmer
    float stale = step(0.25, intel) * step(intel, 0.75);
    col = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))), stale * 0.45);

    // ---- lantern falloff: light comes from one place, not from everywhere
    float lampDist = distance(uvc, uLamp / uGrid);
    float fall = 1.0 - smoothstep(0.10, 1.05, lampDist);
    col *= mix(0.42, 1.28, fall * uLampPower);

    // ---- the selected cell gets a lamp-coloured bloom
    float selDist = distance(p, uSelected);
    col += uLampCol * (1.0 - smoothstep(0.0, 1.15, selDist)) * 0.10;

    // ---- chart edge: torn vellum, darker outside the sheet
    float edge = min(min(uvc.x, 1.0 - uvc.x), min(uvc.y, 1.0 - uvc.y));
    float rough = 0.010 + 0.008 * p8Noise(uvc * uGrid * 6.0);
    float inSheet = smoothstep(0.0, rough, edge);
    col *= mix(0.22, 1.0, inSheet);
    col = mix(col, uBrass * 0.50, (1.0 - smoothstep(0.0, 0.005, edge)) * 0.55);

    // The roll itself casts a soft shadow just behind the leading edge.
    col *= mix(0.45, 1.0, rollEdge);

    gl_FragColor = vec4(col, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const fogVertex = chartVertex;

export const fogFragment = /* glsl */ `
  precision highp float;

  ${noiseChunk}

  uniform sampler2D uIntel;
  uniform vec2  uGrid;
  uniform float uUnroll;     // kept in step with the sheet: the fog bank unrolls with the chart
  uniform float uTime;
  uniform float uDensity;

  varying vec2 vUv;

  void main() {
    // The fog plane is exactly the playable square, so raw vUv tracks the sheet.
    if (vUv.x > uUnroll) discard;
    float intel = texture2D(uIntel, vUv).b;

    // hidden = 1.0 fog, stale = 0.55, current = 0.0
    float fogAmount = (1.0 - intel) * uDensity;
    if (fogAmount < 0.01) discard;

    // Two drifting octaves so the bank rolls rather than sits.
    vec2 drift = vec2(uTime * 0.011, -uTime * 0.007);
    float bank = p8Fbm(vUv * uGrid * 1.25 + drift);
    float fine = p8Fbm(vUv * uGrid * 3.10 - drift * 1.7);

    float alpha = fogAmount * (0.28 + 0.72 * bank) * (0.72 + 0.28 * fine);
    alpha = smoothstep(0.02, 0.80, alpha);

    // Cold sea mist, a little warmer where the lantern reaches it.
    vec3 cold = vec3(0.075, 0.105, 0.125);
    vec3 warm = vec3(0.230, 0.215, 0.185);
    vec3 fogCol = mix(cold, warm, bank * 0.55);

    gl_FragColor = vec4(fogCol, alpha * 0.94);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
