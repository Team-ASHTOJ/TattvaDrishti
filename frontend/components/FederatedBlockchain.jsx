"use client";

import { useState, useEffect } from "react";

export default function FederatedBlockchain() {
  const [chain, setChain] = useState([]);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchChain = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/federated/chain");
      const data = await res.json();
      setChain(data.chain || []);
    } catch (error) {
      console.error("Failed to fetch blockchain:", error);
    }
  };

  const validateChain = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/federated/validate");
      const data = await res.json();
      setValidation(data);
    } catch (error) {
      console.error("Failed to validate blockchain:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChain();
    const interval = setInterval(fetchChain, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Federated Blockchain Ledger</h2>
          <p className="mt-1 text-sm text-slate-400">
            Tamper-proof audit trail for cross-border intelligence sharing
          </p>
        </div>
        <button
          onClick={validateChain}
          disabled={loading}
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {loading ? "Validating..." : "Validate Network"}
        </button>
      </header>

      {validation && (
        <section className="rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Network Validation Status
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Local Chain</p>
              <p className={`mt-1 font-semibold ${validation.self_valid ? "text-emerald-300" : "text-rose-300"}`}>
                {validation.self_valid ? "Valid" : "Invalid"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Network Status</p>
              <p className={`mt-1 font-semibold ${validation.network_valid ? "text-emerald-300" : "text-rose-300"}`}>
                {validation.network_valid ? "Consensus" : "Divergent"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Chain Length</p>
              <p className="mt-1 font-mono text-sm font-semibold text-cyan-200">
                {validation.chain_length}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Tampered Nodes</p>
              <p className={`mt-1 font-semibold ${validation.tampered_nodes.length === 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {validation.tampered_nodes.length}
              </p>
            </div>
          </div>
          
          {validation.tampered_nodes.length > 0 && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">
                Tampered Nodes Detected
              </p>
              <ul className="mt-2 space-y-1 text-xs text-rose-200">
                {validation.tampered_nodes.map((node) => (
                  <li key={node} className="font-mono">• {node}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Blockchain ({chain.length} blocks)
        </h3>
        <div className="mt-4 max-h-[600px] space-y-3 overflow-y-auto">
          {chain.length === 0 ? (
            <p className="text-center text-sm text-slate-500">No blocks in chain yet.</p>
          ) : (
            chain.map((block) => (
              <article
                key={block.index}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                      {block.index}
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Block #{block.index}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                        {new Date(block.timestamp * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Hash</p>
                    <p className="mt-0.5 font-mono text-[10px] text-emerald-200">
                      {block.hash.substring(0, 16)}...
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500">Previous Hash: </span>
                    <span className="font-mono text-[10px] text-cyan-200">
                      {block.previous_hash.substring(0, 32)}...
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Public Key: </span>
                    <span className="font-mono text-[10px] text-fuchsia-200">
                      {block.public_key.substring(0, 32)}...
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Signature: </span>
                    <span className="font-mono text-[10px] text-amber-200">
                      {block.signature.substring(0, 32)}...
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
