let playersData = [];
let marks = [];

let wcYears = [1986, 1990, 1994, 1998, 2002];
let currentYearIndex = 0;
let currentYear = 1986;

let yearSwitchMillis = 15000;
let lastSwitchMillis = 0;

let globalRotation = 0;
let rotationSpeed = 0.002;

let yearColors = [];
let gridColor;
let font;

let pulseFactor = 0;

function preload() {
  playersData = loadJSON('players.json');
}

function setup() {
  createCanvas(1920, 1080);
  gridColor = color('#2f2f2f');
  font = 'monospace';
  textFont(font);
  textSize(12);

  yearColors = [
    color(255, 100, 100),
    color(255, 180, 50),
    color(100, 200, 100),
    color(100, 150, 255),
    color(180, 100, 255)
  ];

  processMarks();
}

function draw() {
  background(0);

  // Switch year
  if (millis() - lastSwitchMillis > yearSwitchMillis) {
    currentYearIndex = (currentYearIndex + 1) % wcYears.length;
    currentYear = wcYears[currentYearIndex];
    processMarks();
    lastSwitchMillis = millis();
  }

  // Animate pulse
  pulseFactor = 0.95 + 0.05 * sin(frameCount * 0.03);

  // Animate rotation
  globalRotation += rotationSpeed;

  push();
  translate(width/2, height/2);
  rotate(globalRotation);
  scale(pulseFactor);

  drawRadialGrid();

  let angleStep = TWO_PI / marks.length;
  let hovered = null;

  for (let i = 0; i < marks.length; i++) {
    let pm = marks[i];
    let angle = i * angleStep;

    let r = 120 + pm.ringIndex * 40;
    let len = map(pm.birthYear, 1940, 2002, 60, 200);

    let x1 = cos(angle) * r;
    let y1 = sin(angle) * r;
    let x2 = cos(angle) * (r + len);
    let y2 = sin(angle) * (r + len);

    let localMX = (mouseX - width/2) * cos(-globalRotation) - (mouseY - height/2) * sin(-globalRotation);
    let localMY = (mouseX - width/2) * sin(-globalRotation) + (mouseY - height/2) * cos(-globalRotation);

    let dx = x2 - x1;
    let dy = y2 - y1;
    let lenSq = dx * dx + dy * dy;
    let t = constrain(((localMX - x1) * dx + (localMY - y1) * dy) / lenSq, 0, 1);

    let projX = x1 + t * dx;
    let projY = y1 + t * dy;
    let d = dist(localMX, localMY, projX, projY);

    if (d < 8) {
      hovered = pm;
    }

    if (hovered === pm) {
      strokeWeight(1.6);
      stroke(yearColors[pm.ringIndex]);
      line(x1, y1, x2 + cos(angle) * 60, y2 + sin(angle) * 60);
    } else {
      strokeWeight(0.4);
      stroke(yearColors[pm.ringIndex], 180);
      line(x1, y1, x2, y2);
    }
  }

  pop();

  // Legend
  drawLegend();

  // Player label
  if (hovered) {
    let label = `${hovered.label} (${hovered.birthYear})`;
    fill(0, 230);
    noStroke();
    rect(mouseX + 12, mouseY + 12, textWidth(label) + 18, 24, 5);
    fill(255);
    textAlign(LEFT, CENTER);
    text(label, mouseX + 20, mouseY + 24);
  }
}

function drawRadialGrid() {
  let rings = 9;
  let maxR = 500;
  noFill();
  stroke(gridColor);
  strokeWeight(0.4);

  for (let i = 0; i <= rings; i++) {
    let r = map(i, 0, rings, 0, maxR);
    ellipse(0, 0, r * 2, r * 2);
  }

  let sectors = 64;
  for (let i = 0; i < sectors; i++) {
    let a = map(i, 0, sectors, 0, TWO_PI);
    line(0, 0, cos(a) * maxR, sin(a) * maxR);
  }
}

function drawLegend() {
  let lx = 50;
  let ly = 50;

  textAlign(LEFT);
  textSize(17);
  fill(255);
  text("1986–2002", lx, ly);
  text("World Cup", lx, ly + 20);
  text("Players", lx, ly + 40);

  textSize(12);
  for (let i = 0; i < wcYears.length; i++) {
    let y = ly + 70 + i * 18;
    stroke(yearColors[i]);
    strokeWeight(1);
    line(lx, y, lx + 20, y);
    noStroke();
    fill(255);
    text(wcYears[i], lx + 30, y + 3);
  }
}

function processMarks() {
  marks = [];

  playersData.forEach(p => {
    let tournaments = p.list_tournaments;
    let birthYear = int(p.birth_date.substring(0, 4));

    if (typeof tournaments === "string") {
      wcYears.forEach((y, i) => {
        if (tournaments.includes(y.toString())) {
          marks.push({
            ringIndex: i,
            birthYear: birthYear,
            label: `${p.given_name} ${p.family_name}`
          });
        }
      });
    }
  });

  console.log(`Loaded marks: ${marks.length}`);
}
