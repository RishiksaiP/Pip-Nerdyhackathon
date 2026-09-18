import { z } from "zod";
export const providerIds = [
  "auto",
  "ollama",
  "llamacpp",
  "openai",
  "demo",
] as const;
export const aiSettingsSchema = z
  .object({
    provider: z.enum(providerIds).default("auto"),
    quality: z.boolean().default(false),
  })
  .strict();
export type AISettings = z.infer<typeof aiSettingsSchema>;
export const defaultAISettings: AISettings = {
  provider: "auto",
  quality: false,
};
