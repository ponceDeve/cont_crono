import React, { useEffect, useState } from "react";

export default function TopicsModal({
  open,
  onClose,
  curso,
  temaActual,
  listaTemas = [],
  onSelectTema
}) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hasHover, setHasHover] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      setHasHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    }
  }, []);

  if (!open) return null;

  function leerNombre(item) {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(item.tema);
      utterance.lang = "es-ES";
      window.speechSynthesis.speak(utterance);
    }
  }

  function manejarClickTema(item, index) {
    // Solo en dispositivos con mouse real el hover ya cuenta como "primer vistazo".
    // En táctil/pantallas chicas (sin hover real) siempre exige el segundo tap,
    // aunque el navegador dispare un mouseover falso al tocar.
    if (hasHover && hoveredIndex === index) {
      onSelectTema(item);
      onClose();
      return;
    }

    if (activeIndex === index) {
      onSelectTema(item);
      onClose();
      setActiveIndex(null);
      return;
    }

    // Primer tap: solo muestra el nombre flotando y lo lee.
    setActiveIndex(index);
    leerNombre(item);
  }

  function manejarHover(item, index) {
    setHoveredIndex(index);
    leerNombre(item);
  }

  return (
    <div
      className="levels-modal"
      style={{ zIndex: 1000 }}
      onClick={() => setActiveIndex(null)}
    >
      <div className="levels-modal__inner" onClick={(e) => e.stopPropagation()}>
        <h2 className="levels-modal__title">Temas de {curso}</h2>

        <div className="levels-modal__grid">
          {listaTemas.map((item, index) => {
            const esTemaActual = item.tema === temaActual;
            const tooltipVisible = hoveredIndex === index || activeIndex === index;

            return (
              <div key={index} className="level-cell">
                {tooltipVisible && (
                  <div className="level-tooltip">{item.tema}</div>
                )}

                <button
                  className={`level-btn ${esTemaActual ? 'is-current' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    manejarClickTema(item, index);
                  }}
                  onMouseOver={() => manejarHover(item, index)}
                  onMouseOut={() => setHoveredIndex(null)}
                >
                  {index + 1}
                </button>
              </div>
            );
          })}
        </div>

        {listaTemas.length === 0 && (
          <p style={{ color: "var(--ink-soft)", marginBottom: "20px" }}>
            No hay temas registrados para este curso.
          </p>
        )}

        {/* Botón de cerrar usando tu clase ya existente */}
        <button className="levels-modal__close" onClick={onClose}>
          Cerrar mapa
        </button>
      </div>
    </div>
  );
}