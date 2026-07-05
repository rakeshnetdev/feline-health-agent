"use client";

import { Chat } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useState } from "react";

const ASSISTANT_ID = "simple_agent";

export default function Page() {
  const [loading, setLoading] = useState(false);

  const wakeServer = async () => {
    setLoading(true);
    try {
      await fetch("https://langgraph-api-zaxu.onrender.com/", { mode: "no-cors" });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-background relative">
      <Button 
        onClick={wakeServer} 
        disabled={loading}
        className="absolute top-4 right-4 z-50 shadow-md"
        variant="secondary"
      >
        <Play className="mr-2 h-4 w-4" />
        {loading ? "Starting..." : "Start Server"}
      </Button>
      <Chat assistantId={ASSISTANT_ID} />
    </main>
  );
}
