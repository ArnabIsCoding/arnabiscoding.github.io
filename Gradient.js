// Converting colors to proper format
function normalizeColor(hexCode) {
  return [(hexCode >> 16 & 255) / 255, (hexCode >> 8 & 255) / 255, (255 & hexCode) / 255]
}

// Essential functionality of WebGl
class MiniGl {
  constructor(canvas, width, height, debug = false) {
    const _miniGl = this,
      debug_output = -1 !== document.location.search.toLowerCase().indexOf("debug=webgl");
    _miniGl.canvas = canvas, _miniGl.gl = _miniGl.canvas.getContext("webgl", { antialias: true }), _miniGl.meshes = [];
    const context = _miniGl.gl;
    width && height && this.setSize(width, height),
    _miniGl.lastDebugMsg,
    _miniGl.debug = debug && debug_output ? function(e) {
      const t = new Date;
      t - _miniGl.lastDebugMsg > 1e3 && console.log("---"),
      console.log(t.toLocaleTimeString() + Array(Math.max(0, 32 - e.length)).join(" ") + e + ": ", ...Array.from(arguments).slice(1)),
      _miniGl.lastDebugMsg = t
    } : () => {};

    Object.defineProperties(_miniGl, {
      Material: {
        enumerable: false,
        value: class {
          constructor(vertexShaders, fragments, uniforms = {}) {
            const material = this;
            function getShaderByType(type, source) {
              const shader = context.createShader(type);
              return context.shaderSource(shader, source), context.compileShader(shader),
                context.getShaderParameter(shader, context.COMPILE_STATUS) || console.error(context.getShaderInfoLog(shader)),
                _miniGl.debug("Material.compileShaderSource", { source: source }), shader
            }
            function getUniformVariableDeclarations(uniforms, type) {
              return Object.entries(uniforms).map(([uniform, value]) => value.getDeclaration(uniform, type)).join("\n")
            }
            material.uniforms = uniforms, material.uniformInstances = [];
            const prefix = "\n              precision highp float;\n            ";
            material.vertexSource = `\n              ${prefix}\n              attribute vec4 position;\n              attribute vec2 uv;\n              attribute vec2 uvNorm;\n              ${getUniformVariableDeclarations(_miniGl.commonUniforms, "vertex")}\n              ${getUniformVariableDeclarations(uniforms, "vertex")}\n              ${vertexShaders}\n            `,
            material.Source = `\n              ${prefix}\n              ${getUniformVariableDeclarations(_miniGl.commonUniforms, "fragment")}\n              ${getUniformVariableDeclarations(uniforms, "fragment")}\n              ${fragments}\n            `,
            material.vertexShader = getShaderByType(context.VERTEX_SHADER, material.vertexSource),
            material.fragmentShader = getShaderByType(context.FRAGMENT_SHADER, material.Source),
            material.program = context.createProgram(),
            context.attachShader(material.program, material.vertexShader),
            context.attachShader(material.program, material.fragmentShader),
            context.linkProgram(material.program),
            context.getProgramParameter(material.program, context.LINK_STATUS) || console.error(context.getProgramInfoLog(material.program)),
            context.useProgram(material.program),
            material.attachUniforms(void 0, _miniGl.commonUniforms),
            material.attachUniforms(void 0, material.uniforms)
          }
          attachUniforms(name, uniforms) {
            const material = this;
            void 0 === name
              ? Object.entries(uniforms).forEach(([name, uniform]) => { material.attachUniforms(name, uniform) })
              : "array" == uniforms.type
                ? uniforms.value.forEach((uniform, i) => material.attachUniforms(`${name}[${i}]`, uniform))
                : "struct" == uniforms.type
                  ? Object.entries(uniforms.value).forEach(([uniform, i]) => material.attachUniforms(`${name}.${uniform}`, i))
                  : (_miniGl.debug("Material.attachUniforms", { name: name, uniform: uniforms }),
                    material.uniformInstances.push({ uniform: uniforms, location: context.getUniformLocation(material.program, name) }))
          }
        }
      },
      Uniform: {
        enumerable: false,
        value: class {
          constructor(e) {
            this.type = "float", Object.assign(this, e);
            this.typeFn = { float: "1f", int: "1i", vec2: "2fv", vec3: "3fv", vec4: "4fv", mat4: "Matrix4fv" }[this.type] || "1f";
            this.update()
          }
          update(value) {
            void 0 !== this.value && context[`uniform${this.typeFn}`](value, 0 === this.typeFn.indexOf("Matrix") ? this.transpose : this.value, 0 === this.typeFn.indexOf("Matrix") ? this.value : null)
          }
          getDeclaration(name, type, length) {
            const uniform = this;
            if (uniform.excludeFrom !== type) {
              if ("array" === uniform.type) return uniform.value[0].getDeclaration(name, type, uniform.value.length) + `\nconst int ${name}_length = ${uniform.value.length};`;
              if ("struct" === uniform.type) {
                let name_no_prefix = name.replace("u_", "");
                return name_no_prefix = name_no_prefix.charAt(0).toUpperCase() + name_no_prefix.slice(1),
                  `uniform struct ${name_no_prefix}\n{\n` +
                  Object.entries(uniform.value).map(([name, uniform]) => uniform.getDeclaration(name, type).replace(/^uniform/, "")).join("") +
                  `\n} ${name}${length > 0 ? `[${length}]` : ""};`
              }
              return `uniform ${uniform.type} ${name}${length > 0 ? `[${length}]` : ""};`
            }
          }
        }
      },
      PlaneGeometry: {
        enumerable: false,
        value: class {
          constructor(width, height, n, i, orientation) {
            context.createBuffer(), this.attributes = {
              position: new _miniGl.Attribute({ target: context.ARRAY_BUFFER, size: 3 }),
              uv: new _miniGl.Attribute({ target: context.ARRAY_BUFFER, size: 2 }),
              uvNorm: new _miniGl.Attribute({ target: context.ARRAY_BUFFER, size: 2 }),
              index: new _miniGl.Attribute({ target: context.ELEMENT_ARRAY_BUFFER, size: 3, type: context.UNSIGNED_SHORT })
            }, this.setTopology(n, i), this.setSize(width, height, orientation)
          }
          setTopology(e = 1, t = 1) {
            const n = this;
            n.xSegCount = e, n.ySegCount = t, n.vertexCount = (n.xSegCount + 1) * (n.ySegCount + 1), n.quadCount = n.xSegCount * n.ySegCount * 2,
            n.attributes.uv.values = new Float32Array(2 * n.vertexCount),
            n.attributes.uvNorm.values = new Float32Array(2 * n.vertexCount),
            n.attributes.index.values = new Uint16Array(3 * n.quadCount);
            for (let e = 0; e <= n.ySegCount; e++)
              for (let t = 0; t <= n.xSegCount; t++) {
                const i = e * (n.xSegCount + 1) + t;
                if (n.attributes.uv.values[2 * i] = t / n.xSegCount,
                  n.attributes.uv.values[2 * i + 1] = 1 - e / n.ySegCount,
                  n.attributes.uvNorm.values[2 * i] = t / n.xSegCount * 2 - 1,
                  n.attributes.uvNorm.values[2 * i + 1] = 1 - e / n.ySegCount * 2,
                  t < n.xSegCount && e < n.ySegCount) {
                  const s = e * n.xSegCount + t;
                  n.attributes.index.values[6 * s] = i,
                  n.attributes.index.values[6 * s + 1] = i + 1 + n.xSegCount,
                  n.attributes.index.values[6 * s + 2] = i + 1,
                  n.attributes.index.values[6 * s + 3] = i + 1,
                  n.attributes.index.values[6 * s + 4] = i + 1 + n.xSegCount,
                  n.attributes.index.values[6 * s + 5] = i + 2 + n.xSegCount
                }
              }
            n.attributes.uv.update(), n.attributes.uvNorm.update(), n.attributes.index.update(),
            _miniGl.debug("Geometry.setTopology", { uv: n.attributes.uv, uvNorm: n.attributes.uvNorm, index: n.attributes.index })
          }
          setSize(width = 1, height = 1, orientation = "xz") {
            const geometry = this;
            geometry.width = width, geometry.height = height, geometry.orientation = orientation,
            geometry.attributes.position.values && geometry.attributes.position.values.length === 3 * geometry.vertexCount
              || (geometry.attributes.position.values = new Float32Array(3 * geometry.vertexCount));
            const o = width / -2, r = height / -2,
              segment_width = width / geometry.xSegCount,
              segment_height = height / geometry.ySegCount;
            for (let yIndex = 0; yIndex <= geometry.ySegCount; yIndex++) {
              const t = r + yIndex * segment_height;
              for (let xIndex = 0; xIndex <= geometry.xSegCount; xIndex++) {
                const r = o + xIndex * segment_width, l = yIndex * (geometry.xSegCount + 1) + xIndex;
                geometry.attributes.position.values[3 * l + "xyz".indexOf(orientation[0])] = r,
                geometry.attributes.position.values[3 * l + "xyz".indexOf(orientation[1])] = -t
              }
            }
            geometry.attributes.position.update(),
            _miniGl.debug("Geometry.setSize", { position: geometry.attributes.position })
          }
        }
      },
      Mesh: {
        enumerable: false,
        value: class {
          constructor(geometry, material) {
            const mesh = this;
            mesh.geometry = geometry, mesh.material = material, mesh.wireframe = false, mesh.attributeInstances = [],
            Object.entries(mesh.geometry.attributes).forEach(([e, attribute]) => {
              mesh.attributeInstances.push({ attribute: attribute, location: attribute.attach(e, mesh.material.program) })
            }),
            _miniGl.meshes.push(mesh),
            _miniGl.debug("Mesh.constructor", { mesh: mesh })
          }
          draw() {
            context.useProgram(this.material.program),
            this.material.uniformInstances.forEach(({ uniform: e, location: t }) => e.update(t)),
            this.attributeInstances.forEach(({ attribute: e, location: t }) => e.use(t)),
            context.drawElements(this.wireframe ? context.LINES : context.TRIANGLES, this.geometry.attributes.index.values.length, context.UNSIGNED_SHORT, 0)
          }
          remove() { _miniGl.meshes = _miniGl.meshes.filter(e => e != this) }
        }
      },
      Attribute: {
        enumerable: false,
        value: class {
          constructor(e) {
            this.type = context.FLOAT, this.normalized = false, this.buffer = context.createBuffer(),
            Object.assign(this, e), this.update()
          }
          update() {
            void 0 !== this.values && (context.bindBuffer(this.target, this.buffer), context.bufferData(this.target, this.values, context.STATIC_DRAW))
          }
          attach(e, t) {
            const n = context.getAttribLocation(t, e);
            return this.target === context.ARRAY_BUFFER && (context.enableVertexAttribArray(n), context.vertexAttribPointer(n, this.size, this.type, this.normalized, 0, 0)), n
          }
          use(e) {
            context.bindBuffer(this.target, this.buffer),
            this.target === context.ARRAY_BUFFER && (context.enableVertexAttribArray(e), context.vertexAttribPointer(e, this.size, this.type, this.normalized, 0, 0))
          }
        }
      }
    });

    const a = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    _miniGl.commonUniforms = {
      projectionMatrix: new _miniGl.Uniform({ type: "mat4", value: a }),
      modelViewMatrix: new _miniGl.Uniform({ type: "mat4", value: a }),
      resolution: new _miniGl.Uniform({ type: "vec2", value: [1, 1] }),
      aspectRatio: new _miniGl.Uniform({ type: "float", value: 1 })
    }
  }

