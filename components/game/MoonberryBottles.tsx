"use client";
import { useId } from "react";
export function MoonberryBottle({
  n,
  d,
  selected,
  onClick,
}: {
  n: number;
  d: number;
  selected?: boolean;
  onClick: () => void;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <button
      className={`moonberry-bottle ${selected ? "selected" : ""}`}
      aria-label={`Moonberry Potion, ${n}/${d} full`}
      aria-pressed={!!selected}
      onClick={onClick}
    >
      <svg viewBox="0 0 160 220" aria-hidden="true">
        <defs>
          <clipPath id={id}>
            <rect x="35" y="65" width="90" height="130" rx="6" />
          </clipPath>
          <linearGradient id={`${id}-liquid`} x2="0" y2="1">
            <stop stopColor="#c6afff" />
            <stop offset="1" stopColor="#8354cd" />
          </linearGradient>
        </defs>
        <path
          d="M60 25h40v25l29 19v125q0 9-9 9H40q-9 0-9-9V69l29-19Z"
          fill="#eee7ff"
          fillOpacity=".12"
          stroke="#d9d0ed"
          strokeWidth="3"
        />
        <rect
          x="35"
          y={195 - (130 * n) / d}
          width="90"
          height={(130 * n) / d}
          fill={`url(#${id}-liquid)`}
          clipPath={`url(#${id})`}
        />
        <path
          d="M39 65h82"
          stroke="#d9d0ed"
          strokeDasharray="3 4"
          opacity=".65"
        />
        <path
          d="M41 77v103"
          stroke="white"
          strokeWidth="4"
          opacity=".25"
          strokeLinecap="round"
        />
        <rect x="57" y="17" width="46" height="17" rx="4" fill="#d7ae76" />
        <path
          d="m80 87 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z"
          stroke="#ddd1ed"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <strong>
        {n}/{d} <small>full</small>
      </strong>
      <span>Moonberry Potion</span>
      <small>Same bottle · 1 whole</small>
    </button>
  );
}
export function MoonberryBottles({
  choice,
  onChoice,
}: {
  choice: string;
  onChoice: (v: string) => void;
}) {
  return (
    <div className="moonberry-pair">
      <MoonberryBottle
        n={1}
        d={4}
        selected={choice === "quarter"}
        onClick={() => onChoice("quarter")}
      />
      <span className="bottle-or">or</span>
      <MoonberryBottle
        n={1}
        d={8}
        selected={choice === "eighth"}
        onClick={() => onChoice("eighth")}
      />
    </div>
  );
}
