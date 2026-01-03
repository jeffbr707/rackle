# Rackle

A Wordle-spinoff where you guess using a limited **letter rack** that changes over time.

## Rules
- Guess the daily 5-letter word in 5 rounds.
- You can only use letters currently in your rack (counts matter).
- After each guess:
  - **Gray** letters are burned (removed from your rack, per instance).
  - **Yellow/Green** letters stay.
  - You then draw **2 new letters**.
- The initial rack includes all letters needed for the day’s answer (so it’s solvable).

## Run locally
```bash
npm install
npm run dev
```

## Deploy on Vercel
1. Push this repo to GitHub.
2. In Vercel: **New Project** → Import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. Deploy.

## Customize
- Expand the word list in `lib/words.ts`.
