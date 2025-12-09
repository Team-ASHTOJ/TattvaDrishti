"use client";

import { useEffect, useRef, useState } from "react";

const MOCK_HOP_URL = "https://mock-hop-router.example/api/v1/trace";

const SAMPLE_HOPS = [
  {
    id: "IN-MUM-EDGE",
    name: "Analyst Edge Relay",
    city: "Mumbai, IN",
    coords: [19.076, 72.8777],
    ip: "10.14.33.2",
    provider: "ISP Edge South Asia",
    latency: 12,
  },
  {
    id: "AE-DXB-HUB",
    name: "Middle East Transit Hub",
    city: "Dubai, AE",
    coords: [25.2048, 55.2708],
    ip: "172.18.40.5",
    provider: "Subsea Gateway 5",
    latency: 18,
  },
  {
    id: "DE-FRA-IX",
    name: "Frankfurt Threat Exchange",
    city: "Frankfurt, DE",
    coords: [50.1109, 8.6821],
    ip: "192.168.240.12",
    provider: "DE-CIX Backbone",
    latency: 22,
  },
  {
    id: "GB-LHR-STACK",
    name: "London Fusion Stack",
    city: "London, UK",
    coords: [51.5072, -0.1276],
    ip: "100.64.11.7",
    provider: "Atlantic Bridge 3",
    latency: 14,
  },
  {
    id: "US-IAD-SOC",
    name: "Target SOC Collector",
    city: "Ashburn, US",
    coords: [39.0438, -77.4874],
    ip: "172.31.200.44",
    provider: "US Gov Cloud",
    latency: 18,
  },
];

function jitterLatency(latency) {
  const jitter = Math.round(Math.random() * 8 - 4);
  return Math.max(8, latency + jitter);
}

async function simulateHopTrace(message) {
  // Pretend to reach a mock URL while keeping everything client-side.
  console.info(`Mock hop trace POST ${MOCK_HOP_URL}`, { message });
  await new Promise((resolve) =>
    setTimeout(resolve, 800 + Math.random() * 600)
  );
  const hops = SAMPLE_HOPS.map((hop, index) => ({
    ...hop,
    latency: jitterLatency(hop.latency + index * 2),
    note:
      index === SAMPLE_HOPS.length - 1
        ? "Payload delivered to receiving SOC."
        : "Forwarding payload via encrypted tunnel.",
  }));
  const totalLatency = hops.reduce((acc, hop) => acc + hop.latency, 0);
  return { hops, totalLatency };
}

