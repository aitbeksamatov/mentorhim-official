import React, { useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";

/**
 * Circle Network — three-level radial navigator
 * Level 1: Countries → Level 2: People → Level 3: Students
 *
 * Drop this component into a Tailwind + Framer Motion React app.
 * Install deps:  npm i framer-motion
 *
 * Optional: tweak the `DATA` object to match your real structure.
 */

// --- Demo data (inspired by your sketches) ---
const DATA = {
  countries: [
    {
      id: "kg",
      name: "Kyrgyzstan",
      people: [
        {
          id: "adam",
          name: "Janybek",
          students: [
            { id: "nurs", name: "Nursultan" },
            { id: "medet", name: "Medet" },
            { id: "erjan", name: "Erjan" },
            { id: "dastan", name: "Dastan" },
          ],
        },
        { id: "john", name: "John", students: [{ id: "nick", name: "Nick" }] },
      ],
    },
    {
      id: "kz",
      name: "Kazakhstan",
      people: [
        { id: "askar", name: "Askar", students: [{ id: "ali", name: "Ali" }] },
        { id: "diana", name: "Diana", students: [] },
      ],
    },
    { id: "zw", name: "Uzbekistan", people: [] },
    { id: "ph", name: "Russia", people: [] },
  ],
};

// --- Helpers ---
function useContainerSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        setSize({ width: cr.width, height: cr.height });
      }
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

