import { redirect } from "next/navigation";

import { env } from "@/env";

export default function HomePage() {
  redirect(`/game/${env.NEXT_PUBLIC_MATCH_ROOM_ID ?? "demo"}`);
}
