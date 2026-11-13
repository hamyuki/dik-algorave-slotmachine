// All themes use one shared word pool across all three reels.
const wordChoices = [...new Set([
  "Forest", "Ocean", "Apartment", "Garage", "Garden", "Park", "Corridor", "River", "Mall",
  "Love", "Loss", "Hope", "Fear", "Death", "Conflict", "Change", "Silence",
  "Misfortune", "Freedom", "Riches", "Growth", "Destiny", "Balance", "Fortune", "Understanding",
  "Heart", "Memory", "Dream", "Home", "Tragedy", "Storm", "Horizon",
  "Joy", "Grief", "Longing", "Forgiveness", "Surprise", "Courage", "Acceptance",
  "Healing", "Connection", "Clarity", "Peace", "Renewal", "Trust",
  "Moon", "Anomaly", "Encounter", "Soulmate", "Escape", "Knowledge", "Rebirth", "Transformation", 
  "Sacrifice", "Reunion", "Immortality", "Exile", "Accident", "Legacy", "Redemption",
])];

// This project only needs a small local model for short fortune text and a simple explanation.
// qwen3:1.7b is a much lighter default than qwen3:8b while still fitting the task well.
const model = "qwen3:1.7b";
const ollamaUrl = "http://127.0.0.1:11434/api/chat";

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
let muteButton;
let audioContext;
let muted = false;
let crtBrightness = 255;

function setup() {
  createCanvas(windowWidth, max(windowHeight, 720));
  textFont("Courier New");
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  resetMachine();

  const controls = createDiv();
  controls.class("controls");

  connectButton = createButton("Connect Microbit");
  connectButton.class("control");
  connectButton.parent(controls);
  connectButton.mousePressed(connectSerial);

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
  textAlign(CENTER, CENTER);

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

  for (let index = max(0, stage - 1); index < words.length; index++) {
    const nextWord = random(wordChoices);
    if (nextWord !== words[index]) {
      words[index] = nextWord;
      playClickSound(index);
    }
  }
}

function resetMachine() {
  words = Array.from({ length: 3 }, () => random(wordChoices));
  fortune = "";
  explanation = "";
  aiStatus = "PRESS THE MICROBIT TO SPIN";
  stage = 0;
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
  const compact = width < 620 || height < 520;
  const titleY = constrain(height * (compact ? 0.19 : 0.16), 76, 130);
  const title = "FORTUNE-SLOTS_OS v1.0";
  let titleSize = constrain(width * 0.075, 19, 52);
  textSize(titleSize);
  titleSize *= min(1, width * 0.94 / textWidth(title));
  terminalText(title, width / 2, titleY, titleSize);
  fill(0, crtBrightness, 0);
  textSize(constrain(width * 0.027, 10, 18));
  text("> DIGITAL SLOT MACHINE ENGINE ONLINE", width / 2, titleY + 45);
}

function drawReel(index, word) {
  const layout = getReelLayout();
  const { size, gap, reelY } = layout;
  const x = width / 2 + (index - 1) * gap;

  stroke(0, crtBrightness, 0);
  strokeWeight(constrain(size * 0.018, 2, 4));
  fill(0);
  rect(x, reelY, size, size, min(20, size * 0.09));

  noStroke();
  fill(0, crtBrightness, 0);
  textSize(constrain(size * 0.14, 10, 30));
  text(word, x, reelY, size - 12);
}

function getReelLayout() {
  const compact = width < 620 || height < 520;
  const size = min(220, width / 3 - 24, height * (compact ? 0.15 : 0.28));
  const gap = min(size + 20, width / 3 - 8);
  const reelY = height * (compact ? 0.41 : 0.46);
  return { compact, size, gap, reelY };
}

function drawStatus() {
  fill(0, crtBrightness, 0);
  textSize(constrain(width * 0.04, 12, 22));
  const messages = [
    connectionMessage,
    "SELECTING LOCATION...",
    "SELECTING EVENT...",
    "SELECTING OUTCOME..."
  ];
  text("> " + messages[stage], width / 2, height * 0.94, width * 0.92);
}

function drawFortune() {
  const { size, reelY } = getReelLayout();
  fill(0, crtBrightness, 0);
  let y = reelY + size / 2 + 24;
  y = drawParagraph(words.join(" • "), y, width * 0.9, constrain(width * 0.04, 12, 30)) + 12;
  if (!fortune) {
    drawParagraph(aiStatus, y, width * 0.92, constrain(width * 0.03, 16, 22));
    return;
  }

  y = drawParagraph(fortune, y, width * 0.88, constrain(width * 0.031, 11, 22)) + 10;
  y = drawParagraph(explanation, y, width * 0.88, constrain(width * 0.024, 10, 17)) + 12;
  drawParagraph("> " + aiStatus, y, width * 0.92, constrain(width * 0.018, 9, 12));
}

function drawParagraph(message, y, maxWidth, size) {
  textSize(size);
  textLeading(size * 1.22);
  textAlign(CENTER, TOP);

  const lines = [];
  for (const paragraph of String(message).split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? line + " " + word : word;
      if (line && textWidth(candidate) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
  }

  const lineHeight = size * 1.22;
  lines.forEach((line, index) => {
    text(line, width / 2, y + index * lineHeight);
  });
  textAlign(CENTER, CENTER);
  return y + lines.length * lineHeight;
}

// Ask Ollama for a fortune and a plain-language explanation in one response.
async function generateFortune() {
  const controller = new AbortController();
  fortuneController = controller;
  aiStatus = "FORTUNE ROULETTE: WRITING YOUR FORTUNE...";

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
            content: "Write a vivid, concise fortune using three words in order as symbols: the first sets a scene, the second is a turning point, and the third suggests an outcome. Explain its meaning in one simple sentence of at most 20 words. Return a JSON object with sentence and explanation."
          },
          {
            role: "user",
            content: "Use all three words exactly and in this order: " + words.join(", ") +
              ". The sentence must use all three naturally. Explain how they work together as symbols."
          }
        ],
        options: { temperature: 0.9, num_predict: 180 }
      })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const details = errorBody.error || "Ollama returned HTTP " + response.status;
      if (response.status === 404) {
        throw new Error("MODEL NOT FOUND • RUN: ollama pull " + model);
      }
      throw new Error(details);
    }

    const result = await response.json();
    const generated = JSON.parse(result.message.content);
    if (!generated.sentence || !generated.explanation) {
      throw new Error("The model did not return both a sentence and an explanation.");
    }

    fortune = generated.sentence;
    explanation = generated.explanation;
    aiStatus = "FORTUNE ROULETTE: FORTUNE READY • PRESS TO SPIN AGAIN";
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("Fortune roulette error:", error);
    aiStatus = error instanceof TypeError
        ? "FORTUNE ROULETTE: CONNECTION FAILED • CHECK OLLAMA"
      : "FORTUNE ROULETTE ERROR: " + error.message;
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
  resizeCanvas(windowWidth, max(windowHeight, 720));
}
