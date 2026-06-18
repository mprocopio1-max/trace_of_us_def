import * as THREE from "three";
      import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";
      import GUI from "https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm";
      import * as Tone from "https://cdn.jsdelivr.net/npm/tone@14.8.49/+esm";

      const settings = {
        nodeCount: 150,
        connectionLimit: 3,
        connectionDistance: 96,
        bundleCount: 2,
        pulseRate: 0.18,
        glowBoost: 0.78,
        networkOpen: 0.38,
        drift: 0.22,
        filamentNoise: 0.28,
        terrainDensity: 4200,
        terrainAmplitude: 15,
        particleCount: 2200,
        memoryBias: 0.5,
        audioDepth: 0.5,
        autoOrbit: 0.13,
      };

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      scene.fog = new THREE.Fog(0x000000, 160, 760);

      const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 2000);
      camera.position.set(0, 78, 285);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (THREE && typeof THREE.SRGBColorSpace !== "undefined") {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      }
      renderer.setClearColor(0x000000, 1);
      renderer.domElement.style.touchAction = "none";
      document.body.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.045;
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.enableRotate = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = settings.autoOrbit;
      controls.minDistance = 70;
      controls.maxDistance = 620;
      controls.target.set(0, 0, 0);

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const presencePoint = new THREE.Vector3();
      const smoothedPresence = new THREE.Vector3();
      const presencePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const clock = new THREE.Clock();
      const uiStats = document.getElementById("stats");
      let startHint = document.getElementById("startHint");
      if (!startHint) {
        startHint = document.createElement("div");
        startHint.id = "startHint";
        startHint.style.position = "fixed";
        startHint.style.left = "18px";
        startHint.style.bottom = "18px";
        startHint.style.padding = "8px 10px";
        startHint.style.background = "rgba(0,0,0,0.36)";
        startHint.style.color = "#fff";
        startHint.style.borderRadius = "6px";
        startHint.style.zIndex = 9998;
        startHint.style.fontFamily = "sans-serif";
        startHint.style.fontSize = "13px";
        startHint.textContent = "awaiting permissions";
        document.body.appendChild(startHint);
      }

      const tmpVecA = new THREE.Vector3();
      const tmpVecB = new THREE.Vector3();
      const tmpVecC = new THREE.Vector3();
      const tmpVecD = new THREE.Vector3();
      const tmpColor = new THREE.Color();
      const upVector = new THREE.Vector3(0, 1, 0);
      const rightVector = new THREE.Vector3(1, 0, 0);

      function clamp01(value) {
        return Math.min(1, Math.max(0, value));
      }

      function lerpRange(value, inMin, inMax, outMin, outMax) {
        const t = clamp01((value - inMin) / (inMax - inMin));
        return outMin + (outMax - outMin) * t;
      }

      function pseudoNoise(x, y, z) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
        return n - Math.floor(n);
      }

      function layeredNoise(x, y, z, t) {
        const a = pseudoNoise(x + t * 0.7, y, z);
        const b = pseudoNoise(x * 1.9, y + t * 0.45, z * 1.7);
        const c = pseudoNoise(x * 0.8, y * 1.6, z + t * 0.3);
        return a * 0.52 + b * 0.31 + c * 0.17;
      }

      function createRadialTexture(inner = 0.12, outer = 1) {
        const size = 128;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const gradient = ctx.createRadialGradient(size * 0.5, size * 0.5, size * inner, size * 0.5, size * 0.5, size * outer * size * 0.5);
        gradient.addColorStop(0, "rgba(255,255,255,1)");
        gradient.addColorStop(0.18, "rgba(255,255,255,0.9)");
        gradient.addColorStop(0.45, "rgba(255,255,255,0.28)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        return new THREE.CanvasTexture(canvas);
      }

      function createSquareTexture() {
        const size = 64;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, size, size);
            // draw a circular marker rather than a square
            const cx = size * 0.5;
            const cy = size * 0.5;
            const radius = size * 0.36;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = "rgba(255,255,255,0.22)";
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.95)";
            ctx.lineWidth = 3;
            ctx.stroke();
        return new THREE.CanvasTexture(canvas);
      }

      function createLabelTexture(text) {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = "28px Consolas, monospace";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 26, 64);
        return new THREE.CanvasTexture(canvas);
      }

      const textures = {
        glow: createRadialTexture(0.04, 1),
        label: createLabelTexture("NODE // MEMORY TRACE"),
        marker: createSquareTexture(),
      };

      // billboards list for camera-facing circle meshes
      const billboards = [];

      function createBillboardCircle(texture, diameter = 1, options = {}) {
        const geom = new THREE.CircleGeometry(0.5, 32);
        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          blending: options.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
          side: THREE.DoubleSide,
          opacity: options.opacity !== undefined ? options.opacity : 1,
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.scale.set(diameter, diameter, 1);
        mesh.userData.isBillboard = true;
        billboards.push(mesh);
        return mesh;
      }

      class MemoryField {
        constructor(volume = 420) {
          this.volume = volume;
          this.traces = [];
          this.samples = 0;
          this.globalDensity = 0;
          this.maxTraces = 520;
          this.gridX = 24;
          this.gridY = 12;
          this.gridZ = 24;
          this.traceGeometry = new THREE.BufferGeometry();
          this.tracePositions = new Float32Array(this.maxTraces * 3);
          this.traceColors = new Float32Array(this.maxTraces * 3);
          this.traceGeometry.setAttribute("position", new THREE.BufferAttribute(this.tracePositions, 3));
          this.traceGeometry.setAttribute("color", new THREE.BufferAttribute(this.traceColors, 3));
          this.traceMaterial = new THREE.PointsMaterial({
            size: 1.1,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            vertexColors: true,
            map: textures.glow,
            blending: THREE.AdditiveBlending,
          });
          this.points = new THREE.Points(this.traceGeometry, this.traceMaterial);
          this.points.frustumCulled = false;
          this.grid = new Float32Array(this.gridX * this.gridY * this.gridZ);
        }

        recordPresence(position, intensity = 1) {
          const strength = Math.max(0.04, intensity);
          this.traces.push({
            position: position.clone(),
            age: 0,
            life: 9999,
            strength,
            radius: 10 + strength * 30,
          });

          this.deposit(position, strength);

          if (this.traces.length > this.maxTraces) {
            this.traces.splice(0, this.traces.length - this.maxTraces);
          }
        }

        sample(position) {
          const fx = THREE.MathUtils.mapLinear(position.x, -this.volume, this.volume, 0, this.gridX - 1);
          const fy = THREE.MathUtils.mapLinear(position.y, -this.volume * 0.5, this.volume * 0.5, 0, this.gridY - 1);
          const fz = THREE.MathUtils.mapLinear(position.z, -this.volume, this.volume, 0, this.gridZ - 1);

          const x0 = Math.floor(fx);
          const y0 = Math.floor(fy);
          const z0 = Math.floor(fz);
          const x1 = x0 + 1;
          const y1 = y0 + 1;
          const z1 = z0 + 1;
          const tx = fx - x0;
          const ty = fy - y0;
          const tz = fz - z0;

          const c000 = this._sampleCell(x0, y0, z0);
          const c100 = this._sampleCell(x1, y0, z0);
          const c010 = this._sampleCell(x0, y1, z0);
          const c110 = this._sampleCell(x1, y1, z0);
          const c001 = this._sampleCell(x0, y0, z1);
          const c101 = this._sampleCell(x1, y0, z1);
          const c011 = this._sampleCell(x0, y1, z1);
          const c111 = this._sampleCell(x1, y1, z1);

          const x00 = c000 * (1 - tx) + c100 * tx;
          const x10 = c010 * (1 - tx) + c110 * tx;
          const x01 = c001 * (1 - tx) + c101 * tx;
          const x11 = c011 * (1 - tx) + c111 * tx;
          const y0Mix = x00 * (1 - ty) + x10 * ty;
          const y1Mix = x01 * (1 - ty) + x11 * ty;
          const gridDensity = y0Mix * (1 - tz) + y1Mix * tz;

          let traceDensity = 0;
          for (let i = this.traces.length - 1; i >= 0; i--) {
            const trace = this.traces[i];
            const distance = trace.position.distanceTo(position);
            const falloff = clamp01(1 - distance / trace.radius);
            traceDensity += falloff * falloff * trace.strength;
          }

          return Math.log1p(gridDensity + traceDensity * 0.9);
        }

        update(dt) {
          let active = 0;
          let totalDensity = 0;

          for (let i = this.traces.length - 1; i >= 0; i--) {
            const trace = this.traces[i];
            trace.age += dt;
            trace.position.y += Math.sin(trace.age * 0.6 + trace.position.x * 0.01) * dt * 0.05;
            trace.position.x += Math.cos(trace.age * 0.45 + trace.position.z * 0.01) * dt * 0.03;
            trace.position.z += Math.sin(trace.age * 0.5 + trace.position.x * 0.008) * dt * 0.03;
            active++;
            totalDensity += trace.strength;
          }

          this.globalDensity = active > 0 ? totalDensity / active : this.globalDensity;

          const positions = this.traceGeometry.attributes.position.array;
          const colors = this.traceGeometry.attributes.color.array;
          let cursor = 0;

          for (; cursor < this.traces.length && cursor < this.maxTraces; cursor++) {
            const trace = this.traces[cursor];
            positions[cursor * 3] = trace.position.x;
            positions[cursor * 3 + 1] = trace.position.y;
            positions[cursor * 3 + 2] = trace.position.z;
            const brightness = clamp01(0.25 + trace.strength * 0.18 + this.sample(trace.position) * 0.12);
            colors[cursor * 3] = brightness;
            colors[cursor * 3 + 1] = brightness;
            colors[cursor * 3 + 2] = brightness;
          }

          for (; cursor < this.maxTraces; cursor++) {
            positions[cursor * 3] = 9999;
            positions[cursor * 3 + 1] = 9999;
            positions[cursor * 3 + 2] = 9999;
            colors[cursor * 3] = 0;
            colors[cursor * 3 + 1] = 0;
            colors[cursor * 3 + 2] = 0;
          }

          this.traceGeometry.attributes.position.needsUpdate = true;
          this.traceGeometry.attributes.color.needsUpdate = true;
          this.samples = active;
        }

        deposit(position, intensity = 1) {
          const fx = THREE.MathUtils.mapLinear(position.x, -this.volume, this.volume, 0, this.gridX - 1);
          const fy = THREE.MathUtils.mapLinear(position.y, -this.volume * 0.5, this.volume * 0.5, 0, this.gridY - 1);
          const fz = THREE.MathUtils.mapLinear(position.z, -this.volume, this.volume, 0, this.gridZ - 1);
          const cx = Math.round(fx);
          const cy = Math.round(fy);
          const cz = Math.round(fz);

          for (let dz = -1; dz <= 1; dz++) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const distance = Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
                const falloff = distance === 0 ? 1 : distance === 1 ? 0.55 : distance === 2 ? 0.28 : 0.12;
                const index = this._gridIndex(cx + dx, cy + dy, cz + dz);
                if (index >= 0) {
                  this.grid[index] += intensity * falloff;
                }
              }
            }
          }
        }

        getHotspots(limit = 8, threshold = 1.4) {
          const hotspots = [];
          for (let z = 0; z < this.gridZ; z++) {
            for (let y = 0; y < this.gridY; y++) {
              for (let x = 0; x < this.gridX; x++) {
                const value = this.grid[this._gridIndex(x, y, z)];
                if (value >= threshold) {
                  hotspots.push({ x, y, z, value });
                }
              }
            }
          }
          hotspots.sort((left, right) => right.value - left.value);
          return hotspots.slice(0, limit);
        }

        cellToWorld(x, y, z) {
          return new THREE.Vector3(
            THREE.MathUtils.mapLinear(x + 0.5, 0, this.gridX, -this.volume, this.volume),
            THREE.MathUtils.mapLinear(y + 0.5, 0, this.gridY, -this.volume * 0.5, this.volume * 0.5),
            THREE.MathUtils.mapLinear(z + 0.5, 0, this.gridZ, -this.volume, this.volume)
          );
        }

        _gridIndex(x, y, z) {
          if (x < 0 || x >= this.gridX || y < 0 || y >= this.gridY || z < 0 || z >= this.gridZ) {
            return -1;
          }
          return x + y * this.gridX + z * this.gridX * this.gridY;
        }

        _sampleCell(x, y, z) {
          const index = this._gridIndex(x, y, z);
          if (index < 0) {
            return 0;
          }
          return this.grid[index];
        }
      }

      class Node3D {
        constructor(index, basePosition, textureSet) {
          this.index = index;
          this.basePosition = basePosition.clone();
          this.position = basePosition.clone();
          this.velocity = new THREE.Vector3();
          this.memory = 0.12 + Math.random() * 0.25;
          this.affinity = Math.random();
          this.energy = 0.25 + Math.random() * 0.35;
          this.visits = 0;
          this.seed = Math.random() * 1000;
          this.reactionDelay = 0;
          this.reactionPulse = 0;
          this.labelActive = index % 12 === 0;
          this.group = new THREE.Group();

          // force circular / spherical node bodies
          const geometry = new THREE.SphereGeometry(1.6, 16, 16);
          this.body = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
          );
          this.group.add(this.body);

          this.glow = createBillboardCircle(textureSet.glow, 12, { additive: true, opacity: 0.14 });
          this.group.add(this.glow);

          this.marker = createBillboardCircle(textureSet.marker, 3.8, { opacity: 0.45 });
          this.marker.position.set(0, 2.4, 0);
          this.group.add(this.marker);

          this.label = null;
          if (this.labelActive) {
            const labelTexture = createLabelTexture(`N-${String(index).padStart(3, "0")} // TRACE`);
            this.label = new THREE.Sprite(
              new THREE.SpriteMaterial({
                map: labelTexture,
                transparent: true,
                depthWrite: false,
                color: 0xffffff,
              })
            );
            this.label.scale.set(16, 4, 1);
            this.label.position.set(8, 5.5, 0);
            this.group.add(this.label);
          }

          this.group.position.copy(this.position);
        }

        update(dt, presence, motionState, memoryField, time) {
          const calm = clamp01(1 - motionState.speed * 0.9);
          const speed = motionState.speed;
          const density = memoryField.sample(this.position);
          const toPresence = tmpVecA.copy(presence).sub(this.position);
          const presenceDistance = toPresence.length();
          const influenceRadius = lerpRange(calm, 0, 1, 70, 180);
          const tracePull = clamp01(1 - presenceDistance / influenceRadius);
          const localNoise = layeredNoise(this.basePosition.x * 0.02, this.basePosition.y * 0.02, this.basePosition.z * 0.02, time + this.seed);

          tmpVecB.copy(this.basePosition);
          tmpVecB.x += Math.sin(time * 0.9 + this.seed) * 4.5;
          tmpVecB.y += Math.cos(time * 0.8 + this.seed * 1.3) * 3.2;
          tmpVecB.z += Math.sin(time * 0.7 + this.seed * 0.9) * 4.5;

          if (tracePull > 0) {
            const pulse = tracePull * (1.2 + this.memory * 1.8);
            tmpVecB.add(toPresence.normalize().multiplyScalar(22 * pulse));
            this.visits += dt * pulse;
            this.memory = THREE.MathUtils.lerp(this.memory, clamp01(0.2 + density * 0.4 + pulse * 0.55), 0.04);
            this.energy = THREE.MathUtils.lerp(this.energy, clamp01(0.35 + pulse + density * 0.3), 0.05);
            this.reactionDelay = Math.max(this.reactionDelay, 0.2 + presenceDistance * 0.0018);
            this.reactionPulse = Math.min(1, this.reactionPulse + pulse * 0.08);

            if (presenceDistance < 42 && density > 0.1) {
              memoryField.recordPresence(this.position, 0.6 + pulse * 0.8);
            }
          } else {
            this.memory = THREE.MathUtils.lerp(this.memory, clamp01(0.08 + density * 0.3), 0.015);
            this.energy = THREE.MathUtils.lerp(this.energy, clamp01(0.2 + density * 0.22), 0.02);
          }

          if (this.reactionDelay > 0) {
            this.reactionDelay -= dt;
            if (this.reactionDelay <= 0) {
              this.reactionPulse = 1;
            }
          }

          const slowDrift = 1 + settings.drift;
          this.velocity.x += (tmpVecB.x - this.position.x) * 0.016 * slowDrift;
          this.velocity.y += (tmpVecB.y - this.position.y) * 0.016 * slowDrift;
          this.velocity.z += (tmpVecB.z - this.position.z) * 0.016 * slowDrift;

          const disturbance = speed * 0.5;
          this.velocity.x += Math.sin(time * 4 + this.seed) * 0.02 * disturbance;
          this.velocity.y += Math.cos(time * 3.5 + this.seed * 1.4) * 0.02 * disturbance;
          this.velocity.z += Math.sin(time * 3.1 + this.seed * 0.7) * 0.02 * disturbance;

          this.position.addScaledVector(this.velocity, dt * 55);
          this.velocity.multiplyScalar(0.92);

          this.position.x += Math.sin(time * 1.7 + this.seed) * 0.14 * localNoise;
          this.position.y += Math.cos(time * 1.4 + this.seed * 1.3) * 0.12 * localNoise;
          this.position.z += Math.sin(time * 1.2 + this.seed * 0.8) * 0.14 * localNoise;

          const maxRadius = 120 + this.memory * 36;
          this.position.x = THREE.MathUtils.clamp(this.position.x, -maxRadius, maxRadius);
          this.position.y = THREE.MathUtils.clamp(this.position.y, -maxRadius * 0.7, maxRadius * 0.7);
          this.position.z = THREE.MathUtils.clamp(this.position.z, -maxRadius, maxRadius);

          this.group.position.copy(this.position);
          this.group.rotation.x = Math.sin(time * 0.4 + this.seed) * 0.12;
          this.group.rotation.y = Math.cos(time * 0.3 + this.seed) * 0.15;
          this.group.rotation.z = Math.sin(time * 0.25 + this.seed * 0.7) * 0.08;

          const glowScale = 9 + this.memory * 18 + this.energy * 10 + this.reactionPulse * 11 + settings.glowBoost * 3;
          this.glow.scale.set(glowScale, glowScale, 1);
          this.glow.material.opacity = clamp01(0.05 + this.memory * 0.2 + this.reactionPulse * 0.22);
          this.marker.material.opacity = clamp01(0.08 + this.energy * 0.42 + this.memory * 0.3);
          this.body.material.opacity = clamp01(0.28 + this.memory * 0.34 + this.reactionPulse * 0.12);
          this.body.scale.setScalar(0.82 + this.memory * 0.52 + this.reactionPulse * 0.28);

          if (this.label) {
            this.label.material.opacity = clamp01(0.2 + this.memory * 0.8);
            this.label.position.x = 7 + this.reactionPulse * 2;
            this.label.position.y = 5 + this.memory * 2.2;
          }

          if (this.reactionPulse > 0) {
            this.reactionPulse = Math.max(0, this.reactionPulse - dt * 0.5);
          }
        }
      }

      class Connection3D {
        constructor(nodeA, nodeB, bundleIndex, bundleCount) {
          this.nodeA = nodeA;
          this.nodeB = nodeB;
          this.bundleIndex = bundleIndex;
          this.bundleCount = bundleCount;
          this.baseStrength = 0;
          this.memoryAffinity = 0;
          this.activation = 0.08 + Math.random() * 0.18;
          this.active = true;
          this.curve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
          this.segments = 32;
          this.points = new Float32Array((this.segments + 1) * 3);
          this.key = connectionKey(nodeA, nodeB);

          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute("position", new THREE.BufferAttribute(this.points, 3));

          const opacity = bundleIndex === 0 ? 0.15 : 0.055;
          const width = bundleIndex === 0 ? 1.2 : 0.6;
          this.material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity,
            depthWrite: false,
          });
          this.line = new THREE.Line(geometry, this.material);
          this.line.frustumCulled = false;
          this.width = width;
          this.phase = Math.random() * 10;
        }

        update(time, motionState, memoryField, presence) {
          const a = this.nodeA.position;
          const b = this.nodeB.position;
          const distance = a.distanceTo(b);
          const memoryA = this.nodeA.memory;
          const memoryB = this.nodeB.memory;
          const affinity = 1 - clamp01(distance / settings.connectionDistance);
          const midpoint = tmpVecA.copy(a).add(b).multiplyScalar(0.5);
          const quarterA = a.clone().lerp(b, 0.25);
          const quarterB = a.clone().lerp(b, 0.75);
          const pathMemory = (memoryField.sample(quarterA) + memoryField.sample(midpoint) + memoryField.sample(quarterB)) / 3;
          const presenceDistance = presence.distanceTo(midpoint);
          const presenceOpen = clamp01(1 - presenceDistance / 200);
          const motionNoise = motionState.speed * 0.22;
          const calm = clamp01(1 - motionState.speed * 0.8);
          const driftTowardPresence = motionState.idleTime > 1.2 ? (motionState.idleTime - 1.2) * 2.2 : 0;
          this.activation = THREE.MathUtils.clamp(this.activation + (pathMemory * 0.004 + presenceOpen * 0.003 + calm * 0.0015), 0, 10);
          this.memoryAffinity = (memoryA + memoryB) * 0.25 + pathMemory * 0.95 + this.activation * 0.05;
          this.baseStrength = clamp01(affinity * 0.45 + this.memoryAffinity * 0.55 + this.activation * 0.05);

          for (let bundle = 0; bundle < this.bundleCount; bundle++) {
            const curveOffset = (bundle - (this.bundleCount - 1) * 0.5) * 2.8;
            const side = tmpVecB.copy(b).sub(a).normalize();
            const normal = tmpVecC.copy(side).cross(upVector).normalize();
            if (normal.lengthSq() < 0.001) {
              normal.copy(rightVector);
            }

            const sag = 8 + distance * 0.04 + Math.sin(time * 0.9 + this.phase + bundle) * 3;
            const pulseWarp = layeredNoise(a.x * 0.03 + bundle, a.y * 0.02, b.z * 0.03, time + this.phase) - 0.5;
            const opening = settings.networkOpen * 1.8 + calm * 0.9 + presenceOpen * 0.9;
            const control1 = midpoint.clone()
              .addScaledVector(normal, curveOffset + pulseWarp * 10 * settings.filamentNoise)
              .addScaledVector(side, -sag * 0.45 * opening)
              .addScaledVector(presence, driftTowardPresence * 0.25 * (1 - bundle * 0.18));
            const control2 = midpoint.clone()
              .addScaledVector(normal, -(curveOffset + pulseWarp * 10 * settings.filamentNoise))
              .addScaledVector(side, sag * 0.45 * opening)
              .addScaledVector(presence, driftTowardPresence * 0.18 * (1 - bundle * 0.18));

            if (this.bundleIndex === bundle) {
              this.curve.points = [a.clone(), control1.clone(), control2.clone(), b.clone()];
              const sampled = this.curve.getPoints(this.segments);

              for (let i = 0; i < sampled.length; i++) {
                const point = sampled[i];
                this.points[i * 3] = point.x;
                this.points[i * 3 + 1] = point.y;
                this.points[i * 3 + 2] = point.z;
              }

              this.line.geometry.attributes.position.needsUpdate = true;
            }
          }

          const alpha = clamp01(0.05 + this.baseStrength * 0.72 + this.activation * 0.03 + settings.networkOpen * 0.12 + motionNoise);
          this.material.opacity = this.bundleIndex === 0 ? alpha * 0.72 : alpha * 0.28;
          this.line.scale.setScalar(1 + this.memoryAffinity * 0.08 + this.activation * 0.015);
          this.line.material.linewidth = this.width;
        }

        markActivation(amount = 0.2) {
          this.activation = Math.min(this.activation + amount, 10);
        }

        getPulseCurve() {
          const a = this.nodeA.position;
          const b = this.nodeB.position;
          const midpoint = a.clone().add(b).multiplyScalar(0.5);
          return new THREE.CatmullRomCurve3([
            a.clone(),
            a.clone().lerp(midpoint, 0.35).addScalar(0.01),
            midpoint,
            midpoint.clone().lerp(b, 0.65).addScalar(0.01),
            b.clone(),
          ]);
        }
      }

      class Pulse3D {
        constructor(connection, soundEngine) {
          this.connection = connection;
          this.curve = connection.getPulseCurve();
          this.progress = Math.random() * 0.2;
          this.speed = 0.05 + connection.baseStrength * 0.09 + connection.activation * 0.008 + Math.random() * 0.04;
          this.life = 0;
          this.maxLife = 8 + connection.activation * 0.8 + Math.random() * 5;
          this.soundEngine = soundEngine;
          this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.85, 10, 10),
            new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.95,
              depthWrite: false,
            })
          );
          this.halo = createBillboardCircle(textures.glow, 6.5, { additive: true, opacity: 0.68 });
          this.mesh.add(this.halo);
          // Avoid firing a ping for every small visual pulse — only emit for stronger disturbances
          if (this.soundEngine && this.soundEngine.disturbance > 0.34) {
            // lower intensity for per-pulse pings and add some randomness to thin events
            if (Math.random() < 0.7) {
              this.soundEngine.emitPing(0.18 + this.connection.baseStrength * 0.18 + this.connection.activation * 0.02);
            }
          }
        }

        update(dt, time) {
          this.life += dt;
          this.progress += dt * this.speed;
          const point = this.curve.getPointAt(clamp01(this.progress));
          this.mesh.position.copy(point);
          const pulseScale = 1 + Math.sin(time * 10 + this.life * 2.5) * 0.06;
          this.mesh.scale.setScalar(1 + this.connection.baseStrength * 0.28);
          this.halo.scale.setScalar(5.2 + this.connection.baseStrength * 3.6 * pulseScale + this.connection.activation * 0.3);
          this.mesh.material.opacity = clamp01(0.7 + this.connection.baseStrength * 0.3);
          return this.progress >= 1 || this.life > this.maxLife;
        }
      }

      class SoundEngine {
        constructor() {
          this.started = false;
          this.ready = false;
          this.motion = 0;
          this.disturbance = 0;
          this.memoryDensity = 0;
          this.noiseAmount = 0;
          this.pingTimer = 0;
          this.wetness = 0.35;
          this.reverb = null;
          this.filter = null;
          this.masterGain = null;
          this.droneGain = null;
          this.archiveGain = null;
          this.noiseGain = null;
          this.droneOscillators = [];
          this.archiveVoices = [];
          this.pingSynth = null;
          this.resonanceSynth = null;
          this.glitchSynth = null;
        }

        async start() {
          if (this.started) {
            return;
          }
          this.started = true;
          await Tone.start();

          this.reverb = new Tone.Reverb({ decay: 11, preDelay: 0.06, wet: 0.35 });
          await this.reverb.generate();

          this.filter = new Tone.Filter({ frequency: 120, type: "lowpass", rolloff: -24 });
          this.masterGain = new Tone.Gain(0.0);
          this.droneGain = new Tone.Gain(0.0);
          this.archiveGain = new Tone.Gain(0.0);
          this.noiseGain = new Tone.Gain(0.0);

          this.filter.chain(this.droneGain, this.masterGain, this.reverb, Tone.Destination);
          this.archiveGain.chain(this.masterGain, this.reverb, Tone.Destination);
          this.noiseGain.chain(this.masterGain, this.reverb, Tone.Destination);

          const droneFrequencies = [24, 36, 48.5];
          for (let i = 0; i < droneFrequencies.length; i++) {
            const osc = new Tone.Oscillator({
              frequency: droneFrequencies[i],
              type: i === 1 ? "triangle" : "sine",
              volume: -18,
            }).connect(this.filter);
            osc.start();
            this.droneOscillators.push(osc);
          }

          // softened per-pulse synth: sine oscillator with slower attack/decay
          this.pingFilter = new Tone.Filter({ frequency: 1400, type: "lowpass", rolloff: -12 });
          this.pingSynth = new Tone.Synth({
            oscillator: { type: "sine" },
            envelope: { attack: 0.018, decay: 0.28, sustain: 0.02, release: 0.36 },
            volume: -12,
          }).connect(this.pingFilter);
          this.pingFilter.connect(this.reverb);

          this.resonanceSynth = new Tone.FMSynth({
            harmonicity: 1.5,
            modulationIndex: 12,
            oscillator: { type: "sine" },
            modulation: { type: "triangle" },
            envelope: { attack: 0.002, decay: 0.2, sustain: 0 },
            modulationEnvelope: { attack: 0.002, decay: 0.14, sustain: 0 },
          }).connect(this.reverb);

          this.glitchSynth = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.002, decay: 0.12, sustain: 0 },
          }).connect(this.noiseGain);

          this.ready = true;
          startHint.textContent = "audio active";
          setTimeout(() => {
            startHint.style.display = "none";
          }, 1400);
        }

        emitPing(intensity = 0.5) {
          if (!this.ready) {
            return;
          }
          try {
            const now = Tone.now() + 0.002;
            const note = 44 + intensity * 24;
            this.pingSynth.triggerAttackRelease(note, "8n", now, 0.35 + intensity * 0.45);
          } catch (e) {
            // fallback: trigger immediately
            try { this.pingSynth.triggerAttackRelease(44 + intensity * 24, "8n"); } catch (e) {}
          }
        }

        emitResonance(intensity = 0.5, frequency = 110) {
          if (!this.ready || !this.resonanceSynth) {
            return;
          }
          try {
            const now = Tone.now() + 0.002;
            this.resonanceSynth.triggerAttackRelease(frequency, "8n", now, 0.2 + intensity * 0.25);
          } catch (e) {
            try { this.resonanceSynth.triggerAttackRelease(frequency, "8n"); } catch (e) {}
          }
        }

        setArchiveTraces(traces) {
          if (!this.ready) {
            return;
          }

          for (const voice of this.archiveVoices) {
            voice.oscillator.dispose();
            voice.gain.dispose();
          }
          this.archiveVoices = [];

          const limited = traces.slice(0, 6);
          for (const trace of limited) {
            const dominantZones = trace.getDominantZones(1);
            const zoneWeight = dominantZones.length > 0 ? dominantZones[0].count : 1;
            const frequencyBase = 28 + (trace.averageMovement * 420) + zoneWeight * 3;
            const oscillator = new Tone.Oscillator({
              frequency: frequencyBase,
              type: trace.stillnessMoments.length > 1 ? "triangle" : "sine",
              volume: -28,
            });
            const gain = new Tone.Gain(0.0);
            oscillator.connect(gain);
            gain.connect(this.archiveGain);
            oscillator.start();
            this.archiveVoices.push({ oscillator, gain, trace });
          }
        }

        emitGlitch(amount) {
          if (!this.ready || amount <= 0.02) {
            return;
          }
          const now = Tone.now();
          this.glitchSynth.triggerAttackRelease("32n", now, amount * 0.05);
        }

        update(motionState, memoryDensity, dt) {
          if (!this.ready) {
            return;
          }

          this.motion = THREE.MathUtils.lerp(this.motion, motionState.speed, 0.08);
          this.disturbance = THREE.MathUtils.lerp(this.disturbance, motionState.disturbance, 0.06);
          this.memoryDensity = THREE.MathUtils.lerp(this.memoryDensity, memoryDensity, 0.06);

          const calm = clamp01(1 - this.disturbance);
          const noiseAmount = clamp01(this.disturbance * 1.2 - 0.18);
          this.noiseAmount = THREE.MathUtils.lerp(this.noiseAmount, noiseAmount, 0.08);

          const stage1 = clamp01(THREE.MathUtils.smoothstep(this.disturbance, 0.06, 0.18));
          const stage2 = clamp01(THREE.MathUtils.smoothstep(this.disturbance, 0.16, 0.34));
          const stage3 = clamp01(THREE.MathUtils.smoothstep(this.disturbance, 0.3, 0.54));
          const stage4 = clamp01(THREE.MathUtils.smoothstep(this.disturbance, 0.5, 0.74));
          const stage5 = clamp01(THREE.MathUtils.smoothstep(this.disturbance, 0.7, 0.92));

          this.masterGain.gain.rampTo(lerpRange(this.disturbance, 0, 1, 0.0, 0.22), 0.12);
          this.filter.frequency.rampTo(lerpRange(stage2 + stage5 * 0.45, 0, 1, 58, 240), 0.1);
          this.droneGain.gain.rampTo(lerpRange(stage1 + stage2 + this.memoryDensity * 0.5, 0, 2, 0.0, 0.18 + stage5 * 0.1), 0.1);
          this.archiveGain.gain.rampTo(lerpRange(stage1 + stage2 + stage3, 0, 3, 0.0, 0.05 + stage5 * 0.03), 0.12);
          this.reverb.wet.rampTo(lerpRange(stage3 + this.memoryDensity * 0.8 + stage5 * 0.35, 0, 2, 0.02, 0.84), 0.1);
          this.noiseGain.gain.rampTo(lerpRange(this.noiseAmount + stage4 * 0.4, 0, 1.4, 0.0, 0.18 + this.noiseAmount * 0.25), 0.08);

          for (let i = 0; i < this.droneOscillators.length; i++) {
            const oscillator = this.droneOscillators[i];
            const baseFrequency = [24, 36, 48.5][i];
            const harmonicLift = 1 + stage4 * 0.12 + stage5 * 0.18;
            oscillator.frequency.rampTo(baseFrequency * harmonicLift, 0.08);
            oscillator.detune.rampTo((i - 1) * stage5 * 16, 0.08);
          }

          this.pingTimer -= dt;
          // Use a higher stage (stage3) to avoid micro-pings at low disturbance,
          // increase base interval and thin events probabilistically.
          const pingSourceStage = stage3;
          const pingInterval = lerpRange(pingSourceStage + stage4 + stage5, 0, 4, 3.2, 0.6);
          if (pingSourceStage > 0 && this.pingTimer <= 0) {
            if (Math.random() < clamp01(0.38 + pingSourceStage * 0.6 + stage5 * 0.4)) {
              this.emitPing(0.12 + pingSourceStage * 0.22 + stage5 * 0.25);
            }
            this.pingTimer = pingInterval + Math.random() * pingInterval * 0.45;
          }

          // Increase glitch threshold to reduce frequent micro-glitches
          if (this.noiseAmount > 0.32) {
            this.emitGlitch(this.noiseAmount * 0.85);
          }
        }
      }

      function createSessionId() {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return `session-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
      }

      function clampZone(value, divisions) {
        return Math.max(0, Math.min(divisions - 1, Math.floor(value * divisions)));
      }

      class PresenceTrace {
        constructor(sessionId = createSessionId(), startTime = Date.now()) {
          this.sessionId = sessionId;
          this.startTime = startTime;
          this.duration = 0;
          this.averageMovement = 0;
          this.stillnessMoments = [];
          this.dominantScreenZones = {};
          this.pathHistory = [];
          this.intensityProfile = [];
          this.gestureHistory = [];
          this.generatedNodes = [];
          this.generatedConnections = [];
          this.presenceSeconds = 0;
          this.sampleCount = 0;
          this.lastZoneKey = null;
          this.lastRecordTime = startTime;
          this.activeStillnessStart = null;
        }

        record(sample) {
          const timestamp = sample.timestamp ?? Date.now();
          const deltaSeconds = Math.max(0.016, (timestamp - this.lastRecordTime) / 1000);
          this.duration = Math.max(this.duration, (timestamp - this.startTime) / 1000);
          this.lastRecordTime = timestamp;

          if (!sample.presenceDetected) {
            return;
          }

          this.sampleCount++;
          this.presenceSeconds += deltaSeconds;
          this.averageMovement = this.sampleCount === 1
            ? sample.movement
            : this.averageMovement * 0.96 + sample.movement * 0.04;

          const zoneKey = sample.zoneKey ?? "0_0";
          this.dominantScreenZones[zoneKey] = (this.dominantScreenZones[zoneKey] || 0) + 1;

          if (sample.movement < 0.012) {
            if (this.activeStillnessStart === null) {
              this.activeStillnessStart = timestamp;
            }
          } else if (this.activeStillnessStart !== null) {
            const stillnessDuration = (timestamp - this.activeStillnessStart) / 1000;
            if (stillnessDuration > 0.45) {
              this.stillnessMoments.push({
                startTime: this.activeStillnessStart,
                duration: stillnessDuration,
                zoneKey,
              });
            }
            this.activeStillnessStart = null;
          }

          if (this.pathHistory.length === 0 || zoneKey !== this.lastZoneKey || timestamp - this.pathHistory[this.pathHistory.length - 1].t > 120) {
            this.pathHistory.push({
              t: timestamp,
              x: sample.normalized.x,
              y: sample.normalized.y,
              z: sample.worldPosition.z,
              movement: sample.movement,
              zoneKey,
            });

            if (this.pathHistory.length > 240) {
              this.pathHistory.shift();
            }
          }

          this.intensityProfile.push({
            t: timestamp,
            value: sample.disturbance,
            stage: sample.stage,
          });

          if (this.intensityProfile.length > 240) {
            this.intensityProfile.shift();
          }

          if (sample.gestureType) {
            this.gestureHistory.push({
              t: timestamp,
              gestureType: sample.gestureType,
              intensity: sample.intensity ?? sample.disturbance ?? 0,
              activatedZone: zoneKey,
            });

            if (this.gestureHistory.length > 120) {
              this.gestureHistory.shift();
            }
          }

          this.lastZoneKey = zoneKey;
        }

        noteGeneratedNode(node) {
          this.generatedNodes.push(node);
          if (this.generatedNodes.length > 64) {
            this.generatedNodes.shift();
          }
        }

        noteGeneratedConnection(connection) {
          this.generatedConnections.push(connection);
          if (this.generatedConnections.length > 128) {
            this.generatedConnections.shift();
          }
        }

        finalize() {
          if (this.activeStillnessStart !== null) {
            const stillnessDuration = (Date.now() - this.activeStillnessStart) / 1000;
            if (stillnessDuration > 0.45) {
              this.stillnessMoments.push({
                startTime: this.activeStillnessStart,
                duration: stillnessDuration,
                zoneKey: this.lastZoneKey ?? "0_0",
              });
            }
            this.activeStillnessStart = null;
          }

          this.duration = Math.max(this.duration, this.presenceSeconds);
          return this.toJSON();
        }

        getDominantZones(limit = 4) {
          return Object.entries(this.dominantScreenZones)
            .sort((left, right) => right[1] - left[1])
            .slice(0, limit)
            .map(([zoneKey, count]) => ({ zoneKey, count }));
        }

        getAnchorPosition() {
          if (this.pathHistory.length > 0) {
            const recent = this.pathHistory.slice(-40);
            const anchor = recent.reduce((accumulator, point) => {
              accumulator.x += point.x;
              accumulator.y += point.y;
              accumulator.z += point.z;
              return accumulator;
            }, { x: 0, y: 0, z: 0 });
            anchor.x /= recent.length;
            anchor.y /= recent.length;
            anchor.z /= recent.length;
            return new THREE.Vector3(
              THREE.MathUtils.lerp(-160, 160, anchor.x),
              THREE.MathUtils.lerp(110, -80, anchor.y),
              THREE.MathUtils.lerp(160, -120, clamp01(0.5 + anchor.z * 0.003))
            );
          }

          const dominantZones = this.getDominantZones(1);
          if (dominantZones.length > 0) {
            const [xText, yText] = dominantZones[0].zoneKey.split("_").map((value) => Number(value));
            const xZone = Number.isFinite(xText) ? xText : 1;
            const yZone = Number.isFinite(yText) ? yText : 1;
            const x = THREE.MathUtils.lerp(-160, 160, (xZone + 0.5) / 4);
            const y = THREE.MathUtils.lerp(120, -70, (yZone + 0.5) / 4);
            return new THREE.Vector3(x, y, 20 - yZone * 22);
          }

          return new THREE.Vector3(0, 0, 0);
        }

        similarityTo(other) {
          const thisZones = this.getDominantZones(6);
          const otherZones = other.getDominantZones(6);
          const thisZoneSet = new Set(thisZones.map((entry) => entry.zoneKey));
          const otherZoneSet = new Set(otherZones.map((entry) => entry.zoneKey));
          let overlap = 0;
          for (const zoneKey of thisZoneSet) {
            if (otherZoneSet.has(zoneKey)) {
              overlap++;
            }
          }
          const zoneScore = thisZoneSet.size > 0 || otherZoneSet.size > 0
            ? overlap / Math.max(thisZoneSet.size, otherZoneSet.size, 1)
            : 0;

          const movementGap = Math.abs(this.averageMovement - other.averageMovement);
          const movementScore = 1 - clamp01(movementGap / 0.08);

          const stillnessGap = Math.abs(this.stillnessMoments.length - other.stillnessMoments.length);
          const stillnessScore = 1 - clamp01(stillnessGap / 6);

          const rhythmGap = Math.abs(this.intensityProfile.length - other.intensityProfile.length);
          const rhythmScore = 1 - clamp01(rhythmGap / 40);

          const thisGesture = this.gestureHistory.length > 0 ? this.gestureHistory[this.gestureHistory.length - 1].gestureType : null;
          const otherGesture = other.gestureHistory.length > 0 ? other.gestureHistory[other.gestureHistory.length - 1].gestureType : null;
          const gestureScore = thisGesture && otherGesture
            ? (thisGesture === otherGesture ? 1 : 0.25)
            : 0;

          return clamp01(zoneScore * 0.34 + movementScore * 0.24 + stillnessScore * 0.16 + rhythmScore * 0.14 + gestureScore * 0.12);
        }

        toJSON() {
          return {
            sessionId: this.sessionId,
            startTime: this.startTime,
            duration: this.duration,
            averageMovement: this.averageMovement,
            stillnessMoments: this.stillnessMoments,
            dominantScreenZones: this.dominantScreenZones,
            pathHistory: this.pathHistory,
            intensityProfile: this.intensityProfile,
            gestureHistory: this.gestureHistory,
            generatedNodes: this.generatedNodes,
            generatedConnections: this.generatedConnections,
            presenceSeconds: this.presenceSeconds,
            sampleCount: this.sampleCount,
          };
        }

        static fromJSON(data) {
          const trace = new PresenceTrace(data.sessionId, data.startTime);
          trace.duration = data.duration ?? 0;
          trace.averageMovement = data.averageMovement ?? 0;
          trace.stillnessMoments = Array.isArray(data.stillnessMoments) ? data.stillnessMoments : [];
          trace.dominantScreenZones = data.dominantScreenZones ?? {};
          trace.pathHistory = Array.isArray(data.pathHistory) ? data.pathHistory : [];
          trace.intensityProfile = Array.isArray(data.intensityProfile) ? data.intensityProfile : [];
          trace.gestureHistory = Array.isArray(data.gestureHistory) ? data.gestureHistory : [];
          trace.generatedNodes = Array.isArray(data.generatedNodes) ? data.generatedNodes : [];
          trace.generatedConnections = Array.isArray(data.generatedConnections) ? data.generatedConnections : [];
          trace.presenceSeconds = data.presenceSeconds ?? 0;
          trace.sampleCount = data.sampleCount ?? 0;
          return trace;
        }
      }

      class PresenceArchive {
        constructor(storageKey = "root-network-presence-traces-v2") {
          this.storageKey = storageKey;
          this.traces = [];
        }

        load() {
          try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) {
              this.traces = [];
              return this.traces;
            }

            const parsed = JSON.parse(raw);
            this.traces = Array.isArray(parsed)
              ? parsed.map((entry) => PresenceTrace.fromJSON(entry)).filter(Boolean)
              : [];
          } catch (error) {
            this.traces = [];
          }

          return this.traces;
        }

        save() {
          try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.traces.map((trace) => trace.toJSON())));
          } catch (error) {
            // Ignore quota errors; the visual memory can continue in-session.
          }
        }

        addTrace(trace) {
          const finalized = trace.finalize ? trace.finalize() : trace.toJSON();
          this.traces.push(PresenceTrace.fromJSON(finalized));
          if (this.traces.length > 18) {
            this.traces.splice(0, this.traces.length - 18);
          }
          this.save();
        }

        findMatches(trace, limit = 4) {
          return this.traces
            .map((candidate) => ({ trace: candidate, score: trace.similarityTo(candidate) }))
            .filter((entry) => entry.score > 0.12)
            .sort((left, right) => right.score - left.score)
            .slice(0, limit);
        }
      }

      class WebcamPresenceTracker {
        constructor() {
          this.video = document.createElement("video");
          this.video.autoplay = true;
          this.video.muted = true;
          this.video.playsInline = true;
          this.video.style.display = "none";
          document.body.appendChild(this.video);

          this.faceDetector = null;
          this.handDetector = null;
          this.stream = null;
          this.running = false;
          this.initialized = false;
          this.lastTimestamp = 0;
          this.lastFaceCenter = null;
          this.lastHandCenter = null;
          this.lastHandCenters = new Map();
          this.zoneHistory = new Map();
          this.noPresenceSince = null;
          this.state = {
            presenceDetected: false,
            movement: 0,
            speed: 0,
            normalized: new THREE.Vector2(0.5, 0.5),
            worldPosition: new THREE.Vector3(0, 0, 0),
            facePosition: new THREE.Vector3(0, 0, 0),
            leftHandPosition: new THREE.Vector3(0, 0, 0),
            rightHandPosition: new THREE.Vector3(0, 0, 0),
            zoneKey: "0_0",
            stillness: false,
            timeVisible: 0,
            disturbance: 0,
            disturbanceMemory: 0,
            faceScale: 0,
            handSpread: 0,
            handCount: 0,
            faceCount: 0,
            gestureEnergy: 0,
            gestureType: "idle",
            handOpen: 0,
            handClose: 0,
            faceHandProximity: 0,
            repeatedZoneCount: 0,
            presenceSeconds: 0,
            stage: 1,
            confidence: 0,
          };
          this.onUpdate = null;
        }

        async start() {
          if (this.running) {
            return;
          }

          this.running = true;
          this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
          this.video.srcObject = this.stream;
          await this.video.play();

          await window.tf.setBackend("webgl");
          await window.tf.ready();

          this.faceDetector = await window.faceLandmarksDetection.createDetector(
            window.faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
            {
              runtime: "mediapipe",
              solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
              refineLandmarks: true,
              maxFaces: 1,
            }
          );

          this.handDetector = await window.handPoseDetection.createDetector(
            window.handPoseDetection.SupportedModels.MediaPipeHands,
            {
              runtime: "mediapipe",
              solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
              modelType: "full",
              maxHands: 2,
            }
          );

          this.lastTimestamp = performance.now();
          this.lastFaceCenter = null;
          this.lastHandCenter = null;
          this.lastHandCenters.clear();
          this.loop();
        }

        stop() {
          this.running = false;
          if (this.stream) {
            for (const track of this.stream.getTracks()) {
              track.stop();
            }
            this.stream = null;
          }
        }

        loop() {
          if (!this.running || !this.faceDetector || !this.handDetector) {
            return;
          }

          const now = performance.now();
          const deltaSeconds = Math.max(0.016, (now - this.lastTimestamp) / 1000);
          this.lastTimestamp = now;

          Promise.all([
            this.faceDetector.estimateFaces(this.video, { flipHorizontal: false }),
            this.handDetector.estimateHands(this.video, { flipHorizontal: false }),
          ]).then(([faces, hands]) => {
            const faceData = this.extractFaceData(faces, deltaSeconds);
            const handData = this.extractHandData(hands, deltaSeconds);
            const presenceDetected = faceData.present || handData.present;

            if (presenceDetected) {
              const combinedCenter = new THREE.Vector2();
              const combinedWeight = [];

              if (faceData.present) {
                combinedCenter.addScaledVector(faceData.center, 0.65);
                combinedWeight.push(0.65);
              }

              if (handData.present) {
                combinedCenter.addScaledVector(handData.center, 0.35);
                combinedWeight.push(0.35);
              }

              const weightSum = combinedWeight.reduce((sum, value) => sum + value, 0) || 1;
              combinedCenter.multiplyScalar(1 / weightSum);

              const movement = faceData.movement * 0.42 + handData.movement * 0.58;
              const speed = movement / deltaSeconds;
              const zoneX = clampZone(combinedCenter.x, 4);
              const zoneY = clampZone(combinedCenter.y, 4);
              const zoneKey = `${zoneX}_${zoneY}`;
              const repeatedZoneCount = (this.zoneHistory.get(zoneKey) || 0) + 1;
              this.zoneHistory.set(zoneKey, repeatedZoneCount);

              const stillness = speed < 0.015 && handData.handMovement < 0.014 && faceData.movement < 0.01;
              const presenceSeconds = (this.state.presenceDetected ? this.state.presenceSeconds : 0) + deltaSeconds;
              const timeEnergy = clamp01(presenceSeconds / 90);
              const movementEnergy = clamp01(speed * 5.5);
              const handEnergy = clamp01(handData.handCount / 2);
              const repeatEnergy = clamp01((repeatedZoneCount - 1) / 12);
              const scaleEnergy = clamp01((faceData.faceScale * 0.9) + (handData.handSpread * 0.6));
              const gestureEnergy = clamp01((handData.gestureEnergy * 0.75) + (handData.twoHandBridge * 0.25));
              const stillnessEnergy = stillness ? 0.1 + timeEnergy * 0.08 : 0;
              const targetDisturbance = clamp01(
                movementEnergy * 0.38 +
                gestureEnergy * 0.22 +
                handEnergy * 0.12 +
                repeatEnergy * 0.18 +
                scaleEnergy * 0.14 +
                stillnessEnergy +
                timeEnergy * 0.12
              );

              this.state = {
                presenceDetected: true,
                movement,
                speed,
                normalized: combinedCenter.clone(),
                facePosition: faceData.center3D.clone(),
                leftHandPosition: handData.leftCenter3D.clone(),
                rightHandPosition: handData.rightCenter3D.clone(),
                worldPosition: new THREE.Vector3(
                  THREE.MathUtils.lerp(-165, 165, combinedCenter.x),
                  THREE.MathUtils.lerp(115, -85, combinedCenter.y),
                  THREE.MathUtils.lerp(150, -130, clamp01((faceData.faceScale + handData.handSpread) * 0.5))
                ),
                zoneKey,
                stillness,
                timeVisible: presenceSeconds,
                disturbance: targetDisturbance,
                disturbanceMemory: Math.max(this.state.disturbanceMemory * 0.997, targetDisturbance, repeatEnergy * 0.75),
                faceScale: faceData.faceScale,
                handSpread: handData.handSpread,
                handCount: handData.handCount,
                faceCount: faceData.faceCount,
                gestureEnergy,
                gestureType: handData.gestureType,
                handOpen: handData.handOpen,
                handClose: handData.handClose,
                faceHandProximity: handData.faceHandProximity,
                repeatedZoneCount,
                presenceSeconds,
                stage: this.getStage(targetDisturbance),
                confidence: clamp01(faceData.confidence * 0.7 + handData.confidence * 0.3),
              };

              this.lastFaceCenter = faceData.center.clone();
              this.lastHandCenter = handData.center.clone();
              this.noPresenceSince = null;
            } else {
              const decayed = Math.max(this.state.disturbance * 0.996, this.state.disturbanceMemory * 0.999);
              this.state = {
                ...this.state,
                presenceDetected: false,
                movement: 0,
                speed: 0,
                stillness: false,
                handCount: 0,
                faceCount: 0,
                gestureEnergy: 0,
                gestureType: "idle",
                handOpen: 0,
                handClose: 0,
                faceHandProximity: 0,
                disturbance: decayed,
                disturbanceMemory: Math.max(this.state.disturbanceMemory * 0.999, decayed),
                confidence: 0,
              };
              if (this.noPresenceSince === null) {
                this.noPresenceSince = now;
              }
            }

            if (this.onUpdate) {
              this.onUpdate(this.state);
            }

            if (this.running) {
              requestAnimationFrame(() => this.loop());
            }
          }).catch((error) => {
            console.error(error);
            if (this.running) {
              requestAnimationFrame(() => this.loop());
            }
          });
        }

        extractFaceData(faces, deltaSeconds) {
          const face = faces && faces[0] ? faces[0] : null;
          if (!face || !face.keypoints || face.keypoints.length === 0) {
            return {
              present: false,
              center: new THREE.Vector2(0.5, 0.5),
              center3D: new THREE.Vector3(0, 0, 0),
              movement: 0,
              faceScale: 0,
              faceCount: 0,
              confidence: 0,
            };
          }

          const points = face.keypoints;
          const center = new THREE.Vector2();
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;

          for (const point of points) {
            const x = point.x / Math.max(1, this.video.videoWidth || 1);
            const y = point.y / Math.max(1, this.video.videoHeight || 1);
            center.x += x;
            center.y += y;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }

          center.multiplyScalar(1 / points.length);
          const faceWidth = Math.max(0.001, maxX - minX);
          const faceHeight = Math.max(0.001, maxY - minY);
          const faceScale = clamp01((faceWidth + faceHeight) * 0.5 * 1.4);
          const movement = this.lastFaceCenter ? center.distanceTo(this.lastFaceCenter) : 0;
          this.lastFaceCenter = center.clone();

          return {
            present: true,
            center,
            center3D: new THREE.Vector3(
              THREE.MathUtils.lerp(-165, 165, center.x),
              THREE.MathUtils.lerp(115, -85, center.y),
              THREE.MathUtils.lerp(120, -120, faceScale)
            ),
            movement,
            faceScale,
            faceCount: 1,
            confidence: 1,
          };
        }

        extractHandData(hands, deltaSeconds) {
          if (!hands || hands.length === 0) {
            this.lastHandCenters.clear();
            return {
              present: false,
              center: new THREE.Vector2(0.5, 0.5),
              center3D: new THREE.Vector3(0, 0, 0),
              leftCenter3D: new THREE.Vector3(0, 0, 0),
              rightCenter3D: new THREE.Vector3(0, 0, 0),
              movement: 0,
              handMovement: 0,
              handSpread: 0,
              gestureEnergy: 0,
              twoHandBridge: 0,
              faceHandProximity: 0,
              gestureType: "idle",
              handOpen: 0,
              handClose: 0,
              handCount: 0,
              confidence: 0,
            };
          }

          const center = new THREE.Vector2();
          let handMovementTotal = 0;
          let handSpreadTotal = 0;
          let gestureEnergyTotal = 0;
          let faceHandProximity = 0;
          let leftCenter = null;
          let rightCenter = null;
          let leftSpread = 0;
          let rightSpread = 0;
          let leftOpen = 0;
          let rightOpen = 0;

          hands.forEach((hand, index) => {
            const points = hand.keypoints || [];
            if (points.length === 0) {
              return;
            }

            const handCenter = new THREE.Vector2();
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            for (const point of points) {
              const x = point.x / Math.max(1, this.video.videoWidth || 1);
              const y = point.y / Math.max(1, this.video.videoHeight || 1);
              handCenter.x += x;
              handCenter.y += y;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }

            handCenter.multiplyScalar(1 / points.length);
            center.add(handCenter);

            const spread = clamp01((Math.max(0.001, maxX - minX) + Math.max(0.001, maxY - minY)) * 0.7);
            handSpreadTotal += spread;

            const fingerOpen = clamp01(spread * 1.2);
            const handType = String(hand.handedness || "hand").toLowerCase();
            if (handType.includes("left")) {
              leftCenter = handCenter.clone();
              leftSpread = spread;
              leftOpen = fingerOpen;
            } else if (handType.includes("right")) {
              rightCenter = handCenter.clone();
              rightSpread = spread;
              rightOpen = fingerOpen;
            }

            const movementKey = `${hand.handedness || "hand"}-${index}`;
            const previous = this.lastHandCenters.get(movementKey);
            const movement = previous ? handCenter.distanceTo(previous) : 0;
            handMovementTotal += movement;
            this.lastHandCenters.set(movementKey, handCenter.clone());

            const thumbTip = points[4];
            const indexTip = points[8];
            if (thumbTip && indexTip) {
              const pinchDistance = Math.sqrt((thumbTip.x - indexTip.x) ** 2 + (thumbTip.y - indexTip.y) ** 2);
              const fistEnergy = clamp01(1 - pinchDistance / 0.12);
              gestureEnergyTotal += fistEnergy;
              if (handType.includes("left")) {
                leftOpen = Math.max(leftOpen, clamp01(1 - fistEnergy));
              }
              if (handType.includes("right")) {
                rightOpen = Math.max(rightOpen, clamp01(1 - fistEnergy));
              }
            }
          });

          center.multiplyScalar(1 / hands.length);
          const movement = this.lastHandCenter ? center.distanceTo(this.lastHandCenter) : 0;
          this.lastHandCenter = center.clone();

          const leftCenter3D = leftCenter
            ? new THREE.Vector3(
                THREE.MathUtils.lerp(-165, 165, leftCenter.x),
                THREE.MathUtils.lerp(115, -85, leftCenter.y),
                THREE.MathUtils.lerp(110, -110, leftSpread)
              )
            : new THREE.Vector3(0, 0, 0);
          const rightCenter3D = rightCenter
            ? new THREE.Vector3(
                THREE.MathUtils.lerp(-165, 165, rightCenter.x),
                THREE.MathUtils.lerp(115, -85, rightCenter.y),
                THREE.MathUtils.lerp(110, -110, rightSpread)
              )
            : new THREE.Vector3(0, 0, 0);

          const twoHandBridge = leftCenter && rightCenter
            ? clamp01(1 - leftCenter.distanceTo(rightCenter) / 0.4)
            : 0;
          const avgOpen = (leftOpen + rightOpen) / Math.max(1, hands.length);
          const avgClose = clamp01(1 - avgOpen);
          const gestureType = twoHandBridge > 0.55
            ? "bridge"
            : avgOpen > 0.62
              ? "open"
              : avgClose > 0.65
                ? "fist"
                : handMovementTotal > 0.03
                  ? "gesture"
                  : "pause";

          return {
            present: true,
            center,
            center3D: new THREE.Vector3(
              THREE.MathUtils.lerp(-165, 165, center.x),
              THREE.MathUtils.lerp(115, -85, center.y),
              THREE.MathUtils.lerp(110, -110, handSpreadTotal / Math.max(1, hands.length))
            ),
            leftCenter3D,
            rightCenter3D,
            movement: movement + handMovementTotal * 0.5,
            handMovement: handMovementTotal,
            handSpread: clamp01(handSpreadTotal / Math.max(1, hands.length)),
            gestureEnergy: clamp01(gestureEnergyTotal / Math.max(1, hands.length)),
            twoHandBridge,
            faceHandProximity: 0,
            gestureType,
            handOpen: avgOpen,
            handClose: avgClose,
            handCount: hands.length,
            confidence: 1,
          };
        }

        getStage(disturbance) {
          if (disturbance < 0.08) return 1;
          if (disturbance < 0.24) return 2;
          if (disturbance < 0.42) return 3;
          if (disturbance < 0.7) return 4;
          return 5;
        }
      }

      const memoryField = new MemoryField(420);
      scene.add(memoryField.points);

      const rootGroup = new THREE.Group();
      scene.add(rootGroup);

      const grid = new THREE.GridHelper(1000, 100, 0xffffff, 0x2c2c2c);
      grid.position.y = -170;
      grid.material.transparent = true;
      grid.material.opacity = 0.14;
      rootGroup.add(grid);

      const guidePlaneGeometry = new THREE.PlaneGeometry(760, 760, 1, 1);
      const guidePlaneMaterial = new THREE.MeshBasicMaterial({ color: 0x111111, wireframe: true, transparent: true, opacity: 0.13 });
      const guidePlane = new THREE.Mesh(guidePlaneGeometry, guidePlaneMaterial);
      guidePlane.rotation.x = -Math.PI / 2;
      guidePlane.position.y = -124;
      rootGroup.add(guidePlane);

      const nodes = [];
      const connections = [];
      const connectionPairs = new Set();
      const pulses = [];
      const soundEngine = new SoundEngine();
      const traceArchive = new PresenceArchive();
      const archivedTraces = traceArchive.load();
      const webcamTracker = new WebcamPresenceTracker();
      const pulseLimiter = { clock: 0 };
      let lastMemoryEvolveAt = 0;
      let currentTrace = null;
      let traceNodeCounter = 0;

      const archiveGroup = new THREE.Group();
      scene.add(archiveGroup);

      const archiveConnectionGroup = new THREE.Group();
      scene.add(archiveConnectionGroup);

      const sessionTraceGroup = new THREE.Group();
      scene.add(sessionTraceGroup);

      // presenceGroup replaces the previous presenceOrb mesh (remove central sphere)
      const presenceGroup = new THREE.Group();
      const faceShell = new THREE.Mesh(
        new THREE.SphereGeometry(14, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, wireframe: true })
      );
      // debug markers: small cube and sphere to verify rendering
      const _debugCube = new THREE.Mesh(
        new THREE.BoxGeometry(6, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      _debugCube.position.set(0, 0, 0);
      scene.add(_debugCube);

      const _debugSphere = new THREE.Mesh(
        new THREE.SphereGeometry(3, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      );
      _debugSphere.position.copy(camera.position).add(new THREE.Vector3(0, -8, -40));
      scene.add(_debugSphere);
      const handBridgeGeometry = new THREE.BufferGeometry();
      handBridgeGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const handBridge = new THREE.Line(
        handBridgeGeometry,
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, depthWrite: false })
      );
      const presenceHalo = createBillboardCircle(textures.glow, 10, { additive: true, opacity: 0.0 });
      presenceGroup.add(presenceHalo);
        sessionTraceGroup.add(faceShell);
        sessionTraceGroup.add(handBridge);
      sessionTraceGroup.add(presenceGroup);

      const archiveVisuals = [];
      const liveTraceLinks = new Map();
      const generatedSessionNodes = [];
      const generatedSessionConnections = [];

      const nodeMaterialGroup = new THREE.Group();
      scene.add(nodeMaterialGroup);

      function randomInVolume(radiusX, radiusY, radiusZ) {
        const u = Math.random() * 2 - 1;
        const v = Math.random() * 2 - 1;
        const w = Math.random() * 2 - 1;
        return new THREE.Vector3(u * radiusX, v * radiusY, w * radiusZ);
      }

      function buildNodes() {
        for (let i = 0; i < settings.nodeCount; i++) {
          const basePosition = randomInVolume(150, 92, 150);
          basePosition.y += Math.sin(basePosition.x * 0.02) * 14 - Math.abs(basePosition.y) * 0.06;
          basePosition.z += Math.cos(basePosition.x * 0.015) * 12;
          const node = new Node3D(i, basePosition, textures);
          nodes.push(node);
          nodeMaterialGroup.add(node.group);
        }
      }

      function connectionKey(nodeA, nodeB) {
        return nodeA.index < nodeB.index
          ? `${nodeA.index}-${nodeB.index}`
          : `${nodeB.index}-${nodeA.index}`;
      }

      function addConnectionBundle(nodeA, nodeB, bundleCount = settings.bundleCount) {
        const key = connectionKey(nodeA, nodeB);
        if (connectionPairs.has(key)) {
          return false;
        }

        connectionPairs.add(key);
        for (let bundle = 0; bundle < bundleCount; bundle++) {
          const connection = new Connection3D(nodeA, nodeB, bundle, bundleCount);
          connections.push(connection);
          rootGroup.add(connection.line);
        }

        return true;
      }

      function connectNodes() {
        for (let i = 0; i < nodes.length; i++) {
          const ranked = [];
          for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue;
            const nodeA = nodes[i];
            const nodeB = nodes[j];
            const distance = nodeA.position.distanceTo(nodeB.position);
            const memoryAffinity = (nodeA.memory + nodeB.memory) * 0.5 + Math.abs(nodeA.affinity - nodeB.affinity) * 0.12;
            const proximity = clamp01(1 - distance / settings.connectionDistance);
            const score = proximity * 0.76 + memoryAffinity * 0.58;
            ranked.push({ nodeA, nodeB, distance, score });
          }
          ranked.sort((left, right) => right.score - left.score);
          let linked = 0;
          for (const candidate of ranked) {
            if (linked >= settings.connectionLimit) break;
            if (candidate.distance > settings.connectionDistance || candidate.score < 0.42) continue;
            if (addConnectionBundle(candidate.nodeA, candidate.nodeB)) {
              linked++;
            }
          }
        }
      }

      function evolveMemoryConnections(time) {
        if (time - lastMemoryEvolveAt < 1.8) {
          return;
        }

        lastMemoryEvolveAt = time;
        const hotspots = memoryField.getHotspots(6, 1.5);
        let created = 0;

        for (const hotspot of hotspots) {
          const world = memoryField.cellToWorld(hotspot.x, hotspot.y, hotspot.z);
          let closestA = null;
          let closestB = null;
          let closestDistanceA = Infinity;
          let closestDistanceB = Infinity;

          for (const node of nodes) {
            const distance = node.position.distanceTo(world);
            if (distance < closestDistanceA) {
              closestB = closestA;
              closestDistanceB = closestDistanceA;
              closestA = node;
              closestDistanceA = distance;
            } else if (distance < closestDistanceB) {
              closestB = node;
              closestDistanceB = distance;
            }
          }

          if (!closestA || !closestB) {
            continue;
          }

          const pairKey = connectionKey(closestA, closestB);
          const existing = connections.filter((connection) => connection.key === pairKey);
          if (existing.length > 0) {
            for (const connection of existing) {
              connection.markActivation(0.12 + hotspot.value * 0.04);
            }
            continue;
          }

          if (closestA.position.distanceTo(closestB.position) < settings.connectionDistance * 1.25) {
            if (addConnectionBundle(closestA, closestB, 1)) {
              created++;
              memoryField.recordPresence(world, 0.15 + hotspot.value * 0.08);
            }
          }

          if (created >= 2) {
            break;
          }
        }
      }

      function buildArchiveVisuals() {
        archiveGroup.clear();
        archiveConnectionGroup.clear();

        const nodeVisuals = [];
        for (const trace of traceArchive.traces) {
          const anchor = trace.getAnchorPosition();
          const ghostNode = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 })
          );
          const halo = createBillboardCircle(textures.glow, 8, { additive: true, opacity: 0.08 });
          ghostNode.position.copy(anchor);
          ghostNode.add(halo);
          archiveGroup.add(ghostNode);
          nodeVisuals.push({ trace, node: ghostNode, anchor });

          memoryField.recordPresence(anchor, 0.12 + trace.averageMovement * 0.2);
        }

        for (let i = 0; i < nodeVisuals.length; i++) {
          for (let j = i + 1; j < nodeVisuals.length; j++) {
            const left = nodeVisuals[i];
            const right = nodeVisuals[j];
            const similarity = left.trace.similarityTo(right.trace);
            if (similarity < 0.38) {
              continue;
            }

            const geometry = new THREE.BufferGeometry().setFromPoints([left.anchor, right.anchor]);
            const material = new THREE.LineBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: similarity * 0.18,
              depthWrite: false,
            });
            const line = new THREE.Line(geometry, material);
            archiveConnectionGroup.add(line);
          }
        }

        return nodeVisuals;
      }

      function spawnSessionNode(position, traceLabel) {
        const node = new THREE.Mesh(
          new THREE.SphereGeometry(1.4, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42 })
        );
        node.position.copy(position);
          const halo = createBillboardCircle(textures.glow, 8, { additive: true, opacity: 0.2 });
          node.add(halo);
        sessionTraceGroup.add(node);

        const nodeId = `session-node-${traceNodeCounter++}`;
        generatedSessionNodes.push({ id: nodeId, position: position.toArray(), label: traceLabel });
        if (currentTrace) {
          currentTrace.noteGeneratedNode({ id: nodeId, position: position.toArray(), label: traceLabel });
        }

        return node;
      }

      function updateLiveTraceLinks(matches, currentPosition) {
        const seen = new Set();
        for (const match of matches) {
          const anchor = match.trace.getAnchorPosition();
          const key = `${match.trace.sessionId}`;
          seen.add(key);

          let entry = liveTraceLinks.get(key);
          if (!entry) {
            const geometry = new THREE.BufferGeometry().setFromPoints([currentPosition.clone(), anchor.clone()]);
            const material = new THREE.LineBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.04,
              depthWrite: false,
            });
            const line = new THREE.Line(geometry, material);
            archiveConnectionGroup.add(line);
            entry = { line, anchor, trace: match.trace };
            liveTraceLinks.set(key, entry);
          }

          const positions = entry.line.geometry.attributes.position.array;
          positions[0] = currentPosition.x;
          positions[1] = currentPosition.y;
          positions[2] = currentPosition.z;
          positions[3] = anchor.x;
          positions[4] = anchor.y;
          positions[5] = anchor.z;
          entry.line.geometry.attributes.position.needsUpdate = true;
          entry.line.material.opacity = 0.04 + match.score * 0.28;

          if (match.score > 0.45) {
            const linkId = `${currentTrace.sessionId}:${match.trace.sessionId}`;
            if (!generatedSessionConnections.some((entryConnection) => entryConnection.id === linkId)) {
              generatedSessionConnections.push({ id: linkId, target: match.trace.sessionId, score: match.score });
              currentTrace.noteGeneratedConnection({ id: linkId, target: match.trace.sessionId, score: match.score });
              soundEngine.emitResonance(match.score, 70 + match.score * 220);
            }
          }
        }

        for (const [key, entry] of liveTraceLinks.entries()) {
          if (!seen.has(key)) {
            archiveConnectionGroup.remove(entry.line);
            entry.line.geometry.dispose();
            entry.line.material.dispose();
            liveTraceLinks.delete(key);
          }
        }
      }

      function attachSessionNodeToNetwork(position, label, intensity = 0.45) {
        if (nodes.length === 0) {
          return null;
        }

        let closestNode = nodes[0];
        let closestDistance = closestNode.position.distanceTo(position);
        for (const node of nodes) {
          const distance = node.position.distanceTo(position);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestNode = node;
          }
        }

        const sessionNode = spawnSessionNode(position, label);
        const geometry = new THREE.BufferGeometry().setFromPoints([position.clone(), closestNode.position.clone()]);
        const material = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.08 + intensity * 0.18,
          depthWrite: false,
        });
        const line = new THREE.Line(geometry, material);
        sessionTraceGroup.add(line);

        const connectionId = `session-${traceNodeCounter}-${closestNode.index}`;
        generatedSessionConnections.push({
          id: connectionId,
          from: position.toArray(),
          to: closestNode.position.toArray(),
          intensity,
        });
        if (currentTrace) {
          currentTrace.noteGeneratedConnection({
            id: connectionId,
            from: position.toArray(),
            to: closestNode.position.toArray(),
            intensity,
          });
        }

        memoryField.recordPresence(position, intensity * 0.6);
        return sessionNode;
      }

      function syncWebcamState(sample) {
        if (!sample) {
          return;
        }

        const faceHandDistance = Math.min(
          sample.facePosition.distanceTo(sample.leftHandPosition),
          sample.facePosition.distanceTo(sample.rightHandPosition)
        );
        const faceHandProximity = clamp01(1 - faceHandDistance / 120);
        sample.faceHandProximity = faceHandProximity;

        if (sample.handCount >= 2) {
          const bridgeStrength = clamp01(sample.twoHandBridge + sample.handOpen * 0.4);
          const bridgePositions = handBridge.geometry.attributes.position.array;
          bridgePositions[0] = sample.leftHandPosition.x;
          bridgePositions[1] = sample.leftHandPosition.y;
          bridgePositions[2] = sample.leftHandPosition.z;
          bridgePositions[3] = sample.rightHandPosition.x;
          bridgePositions[4] = sample.rightHandPosition.y;
          bridgePositions[5] = sample.rightHandPosition.z;
          handBridge.geometry.attributes.position.needsUpdate = true;
          handBridge.material.opacity = bridgeStrength > 0.15 ? 0.08 + bridgeStrength * 0.4 : 0;
          handBridge.scale.setScalar(1 + bridgeStrength * 0.08);
          if (bridgeStrength > 0.45) {
            const bridgeConnection = connections.length > 0 ? connections[Math.floor(Math.random() * connections.length)] : null;
            for (let i = 0; i < 3; i++) {
              if (bridgeConnection) {
                const pulse = new Pulse3D(bridgeConnection, soundEngine);
                scene.add(pulse.mesh);
                pulses.push(pulse);
              }
            }
            soundEngine.emitResonance(bridgeStrength, 140 + bridgeStrength * 180);
          }
        } else {
          handBridge.material.opacity = 0;
        }

        const handFaceClose = faceHandProximity > 0.22;
        faceShell.position.copy(sample.facePosition);
        faceShell.visible = sample.faceCount > 0 && handFaceClose;
        faceShell.scale.setScalar(1.15 + faceHandProximity * 2.2);
        faceShell.material.opacity = handFaceClose ? 0.05 + faceHandProximity * 0.28 : 0;

        if (handFaceClose) {
          settings.networkOpen = THREE.MathUtils.lerp(settings.networkOpen, 0.12, 0.1);
          settings.glowBoost = THREE.MathUtils.lerp(settings.glowBoost, 0.62, 0.1);
          soundEngine.emitResonance(faceHandProximity, 92 + faceHandProximity * 160);
        }

        if (sample.gestureType === "open") {
          settings.networkOpen = THREE.MathUtils.lerp(settings.networkOpen, 0.92, 0.12);
          settings.glowBoost = THREE.MathUtils.lerp(settings.glowBoost, 1.32, 0.12);
          memoryField.recordPresence(sample.worldPosition, 0.12 + sample.handOpen * 0.14);
        } else if (sample.gestureType === "fist") {
          settings.networkOpen = THREE.MathUtils.lerp(settings.networkOpen, 0.08, 0.12);
          settings.glowBoost = THREE.MathUtils.lerp(settings.glowBoost, 0.48, 0.12);
        }

        if (sample.presenceDetected && sample.stillness && sample.timeVisible > 2) {
          memoryField.recordPresence(sample.worldPosition, 0.18 + sample.faceScale * 0.08);
        }

        if (sample.faceCount > 0 && sample.handCount > 0) {
          const interactionBoost = clamp01(sample.gestureEnergy + faceHandProximity * 0.55);
          sample.disturbance = clamp01(sample.disturbance + interactionBoost * 0.12);
        }

        // If hands are present, bias the presence toward the hands,
        // calm the global disturbance and slow down motion to make interactions more gentle.
        if (sample.handCount > 0) {
          // compute average hand world position if both hands available
          const handCenter = new THREE.Vector3();
          let handsFound = 0;
          if (sample.leftHandPosition && sample.leftHandPosition.lengthSq() > 0) {
            handCenter.add(sample.leftHandPosition);
            handsFound++;
          }
          if (sample.rightHandPosition && sample.rightHandPosition.lengthSq() > 0) {
            handCenter.add(sample.rightHandPosition);
            handsFound++;
          }
          if (handsFound > 0) {
            handCenter.multiplyScalar(1 / handsFound);

            // make presence follow the hands more strongly
            smoothedPresence.lerp(handCenter, 0.28);
            presenceGroup.position.copy(smoothedPresence);
            presenceGroup.visible = true;

            // deposit memory along the hand path with modest intensity
            memoryField.recordPresence(handCenter, 0.12 + clamp01(sample.handSpread || 0) * 0.28);

            // calm the disturbance and slow the target speed so the network becomes less jittery
            motionState.disturbance = THREE.MathUtils.lerp(motionState.disturbance, motionState.disturbance * 0.45, 0.28);
            motionState.targetSpeed = THREE.MathUtils.lerp(motionState.targetSpeed, motionState.targetSpeed * 0.38, 0.28);

            // visually reduce aggressive motion/glow while hands guide the system
            settings.drift = THREE.MathUtils.lerp(settings.drift, Math.max(0.02, settings.drift * 0.45), 0.12);
            settings.networkOpen = THREE.MathUtils.lerp(settings.networkOpen, Math.max(0.06, settings.networkOpen * 0.6), 0.08);
          }
        }

        motionState.speed = THREE.MathUtils.lerp(motionState.speed, sample.speed, 0.16);
        motionState.targetSpeed = sample.speed;
        motionState.disturbance = clamp01(Math.max(motionState.disturbance, motionState.disturbanceMemory, sample.disturbance));
        motionState.disturbanceMemory = Math.max(motionState.disturbanceMemory, sample.disturbanceMemory, motionState.disturbance);
        motionState.idleTime = sample.stillness ? motionState.idleTime + 0.016 : 0;

        smoothedPresence.lerp(sample.worldPosition, 0.12);
        presenceGroup.position.copy(smoothedPresence);
        presenceGroup.visible = sample.presenceDetected || sample.disturbance > 0.01;
        presenceGroup.scale.setScalar(1 + sample.faceScale * 3.5 + sample.disturbance * 2.2);
        presenceHalo.material.opacity = sample.presenceDetected ? 0.14 + sample.disturbance * 0.38 : 0.02 + sample.disturbance * 0.08;
        presenceHalo.material.opacity = Math.max(presenceHalo.material.opacity, sample.presenceDetected ? 0.18 + sample.disturbance * 0.45 : 0.05);
        presenceHalo.scale.setScalar(8 + sample.disturbance * 22);
        faceShell.material.side = THREE.DoubleSide;

        memoryField.recordPresence(sample.worldPosition, 0.08 + sample.disturbance * 0.16 + sample.movement * 0.12);

        if (currentTrace) {
          currentTrace.record(sample);

          if (currentTrace.pathHistory.length === 1) {
            attachSessionNodeToNetwork(sample.worldPosition, `visitor-${currentTrace.sessionId.slice(0, 8)}`, 0.4 + sample.disturbance * 0.2);
          }

          if (sample.presenceDetected && (sample.repeatedZoneCount === 1 || sample.repeatedZoneCount % 4 === 0)) {
            attachSessionNodeToNetwork(sample.worldPosition, sample.zoneKey, 0.25 + sample.disturbance * 0.25);
          }

          const matches = traceArchive.findMatches(currentTrace, 4);
          updateLiveTraceLinks(matches, sample.worldPosition);
        }

        if (sample.presenceDetected) {
          const stageLabel = `stage-${sample.stage}`;
          uiStats.textContent = `disturbance ${sample.disturbance.toFixed(2)} / presence ${sample.timeVisible.toFixed(1)}s / ${stageLabel} / matches ${liveTraceLinks.size}`;
        }
      }

      async function startExperience() {
        if (webcamTracker.initialized) {
          return;
        }

        startHint.textContent = "starting webcam";
        currentTrace = new PresenceTrace();
        webcamTracker.onUpdate = syncWebcamState;

        try {
          await Promise.all([
            soundEngine.start(),
            webcamTracker.start(),
          ]);

          webcamTracker.initialized = true;
          soundEngine.setArchiveTraces(traceArchive.traces);
          startHint.style.display = "none";
          // remove fallback UI if present
          const btnContainer = document.getElementById("startButtonsContainer");
          if (btnContainer) btnContainer.remove();
        } catch (error) {
          webcamTracker.initialized = false;
          webcamTracker.running = false;
          currentTrace = null;
          startHint.textContent = "webcam permission needed";
        }
      }

      // Attempt to auto-start webcam tracking on load. Audio may require a user gesture; if so,
      // keep the existing pointerdown fallback to start audio when the user interacts.
      async function autoInit() {
        if (webcamTracker.initialized) return;
        startHint.textContent = "initializing...";
        currentTrace = new PresenceTrace();
        webcamTracker.onUpdate = syncWebcamState;

        try {
          // Start webcam/tracking immediately
          await webcamTracker.start();
          webcamTracker.initialized = true;
          startHint.textContent = "webcam active";
          // remove fallback UI when autoInit succeeds
          const btnContainer2 = document.getElementById("startButtonsContainer");
          if (btnContainer2) btnContainer2.remove();
          // Try starting audio but don't fail initialization if blocked by browser
          try {
            await soundEngine.start();
            soundEngine.setArchiveTraces(traceArchive.traces);
            startHint.style.display = "none";
          } catch (audioErr) {
            // Audio requires user gesture — show hint and leave pointerdown as fallback
            startHint.textContent = "tap to enable audio";
          }
        } catch (err) {
          webcamTracker.initialized = false;
          webcamTracker.running = false;
          currentTrace = null;
          startHint.textContent = "webcam permission needed";
        }
      }

      function createParticleField() {
        const count = settings.particleCount;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const seeds = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const p = randomInVolume(210, 140, 210);
          positions[i * 3] = p.x;
          positions[i * 3 + 1] = p.y;
          positions[i * 3 + 2] = p.z;
          seeds[i * 3] = Math.random() * 1000;
          seeds[i * 3 + 1] = Math.random() * 1000;
          seeds[i * 3 + 2] = Math.random() * 1000;
        }
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 3));
        const material = new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.8,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
          map: textures.glow,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true,
        });
        const points = new THREE.Points(geometry, material);
        points.frustumCulled = false;
        scene.add(points);
        return { points, positions, seeds };
      }

      function createTerrainField() {
        const count = settings.terrainDensity;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const seeds = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const x = THREE.MathUtils.randFloatSpread(620);
          const z = THREE.MathUtils.randFloatSpread(620);
          const mound = Math.exp(-(x * x + z * z) / (2 * 170 * 170));
          const ripple = Math.sin(x * 0.018) * Math.cos(z * 0.016);
          positions[i * 3] = x;
          positions[i * 3 + 1] = -172 + mound * settings.terrainAmplitude + ripple * 2.1 + Math.random() * 0.8;
          positions[i * 3 + 2] = z;
          seeds[i * 3] = Math.random() * 900;
          seeds[i * 3 + 1] = Math.random() * 900;
          seeds[i * 3 + 2] = Math.random() * 900;
        }
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 3));
        const material = new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.95,
          transparent: true,
          opacity: 0.6,
          depthWrite: false,
          map: textures.glow,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true,
        });
        const points = new THREE.Points(geometry, material);
        points.frustumCulled = false;
        scene.add(points);
        return { points, positions, seeds };
      }

      function createGlowingBackdrop() {
        const geometry = new THREE.SphereGeometry(980, 32, 24);
        const material = new THREE.MeshBasicMaterial({
          color: 0x050505,
          side: THREE.BackSide,
          transparent: true,
          opacity: 1,
        });
        const shell = new THREE.Mesh(geometry, material);
        scene.add(shell);
        return shell;
      }

      const particleField = createParticleField();
      const terrainField = createTerrainField();
      const backdrop = createGlowingBackdrop();

      buildNodes();
      connectNodes();
      buildArchiveVisuals();

      const gui = new GUI({ container: document.getElementById("gui-wrap"), width: 280 });
      gui.title = "Root Network";
      gui.add(settings, "networkOpen", 0, 1, 0.001).name("network open");
      gui.add(settings, "glowBoost", 0.2, 2.5, 0.001).name("glow boost");
      gui.add(settings, "drift", 0, 1, 0.001).name("node drift");
      gui.add(settings, "filamentNoise", 0, 1, 0.001).name("filament noise");
      gui.add(settings, "pulseRate", 0.05, 1.2, 0.001).name("pulse rate");
      gui.add(settings, "audioDepth", 0, 1, 0.001).name("audio depth");
      gui.add(settings, "autoOrbit", 0, 0.8, 0.001).name("camera drift").onChange((value) => {
        controls.autoRotateSpeed = value;
      });

      const motionState = {
        speed: 0,
        targetSpeed: 0,
        disturbance: 0,
        disturbanceMemory: 0,
        idleTime: 0,
        lastMoveAt: performance.now(),
        isInside: false,
      };

      let hasInitializedPointer = false;

      function updatePointer(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
        motionState.isInside = true;
        motionState.lastMoveAt = performance.now();
        hasInitializedPointer = true;
      }

      function calculatePresencePoint() {
        raycaster.setFromCamera(mouse, camera);
        const hit = raycaster.ray.intersectPlane(presencePlane, presencePoint);
        if (!hit) {
          presencePoint.set(0, 0, 0);
        }
        presencePoint.z += Math.sin(mouse.x * 1.7) * 78 + Math.cos(mouse.y * 1.3) * 42;
        smoothedPresence.lerp(presencePoint, 0.06);
      }

      function maybeCreatePulse(connection, speedFactor) {
        if (pulseLimiter.clock > 0) {
          pulseLimiter.clock -= 1;
          return;
        }
        if (Math.random() < settings.pulseRate * 0.012 * speedFactor) {
          const pulse = new Pulse3D(connection, soundEngine);
          scene.add(pulse.mesh);
          pulses.push(pulse);
          connection.markActivation(0.08 + speedFactor * 0.02);
          pulseLimiter.clock = 4 + Math.floor(Math.random() * 6);
        }
      }

      function updateParticleField(time, motionSpeed) {
        const positions = particleField.points.geometry.attributes.position.array;
        const seeds = particleField.points.geometry.attributes.seed.array;
        for (let i = 0; i < positions.length / 3; i++) {
          const seed = seeds[i * 3];
          const x = positions[i * 3];
          const z = positions[i * 3 + 2];
          const wave = layeredNoise(x * 0.01, z * 0.01, seed * 0.01, time * 0.2);
          positions[i * 3 + 1] += Math.sin(time * 1.4 + seed * 0.01) * 0.01 + (wave - 0.5) * 0.008;
          positions[i * 3] += Math.cos(time * 0.35 + seed * 0.02) * 0.002;
          positions[i * 3 + 2] += Math.sin(time * 0.28 + seed * 0.018) * 0.002;
          if (motionSpeed > 0.15) {
            positions[i * 3 + 1] += motionSpeed * 0.012;
          }
        }
        particleField.points.geometry.attributes.position.needsUpdate = true;
      }

      function updateTerrainField(time, memoryDensity, disturbance) {
        const positions = terrainField.points.geometry.attributes.position.array;
        const seeds = terrainField.points.geometry.attributes.seed.array;
        for (let i = 0; i < positions.length / 3; i++) {
          const x = positions[i * 3];
          const z = positions[i * 3 + 2];
          const seed = seeds[i * 3];
          const mound = Math.exp(-(x * x + z * z) / (2 * 160 * 160));
          const wave = Math.sin(time * 0.8 + seed * 0.01 + x * 0.01) * 0.55 + Math.cos(time * 0.74 + z * 0.01) * 0.55;
          positions[i * 3 + 1] = -172 + mound * (settings.terrainAmplitude + memoryDensity * 18 + disturbance * 14) + wave * (1.4 + disturbance * 0.6);
        }
        terrainField.points.geometry.attributes.position.needsUpdate = true;
      }

      function animate() {
        requestAnimationFrame(animate);
        const dt = Math.min(clock.getDelta(), 0.05);
        const time = clock.elapsedTime;

        const webcamState = webcamTracker.state;
        if (webcamTracker.initialized) {
          motionState.speed = THREE.MathUtils.lerp(motionState.speed, webcamState.speed, 0.16);
          motionState.targetSpeed = webcamState.speed;
          motionState.disturbance = Math.max(webcamState.disturbance, motionState.disturbanceMemory);
          motionState.disturbanceMemory = Math.max(motionState.disturbanceMemory, webcamState.disturbanceMemory);
          motionState.idleTime = webcamState.presenceDetected ? 0 : motionState.idleTime + dt;
          smoothedPresence.lerp(webcamState.worldPosition, 0.12);
        }

        const memoryFloor = clamp01(memoryField.globalDensity * 0.08);
        motionState.disturbanceMemory = Math.max(motionState.disturbanceMemory, memoryFloor);
        motionState.disturbance = Math.max(motionState.disturbance, motionState.disturbanceMemory);

        const openBoost = clamp01(1 - motionState.disturbance * 0.85);
        settings.networkOpen = THREE.MathUtils.lerp(settings.networkOpen, openBoost, 0.03);
        settings.glowBoost = THREE.MathUtils.lerp(settings.glowBoost, 0.72 + motionState.disturbance * 1.25, 0.03);

        memoryField.update(dt);
        evolveMemoryConnections(time);
        updateParticleField(time, motionState.disturbance);
        updateTerrainField(time, memoryField.globalDensity, motionState.disturbance);

        for (const node of nodes) {
          node.update(dt, smoothedPresence, motionState, memoryField, time);
        }

        for (const connection of connections) {
          connection.update(time, motionState, memoryField, smoothedPresence);
          if (connection.baseStrength > 0.46 && motionState.disturbance > 0.08) {
            maybeCreatePulse(connection, 0.75 + connection.baseStrength * 0.8);
          }
        }

        for (let i = pulses.length - 1; i >= 0; i--) {
          const finished = pulses[i].update(dt, time);
          scene.add(pulses[i].mesh);
          if (finished) {
            pulses[i].connection.markActivation(0.18 + pulses[i].connection.baseStrength * 0.12);
            scene.remove(pulses[i].mesh);
            pulses.splice(i, 1);
          }
        }

        while (pulses.length > 48) {
          const pulse = pulses.shift();
          scene.remove(pulse.mesh);
        }

        const memoryDensity = memoryField.globalDensity;
        soundEngine.update(motionState, memoryDensity, dt);
        controls.update();

        presenceGroup.position.copy(smoothedPresence);
        presenceGroup.visible = webcamTracker.initialized && (webcamState.presenceDetected || motionState.disturbance > 0.01);
        presenceGroup.scale.setScalar(1.2 + motionState.disturbance * 3.2);
        presenceHalo.material.opacity = webcamTracker.initialized ? 0.08 + motionState.disturbance * 0.34 : 0.0;
        presenceHalo.material.opacity = Math.max(presenceHalo.material.opacity, webcamTracker.initialized ? 0.12 + motionState.disturbance * 0.4 : 0.0);
        presenceHalo.scale.setScalar(8 + motionState.disturbance * 18);

        backdrop.material.opacity = 0.98;
        rootGroup.rotation.y = Math.sin(time * 0.05) * 0.02;
        rootGroup.rotation.x = Math.cos(time * 0.04) * 0.01;
        nodeMaterialGroup.rotation.y = Math.sin(time * 0.025) * 0.008;

        uiStats.textContent = webcamTracker.initialized
          ? `disturbance ${motionState.disturbance.toFixed(2)} / density ${memoryDensity.toFixed(2)} / traces ${memoryField.samples} / pulses ${pulses.length}`
          : "awaiting webcam permission";

        // orient circular billboards to face the camera (sprite-like behaviour)
        for (let i = 0; i < billboards.length; i++) {
          const b = billboards[i];
          if (b && b.userData && b.userData.isBillboard) b.quaternion.copy(camera.quaternion);
        }

        renderer.render(scene, camera);
      }

      window.addEventListener("pointerdown", startExperience, { passive: true });

      // Kick off automatic initialization (webcam + try audio)
      autoInit();

      // Create a visible start button as fallback when automatic init is blocked.
      function ensureStartButton() {
        if (document.getElementById("startWebcamBtn") || document.getElementById("startAudioBtn")) return;

        const container = document.createElement("div");
        container.id = "startButtonsContainer";
        container.style.position = "fixed";
        container.style.right = "18px";
        container.style.bottom = "18px";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "8px";
        container.style.zIndex = 9999;

        const camBtn = document.createElement("button");
        camBtn.id = "startWebcamBtn";
        camBtn.textContent = "Avvia Webcam";
        camBtn.style.padding = "10px 14px";
        camBtn.style.background = "rgba(255,255,255,0.06)";
        camBtn.style.color = "#fff";
        camBtn.style.border = "1px solid rgba(255,255,255,0.12)";
        camBtn.style.borderRadius = "6px";
        camBtn.style.backdropFilter = "blur(4px)";
        camBtn.style.cursor = "pointer";
        camBtn.addEventListener("click", async () => {
          startHint.textContent = "starting webcam...";
          try {
            await webcamTracker.start();
            webcamTracker.initialized = true;
            startHint.textContent = "webcam active";
            camBtn.style.display = "none";
          } catch (err) {
            console.error("webcam start failed", err);
            startHint.textContent = "webcam permission needed (check console)";
          }
        });

        const audioBtn = document.createElement("button");
        audioBtn.id = "startAudioBtn";
        audioBtn.textContent = "Abilita Audio";
        audioBtn.style.padding = "10px 14px";
        audioBtn.style.background = "rgba(255,255,255,0.06)";
        audioBtn.style.color = "#fff";
        audioBtn.style.border = "1px solid rgba(255,255,255,0.12)";
        audioBtn.style.borderRadius = "6px";
        audioBtn.style.backdropFilter = "blur(4px)";
        audioBtn.style.cursor = "pointer";
        audioBtn.addEventListener("click", async () => {
          startHint.textContent = "enabling audio...";
          try {
            await soundEngine.start();
            soundEngine.setArchiveTraces(traceArchive.traces);
            startHint.textContent = "audio active";
            audioBtn.style.display = "none";
          } catch (err) {
            console.error("audio start failed", err);
            startHint.textContent = "audio blocked (click page or allow audio)";
          }
        });

        container.appendChild(camBtn);
        container.appendChild(audioBtn);
        document.body.appendChild(container);
      }

      // Ensure start buttons are available immediately as a visible fallback
      ensureStartButton();
      // Also set a friendly hint if webcam hasn't initialized within a short delay
      setTimeout(() => {
        if (!webcamTracker.initialized) {
          startHint.textContent = "click Avvia Webcam per consentire la videocamera";
        }
      }, 800);
      window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      });

      window.addEventListener("beforeunload", () => {
        if (currentTrace) {
          traceArchive.addTrace(currentTrace);
        } else {
          traceArchive.save();
        }
        webcamTracker.stop();
      });

      smoothedPresence.set(0, 0, 0);
      presenceGroup.position.copy(smoothedPresence);

      animate();
