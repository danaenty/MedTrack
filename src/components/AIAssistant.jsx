import { useState, useRef, useEffect } from "react";

// ── Groq API config ──────────────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = "llama-3.3-70b-versatile"; // Best free model on Groq

const QUICK_ACTIONS = [
  { label: "📝 Summarize",  prompt: "Give me a concise summary of the key points from this topic." },
  { label: "❓ MCQs",       prompt: "Generate 5 multiple choice questions (with 4 options each and the correct answer clearly indicated) based on this topic. Format each question clearly." },
  { label: "🎯 Quiz Me",    prompt: "Quiz me interactively. Ask me ONE question at a time about this topic. Start with the first question and wait for my answer before proceeding." },
  { label: "🔑 Key Points", prompt: "List the most important key points I must know for my exam on this topic." },
];

function buildSystemPrompt(topic, course) {
  if (!topic) return "";
  return `You are an AI study assistant for a 500-level medical student preparing for their 2nd MBBS Professional Examinations at Federal University of Health Sciences Azare, Nigeria.

The student is currently studying: "${topic.title}" in the subject "${course?.name}".

Your role:
- Answer questions based on standard medical curriculum for this topic
- Generate MCQs, quizzes, and summaries on request
- Be concise but thorough — exam-focused
- When generating MCQs, clearly label the correct answer
- When quizzing interactively, ask ONE question at a time and wait for the student's response
- Use Nigerian/West African clinical context where relevant (e.g. malaria, sickle cell disease prevalence)
- Be direct and accurate — wrong medical information is harmful

Current topic: ${topic.title}
Subject: ${course?.name}

Always ground your answers in standard medical knowledge for this specific topic.`;
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/#{1,3} ([^\n]+)/g, "<strong style='font-size:1.05em'>$1</strong>")
    .replace(/\n/g, "<br/>");
}

export default function AIAssistant({ activeTopic, activeCourse, mobileView }) {
  const [isOpen,    setIsOpen]    = useState(false);
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [isReady,   setIsReady]   = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const prevTopicId    = useRef(null);

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  // ── Reset & initialise when topic changes ────────────────────
  useEffect(() => {
    if (!activeTopic) return;
    if (prevTopicId.current === activeTopic.id) return;
    prevTopicId.current = activeTopic.id;

    setMessages([]);
    setIsReady(false);
    setIsPulsing(false);
    setIsOpen(false);

    const t = setTimeout(() => {
      setIsReady(true);
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 4000);
      setMessages([{
        role: "assistant",
        content: `I've loaded **${activeTopic.title}** (${activeCourse?.name}). Ask me anything, or tap a quick action below. 🎓`,
      }]);
    }, 800);

    return () => clearTimeout(t);
  }, [activeTopic?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll to latest message ─────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Focus input when panel opens ─────────────────────────────
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen]);

  // ── Send message to Groq ─────────────────────────────────────
  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (!apiKey) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "⚠️ No API key found. Add `VITE_GROQ_API_KEY` to your `.env` file and redeploy.",
        isError: true,
      }]);
      return;
    }

    const userMsg = { role: "user", content: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      // Build OpenAI-compatible messages array for Groq
      // Groq uses the same format as OpenAI: { role, content }
      // Skip index 0 (the greeting) and prepend the system prompt
      const chatHistory = updated.slice(1).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            // System prompt always first
            { role: "system", content: buildSystemPrompt(activeTopic, activeCourse) },
            // Full conversation history
            ...chatHistory,
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      const data = await res.json();

      // Groq returns error details in data.error
      if (data.error) throw new Error(data.error.message);

      const reply =
        data.choices?.[0]?.message?.content ||
        "Sorry, I couldn't generate a response. Please try again.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `⚠️ ${err.message}`,
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Don't render if no topic, or on mobile outside slide view ─
  if (!activeTopic) return null;
  if (mobileView && mobileView !== "slides") return null;

  // ── Panel class: full-width on mobile, fixed 400px on desktop ─
  const panelClass =
    "fixed z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl border " +
    "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 " +
    "bottom-24 right-3 left-3 md:left-auto md:right-6 md:w-[400px]";

  return (
    <>
      {/* ── Floating button ────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        title={isReady ? "AI Study Assistant" : "Loading AI…"}
        className={[
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg",
          "flex items-center justify-center transition-all duration-300",
          isOpen
            ? "bg-slate-700 dark:bg-slate-600"
            : isReady
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-slate-400 dark:bg-slate-600 cursor-wait",
          isPulsing && !isOpen ? "animate-pulse ring-4 ring-blue-400/50" : "",
        ].join(" ")}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        )}
        {isReady && !isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-slate-900" />
        )}
      </button>

      {/* ── Chat panel ─────────────────────────────────────────── */}
      {isOpen && (
        <div className={panelClass} style={{ height: "min(520px, calc(100dvh - 120px))" }}>

          {/* Header */}
          <div className="px-4 py-3 bg-blue-600 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-500/60 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">AI Study Assistant</p>
              <p className="text-blue-200 text-xs truncate">{activeTopic.title}</p>
            </div>
            <span className="text-xs text-blue-200 bg-blue-700/60 px-2 py-0.5 rounded-full shrink-0 hidden sm:inline">
              {activeCourse?.icon} {activeCourse?.name}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition shrink-0"
              aria-label="Close AI assistant"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : msg.isError
                        ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-bl-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm",
                  ].join(" ")}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 150, 300].map((d) => (
                      <div
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto shrink-0">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => sendMessage(a.prompt)}
                disabled={loading}
                className="shrink-0 text-xs px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 flex gap-2 items-end shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this topic…"
              rows={1}
              className="flex-1 resize-none rounded-xl px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto"
              style={{ minHeight: 38, maxHeight: 96 }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="shrink-0 w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Send"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* No-key warning */}
          {!apiKey && (
            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800 shrink-0">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Add <code className="font-mono">VITE_GROQ_API_KEY</code> to your <code>.env</code> file and redeploy.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
