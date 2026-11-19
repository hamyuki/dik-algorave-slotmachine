// Array of words that will be randmoly selected and are sorted into five reels for the fortune. whitch is location, eventm feeling, turening point, and outcome.
const wordChoices = [ 
  "Forest", "Ocean", "Apartment", "Garage", "Garden", "Park", "Corridor", "River", "Mall", "Cafe", "Vacation", "Bhutan", "Quebec", "Småland", "Greece", "Södertörn", "Train", "Cellar", "Basement",  //locations and scenes
  "Love", "Loss", "Hope", "Fear", "Death", "Conflict", "Change", "Silence" , // emotions and events.
  "Misfortune", "Freedom", "Riches", "Growth", "Destiny", "Balance", "Fortune", "Understanding", // possible outcomes.
  "Heart", "Memory", "Dream", "Home", "Tragedy", "Storm", "Horizon", "Struggle", // personal and symbolic ideas.
  "Joy", "Grief", "Longing", "Forgiveness", "Surprise", "Courage", "Acceptance", "Pain", "Suffering", // Add feelings and responses.
  "Healing", "Connection", "Clarity", "Peace", "Renewal", "Trust", "Puppy", "Kitten", // positive themes.
  "Moon", "Anomaly", "Encounter", "Soulmate", "Escape", "Knowledge", "Rebirth", "Transformation", // unusual themes.
  "Sacrifice", "Reunion", "Immortality", "Exile", "Accident", "Redemption", "Cat", "Dog", "Job", "Nothing", "Despair", "Help", "President", "Company", "Work", // word pool.
]; 
// Reel count and the stages that control when each reel stops.
const REEL_COUNT = 5; //deffine the number of reels in the slot machine. 
const FIRST_STOP_STAGE = 2; // Stop the first reel when the second stage begins.                     /// explain why this is needed. 
const FINAL_STAGE = REEL_COUNT + 1; // Reserve the last stage for the fortune.                     /// explain why this is needed. 

//Index	      Value
// 0	        CONNECT MICROBIT TO ORACLE
// 1	        SELECTING LOCATION...
// 2	        SELECTING EVENT...
// 3	        SELECTING FEELING...
// 4	        SELECTING TURNING POINT...
// 5	        SELECTING OUTCOME...




// Ollama model and local chat endpoint.
const model = "qwen3:1.7b"; // LLM.
const ollamaUrl = "http://127.0.0.1:11434/api/chat"; // API endpoint for the local Ollama model.

// Different types of messages shown for each stage of the game.
const stageMessages = [ 
  "CONNECT MICROBIT TO ORACLE", // Prompt for the  player to connect or begin.
  "SELECTING LOCATION...", //  first result is being selected.
  "SELECTING EVENT...", //  second result is being selected.
  "SELECTING FEELING...", //  that the third result is being selected.
  "SELECTING TURNING POINT...", //  fourth result is being selected.
  "SELECTING OUTCOME..." // the fifth reel is being selected.
]; 

// Variables for reel words and animation positions. whitch are used to track the current state of the slot machine and its reels.
let words = []; // Store the word currently centered on each reel.
let previousWords = []; // Stores the previous words on each reel.
let nextWords = []; // Stores the next word scrolling below each current word.
// togheter they create a "fake illusion of continuous scrolling" by keeping track of the current, previous, and next words.


let reelOffsets = []; // Track each reel's position and stores the distance of how far it has scrolled vertically
let reelSpeeds = []; // speed of the reels.
let stage = 0; // Track the current spin stage.
let fortunePending = false; // Wait until every reel stops before asking Ollama. And uses this variable to determin which real should stop nexxt 

// Connection, fortune, and sound state.
let connectionMessage = stageMessages[0]; // Keep the latest micro:bit connection status and reusing the first value for the array.
let serialBuffer = ""; // Hold partial micro:bit messages until a full line arrives. ANd storese the incomming data from the micro:bit until a complete message is received.
let lastPressTime = 0; // Remember the last click to prevent duplicate spins while spinning. And uses this variable to track the time of the last accepted click to prevent rapid duplicate spins
let fortune = ""; // varialbe for storing  Ollama's fortune sentence.
let explanation = ""; // variable for storing Ollama's plain-language explanation.
let aiStatus = "CONNECT MICROBIT TO BEGIN"; // Stores  AI status message.
let fortuneController; // this variable is made for managing/handlening the fortune request whille allowing the Ai to request to be declined.
let connectButton; // Keep the connect button to hide it after pairing.                              /// explain why this is needed. 
let muteButton; // Keep the mute button to update its label when toggled.
let audioContext; // variable for storing/ managing the audio context.
let waitingSoundTimer; // type of repetetive sound  tune while Ollama is working and .
let muted = false; // determs if the sound is enable or disabled.
let crtBrightness = 255; // Store the current CRT flicker(aka greeen text color) brightness.