  setSize(e = 640, t = 480) {
    this.width = e, this.height = t, this.canvas.width = e, this.canvas.height = t,
    this.gl.viewport(0, 0, e, t),
    this.commonUniforms.resolution.value = [e, t],
    this.commonUniforms.aspectRatio.value = e / t,
    this.debug("MiniGL.setSize", { width: e, height: t })
  }

  setOrthographicCamera(e = 0, t = 0, n = 0, i = -2e3, s = 2e3) {
    this.commonUniforms.projectionMatrix.value = [2 / this.width, 0, 0, 0, 0, 2 / this.height, 0, 0, 0, 0, 2 / (i - s), 0, e, t, n, 1],
    this.debug("setOrthographicCamera", this.commonUniforms.projectionMatrix.value)
  }

  render() {
    this.gl.clearColor(0, 0, 0, 0), this.gl.clearDepth(1), this.meshes.forEach(e => e.draw())
  }
}


// Sets initial properties
function e(object, propertyName, val) {
  return propertyName in object
    ? Object.defineProperty(object, propertyName, { value: val, enumerable: true, configurable: true, writable: true })
    : object[propertyName] = val, object
}


// ─────────────────────────────────────────────────────────────────────────────
// BIOELECTRIC SHADERS
// ─────────────────────────────────────────────────────────────────────────────

