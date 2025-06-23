let playersData = [];
let filteredPlayers = [];
let marks = [];

let wcYears = [1986, 1990, 1994, 1998, 2002];
let currentYearIndex = 0;
let currentYear = 1986;

let yearSwitchMillis = 15000;
let lastSwitchMillis = 0;

let globalRotation = 0;

let yearColors = [];
let gridColor;

function preload() {
  playersData = loadJSON('players.json');
}

function setup() {
  createCanvas(1920, 1080);
  frameRate(60);
  textFont('monospace');
  gridColor = color('#2f2f2f');

  yearColors = [
    color(255, 100, 100),
    color(255, 180, 50),
    color(100, 200, 100),
    color(100, 150, 255),
    color(180, 100, 255)
  ];

  // FILTER: only players from 1986–2002
  filteredPlayers = playersData.filter(p => 
    p.list_tournaments.includes("1986") ||
    p.list_tournaments.includes("1990") ||
    p.list_tournaments.includes("1994") ||
    p.list_tournaments.includes("1998") ||
    p.list_tournaments.includes("2002")
  );

  console.log("Filtered players:", filteredPlayers.length);

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

  let pulseGlobal = 1.0 + 0.05 * sin(frameCount * 0.01);

  push();
  translate(width/2, height/2);
  scale(pulseGlobal);
  rotate(globalRotation);
  globalRotation += 0.0015 + 0.001 * sin(frameCount * 0.005);

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

    let localMouse = createVector(mouseX - width/2, mouseY - height/2);
    localMouse.rotate(-globalRotation);

    let d = dist(localMouse.x, localMouse.y, x2, y2);
    if (d < 10) {
      hovered = pm;
    }

    let extraLen = 0;
    if (pm === hovered) {
      extraLen = 80;
      strokeWeight(1.8);
      stroke(yearColors[pm.ringIndex]);
    } else {
      strokeWeight(0.4);
      stroke(yearColors[pm.ringIndex], 180);
    }

    line(x1, y1, x2 + cos(angle) * extraLen, y2 + sin(angle) * extraLen);
  }

  drawRadialGridSectors();
  pop();

  drawLegend();

  // Player name on hover
  if (hovered !== null) {
    let label = `${hovered.label} (${hovered.birthYear})`;
    fill(0, 220);
    noStroke();
    rect(mouseX + 12, mouseY + 12, textWidth(label) + 20, 24);
    fill(255);
    textAlign(LEFT, CENTER);
    text(label, mouseX + 20, mouseY + 24);
  }
}

function drawRadialGrid() {
  let numCircles = 9;
  let maxR = 500;
  noFill();
  for (let i = 0; i <= numCircles; i++) {
    let r = map(i, 0, numCircles, 0, maxR);
    let alpha = map(r, 0, maxR, 255, 0);
    stroke(gridColor.levels[0], alpha);
    strokeWeight(0.4);
    ellipse(0, 0, r * 2, r * 2);
  }
}

function drawRadialGridSectors() {
  let numRays = 64;
  let maxR = 500;
  for (let i = 0; i < numRays; i++) {
    let angle = map(i, 0, numRays, 0, TWO_PI);
    let x2 = cos(angle) * maxR;
    let y2 = sin(angle) * maxR;
    stroke(gridColor.levels[0], 180);
    strokeWeight(0.4);
    line(0, 0, x2, y2);
  }
}

function drawLegend() {
  let lx = 40;
  let ly = 100;

  fill(255);
  textSize(17);
  textAlign(LEFT);
  text("1986–2002", lx, ly - 28);
  text("World Cup", lx, ly - 10);
  text("Players", lx, ly + 8);

  textSize(12);

  for (let i = 0; i < wcYears.length; i++) {
    let by = ly + 30 + i * 22;

    stroke(yearColors[i]);
    strokeWeight(1.4);
    line(lx, by, lx + 24, by);

    fill(255);
    noStroke();
    textAlign(LEFT, CENTER);
    text(wcYears[i], lx + 32, by);
  }
}

function loadMarks() {
  marks = [];

  for (let i = 0; i < filteredPlayers.length; i++) {
    let player = filteredPlayers[i];
    let tournaments = player.list_tournaments;
    let birthYear = int(player.birth_date.substring(0, 4));
    let name = player.given_name + " " + player.family_name;

    if (!tournaments || !birthYear || name === "not applicable") continue;

    let tourYears = tournaments.toString().split(", ");

    for (let j = 0; j < tourYears.length; j++) {
      let tYear = int(tourYears[j].trim());
      for (let k = 0; k < wcYears.length; k++) {
        if (tYear === wcYears[k]) {
          let pm = {
            ringIndex: k,
            birthYear: birthYear,
            label: name,
            angle: 0
          };
          marks.push(pm);
        }
      }
    }
  }

  print("Marks loaded:", marks.length);
}
