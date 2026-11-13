# The Algorithm of Fate

A CRT-style fortune slot machine controlled by a micro:bit. After each spin, a
local Ollama model turns the three reel words into a short fortune and a
plain-language explanation of its meaning.
The words and generated text stay on your machine; no hosted AI service is used.

## Run with local AI

1. Install [Ollama](https://ollama.com/) and download a small model that fits
   this project. The app only needs a lightweight text model for a short
   fortune sentence and a brief explanation, so a 1B-3B model is usually enough:

   ```powershell
   ollama pull qwen3:1.7b
   ```

   Good fits for this project:
   - `qwen3:1.7b` — best balance of speed and quality for short fortune text
   - `llama3.2:3b-instruct` — reliable for short creative text, slightly heavier
   - `gemma3:1b` — very lightweight, but a bit less consistent for structured JSON output

   Larger models such as `qwen3:8b` are not necessary for this project and use much more RAM.

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

The reels draw from a shared pool of words across all themes. Click **Spin** to
play without the micro:bit. The reels make different sounds while spinning and
when each one stops; use **Sound: On/Off** to mute or unmute. The interface
adapts to narrow and short screens; very short screens can scroll vertically.

If the model is not installed, the status tells you to run
`ollama pull qwen3:1.7b`; then spin again. If Ollama is unavailable, the
machine displays its built-in fortune and a connection error. Verify that the
page is open at `http://127.0.0.1:8000` and that the Ollama desktop app is
running. Opening the page directly as `file://` is not supported.

## Ideas for future features

- Add themed prompt modes, such as cyberpunk, horror, or absurdist poetry.
- Save and replay a history of spins and their fortunes.
- Turn fortunes into animated CRT text or generative visuals.
- Add a difficulty or creativity setting that adjusts local model parameters.
- Support more reel categories, custom word packs, and multiple local models.
