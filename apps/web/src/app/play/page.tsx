import { redirect } from "next/navigation";

import { env } from "@/env";

type LegacyPlayPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlayPage({ searchParams }: LegacyPlayPageProps) {
  const resolvedSearchParams = await searchParams;
  const nextSearch = new URLSearchParams();
  const viewParam = Array.isArray(resolvedSearchParams.view)
    ? resolvedSearchParams.view[0]
    : resolvedSearchParams.view;
  const requestedRoomId = Array.isArray(resolvedSearchParams.roomId)
    ? resolvedSearchParams.roomId[0]
    : resolvedSearchParams.roomId;
  const roomId = requestedRoomId ?? env.NEXT_PUBLIC_MATCH_ROOM_ID ?? "demo";

  if (viewParam === "replay") {
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (typeof value === "string") {
        nextSearch.set(key, value);
        continue;
      }

      for (const item of value ?? []) {
        nextSearch.append(key, item);
      }
    }

    redirect(
      nextSearch.size > 0 ? `/dev/play?${nextSearch.toString()}` : "/dev/play",
    );
  }

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (key === "view" || key === "roomId") {
      continue;
    }

    if (typeof value === "string") {
      nextSearch.set(key, value);
      continue;
    }

    for (const item of value ?? []) {
      nextSearch.append(key, item);
    }
  }

  redirect(
    nextSearch.size > 0
      ? `/game/${roomId}?${nextSearch.toString()}`
      : `/game/${roomId}`,
  );
}