// canvas and game setup.
function setup() { 
  createCanvas(windowWidth, max(windowHeight, 720)); // Fill the window with  and minimum height for the reels and fortune. //max() returns whichever value is larger in px.
  textFont("Courier New"); // terminal-style font.
  textAlign(CENTER, CENTER); // allign text to center
  rectMode(CENTER); // Draw reel frames from its center point
  resetMachine(); // reset the machine state.
  const controls = createDiv(); // creates a HTML div element.
  controls.class("controls"); // gives a class inside the HTML DIV controls .
  connectButton = createButton("Connect Microbit"); // microbit connection button.
  connectButton.class("control"); // button styling class for css.
  connectButton.parent(controls); // Place it in the controls container. while accessing the parent div element to place the button inside it.
  connectButton.mousePressed(connectSerial); //tells the js to witch function to execute when the button is pressed.
  const spinButton = createButton("Spin"); // Add a button for manual spins.
  spinButton.class("control"); // Apply the shared button styling.                                      /// explain why this is needed. 
  spinButton.parent(controls); // Place it beside the other controls.
  spinButton.mousePressed(advanceMachine); // when the button is pressed it will execute the advanceMachine function to advance the slot machine.
  muteButton = createButton("Sound: On"); // button for audio control trhat toggles sound.
  muteButton.class("control"); // Apply the shared button styling.                                     
  muteButton.parent(controls); // Place it in the controls container.                                 
  muteButton.mousePressed(toggleMute); // Toggle to mute all sound effects.
} 

// Update the animation and draw the screen each frame.
function draw() { 
  background(0); //set the background color to black for a classic slot machine look.
  crtBrightness = random(235, 255); // ctr flicker effect by randomizing the brightness of the green text between 235 and 255 for a subtle flicker effect.
  const layout = getReelLayout(); // calls a function getReelLayout to calculate reel positions.
  spinReels(layout.size); // Move or slow the reels. while accessing laypout.size to determine the size of the reels and how fast they should spin.
  drawTitle(); // Draw the machine heading and subtitle.
  words.forEach((word, index) => drawReel(index, word, layout)); // Draw every reel. by first accessing the words array, 
  // while for each word in the array it will call the drawReel function to draw the reel and its word.
  //index represents the position of the word in the array and later determines which reel to draw and where to place it on the screen.


  if (stage === FINAL_STAGE) { // Show the fortune after all reels stop.
// if the fate mashine has reaches the final stage it will display the fortune and its explanation by 
    drawFortune(layout); // using DrawFortune to display the results and their explanation.
  } else {  
    drawStatus(); // Otherwise show the current game status
  } 
} 

// function for reducing spam clicks 
function advanceMachine() { // Move to the next reel stop or start a new round.
  if (millis() - lastPressTime < 300) return; // Ignore rapid clicks to prevent accidental double spins. 
  // where millis() returns the number of milliseconds since the program started, lastPressTime is the time of the last accepted click.
  lastPressTime = millis(); // updates the last click time to current time.
  unlockAudio(); // Allow browser audio after the user gesture.

  if (stage === FINAL_STAGE) { // Start over after a completed result. while checking if the mashines previus round has been finnished.
    if (fortuneController) fortuneController.abort(); // checks if the ai request is still pending or exsitting. if yes then it will aborrt () the request
    // with out aborting the request it will cause the new round to be delayed until the previous request is completed.
    resetMachine(); // resets the mashines state for a new round.
  stage = 1; // starts a next round by setting the stage to 1 to start the first reel spinning.
    return; //returns the function
  } 

  stage++; // increses the stage by one. 

  if (stage >= FIRST_STOP_STAGE && stage <= FINAL_STAGE) { // checks if the gmae is within the reels stopping stage 
    // checks if the stage is between the first reel stopping and the final stage where all reels have stopped. 
    // which means if the player has pressed the button to stop a reel the game is  processing to stopping the reels one by one. where first spin is

    playStopSound(stage - FIRST_STOP_STAGE); // ususe the playStopSound function to plau sound and pasest it as argument 
  }
  if (stage === FINAL_STAGE) { // checks if the program has reached the final stage where all of the reels has beeen stopped 
    fortunePending = true; // if the condition is met(true) a request to Ollama will be send when all reels have stopped
    aiStatus = "REELS STOPPING..."; // Text explanation that his fate is on its way to be printed out 
  }
}

