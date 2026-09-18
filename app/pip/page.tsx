"use client";
import {
  SkillConstellation,
  Notebook,
  NextQuest,
} from "@/components/game/SkillConstellation";
import Link from "@/components/game/AppLink";
import {
  BookOpen,
  Telescope,
  Sparkles,
  Leaf,
  ArrowRight,
  Check,
} from "lucide-react";
import { Header, Footer } from "@/components/game/Chrome";
import { Pip } from "@/components/pip/Pip";
import { useSession } from "@/components/game/SessionProvider";
import { lessons } from "@/content/curriculum";
import { StarCore, PipCloset } from "@/components/game/Progression";
import { progression } from "@/lib/learning/progression";
import { skillState } from "@/lib/learning/model";
import { skills } from "@/content/skills";
export default function PipRoom() {
  const { session } = useSession(),
    level = progression(session.xp).level,
    learned = lessons.filter((l) => skills.some(skill=>skill.lessonId===l.id && skillState(session.learning,skill.id).mastered && session.learning.some(e=>!e.seeded && e.skillId===skill.id && e.kind==="transfer" && e.result==="demonstrated")));
  return (
    <main className="room-page">
      <Header />
      <div className="room-heading">
        <span className="eyebrow">A PLACE FOR EVERYTHING YOU’VE TAUGHT ME</span>
        <h1>Pip’s little corner of the universe.</h1>
        <p>Every discovery leaves a little light behind.</p>
      </div>
      <div className="room-stage">
        <div className={`room-art ${level >= 5 ? "restored" : ""}`} />
        <div className="room-pip">
          <div className="speech small">
            {learned.length
              ? `You taught me ${learned.at(-1)!.title.toLowerCase()}. I saved our notebook.`
              : "It’s a little quiet. Shall we learn something?"}
          </div>
          <Pip
            size={250}
            mood={learned.length ? "excited" : "curious"}
            cosmetic={session.progression.equipped}
          />
        </div>
        <div
          className={`artifact artifact-telescope ${level >= 3 ? "unlocked" : ""}`}
        >
          <Telescope size={28} />
          <span>
            {level >= 3 ? "Telescope restored" : "Telescope waiting"}
          </span>
          <small>
            {level >= 3
              ? "A clearer view of what comes next"
              : "Restores at Level 3"}
          </small>
        </div>
        <div
          className={`artifact artifact-plant ${session.learning.some(e=>!e.seeded && e.result==="demonstrated") ? "unlocked" : ""}`}
        >
          <Leaf size={25} />
          <span>
            {session.learning.some(e=>!e.seeded && e.result==="demonstrated") ? "Moonleaf is growing" : "A sleeping moonleaf"}
          </span>
          <small>
            {session.learning.some(e=>!e.seeded && e.result==="demonstrated")
              ? "Your first idea woke it up"
              : "Awakens with your first discovery"}
          </small>
        </div>
        <div
          className={`artifact artifact-library ${level >= 5 ? "unlocked" : ""}`}
        >
          <BookOpen size={25} />
          <span>
            {level >= 5
              ? "Star projector is awake"
              : "The star projector"}
          </span>
          <small>
            {level >= 5
              ? "A home for your understanding"
              : "Illuminates at Level 5"}
          </small>
        </div>
      </div>
      <section className="pip-profile">
        <div>
          <span className="profile-level">LEVEL {level}</span>
          <h2>{progression(session.xp).current.name}</h2>
          <p>
            {learned.length}{" "}
            {learned.length === 1 ? "discovery" : "discoveries"} collected ·{" "}
            {session.misconceptions.filter((m) => m.resolvedAt).length}{" "}
            misconceptions reconsidered
          </p>
        </div>
        <div className="profile-xp">
          <span>
            <Sparkles size={14} />
            {session.xp} XP
            <small>{150 - (session.xp % 150)} to the next level</small>
          </span>
          <div className="core-meter"><i style={{width:`${(session.xp % 150)/150*100}%`}}/></div>
        </div>
      </section>
      <StarCore/>
      <PipCloset/>
      <section className="knowledge-collection">
        <div className="collection-heading">
          <h2>Pip’s discoveries</h2>
          <span>
            {learned.length} / {lessons.length} discoveries
          </span>
        </div>
        <div className="knowledge-orbs">
          {lessons.map((l) => (
            <Link
              key={l.id}
              href={`/play/${l.world}`}
              className={`collection-orb ${skills.some(skill=>skill.lessonId===l.id && skillState(session.learning,skill.id).mastered && session.learning.some(e=>!e.seeded && e.skillId===skill.id && e.kind==="transfer" && e.result==="demonstrated")) ? "learned" : ""}`}
            >
              <span>
                {skills.some(skill=>skill.lessonId===l.id && skillState(session.learning,skill.id).mastered && session.learning.some(e=>!e.seeded && e.skillId===skill.id && e.kind==="transfer" && e.result==="demonstrated")) ? (
                  <Check size={22} />
                ) : (
                  <Sparkles size={22} />
                )}
              </span>
              <b>{l.id==="moonberry-mix-up" ? "Moonberry Bottle" : l.title}</b>
              <small>
                {skills.some(skill=>skill.lessonId===l.id && skillState(session.learning,skill.id).mastered && session.learning.some(e=>!e.seeded && e.skillId===skill.id && e.kind==="transfer" && e.result==="demonstrated"))
                  ? "You taught me this"
                  : "Waiting to be discovered"}
              </small>
            </Link>
          ))}
        </div>
        <Link href="/world" className="button gold">
          Find our next discovery <ArrowRight size={18} />
        </Link>
      </section>
      <SkillConstellation />
      <Notebook />
      <NextQuest />
      <Footer />
    </main>
  );
}
