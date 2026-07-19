import { useState, useMemo, useEffect } from "react";
import manifest from "../../data/manifest.json";
import { useArrowKeyList } from "../../hooks/useArrowKeyList";

// Preparamos la lista de búsqueda incluyendo cursos y temas
const OPCIONES_BUSQUEDA = [
  ...manifest.cursos.map((c) => ({
    type: "curso",
    nombre: c.nombre
  })),
  ...manifest.cursos.flatMap((c) =>
    c.temas.map((t) => ({
      type: "tema",
      curso: c.nombre,
      tema: t.tema,
      archivo: t.archivo
    }))
  ),
];

export default function SearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();

    return OPCIONES_BUSQUEDA.filter((item) => {
      if (item.type === "curso") {
        return item.nombre.toLowerCase().includes(q);
      }
      return item.tema.toLowerCase().includes(q) || item.curso.toLowerCase().includes(q);
    }).slice(0, 8);
  }, [query]);

  const { focusedIdx, handleKeyDown } = useArrowKeyList(results, (item) => {
    onSelect(item);
    setQuery("");
    onClose();
  });

  useEffect(() => {
    if (!open) return;
    function onEsc(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="search-overlay"
    >
      <div className="search-box">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar tema o curso..."
          className="search-input"
        />

        {results.length > 0 && (
          <div className="search-results">
            {results.map((r, i) => (
              <button
                key={r.type === "curso" ? r.nombre : r.archivo}
                onClick={() => {
                  onSelect(r); // Enviamos el objeto con su tipo al padre
                  setQuery("");
                  onClose();
                }}
                className={`search-result-item ${i === focusedIdx ? "is-focused" : ""}`}
              >
                {r.type === "curso" ? (
                  // Diseño visual para Cursos
                  <div className="search-result-item__curso-row">
                    <span className="search-result-item__tag">📚 Curso</span>
                    <span className="search-result-item__nombre">{r.nombre}</span>
                  </div>
                ) : (
                  // Diseño visual para Temas
                  <>
                    <p className="search-result-item__tema">{r.tema}</p>
                    <p className="search-result-item__curso">{r.curso}</p>
                  </>
                )}
              </button>
            ))}
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <p className="search-empty">Sin resultados para "{query}"</p>
        )}
      </div>
    </div>
  );
}