// this function handles the spinning of the reels and the easing of the stopped reels to a halt.
function spinReels(size) {  // size contins the demention of the reels and is used to determine the speed of the reels and how fast they should spin.
  const rowHeight = max(28 , size * 0.35); // calculates the vertical distance/ hight between each words on the reel 
  // where the max function returns the larger of the two values, 28 or size * 0.34, to ensure that the row height is at least 28 pixels and scales with the reel size for proper spacing.
  // 0.35 is a scaling factor that determise the distanse between the words. 0.35 = 35% of the reel size.

  for (let index = 0; index < words.length; index++) { // Update each reel independently. 
  // by starting at the first reel and continuing until the last reel is reached. 
  // // this is made for updating each reel's position and speed based on its current game stage.
    
    const shouldSpin = stage < FIRST_STOP_STAGE || index >= stage - 1; // determs if the current reel should be spinning or slowing down based on the current game stage and the reel's index.
    // if the condition is niether true or false the reel keeps spinning. 
    // the first condition checks if the games stages is erlier than the first real spin stage, if the ocndition is true the all reelswill keep spinning 
    // ¨in second condition the index or I is current reel value while stage identifies the current game stage animation and stage -1 determs the indexes reel for continuing spinning or not

    if (shouldSpin) { // accs of the whele  and realSpeed is an array. 

      reelSpeeds[index] = min(reelSpeeds[index] + 0.5, 16); 
    //accessing the speed of current reeal and increasing it by 0.5 each frame until it reaches a maximum speed of 16
    // min () is used for to ensure that the reel speed does not exceed 16, which is the maximum speed for the weel. 
    // 16 is manual set number 
    } else { 
      reelSpeeds[index] *= 0.94; // same thing as reelSpeeds[index] = reelSpeeds[index] * 0.94;
    } //slows down the speed 94% and creates a smoother slowdown. OBS 0.94 is chosen manualy 

    if (reelSpeeds[index] > 0.1) { // checks if the reel is moving fast enough to continue scrolling animation. 
    // If the speed is greater than 0.1, the reel continues moving. if no then its slowing down and will be stopped.

      reelOffsets[index] += reelSpeeds[index]; // Move the visible words by this frame's speed.
      // Reel offsets [index] is the current vertical position of the reel's words, abd stores how far the text have moved vertically from there start popint
      // reelspeed = how fast trhe text is moving. Reeloffset how far have they mooved.

      while (reelOffsets[index] >= rowHeight) { //  checks if the reel has moved onced atleast vertically 
// reellOffsett[index]=  vertical movement  // rowHeight= hight of the full row in px 

        reelOffsets[index] -= rowHeight; // stores thje current word as the previus word 
//current word is about to move out of the center position. The algoritm  needs to remember which word was previously displayed.
      
        previousWords[index] = words[index]; // Move the current word above the center. 
        words[index] = nextWords[index]; // Center the next word on the reel.
        // which means that the next word moves into current position 

        
        nextWords[index] = random(wordChoices); // randomizes the next generated word
        playClickSound(index); // plays sound function 
      } 

    } else if (!shouldSpin) { // menas that uf the reel is not spinning and the speed is grater than 0.1 then the block executes 
// != Not and reverses the boolean statemnt to the opposit. True to false. False to true 

      reelSpeeds[index] = 0; // Remove  leftover speed values.
      reelOffsets[index] *= 0.85; // Gently align the final word with the center.
      if (reelOffsets[index] < 0.5) reelOffsets[index] = 0; // Snap away a barely visible offset.
    } // End the reel-settling branch.
  } // End the reel loop.

  if (stage === FINAL_STAGE && fortunePending && reelSpeeds.every((speed) => speed === 0)) { // Wait until every reel is still.
    fortunePending = false; // Ensure this round requests a fortune only once.
    generateFortune(); // Ask the local Ollama model for the result.
  } // End the all-reels-stopped branch.
} // End reel animation.

