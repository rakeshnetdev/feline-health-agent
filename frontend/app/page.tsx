"use client";

import { Chat } from "@/components/chat";

const ASSISTANT_ID = "simple_agent";

export default function Page() {
  return (
    <main className="flex h-dvh w-full overflow-hidden bg-background">
      <Chat assistantId={ASSISTANT_ID} />
    </main>
  );
}
