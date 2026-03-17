import { redirect } from "next/navigation";

import { env } from "@/env";

export default function GameBootstrapPage() {
  redirect(`/game/${env.NEXT_PUBLIC_MATCH_ROOM_ID ?? "demo"}`);
}
