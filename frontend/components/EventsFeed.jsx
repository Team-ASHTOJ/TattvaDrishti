export default function EventsFeed({ events }) {
  return (
    <section className="rounded-3xl border border-white/5 bg-slate-900/70 p-6 shadow-xl shadow-black/40 backdrop-blur">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Live fusion feed</h2>
          <p className="mt-1 text-sm text-slate-400">
            Direct stream from{" "}
            <span className="font-mono text-emerald-300">
              /api/v1/events/stream
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
          </span>
          Streaming
        </div>
      </header>
      <div className="mt-6 space-y-3 max-h-[30rem] overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/60 px-4 py-8 text-center text-sm text-slate-500">
            Awaiting signals… submit content or hook into the pipeline to
            populate the activity stream.
          </div>
        ) : (
          events.map((event) => (
            <article
              key={`${event.intake_id}-${event.submitted_at}`}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 shadow-sm shadow-emerald-500/10"
            >
              <header className="flex items-center justify-between gap-3">
                <span className={`badge badge-${event.classification}`}>
                  {event.classification || "event"}
                </span>
                <span className="font-mono text-sm text-emerald-200">
                  {typeof event.score === "number"
                    ? event.score.toFixed(2)
                    : "n/a"}
                </span>
              </header>
              <p className="mt-2 font-mono text-xs text-slate-400">
                {event.intake_id}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-slate-500">
                {event.submitted_at
                  ? new Date(event.submitted_at).toLocaleTimeString()
                  : new Date().toLocaleTimeString()}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
