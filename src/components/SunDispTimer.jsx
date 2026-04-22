import { useEffect, useRef, useState } from "react";
import "./SunTimelapsePlayer.css";

const FILTERS = [
  { id: "uv", name: "Ultraviolet", class: "filter-uv" },
  { id: "visible", name: "Visible Light", class: "filter-visible" },
  { id: "golden", name: "Golden Hour", class: "filter-golden" },
  { id: "infrared", name: "Infrared", class: "filter-infrared" }
];

// MUST MATCH CSS
const CANVAS_TOP = 70;
const CANVAS_HEIGHT = 60;
const MAX_SUNSPOT = 300;

export default function SunDispTimer() {
  const [frames, setFrames] = useState([]);
  const [sunspots, setSunspots] = useState({});
  const [index, setIndex] = useState(0);

  const canvasRef = useRef(null);

  /* ---------------- LOAD index.txt ---------------- */
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/assets/imaages/index.txt")
      .then((r) => r.text())
      .then((t) => {
        const parsed = t
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((date) => {
            const [y, m] = date.split("-").map(Number); // ✅ CHANGED
            return { date, year: y, month: m };
          });
        setFrames(parsed);
        setIndex(0);
      });
  }, []);

  /* ---------------- LOAD sunspot.txt ---------------- */
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/assets/imaages/sunspot.txt")
      .then((r) => r.text())
      .then((t) => {
        const map = {};
        t.split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((line) => {
            const [date, v] = line.split(",");
            map[date] = Number(v);
          });
        setSunspots(map);
      });
  }, []);

  /* ---------------- KEYBOARD SCRUB ---------------- */
  useEffect(() => {
    const handleKey = (e) => {
      if (!frames.length) return;
      if (e.key === "a" || e.key === "A") setIndex((i) => Math.max(i - 1, 0));
      if (e.key === "d" || e.key === "D")
        setIndex((i) => Math.min(i + 1, frames.length - 1));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [frames]);

  /* ---------------- MERGED DATA ---------------- */
  const merged = frames.map((f) => ({
    ...f,
    v: sunspots[f.date] ?? 0
  }));

  const current = merged[index];
  const progress =
    merged.length > 1 ? (index / (merged.length - 1)) * 100 : 0;

  /* ---------------- CANVAS GRAPH ---------------- */
  useEffect(() => {
    if (!canvasRef.current || merged.length < 2) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(0,255,120,0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    merged.forEach((p, i) => {
      const x = (i / (merged.length - 1)) * width;
      const y = height - (p.v / MAX_SUNSPOT) * height;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.strokeStyle = "#ffcc00";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= index; i++) {
      const p = merged[i];
      const x = (i / (merged.length - 1)) * width;
      const y = height - (p.v / MAX_SUNSPOT) * height;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [index, merged]);

  /* ---------------- KNOB Y ---------------- */
  const knobY =
    current
      ? CANVAS_TOP +
        (CANVAS_HEIGHT -
          (current.v / MAX_SUNSPOT) * CANVAS_HEIGHT)
      : CANVAS_TOP;

  /* ---------------- IMAGE PATH (MONTHLY) ---------------- */
  const imgPath =
    process.env.PUBLIC_URL +
    `/assets/imaages/${current?.year}/${String(current?.month).padStart(
      2,
      "0"
    )}/01.jpg`; // ✅ CHANGED

  /* ---------------- RENDER ---------------- */
  return (
    <div className="sun-player-container">
      {!current ? (
        <div style={{ padding: 20, color: "#aaa" }}>
          Loading solar timeline…
        </div>
      ) : (
        <>
          <div className="solar-grid">
            {FILTERS.map((f) => (
              <div key={f.id} className="grid-item">
                <div className={`image-container ${f.class}`}>
                  <img src={imgPath} alt={current.date} />
                  <div className="fits-info">
                    {current.date} · Sunspots: {current.v.toFixed(1)}
                  </div>
                </div>
                <div className="grid-label">
                  {f.name} ({current.date})
                </div>
              </div>
            ))}
          </div>

          <div className="player-controls">
            <div className="timeline-area">
              <canvas
                ref={canvasRef}
                width={800}
                height={60}
                className="trace-canvas"
              />

              <input
                type="range"
                min="0"
                max={merged.length - 1}
                value={index}
                onChange={(e) => setIndex(Number(e.target.value))}
                className="slider-input"
              />

              <div className="val-tooltip" style={{ left: `${progress}%` }}>
                 {current.v.toFixed(1)}
              </div>

              <div
                className="trace-knob"
                style={{ left: `${progress}%`, top: `${knobY}px` }}
              />

              <div
                className="year-display"
                style={{ left: `${progress}%`, top: `${knobY + 18}px` }}
              >
                {current.date}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
