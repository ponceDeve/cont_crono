import React from "react";

export default function TopicsModal({
  open,
  onClose,
  curso,
  temaActual,
  listaTemas = [],
  onSelectTema
}) {
  if (!open) return null;

  return (
    <div className="levels-modal" style={{ zIndex: 1000 }}>
      <div className="levels-modal__inner">
        <h2 className="levels-modal__title">Temas de {curso}</h2>

        <div className="levels-modal__grid">
          {listaTemas.map((item, index) => {
            const esTemaActual = item.tema === temaActual;

            return (
              <div key={index} className="level-cell">
                {/* Tooltip nativo usando tu clase de CSS */}
                <div className="level-tooltip">
                  {item.tema}
                </div>

                <button
                  className={`level-btn ${esTemaActual ? 'is-current' : ''}`}
                  onClick={() => {
                    onSelectTema(item);
                    onClose();
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