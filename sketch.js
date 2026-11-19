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

      reelSpeeds[index] = 0; // Remove  leftover speed values. becasue js can hanle floats 
      reelOffsets[index] *= 0.85; // retains the 85% of the offset and keeps it to the center

      if (reelOffsets[index] < 0.5) reelOffsets[index] = 0; // removes remaning offsets 
      // ´WHy- because js language is bad at culculating floats and keeps caluculating them even when its not needed
    } 
  } 

  if (stage === FINAL_STAGE && fortunePending && reelSpeeds.every((speed) => speed === 0)) { // Wait until every reel is still. Then waits untill fate is generated 
    // every () array method that returns true only if every elements is true
    fortunePending = false; // Ensure this round requests a fortune only once.
    generateFortune(); // and if all the conditions is true then the AI will generate its fortune 
  } 
}

// resets the mashine 
function resetMachine() {
  words = Array.from({ length: REEL_COUNT }, () => random(wordChoices)); // Creates an array from specified structure through Array.form()
// length: REEL_COUNT derems how long array should be, while ()=> function that executes and randomizes the word choise 

  previousWords = Array.from({ length: REEL_COUNT }, () => random(wordChoices)); // Fill the row above each reel and does the same thing as previus line.
  nextWords = Array.from({ length: REEL_COUNT }, () => random(wordChoices)); // Fill the row below each reel and does same thing as before but for next word
  reelOffsets = Array(REEL_COUNT).fill(0); // Align all reel words offet to 0 5 times
  reelSpeeds = Array(REEL_COUNT).fill(0); // Same thing here but resets speed to 0 
  fortune = ""; // Clear the previus fate
  explanation = ""; // Clear the previous explanation 
  aiStatus = "PRESS THE MICROBIT TO SPIN"; // Show the ready message.
  stage = 0; // Return to the initial game stage.
  fortunePending = false; // Clear any request waiting for the reels.
} 

// function to Turn all generated sounds on or off.
function toggleMute() { 
  muted = !muted; // Flips  the current mute state.
  muteButton.html(muted ? "Sound: Off" : "Sound: On"); // Update the button label.
  if (!muted) unlockAudio(); // turns on the  audio when sound is turned back on.
} 

// Start or resume audio after a user action,
function unlockAudio() { 
  if (!audioContext) { // stores the browsers audio invierment and checks if the variable is empty or undefined 

    const AudioContextClass = window.AudioContext || window.webkitAudioContext; //check´s if the web sound API is supported by the browser 
  // window= global browsers envierment, Audiocontext= Standrat browsers interface, OR the webkitAudioContex aon older version of sound engine 

    if (!AudioContextClass) return; // Exit if this browser has no Web Audio support.
    audioContext = new AudioContextClass(); // Create the shared audio context. with new audiocontextclass() object 
  } 
  if (audioContext.state === "suspended") audioContext.resume(); // audiocontext.state 
} 

// Play one short tone through the browser's audio system.
function playTone(frequency, duration, type, volume) { // Create a tone with the requested sound settings.
  if (muted || !audioContext) return; // Skip sound while muted or before audio is enabled.
  const oscillator = audioContext.createOscillator(); // Generate the tone's waveform.
// createOscillator() creates an oscillator node -  generates a repeating waveform sound 
// Gain- controills the amplitude of an audio signal which desides the volue output 
  const gain = audioContext.createGain(); // Control the tone's volume.
  const now = audioContext.currentTime; // Use the current audio time for scheduling.
  oscillator.type = type; // Choose the tone's timbre / waveform.
  oscillator.frequency.setValueAtTime(frequency, now); // Set its frequency in HZ.
  gain.gain.setValueAtTime(volume, now); // Set its starting volume at certean time .
// accesss the gain node and later on accesses the audioparameters inside the node, 
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Fade the tone out smoothly.
// accesss the gain node and later on accesses the audioparameters inside the node,  later exponentialRampToValueAtTime() creates a exponential sound transition
// 0.001 - the ramp cant reaches the zero because it will be muted and a small positive value is used for making the sound partically silent.
  oscillator.connect(gain); // Send the tone through its volume control/ GainNode.
  gain.connect(audioContext.destination); // Route the sound to the speakers.
  oscillator.start(now); // Begin playing the tone.
  oscillator.stop(now + duration); // End it after the requested duration.
} 

