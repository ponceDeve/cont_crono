import { useState } from "react";

export default function LevelsModal({
  open,
  onClose,
  flatPuntos = [],
  maxUnlocked,
  current,
  onSelect,
  levelCompletions = {},
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!open) return null;

  const total = flatPuntos.length;

  return (
    <div className="levels-modal">
      <div className="levels-modal__inner">
        <h2 className="levels-modal__title">Seleccionar Nivel</h2>

        <div className="levels-modal__grid">
          {Array.from({ length: total }).map((_, i) => {
            const locked = i > maxUnlocked;
            const isCurrent = i === current;
            const completions = levelCompletions[i] || 0;
            return (
              <div key={i} className="level-cell">
                {hoveredIdx === i && !locked && completions > 0 && (
                  <div className="level-tooltip">
                    ✓ Completado {completions} {completions === 1 ? "vez" : "veces"}
                  </div>
                )}
                <button
                  disabled={locked}
                  onClick={() => {
                    onSelect(i);
                    onClose();
                  }}
                  onMouseOver={() => setHoveredIdx(i)}
                  onMouseOut={() => setHoveredIdx(null)}
                  className={`level-btn ${isCurrent ? "is-current" : ""}`}
                >
                  {locked ? <i className="fas fa-lock" /> : i + 1}
                </button>
              </div>
            );
          })}
        </div>

        <button onClick={onClose} className="levels-modal__close">
          <i className="fas fa-times" /> Volver al Juego
        </button>
      </div>
    </div>
  );
}
