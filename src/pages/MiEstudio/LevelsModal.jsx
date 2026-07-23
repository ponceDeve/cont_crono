import { useEffect, useState } from "react";
import { useFloatingTooltip } from "../../hooks/useFloatingTooltip";

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
  const [activeIdx, setActiveIdx] = useState(null);
  const [hasHover, setHasHover] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const { pos, mostrarEn, ocultar } = useFloatingTooltip(220);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      setHasHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setActiveIdx(null);
      setHoveredIdx(null);
      setBusqueda("");
      ocultar();
    }
  }, [open, ocultar]);

  if (!open) return null;

  const total = flatPuntos.length;

  function previewNivel(i) {
    const levelData = flatPuntos[i] || {};
    const textoBase = levelData.tema || levelData.nombre || levelData.q || levelData.textoConEspacios || "";
    return textoBase.length > 42 ? `${textoBase.slice(0, 42).trim()}…` : textoBase || `Nivel ${i + 1}`;
  }

  function manejarClick(i, locked, el) {
    if (locked) return;

    if (hasHover && hoveredIdx === i) {
      onSelect(i);
      onClose();
      return;
    }

    if (activeIdx === i) {
      onSelect(i);
      onClose();
      setActiveIdx(null);
      ocultar();
      return;
    }

    setActiveIdx(i);
    mostrarEn(el);
  }

  function manejarHover(i, locked, el) {
    if (locked) return;
    setHoveredIdx(i);
    mostrarEn(el);
  }

  function manejarSalidaHover() {
    setHoveredIdx(null);
    if (activeIdx === null) ocultar();
  }

  const indices = Array.from({ length: total }, (_, i) => i);
  const indicesFiltrados = busqueda.trim()
    ? indices.filter((i) => previewNivel(i).toLowerCase().includes(busqueda.trim().toLowerCase()))
    : indices;

  const idxVisible = hoveredIdx !== null ? hoveredIdx : activeIdx;

  return (
    <div
      className="levels-modal"
      onClick={() => {
        setActiveIdx(null);
        ocultar();
      }}
    >
      <div className="levels-modal__inner" onClick={(e) => e.stopPropagation()}>
        <h2 className="levels-modal__title">Seleccionar Nivel</h2>

        <div className="home-search levels-modal__search" onClick={(e) => e.stopPropagation()}>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar nivel..."
            className="home-search-input"
          />
        </div>

        {pos && idxVisible !== null && (
          <div
            className="level-tooltip is-visible"
            style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translate(-50%, -100%)" }}
          >
            {previewNivel(idxVisible)}
            {(levelCompletions[idxVisible] || 0) > 0 && (
              <div style={{ marginTop: "4px", fontSize: "0.85em" }}>
                ✓ Completado {levelCompletions[idxVisible]} {levelCompletions[idxVisible] === 1 ? "vez" : "veces"}
              </div>
            )}
          </div>
        )}

        <div className="levels-modal__grid">
          {indicesFiltrados.map((i) => {
            const locked = i > maxUnlocked;
            const isCurrent = i === current;

            return (
              <div key={i} className="level-cell">
                <button
                  disabled={locked}
                  onClick={(e) => {
                    e.stopPropagation();
                    manejarClick(i, locked, e.currentTarget);
                  }}
                  onMouseOver={(e) => manejarHover(i, locked, e.currentTarget)}
                  onMouseOut={manejarSalidaHover}
                  className={`level-btn ${isCurrent ? "is-current" : ""}`}
                >
                  {locked ? <i className="fas fa-lock" /> : i + 1}
                </button>
              </div>
            );
          })}
        </div>

        {indicesFiltrados.length === 0 && (
          <p style={{ color: "var(--ink-soft)", marginBottom: "20px" }}>
            Ningún nivel coincide con "{busqueda}".
          </p>
        )}

        <button onClick={onClose} className="levels-modal__close">
          <i className="fas fa-times" /> Volver al Juego
        </button>
      </div>
    </div>
  );
}