// Pick starting words and clear state for a new spin.
function resetMachine() { // Prepare the machine for a fresh round.
  words = Array.from({ length: REEL_COUNT }, () => random(wordChoices)); // Pick each reel's starting word.
  previousWords = Array.from({ length: REEL_COUNT }, () => random(wordChoices)); // Fill the row above each reel.
  nextWords = Array.from({ length: REEL_COUNT }, () => random(wordChoices)); // Fill the row below each reel.
  reelOffsets = Array(REEL_COUNT).fill(0); // Align all reel words at the center.
  reelSpeeds = Array(REEL_COUNT).fill(0); // Start with every reel stopped.
  fortune = ""; // Clear the last fortune.
  explanation = ""; // Clear its explanation.
  aiStatus = "PRESS THE MICROBIT TO SPIN"; // Show the ready message.
  stage = 0; // Return to the initial game stage.
  fortunePending = false; // Clear any request waiting for the reels.
} // End the reset routine.

// Turn all generated sounds on or off.
function toggleMute() { // Change the sound setting from the button.
  muted = !muted; // Flip the current mute state.
  muteButton.html(muted ? "Sound: Off" : "Sound: On"); // Update the button label.
  if (!muted) unlockAudio(); // Resume audio when sound is turned back on.
} // End the mute toggle.

// Start or resume audio after a user action, as required by browsers.
function unlockAudio() { // Set up audio after a click or micro:bit press.
  if (!audioContext) { // Create the audio context only once.
    const AudioContextClass = window.AudioContext || window.webkitAudioContext; // Support standard and older browsers.
    if (!AudioContextClass) return; // Exit if this browser has no Web Audio support.
    audioContext = new AudioContextClass(); // Create the shared audio context.
  } // End audio-context creation.
  if (audioContext.state === "suspended") audioContext.resume(); // Resume audio if browser playback was paused.
} // End audio setup.

// Play one short tone through the browser's audio system.
function playTone(frequency, duration, type, volume) { // Create a tone with the requested sound settings.
  if (muted || !audioContext) return; // Skip sound while muted or before audio is enabled.

  const oscillator = audioContext.createOscillator(); // Generate the tone's waveform.
  const gain = audioContext.createGain(); // Control the tone's volume.
  const now = audioContext.currentTime; // Use the current audio time for scheduling.

  oscillator.type = type; // Choose the tone's timbre.
  oscillator.frequency.setValueAtTime(frequency, now); // Set its pitch.
  gain.gain.setValueAtTime(volume, now); // Set its starting volume.
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Fade the tone out smoothly.
  oscillator.connect(gain); // Send the tone through its volume control.
  gain.connect(audioContext.destination); // Route the sound to the speakers.
  oscillator.start(now); // Begin playing the tone.
  oscillator.stop(now + duration); // End it after the requested duration.
} // End tone playback.

// Tick as a word passes through a spinning reel.
function playClickSound(reel) { // Play a short click for the reel that moved.
  playTone([520, 600, 680, 760, 860][reel], 0.035, "square", 0.035); // Give each of the five reels a distinct pitch.
} // End reel click sound.

// Give each reel a low tone when the player stops it.
function playStopSound(reel) { // Play a low stopping tone.
  playTone([220, 280, 340, 400, 460][reel], 0.12, "triangle", 0.08); // Match its pitch to the reel.
} // End reel stop sound.

// Play a short rising chime when Ollama returns a fortune.
function playResultSound() { // Celebrate a successful fortune response.
  [523, 659, 784, 1047].forEach((frequency, index) => { // Step through four rising notes.
    setTimeout(() => playTone(frequency, 0.18, "triangle", 0.055), index * 95); // Play each note in sequence.
  }); // End the rising-note sequence.
} // End result sound.

