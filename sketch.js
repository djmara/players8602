// V26ZH-P5JS Responsive FINAL — for p5.js WEB EDITOR

let players = [];
let table;

let wcYears = [1986, 1990, 1994, 1998, 2002];
let currentYearIndex = 0;
let currentYear = 1986;

let yearSwitchMillis = 10000;
let lastSwitchMillis = 0;

let globalRotation = 0;
let rotationSpeed = 0.002;

let globalPulse = 0;
let pulsePhase = 0;

let yearColors = [];

let gridColor;

let marginRatio = 0.04;
let margin = 80;

function preload() {
  table = loadTable('assets/players.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('IBM Plex Mono');
  frameRate(60);

  gridColor = color(47);

  yearColors = [
    color(255, 100, 100),
    color(255, 180, 50),
    color(100, 200, 100),
    color(100, 150, 255),
    color(180, 100, 255)
  ];

  currentYear = wcYears[currentYearIndex];
  loadPlayers();
}

function draw() {
  background(0, 40);

  margin = windowWidth * marginRatio;

  if (millis() - lastSwitchMillis > yearSwitchMillis) {
    currentYearIndex = (currentYearIndex + 1) % wcYears.length;
    currentYear = wcYears[currentYearIndex];
    loadPlayers();
    lastSwitchMillis = millis();
  }

  let speedMod = 0.001 + 0.0015 * sin(frameCount * 0.01);
  globalRotation += speedMod;

  pulsePhase += 0.02;
  globalPulse = 1.0 + 0.04 * sin(pulsePhase);

  let centerY = height / 2;
  let scaleFactor = min(width, height) / 1080.0;

  push();
  translate(width / 2, centerY);
  scale(globalPulse * scaleFactor);
  rotate(globalRotation);

  drawRadialGrid();

  let angleStep = TWO_PI / players.length;
  let hovered = null;

  for (let i = 0; i < players.length; i++) {
    let p = players[i];
    let angle = i * angleStep;
    p.angle = angle;

    let r = 120 + p.ringIndex * 40;
    let pulseFreq = 0.02 + 0.01 * (i % 5);
    let pulseAmp = 15 + (i % 10);
    let lenBase = map(p.birthYear, 1940, 2002, 60, 200);
    let pulse = pulseAmp * sin(frameCount * pulseFreq + i * 0.1);
    let len = lenBase + pulse;

    let x1 = cos(angle) * r;
    let y1 = sin(angle) * r;
    let x2 = cos(angle) * (r + len);
    let y2 = sin(angle) * (r + len);

    let localMouseX = (mouseX - width/2) * cos(-globalRotation) - (mouseY - centerY) * sin(-globalRotation);
    let localMouseY = (mouseX - width/2) * sin(-globalRotation) + (mouseY - centerY) * cos(-globalRotation);

    let dx = x2 - x1;
    let dy = y2 - y1;
    let lenSq = dx * dx + dy * dy;

    let t = ((localMouseX - x1) * dx + (localMouseY - y1) * dy) / lenSq;
    t = constrain(t, 0, 1);

    let projX = x1 + t * dx;
    let projY = y1 + t * dy;

    let d = dist(localMouseX, localMouseY, projX, projY);
    if (d < 8) {
      hovered = p;
    }

    let extraLen = 0;
    if (p === hovered) {
      extraLen = 80;
      strokeWeight(1.8);
      stroke(yearColors[p.ringIndex]);
    } else {
      strokeWeight(0.4);
      stroke(yearColors[p.ringIndex], 180);
    }

    line(x1, y1, x2 + cos(angle) * extraLen, y2 + sin(angle) * extraLen);
  }

  drawRadialGridSectors();
  pop();

  drawLegend();

  if (hovered != null) {
    let mx = mouseX;
    let my = mouseY;

    let labelText = hovered.label;
    textFont('IBM Plex Mono');
    let tw = textWidth(labelText);
    let boxW = tw + 20;
    let boxH = 22;

    let offsetX = 15;
    let offsetY = 15;

    fill(0, 220);
    noStroke();
    rect(mx + offsetX, my + offsetY, boxW, boxH);

    fill(255);
    textAlign(LEFT, CENTER);
    text(labelText, mx + offsetX + 10, my + offsetY + boxH / 2);
  }
}

function drawRadialGrid() {
  let numCircles = 9;
  let maxR = 500;

  noFill();

  for (let i = 0; i <= numCircles; i++) {
    let r = map(i, 0, numCircles, 0, maxR);
    let alpha = map(r, 0, maxR, 255, 0);
    stroke(gridColor, alpha);
    strokeWeight(0.4);
    ellipse(0, 0, r * 2, r * 2);
  }
}

function drawRadialGridSectors() {
  let numRays = 64;
  let maxR = 500;

  for (let i = 0; i < numRays; i++) {
    let angle = map(i, 0, numRays, 0, TWO_PI);
    let x1 = 0;
    let y1 = 0;
    let x2 = cos(angle) * maxR;
    let y2 = sin(angle) * maxR;

    stroke(gridColor, 180);
    strokeWeight(0.4);
    line(x1, y1, x2, y2);
  }
}

function drawLegend() {
  let lx = margin;
  let ly = margin;

  fill(255);
  textAlign(LEFT);
  textSize(17);
  text("1986–2002", lx, ly);
  text("World Cup", lx, ly + 20);
  text("Players", lx, ly + 40);

  textSize(12);
  for (let i = 0; i < wcYears.length; i++) {
    let by = ly + 70 + i * 22;

    stroke(yearColors[i]);
    strokeWeight(2);
    line(lx, by, lx + 40, by);

    fill(255);
    noStroke();
    textAlign(LEFT, CENTER);
    text(wcYears[i], lx + 50, by);
  }
}

function loadPlayers() {
  players = [];

  for (let r = 0; r < table.getRowCount(); r++) {
    let tournaments = table.getString(r, 'list_tournaments');
    let birth = table.getString(r, 'birth_date');

    let given = table.getString(r, 'given_name');
    let family = table.getString(r, 'family_name');

    if (!given || !family || given.trim() === '' || family.trim() === '') continue;

    if (tournaments && birth && birth.length >= 4) {
      let birthYear = int(birth.substring(0, 4));
      let tourYears = tournaments.split(',');

      for (let ty of tourYears) {
        let tYear = int(ty.trim());
        for (let i = 0; i < wcYears.length; i++) {
          if (tYear === wcYears[i]) {
            let p = {
              ringIndex: i,
              birthYear: birthYear,
              label: given + ' ' + family,
              angle: 0
            };
            players.push(p);
          }
        }
      }
    }
  }

  print('Players loaded: ' + players.length);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
