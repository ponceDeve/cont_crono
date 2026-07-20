import React, { useState } from "react";

export default function TopicsModal({
  open,
  onClose,
  curso,
  temaActual,
  listaTemas = [],
  onSelectTema
}) {
  const [activeIndex, setActiveIndex] = useState(null);

  if (!open) return null;

  function manejarClickTema(item, index) {
    if (activeIndex === index) {
      // Segundo clic sobre la misma celda: recién ahí entra al tema
      onSelectTema(item);
      onClose();
      setActiveIndex(null);
    } else {
      // Primer clic: muestra el nombre flotando y lo lee en voz alta
      setActiveIndex(index);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(item.tema);
        utterance.lang = "es-ES";
        window.speechSynthesis.speak(utterance);
      }
    }
  }

  return (
    <div
      className="levels-modal"
      style={{ zIndex: 1000 }}
      onClick={() => setActiveIndex(null)}
    >
      <div className="levels-modal__inner" onClick={(e) => e.stopPropagation()}>
        <h2 className="levels-modal__title">Temas de {curso}</h2>

        {activeIndex !== null && listaTemas[activeIndex] && (
          <div className="level-tema-banner">{listaTemas[activeIndex].tema}</div>
        )}

        <div className="levels-modal__grid">
          {listaTemas.map((item, index) => {
            const esTemaActual = item.tema === temaActual;

            return (
              <div key={index} className="level-cell">
                <button
                  className={`level-btn ${esTemaActual ? 'is-current' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    manejarClickTema(item, index);
                  }}
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