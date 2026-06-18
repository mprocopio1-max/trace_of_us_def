let nodes = [];
let connections = [];
let pulses = [];
let memoryTraces = [];

let lastMouseX = 0;
let lastMouseY = 0;
let mouseSpeed = 0;
let mouseStillTime = 0;
let lastTraceFrame = 0;

const NODE_COUNT = 90;
const TRACE_LIMIT = 220;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  initializeNetwork();
  lastMouseX = width * 0.5;
  lastMouseY = height * 0.5;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initializeNetwork(true);
}

function initializeNetwork(keepMemory = false) {
  const previousTraces = keepMemory ? memoryTraces.slice() : [];

  nodes = [];
  connections = [];
  pulses = [];

  if (!keepMemory) {
    memoryTraces = [];
  }

  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push(new Node(random(width), random(height), i));
  }

  memoryTraces = previousTraces;
}

function draw() {
  drawBackground();
  updatePresence();
  updateMemoryTraces();
  updateNodes();
  buildConnections();
  updateAndDrawConnections();
  updateAndDrawPulses();
  drawMemoryTraces();
  drawNodes();
  drawInterface();
}

function drawBackground() {
  background(5, 7, 8);

  noStroke();
  for (let i = 0; i < 3; i++) {
    const alpha = 10 - i * 2;
    fill(20, 16, 14, alpha);
    rect(0, 0, width, height);
  }

  // Subtle atmospheric dust.
  for (let i = 0; i < 55; i++) {
    const x = noise(i * 0.13, frameCount * 0.002) * width;
    const y = noise(i * 0.19 + 20, frameCount * 0.002) * height;
    const a = 6 + noise(i * 0.2, frameCount * 0.01) * 12;
    fill(180, 190, 195, a);
    circle(x, y, 1.2 + noise(i * 0.31, frameCount * 0.01) * 2.2);
  }
}

function updatePresence() {
  const pointerInside = mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
  const previousX = lastMouseX;
  const previousY = lastMouseY;

  if (pointerInside) {
    mouseSpeed = dist(mouseX, mouseY, previousX, previousY);
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  } else {
    mouseSpeed *= 0.94;
  }

  if (mouseSpeed < 0.7) {
    mouseStillTime++;
  } else {
    mouseStillTime = 0;
  }

  if (pointerInside) {
    const travel = dist(mouseX, mouseY, previousX, previousY);
    const movedEnough = travel > 3.5;
    const timeSinceLastTrace = frameCount - lastTraceFrame;

    if (movedEnough || timeSinceLastTrace > 18) {
      memoryTraces.push(new MemoryTrace(mouseX, mouseY, travel));
      lastTraceFrame = frameCount;
    }
  }
}

function updateMemoryTraces() {
  for (let i = memoryTraces.length - 1; i >= 0; i--) {
    memoryTraces[i].update();
    if (memoryTraces[i].isDead()) {
      memoryTraces.splice(i, 1);
    }
  }

  if (memoryTraces.length > TRACE_LIMIT) {
    memoryTraces.splice(0, memoryTraces.length - TRACE_LIMIT);
  }
}

function updateNodes() {
  for (const node of nodes) {
    node.update();
  }
}

function buildConnections() {
  const activeConnections = [];
  const seen = new Set();
  const maxBaseDistance = min(width, height) * 0.52;

  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];
    const ranked = [];

    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;

      const nodeB = nodes[j];
      const distance = dist(nodeA.pos.x, nodeA.pos.y, nodeB.pos.x, nodeB.pos.y);
      const proximity = constrain(1 - distance / maxBaseDistance, 0, 1);
      const memoryBridge = sqrt(nodeA.memory + nodeB.memory) * 0.55;
      const calmBonus = map(1 - constrain(mouseSpeed / 18, 0, 1), 0, 1, 0.1, 0.45);
      const score = proximity * 0.9 + memoryBridge + calmBonus;

      ranked.push({ nodeA, nodeB, distance, score, proximity, memoryBridge });
    }

    ranked.sort((left, right) => right.score - left.score);

    let localCount = 0;
    for (const candidate of ranked) {
      if (localCount >= 4) break;

      const key = candidate.nodeA.index < candidate.nodeB.index
        ? `${candidate.nodeA.index}-${candidate.nodeB.index}`
        : `${candidate.nodeB.index}-${candidate.nodeA.index}`;

      const shouldLinkNearby = candidate.distance < maxBaseDistance * 0.72 && candidate.score > 0.52;
      const shouldLinkMemory = candidate.memoryBridge > 0.42 && candidate.score > 0.58;

      if ((shouldLinkNearby || shouldLinkMemory) && !seen.has(key)) {
        seen.add(key);
        activeConnections.push(new Connection(candidate.nodeA, candidate.nodeB, candidate.distance, candidate.score, candidate.memoryBridge));
        localCount++;
      }
    }
  }

  connections = activeConnections;
}

