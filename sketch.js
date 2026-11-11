// Each pack keeps the same place, event, and outcome reel categories.
const wordPacks = {
  Nature: [
    ["Forest", "Ocean", "Desert", "Mountain", "Garden", "Ruins", "Valley", "River"],
    ["Love", "Loss", "Hope", "Fear", "Discovery", "Conflict", "Change", "Silence"],
    ["Wisdom", "Freedom", "Power", "Growth", "Destiny", "Balance", "Fortune", "Understanding"]
  ],
  Emotions: [
    ["Heart", "Memory", "Dream", "Home", "Threshold", "Garden", "Storm", "Horizon"],
    ["Joy", "Grief", "Longing", "Fear", "Forgiveness", "Surprise", "Courage", "Acceptance"],
    ["Healing", "Connection", "Clarity", "Peace", "Renewal", "Trust", "Growth", "Hope"]
  ],
  Space: [
    ["Moon", "Mars", "Nebula", "Orbit", "Station", "Asteroid", "Galaxy", "Wormhole"],
    ["Eclipse", "Signal", "Collision", "Discovery", "Silence", "Launch", "Anomaly", "Encounter"],
    ["New World", "Escape", "Alliance", "Knowledge", "Rebirth", "Destiny", "Freedom", "Homecoming"]
  ],
  Mythology: [
    ["Olympus", "Asgard", "Underworld", "Labyrinth", "Avalon", "Atlantis", "Mount Ida", "Oracle"],
    ["Quest", "Betrayal", "Prophecy", "Trial", "War", "Transformation", "Sacrifice", "Reunion"],
    ["Wisdom", "Immortality", "Exile", "Victory", "Balance", "Legacy", "Redemption", "Crown"]
  ]
};

const model = "qwen3:8b";
const ollamaUrl = "http://127.0.0.1:11434/api/chat";

let selectedPack = "Nature";
let words = [];
let stage = 0;
let connectionMessage = "CONNECT MICROBIT TO ORACLE";
let serialBuffer = "";
let lastPressTime = 0;
let fortune = "";
let explanation = "";
let aiStatus = "CONNECT MICROBIT TO BEGIN";
let fortuneController;
let connectButton;
let packSelect;
let muteButton;
let audioContext;
let muted = false;
let crtBrightness = 255;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Courier New");
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  resetMachine();

  connectButton = createButton("Connect Microbit");
  connectButton.position(20, 20);
  connectButton.class("control");
  connectButton.mousePressed(connectSerial);

  const controls = createDiv();
  controls.class("controls");

  packSelect = createSelect();
  packSelect.class("control");
  Object.keys(wordPacks).forEach(pack => packSelect.option(pack));
  packSelect.selected(selectedPack);
  packSelect.attribute("aria-label", "Choose a word pack");
  packSelect.parent(controls);
  packSelect.changed(changeWordPack);

  const spinButton = createButton("Spin");
  spinButton.class("control");
  spinButton.parent(controls);
  spinButton.mousePressed(advanceMachine);

  muteButton = createButton("Sound: On");
  muteButton.class("control");
  muteButton.parent(controls);
  muteButton.mousePressed(toggleMute);
}

function draw() {
  background(0);
  crtBrightness = random(235, 255);

  spinReels();
  drawTitle();
  words.forEach((word, index) => drawReel(index, word));

  if (stage === 4) {
    drawFortune();
  } else {
    drawStatus();
  }
}

// Each press stops one more reel. The final stop asks the local model.
function advanceMachine() {
  if (millis() - lastPressTime < 300) return;
  lastPressTime = millis();
  unlockAudio();

  if (stage === 4) {
    if (fortuneController) fortuneController.abort();
    resetMachine();
    stage = 1;
    return;
  }

  stage++;
  if (stage >= 2 && stage <= 4) playStopSound(stage - 2);
  if (stage === 4) generateFortune();
}

function spinReels() {
  if (frameCount % 4 !== 0) return;

  const groups = wordPacks[selectedPack];
  for (let index = max(0, stage - 1); index < groups.length; index++) {
    const nextWord = random(groups[index]);
    if (nextWord !== words[index]) {
      words[index] = nextWord;
      playClickSound(index);
    }
  }
}

function resetMachine() {
  words = wordPacks[selectedPack].map(group => random(group));
  fortune = "";
  explanation = "";
  aiStatus = "PRESS THE MICROBIT TO SPIN";
  stage = 0;
}

function changeWordPack() {
  selectedPack = packSelect.value();
  if (fortuneController) fortuneController.abort();
  resetMachine();
}

function toggleMute() {
  muted = !muted;
  muteButton.html(muted ? "Sound: Off" : "Sound: On");
  if (!muted) unlockAudio();
}

function unlockAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") audioContext.resume();
}