function polarToXY(cx, cy, r, angle) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function generateRadialLayout(count, box, radiusRatio = 0.36, rotation = -Math.PI / 2) {
  const cx = box.width / 2;
  const cy = box.height / 2;
  const r = Math.min(box.width, box.height) * radiusRatio;

  // чтобы при 2 узлах линии не накладывались
  const effective = count === 2 ? 3 : Math.max(count, 1);
  const step = (Math.PI * 2) / effective;

  const positions = new Array(count).fill(0).map((_, i) => {
    const a = rotation + i * step;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

  return { cx, cy, r, positions };
}


// Shared styles
const circleBase =
  "absolute flex items-center justify-center rounded-full select-none cursor-pointer text-center shadow-xl ring-1 ring-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors";

const lineStyle = { stroke: "currentColor", strokeWidth: 2 };

function Breadcrumb({ path, onCrumb }) {
  return (
    <div className="pointer-events-auto mb-2 text-sm md:text-base text-white/80">
      {path.map((p, idx) => (
        <span key={idx}>
          {idx > 0 && <span className="mx-2 opacity-60">/</span>}
          <button
            onClick={() => onCrumb(idx)}
            className="underline decoration-dotted underline-offset-4 hover:text-white"
          >
            {p}
          </button>
        </span>
      ))}
    </div>
  );
}

function CenterBadge({ label }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 text-center">
      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs md:text-sm text-white/90 ring-1 ring-white/20 backdrop-blur">
        <div className="h-2 w-2 animate-pulse rounded-full bg-white/80" />
        {label}
      </div>
    </div>
  );
}

function Node({ id, label, size, layoutId, onClick, style, highlight = false }) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      onClick={onClick}
      className={`${circleBase}`}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.98 }}
      style={{ width: size, height: size, ...style }}
    >
      <div
        className={`px-3 text-[12px] md:text-sm text-white ${
          highlight ? "font-semibold" : ""
        }`}
      >
        {label}
      </div>
      {/* Glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full"
        animate={{ boxShadow: highlight ? "0 0 32px rgba(255,255,255,0.25)" : "0 0 0 rgba(0,0,0,0)" }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </motion.div>
  );
}

export default function CircleNetwork() {
  const [level, setLevel] = useState(1); // 1=countries, 2=people, 3=students
  const [countryId, setCountryId] = useState(null);
  const [personId, setPersonId] = useState(null);

  const containerRef = useRef(null);
  const size = useContainerSize(containerRef);

  const { countries } = DATA;
  const country = useMemo(
    () => countries.find((c) => c.id === countryId) || null,
    [countries, countryId]
  );
  const person = useMemo(
    () => country?.people?.find((p) => p.id === personId) || null,
    [country, personId]
  );

  const nodes = useMemo(() => {
    if (level === 1) return countries.map((c) => ({ id: c.id, label: c.name }));
    if (level === 2)
      return (country?.people || []).map((p) => ({ id: p.id, label: p.name }));
    return (person?.students || []).map((s) => ({ id: s.id, label: s.name }));
  }, [level, countries, country, person]);

  const centerLabel = level === 1 ? "Страны" : level === 2 ? country?.name : person?.name;

  const layout = useMemo(
    () => generateRadialLayout(nodes.length, size, level === 1 ? 0.34 : 0.38),
    [nodes.length, size, level]
  );

  // Sizes
  const base = Math.max(Math.min(size.width, size.height) * 0.12, 64);
  const centerSize = Math.max(Math.min(size.width, size.height) * 0.22, 90);

  function handleNodeClick(id) {
    if (level === 1) {
      setCountryId(id);
      setLevel(2);
    } else if (level === 2) {
      setPersonId(id);
      setLevel(3);
    }
  }

  function goBack() {
    if (level === 3) {
      setLevel(2);
      setPersonId(null);
    } else if (level === 2) {
      setLevel(1);
      setCountryId(null);
    }
  }

  const breadcrumbs = ["Страны"]; // root
  if (country) breadcrumbs.push(country.name);
  if (person) breadcrumbs.push(person.name);

  // center node layoutId enables a beautiful morph animation
  const centerLayoutId = person?.id || country?.id || "center";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-slate-950">
      {/* Background */}
      <BackgroundFX />

      {/* Header / Breadcrumbs */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 md:p-6">
        <Breadcrumb path={breadcrumbs} onCrumb={(i) => {
          if (i === 0) {
            setLevel(1); setCountryId(null); setPersonId(null);
          } else if (i === 1) {
            setLevel(2); setPersonId(null);
          }
        }} />
        <div className="pointer-events-auto flex items-center gap-2">
          {level > 1 && (
            <button
              onClick={goBack}
              className="rounded-full bg-white/10 px-3 py-1 text-xs md:text-sm text-white/90 ring-1 ring-white/20 hover:bg-white/20 backdrop-blur"
            >
              Назад
            </button>
          )}
        </div>
      </div>

      {/* Stage */}
      <LayoutGroup>
        <div ref={containerRef} className="relative z-10 h-full w-full">
          {/* SVG lines */}
          <svg className="absolute inset-0 h-full w-full text-slate-500/70">
            <AnimatePresence>
              {nodes.map((n, i) => {
                const pos = layout.positions[i] || { x: layout.cx, y: layout.cy };
                return (
                  <motion.line
                    key={n.id}
                    x1={layout.cx}
                    y1={layout.cy}
                    x2={pos.x}
                    y2={pos.y}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ pathLength: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={lineStyle}
                  />
                );
              })}
            </AnimatePresence>
          </svg>

          {/* Center node label */}
          <CenterBadge label={centerLabel || ""} />

          {/* Center node */}
          <motion.div
            layout
            layoutId={centerLayoutId}
            className={`${circleBase} pointer-events-none`}
            style={{
              width: centerSize,
              height: centerSize,
              left: layout.cx - centerSize / 2,
              top: layout.cy - centerSize / 2,
            }}
          >
            <div className="px-4 text-white/90 text-sm md:text-base font-semibold">
              {centerLabel}
            </div>
          </motion.div>

          {/* Nodes */}
          <AnimatePresence>
            {nodes.map((n, i) => {
              const pos = layout.positions[i] || { x: layout.cx, y: layout.cy };
              const style = { left: pos.x - base / 2, top: pos.y - base / 2 };
              return (
                <Node
                  key={n.id}
                  id={n.id}
                  label={n.label}
                  size={base}
                  layoutId={n.id}
                  onClick={() => handleNodeClick(n.id)}
                  style={style}
                />
              );
            })}
          </AnimatePresence>

          {/* Empty state */}
          {level > 1 && nodes.length === 0 && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white/70">
              <p className="text-sm md:text-base">Пока здесь пусто.</p>
            </div>
          )}
        </div>
      </LayoutGroup>

      {/* Footer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-center p-4 text-[11px] md:text-xs text-white/50">
        Нажимайте на кружочки, чтобы углубляться внутрь ↘
      </div>
    </div>
  );
}

function BackgroundFX() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* subtle gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_70%_20%,rgba(99,102,241,0.25),transparent_60%),radial-gradient(900px_500px_at_20%_70%,rgba(236,72,153,0.25),transparent_60%),linear-gradient(180deg,#0f172a,#020617)]" />
      {/* star noise */}
      <div className="absolute inset-0 opacity-[0.15] mix-blend-screen" style={{ backgroundImage:
        "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0 1px, transparent 2px 100px)" }} />
      {/* vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
    </div>
  );
}
