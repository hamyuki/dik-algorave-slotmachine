# The Algorithm of Fate

A CRT-style fortune slot machine controlled by a micro:bit. After each spin, a
local Ollama model turns the three reel words into a short fortune and a
plain-language explanation of its meaning.
The words and generated text stay on your machine; no hosted AI service is used.

## Run with local AI

1. Install [Ollama](https://ollama.com/) and download the model if it is not
   already installed:

   ```powershell
   ollama pull qwen3:8b
   ```

2. Serve this folder from localhost (do not open `index.html` directly). For
   example, in PowerShell:

   ```powershell
   python -m http.server 8000 --bind 127.0.0.1
   ```

3. Keep the Ollama desktop app running.

4. Open `http://127.0.0.1:8000` (not the `index.html` file), connect the
   micro:bit, and spin. The browser sends the reel words to Ollama at
   `127.0.0.1:11434`; the generated fortune and its explanation appear below
   the reels.

Use the word-pack menu to switch between Nature, Emotions, Space, and Mythology.
Click **Spin** to play without the micro:bit. The reels make different sounds
while spinning and when each one stops; use **Sound: On/Off** to mute or unmute.

If Ollama is unavailable or the model is not installed, the machine displays
its built-in fortune and an error status. If the browser reports a network
error, verify the page is open at `http://127.0.0.1:8000` and that the Ollama
desktop app is running. Opening the page directly as `file://` is not supported.

## Ideas for future features

- Add themed prompt modes, such as cyberpunk, horror, or absurdist poetry.
- Save and replay a history of spins and their fortunes.
- Turn fortunes into animated CRT text or generative visuals.
- Add a difficulty or creativity setting that adjusts local model parameters.
- Support more reel categories, custom word packs, and multiple local models.