function playTone(frequency, duration, type, volume) {
  if (muted || !audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playClickSound(reel) {
  playTone([520, 680, 860][reel], 0.035, "square", 0.035);
}

function playStopSound(reel) {
  playTone([260, 340, 430][reel], 0.12, "triangle", 0.08);
}

function drawTitle() {
  const titleY = width < 700 ? 155 : 100;
  terminalText("FORTUNE-SLOTS_OS v1.0", width / 2, titleY, 52);
  fill(0, crtBrightness, 0);
  textSize(18);
  text("> DIGITAL SLOT MACHINE ENGINE ONLINE", width / 2, titleY + 45);
}

function drawReel(index, word) {
  const gap = min(250, width / 3 - 24);
  const x = width / 2 + (index - 1) * gap;
  const size = min(220, gap - 12);

  stroke(0, crtBrightness, 0);
  strokeWeight(4);
  fill(0);
  rect(x, height / 2, size, size, 20);

  noStroke();
  fill(0, crtBrightness, 0);
  textSize(min(30, size / 7));
  text(word, x, height / 2, size - 16);
}

function drawStatus() {
  fill(0, crtBrightness, 0);
  textSize(22);
  const messages = [
    connectionMessage,
    "SELECTING LOCATION...",
    "SELECTING EVENT...",
    "SELECTING OUTCOME..."
  ];
  text("> " + messages[stage], width / 2, height - 90);
}

function drawFortune() {
  fill(0, crtBrightness, 0);
  textSize(min(30, width / 35));
  text(words.join(" • "), width / 2, height - 240, width * 0.9);

  textSize(min(22, width / 45));
  text(fortune || fallbackFortune(), width / 2, height - 185, width * 0.88);

  textSize(min(17, width / 55));
  text(explanation || fallbackExplanation(), width / 2, height - 125, width * 0.88);

  textSize(12);
  text("> " + aiStatus, width / 2, height - 55, width * 0.92);
}

function fallbackFortune() {
  return "Within the " + words[0].toLowerCase() +
    ", through " + words[1].toLowerCase() +
    ", you will discover " + words[2].toLowerCase() + ".";
}

function fallbackExplanation() {
  return "The place sets the scene, the event is the challenge, and the outcome is the lesson or change.";
}

// Ask Ollama for a fortune and a plain-language explanation in one response.
async function generateFortune() {
  const controller = new AbortController();
  fortuneController = controller;
  aiStatus = "LOCAL AI: WRITING YOUR FORTUNE AND EXPLANATION...";

  try {
    const response = await fetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        think: false,
        format: {
          type: "object",
          properties: {
            sentence: { type: "string" },
            explanation: { type: "string" }
          },
          required: ["sentence", "explanation"],
          additionalProperties: false
        },
        messages: [
          {
            role: "system",
            content: "Write a vivid, concise fortune. Explain its meaning in one simple sentence of at most 20 words. Return a JSON object with sentence and explanation."
          },
          {
            role: "user",
            content: "Use all three words exactly: " + words.join(", ") +
              ". The sentence must use all three naturally. Explain how the place, event, and outcome work together."
          }
        ],
        options: { temperature: 0.9, num_predict: 180 }
      })
    });

    if (!response.ok) {
      throw new Error("Ollama returned HTTP " + response.status);
    }

    const result = await response.json();
    const generated = JSON.parse(result.message.content);
    if (!generated.sentence || !generated.explanation) {
      throw new Error("The model did not return both a sentence and an explanation.");
    }

    fortune = generated.sentence;
    explanation = generated.explanation;
    aiStatus = "LOCAL AI: FORTUNE AND MEANING READY • PRESS TO SPIN AGAIN";
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("Local AI error:", error);
    aiStatus = error instanceof TypeError
        ? "AI CONNECTION FAILED: OPEN http://127.0.0.1:8000 AND CHECK OLLAMA"
      : "LOCAL AI ERROR: " + error.message;
  } finally {
    if (fortuneController === controller) fortuneController = undefined;
  }
}

async function connectSerial() {
  try {
    unlockAudio();
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    connectionMessage = "PRESS THE MICROBIT TO BEGIN";
    connectButton.hide();
    readSerial(port);
  } catch (error) {
    console.error("Could not connect to the micro:bit:", error);
    connectionMessage = "MICROBIT CONNECTION FAILED";
  }
}

// Read newline-delimited PRESS messages from the micro:bit.
async function readSerial(port) {
  try {
    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      serialBuffer += value;

      const lines = serialBuffer.split("\n");
      serialBuffer = lines.pop();
      for (const line of lines) {
        if (line.trim() === "PRESS") advanceMachine();
      }
    }
  } catch (error) {
    console.error("Serial read error:", error);
    connectionMessage = "MICROBIT CONNECTION LOST";
  }
}

function terminalText(message, x, y, size) {
  textSize(size);
  fill(0, 60, 0);
  text(message, x + 4, y + 4);
  fill(0, 120, 0);
  text(message, x + 2, y + 2);
  fill(0, crtBrightness, 0);
  text(message, x, y);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