// Tick as a word passes through a spinning reel.
function playClickSound(reel) { 
  playTone([520, 600, 680, 760, 860][reel], 0.035, "square", 0.035); //
  //plays a tone of: Reel 1,	index: 0,	520 Hz. Reel 2,	index 1,	600 Hz. Reel 3	index 2, 	680 Hz. Reel 4	index 3	760 Hz, Reel 5	index 4,	860 Hz
   // its a musical pattern that creats a notes 
  // plays a square sound which is Sharp, electronic, arcade-like sound.
  // 0.035= 0.035 sec
  // second 0.035 = amplitude 

} 

// Give each reel a low tone when the player stops it.
function playStopSound(reel) { // Play a low stopping tone for each reel.
  playTone([220, 280, 340, 400, 460][reel], 0.12, "triangle", 0.08 ); // Match its pitch to the reel.
} //  Reel 1, index; 0, 220 hz.   Reel 2,  index;1, 280hz. Reel 3, index;2, 340hz. Reel 4,  index;3,  400hz. Reel 5,  index;4,  460hz.
 // its a musical pattern that creats a notes  
// triangle sound wave- Softer, mellow electronic sound.
//  0.08 = amplitude 


// Play a short rising chime when Ollama returns a fortune.
function playResultSound() { // plays the rersult sound 
  [523, 659, 784, 1047].forEach((frequency, index) => { // Step through four rising notes with this sett up
  // 1 iteration- 523 hz. 2 Iteration  659hz. 3 Iteration 784 hz. 4 Iteration 1047hz.
   // its a musical pattern that creats a notes 

    setTimeout(() => playTone(frequency, 0.18, "triangle", 0.055), index * 95); // Play each note in sequence.
    // setTimeout() delays the execution of the playTOne() function while calculating the delay for each note
     // Note	            Calculation	              Delay
     //523 Hz	              0 × 95	                 0 ms
     //659 Hz	              1 × 95	                 95 ms
     //784 Hz	              2 × 95	                 190 ms
     //1047 Hz	            3 × 95	                 285 ms



  }); 
// triangle sound wave- Softer, mellow electronic sound.

} 

// Play a soft repeating suspense tune while the model writes the fortune.
function startWaitingSound() {
  stopWaitingSound(); // Clear any previous tune before starting another.
  const notes = [196, 233, 262, 233]; // Define a quiet four-note suspense pattern.
// sound pattern of waiting on result 

  let noteIndex = 0; // Track which note plays next.
  const playNextNote = () => { // Play one note and move to the next.
     // responsible for a one node and updating the counter 
    playTone(notes[noteIndex], 0.2, "triangle", 0.035); // Keep the waiting sound soft.
// Accesses the main index for plaing an triangle vawy sound that last 0.2 ms and has 0.035 amplitude
    noteIndex = (noteIndex + 1) % notes.length; // Repeat the pattern from its first note.  // explain better 
  };
  playNextNote(); // Play immediately so the wait is audible.
  waitingSoundTimer = setInterval(playNextNote, 450); // Repeat until the request finishes.
} 


// Stop the suspense tune when the model finishes or the request is cancelled.
function stopWaitingSound() { // End the repeating wait sound.
  if (waitingSoundTimer) { // Only clear a timer that was started.
    clearInterval(waitingSoundTimer); // Stop future notes from being scheduled.
    waitingSoundTimer = undefined; // Mark the timer as inactive.
  } 
} 

