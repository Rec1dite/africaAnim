//---------- Params ----------//
const canvasSize = 800;   // Canvas width/height in pixels
const gridCount = 50;     // No. of blocks across the whole canvas
const spacing = 3;        // Spacing between block outlines
const weight = 0.1;       // Block outline stroke weight
const alpha = 150;        // Fill alpha for each block
const alphaCutoff = 230;  // Point at which a block is 'filled'
const gravity = 0.4;      // Particle gravity

const dayStart = 6;       // Hour day starts
const dayEnd = 18;        // Hour day ends

const tournSize = 50;     // Sample size when picking the next pixel

let quickPlay = false;

//---------- Setup ----------//
const blockStep = canvasSize / gridCount;
const blockSize = blockStep - spacing;

anims = [];
particles = [];

let mask, outline;
const blockIndices = [];

function preload() {
  mask = loadImage('./africa.jpg');
  outline = loadImage('./outline.png');
}

let map;

function setup() {
  mask.resize(gridCount, gridCount);
  mask.loadPixels();
  outline.resize(canvasSize, canvasSize);

  createCanvas(canvasSize, canvasSize);
  map = createGraphics(gridCount, gridCount);
  noSmooth();
  blendMode(ADD);

  let numBlocks = 0;
  map.noStroke();
  map.fill(255);
  for (let x = 0; x < gridCount; x++) {
    for (let y = 0; y < gridCount; y++) {
      if (mask.get(x, y)[0] == 255) {
        // map.fill(255, random(0, 255));
        // map.fill(255, 5);
        // map.rect(x, y, 1, 1);
        blockIndices.push(x + y*gridCount);
        numBlocks++;
      }
    }
  }

  console.log("TOTAL NO. OF BLOCKS:", numBlocks);

  rectMode(CORNER);
  textAlign(LEFT, TOP);
}

function draw() {
  clear();

  image(map, 0, 0, canvasSize, canvasSize);
  image(outline, 0, 0);

  //---------- Get time ----------//
  const date = new Date();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  //---------- Draw grid ----------//
  noFill();
  stroke(255);
  // noStroke();
  strokeWeight(weight);
  rectMode(CORNER);
  for (let x = 0; x < gridCount; x++) {
    for (let y = 0; y < gridCount; y++) {
      // fill(255, alpha);
      if (mask.pixels[(x + y*gridCount) * 4] == 255) {
        rect(x * blockStep + spacing/2, y * blockStep + spacing/2, blockSize, blockSize);
      }
    }
  }

  //---------- Play animations ---------//
  anims = anims.filter(execAnim);

  //---------- Render particles ---------//
  noStroke();
  fill(255);
  particles = particles.filter(execParticle);

  // Export canvas to file
  // if (frameCount == 10) {
  //   saveCanvas('output', 'png');
  //   noLoop();
  // }

  if (frameCount % (quickPlay ? 1 : 20) == 0) {
    let pt = null, ptVal = 1000000;

    for (let i = 0; i < tournSize && blockIndices.length > 0; i++) {
      const { newPt, newPtVal, idx } = sampleRandomBlock();

      if (newPtVal >= alphaCutoff) {
        blockIndices.splice(idx, 1);
        continue;
      }

      if (newPtVal < ptVal) { pt = newPt; ptVal = newPtVal; }
    }

    if (pt != null) {
      const px = pt % gridCount, py = floor(pt / gridCount);
      addBlock(px, py);
    }
  }

  //---------- Debug ---------//
  // noStroke();
  // fill(255, 0, 0);
  // rect(random(0, 40), random(0, 40), 10, 10);
  // text(hour + ":" + minute + ":" + second + ":" + round(frameRate()), 1, 2);
}

//---------- Particle System ----------//
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

//---------- Animation System ----------//
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
  if (!quickPlay && frame < part1End) {
    const t = frame/(part1End-1);
    let size = (1 - t);
    size *= blockSize * implScale;
    size = max(size, blockSize);

    noStroke();
    fill(255, implAlpha*pow(0.9, 1-t));

    rect(bx * blockStep + blockStep/2, by * blockStep + blockStep/2, size, size);

  }
  // Particles + Draw pixel
  else if (frame == part2Start) {
    if (!quickPlay) spawnParticles(20, bx, by);
    map.fill(255, alpha);
    map.rect(bx, by, 1, 1);
  }
  // Explosion
  else if (!quickPlay && frame > part2Start) {
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

let totAdded = 0;
function addBlock(bx, by) {
  anims.push({ frame: 0, bx, by });
  totAdded++;
  console.log(totAdded);
}

function sampleRandomBlock() {
  const idx = floor(random(0, blockIndices.length));
  const newPt = blockIndices[idx];
  const px = newPt % gridCount, py = floor(newPt / gridCount);
  const newPtVal = map.get(px, py)[3];
  return { newPt, newPtVal, idx };
}


function mousePressed() {
  addBlock(floor(mouseX/blockStep), floor(mouseY/blockStep))
}

function keyPressed() {
  if (key == ' ') quickPlay = !quickPlay;
}