export default function HopTraceMap() {
  const [message, setMessage] = useState(
    "Escalate malign narrative indicators to NATO partners."
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hops, setHops] = useState(() => SAMPLE_HOPS);
  const [totalLatency, setTotalLatency] = useState(() =>
    SAMPLE_HOPS.reduce((acc, hop) => acc + hop.latency, 0)
  );
  const [lastTraceAt, setLastTraceAt] = useState(null);

  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const startIconRef = useRef(null);
  const endIconRef = useRef(null);

  useEffect(() => {
    let cleanup = () => {};
    let frameId;

    const initMap = async () => {
      if (mapRef.current) return;
      const container = containerRef.current;
      if (!container) return;
      const L = (await import("leaflet")).default;
      leafletRef.current = L;
      await import("leaflet.heat");
      const existingCss = document.querySelector(
        'link[href*="leaflet@1.9.4/dist/leaflet.css"]'
      );
      if (!existingCss) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const buildSvgIcon = (fill, glow) => {
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
          <svg width="40" height="60" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${glow}" flood-opacity="0.7" />
              </filter>
            </defs>
            <path filter="url(#shadow)" fill="${fill}" stroke="white" stroke-width="1.2" d="M12 0C6.48 0 2 4.48 2 10.02C2 17.54 11.05 24.87 11.43 25.17C11.6 25.3 11.8 25.37 12 25.37C12.2 25.37 12.4 25.3 12.57 25.17C12.95 24.87 22 17.54 22 10.02C22 4.48 17.52 0 12 0ZM12 14.37C9.59 14.37 7.63 12.41 7.63 10C7.63 7.59 9.59 5.63 12 5.63C14.41 5.63 16.37 7.59 16.37 10C16.37 12.41 14.41 14.37 12 14.37Z" />
          </svg>`;
        return L.icon({
          iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`,
          iconSize: [40, 60],
          iconAnchor: [20, 56],
          popupAnchor: [0, -50],
          className: "hop-marker-pin",
        });
      };

      startIconRef.current = buildSvgIcon("#22c55e", "#22c55e");
      endIconRef.current = buildSvgIcon("#f87171", "#f472b6");

      const map = L.map(container, {
        center: [30, 5],
        zoom: 2.5,
        worldCopyJump: true,
        zoomControl: true,
      });
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      ).addTo(map);
      mapRef.current = map;

      cleanup = () => {
        map.remove();
        mapRef.current = null;
        markersRef.current = [];
        polylineRef.current = null;
      };
    };

    frameId = requestAnimationFrame(() => {
      initMap().catch(() => {});
    });
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      cleanup();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    if (!hops.length) return;

    const latlngs = hops.map((hop) => hop.coords);
    const markers = hops.map((hop, index) => {
      const isStart = index === 0;
      const isEnd = index === hops.length - 1;
      if (isStart || isEnd) {
        const icon = isStart ? startIconRef.current : endIconRef.current;
        const marker = L.marker(hop.coords, { icon })
          .addTo(map)
          .bindTooltip(
            `<strong>Hop ${index + 1}</strong><br/>${hop.name}<br/>${hop.city}`,
            { permanent: false }
          );
        marker.bindPopup(
          `<div style="font-weight:600">${hop.name}</div>
           <div style="font-size:12px">${hop.city}</div>
           <div style="font-size:12px;margin-top:4px;">Latency: ${hop.latency} ms</div>`
        );
        return marker;
      }
      const marker = L.circleMarker(hop.coords, {
        radius: 8,
        color: "#22d3ee",
        weight: 2,
        fillColor: "#22d3ee",
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindTooltip(
          `<strong>Hop ${index + 1}</strong><br/>${hop.name}<br/>${hop.city}`,
          { permanent: false }
        );
      marker.bindPopup(
        `<div style="font-weight:600">${hop.name}</div>
         <div style="font-size:12px">${hop.city}</div>
         <div style="font-size:12px;margin-top:4px;">Latency: ${hop.latency} ms</div>`
      );
      return marker;
    });
    markersRef.current = markers;

    const polyline = L.polyline(latlngs, {
      color: "#22c55e",
      weight: 4,
      opacity: 0.9,
      dashArray: "4, 6",
    }).addTo(map);
    polylineRef.current = polyline;
    try {
      map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    } catch {
      // ignore
    }
  }, [hops]);

  const handleTrace = async (event) => {
    event.preventDefault();
    if (!message || message.trim().length < 12) {
      setError("Message must contain at least 12 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { hops: tracedHops, totalLatency: total } = await simulateHopTrace(
        message.trim()
      );
      setHops(tracedHops);
      setTotalLatency(total);
      setLastTraceAt(new Date());
      setToastMessage("Trace completed via mock hop service.");
    } catch (traceError) {
      console.error("Trace simulation failed", traceError);
      setError("Unable to reach the mock hop service.");
    } finally {
      setLoading(false);
    }
  };

  const [toastMessage, setToastMessage] = useState("");
  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(""), 3200);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/40">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-300">
            Network trace lab
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Message hop tracker
          </h2>
          <p className="text-sm text-slate-400">
            Visualise the relay path a payload takes through the mesh before it
            hits the receiving server. Data generated from a mock endpoint.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-xs text-slate-400">
          <p className="uppercase tracking-[0.3em] text-slate-500">Mock endpoint</p>
          <p className="mt-2 font-mono text-[11px] text-emerald-200">
            {MOCK_HOP_URL}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleTrace}
        className="mt-6 flex flex-col gap-3 md:flex-row md:items-end"
      >
        <label className="flex-1 text-sm text-slate-200">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Message payload
          </span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={2}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            placeholder="Describe the instruction delivered to the receiving SOC…"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-400/90 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Tracing…" : "Trace hops"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      {toastMessage && (
        <p className="mt-3 text-sm text-emerald-300">{toastMessage}</p>
      )}
      {lastTraceAt && (
        <p className="mt-1 text-xs text-slate-500">
          Last traced at {lastTraceAt.toLocaleTimeString()}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.85fr]">
        <div
          ref={containerRef}
          style={{ height: 420, borderRadius: 18, overflow: "hidden" }}
          className="w-full bg-white"
        />

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            Estimated travel time:{" "}
            <span className="font-semibold text-white">
              ~{totalLatency} ms
            </span>
          </div>
          {hops.map((hop, index) => (
            <article
              key={hop.id}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Hop {index + 1}</span>
                <span className="font-semibold text-emerald-200">
                  {hop.latency} ms
                </span>
              </div>
              <p className="mt-2 text-base font-semibold text-white">
                {hop.name}
              </p>
              <p className="text-sm text-slate-300">
                {hop.city} · {hop.ip}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {hop.provider}
              </p>
              <p className="mt-2 text-xs text-slate-400">{hop.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
