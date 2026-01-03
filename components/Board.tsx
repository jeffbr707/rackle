"use client";

import type { Guess, TileStatus } from "@/lib/game";

function tileClass(st?: TileStatus, filled?: boolean) {
  if (!filled) return "tile empty";
  if (!st) return "tile";
  return `tile ${st}`;
}

export function Board({
  guesses,
  currentInput,
  maxRounds,
}: {
  guesses: Guess[];
  currentInput: string;
  maxRounds: number;
}) {
  const activeRow = guesses.length;

  const rows = [];
  for (let r = 0; r < maxRounds; r++) {
    const g = guesses[r];

    const isActive = !g && r === activeRow;
    const letters = g
      ? g.word.split("")
      : isActive
        ? currentInput.padEnd(5, " ").split("")
        : "     ".split("");

    const statuses = g?.statuses;

    rows.push(
      <div className="row" key={r}>
        {letters.slice(0, 5).map((ch, i) => {
          const filled = ch.trim().length > 0;
          return (
            <div className={tileClass(statuses?.[i], filled)} key={i}>
              {filled ? ch : "•"}
            </div>
          );
        })}
      </div>
    );
  }

  return <div className="board">{rows}</div>;
}
