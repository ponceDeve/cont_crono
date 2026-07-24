import { useState, useMemo, useEffect } from "react";
import manifest from "../../data/manifest.json";
import { useArrowKeyList } from "../../hooks/useArrowKeyList";

export default function SearchModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();

    // Cursos cuyo nombre coincide directamente...
    const porNombre = manifest.cursos.filter((c) => c.nombre.toLowerCase().includes(q));

    // ...más cursos que tienen algún tema que coincide (el tema nunca se
    // muestra suelto en la lista, solo el curso que lo contiene).
    const nombresYaIncluidos = new Set(porNombre.map((c) => c.nombre));
    const porTema = manifest.cursos.filter(
      (c) =>
        !nombresYaIncluidos.has(c.nombre) &&
        c.temas.some((t) => t.tema.toLowerCase().includes(q)),
    );

    return [...porNombre, ...porTema]
      .map((c) => ({ type: "curso", nombre: c.nombre }))
      .slice(0, 15);
  }, [query]);

  const { focusedIdx, handleKeyDown } = useArrowKeyList(results, (item) => {
    onSelect(item);
    setQuery("");
    onClose();
  });

  // Si lo escrito coincide con el nombre de un tema puntual, Enter debe
  // llevar directo a ese tema (sin pasar por el mapa de temas del curso).
  function manejarKeyDown(e) {
    if (e.key === "Enter") {
      const q = query.trim().toLowerCase();
      if (q) {
        for (const c of manifest.cursos) {
          const t = c.temas.find((t) => t.tema.toLowerCase().includes(q));
          if (t) {
            e.preventDefault();
            onSelect({ type: "tema", curso: c.nombre, tema: t.tema, archivo: t.archivo });
            setQuery("");
            onClose();
            return;
          }
        }
      }
    }
    handleKeyDown(e);
  }

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
          onKeyDown={manejarKeyDown}
          placeholder="Buscar tema o curso..."
          className="search-input"
        />

        {results.length > 0 && (
          <div className="search-results">
            {results.map((r, i) => {
              const isFocused = i === focusedIdx;

              return (
                <button
                  key={`curso-${r.nombre}`}
                  onClick={() => {
                    onSelect(r);
                    setQuery("");
                    onClose();
                  }}
                  className={`search-result-item is-curso ${isFocused ? "is-focused" : ""}`}
                >
                  <span className="curso-title">{r.nombre}</span>
                </button>
              );
            })}
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <p className="search-empty">Sin resultados para "{query}"</p>
        )}
      </div>
    </div>
  );
}