// Play a soft repeating suspense tune while the model writes the fortune.
function startWaitingSound() { // Start the repeating tune for an Ollama request.
  stopWaitingSound(); // Clear any previous tune before starting another.
  const notes = [196, 233, 262, 233]; // Define a quiet four-note suspense pattern.
  let noteIndex = 0; // Track which note plays next.
  const playNextNote = () => { // Play one note and move to the next.
    playTone(notes[noteIndex], 0.2, "triangle", 0.035); // Keep the waiting sound soft.
    noteIndex = (noteIndex + 1) % notes.length; // Repeat the pattern from its first note.
  }; // End the repeated-note callback.

  playNextNote(); // Play immediately so the wait is audible.
  waitingSoundTimer = setInterval(playNextNote, 450); // Repeat until the request finishes.
} // End waiting sound setup.

// Stop the suspense tune when the model finishes or the request is cancelled.
function stopWaitingSound() { // End the repeating wait sound.
  if (waitingSoundTimer) { // Only clear a timer that was started.
    clearInterval(waitingSoundTimer); // Stop future notes from being scheduled.
    waitingSoundTimer = undefined; // Mark the timer as inactive.
  } // End the active-timer check.
} // End waiting sound cleanup.

// Draw the title with a layered CRT glow.
function drawTitle() { // Position and draw the machine heading.
  const compact = width < 620 || height < 520; // Detect narrow or short screens.
  const titleY = constrain(height * (compact ? 0.19 : 0.16), 76, 130); // Keep the heading in view.
  const title = "FORTUNE-SLOTS_OS v1.0"; // Set the title text.
  let titleSize = constrain(width * 0.075, 19, 64); // Scale the title to the screen.
  textSize(titleSize); // Set the initial size to measure the title.
  titleSize *= min(1, width * 0.94 / textWidth(title)); // Shrink it if it would exceed the window.
  terminalText(title, width / 2, titleY, titleSize); // Draw the glowing title.
  fill(0, crtBrightness, 0); // Use the current CRT brightness for the subtitle.
  textSize(constrain(width * 0.027, 10, 22)); // Scale the subtitle separately.
  text("> DIGITAL SLOT MACHINE ENGINE ONLINE", width / 2, titleY + max(45, titleSize * 1.15)); // Draw it below the title.
} // End title drawing.

// Draw one reel and clip its scrolling words to the frame.
function drawReel(index, word, layout) { // Draw one frame and its three scrolling words.
  const { size, gap, rowGap, reelY, columns } = layout; // Read the shared reel dimensions.
  const row = Math.floor(index / columns); // Find this reel's row on compact screens.
  const column = index % columns; // Find this reel's column in its row.
  const reelsInRow = min(columns, REEL_COUNT - row * columns); // Count reels in this row for centering.
  const x = width / 2 + (column - (reelsInRow - 1) / 2) * gap; // Center this row of reels horizontally.
  const y = reelY + row * rowGap; // Place the reel on its row.
  const rowHeight = max(28, size * 0.34); // Match word spacing to the frame size.

  stroke(0, crtBrightness, 0); // Draw the frame in glowing green.
  strokeWeight(constrain(size * 0.018, 2, 4)); // Scale the frame border with its size.
  fill(0); // Keep the inside of the frame black.
  rect(x, y, size, size, min(20, size * 0.09)); // Draw the rounded reel frame.

  const context = drawingContext; // Use the canvas context to clip scrolling words.
  context.save(); // Save the current clipping state.
  context.beginPath(); // Start a clipping rectangle for the reel contents.
  context.rect(x - size / 2 + 5, y - size / 2 + 5, size - 10, size - 10); // Leave a small border around the words.
  context.clip(); // Hide any word parts that move outside the frame.

  noStroke(); // Remove outlines from the word text.
  fill(0, crtBrightness, 0); // Draw words in the current CRT green.
  const textSizeForReel = constrain(size * 0.13, 14, 42); // Scale reel text with the frame.
  drawReelWord(previousWords[index], x, y - rowHeight - reelOffsets[index], size - 20, textSizeForReel); // Draw the word above center.
  drawReelWord(word, x, y - reelOffsets[index], size - 20, textSizeForReel); // Draw the current center word.
  drawReelWord(nextWords[index], x, y + rowHeight - reelOffsets[index], size - 20, textSizeForReel); // Draw the next word below.
  context.restore(); // Restore normal drawing outside the reel.

  stroke(0, crtBrightness, 0, 60); // Draw subtle guides around the selected row.
  strokeWeight(1); // Keep the guides thin.
  line(x - size * 0.4, y - rowHeight / 2, x + size * 0.4, y - rowHeight / 2); // Mark the top of the selected row.
  line(x - size * 0.4, y + rowHeight / 2, x + size * 0.4, y + rowHeight / 2); // Mark the bottom of the selected row.
} // End reel drawing.

