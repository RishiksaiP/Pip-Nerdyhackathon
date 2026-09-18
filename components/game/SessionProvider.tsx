"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  freshSession,
  localRepository,
  type Session,
} from "@/lib/persistence/store";
import { registerEvidenceTool } from "@/lib/persistence/webmcp";
import { z } from "zod";
type Context = {
  session: Session;
  ready: boolean;
  update: (fn: (s: Session) => Session) => void;
  persistent: boolean;
  aiPolicy: { strictLocal: boolean; aiTimeoutMs: number; provider: string };
};
const SessionContext = createContext<Context | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(() => freshSession()),
    [ready, setReady] = useState(false),
    [persistent, setPersistent] = useState(true),
    [aiPolicy, setAiPolicy] = useState({
      strictLocal: true,
      aiTimeoutMs: 15000,
      provider: "llamacpp",
    });
  const current = useRef(session);
  useEffect(() => {
    current.current = localRepository.load();
    setSession(current.current);
    const controller = new AbortController();
    void fetch("/api/health", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("health");
        return r.json();
      })
      .then((raw) => {
        const data = z
          .object({
            strictLocal: z.boolean(),
            aiTimeoutMs: z.number(),
            provider: z.string(),
          })
          .parse(raw);
        setAiPolicy(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setReady(true);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => registerEvidenceTool(() => current.current), []);
  const update = useCallback((fn: (s: Session) => Session) => {
    const next = fn(current.current);
    current.current = next;
    setSession(next);
    setPersistent(localRepository.save(next));
  }, []);
  return (
    <SessionContext.Provider
      value={{ session, ready, update, persistent, aiPolicy }}
    >
      {children}
      {!persistent && (
        <div className="storage-note" role="status">
          Storage is unavailable. Progress lasts until you leave or reload this
          page.
        </div>
      )}
    </SessionContext.Provider>
  );
}
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("Missing session provider");
  return value;
}
