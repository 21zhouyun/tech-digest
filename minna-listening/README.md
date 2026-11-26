# みんなの日本語 聴解 (Minna no Nihongo Listening PWA)

Lesson listening player for **みんなの日本語 初級 I・II 第3版** — feature 1 only.

Live: https://21zhouyun.github.io/tech-digest/minna-listening/

## What it does

- Lesson list: Lesson 0 (発音・教室のことば・あいさつ・数字) + Lessons 1–50, grouped 初級 I (1–25) / 初級 II (26–50)
- Each lesson: 会話 first, then 問題 1/2/3
- Player: play/pause, prev/next track, seek bar, speed 0.5 / 0.75 / 1 / 1.25 / 1.5, −5s / +10s skip, repeat (off / one / all), A–B loop, shadowing mode (3s pause after each track before auto-advancing), ×3 repeat per track
- Progress: mark a lesson done (checkbox), stored in localStorage, with a x/51 progress bar
- Practice （聞き取り穴埋め）: tap-only dictation fill-in-blank for Lessons 1–25 — 200 blanks. Tap a sentence to hear just that sentence, tap one of 4 options, get instant feedback and the full sentence. No typing, no speaking, subway-friendly. Progress saved in localStorage.
- PWA: installable (Add to Home Screen on iPhone Safari), app shell cached offline; audio is cached on first play, so a track works offline after you have listened to it once

No vocab section, no TTS. Transcripts for the practice are automatic speech recognition (Whisper small, local) of the official audio — sentences that could not be verified were left out of the exercises rather than risking a wrong sentence.

## Audio — attribution

Audio © **3A Corporation (スリーエーネットワーク)**. These are the official
free downloads from the publisher: the 会話 (conversation) and 問題 (practice
questions) audio, plus the Lesson 0 intro, for 初級 I and 初級 II 第3版.

- 初級 I: https://www.3anet.co.jp/np/resrcs/130020/
- 初級 II: https://www.3anet.co.jp/np/resrcs/140020/

172 MP3s bundled for personal study with the purchased textbook. The
文型 / 例文 / 練習 / ことば audio is paid and is **not** included.
Do not redistribute or use commercially.

## Files

- `index.html` — single-page app shell (mobile-first)
- `app.js` — player logic
- `lessons.js` — lesson/track list (labels derived from filenames)
- `exercises-data.js` — 200 fill-in-blank exercises (Lessons 1–25), generated from Whisper transcripts; builder script at `/tmp/minna/build_exercises.py`, raw transcripts kept in `~/workspace/minna-transcripts/` (not deployed)
- `exercises.js` — practice UI + segment playback
- `manifest.webmanifest`, `sw.js`, `icons/`
- `audio/` — 172 MP3s (~185 MB)

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000/
```
