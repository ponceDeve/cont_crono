import { useState, useRef, useCallback } from "react";
import { useCountdown } from "../hooks/useCountdown";

const MINUTOS_DISPONIBLES = [5, 10, 25, 30];

export default function PomodoroWidget({ open, onClose }) {
  const [selectedMin, setSelectedMin] = useState(25);
  const [pos, setPos] = useState({ top: 90, left: null }); // left null = pegado a la derecha por CSS
  const widgetRef = useRef(null);
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });

  const loudRef = useRef(null);
  const alienRef = useRef(null);

  const handleComplete = useCallback(() => {
    const audio = selectedMin === 25 ? loudRef.current : alienRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }, [selectedMin]);

  const { formatted, isRunning, start, pause, reset, setMinutes } = useCountdown(selectedMin, handleComplete);

  function pickMinutes(min) {
    setSelectedMin(min);
    setMinutes(min);
  }

  function stopAlarms() {
    [loudRef.current, alienRef.current].forEach((a) => {
      if (!a) return;
      a.pause();
      a.currentTime = 0;
    });
  }

  function onDragStart(e) {
    const rect = widgetRef.current.getBoundingClientRect();
    dragRef.current = { dragging: true, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
    setPos({ top: rect.top, left: rect.left });
  }

  function onDragMove(e) {
    if (!dragRef.current.dragging) return;
    const w = widgetRef.current;
    let newLeft = e.clientX - dragRef.current.offsetX;
    let newTop = e.clientY - dragRef.current.offsetY;
    newLeft = Math.max(0, Math.min(window.innerWidth - w.offsetWidth, newLeft));
    newTop = Math.max(0, Math.min(window.innerHeight - w.offsetHeight, newTop));
    setPos({ top: newTop, left: newLeft });
  }

  function onDragEnd() {
    dragRef.current.dragging = false;
  }

  if (!open) return null;

  return (
    <div
      ref={widgetRef}
      onMouseMove={onDragMove}
      onMouseUp={onDragEnd}
      onMouseLeave={onDragEnd}
      className="pomo-widget"
      style={{
        top: pos.top,
        left: pos.left ?? undefined,
        right: pos.left === null ? 20 : undefined,
      }}
    >
      <div onMouseDown={onDragStart} className="pomo-widget__header">
        <i className="fas fa-clock" /> Pomodoro
      </div>
      <div className="pomo-widget__body">
        {!isRunning && (
          <>
            <div className="pomo-widget__time" onClick={stopAlarms}>
              {formatted}
            </div>
            <div className="pomo-widget__grid">
              {MINUTOS_DISPONIBLES.map((min) => (
                <button
                  key={min}
                  onClick={() => pickMinutes(min)}
                  className={`pomo-widget__min-btn ${selectedMin === min ? "is-active" : ""}`}
                >
                  {min}
                </button>
              ))}
            </div>
            <div className="pomo-widget__controls">
              <button onClick={start} className="pomo-widget__icon-btn">
                <i className="fas fa-play" />
              </button>
              <button onClick={() => reset()} className="pomo-widget__icon-btn">
                <i className="fas fa-rotate-left" />
              </button>
            </div>
          </>
        )}
        {isRunning && (
          <div className="pomo-widget__time" onClick={pause} title="Clic para pausar">
            {formatted}
          </div>
        )}
      </div>
      <audio ref={loudRef} src="/sonidos/loud-alarm-ringtones-annoying.mp3" preload="auto" />
      <audio ref={alienRef} src="/sonidos/alien-alarmdrum.mp3" preload="auto" />
    </div>
  );
}
