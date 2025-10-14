export default function Toast({ message, tone = "success" }) {
  if (!message) return null;

  const toneClasses =
    tone === "error"
      ? "border-rose-500/40 bg-rose-500/90 text-white shadow-rose-500/30"
      : "border-emerald-500/40 bg-emerald-500 text-slate-900 shadow-emerald-500/40";

  return (
    <div className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl transition ${toneClasses}`}>
      {message}
    </div>
  );
}
