import { useState, useRef, useCallback } from "react";
import { useCountdown } from "../hooks/useCountdown";

const MINUTOS_DISPONIBLES = [5, 10, 25, 30];

export default function PomodoroWidget({ open, onClose }) {
  const [selectedMin, setSelectedMin] = useState(25);
  const [pos, setPos] = useState({ top: 90, left: null });
  const [isCollapsed, setIsCollapsed] = useState(false);

  const widgetRef = useRef(null);
  const dragRef = useRef({ dragging: false, moved: false, offsetX: 0, offsetY: 0 });

  const loudRef = useRef(null);
  const alienRef = useRef(null);

  const handleComplete = useCallback(() => {
    setIsCollapsed(false);
    const audio = selectedMin === 25 ? loudRef.current : alienRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => { });
    }
  }, [selectedMin]);

  const { formatted, isRunning, start, pause, reset, setMinutes } = useCountdown(selectedMin, handleComplete);

  function handleStart() {
    start();
    if (window.innerWidth <= 768) {
      setIsCollapsed(true);
    }
  }

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

  function getCoordinates(e) {
    if (e.type.includes("touch")) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  }

  function onDragStart(e) {
    const rect = widgetRef.current.getBoundingClientRect();
    const { clientX, clientY } = getCoordinates(e);
    dragRef.current = { dragging: true, moved: false, offsetX: clientX - rect.left, offsetY: clientY - rect.top };
    setPos({ top: rect.top, left: rect.left });
  }

  function onDragMove(e) {
    if (!dragRef.current.dragging) return;
    dragRef.current.moved = true;

    const { clientX, clientY } = getCoordinates(e);
    const w = widgetRef.current;
    let newLeft = clientX - dragRef.current.offsetX;
    let newTop = clientY - dragRef.current.offsetY;
    newLeft = Math.max(0, Math.min(window.innerWidth - w.offsetWidth, newLeft));
    newTop = Math.max(0, Math.min(window.innerHeight - w.offsetHeight, newTop));
    setPos({ top: newTop, left: newLeft });
  }

  function onDragEnd() {
    dragRef.current.dragging = false;
  }

  // Abre el widget desde el icono
  function handleIconClick() {
    if (!dragRef.current.moved) {
      setIsCollapsed(false);
    }
  }

  // NUEVO: Cierra el widget desde el header (solo si está corriendo el tiempo y no se está arrastrando)
  function handleHeaderClick() {
    if (!dragRef.current.moved && isRunning) {
      setIsCollapsed(true);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={widgetRef}
      onMouseMove={onDragMove}
      onMouseUp={onDragEnd}
      onMouseLeave={onDragEnd}
      onTouchMove={onDragMove}
      onTouchEnd={onDragEnd}
      onTouchCancel={onDragEnd}
      className={`pomo-widget ${isCollapsed ? "is-collapsed" : ""}`}
      style={{
        top: pos.top,
        left: pos.left ?? undefined,
        right: pos.left === null ? 20 : undefined,
        ...(isCollapsed ? {
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          padding: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          backgroundColor: "#2c3e50",
          color: "#fff",
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
          zIndex: 9999
        } : {})
      }}
    >
      {isCollapsed ? (
        <div
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          onClick={handleIconClick}
          style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", touchAction: "none", cursor: "grab" }}
        >
          <i className="fas fa-clock" style={{ fontSize: "24px" }} />
        </div>
      ) : (
        <>
          <div
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            onClick={handleHeaderClick} // NUEVO: Permite minimizar al hacer clic
            className="pomo-widget__header"
            // NUEVO: Añadimos flexbox al header para acomodar el icono de minimizar
            style={{
              touchAction: "none",
              cursor: "grab",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div><i className="fas fa-clock" /> Pomodoro</div>
            {/* NUEVO: Indicador visual de que se puede minimizar */}
            {isRunning && <i className="fas fa-minus" title="Minimizar" style={{ cursor: "pointer", opacity: 0.8 }} />}
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
                  <button onClick={handleStart} className="pomo-widget__icon-btn">
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
        </>
      )}

      <audio ref={loudRef} src="/sonidos/loud-alarm-ringtones-annoying.mp3" preload="auto" />
      <audio ref={alienRef} src="/sonidos/alien-alarmdrum.mp3" preload="auto" />
    </div>
  );
}