// Shrink unusually long words just enough to keep them inside the reel.
function drawReelWord(word, x, y, maxWidth, baseSize) { // Fit one word to the reel's inner width.
  textSize(baseSize); // Measure the word at the normal reel size.
  const fittedSize = min(baseSize, baseSize * maxWidth / max(1, textWidth(word))); // Reduce only words that are too wide.
  textSize(fittedSize); // Apply the calculated size.
  text(word, x, y, maxWidth); // Draw the word without letting it spill out.
} // End fitted word drawing.

// Scale reel frames with the screen, up to a size that still leaves room for five reels.
function getReelLayout() { // Calculate reel dimensions for the current screen.
  const compact = width < 620 || height < 520; // Use compact spacing on small screens.
  const columns = compact ? 3 : REEL_COUNT; // Arrange compact reels in three columns.
  const rows = Math.ceil(REEL_COUNT / columns); // Calculate how many rows the reels need.
  const size = min(340, width / columns - 24, height * (compact ? 0.15 : 0.34)); // Fit reels within each row.
  const gap = min(size + 20, width / columns - 8); // Leave space between adjacent reels.
  const rowGap = size + 20; // Separate rows by one reel plus a small gap.
  const reelY = height * (compact ? 0.34 : 0.46); // Position the top row below the heading.
  return { size, gap, rowGap, reelY, columns, rows }; // Share the layout with drawing functions.
} // End layout calculation.

// Show the current stage beneath the reels.
function drawStatus() { // Draw the current connection or spin message.
  fill(0, crtBrightness, 0); // Match the message to the CRT color.
  textSize(constrain(width * 0.04, 12, 30)); // Scale the message to the screen.
  const message = stage === 0 ? connectionMessage : stageMessages[stage]; // Pick the message for this stage.
  text("> " + message, width / 2, height * 0.94, width * 0.92); // Draw it along the bottom.
} // End status drawing.

// Show the stopped words and the fortune returned by Ollama.
function drawFortune(layout) { // Draw the final words and model response.
  const { size, rows, rowGap, reelY } = layout; // Read the reel dimensions for positioning.
  fill(0, crtBrightness, 0); // Use the CRT green for all result text.
  let y = reelY + (rows - 1) * rowGap + size / 2 + 24; // Start below the last row of reels.
  y = drawParagraph(words.join(" • "), y, width * 0.9, constrain(width * 0.04, 12, 34)) + 12; // List the five selected words.
  if (!fortune) { // Show a status message while Ollama is working.
    drawParagraph(aiStatus, y, width * 0.92, constrain(width * 0.03, 16, 22)); // Draw the wait or error message.
    return; // Do not draw empty fortune fields.
  } // End the waiting and error display branch.

  y = drawParagraph("Your fortune", y, width * 0.88, constrain(width * 0.025, 12, 20)) + 4; // Label the fortune sentence.
  y = drawParagraph(fortune, y, width * 0.88, constrain(width * 0.031, 11, 30)) + 10; // Draw the model's fortune.
  y = drawParagraph("In plain words", y, width * 0.88, constrain(width * 0.025, 12, 20)) + 4; // Label the plain explanation.
  y = drawParagraph(explanation, y, width * 0.88, constrain(width * 0.024, 10, 24)) + 12; // Draw the explanation.
  drawParagraph("> " + aiStatus, y, width * 0.92, constrain(width * 0.018, 9, 16)); // Show what the player can do next.
} // End fortune drawing.