function updateAndDrawConnections() {
  for (const connection of connections) {
    connection.update();
    connection.draw();

    if (connection.isActive() && random() < 0.012 * connection.activity) {
      pulses.push(new Pulse(connection));
    }
  }
}

function updateAndDrawPulses() {
  for (let i = pulses.length - 1; i >= 0; i--) {
    pulses[i].update();
    pulses[i].draw();
    if (pulses[i].isDead()) {
      pulses.splice(i, 1);
    }
  }

  if (pulses.length > 70) {
    pulses.splice(0, pulses.length - 70);
  }
}

function drawMemoryTraces() {
  for (const trace of memoryTraces) {
    trace.draw();
  }
}

function drawNodes() {
  for (const node of nodes) {
    node.draw();
  }
}

function drawInterface() {
  push();
  noStroke();
  fill(230, 230, 225, 180);
  textAlign(LEFT, TOP);
  textSize(12);
  textFont('monospace');
  text('Root Network\nmuovi lentamente per aprire la rete\nfermati per ascoltarla', 16, 14);
  pop();
}

class Node {
  constructor(x, y, index) {
    this.index = index;
    this.base = createVector(x, y);
    this.pos = createVector(x, y);
    this.offsetX = random(1000);
    this.offsetY = random(2000);
    this.phase = random(TWO_PI);
    this.memory = random(0.05, 0.12);
    this.energy = random(0.3, 1);
    this.radius = random(2.2, 4.2);
  }

  update() {
    const calm = 1 - constrain(mouseSpeed / 20, 0, 1);
    const disturbance = constrain(mouseSpeed / 22, 0, 1);

    let wander = createVector(
      map(noise(this.offsetX, frameCount * 0.004), 0, 1, -1, 1),
      map(noise(this.offsetY, frameCount * 0.004), 0, 1, -1, 1)
    );
    wander.mult(0.45 + calm * 0.4);

    const cursor = createVector(constrain(mouseX, 0, width), constrain(mouseY, 0, height));
    const toCursor = p5.Vector.sub(cursor, this.pos);
    const cursorDistance = toCursor.mag();
    const influenceRadius = lerp(120, 280, calm);

    let cursorForce = createVector(0, 0);
    if (cursorDistance < influenceRadius && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
      const influence = pow(1 - cursorDistance / influenceRadius, 2.1);
      const listenPull = 1.4 * calm;
      const disturbancePush = 0.7 * disturbance;
      cursorForce = toCursor.copy().normalize().mult(influence * (listenPull - disturbancePush));
    }

    let traceForce = createVector(0, 0);
    let nearbyTraceEnergy = 0;
    for (const trace of memoryTraces) {
      const dx = trace.pos.x - this.pos.x;
      const dy = trace.pos.y - this.pos.y;
      const distance = sqrt(dx * dx + dy * dy);
      const influence = trace.influence(distance);

      if (influence > 0) {
        const direction = createVector(dx, dy);
        if (direction.mag() > 0.0001) {
          direction.normalize().mult(influence * 0.5);
          traceForce.add(direction);
        }
        nearbyTraceEnergy += influence;
      }
    }

    this.memory = lerp(this.memory, constrain(nearbyTraceEnergy * 0.18 + calm * 0.18, 0, 1), 0.035);
    this.energy = lerp(this.energy, constrain(0.45 + nearbyTraceEnergy * 0.35 + calm * 0.25, 0, 1), 0.05);

    const resonance = sin(frameCount * 0.01 + this.phase) * 0.45;
    const organicOffset = createVector(
      map(noise(this.offsetX + 50, frameCount * 0.0025), 0, 1, -1, 1),
      map(noise(this.offsetY + 50, frameCount * 0.0025), 0, 1, -1, 1)
    ).mult(0.8 + calm * 0.9);

    let target = p5.Vector.add(this.base, organicOffset);
    target.add(cursorForce.copy().mult(26 + resonance * 8));
    target.add(traceForce.mult(22 + this.memory * 18));

    const stiffness = 0.018 + calm * 0.012;
    this.pos.lerp(target, stiffness);

    const jitter = map(disturbance, 0, 1, 0.02, 0.75);
    this.pos.x += map(noise(this.offsetX + frameCount * 0.02), 0, 1, -1, 1) * jitter;
    this.pos.y += map(noise(this.offsetY + frameCount * 0.02), 0, 1, -1, 1) * jitter;
  }

  draw() {
    const calm = 1 - constrain(mouseSpeed / 20, 0, 1);
    const glow = 0.35 + this.memory * 0.8 + calm * 0.2;
    const size = this.radius + this.memory * 3.5 + calm * 0.7;

    noStroke();
    fill(18, 20, 22, 200 * glow);
    circle(this.pos.x, this.pos.y, size * 2.8);

    fill(120, 205, 230, 150 * glow);
    circle(this.pos.x, this.pos.y, size * 1.5);

    fill(245, 242, 228, 200 * glow);
    circle(this.pos.x, this.pos.y, size * 0.8);
  }
}

