# The Algorithm of Fate

A CRT-style fortune slot machine controlled by a micro:bit. After each spin, a
local Ollama model turns the five reel words into a short fortune and a
plain-language explanation of its meaning.
The words and generated text stay on your machine; no hosted AI service is used.

## Run with local AI

1. Install [Ollama](https://ollama.com/) and download the model used by the app:

   ```powershell
   ollama pull qwen3:1.7b
   ```

   The app uses the lightweight `qwen3:1.7b` model. If Ollama is not running,
   open the Ollama app or start its local server with `ollama serve`.

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
when each one stops. A quiet tune plays while Ollama writes your fortune, then
a short chime plays when it is ready. Use **Sound: On/Off** to mute or unmute.
The interface adapts to narrow and short screens; very short screens can scroll
vertically.

If the model is not installed, run `ollama pull qwen3:1.7b`. If the app reports
an Ollama connection error, make sure the Ollama app or `ollama serve` is
running, then spin again. Opening the page directly as `file://` is not
supported.

## Ideas for future features

- Add themed prompt modes, such as cyberpunk, horror, or absurdist poetry.
- Save and replay a history of spins and their fortunes.
- Turn fortunes into animated CRT text or generative visuals.
- Add a difficulty or creativity setting that adjusts local model parameters.
- Support more reel categories, custom word packs, and multiple local models.
