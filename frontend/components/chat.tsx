"use client";

import { useEffect, useRef, useState } from "react";
import { useStream } from "@langchain/react";
import {
  Activity,
  Apple,
  Bot,
  BookOpen,
  Cat,
  ChevronDown,
  ChevronUp,
  FileText,
  Heart,
  Info,
  Loader2,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Sun,
  User,
  Wrench,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getMessageText, toolLabel } from "@/lib/messages";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.origin}/api`
    : "http://localhost:3000/api");

type StreamMessage = ReturnType<typeof useStream>["messages"][number];

const SUGGESTIONS = [
  {
    title: "Deworming Guide",
    prompt: "How often should I deworm my cat? What products are safe?",
    icon: ShieldAlert,
    category: "Preventative",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/20",
  },
  {
    title: "Vaccination Plan",
    prompt: "What vaccinations do kittens need and at what age?",
    icon: Activity,
    category: "Immunization",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/20",
  },
  {
    title: "Dehydration Check",
    prompt: "What are the common signs of dehydration in cats and how can I test for it?",
    icon: Info,
    category: "Urgent Care",
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/20",
  },
  {
    title: "Toxic Foods & Plants",
    prompt: "Which everyday foods and indoor plants are toxic to cats?",
    icon: Apple,
    category: "Safety",
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/20",
  },
];

const CAT_TIPS = [
  "Lilies (Easter, tiger, daylilies) are highly toxic to cats and can cause fatal kidney failure within hours of ingestion.",
  "Cats are obligate carnivores. They require diet-derived taurine; a deficiency can lead to blindness and heart disease.",
  "Dehydration check: Gently pinch the skin on your cat's shoulders. If it stays tented, your cat may be dehydrated.",
  "Adult cats should generally be dewormed every 3 months, or monthly if they hunt outdoors.",
  "If your cat stops eating for 24-48 hours, contact a vet. Fasting can trigger a serious liver condition called hepatic lipidosis.",
  "Purring isn't just for happiness; cats also purr to comfort themselves when they are in pain or stressed.",
  "Male cats showing difficulty urinating, crying in the litterbox, or straining is a life-threatening veterinary emergency.",
  "Chocolate, onions, garlic, grapes, and raisins are highly toxic foods for cats. Avoid feeding them any table scraps.",
  "Scratching is essential for claw health and marking territory. Provide vertical and horizontal scratching posts.",
  "Play with your cat for at least 15-20 minutes daily. Interactive play keeps them mentally stimulated and prevents obesity.",
];

function toolIcon(name?: string) {
  if (name === "retrieve_information") return <FileText className="size-3.5" />;
  if (name?.startsWith("tavily") || name?.includes("search")) return <Search className="size-3.5" />;
  return <Wrench className="size-3.5" />;
}

function parseHumanMessage(content: string) {
  const contextRegex = /^\[Context - Cat Name: [^\]]+\]\s*\n*\s*/;
  const match = content.match(contextRegex);
  if (match) {
    const cleanText = content.replace(contextRegex, "");
    const nameMatch = content.match(/Cat Name: ([^,\]]+)/);
    const catName = nameMatch ? nameMatch[1] : "";
    return { text: cleanText, catName };
  }
  return { text: content, catName: null };
}

export function Chat({ assistantId }: { assistantId: string }) {
  const [chatKey, setChatKey] = useState(0);

  const handleReset = () => {
    setChatKey((prev) => prev + 1);
  };

  return (
    <ChatInner
      key={chatKey}
      assistantId={assistantId}
      onReset={handleReset}
    />
  );
}

function ChatInner({
  assistantId,
  onReset,
}: {
  assistantId: string;
  onReset: () => void;
}) {
  const stream = useStream({ apiUrl: API_URL, assistantId });
  const { messages, isLoading, error } = stream;

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tipIndex, setTipIndex] = useState(0);

  const [profile, setProfile] = useState({
    name: "Luna",
    age: "2 years",
    weight: "4.5 kg",
    diet: "Dry kibble & wet",
    enabled: true,
  });

  const endRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  // Sync theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = savedTheme ?? systemTheme;
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Choose a random tip
    setTipIndex(Math.floor(Math.random() * CAT_TIPS.length));
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const nextTip = () => {
    setTipIndex((prev) => (prev + 1) % CAT_TIPS.length);
  };

  const send = (text: string) => {
    const content = text.trim();
    if (!content || isLoading) return;

    let finalContent = content;
    if (profile.enabled && profile.name.trim()) {
      const profileStr = `[Context - Cat Name: ${profile.name}, Age: ${profile.age}, Weight: ${profile.weight}, Diet: ${profile.diet}]`;
      finalContent = `${profileStr}\n\n${content}`;
    }

    stream.submit({ messages: [{ type: "human", content: finalContent }] });
    setInput("");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop and Mobile Drawer) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r bg-muted/30 p-5 gap-6 transition-transform duration-300 md:static md:translate-x-0 dark:bg-muted/10",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-md shadow-orange-500/20">
              <Cat className="size-5" />
            </div>
            <div>
              <span className="font-bold text-base leading-none block text-foreground">
                FelineCare AI
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mt-0.5">
                Diagnostics Suite
              </span>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Profile Card Context Widget */}
        <Card className="border-muted bg-card shadow-xs dark:bg-muted/5">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Heart className="size-4 text-rose-500 fill-rose-500/20" />
                <CardTitle className="text-xs font-bold text-foreground">Cat Profile</CardTitle>
              </div>
              <label className="flex items-center gap-1 cursor-pointer">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Use</span>
                <input
                  type="checkbox"
                  checked={profile.enabled}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="rounded border-input text-amber-600 focus:ring-amber-500 size-3"
                />
              </label>
            </div>
            <CardDescription className="text-[11px] leading-tight mt-0.5">
              Personalizes AI responses with your cat's context
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Name
                </label>
                <Input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="h-7 text-xs px-2"
                  placeholder="Luna"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Age
                </label>
                <Input
                  value={profile.age}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, age: e.target.value }))
                  }
                  className="h-7 text-xs px-2"
                  placeholder="2 years"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Weight
                </label>
                <Input
                  value={profile.weight}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, weight: e.target.value }))
                  }
                  className="h-7 text-xs px-2"
                  placeholder="4.5 kg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Diet
                </label>
                <Input
                  value={profile.diet}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, diet: e.target.value }))
                  }
                  className="h-7 text-xs px-2"
                  placeholder="Dry kibble"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tip Widget */}
        <Card className="border-muted bg-card shadow-xs dark:bg-muted/5 mt-auto">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-amber-500 fill-amber-500/10" />
              <span className="text-xs font-bold text-foreground">Feline Tip</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-5 rounded-full"
              onClick={nextTip}
            >
              <RefreshCw className="size-3 text-muted-foreground hover:rotate-180 transition-transform duration-300" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] leading-relaxed text-muted-foreground italic">
              "{CAT_TIPS[tipIndex]}"
            </p>
          </CardContent>
        </Card>

        {/* Action controls (Theme and reset) */}
        <div className="flex gap-2 mt-2 pt-4 border-t border-muted/80">
          <Button
            variant="outline"
            className="flex-1 text-xs gap-1.5 h-8.5 rounded-lg border-muted/80"
            onClick={onReset}
          >
            <Plus className="size-3.5" />
            <span>New Chat</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="size-8.5 rounded-lg border-muted/80 shrink-0"
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <Moon className="size-3.5 text-foreground" />
            ) : (
              <Sun className="size-3.5 text-foreground" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex flex-1 flex-col overflow-hidden h-full">
        {/* Navigation / Header */}
        <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="size-8 md:hidden text-muted-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="size-4" />
            </Button>

            <div className="relative">
              <Avatar className="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 size-9 border border-amber-500/10">
                <AvatarFallback>
                  <Cat className="size-5" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
            </div>

            <div>
              <h1 className="text-sm font-bold text-foreground">Feline Health Agent</h1>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Online Assistant • Knowledge Base + Web Search</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={onReset}
              title="Reset conversation"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        </header>

        {/* Scrollable messages panel */}
        <ScrollArea className="flex-1 min-h-0 bg-muted/10 dark:bg-background">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center max-w-xl mx-auto h-full gap-6">
                <div className="relative">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 dark:bg-amber-950/20">
                    <Cat className="size-7" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-orange-500 text-[9px] text-white font-bold">
                    AI
                  </span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Ask the Feline Health Assistant
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Veterinary knowledge engine powered by LangGraph. Ask questions regarding symptoms, nutrition, behavior, or deworming.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-2">
                  {SUGGESTIONS.map((s) => {
                    const IconComponent = s.icon;
                    return (
                      <button
                        key={s.title}
                        onClick={() => send(s.prompt)}
                        className="flex items-start text-left p-3.5 rounded-xl border border-muted/80 bg-card hover:border-amber-500/30 hover:bg-muted/20 transition-all cursor-pointer group"
                      >
                        <div
                          className={cn(
                            "flex size-8 items-center justify-center rounded-lg mr-3 shrink-0",
                            s.color
                          )}
                        >
                          <IconComponent className="size-4" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground block">
                            {s.category}
                          </span>
                          <span className="text-xs font-bold text-foreground group-hover:text-amber-500 transition-colors block">
                            {s.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1 block mt-0.5">
                            {s.prompt}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((message, i) => (
              <MessageRow key={message.id ?? i} message={message} />
            ))}

            {isLoading && <ThinkingRow />}

            {error != null && (
              <Card className="border-destructive/40 bg-destructive/5 my-2">
                <CardContent className="p-4 text-xs text-destructive flex items-start gap-2">
                  <ShieldAlert className="size-4 shrink-0" />
                  <div>
                    <span className="font-bold block mb-0.5">System Error</span>
                    <span>
                      {error instanceof Error ? error.message : "Something went wrong."}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div ref={endRef} />
          </div>
        </ScrollArea>

        {/* Input Bar */}
        <div className="border-t bg-card p-3 md:p-4 shrink-0">
          <form
            onSubmit={onSubmit}
            className="mx-auto flex w-full max-w-3xl items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message the assistant (e.g. signs of dehydration)..."
              disabled={isLoading}
              className="h-10 rounded-xl px-4 text-sm"
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || input.trim().length === 0}
              className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white transition-all shadow-md shadow-orange-500/10 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
          <div className="mx-auto w-full max-w-3xl text-[10px] text-muted-foreground text-center mt-2 font-medium">
            ⚠️ Disclaimer: This AI assistant is for educational purposes and does not replace professional veterinary advice.
          </div>
        </div>
      </section>
    </div>
  );
}

function parseInline(text: string, isHuman: boolean): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className={cn(
            "px-1.5 py-0.5 rounded font-mono text-[11px] border",
            isHuman
              ? "bg-white/10 border-white/20 text-white"
              : "bg-muted/80 border-muted-foreground/15 text-foreground dark:bg-muted/20"
          )}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const linkUrl = linkMatch[2];
      return (
        <a
          key={i}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "font-semibold hover:underline animate-fade-in",
            isHuman
              ? "text-white underline decoration-white/50"
              : "text-amber-600 dark:text-amber-400"
          )}
        >
          {linkText}
        </a>
      );
    }
    return part;
  });
}

interface Block {
  type: "p" | "h1" | "h2" | "h3" | "ul" | "ol";
  items?: string[];
  text?: string;
}

function parseMarkdownToBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let currentList: Block | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      continue;
    }

    const h3Match = trimmed.match(/^###\s+(.*)/);
    const h2Match = trimmed.match(/^##\s+(.*)/);
    const h1Match = trimmed.match(/^#\s+(.*)/);
    const ulMatch = trimmed.match(/^[\-\*\u2022]\s+(.*)/);
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);

    if (h3Match) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      blocks.push({ type: "h3", text: h3Match[1] });
    } else if (h2Match) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      blocks.push({ type: "h2", text: h2Match[1] });
    } else if (h1Match) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      blocks.push({ type: "h1", text: h1Match[1] });
    } else if (ulMatch) {
      if (currentList && currentList.type === "ul") {
        currentList.items!.push(ulMatch[1]);
      } else {
        if (currentList) blocks.push(currentList);
        currentList = { type: "ul", items: [ulMatch[1]] };
      }
    } else if (olMatch) {
      if (currentList && currentList.type === "ol") {
        currentList.items!.push(olMatch[2]);
      } else {
        if (currentList) blocks.push(currentList);
        currentList = { type: "ol", items: [olMatch[2]] };
      }
    } else {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }

      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && lastBlock.type === "p") {
        lastBlock.text += "\n" + line;
      } else {
        blocks.push({ type: "p", text: line });
      }
    }
  }

  if (currentList) {
    blocks.push(currentList);
  }

  return blocks;
}

function Markdown({ text, isHuman }: { text: string; isHuman: boolean }) {
  const blocks = parseMarkdownToBlocks(text);

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h1":
            return (
              <h1 key={i} className="text-lg font-bold mt-3 mb-1 first:mt-0 text-foreground">
                {parseInline(block.text ?? "", isHuman)}
              </h1>
            );
          case "h2":
            return (
              <h2 key={i} className="text-base font-bold mt-2.5 mb-1 first:mt-0 text-foreground">
                {parseInline(block.text ?? "", isHuman)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="text-sm font-bold mt-2 mb-0.5 first:mt-0 text-foreground">
                {parseInline(block.text ?? "", isHuman)}
              </h3>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc pl-4 my-1 space-y-1">
                {(block.items ?? []).map((item, idx) => (
                  <li key={idx} className="text-sm leading-relaxed">
                    {parseInline(item, isHuman)}
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal pl-4 my-1 space-y-1">
                {(block.items ?? []).map((item, idx) => (
                  <li key={idx} className="text-sm leading-relaxed">
                    {parseInline(item, isHuman)}
                  </li>
                ))}
              </ol>
            );
          case "p":
          default:
            return (
              <p key={i} className="leading-relaxed text-sm whitespace-pre-wrap">
                {parseInline(block.text ?? "", isHuman)}
              </p>
            );
        }
      })}
    </div>
  );
}

function MessageRow({ message }: { message: StreamMessage }) {
  const isHuman = message.type === "human";
  const isTool = message.type === "tool";
  const fullText = getMessageText(message.content);

  if (isTool) {
    return <ToolAccordion message={message} />;
  }

  const { text, catName } = isHuman
    ? parseHumanMessage(fullText)
    : { text: fullText, catName: null };

  const toolCalls =
    message.type === "ai"
      ? (message as unknown as {
          tool_calls?: Array<{ name?: string; id?: string }>;
        }).tool_calls ?? []
      : [];

  return (
    <div
      className={cn(
        "flex w-full items-start gap-3",
        isHuman && "flex-row-reverse"
      )}
    >
      <Avatar
        className={cn(
          "size-8 border",
          isHuman
            ? "bg-amber-500 border-amber-600 text-white"
            : "bg-card border-muted text-amber-500"
        )}
      >
        <AvatarFallback>
          {isHuman ? <User className="size-4" /> : <Cat className="size-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex max-w-[80%] flex-col gap-1.5", isHuman && "items-end")}>
        {toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {toolCalls.map((tc, idx) => (
              <Badge
                key={tc.id ?? idx}
                variant="secondary"
                className="text-[10px] gap-1 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400 font-semibold"
              >
                {toolIcon(tc.name)}
                <span>Invoking {toolLabel(tc.name)}...</span>
              </Badge>
            ))}
          </div>
        )}

        {text && (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs border",
              isHuman
                ? "bg-gradient-to-r from-amber-600 to-orange-500 text-white border-amber-600/20 rounded-tr-xs"
                : "bg-card border-muted text-foreground rounded-tl-xs"
            )}
          >
            <Markdown text={text} isHuman={isHuman} />

            {isHuman && catName && (
              <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-white/20 text-[9px] text-orange-100 font-bold uppercase tracking-wider">
                <Cat className="size-3" />
                <span>Context: {catName}'s Profile</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolAccordion({ message }: { message: StreamMessage }) {
  const [isOpen, setIsOpen] = useState(false);
  const text = getMessageText(message.content);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-lg border border-muted/80 bg-muted/5 shadow-xs transition-all duration-200 dark:border-muted/30">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs font-semibold hover:bg-muted/10 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded bg-background border border-muted shadow-xs text-amber-500 dark:bg-muted/40">
              {toolIcon(message.name)}
            </div>
            <div>
              <span className="font-semibold text-foreground text-[11px]">
                {toolLabel(message.name)}
              </span>
              <span className="ml-1.5 text-[10px] text-muted-foreground font-normal hidden sm:inline">
                • Tool execution completed
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="text-[8px] uppercase font-bold tracking-wider text-muted-foreground px-1.5 py-0.5 bg-background dark:bg-card"
            >
              Logs
            </Badge>
            {isOpen ? (
              <ChevronUp className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            )}
          </div>
        </button>
        {isOpen && (
          <div className="border-t bg-card/60 px-3 py-2 dark:bg-muted/20">
            <pre className="max-h-60 overflow-auto whitespace-pre-wrap font-mono text-[10px] text-muted-foreground leading-relaxed">
              {text}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingRow() {
  return (
    <div className="flex w-full items-start gap-3 animate-pulse">
      <Avatar className="size-8 border border-muted bg-card text-amber-500">
        <AvatarFallback>
          <Cat className="size-4 text-amber-500" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-3 rounded-2xl bg-muted/40 border border-muted/80 px-4 py-3 text-xs text-muted-foreground shadow-xs">
        <Loader2 className="size-3.5 animate-spin text-amber-500 shrink-0" />
        <span>Feline Health Assistant is consulting data sources...</span>
      </div>
    </div>
  );
}
