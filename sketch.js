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

function preload() {
  playersData = loadJSON('players.json');
}

function setup() {
  createCanvas(1920, 1080);
  gridColor = color(47);
  textFont('monospace', 14);

  yearColors = [
    color(255, 100, 100),
    color(255, 180, 50),
    color(100, 200, 100),
    color(100, 150, 255),
    color(180, 100, 255)
  ];

  frameRate(60);
  lastSwitchMillis = millis();
  loadMarks();
}

function draw() {
  background(0);

  if (millis() - lastSwitchMillis > yearSwitchMillis) {
    currentYearIndex = (currentYearIndex + 1) % wcYears.length;
    currentYear = wcYears[currentYearIndex];
    loadMarks();
    lastSwitchMillis = millis();
  }

  globalRotation += rotationSpeed;

  translate(width/2, height/2);
  rotate(globalRotation);

  drawRadialGrid();

  let angleStep = TWO_PI / marks.length;

  for (let i = 0; i < marks.length; i++) {
    let pm = marks[i];
    let angle = i * angleStep;
    pm.angle = angle;

    let r = 120 + pm.ringIndex * 40;
    let pulse = 10 * sin(frameCount * 0.03 + i * 0.1);
    let len = map(pm.birthYear, 1940, 2002, 60, 200) + pulse;

    let x1 = cos(angle) * r;
    let y1 = sin(angle) * r;
    let x2 = cos(angle) * (r + len);
    let y2 = sin(angle) * (r + len);

    strokeWeight(0.4);
    stroke(yearColors[pm.ringIndex], 200);
    line(x1, y1, x2, y2);
  }

  drawLegend();
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
    ellipse(0, 0, r*2, r*2);
  }

  let numRays = 64;
  for (let i = 0; i < numRays; i++) {
    let angle = map(i, 0, numRays, 0, TWO_PI);
    let x2 = cos(angle) * maxR;
    let y2 = sin(angle) * maxR;
    stroke(gridColor, 180);
    strokeWeight(0.4);
    line(0, 0, x2, y2);
  }
}

function drawLegend() {
  resetMatrix();
  textAlign(LEFT);
  fill(255);
  textSize(17);
  let lx = 40;
  let ly = 60;
  text("1986–2002", lx, ly);
  text("World Cup", lx, ly + 20);
  text("Players", lx, ly + 40);

  for (let i = 0; i < wcYears.length; i++) {
    let by = ly + 70 + i * 22;
    stroke(yearColors[i]);
    strokeWeight(0.4);
    noFill();
    line(lx, by, lx + 20, by);
    noStroke();
    fill(255);
    textSize(14);
    text(wcYears[i], lx + 30, by + 5);
  }
}

function loadMarks() {
  marks = [];
  let raw = playersData;
  for (let i = 0; i < raw.length; i++) {
    let p = raw[i];
    let tournaments = p.list_tournaments;
    if (!Array.isArray(tournaments)) tournaments = [tournaments];
    if (p.birth_date && p.birth_date.length >= 4) {
      let birthYear = int(p.birth_date.substring(0, 4));
      for (let j = 0; j < tournaments.length; j++) {
        let tYear = int(tournaments[j]);
        for (let k = 0; k < wcYears.length; k++) {
          if (tYear === wcYears[k]) {
            marks.push({
              ringIndex: k,
              birthYear: birthYear,
              angle: 0
            });
          }
        }
      }
    }
  }
}