// Draw the title with a layered CRT glow.
function drawTitle() { 
  const compact = width < 620 || height < 520; // checks the how  narrow or short screens is .
  const titleY = constrain(height * (compact ? 0.19 : 0.16), 76, 130); // Keep the heading in view.
  // compact screensize 19% of the screensize
  // 16%  of normal screensieze 
  // height * 0.19 calculates the position that is relative to the screens hieght where text will be drawen
  // ? ternary operator that cchecks 2 statemnts at the same time 
  const title = "FORTUNE-SLOTS_OS v1.0"; // TITLE 

  let titleSize = constrain(width * 0.075, 19, 64); // Scale the title to the screen.
// text scale that is defined by 7.5% of the screensize  where min sieze of text is 19 px and bigges 64
// a more instresting way of making a page more responsive then just using mediaqueries
  textSize(titleSize); // Set the initial size to measure the title.


  titleSize *= min(1, width * 0.94 / textWidth(title)); // Shrink it if it would exceed the window.
  // longer version would be titleSize = titleSize * min(1, width * 0.94 / textWidth(title));

/// first part is culculating the  94% width size to fit the text  
// width * 0.94 / textWidth(title)=  compares the available space with the actual width of your title.
// *= new way of doing mutiplication since JAn 2025
// why 1  cuz 1 x Y = Y 

  terminalText(title, width / 2, titleY, titleSize); // Draw the glowing title.
  // width / 2 culculates the horizonatal center of screen
  // displays the text based on the screens with, title position and font size 


  fill(0, crtBrightness, 0); // Use the current CRT brightness for the subtitle.
  textSize(constrain(width * 0.027, 10, 22)); // Scale the subtitle separately.
  // main text size based on screens with that is devided by 2.7% where the min size is 10 and max is 22

  text("> DIGITAL SLOT MACHINE ENGINE ONLINE", width / 2, titleY + max(45, titleSize * 1.15)); // Draw it below the title.
  // devides the width by 2 and takes the textsize and mutipl 1.15 to find out Spacing based on the title size and prevents the subtitle from getting too close to the main heading.
} 

// Draw one reel and clip its scrolling words to the frame.
function drawReel(index, word, layout) { // Draw one frame and its three scrolling words.
  const { size, gap, rowGap, reelY, columns } = layout; // Read the shared reel dimensions.
  const row = Math.floor(index / columns); // Find this reel's row on compact screens.
// culculates the nearest integer 

  const column = index % columns; // Find this reel's column in its row.
  // culculates the remaining 

  const reelsInRow = min(columns, REEL_COUNT - row * columns); // Count reels in this row for centering
  const x = width / 2 + (column - (reelsInRow - 1) / 2) * gap; // Center this row of reels horizontally and culculatews the amount of gaps bgetween each reel
  // .
//2 becasue its splits into 50% inside the devision 
// 1 because its the distnace in between the fisrt and last reel based on gapx in px

  // 
  const y = reelY + row * rowGap; // Place the reel on its row.
  const rowHeight = max(28, size * 0.34); // Match word spacing to the frame size.
  // 28 = 28 px 
  // size * 0.34 = size * 34%

  stroke(0, crtBrightness, 0); // Draw the frame in glowing green.

  strokeWeight(constrain(size * 0.018, 2, 4)); // Scale the frame border with its size.
  // size* 1.8%  with min 2 ox and max 4 px 
  fill(0); // Keep the inside of the frame black.
  rect(x, y, size, size, min(20, size * 0.09)); // Draw the rounded reel frame.

  const context = drawingContext; // Use the canvas context to clip scrolling words.
  context.save(); // Save the current clipping state.
  context.beginPath(); // Start a clipping rectangle for the reel contents.
  context.rect(x - size / 2 + 5, y - size / 2 + 5, size - 10, size - 10); // Leave a small border around the words.  // explain deeper 

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
}