/*
 * Simplex noise (Ashima Arts / Ian McEwan)
 * Renamed internal helpers to avoid conflicts with the original code.
 */
const NOISE_GLSL = `
vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x)  { return mod289v4(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g  = step(x0.yzx, x0.xyz);
  vec3 l  = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289v3(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3  ns  = n_ * D.wyz - D.xzx;
  vec4  j   = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x  = x_ * ns.x + ns.yyyy;
  vec4 y  = y_ * ns.x + ns.yyyy;
  vec4 h  = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

/*
 * VERTEX SHADER
 * Adds two layers of sharp, power-curved noise on top of the base displacement
 * to produce electrical arc / action-potential ridges.
 */
const VERTEX_GLSL = `
varying vec3 v_color;
varying vec2 v_uv;

void main() {
  float time = u_time * u_global.noiseSpeed;
  vec2 noiseCoord = resolution * uvNorm * u_global.noiseFreq;
  v_uv = uv;

  // --- Plane tilt (unchanged from original) ---
  float tilt    = resolution.y / 2.0 * uvNorm.y;
  float incline = resolution.x * uvNorm.x / 2.0 * u_vertDeform.incline;
  float offset  = resolution.x / 2.0 * u_vertDeform.incline
                  * mix(u_vertDeform.offsetBottom, u_vertDeform.offsetTop, uv.y);

  // --- Base organic displacement ---
  float noise = snoise(vec3(
    noiseCoord.x * u_vertDeform.noiseFreq.x + time * u_vertDeform.noiseFlow,
    noiseCoord.y * u_vertDeform.noiseFreq.y,
    time * u_vertDeform.noiseSpeed + u_vertDeform.noiseSeed
  )) * u_vertDeform.noiseAmp;

  // --- Electrical arc layer 1: coarse ridges ---
  float electric1 = snoise(vec3(
    noiseCoord.x * 12.0 + time * 4.0,
    noiseCoord.y * 8.0,
    time * 2.0 + 33.0
  ));
  // Raise to a power to sharpen peaks, preserve sign for bidirectional spikes
  float arc1 = pow(abs(electric1), 3.0) * sign(electric1) * 180.0;

  // --- Electrical arc layer 2: fine crackling ---
  float electric2 = snoise(vec3(
    noiseCoord.x * 20.0 - time * 3.0,
    noiseCoord.y * 15.0,
    time * 3.0 + 77.0
  ));
  float arc2 = pow(abs(electric2), 4.0) * sign(electric2) * 90.0;

  noise += arc1 + arc2;

  // Fade to zero at top/bottom edges
  noise *= 1.0 - pow(abs(uvNorm.y), 2.0);
  noise  = max(0.0, noise);

  vec3 pos = vec3(
    position.x,
    position.y + tilt + incline + noise - offset,
    position.z
  );

  // --- Color blending (same logic as original, sharpened transition) ---
  if (u_active_colors[0] == 1.) {
    v_color = u_baseColor;
  }

  for (int i = 0; i < u_waveLayers_length; i++) {
    if (u_active_colors[i + 1] == 1.) {
      WaveLayers layer = u_waveLayers[i];

      float n = smoothstep(
        layer.noiseFloor,
        layer.noiseCeil,
        snoise(vec3(
          noiseCoord.x * layer.noiseFreq.x + time * layer.noiseFlow,
          noiseCoord.y * layer.noiseFreq.y,
          time * layer.noiseSpeed + layer.noiseSeed
        )) / 2.0 + 0.5
      );
      // Sharpen color boundary for electrical look
      n = pow(n, 2.0);
      v_color = mix(v_color, layer.color, n);
    }
  }

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

/*
 * FRAGMENT SHADER
 * Adds three bio-computing overlays on top of the interpolated vertex colour:
 *   1. Horizontal scan pulses  — EEG / oscilloscope trace bands
 *   2. Vertical column pulses  — data-bus / neural-column firing
 *   3. Edge vignette           — frames the active bio field
 *   4. Noise grain             — organic micro-texture
 */
const FRAGMENT_GLSL = `
varying vec3 v_color;
varying vec2 v_uv;

void main() {
  vec3 color = v_color;

  // 1. Horizontal scan-line pulses (tight bright bands, EEG / oscilloscope)
  float scan      = sin(v_uv.y * resolution.y * 0.8 + u_time * 0.012) * 0.5 + 0.5;
  float scanSharp = pow(scan, 12.0);
  color += scanSharp * vec3(0.0, 0.12, 0.10) * color;

  // 2. Vertical column pulses (data bus / neural-column signals)
  float col      = sin(v_uv.x * resolution.x * 0.4 - u_time * 0.018) * 0.5 + 0.5;
  float colSharp = pow(col, 16.0);
  color += colSharp * vec3(0.05, 0.0, 0.08) * color;

  // 3. Edge vignette — darkens perimeter to focus the bio field
  vec2  centered = v_uv * 2.0 - 1.0;
  float vignette = 1.0 - dot(centered * 0.6, centered * 0.6);
  color *= vignette;

  // 4. Subtle noise grain for organic texture
  float grain = fract(sin(dot(v_uv, vec2(127.1, 311.7)) + u_time * 0.001) * 43758.5);
  color += grain * 0.018;

  // Original top-darkening (kept for compatibility)
  if (u_darken_top == 1.0) {
    vec2 st = gl_FragCoord.xy / resolution.xy;
    color.g -= pow(st.y + sin(-12.0) * st.x, u_shadow_power) * 0.4;
  }

  gl_FragColor = vec4(color, 1.0);
}
`;


// ─────────────────────────────────────────────────────────────────────────────
// Gradient class (structure identical to original; shaders + colors swapped)
// ─────────────────────────────────────────────────────────────────────────────

class Gradient {
  constructor(...t) {
    e(this, "el", void 0),
    e(this, "cssVarRetries", 0),
    e(this, "maxCssVarRetries", 200),
    e(this, "angle", 0),
    e(this, "isLoadedClass", false),
    e(this, "isScrolling", false),
    e(this, "scrollingTimeout", void 0),
    e(this, "scrollingRefreshDelay", 200),
    e(this, "isIntersecting", false),
    e(this, "shaderFiles", void 0),
    e(this, "vertexShader", void 0),
    e(this, "sectionColors", void 0),
    e(this, "computedCanvasStyle", void 0),
    e(this, "conf", void 0),
    e(this, "uniforms", void 0),
    e(this, "t", 1253106),
    e(this, "last", 0),
    e(this, "width", void 0),
    e(this, "minWidth", 1111),
    e(this, "height", 600),
    e(this, "xSegCount", void 0),
    e(this, "ySegCount", void 0),
    e(this, "mesh", void 0),
    e(this, "material", void 0),
    e(this, "geometry", void 0),
    e(this, "minigl", void 0),
    e(this, "scrollObserver", void 0),
    // Bioelectric amplitude — higher = more dramatic arc spikes
    e(this, "amp", 320),
    e(this, "seed", 5),
    e(this, "freqX", 14e-5),
    e(this, "freqY", 29e-5),
    e(this, "freqDelta", 1e-5),
    e(this, "activeColors", [1, 1, 1, 1]),
    e(this, "isMetaKey", false),
    e(this, "isGradientLegendVisible", false),
    e(this, "isMouseDown", false),
    e(this, "handleScroll", () => {
      clearTimeout(this.scrollingTimeout),
      this.scrollingTimeout = setTimeout(this.handleScrollEnd, this.scrollingRefreshDelay),
      this.isGradientLegendVisible && this.hideGradientLegend(),
      this.conf.playing && (this.isScrolling = true, this.pause())
    }),
    e(this, "handleScrollEnd", () => {
      this.isScrolling = false, this.isIntersecting && this.play()
    }),
    e(this, "resize", () => {
      this.width = window.innerWidth,
      this.minigl.setSize(this.width, this.height),
      this.minigl.setOrthographicCamera(),
      this.xSegCount = Math.ceil(this.width * this.conf.density[0]),
      this.ySegCount = Math.ceil(this.height * this.conf.density[1]),
      this.mesh.geometry.setTopology(this.xSegCount, this.ySegCount),
      this.mesh.geometry.setSize(this.width, this.height),
      this.mesh.material.uniforms.u_shadow_power.value = this.width < 600 ? 5 : 6
    }),
    e(this, "handleMouseDown", e => {
      this.isGradientLegendVisible && (this.isMetaKey = e.metaKey, this.isMouseDown = true,
        false === this.conf.playing && requestAnimationFrame(this.animate))
    }),
    e(this, "handleMouseUp", () => { this.isMouseDown = false }),
    e(this, "animate", e => {
      if (!this.shouldSkipFrame(e) || this.isMouseDown) {
        if (this.t += Math.min(e - this.last, 1e3 / 15), this.last = e, this.isMouseDown) {
          let e = 160;
          this.isMetaKey && (e = -160), this.t += e
        }
        this.mesh.material.uniforms.u_time.value = this.t, this.minigl.render()
      }
      if (0 !== this.last && this.isStatic) return this.minigl.render(), void this.disconnect();
      (this.conf.playing || this.isMouseDown) && requestAnimationFrame(this.animate)
    }),
    e(this, "addIsLoadedClass", () => {
      !this.isLoadedClass && (this.isLoadedClass = true, this.el.classList.add("isLoaded"),
        setTimeout(() => { this.el.parentElement.classList.add("isLoaded") }, 3e3))
    }),
    e(this, "pause", () => { this.conf.playing = false }),
    e(this, "play", () => { requestAnimationFrame(this.animate), this.conf.playing = true }),
    e(this, "initGradient", (selector) => {
      this.el = document.querySelector(selector);
      this.connect();
      return this
    })
  }

  async connect() {
    // ── Bioelectric shader files ──────────────────────────────────────────
    this.shaderFiles = {
      vertex:   VERTEX_GLSL,
      noise:    NOISE_GLSL,
      // blend utilities not needed — colour mixing is done inline in vertex shader
      blend:    "",
      fragment: FRAGMENT_GLSL,
    }

    this.conf = {
      presetName: "",
      wireframe:  false,
      density:    [.06, .16],
      zoom:       1,
      rotation:   0,
      playing:    true
    }

    document.querySelectorAll("canvas").length < 1
      ? console.log("DID NOT LOAD HERO STRIPE CANVAS")
      : (
        this.minigl = new MiniGl(this.el, null, null, true),
        requestAnimationFrame(() => {
          this.el && (this.computedCanvasStyle = getComputedStyle(this.el), this.waitForCssVars())
        })
      )
  }

  disconnect() {
    this.scrollObserver && (
      window.removeEventListener("scroll", this.handleScroll),
      window.removeEventListener("mousedown", this.handleMouseDown),
      window.removeEventListener("mouseup", this.handleMouseUp),
      window.removeEventListener("keydown", this.handleKeyDown),
      this.scrollObserver.disconnect()
    ),
    window.removeEventListener("resize", this.resize)
  }

  initMaterial() {
    this.uniforms = {
      u_time: new this.minigl.Uniform({ value: 0 }),
      u_shadow_power: new this.minigl.Uniform({ value: 5 }),
      u_darken_top: new this.minigl.Uniform({
        value: "" === this.el.dataset.jsDarkenTop ? 1 : 0
      }),
      u_active_colors: new this.minigl.Uniform({ value: this.activeColors, type: "vec4" }),
      u_global: new this.minigl.Uniform({
        value: {
          noiseFreq: new this.minigl.Uniform({ value: [this.freqX, this.freqY], type: "vec2" }),
          noiseSpeed: new this.minigl.Uniform({ value: 5e-6 })
        },
        type: "struct"
      }),
      u_vertDeform: new this.minigl.Uniform({
        value: {
          incline:      new this.minigl.Uniform({ value: Math.sin(this.angle) / Math.cos(this.angle) }),
          offsetTop:    new this.minigl.Uniform({ value: -.5 }),
          offsetBottom: new this.minigl.Uniform({ value: -.5 }),
          noiseFreq:    new this.minigl.Uniform({ value: [3, 4], type: "vec2" }),
          noiseAmp:     new this.minigl.Uniform({ value: this.amp }),
          noiseSpeed:   new this.minigl.Uniform({ value: 10 }),
          noiseFlow:    new this.minigl.Uniform({ value: 3 }),
          noiseSeed:    new this.minigl.Uniform({ value: this.seed })
        },
        type: "struct",
        excludeFrom: "fragment"
      }),
      u_baseColor: new this.minigl.Uniform({
        value: this.sectionColors[0],
        type: "vec3",
        excludeFrom: "fragment"
      }),
      u_waveLayers: new this.minigl.Uniform({
        value: [],
        excludeFrom: "fragment",
        type: "array"
      })
    }

    for (let e = 1; e < this.sectionColors.length; e += 1) {
      this.uniforms.u_waveLayers.value.push(new this.minigl.Uniform({
        value: {
          color:      new this.minigl.Uniform({ value: this.sectionColors[e], type: "vec3" }),
          noiseFreq:  new this.minigl.Uniform({ value: [2 + e / this.sectionColors.length, 3 + e / this.sectionColors.length], type: "vec2" }),
          noiseSpeed: new this.minigl.Uniform({ value: 11 + .3 * e }),
          noiseFlow:  new this.minigl.Uniform({ value: 6.5 + .3 * e }),
          noiseSeed:  new this.minigl.Uniform({ value: this.seed + 10 * e }),
          noiseFloor: new this.minigl.Uniform({ value: .1 }),
          noiseCeil:  new this.minigl.Uniform({ value: .63 + .07 * e })
        },
        type: "struct"
      }))
    }

    // Combine noise + vertex shader (blend not needed)
    this.vertexShader = [this.shaderFiles.noise, this.shaderFiles.vertex].join("\n\n")
    return new this.minigl.Material(this.vertexShader, this.shaderFiles.fragment, this.uniforms)
  }

  initMesh() {
    this.material = this.initMaterial(),
    this.geometry = new this.minigl.PlaneGeometry,
    this.mesh = new this.minigl.Mesh(this.geometry, this.material)
  }

  shouldSkipFrame(e) {
    return !!window.document.hidden || (!this.conf.playing || (parseInt(e, 10) % 2 == 0 || void 0))
  }

  updateFrequency(e) { this.freqX += e, this.freqY += e }

  toggleColor(index) { this.activeColors[index] = 0 === this.activeColors[index] ? 1 : 0 }

  showGradientLegend() {
    this.width > this.minWidth && (this.isGradientLegendVisible = true, document.body.classList.add("isGradientLegendVisible"))
  }

  hideGradientLegend() {
    this.isGradientLegendVisible = false, document.body.classList.remove("isGradientLegendVisible")
  }

  init() {
    this.initGradientColors(), this.initMesh(), this.resize(),
    requestAnimationFrame(this.animate),
    window.addEventListener("resize", this.resize)
  }

  waitForCssVars() {
    if (this.computedCanvasStyle && -1 !== this.computedCanvasStyle.getPropertyValue("--gradient-color-1").indexOf("#")) {
      this.init(), this.addIsLoadedClass()
    } else {
      if (this.cssVarRetries += 1, this.cssVarRetries > this.maxCssVarRetries) {
        // Bioelectric fallback palette: cyan / electric-purple / bio-green / hot-magenta
        return this.sectionColors = [0x0affed, 0x7b2fff, 0x00ff88, 0xff00a0].map(normalizeColor),
          void this.init()
      }
      requestAnimationFrame(() => this.waitForCssVars())
    }
  }

  initGradientColors() {
    this.sectionColors = ["--gradient-color-1", "--gradient-color-2", "--gradient-color-3", "--gradient-color-4"]
      .map(cssPropertyName => {
        let hex = this.computedCanvasStyle.getPropertyValue(cssPropertyName).trim()
        if (4 === hex.length) {
          const hexTemp = hex.substr(1).split("").map(c => c + c).join("")
          hex = `#${hexTemp}`
        }
        return hex && `0x${hex.substr(1)}`
      })
      .filter(Boolean)
      .map(normalizeColor)
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Usage
// ─────────────────────────────────────────────────────────────────────────────
//
// HTML canvas — set the four CSS custom properties to control colours,
// or leave them unset to fall back to the built-in bioelectric palette:
//
//   <canvas id="gradient-canvas" style="
//     --gradient-color-1: #0affed;
//     --gradient-color-2: #7b2fff;
//     --gradient-color-3: #00ff88;
//     --gradient-color-4: #ff00a0;
//   "></canvas>
//
// Then:
//   const gradient = new Gradient()
//   gradient.initGradient('#gradient-canvas')
//
// Runtime controls:
//   gradient.pause()
//   gradient.play()
//   gradient.amp = 600                           // bigger arc spikes
//   gradient.updateFrequency(1e-5)               // shift wave frequency
//   gradient.toggleColor(index)                  // enable / disable a colour layer
//   gradient.uniforms.u_global.value             // tweak noiseSpeed live
// ─────────────────────────────────────────────────────────────────────────────

const gradient = new Gradient()
gradient.initGradient('#gradient-canvas')
