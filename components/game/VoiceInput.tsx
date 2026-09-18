"use client";
import { useEffect, useRef, useState } from "react";
import { toWave } from "@/lib/speech/wav";
import { Mic, Square, RotateCcw, Keyboard } from "lucide-react";
export function VoiceInput({
  onText,
  onListening,
  disabled = false,
}: {
  onText: (text: string) => void;
  onListening: (active: boolean) => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<
    "idle" | "permission" | "listening" | "transcribing" | "ready" | "error"
  >("idle");
  const [seconds, setSeconds] = useState(0),
    [notice, setNotice] = useState("");
  const recorder = useRef<MediaRecorder | null>(null),
    media = useRef<MediaStream | null>(null);
  const alive = useRef(true),
    locked = useRef(false),
    abort = useRef<AbortController | null>(null);
  const listeningCallback = useRef(onListening),
    textCallback = useRef(onText);
  useEffect(() => {
    listeningCallback.current = onListening;
    textCallback.current = onText;
  }, [onListening, onText]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      abort.current?.abort();
      if (recorder.current) {
        recorder.current.onstop = null;
        if (recorder.current.state === "recording") recorder.current.stop();
      }
      media.current?.getTracks().forEach((t) => t.stop());
      listeningCallback.current(false);
    };
  }, []);
  useEffect(() => {
    if (state !== "listening") return;
    const stop = () => {
      if (recorder.current?.state === "recording") recorder.current.stop();
    };
    const hide = () => {
      if (document.hidden) stop();
    };
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", hide);
    const timer = setInterval(() => setSeconds((n) => n + 1), 1000);
    const limit = setTimeout(() => {
      if (recorder.current?.state === "recording") recorder.current.stop();
    }, 30000);
    return () => {
      clearInterval(timer);
      clearTimeout(limit);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [state]);
  function typeInstead() {
    if (recorder.current?.state === "recording") recorder.current.stop();
    const field = document.activeElement
      ?.closest(".voice-input")
      ?.parentElement?.querySelector("textarea");
    field?.focus();
  }
  async function start() {
    if (locked.current || disabled) return;
    locked.current = true;
    setNotice("");
    setState("permission");
    setSeconds(0);
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error("unsupported");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      media.current = stream;
      const rec = new MediaRecorder(stream);
      recorder.current = rec;
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        listeningCallback.current(false);
        if (!alive.current) return;
        setState("transcribing");
        const controller = new AbortController();
        abort.current = controller;
        try {
          const audio = await toWave(new Blob(chunks, { type: rec.mimeType }));
          const form = new FormData();
          form.set("audio", audio, "idea.wav");
          const response = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: form,
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(20000),
            ]),
          });
          if (!response.ok) throw new Error("unavailable");
          const data: unknown = await response.json();
          if (
            !data ||
            typeof data !== "object" ||
            !("text" in data) ||
            typeof data.text !== "string" ||
            !data.text.trim()
          )
            throw new Error("empty");
          if (!alive.current) return;
          textCallback.current(data.text.trim().slice(0, 800));
          setState("ready");
          setNotice("I heard: edit your words below, then send your idea.");
        } catch {
          if (alive.current) {
            setState("error");
            setNotice(
              "Hmm… my ears did the robot thing. Try once more, or type your idea.",
            );
          }
        } finally {
          locked.current = false;
          recorder.current = null;
          chunks.length = 0;
        }
      };
      rec.start();
      setState("listening");
      listeningCallback.current(true);
    } catch {
      locked.current = false;
      if (alive.current) {
        setState("error");
        setNotice(
          "I can’t hear your microphone right now. You can type it to me!",
        );
        listeningCallback.current(false);
      }
    }
  }
  const active = state === "listening";
  return (
    <div className="voice-input">
      <div className="voice-controls">
        <button
          type="button"
          className={`voice-button ${active ? "listening" : ""}`}
          disabled={
            disabled || state === "permission" || state === "transcribing"
          }
          onClick={() => (active ? recorder.current?.stop() : void start())}
          aria-label={active ? "Stop recording" : "Talk to Pip"}
        >
          {active ? <Square size={19} /> : <Mic size={21} />}
          {active
            ? "Stop recording"
            : state === "transcribing"
              ? "Writing down your idea…"
              : state === "permission"
                ? "Opening microphone…"
                : "Talk to Pip"}
        </button>
        {(state === "ready" || state === "error") && (
          <button
            type="button"
            className="text-button"
            onClick={() => void start()}
            disabled={disabled}
          >
            <RotateCcw size={15} />
            Try again
          </button>
        )}
        <button type="button" className="text-button" onClick={typeInstead}>
          <Keyboard size={16} />
          Type instead
        </button>
      </div>
      {active && (
        <div className="voice-wave" role="status">
          <span aria-hidden="true">▂ ▅ ▃ ▇ ▄ ▆ ▂</span> Listening… 0:
          {String(seconds).padStart(2, "0")} / 0:30
        </div>
      )}
      <p className="voice-disclosure">
        Tap to talk, tap to stop. Check your words before teaching Pip.
        Recordings aren’t saved.
      </p>
      {notice && (
        <p className="voice-notice" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
