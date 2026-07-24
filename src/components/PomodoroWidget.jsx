import { useState, useRef, useCallback, useEffect } from "react";
import { useCountdown } from "../hooks/useCountdown";

const MINUTOS_DISPONIBLES = [5, 10, 25, 30];

export default function PomodoroWidget({ open, onClose }) {
  // 1. Iniciar en 0 para que el cronómetro muestre 00:00 al abrir
  const [selectedMin, setSelectedMin] = useState(0);
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
    // 2. Reiniciar los minutos a 00:00 al terminar
    setSelectedMin(0);
  }, [selectedMin]);

  const { formatted, isRunning, start, pause, reset, setMinutes } = useCountdown(selectedMin, handleComplete);

  // Asegurarnos de que el hook interno también vuelva a 0 si selectedMin cambia a 0
  useEffect(() => {
    if (selectedMin === 0 && setMinutes && !isRunning) {
      setMinutes(0);
    }
  }, [selectedMin, setMinutes, isRunning]);

  // Limpieza de eventos de arrastre por seguridad (si el componente se desmonta)
  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragEnd);
      window.removeEventListener("touchmove", onDragMove);
      window.removeEventListener("touchend", onDragEnd);
    };
  }, []);

  function handleStart() {
    // Evitar iniciar si el tiempo es 00:00
    if (selectedMin === 0) return;

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
    if (e.type.includes("touch") || e.touches) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  }

  // 3. Modificación del sistema de arrastre
  function onDragStart(e) {
    const rect = widgetRef.current.getBoundingClientRect();
    const { clientX, clientY } = getCoordinates(e);
    dragRef.current = { dragging: true, moved: false, offsetX: clientX - rect.left, offsetY: clientY - rect.top };
    setPos({ top: rect.top, left: rect.left });

    // Enlazamos los eventos al window para que el mouse no se "escape"
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("touchend", onDragEnd);
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

    // Retiramos los eventos del window al soltar el click
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
    window.removeEventListener("touchmove", onDragMove);
    window.removeEventListener("touchend", onDragEnd);
  }

  function handleIconClick() {
    if (!dragRef.current.moved) {
      setIsCollapsed(false);
    }
  }

  function handleHeaderClick() {
    if (!dragRef.current.moved && isRunning) {
      setIsCollapsed(true);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={widgetRef}
      // Ya no necesitamos onMouseMove, onMouseUp, etc. aquí
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
            onClick={handleHeaderClick}
            className="pomo-widget__header"
            style={{
              touchAction: "none",
              cursor: "grab",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div><i className="fas fa-clock" /> Pomodoro</div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {isRunning && <i className="fas fa-minus" title="Minimizar" style={{ cursor: "pointer", opacity: 0.8 }} />}
              <i
                className="fas fa-times"
                title="Cerrar"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                style={{ cursor: "pointer", opacity: 0.8, fontSize: "16px" }}
              />
            </div>
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
                  {/* Se deshabilita visualmente si está en 0 */}
                  <button onClick={handleStart} className="pomo-widget__icon-btn" style={{ opacity: selectedMin === 0 ? 0.5 : 1, cursor: selectedMin === 0 ? "not-allowed" : "pointer" }}>
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

      <audio ref={loudRef} src="sonidos/loud-alarm-ringtones-annoying.mp3" preload="auto" />
      <audio ref={alienRef} src="sonidos/alien-alarmdrum.mp3" preload="auto" />
    </div>
  );
}