// Show the stopped words and the fortune returned by Ollama.
function drawFortune(layout) { // Draw the final words and model response.
  const { size, rows, rowGap, reelY } = layout; // Read the reel dimensions for positioning.
  fill(0, crtBrightness, 0); // Use the CRT green for all result text.
  let y = reelY + (rows - 1) * rowGap + size / 2 + 24; // Start below the last row of reels.
  y = drawParagraph(words.join(" • "), y, width * 0.9, constrain(width * 0.04, 12, 34)) + 12; // List the five selected words.

  if (!fortune) { // Show a status message while Ollama is working.
    drawParagraph(aiStatus, y, width * 0.92, constrain(width * 0.03, 16, 22)); // Draw the wait or error message.
    return; // Do not draw empty fortune fields.
  } 

  y = drawParagraph("Your fortune", y, width * 0.88, constrain(width * 0.025, 12, 20)) + 4; // Label the fortune sentence.
  y = drawParagraph(fortune, y, width * 0.88, constrain(width * 0.031, 11, 30)) + 10; // Draw the model's fortune.
  y = drawParagraph("In plain words", y, width * 0.88, constrain(width * 0.025, 12, 20)) + 4; // Label the plain explanation.
  y = drawParagraph(explanation, y, width * 0.88, constrain(width * 0.024, 10, 24)) + 12; // Draw the explanation.
  drawParagraph("> " + aiStatus, y, width * 0.92, constrain(width * 0.018, 9, 16)); // Show what the player can do next.
} // End fortune drawing.

// Wrap a message to fit the available screen width and return its ending position.

function drawParagraph(message, y, maxWidth, size) {
  // Draws a centered paragraph and automatically moves words to new lines.
  // message = text, y = starting height, maxWidth = maximum line width, size = font size.

  textSize(size); // Sets the font size used when measuring and drawing text.
  textLeading(size * 1.22); // Sets the vertical spacing between lines to 1.22 times the font size.
  textAlign(CENTER, TOP); // Centers text horizontally and aligns it from the top.

  const lines = []; // Stores each completed line before drawing the paragraph.
  for (const paragraph of String(message).split("\n")) {
    // Converts the message to text and separates existing paragraphs at line breaks.
    let line = ""; // Temporarily stores the words belonging to the current line.
    for (const word of paragraph.split(/\s+/)) {
      // Splits the paragraph into individual words using whitespace as the separator.
      const candidate = line ? line + " " + word : word;
      // Creates a test line by adding the next word, including a space when needed.

      if (line && textWidth(candidate) > maxWidth) {
        // Checks whether adding the word would make the current line too wide.
        // textWidth() measures the actual width of the text in pixels.
        lines.push(line); // Saves the completed line in the array.
        line = word; // Starts a new line with the word that did not fit.
      } else {
        line = candidate; // Keeps the new word on the current line if there is space.
      }
    }
    if (line) lines.push(line); // Saves the final line of the current paragraph.
  }

  const lineHeight = size * 1.22; // Calculates the vertical distance between each line.
  lines.forEach((line, index) => {
    // Goes through every stored line; index represents its position in the array.
    text(line, width / 2, y + index * lineHeight);
    // Draws each line at the horizontal center of the canvas.
    // The index calculation moves every following line down by one lineHeight.
  });

  textAlign(CENTER, CENTER); // Restores the text alignment used by the rest of the application.
  return y + lines.length * lineHeight;
  // Returns the vertical position after the paragraph so other content can be placed below it.
}


