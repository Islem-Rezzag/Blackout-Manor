import { z } from "zod";

const webEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Blackout Manor"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://127.0.0.1:3000"),
  NEXT_PUBLIC_CLIENT_GAME_MODE: z.enum(["mock", "live"]).default("mock"),
  NEXT_PUBLIC_MATCH_ROOM_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_MATCH_SERVER_URL: z.string().url().default("ws://127.0.0.1:2567"),
  NEXT_PUBLIC_MATCH_PLAYER_ID: z.string().min(1).optional(),
});

export const env = webEnvSchema.parse(process.env);
