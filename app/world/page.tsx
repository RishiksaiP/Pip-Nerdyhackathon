"use client";
import { StarCore } from "@/components/game/Progression";
import { getLesson } from "@/content/curriculum";
import { SkillConstellation } from "@/components/game/SkillConstellation";
import { nextMission, questProgress } from "@/lib/learning/model";
import Link from "@/components/game/AppLink";
import { useState } from "react";
import {
  Leaf,
  Gem,
  Telescope,
  Lock,
  ArrowRight,
  Compass,
  Sparkles,
} from "lucide-react";
import { Header, Footer } from "@/components/game/Chrome";
import { Pip } from "@/components/pip/Pip";
import { useSession } from "@/components/game/SessionProvider";
import { lessons, type World, worldInfo } from "@/content/curriculum";
const worlds: World[] = ["fractions", "multiplication", "place-value"];
const icons = {
  fractions: Leaf,
  multiplication: Gem,
  "place-value": Telescope,
};
export default function WorldPage() {
  const { session } = useSession(),
    [hover, setHover] = useState<World | null>(null);
  const mission = nextMission(session.learning),
    quest = questProgress(session.learning);
  return (
    <main className="world-page">
      <Header />
      <section className="world-heading">
        <span className="eyebrow">WELCOME TO THE LUMINA LAB</span>
        <h1>
          A little teaching.
          <br />
          <em>A world of possibility.</em>
        </h1>
        <p>Every idea you teach Pip brings this place back to life.</p>
      </section>
      <div className="world-map" aria-label="Learning world map">
        <svg
          className="map-path"
          viewBox="0 0 1100 510"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M230 225 Q450 510 760 390 T910 160 M230 225 Q420 60 910 160"
            fill="none"
            stroke="#f4cd7e"
            strokeWidth="2"
            strokeDasharray="3 13"
            opacity=".4"
          />
        </svg>
        {worlds.map((world, i) => {
          const Icon = icons[world],
            count = lessons.filter(
              (l) => l.world === world && session.completed.includes(l.id),
            ).length;
          return (
            <Link
              key={world}
              href={`/play/${world}`}
              className={`world-region region-${i}`}
              onMouseEnter={() => setHover(world)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="region-aura" />
              <div className={`region-land region-land-${i}`}>
                <Icon className="region-symbol" size={47} />
              </div>
              <span className="region-label">
                <Icon size={17} />
                {worldInfo[world].title}
                <ArrowRight size={17} />
              </span>
              <div className="region-progress">
                {Array.from(
                  { length: world === "fractions" ? 6 : 1 },
                  (_, j) => (
                    <span key={j} className={j < count ? "complete" : ""} />
                  ),
                )}
                <small>
                  {count === 0 ? "Ready to discover" : `${count} discoveries`}
                </small>
              </div>
              {i === 0 && (
                <span className="region-badge">START YOUR ADVENTURE</span>
              )}
            </Link>
          );
        })}
        <div className="map-pip">
          <Pip mood={hover ? "curious" : "idle"} size={150} />
          <span>Your curious companion</span>
        </div>
        <div className="future-world future-0">
          <Lock size={14} />
          Geometry Grove<small>Coming next</small>
        </div>
        <div className="future-world future-1">
          <Lock size={14} />
          Measurement Harbor<small>Coming next</small>
        </div>
        <div className="future-world future-2">
          <Lock size={14} />
          Division Depths<small>Coming next</small>
        </div>
      </div>
      <div className="mission">
        <div className="mission-icon">
          <Compass size={24} />
        </div>
        <div>
          <span className="eyebrow">TODAY’S ADVENTURE</span>
          <h3>{getLesson(mission.skill.lessonId).title}</h3>
          <p>
            {quest.count} / 3 teaching moments today · {new Set(session.learning.filter(e=>!e.seeded && e.result==="demonstrated").map(e=>e.at.slice(0,10))).size} adventure days
          </p>
        </div>
        <Link
          href={`/play/${mission.skill.world}?skill=${mission.skill.id}`}
          aria-label="Start today’s mission"
        >
          <ArrowRight size={22} />
        </Link>
      </div>
      <div className="world-note">
        <Sparkles size={14} /> Understanding makes the magic happen.
      </div>
      <StarCore/>
      <SkillConstellation />
      <Footer />
    </main>
  );
}