// Requests a fortune and its explanation from the local Ollama AI model.
async function generateFortune() {
  // async allows this function to wait for the AI without freezing the browser.
  const controller = new AbortController(); // Creates a controller that can cancel the HTTP request.
  fortuneController = controller; // Stores the controller so another spin can cancel this request.
  aiStatus = "FORTUNE ROULETTE: WRITING YOUR FORTUNE..."; // Updates the interface while the AI generates text.
  startWaitingSound(); // Plays the suspense sound while waiting for the response.

  try {
    // Starts error handling for the request and response processing.
    const response = await fetch(ollamaUrl, {
      // Sends a request to the local Ollama API and waits for its response.
      method: "POST", // Uses POST because the application sends data to the server.
      headers: { "Content-Type": "application/json" }, // Tells Ollama that the request contains JSON data.
      signal: controller.signal, // Connects the request to the cancellation controller.
      body: JSON.stringify({
        // Converts the following JavaScript object into JSON text for Ollama.
        model, // Selects the local AI model configured elsewhere in the application.
        stream: false, // Requests the complete response at once instead of receiving it in pieces.
        think: false, // Asks supported Qwen models to disable separate reasoning output.
        format: {
          // Defines the expected structure of the AI's response.
          type: "object", // Requires the response to be a JSON object.
          properties: {
            sentence: { type: "string" }, // Defines the fortune as a text property.
            explanation: { type: "string" } // Defines the explanation as a separate text property.
          },
          required: ["sentence", "explanation"], // Makes sure both properties must be included.
          additionalProperties: false // Prevents additional, unrequested properties.
        },
        messages: [
          // Sends the AI its instructions and the words selected by the roulette.
          {
            role: "system", // Defines the general instructions and writing rules for the AI.
            content: "Write a short fortune in clear, everyday English. Use all five symbols in the exact order given. Write one direct sentence of no more than 35 words. Then explain it in a second plain-language sentence of no more than 20 words, with a practical meaning. Avoid jargon and guaranteed predictions. Return JSON with sentence and explanation."
            // Specifies the writing style, word limits, symbol order and required JSON format.
          },
          {
            role: "user", // Supplies the specific words from the current roulette spin.
            content: "Use all five words exactly and in this order: " + words.join(", ") +
              ". Keep both sentences easy to understand."
            // join(", ") combines the words array into one comma-separated string.
            // The AI receives the actual words selected by the reels in their original order.
          }
        ],
        options: { temperature: 0.6, num_predict: 120 }
        // temperature controls creativity, while num_predict limits the generated tokens.
      })
    });

    if (!response.ok) {
      // Checks whether the HTTP request succeeded (status code 200–299).
      const errorBody = await response.json().catch(() => ({}));
      // Attempts to read Ollama's error message; returns an empty object if parsing fails.
      const details = errorBody.error || "Ollama returned HTTP " + response.status;
      // Uses Ollama's error description or creates a fallback message with the HTTP status.

      if (response.status === 404) {
        // Checks whether the requested model or API endpoint could not be found.
        throw new Error("MODEL NOT FOUND • RUN: ollama pull " + model);
        // Stops execution and creates an error explaining how to download the model.
      }
      throw new Error(details); // Passes other HTTP errors to the catch block.
    }

    const result = await response.json();
    // Converts Ollama's response from JSON text into a JavaScript object.
    const generated = JSON.parse(result.message.content);
    // Extracts the AI's generated text and converts its JSON string into an object.

    if (!generated.sentence || !generated.explanation) {
      // Checks that both required properties exist and contain values.
      throw new Error("The model did not return both a sentence and an explanation.");
      // Throws an error if the AI response is incomplete.
    }

    fortune = generated.sentence; // Stores the generated fortune for display.
    explanation = generated.explanation; // Stores its explanation separately.
    aiStatus = "FORTUNE ROULETTE: FORTUNE READY • PRESS TO SPIN AGAIN"; // Updates the interface when generation finishes.
    stopWaitingSound(); // Stops the suspense sound.
    playResultSound(); // Plays the sound indicating that the fortune is ready.

  } catch (error) {
    // Handles errors from the request, response parsing or cancellation.
    if (error.name === "AbortError") return; // Ignores requests intentionally cancelled by the application.
    console.error("Fortune roulette error:", error); // Prints technical error information for debugging.

    aiStatus = error instanceof TypeError
        ? "OLLAMA CONNECTION FAILED • START OLLAMA"
        : "FORTUNE ROULETTE ERROR: " + error.message;
    // Uses a ternary condition to display different messages depending on the error.
    // TypeError indicates a likely connection problem; other errors show their message.

  } finally {
    // Executes cleanup regardless of whether the request succeeded or failed.
    if (fortuneController === controller) {
      // Makes sure this is still the active request before clearing its controller.
      stopWaitingSound(); // Ensures the waiting sound is no longer playing.
      fortuneController = undefined; // Clears the reference to the completed request.
    }
  }
}


