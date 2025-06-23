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
  font = 'monospace';
  textFont(font);
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

  let speedMod = 0.001 + 0.0015 * sin(frameCount * 0.01);
  globalRotation += speedMod;

  let centerY = height / 2;
  translate(width / 2, centerY);
  rotate(globalRotation);

  drawRadialGrid();

  let angleStep = TWO_PI / marks.length;
  let hovered = null;

  for (let i = 0; i < marks.length; i++) {
    let pm = marks[i];
    let angle = i * angleStep;
    pm.angle = angle;

    let r = 120 + pm.ringIndex * 40;
    let pulseFreq = 0.02 + 0.01 * (i % 5);
    let pulseAmp = 15 + (i % 10);
    let lenBase = map(pm.birthYear, 1940, 2002, 60, 200);
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
      hovered = pm;
    }

    let extraLen = (pm == hovered) ? 80 : 0;

    strokeWeight(pm == hovered ? 1.8 : 0.4);
    stroke(yearColors[pm.ringIndex], pm == hovered ? 255 : 180);
    line(x1, y1, x2 + cos(angle) * extraLen, y2 + sin(angle) * extraLen);
  }

  drawRadialGridSectors();
  
  resetMatrix();
  drawLegend();

  if (hovered != null) {
    let mx = mouseX;
    let my = mouseY;
    let labelText = hovered.label;
    textFont(font);
    let tw = textWidth(labelText);
    let boxW = tw + 20;
    let boxH = 22;

    fill(0, 220);
    noStroke();
    rect(mx + 15, my + 15, boxW, boxH);

    fill(255);
    textAlign(LEFT, CENTER);
    text(labelText, mx + 25, my + 15 + boxH/2);
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
  let lx = 40;
  let ly = 80;

  fill(255);
  textAlign(LEFT);
  textSize(17);
  text("1986–2002", lx, ly - 24);
  text("World Cup", lx, ly - 8);
  text("Players", lx, ly + 8);

  for (let i = 0; i < wcYears.length; i++) {
    let by = ly + 40 + i * 22;

    stroke(yearColors[i]);
    strokeWeight(1);
    noFill();
    line(lx, by, lx + 24, by);

    fill(255);
    noStroke();
    textAlign(LEFT, CENTER);
    text(wcYears[i], lx + 30, by);
  }
}

function loadMarks() {
  marks = [];

  for (let i = 0; i < playersData.length; i++) {
    let player = playersData[i];
    let birthYear = int(player.birth_date.substring(0, 4));
    let tournaments = player.list_tournaments;

    // If it's an array:
    if (Array.isArray(tournaments)) {
      for (let j = 0; j < tournaments.length; j++) {
        let tYear = int(tournaments[j]);
        let ringIdx = wcYears.indexOf(tYear);
        if (ringIdx >= 0) {
          let pm = new PlayerMark(ringIdx, birthYear, player.given_name + " " + player.family_name);
          marks.push(pm);
        }
      }
    }
    // If it's a string:
    else if (typeof tournaments === 'string') {
      let tYear = int(tournaments);
      let ringIdx = wcYears.indexOf(tYear);
      if (ringIdx >= 0) {
        let pm = new PlayerMark(ringIdx, birthYear, player.given_name + " " + player.family_name);
        marks.push(pm);
      }
    }
  }

  print("Marks loaded: " + marks.length);
}

class PlayerMark {
  constructor(ri, by, l) {
    this.ringIndex = ri;
    this.birthYear = by;
    this.label = l;
    this.angle = 0;
  }
}
