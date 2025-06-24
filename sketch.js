// Converted from Processing to p5.js
// Original: V26ZD FULL — FRAME EXPORT READY — 1986–2002 radial
// Updated with 1920×1080 canvas size

let playersData = null;
let marks = [];
let wcYears = [1986, 1990, 1994, 1998, 2002];
let currentYearIndex = 0;
let currentYear = 1986;
let yearSwitchMillis = 10000;
let lastSwitchMillis = 0;
let globalRotation = 0;
let rotationSpeed = 0.002;
let yearColors = [];
let gridColor;

// Responsive scaling variables
let canvasWidth, canvasHeight;
let scaleFactor;

// Load player data asynchronously
async function loadPlayerData() {
    try {
        const response = await fetch('players.csv');
        const csvText = await response.text();
        
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        
        playersData = [];
        const targetYears = [1986, 1990, 1994, 1998, 2002];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = parseCSVLine(line);
            if (values.length < headers.length) continue;
            
            const player = {};
            headers.forEach((header, index) => {
                player[header.trim()] = values[index];
            });
            
            if (player.given_name && player.family_name && player.birth_date && player.list_tournaments) {
                if (player.given_name !== "not applicable" && player.family_name !== "not applicable") {
                    const playerYears = player.list_tournaments.toString().split(/[, ]+/)
                        .map(y => parseInt(y.trim()))
                        .filter(y => !isNaN(y) && targetYears.includes(y));
                    
                    if (playerYears.length > 0) {
                        playersData.push({
                            given_name: player.given_name,
                            family_name: player.family_name,
                            birth_date: player.birth_date,
                            list_tournaments: playerYears.join(", ")
                        });
                    }
                }
            }
        }
        
        console.log('Loaded', playersData.length, 'players');
        
    } catch (error) {
        console.error('Could not load CSV file, using embedded data instead');
        useEmbeddedData();
    }
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

function useEmbeddedData() {
    playersData = [
        {given_name: "Roberto", family_name: "Baggio", birth_date: "1967-02-18", list_tournaments: "1990, 1994, 1998"},
        {given_name: "Franco", family_name: "Baresi", birth_date: "1960-05-08", list_tournaments: "1986, 1990, 1994"},
        {given_name: "Gabriel", family_name: "Batistuta", birth_date: "1969-02-01", list_tournaments: "1994, 1998, 2002"},
        // Add more sample data as needed
    ];
}

function setup() {
    // Calculate responsive dimensions based on new 1920x1080 size (80% smaller)
    let baseWidth = 1920 * 0.8;  // 1536px
    let baseHeight = 1080 * 0.8; // 864px
    
    // Make it responsive to screen size
    let maxWidth = min(windowWidth - 40, baseWidth);
    let maxHeight = min(windowHeight - 100, baseHeight);
    
    // Maintain aspect ratio
    let aspectRatio = baseHeight / baseWidth;
    
    if (maxHeight > maxWidth * aspectRatio) {
        canvasWidth = maxWidth;
        canvasHeight = maxWidth * aspectRatio;
    } else {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight / aspectRatio;
    }
    
    // Calculate scale factor for all elements
    scaleFactor = canvasWidth / baseWidth;
    
    createCanvas(canvasWidth, canvasHeight);
    textFont('Courier New'); // Web-safe font instead of loading TTF
    frameRate(60);

    // Initialize colors (same as Processing version)
    yearColors[0] = color(255, 100, 100);
    yearColors[1] = color(255, 180, 50);
    yearColors[2] = color(100, 200, 100);
    yearColors[3] = color(100, 150, 255);
    yearColors[4] = color(180, 100, 255);
    
    gridColor = color(47, 47, 47); // #2f2f2f

    currentYear = wcYears[currentYearIndex];
    
    // Load data and start visualization
    loadPlayerData().then(() => {
        loadMarks();
    });
}

function windowResized() {
    // Recalculate dimensions when window is resized
    let baseWidth = 1920 * 0.8;
    let baseHeight = 1080 * 0.8;
    
    let maxWidth = min(windowWidth - 40, baseWidth);
    let maxHeight = min(windowHeight - 100, baseHeight);
    
    let aspectRatio = baseHeight / baseWidth;
    
    if (maxHeight > maxWidth * aspectRatio) {
        canvasWidth = maxWidth;
        canvasHeight = maxWidth * aspectRatio;
    } else {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight / aspectRatio;
    }
    
    scaleFactor = canvasWidth / baseWidth;
    resizeCanvas(canvasWidth, canvasHeight);
}