// Connects the browser to a physical micro:bit using the Web Serial API.
async function connectSerial() {
  // async allows the browser to wait for device selection and connection.
  try {
    unlockAudio(); // Enables audio after the user's interaction with the connect button.
    const port = await navigator.serial.requestPort();
    // Opens the browser's device selection window and stores the selected serial port.
    await port.open({ baudRate: 115200 });
    // Opens communication with the micro:bit at 115200 bits per second.

    connectionMessage = "PRESS THE MICROBIT TO BEGIN"; // Displays the connection-ready message.
    connectButton.hide(); // Hides the connection button after successful pairing.
    readSerial(port); // Starts listening for incoming messages from the micro:bit.

  } catch (error) {
    // Handles problems such as denied permission or an unsuccessful connection.
    console.error("Could not connect to the micro:bit:", error); // Prints the technical error for debugging.
    connectionMessage = "MICROBIT CONNECTION FAILED"; // Displays a connection failure message.
  }
}


// Reads messages from the micro:bit and starts a spin when it sends PRESS.
async function readSerial(port) {
  try {
    const decoder = new TextDecoderStream();
    // Creates a decoder that converts incoming serial bytes into readable text.
    port.readable.pipeTo(decoder.writable);
    // Connects the micro:bit's incoming data stream to the text decoder.
    const reader = decoder.readable.getReader();
    // Creates a reader that lets the program receive decoded messages.

    while (true) {
      // Continuously listens for incoming data until the connection closes.
      const { value, done } = await reader.read();
      // Waits for new data and extracts its value and completion status.
      // value contains received text; done indicates whether the stream has ended.

      if (done) break; // Exits the loop when the serial stream closes.
      serialBuffer += value; // Adds incoming text to the buffer in case a message is incomplete.

      const lines = serialBuffer.split("\n");
      // Separates complete messages wherever a newline character appears.
      serialBuffer = lines.pop();
      // Keeps the final potentially incomplete message for the next data update.

      for (const line of lines) {
        // Processes each complete message received from the micro:bit.
        if (line.trim() === "PRESS") advanceMachine();
        // Removes surrounding whitespace and checks whether the message is PRESS.
        // If it matches, advanceMachine() starts the roulette action.
      }
    }

  } catch (error) {
    // Handles errors caused by interrupted or failed serial communication.
    console.error("Serial read error:", error); // Prints the error in the browser console.
    connectionMessage = "MICROBIT CONNECTION LOST"; // Informs the player that communication was interrupted.
  }
}


// Draws green text in multiple layers to simulate an old CRT monitor glow.
function terminalText(message, x, y, size) {
  textSize(size); // Sets the font size for all three text layers.

  fill(0, 60, 0); // Selects a dark green RGB colour for the outer glow.
  text(message, x + 4, y + 4); // Draws the first layer slightly below and to the right.

  fill(0, 120, 0); // Changes to a brighter green for the middle glow.
  text(message, x + 2, y + 2); // Draws the second layer closer to the original position.

  fill(0, crtBrightness, 0); // Uses the crtBrightness variable to control the main text colour.
  text(message, x, y); // Draws the sharp final layer at the original position.
}


// Automatically adjusts the canvas when the browser window changes size.
function windowResized() {
  resizeCanvas(windowWidth, max(windowHeight, 720));
  // Sets the canvas width to the browser width and its height to the larger
  // of the browser height or 720 pixels, keeping enough space for the interface.
}
