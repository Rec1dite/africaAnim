let mask;
let canv;

const canvasSize = 800;
const gridCount = 50;
const spacing = 0;
const weight = 0.1;
const alpha = 50;
const gravity = 0.4;

const dayStart = 6;
const dayEnd = 18;

const blockStep = canvasSize / gridCount;
const blockSize = blockStep - spacing;

const blocks = []

let img;

function preload() {
  img = loadImage('./africa.jpg');
}

let map;

function setup() {
  img.resize(gridCount, gridCount);

  createCanvas(canvasSize, canvasSize);
  map = createGraphics(gridCount, gridCount);
  noSmooth();

  for (let x = 0; x < gridCount; x += 4) {
    for (let y = 0; y < gridCount; y += 4) {
      if (img.get(x, y)[0] == 255) {
        // map.stroke(255, random(0, 255));
        map.stroke(255);
        map.strokeWeight(1);
        map.point(x-0.5, y-0.5);
      }
    }
  }

  rectMode(CORNER);
  textAlign(LEFT, TOP);

  for (let x = 0; x < gridCount; x++) {
    for (let y = 0; y < gridCount; y++) {
      blocks.push(null);
    }
  }
}

anims = [];
particles = [];

function draw() {
  clear();

  // image(img, 0, 0);
  image(map, 0, 0, canvasSize, canvasSize);

  //---------- Get time ----------//
  const date = new Date();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  text(hour + ":" + minute + ":" + second + ":" + round(frameRate()), 1, 2);

  //---------- Draw grid ----------//
  noFill();
  stroke(255);
  // noStroke();
  strokeWeight(weight);
  rectMode(CORNER);
  for (let x = 0; x < gridCount; x++) {
    for (let y = 0; y < gridCount; y++) {
      // fill(255, alpha);
      rect(x * blockStep, y * blockStep, blockSize, blockSize);
    }
  }

  //---------- Play animations ---------//
  anims = anims.filter(execAnim);

  //---------- Render particles ---------//
  noStroke();
  fill(255);
  particles.filter(execParticle);

  //---------- Debug ---------//
  noStroke();
  fill(255, 0, 0);
  rect(random(0, 40), random(0, 40), 10, 10);
}

const partSize = 5;
function execParticle(p) {
    // Update
    p.vy += gravity;
    p.x += p.vx;
    p.y += p.vy;

    if (p.y > canvasSize) return false;

    // Render
    rect(p.x, p.y, partSize, partSize);
    return true;
}

function spawnParticles(n, bx, by) {
  for (let i = 0; i < n; i++) {
    particles = [...particles, {
      x: bx * blockStep + blockStep/2 + random(-blockSize, blockSize),
      y: by * blockStep + blockStep/2 + random(-blockSize, blockSize),
      vx: random(-5, 5) * 1.0,
      vy: random(-15, -5) * 1.0
    }];
  }
}

const totFrames = 40;
const part1End = 16;
const waitFrames = 4;
const part2Start = part1End + waitFrames;

const implScale = 10;
const explScale = 20;
const implAlpha = 100;
function execAnim(anim) {
  const { frame, bx, by } = anim;
  rectMode(CENTER);

  // Implosion
  if (frame < part1End) {
    const t = frame/(part1End-1);
    let size = (1 - t);
    size *= blockSize * implScale;
    size = max(size, blockSize);

    noStroke();
    fill(255, implAlpha*pow(0.9, 1-t));

    rect(bx * blockStep + blockStep/2, by * blockStep + blockStep/2, size, size);

  }
  // Particles
  else if (frame == part2Start) {
    spawnParticles(20, bx, by);
  }
  // Explosion
  else if (frame > part2Start) {
    const t = (frame - part2Start)/(totFrames-part1End);
    // let size = (1/(1.01-t) - 1) * blockSize * explScale * 0.5;
    let size = (t) * blockSize * explScale;
    size = max(size, blockSize);

    noFill();
    strokeWeight(2);
    stroke(255, 600*(1-t)*(1-t))

    rect(bx * blockStep + blockStep/2, by * blockStep + blockStep/2, size, size);
  }

  anim.frame++;
  if (anim.frame > totFrames) return false;

  return true;
}

function mousePressed() {
  anims.push({ frame: 0, bx: floor(mouseX/blockStep), by: floor(mouseY/blockStep) });
}