function draw() {
    // Only draw if data is loaded
    if (!playersData) {
        background(0);
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(16 * scaleFactor);
        text("Loading...", width/2, height/2);
        return;
    }

    // Fade background (same as Processing)
    fill(0, 40);
    rect(0, 0, width, height);

    // Year switching logic (same as Processing)
    if (millis() - lastSwitchMillis > yearSwitchMillis) {
        currentYearIndex = (currentYearIndex + 1) % wcYears.length;
        currentYear = wcYears[currentYearIndex];
        loadMarks();
        lastSwitchMillis = millis();
    }

    // Dynamic rotation with pulse (same as Processing)
    let speedMod = 0.001 + 0.0015 * sin(frameCount * 0.01);
    globalRotation += speedMod;

    let centerY = height / 2;
    translate(width/2, centerY);
    rotate(globalRotation);

    drawRadialGrid();

    if (marks.length > 0) {
        let angleStep = TWO_PI / marks.length;
        let hovered = null;

        // Draw player marks with scaled dimensions (same logic as Processing)
        for (let i = 0; i < marks.length; i++) {
            let pm = marks[i];
            let angle = i * angleStep;
            pm.angle = angle;

            let r = (120 + pm.ringIndex * 40) * scaleFactor;
            let pulseFreq = 0.02 + 0.01 * (i % 5);
            let pulseAmp = (15 + (i % 10)) * scaleFactor;
            let lenBase = map(pm.birthYear, 1940, 2002, 60 * scaleFactor, 200 * scaleFactor);
            let pulse = pulseAmp * sin(frameCount * pulseFreq + i * 0.1);
            let len = lenBase + pulse;

            let x1 = cos(angle) * r;
            let y1 = sin(angle) * r;
            let x2 = cos(angle) * (r + len);
            let y2 = sin(angle) * (r + len);

            // Mouse interaction (converted from Processing)
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
            if (d < 8 * scaleFactor) {
                hovered = pm;
            }

            // Draw line with hover effect (same as Processing)
            let extraLen = 0;
            if (pm === hovered) {
                extraLen = 80 * scaleFactor;
                strokeWeight(1.8 * scaleFactor);
                stroke(yearColors[pm.ringIndex]); // 255 alpha by default
            } else {
                strokeWeight(0.4 * scaleFactor);
                stroke(red(yearColors[pm.ringIndex]), green(yearColors[pm.ringIndex]), blue(yearColors[pm.ringIndex]), 180);
            }

            line(x1, y1, x2 + cos(angle) * extraLen, y2 + sin(angle) * extraLen);
        }

        drawRadialGridSectors();

        // Reset transformation matrix
        resetMatrix();

        drawLegend();

        // Hover label with scaled text (same as Processing)
        if (hovered != null) {
            let mx = mouseX;
            let my = mouseY;

            let labelText = hovered.label;
            textSize(12 * scaleFactor);
            let tw = textWidth(labelText);
            let boxW = tw + (20 * scaleFactor);
            let boxH = 22 * scaleFactor;

            let offsetX = 15 * scaleFactor;
            let offsetY = 15 * scaleFactor;

            fill(0, 220);
            noStroke();
            rect(mx + offsetX, my + offsetY, boxW, boxH);

            fill(255);
            textAlign(LEFT, CENTER);
            text(labelText, mx + offsetX + (10 * scaleFactor), my + offsetY + boxH/2);
        }
    }

    // Note: saveFrame() removed - causes errors in browsers
}

function drawRadialGrid() {
    let numCircles = 9;
    let maxR = 500;

    noFill();

    for (let i = 0; i <= numCircles; i++) {
        let r = map(i, 0, numCircles, 0, maxR);
        let alpha = map(r, 0, maxR, 255, 0);
        stroke(red(gridColor), green(gridColor), blue(gridColor), alpha);
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

        stroke(red(gridColor), green(gridColor), blue(gridColor), 180);
        strokeWeight(0.4);
        line(x1, y1, x2, y2);
    }
}

function drawLegend() {
    let lx = 40;
    let ly = 80;

    fill(255);
    textAlign(LEFT);
    textSize(12);
    text("1986–2002", lx, ly - 24);
    text("World Cup", lx, ly - 10);
    text("players", lx, ly + 4);

    for (let i = 0; i < wcYears.length; i++) {
        let by = ly + 30 + i * 22;

        stroke(yearColors[i]);
        strokeWeight(0.4);
        noFill();
        rect(lx, by, 14, 14);

        fill(255);
        noStroke();
        textAlign(LEFT, CENTER);
        text(wcYears[i], lx + 20, by + 7);
    }
}

function loadMarks() {
    if (!playersData) return;
    
    marks = [];

    for (let row of playersData) {
        let tournaments = row.list_tournaments;
        let birth = row.birth_date;
        let given = row.given_name;
        let family = row.family_name;

        if (!given || given === "not applicable" || given.trim().length < 1) continue;
        if (!family || family === "not applicable" || family.trim().length < 1) continue;

        if (tournaments && birth && birth.length >= 4) {
            let birthYear = parseInt(birth.substring(0, 4));
            let tourYears = tournaments.split(/[, ]+/);

            for (let ty of tourYears) {
                let tYear = parseInt(ty.trim());

                for (let i = 0; i < wcYears.length; i++) {
                    if (tYear === wcYears[i]) {
                        let pm = new PlayerMark(i, birthYear, given + " " + family);
                        marks.push(pm);
                    }
                }
            }
        }
    }

    console.log("Marks loaded for year " + currentYear + ":", marks.length);
}

class PlayerMark {
    constructor(ri, by, l) {
        this.ringIndex = ri;
        this.birthYear = by;
        this.label = l;
        this.angle = 0;
    }
}
