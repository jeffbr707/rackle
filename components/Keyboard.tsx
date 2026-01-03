"use client";

import type { TileStatus } from "@/lib/game";

const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

function keyClass(st?: TileStatus, disabled?: boolean, wide?: boolean) {
  let c = "kbdKey";
  if (wide) c += " wide";
  if (st) c += ` ${st}`;
  if (disabled) c += " disabled";
  return c;
}

export function Keyboard({
  rack,
  knowledge,
  onLetter,
  onEnter,
  onBackspace,
  disabled,
}: {
  rack: Record<string, number>;
  knowledge: Record<string, TileStatus>;
  onLetter: (ch: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  disabled: boolean;
}) {
  return (
    <div className="kbd" aria-label="Keyboard">
      <div className="kbdRow" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
        {ROWS[0].split("").map((ch) => {
          const can = (rack[ch] ?? 0) > 0 && knowledge[ch] !== "absent";
          return (
            <button
              key={ch}
              className={keyClass(knowledge[ch], disabled || !can)}
              disabled={disabled || !can}
              onClick={() => onLetter(ch)}
            >
              {ch}
            </button>
          );
        })}
      </div>

      <div className="kbdRow" style={{ gridTemplateColumns: "repeat(9, 1fr)" }}>
        {ROWS[1].split("").map((ch) => {
          const can = (rack[ch] ?? 0) > 0 && knowledge[ch] !== "absent";
          return (
            <button
              key={ch}
              className={keyClass(knowledge[ch], disabled || !can)}
              disabled={disabled || !can}
              onClick={() => onLetter(ch)}
            >
              {ch}
            </button>
          );
        })}
      </div>

      <div className="kbdRow" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
        <button className={keyClass(undefined, disabled, true)} disabled={disabled} onClick={onEnter}>
          ENTER
        </button>
        {ROWS[2].split("").map((ch) => {
          const can = (rack[ch] ?? 0) > 0 && knowledge[ch] !== "absent";
          return (
            <button
              key={ch}
              className={keyClass(knowledge[ch], disabled || !can)}
              disabled={disabled || !can}
              onClick={() => onLetter(ch)}
            >
              {ch}
            </button>
          );
        })}
        <button className={"kbdKey small" + (disabled ? " disabled" : "")} disabled={disabled} onClick={onBackspace}>
            ⌫
          </button>
      </div>
    </div>
  );
}
