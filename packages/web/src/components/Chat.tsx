import { useAtomRefresh } from "@effect/atom-react";
import type { AgentMessage } from "@proxus/shared";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { artifactsQuery } from "../domain/artifacts/atoms.ts";
import { materialsQuery } from "../domain/materials/atoms.ts";
import { applyInvalidations, invalidationsForToolCall, } from "../domain/tutor/invalidation.ts";
import { streamTutorMessage } from "../domain/tutor/stream.ts";
import { Menu } from "lucide-react";
import { ArrowUp } from "lucide-react";
import { Loader } from "lucide-react";
import { Trash2 } from "lucide-react";

const starterPrompts = [
  "List my uploaded materials",
  "Create a short quiz from my materials",
  "Explain the hardest concept in my notes step by step",
] as const;

interface ChatProps {
  readonly onOpenSidebar: () => void;
}

export function Chat({ onOpenSidebar }: ChatProps) {
  const [messages, setMessages] = useState<readonly AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const refreshArtifacts = useAtomRefresh(artifactsQuery);
  const refreshMaterials = useAtomRefresh(materialsQuery);
  const pendingInvalidations = useRef<Array<ReturnType<typeof invalidationsForToolCall>>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isSending]);

  const submit = async (nextInput: string) => {
    const trimmed = nextInput.trim();
    if (trimmed.length === 0 || isSending) {
      return;
    }

    setIsSending(true);
    setError(undefined);
    pendingInvalidations.current = [];

    try {
      for await (const event of streamTutorMessage({
        input: trimmed,
        messages,
        maxSteps: 8,
      })) {
        if (event.type === "done") {
          continue;
        }

        const message = event.message;
        setMessages((current) => [...current, message]);

        if (message.role === "tool-call") {
          pendingInvalidations.current.push(invalidationsForToolCall(message));
        }

        if (message.role === "tool-result") {
          const keys = pendingInvalidations.current.shift() ?? [];
          if (!message.isFailure) {
            applyInvalidations(keys, {
              refreshArtifacts,
              refreshMaterials
            });
          }
        }
      }

      setInput("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="grid h-dvh min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto_auto] overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-4 md:px-6 md:py-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#1F1F1F] text-white bg-[#8B4A85] md:hidden"
            type="button"
            aria-label="Abrir menú lateral"
            onClick={onOpenSidebar}
          >
            <Menu size={20} />
          </button>
        </div>

        {messages.length > 0 && (
          <button
            className="rounded-2xl shadow-[-3px_3px_0px_0px_rgba(0,0,0,0.4)] transition hover:shadow-[-4px_4px_0px_0px_rgba(0,0,0,0.6)] border-2 border-[#010001] bg-[#8B4A85] px-4 py-2 text-white cursor-pointer"
            type="button"
            onClick={() => setMessages([])}
            disabled={messages.length === 0}
          >
            <Trash2 size={20}/>
          </button>
        )}
      </header>

      <section
        className="flex flex-col mx-auto w-full max-w-5xl gap-4 overflow-y-auto p-6 scrollbar-none"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="m-auto w-full max-w-3xl text-center">
            <h2 className="m-0 text-balance font-bold text-4xl text-[#010001] leading-tight md:text-6xl">
              Ask about your materials, notes, quizzes, or tests.
            </h2>
            <p className="mt-4 text-[#808080]">
              The chat history lives only in browser memory. Refreshing starts
              over.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 max-lg:grid-cols-1">
              {starterPrompts.map((prompt) => (
                <button
                  className="rounded-2xl shadow-[-3px_3px_0px_0px_rgba(0,0,0,0.4)] transition hover:shadow-[-4px_4px_0px_0px_rgba(0,0,0,0.6)] border-2 border-[#010001] bg-white p-4 text-[#010001] cursor-pointer"
                  key={prompt}
                  type="button"
                  onClick={() => void submit(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </section>

      {error === undefined ? null : (
        <p className="m-0 px-6 pb-3 text-red-200">{error}</p>
      )}

      <form
        className="grid grid-cols-[1fr_auto] mx-auto w-full max-w-5xl gap-3 px-6 pt-4 pb-6"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(input);
        }}
      >
        <div className="mx-auto flex w-full max-w-5xl items-end gap-2 rounded-2xl border-2 border-[#1F1F1F] bg-white p-2 shadow-[-3px_3px_0px_0px_rgba(0,0,0,0.4)] focus-within:border-[#8B4A85]">
          <textarea
            className="min-h-10 max-h-40 flex-1 resize-none overflow-y-auto border-none bg-transparent px-2 py-2 text-[#1F1F1F] placeholder:text-[#8A8390] outline-none scrollbar-none"
            value={input}
            onChange={(event) => {
              setInput(event.currentTarget.value);

              event.currentTarget.style.height = "auto";
              event.currentTarget.style.height = `${Math.min(
                event.currentTarget.scrollHeight,
                160,
              )}px`;
            }}
            placeholder="Ask your tutor something…"
            rows={1}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit(input);
              }
            }}
          />

          <button
            className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#1F1F1F] bg-[#8B4A85] text-white transition hover[#783E73] disabled:cursor-not-allowed disabled:opacity-40"
            type="submit"
            aria-label="Send message"
            title="Send message"
            disabled={isSending || input.trim().length === 0}
          >
            {isSending ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <ArrowUp size={20} />
            )}
          </button>
        </div>
      </form>
    </main>
  );
}

function MessageBubble({ message }: { readonly message: AgentMessage }) {
  if (message.role === "tool-call" || message.role === "tool-result") {
    return (
      <details className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400 hidden">
        <summary className="cursor-pointer">
          {message.role === "tool-call"
            ? `Tool call: ${message.name}`
            : `Tool result: ${message.name}`}
        </summary>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm hidden">
          {JSON.stringify(
            message.role === "tool-call" ? message.input : message.result,
            null,
            2,
          )}
        </pre>
      </details>
    );
  }

  return (
    <article
      className={
        message.role === "user"
          ? "max-w-3xl self-end rounded-2xl shadow-[-3px_3px_0px_0px_rgba(0,0,0,0.4)] border-2 border-[#010001] bg-[#E8CDE5] text-[#010001] p-4 message-in"
          : "max-w-3xl self-start rounded-2xl shadow-[-3px_3px_0px_0px_rgba(0,0,0,0.4)] text-[#010001] border-2 border-[#010001] bg-white p-4 message-in"
      }
    >
      {/* <span className="mb-2 block font-bold text-sky-400 text-xs uppercase tracking-wide">
        {message.role === "user" ? "You" : "Tutor"}
      </span> */}
      <div className="leading-7">
        <Streamdown>{message.content}</Streamdown>
      </div>
    </article>
  );
}