class Connection {
  constructor(nodeA, nodeB, distance, score, memoryBridge) {
    this.nodeA = nodeA;
    this.nodeB = nodeB;
    this.distance = distance;
    this.score = score;
    this.memoryBridge = memoryBridge;
    this.phase = random(TWO_PI);
    this.activity = constrain(score * 0.8 + memoryBridge * 0.8, 0, 1.5);
  }

  update() {
    const calm = 1 - constrain(mouseSpeed / 20, 0, 1);
    this.activity = constrain(this.score * 0.55 + this.memoryBridge * 0.85 + calm * 0.2, 0, 1.5);
  }

  isActive() {
    return this.activity > 0.24;
  }

  draw() {
    const calm = 1 - constrain(mouseSpeed / 20, 0, 1);
    const memoryGlow = this.memoryBridge * 0.75 + (this.nodeA.memory + this.nodeB.memory) * 0.25;
    const alpha = 12 + memoryGlow * 110 + calm * 20;
    const strokeWeightValue = 0.3 + memoryGlow * 1.7 + calm * 0.6;
    const midX = (this.nodeA.pos.x + this.nodeB.pos.x) * 0.5;
    const midY = (this.nodeA.pos.y + this.nodeB.pos.y) * 0.5;
    const dx = this.nodeB.pos.x - this.nodeA.pos.x;
    const dy = this.nodeB.pos.y - this.nodeA.pos.y;
    const len = sqrt(dx * dx + dy * dy);
    const normalX = len > 0 ? -dy / len : 0;
    const normalY = len > 0 ? dx / len : 0;
    const curveMag = (noise(this.phase, frameCount * 0.01) - 0.5) * 22 * (0.3 + calm);

    const controlX = midX + normalX * curveMag;
    const controlY = midY + normalY * curveMag;

    noFill();
    stroke(40, 60, 70, alpha * 0.35);
    strokeWeight(strokeWeightValue * 2.2);
    bezier(
      this.nodeA.pos.x, this.nodeA.pos.y,
      controlX, controlY,
      controlX, controlY,
      this.nodeB.pos.x, this.nodeB.pos.y
    );

    stroke(125, 210, 232, alpha);
    strokeWeight(strokeWeightValue);
    bezier(
      this.nodeA.pos.x, this.nodeA.pos.y,
      controlX, controlY,
      controlX, controlY,
      this.nodeB.pos.x, this.nodeB.pos.y
    );
  }
}

class Pulse {
  constructor(connection) {
    this.connection = connection;
    this.progress = random();
    this.speed = random(0.0035, 0.011) * (0.7 + connection.activity);
    this.life = 0;
    this.maxLife = random(120, 240);
    this.radius = random(1.6, 3.2);
  }

  update() {
    this.progress += this.speed;
    this.life++;
  }

  isDead() {
    return this.progress > 1.03 || this.life > this.maxLife;
  }

  draw() {
    const x = bezierPoint(
      this.connection.nodeA.pos.x,
      (this.connection.nodeA.pos.x + this.connection.nodeB.pos.x) * 0.5,
      (this.connection.nodeA.pos.x + this.connection.nodeB.pos.x) * 0.5,
      this.connection.nodeB.pos.x,
      this.progress
    );
    const y = bezierPoint(
      this.connection.nodeA.pos.y,
      (this.connection.nodeA.pos.y + this.connection.nodeB.pos.y) * 0.5,
      (this.connection.nodeA.pos.y + this.connection.nodeB.pos.y) * 0.5,
      this.connection.nodeB.pos.y,
      this.progress
    );

    const pulseAlpha = map(this.life, 0, this.maxLife, 220, 0);

    noStroke();
    fill(120, 220, 245, pulseAlpha * 0.25);
    circle(x, y, this.radius * 4.5);
    fill(245, 245, 238, pulseAlpha * 0.9);
    circle(x, y, this.radius * 1.6);
  }
}

class MemoryTrace {
  constructor(x, y, travel) {
    this.pos = createVector(x, y);
    this.age = 0;
    this.maxAge = 250 + travel * 8;
    this.strength = constrain(map(travel, 0, 24, 0.35, 1), 0.35, 1);
    this.radius = 6 + this.strength * 14;
  }

  update() {
    this.age++;
    this.strength *= 0.995;
  }

  isDead() {
    return this.age > this.maxAge || this.strength < 0.03;
  }

  influence(distance) {
    const falloff = constrain(1 - distance / this.radius, 0, 1);
    return falloff * falloff * this.strength;
  }

  draw() {
    const fade = 1 - this.age / this.maxAge;
    const alpha = 22 + fade * 70;

    noStroke();
    fill(25, 18, 14, alpha * 0.55);
    circle(this.pos.x, this.pos.y, this.radius * (1.1 + fade * 0.6));
    fill(125, 215, 235, alpha * 0.45);
    circle(this.pos.x, this.pos.y, this.radius * (0.45 + fade * 0.25));
    fill(245, 242, 230, alpha * 0.5);
    circle(this.pos.x, this.pos.y, max(1.4, this.radius * 0.14));
  }
}