// Wrap a message to fit the available screen width and return its ending position.
function drawParagraph(message, y, maxWidth, size) { // Wrap and draw a centered message.
  textSize(size); // Set the font size for this paragraph.
  textLeading(size * 1.22); // Set the gap between wrapped lines.
  textAlign(CENTER, TOP); // Align text from the top of its block.

  const lines = []; // Collect wrapped lines before drawing them.
  for (const paragraph of String(message).split("\n")) { // Preserve explicit paragraph breaks.
    let line = ""; // Build one line from words.
    for (const word of paragraph.split(/\s+/)) { // Add words one at a time.
      const candidate = line ? line + " " + word : word; // Try the next word on the current line.
      if (line && textWidth(candidate) > maxWidth) { // Check whether the candidate exceeds the width.
        lines.push(line); // Save the completed line.
        line = word; // Start the next line with the current word.
      } else { // Keep the candidate on the current line.
        line = candidate; // Store the expanded line.
      } // End the line-wrap decision.
    } // End the word loop.
    if (line) lines.push(line); // Save the last line of this paragraph.
  } // End the paragraph loop.

  const lineHeight = size * 1.22; // Match line spacing to the selected font size.
  lines.forEach((line, index) => { // Draw each wrapped line in order.
    text(line, width / 2, y + index * lineHeight); // Place it below the previous line.
  }); // End line drawing.
  textAlign(CENTER, CENTER); // Restore the alignment used by the rest of the machine.
  return y + lines.length * lineHeight; // Return the vertical position after the paragraph.
} // End paragraph drawing.

// Ask the local Ollama model for a short fortune and its plain-language meaning.
async function generateFortune() { // Ask Ollama to write the fortune and explanation.
  const controller = new AbortController(); // Make this request cancellable.
  fortuneController = controller; // Save it so a new spin can cancel it.
  aiStatus = "FORTUNE ROULETTE: WRITING YOUR FORTUNE..."; // Show that generation has started.
  startWaitingSound(); // Play the suspense tune while waiting.

  try { // Send the local chat request and handle its result.
    const response = await fetch(ollamaUrl, { // Post the prompt to Ollama.
      method: "POST", // Use a request that sends JSON data.
      headers: { "Content-Type": "application/json" }, // Tell Ollama the request body is JSON.
      signal: controller.signal, // Allow the request to be aborted.
      body: JSON.stringify({ // Convert the model options and prompt to JSON.
        model, // Use the configured local language model.
        stream: false, // Wait for one complete response.
        think: false, // Ask Qwen to skip its separate reasoning output.
        format: { // Require a predictable JSON response.
          type: "object", // Return a JSON object.
          properties: { // Define the fields the object may contain.
            sentence: { type: "string" }, // Store the fortune sentence as text.
            explanation: { type: "string" } // Store its explanation as text.
          }, // Finish the field definitions.
          required: ["sentence", "explanation"], // Require both response fields.
          additionalProperties: false // Reject fields that are not requested.
        }, // Finish the response format.
        messages: [ // Send the writing instructions and reel words.
          { // Begin the system instructions.
            role: "system", // Set the model's overall task.
            content: "Write a short fortune in clear, everyday English. Use all five symbols in the exact order given. Write one direct sentence of no more than 35 words. Then explain it in a second plain-language sentence of no more than 20 words, with a practical meaning. Avoid jargon and guaranteed predictions. Return JSON with sentence and explanation." // Explain the expected style and format.
          }, // Finish the system message.
          { // Begin the user prompt.
            role: "user", // Supply the words selected by the reels.
            content: "Use all five words exactly and in this order: " + words.join(", ") + // Include the words in their original order.
              ". Keep both sentences easy to understand." // Ask the model to keep its answer simple.
          } // Finish the user message.
        ], // Finish the prompt messages.
        options: { temperature: 0.6, num_predict: 120 } // Keep the response focused and short.
      }) // Finish building the JSON request.
    }); // Wait for Ollama to reply.

    if (!response.ok) { // Handle HTTP errors before parsing the response.
      const errorBody = await response.json().catch(() => ({})); // Read Ollama's error details when available.
      const details = errorBody.error || "Ollama returned HTTP " + response.status; // Create a useful fallback error.
      if (response.status === 404) { // Detect a missing model or endpoint.
        throw new Error("MODEL NOT FOUND • RUN: ollama pull " + model); // Tell the player how to install the model.
      } // End the missing-model check.
      throw new Error(details); // Pass other Ollama errors to the error handler.
    } // End HTTP error handling.

    const result = await response.json(); // Read the response envelope from Ollama.
    const generated = JSON.parse(result.message.content); // Parse the model's JSON text.
    if (!generated.sentence || !generated.explanation) { // Check that both expected fields are present.
      throw new Error("The model did not return both a sentence and an explanation."); // Report incomplete model output.
    } // End response validation.

    fortune = generated.sentence; // Save the completed fortune.
    explanation = generated.explanation; // Save its plain-language meaning.
    aiStatus = "FORTUNE ROULETTE: FORTUNE READY • PRESS TO SPIN AGAIN"; // Tell the player the result is ready.
    stopWaitingSound(); // End the tune before the success chime.
    playResultSound(); // Celebrate the completed result.
  } catch (error) { // Handle request, parsing, and cancellation errors.
    if (error.name === "AbortError") return; // Ignore an intentional cancellation.
    console.error("Fortune roulette error:", error); // Keep technical details in the browser console.
    aiStatus = error instanceof TypeError // Check whether the browser could reach Ollama.
        ? "OLLAMA CONNECTION FAILED • START OLLAMA" // Show a helpful connection message.
      : "FORTUNE ROULETTE ERROR: " + error.message; // Show other errors to the player.
  } finally { // Clean up after success, failure, or cancellation.
    if (fortuneController === controller) { // Avoid cleaning up a newer request.
      stopWaitingSound(); // Ensure the repeating sound is stopped.
      fortuneController = undefined; // Clear the completed request reference.
    } // End active-request cleanup.
  } // End request cleanup.
} // End fortune generation.

