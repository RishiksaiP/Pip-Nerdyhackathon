"use client";
import { useId, useRef, useEffect, useState } from "react";
import { useSession } from "../game/SessionProvider";
export type Mood =
  | "idle"
  | "curious"
  | "listening"
  | "thinking"
  | "confused"
  | "eureka"
  | "excited"
  | "mastery"
  | "levelUp"
  | "writing"
  | "looking_at_math"
  | "waiting"
  | "proud"
  | "gentle_failure"
  | "aha"
  | "celebrate";
export function Pip({
  mood = "idle",
  size = 220,
  accessory = false,
  cosmetic,
}: {
  mood?: Mood;
  size?: number;
  accessory?: boolean;
  cosmetic?: string | null;
}) {
  const {session}=useSession();
  const outfit=cosmetic ?? session.progression.equipped;
  const [boops,setBoops]=useState(0);
  const [booped,setBooped]=useState(false);
  useEffect(()=>{if(!booped)return;const t=setTimeout(()=>setBooped(false),1700);return()=>clearTimeout(t);},[booped]);
  const id = useId().replace(/:/g, "");
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const look = (event: PointerEvent) => {
      const node = root.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const x = Math.max(
        -4,
        Math.min(4, (event.clientX - rect.x - rect.width / 2) / 100),
      );
      const y = Math.max(
        -3,
        Math.min(3, (event.clientY - rect.y - rect.height / 2) / 100),
      );
      node
        .querySelector(".pip-gaze")
        ?.setAttribute("transform", `translate(${x} ${y})`);
    };
    window.addEventListener("pointermove", look, { passive: true });
    return () => window.removeEventListener("pointermove", look);
  }, []);
  return (
    <div
      ref={root}
      className={`pip pip-${mood}`}
      style={{ width: size }}
      role="button" tabIndex={0}
      aria-label={`Boop Pip · Pip feels ${mood}`}
      onClick={()=>{setBoops(n=>n+1);setBooped(true);}}
      onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setBoops(n=>n+1);setBooped(true);}}}
    >
      {mood === "writing" && (
        <span className="pip-pencil" aria-hidden="true">
          ✎
        </span>
      )}
      <svg viewBox="0 0 240 250" fill="none">
        <defs>
          <radialGradient id={id}>
            <stop stopColor="#fffdf0" />
            <stop offset=".7" stopColor="#f7efdb" />
            <stop offset="1" stopColor="#c0b6d9" />
          </radialGradient>
          <linearGradient id={`${id}ear`} x2="1" y2="1">
            <stop stopColor="#dac9ff" />
            <stop offset="1" stopColor="#9380c3" />
          </linearGradient>
        </defs>
        <ellipse cx="120" cy="228" rx="55" ry="9" fill="#090f28" opacity=".2" />
        <g className="pip-body">
          {outfit==="cape"&&<path d="M65 141 35 213q85 25 165 0l-30-72Z" fill="#645398" stroke="#d5b772" strokeWidth="3"/>}
          <path
            d="M71 88 Q29 38 49 21 Q79 19 99 78M145 78 Q163 14 192 23 Q211 43 170 94"
            fill={`url(#${id}ear)`}
            stroke="#e7dcff"
            strokeWidth="5"
          />
          <path
            d="M61 99 C69 63 170 57 185 101 C206 150 188 200 152 208 Q119 226 86 207 C47 204 38 151 61 99"
            fill={`url(#${id})`}
          />
          <ellipse
            cx="58"
            cy="168"
            rx="17"
            ry="23"
            transform="rotate(25 58 168)"
            fill="#eee7df"
          />
          <ellipse
            cx="182"
            cy="167"
            rx="17"
            ry="23"
            transform="rotate(-25 182 167)"
            fill="#d5cbdf"
          />
          <g className="pip-gaze">
            <g className="pip-eyes">
              <ellipse cx="93" cy="126" rx="14" ry="21" fill="#263047" />
              <ellipse cx="147" cy="126" rx="14" ry="21" fill="#263047" />
              <ellipse cx="98" cy="120" rx="5" ry="7" fill="white" />
              <ellipse cx="152" cy="120" rx="5" ry="7" fill="white" />
            </g>
          </g>
          {outfit==="goggles"&&<g stroke="#bd9256" strokeWidth="5"><circle cx="93" cy="127" r="22"/><circle cx="147" cy="127" r="22"/><path d="M115 126h10"/></g>}
          <ellipse
            cx="77"
            cy="151"
            rx="11"
            ry="5"
            fill="#f4b4b1"
            opacity=".65"
          />
          <ellipse
            cx="164"
            cy="151"
            rx="11"
            ry="5"
            fill="#f4b4b1"
            opacity=".65"
          />
          {mood === "confused" ? (
            <path
              d="M112 158 Q120 152 128 158"
              stroke="#4e4658"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M111 153 Q120 164 129 153"
              stroke="#4e4658"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}
          <path
            className="pip-core"
            d="m120 176 4 8 9 1-6 7 1 9-8-4-8 4 1-9-6-7 9-1z"
            fill={outfit==="core"?"#91eadb":"#e9b858"}
          />
          {(accessory || outfit==="scarf") && (
            <path
              d="M78 176 Q120 189 164 175 L162 188 Q120 201 80 189z"
              fill="#7ccbb2"
            />
          )}
          {outfit==="scarf"&&<path d="m151 184 6 34 17-6-11-29" fill="#7ccbb2"/>}
          {outfit==="compass"&&<g><circle cx="158" cy="182" r="10" fill="#253b50" stroke="#ebc87d" strokeWidth="2"/><path d="m158 174 3 8-3 8-3-8Z" fill="#ebc87d"/></g>}
          {outfit==="notebook"&&<g transform="rotate(-12 180 182)"><rect x="162" y="167" width="29" height="37" rx="3" fill="#4a467b" stroke="#e6cc8f" strokeWidth="2"/><path d="m176 175 3 6 6 1-5 4 1 7-5-3-5 3 1-7-5-4 6-1Z" fill="#e6cc8f"/></g>}
        </g>
      </svg>
      {booped&&<span className="pip-boop" role="status">{["Boop.","Important research is happening here.","I felt that."][boops%3]}</span>}
      {["thinking", "confused"].includes(mood) && (
        <span className="pip-thought">{mood === "confused" ? "?" : "···"}</span>
      )}
      {["eureka", "mastery", "levelUp"].includes(mood) && (
        <span className="pip-spark">✦</span>
      )}
    </div>
  );
}
