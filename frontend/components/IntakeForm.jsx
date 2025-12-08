import { useEffect, useRef, useState } from "react";

const minCharacters = 20;

export default function IntakeForm({ onSubmit, isSubmitting, onValidationError }) {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("en");
  const [source, setSource] = useState("");
  const [platform, setPlatform] = useState("");
  const [region, setRegion] = useState("");
  const [actorId, setActorId] = useState("");
  const [tags, setTags] = useState("");
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      recognitionRef.current = null;
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language?.trim() || "en";
    recognition.onresult = (event) => {
      let transcriptChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal && result[0]?.transcript) {
          transcriptChunk += result[0].transcript;
        }
      }
      if (transcriptChunk) {
        const cleaned = transcriptChunk.replace(/\s+/g, " ").trim();
        setText((previous) => {
          const prefix = previous && !previous.endsWith(" ") ? `${previous} ` : previous || "";
          return `${prefix || ""}${cleaned}`.trim();
        });
      }
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      setSpeechError(
        event.error === "not-allowed"
          ? "Microphone permission denied. Please allow access to dictate."
          : "Speech capture interrupted. Please try again."
      );
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    setSpeechSupported(true);

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language?.trim() || "en";
    }
  }, [language]);

  const stopDictation = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleToggleDictation = () => {
    if (!recognitionRef.current) {
      setSpeechError("Speech capture is unavailable in this browser.");
      return;
    }
    if (isListening) {
      stopDictation();
      return;
    }
    setSpeechError("");
    try {
      recognitionRef.current.lang = language?.trim() || "en";
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      setSpeechError("Unable to access the microphone. Please try again.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text || text.trim().length < minCharacters) {
      onValidationError?.(
        `Narrative must contain at least ${minCharacters} characters.`
      );
      return;
    }
    if (!region || !region.trim()) {
      onValidationError?.("Region (city/district) is required.");
      return;
    }
    const payload = {
      text: text.trim(),
      language: language.trim() || "en",
      source: source.trim() || "unknown",
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      metadata: {
        platform: platform.trim() || "unspecified",
        region: region.trim(),
        actor_id: actorId.trim() || null,
      },
    };
    const success = await onSubmit(payload);
    if (success) {
      stopDictation();
      setText("");
      setLanguage("en");
      setSource("");
      setPlatform("");
      setRegion("");
      setActorId("");
      setTags("");
      setSpeechError("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/30"
    >
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-white">
          Submit narrative for detection
        </h2>
        <p className="text-sm text-slate-400">
          Paste flagged content, enrich with context, and trigger the end-to-end
          pipeline.
        </p>
      </header>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="payload-text"
            className="text-sm font-semibold text-slate-200"
          >
            Narrative payload
          </label>
          <button
            type="button"
            onClick={handleToggleDictation}
            disabled={!speechSupported || isSubmitting}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40 ${
              isListening
                ? "border-rose-300/70 bg-rose-500/10 text-rose-200"
                : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isListening ? "bg-rose-300 animate-pulse" : "bg-emerald-300"
              }`}
            />
            {isListening ? "Stop dictation" : "Use voice input"}
          </button>
        </div>
        <textarea
          id="payload-text"
          name="text"
          rows={6}
          required
          placeholder="Paste suspect content or hostile call-to-action..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
        <p className="mt-2 text-xs text-slate-500">
          Minimum {minCharacters} characters. The orchestrator runs heuristics,
          watermark checks, and graph ingestion automatically.
        </p>
        {speechError && (
          <p className="mt-2 text-xs text-rose-300">{speechError}</p>
        )}
        {!speechSupported && !speechError && (
          <p className="mt-2 text-xs text-slate-500">
            Voice dictation is unavailable in this browser.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-sm">
        <InputField label="Language">
          <input
            id="payload-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="input"
          />
        </InputField>
        <InputField label="Source channel">
          <input
            id="payload-source"
            value={source}
            placeholder="e.g. darknet, social-feed"
            onChange={(event) => setSource(event.target.value)}
            className="input"
          />
        </InputField>
        <InputField label="Analyst tags">
          <input
            id="payload-tags"
            value={tags}
            placeholder="disinfo, amplification"
            onChange={(event) => setTags(event.target.value)}
            className="input"
          />
        </InputField>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-sm">
        <InputField label="Platform">
          <input
            id="payload-platform"
            value={platform}
            placeholder="telegram, state-media"
            onChange={(event) => setPlatform(event.target.value)}
            className="input"
          />
        </InputField>
        <InputField label="Region (city/district)">
          <input
            id="payload-region"
            value={region}
            placeholder="Enter city or district (required)"
            required
            onChange={(event) => setRegion(event.target.value)}
            className="input"
          />
        </InputField>
        <InputField label="Actor ID">
          <input
            id="payload-actor"
            value={actorId}
            placeholder="Suspected cell"
            onChange={(event) => setActorId(event.target.value)}
            className="input"
          />
        </InputField>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          Pipeline orchestration online
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-400/90 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Analyse narrative
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833"
              stroke="#0f172a"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}

function InputField({ label, children }) {
  return (
    <label className="flex flex-col gap-2 text-slate-200">
      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}
