"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import IntakeForm from "@/components/IntakeForm";
import ImageAnalyzer from "@/components/ImageAnalyzer";
import Toast from "@/components/Toast";
import { submitIntake, fetchCase, createEventStream } from "@/lib/api";

export default function SimpleDashboardPage() {
  const [cases, setCases] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", tone: "success" });
  const submissionsRef = useRef({});
  const eventControllerRef = useRef(null);

  useEffect(() => {
    const timer = toast.message
      ? setTimeout(() => setToast({ message: "", tone: "success" }), 4200)
      : null;
    return () => timer && clearTimeout(timer);
  }, [toast]);

  const upsertCase = (result) => {
    if (!result?.intake_id) return;
    setCases((previous) => {
      const existingIndex = previous.findIndex(
        (item) => item.intake_id === result.intake_id
      );
      if (existingIndex >= 0) {
        const updated = [...previous];
        updated[existingIndex] = { ...updated[existingIndex], ...result };
        return sortCases(updated);
      }
      return sortCases([result, ...previous]);
    });
  };

  const sortCases = (data) =>
    [...data].sort((a, b) => {
      const dateA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
      const dateB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      return dateB - dateA;
    });

  const startEventStream = () => {
    if (eventControllerRef.current) return;
    const source = createEventStream(
      async (event) => {
        upsertCase({
          intake_id: event.intake_id,
          submitted_at: event.submitted_at,
          classification: event.classification,
          composite_score: event.score,
        });
        try {
          const hydrated = await fetchCase(event.intake_id);
          upsertCase(hydrated);
        } catch (error) {
          console.error("Failed to hydrate case via simplified stream", error);
        }
      },
      () => {
        setToast({
          message: "Live updates paused. Reconnecting…",
          tone: "error",
        });
        if (eventControllerRef.current) {
          eventControllerRef.current.close();
          eventControllerRef.current = null;
        }
        setTimeout(() => startEventStream(), 4000);
      }
    );
    eventControllerRef.current = source;
  };

  useEffect(() => {
    startEventStream();
    return () => {
      if (eventControllerRef.current) {
        eventControllerRef.current.close();
        eventControllerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmitIntake = async (payload) => {
    try {
      setIsSubmitting(true);
      const result = await submitIntake(payload);
      submissionsRef.current[result.intake_id] = payload;
      upsertCase(result);
      setSelectedId(result.intake_id);
      setToast({ message: "Narrative checked successfully.", tone: "success" });
      return true;
    } catch (error) {
      setToast({
        message: `Unable to check narrative: ${error.message}`,
        tone: "error",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectCase = async (intakeId) => {
    if (!intakeId) return;
    setSelectedId(intakeId);
    try {
      const hydrated = await fetchCase(intakeId);
      upsertCase(hydrated);
    } catch (error) {
      setToast({
        message: `Unable to load the selected case: ${error.message}`,
        tone: "error",
      });
    }
  };

  const metrics = useMemo(() => {
    const total = cases.length;
    const highRisk = cases.filter((item) => {
      const label = (item.classification || "").toLowerCase();
      return (
        label.includes("high") ||
        (typeof item.composite_score === "number" &&
          item.composite_score >= 0.7)
      );
    }).length;
    const average =
      total === 0
        ? 0
        : Math.round(
            (cases.reduce(
              (acc, current) => acc + (current.composite_score || 0),
              0
            ) /
              total) *
              100
          );
    const lastUpdated = cases[0]?.submitted_at
      ? formatTimestamp(cases[0].submitted_at)
      : "—";
    return { total, highRisk, average, lastUpdated };
  }, [cases]);

  const selectedCase = cases.find((caseItem) => caseItem.intake_id === selectedId);
  const submissionPayload = submissionsRef.current[selectedId] || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-sky-50 text-slate-900">
      <main className="mx-auto flex w-full max-w-[110rem] flex-col gap-10 px-4 py-10 pb-24 sm:px-6 lg:px-12">
        <header className="rounded-[32px] bg-white/90 p-8 shadow-2xl shadow-amber-100/60 ring-1 ring-amber-100">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.6em] text-emerald-500">
                Guided dashboard
              </p>
              <h1 className="mt-4 text-4xl font-semibold text-slate-900 md:text-[42px]">
                Quick & calm narrative safety check
              </h1>
              <p className="mt-3 max-w-3xl text-base text-slate-600">
                Drop in the same intake your analysts use and view colour-coded results,
                plain-language summaries, and supporting images without the extra noise.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-sm text-slate-500">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-300 hover:text-emerald-600"
              >
                Switch to advanced dashboard
              </Link>
              <p className="text-xs text-slate-500">
                Live feed reconnects automatically if connection drops.
              </p>
            </div>
          </div>
        </header>

        <SimpleStats metrics={metrics} />

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] bg-white/90 p-4 shadow-xl shadow-emerald-100 ring-1 ring-emerald-100/60 sm:p-6">
              <div className="flex flex-col gap-1 border-b border-emerald-100 pb-4">
                <h2 className="text-2xl font-semibold text-slate-900">
                  Submit a narrative
                </h2>
                <p className="text-sm text-slate-500">
                  Same structured intake as analysts: language, tags, platform, and city.
                </p>
              </div>
              <div className="mt-4 rounded-[28px] bg-slate-50 p-2 sm:p-4">
                <IntakeForm
                  onSubmit={handleSubmitIntake}
                  isSubmitting={isSubmitting}
                  onValidationError={(message) =>
                    setToast({ message, tone: "error" })
                  }
                  variant="light"
                  metadataLabelStyle="bold"
                />
              </div>
            </div>
            <ImageAnalyzerCard />
          </div>

          <div className="flex flex-col gap-6">
            <ResultList
              items={cases}
              onSelect={handleSelectCase}
              selectedId={selectedId}
            />
            <CaseOverview caseData={selectedCase} submission={submissionPayload} />
          </div>
        </section>
      </main>

      <Toast message={toast.message} tone={toast.tone} />
    </div>
  );
}

function SimpleStats({ metrics }) {
  const stats = [
    {
      label: "Narratives checked",
      value: metrics.total || 0,
      accent: "from-sky-400 to-sky-500",
    },
    {
      label: "High-risk alerts",
      value: metrics.highRisk || 0,
      accent: "from-rose-400 to-rose-500",
    },
    {
      label: "Average score",
      value: `${metrics.average}%`,
      accent: "from-emerald-400 to-emerald-500",
    },
    {
      label: "Last update",
      value: metrics.lastUpdated || "—",
      accent: "from-amber-400 to-amber-500",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {stats.map((item) => (
        <article
          key={item.label}
          className={`rounded-3xl bg-gradient-to-br ${item.accent} p-[1px] shadow-lg shadow-slate-200/60`}
        >
          <div className="h-full rounded-[22px] bg-white/95 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {item.value}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}

function ResultList({ items, selectedId, onSelect }) {
  if (!items.length) {
    return (
      <section className="rounded-[32px] border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500 shadow-sm">
        Submit your first narrative to see the quick results summary here.
      </section>
    );
  }

  return (
    <section className="rounded-[32px] bg-white p-6 shadow-2xl shadow-slate-200/80 ring-1 ring-slate-100">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent detection runs</h2>
          <p className="text-xs text-slate-500">
            Select a card to open the summary panel.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Showing {Math.min(items.length, 6)} of {items.length}
        </p>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {items.slice(0, 6).map((item) => {
          const isSelected = selectedId === item.intake_id;
          const score =
            typeof item.composite_score === "number"
              ? `${Math.round(item.composite_score * 100)}%`
              : "n/a";
          const risk = getRiskLevel(item.classification, item.composite_score);
          return (
            <button
              key={item.intake_id}
              type="button"
              onClick={() => onSelect(item.intake_id)}
              className={`flex items-center justify-between rounded-3xl border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                isSelected
                  ? `${risk.selectedBg} border-transparent`
                  : `border-slate-100 ${risk.bg} hover:border-slate-300`
              }`}
            >
              <div>
                <p className={`text-sm font-semibold ${risk.text}`}>
                  {item.classification || "Processing"}
                </p>
                <p className="text-xs text-slate-500">
                  {item.submitted_at ? formatTimestamp(item.submitted_at) : "Pending"}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${risk.text}`}>{score}</p>
                <span className={`text-[11px] uppercase tracking-[0.3em] ${risk.text}`}>
                  {risk.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CaseOverview({ caseData, submission }) {
  if (!caseData) {
    return (
      <section className="rounded-[32px] border border-dashed border-slate-200 bg-white/70 p-6 text-center text-base font-semibold text-slate-600 shadow-sm">
        Choose any result above to see the simplified explanation with highlights.
      </section>
    );
  }

  const heuristics = Array.isArray(caseData?.breakdown?.heuristics)
    ? caseData.breakdown.heuristics.slice(0, 4)
    : [];
  const metadataEntries = submission?.metadata
    ? Object.entries(submission.metadata).filter(([, value]) => Boolean(value))
    : [];
  const score =
    typeof caseData.composite_score === "number"
      ? `${Math.round(caseData.composite_score * 100)}%`
      : "n/a";
  const risk = getRiskLevel(caseData.classification, caseData.composite_score);
  const summaryText =
    caseData.summary ||
    caseData.assessment ||
    caseData.reason ||
    caseData.findings ||
    "Detailed summary will appear once the pipeline returns the full analysis.";

  const narrativeText =
    caseData.cleaned_text ||
    caseData.text ||
    submission?.text ||
    "Narrative body unavailable for this case.";

  return (
    <section className="rounded-[32px] bg-white p-8 text-base shadow-2xl shadow-slate-200/80 ring-1 ring-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Selected case</p>
          <h2 className="mt-1 text-3xl font-semibold text-slate-900">
            {caseData.classification || "Awaiting classification"}
          </h2>
          <p className="text-sm text-slate-600">
            Intake ID:{" "}
            <span className="font-mono text-[11px] text-slate-600">
              {caseData.intake_id}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Composite score</p>
          <div className={`mt-2 inline-flex items-center gap-3 rounded-full px-5 py-2 text-2xl font-semibold ${risk.badgeBg} ${risk.text}`}>
            {score}
            <span className="text-xs font-semibold uppercase tracking-[0.3em]">{risk.label}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {caseData.submitted_at
              ? formatTimestamp(caseData.submitted_at)
              : "Timestamp unavailable"}
          </p>
        </div>
      </header>

      <div className="mt-5 space-y-5 text-base text-slate-700">
        <section className="rounded-3xl bg-emerald-50/80 px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 mb-3">
            Quick summary
          </p>
          <p className="text-lg leading-relaxed text-slate-900">{summaryText}</p>
        </section>

        {caseData.decision_reason && (
          <section className="rounded-3xl bg-white px-6 py-5 shadow-inner shadow-emerald-100">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 mb-3">
              Why this decision
            </p>
            <p className="text-base leading-relaxed text-slate-800">
              {caseData.decision_reason}
            </p>
          </section>
        )}

        <section className="rounded-3xl bg-slate-50 px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600 mb-3">
            Narrative text
          </p>
          <p className="text-base text-slate-900 whitespace-pre-wrap leading-relaxed">
            {narrativeText}
          </p>
        </section>

        <section className="rounded-3xl bg-sky-50 px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600 mb-3">
            Key signals
          </p>
          {heuristics.length ? (
            <ul className="list-disc space-y-1 pl-4 text-base text-slate-800">
              {heuristics.map((heuristic) => (
                <li key={heuristic}>{heuristic}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No heuristics were flagged.</p>
          )}
        </section>

        <section className="rounded-3xl bg-amber-50 px-6 py-5">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            Context provided
          </p>
          {metadataEntries.length ? (
            <dl className="grid grid-cols-2 gap-4 text-sm text-slate-700">
              {metadataEntries.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs uppercase tracking-[0.35em] text-slate-500">{key.replace(/_/g, " ")}</dt>
                  <dd className="mt-1 text-base text-slate-900">{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-slate-500">
              No additional metadata was supplied with this submission.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}

function ImageAnalyzerCard() {
  return (
    <section className="rounded-[32px] bg-white p-6 shadow-2xl shadow-slate-200/80 ring-1 ring-slate-100">
      <header className="border-b border-slate-100 pb-4">
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">
          Check supporting images
        </h2>
        <p className="text-sm text-slate-500">
          Drop media to detect synthetic artefacts or manipulated propaganda.
        </p>
      </header>
      <div className="mt-4 rounded-[28px] bg-slate-50 p-2 sm:p-4">
        <ImageAnalyzer variant="light" />
      </div>
    </section>
  );
}

function getRiskLevel(classification, score) {
  const value = (classification || "").toLowerCase();
  const numeric = typeof score === "number" ? score : null;
  if (value.includes("high") || (numeric !== null && numeric >= 0.7)) {
    return {
      label: "High",
      text: "text-rose-700",
      bg: "bg-rose-50",
      selectedBg: "bg-rose-100",
      badgeBg: "bg-rose-50",
    };
  }
  if (value.includes("medium") || (numeric !== null && numeric >= 0.4)) {
    return {
      label: "Medium",
      text: "text-amber-700",
      bg: "bg-amber-50",
      selectedBg: "bg-amber-100",
      badgeBg: "bg-amber-50",
    };
  }
  return {
    label: "Low",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    selectedBg: "bg-emerald-100",
    badgeBg: "bg-emerald-50",
  };
}

function formatTimestamp(value) {
  try {
    const date = new Date(value);
    return date.toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "—";
  }
}
