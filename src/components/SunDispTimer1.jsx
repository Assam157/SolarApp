import { useEffect, useRef, useState } from "react";
import "./SunTimelapsePlayer.css";

const IMAGE_BASE = "/assets/images";

/* Filters unchanged */
const FILTERS = [
  { id: "uv", name: "Ultraviolet", class: "filter-uv" },
  { id: "visible", name: "Visible Light", class: "filter-visible" },
  { id: "golden", name: "Golden Hour", class: "filter-golden" },
  { id: "infrared", name: "Infrared", class: "filter-infrared" }
];

export default function SunTimelapsePlayer() {
  const [timeline, setTimeline] = useState([]);
  const [sunspots, setSunspots] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef(null);

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    Promise.all([
      fetch(`${IMAGE_BASE}/index.txt`).then(r => r.text()),
      fetch(`${IMAGE_BASE}/sunspot.txt`).then(r => r.text())
    ]).then(([indexTxt, sunspotTxt]) => {
      const idx = indexTxt.trim().split("\n");

      const spots = sunspotTxt
        .trim()
        .split("\n")
        .map(line => {
          const [k, v] = line.split(",");
          return { key: k, value: parseFloat(v) };
        });

      setTimeline(idx);
      setSunspots(spots);
      setIndex(0);
    });
  }, []);

  if (!timeline.length || !sunspots.length) return null;

  const current = sunspots[index];
  const [year, month] = current.key.split("-");
  const currentVal = current.value;
  const maxVal = 200;

  /* ---------------- AUTOPLAY ---------------- */
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setIndex(i => (i < timeline.length - 1 ? i + 1 : 0));
    }, 250);
    return () => clearInterval(id);
  }, [playing, timeline.length]);

  /* ---------------- CHART ---------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    // Full curve
    ctx.strokeStyle = "rgba(0,255,120,0.25)";
    ctx.beginPath();
    sunspots.forEach((p, i) => {
      const x = (i / (sunspots.length - 1)) * width;
      const y = height - (p.value / maxVal) * height;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Active trace
    ctx.strokeStyle = "#ffcc00";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= index; i++) {
      const p = sunspots[i];
      const x = (i / (sunspots.length - 1)) * width;
      const y = height - (p.value / maxVal) * height;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [index, sunspots]);

  const progress = (index / (timeline.length - 1)) * 100;
  const knobY = (currentVal / maxVal) * 50;

  const imgSrc = `${IMAGE_BASE}/${year}/${month}/01.jpg`;

  return (
    <div className="sun-player-container">
      <div className="solar-grid">
        {FILTERS.map(f => (
          <div key={f.id} className="grid-item">
            <div className={`image-container ${f.class}`}>
              <img
                src={imgSrc}
                alt={`Solar ${current.key}`}
                loading="lazy"
                onError={e => {
                  e.currentTarget.src = "/assets/images/placeholder.jpg";
                }}
              />
              <div className="fits-info">
                {year}-{month}
              </div>
            </div>
            <div className="grid-label">
              {f.name} ({year}-{month})
            </div>
          </div>
        ))}
      </div>

      <div className="player-controls">
        <button onClick={() => setPlaying(!playing)}>
          {playing ? "❚❚" : "▶"}
        </button>

        <div className="timeline-area">
          <canvas ref={canvasRef} width={800} height={60} />
          <input
            type="range"
            min="0"
            max={timeline.length - 1}
            value={index}
            onChange={e => {
              setPlaying(false);
              setIndex(+e.target.value);
            }}
          />

          <div
            className="trace-knob"
            style={{ left: `${progress}%`, bottom: `${40 + knobY}px` }}
          />

          <div className="year-display" style={{ left: `${progress}%` }}>
            {year}-{month}
          </div>
        </div>
      </div>
    </div>
  );
}