// Pair the browser with a micro:bit over its serial connection.
async function connectSerial() { // Pair a micro:bit with the browser.
  try { // Request permission and open the serial connection.
    unlockAudio(); // Enable sound after the user's button click.
    const port = await navigator.serial.requestPort(); // Ask the browser to select a micro:bit.
    await port.open({ baudRate: 115200 }); // Open it at the configured communication speed.
    connectionMessage = "PRESS THE MICROBIT TO BEGIN"; // Update the ready message.
    connectButton.hide(); // Hide the connect button after pairing.
    readSerial(port); // Start listening for button presses.
  } catch (error) { // Handle denied permission or connection failures.
    console.error("Could not connect to the micro:bit:", error); // Keep details available for debugging.
    connectionMessage = "MICROBIT CONNECTION FAILED"; // Show a simple failure message.
  } // End connection error handling.
} // End serial connection.

// Turn newline-delimited PRESS messages from the micro:bit into spins.
async function readSerial(port) { // Read button presses from the micro:bit.
  try { // Decode incoming bytes as text.
    const decoder = new TextDecoderStream(); // Convert serial bytes into text.
    port.readable.pipeTo(decoder.writable); // Feed the serial stream into the decoder.
    const reader = decoder.readable.getReader(); // Create a reader for decoded messages.

    while (true) { // Keep reading until the serial stream closes.
      const { value, done } = await reader.read(); // Wait for the next text chunk.
      if (done) break; // Stop when the device closes the stream.
      serialBuffer += value; // Save new text until complete lines are available.

      const lines = serialBuffer.split("\n"); // Separate complete messages by line breaks.
      serialBuffer = lines.pop(); // Keep the last possibly incomplete message.
      for (const line of lines) { // Process each completed message.
        if (line.trim() === "PRESS") advanceMachine(); // Advance the reels when the micro:bit is pressed.
      } // End message processing.
    } // End serial reading.
  } catch (error) { // Handle an unexpected serial read failure.
    console.error("Serial read error:", error); // Keep the failure details in the console.
    connectionMessage = "MICROBIT CONNECTION LOST"; // Tell the player the device disconnected.
  } // End serial error handling.
} // End micro:bit reader.

// Draw layered green text to create a CRT glow.
function terminalText(message, x, y, size) { // Draw glowing green CRT text.
  textSize(size); // Apply the requested font size.
  fill(0, 60, 0); // Set the darkest glow layer.
  text(message, x + 4, y + 4); // Draw the outer shadow slightly offset.
  fill(0, 120, 0); // Brighten the middle glow layer.
  text(message, x + 2, y + 2); // Draw the middle layer closer to the text.
  fill(0, crtBrightness, 0); // Set the main text brightness.
  text(message, x, y); // Draw the sharp text on top.
} // End CRT text drawing.

// Keep the canvas matched to the window after resizing.
function windowResized() { // Recalculate the canvas after a window resize.
  resizeCanvas(windowWidth, max(windowHeight, 720)); // Keep the canvas wide and tall enough for the interface.
} // End resize handling.
