// ====================================
// ALGORITHM OF FATE
// CRT TERMINAL EDITION
// ====================================

const places = [
  "Forest",
  "Ocean",
  "Desert",
  "Mountain",
  "Garden",
  "Ruins",
  "Valley",
  "River"
];

const events = [
  "Love",
  "Loss",
  "Hope",
  "Fear",
  "Discovery",
  "Conflict",
  "Change",
  "Silence"
];

const outcomes = [
  "Wisdom",
  "Freedom",
  "Power",
  "Growth",
  "Destiny",
  "Balance",
  "Fortune",
  "Understanding"
];

// ====================================
// SERIAL
// ====================================

let port;
let reader;
let serialConnected = false;
let serialBuffer = "";

// ====================================
// SLOT MACHINE
// ====================================

let reel1;
let reel2;
let reel3;

let state = 0;

let connectButton;

let lastPressTime = 0;
const debounceTime = 300;

// CRT EFFECT

let crtBrightness = 255;

// ====================================

function setup() {

  createCanvas(windowWidth, windowHeight);

  textAlign(CENTER, CENTER);
  rectMode(CENTER);

  textFont("Courier New");

  resetMachine();

  connectButton = createButton("Connect Microbit");

  connectButton.position(20, 20);

  connectButton.mousePressed(connectSerial);
}

// ====================================

function draw() {

  background(0);

  crtBrightness = random(235, 255);

  updateReels();

  drawTitle();

  drawReel(width / 2 - 250, reel1);
  drawReel(width / 2, reel2);
  drawReel(width / 2 + 250, reel3);

  drawStatus();

  if (state === 4) {
    drawFortune();
  }
}

// ====================================

function updateReels() {

  if (frameCount % 4 !== 0) return;

  switch (state) {

    case 1:
      reel1 = random(places);
      reel2 = random(events);
      reel3 = random(outcomes);
      break;

    case 2:
      reel2 = random(events);
      reel3 = random(outcomes);
      break;

    case 3:
      reel3 = random(outcomes);
      break;
  }
}

// ====================================

function drawTitle() {

  terminalText(
    "FORTUNE-SLOTS_OS v1.0",
    width / 2,
    100,
    52
  );

  textSize(18);

  fill(0, crtBrightness, 0);

  text(
    "> DIGITAL SLOT MACHINE ENGINE ONLINE",
    width / 2,
    145
  );
}

// ====================================

function drawReel(x, word) {

  stroke(0, crtBrightness, 0);
  strokeWeight(4);

  fill(0);

  rect(
    x,
    height / 2,
    220,
    220,
    20
  );

  noStroke();

  fill(0, crtBrightness, 0);

  textSize(30);

  text(
    word,
    x,
    height / 2
  );
}

// ====================================

function drawStatus() {

  fill(0, crtBrightness, 0);

  textSize(22);

  if (!serialConnected) {

    text(
      "> CONNECT MICROBIT TO ORACLE",
      width / 2,
      height - 100
    );

    return;
  }

  if (state === 0) {

    text(
      "> INITIALIZE PROPHECY",
      width / 2,
      height - 100
    );
  }

  if (state === 1) {

    text(
      "> SELECTING LOCATION...",
      width / 2,
      height - 100
    );
  }

  if (state === 2) {

    text(
      "> SELECTING EVENT...",
      width / 2,
      height - 100
    );
  }

  if (state === 3) {

    text(
      "> SELECTING OUTCOME...",
      width / 2,
      height - 100
    );
  }
}

// ====================================

function drawFortune() {

  fill(0, crtBrightness, 0);

  textSize(30);

  text(
    reel1 + " • " +
    reel2 + " • " +
    reel3,
    width / 2,
    height - 220
  );

  textSize(22);

  text(
    generateFortune(),
    width / 2,
    height - 150,
    width * 0.7
  );

  textSize(16);

  text(
    "> PRESS BUTTON TO SPIN AGAIN",
    width / 2,
    height - 80
  );
}

// ====================================

function generateFortune() {

  return (
    "Within the " +
    reel1.toLowerCase() +
    ", through " +
    reel2.toLowerCase() +
    ", you will discover " +
    reel3.toLowerCase() +
    "."
  );
}

// ====================================

function advanceMachine() {

  let now = millis();

  if (now - lastPressTime < debounceTime) {
    return;
  }

  lastPressTime = now;

  if (state < 4) {

    state++;

  } else {

    resetMachine();

    state = 1;
  }
}

// ====================================

function resetMachine() {

  reel1 = random(places);
  reel2 = random(events);
  reel3 = random(outcomes);

  state = 0;
}

// ====================================

async function connectSerial() {

  try {

    port = await navigator.serial.requestPort();

    await port.open({
      baudRate: 115200
    });

    serialConnected = true;

    connectButton.hide();

    startReading();

  }

  catch (err) {

    console.error(err);

  }
}

// ====================================

async function startReading() {

  try {

    const decoder = new TextDecoderStream();

    port.readable.pipeTo(
      decoder.writable
    );

    reader =
      decoder.readable.getReader();

    while (true) {

      const { value, done } =
        await reader.read();

      if (done) {
        break;
      }

      if (value) {

        serialBuffer += value;

        let lines =
          serialBuffer.split("\n");

        serialBuffer =
          lines.pop();

        for (let line of lines) {

          line = line.trim();

          console.log(
            "Received:",
            line
          );

          if (line === "PRESS") {

            advanceMachine();
          }
        }
      }
    }
  }

  catch (err) {

    console.error(
      "Serial Error:",
      err
    );
  }
}

// ====================================

function terminalText(str, x, y, size) {

  textSize(size);

  fill(0, 60, 0);
  text(str, x + 4, y + 4);

  fill(0, 120, 0);
  text(str, x + 2, y + 2);

  fill(0, crtBrightness, 0);
  text(str, x, y);
}

// ====================================

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );
}