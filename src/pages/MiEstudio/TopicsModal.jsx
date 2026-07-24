import React, { useEffect, useRef, useState } from "react";

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
  const [busqueda, setBusqueda] = useState("");
  const [inputEnfocado, setInputEnfocado] = useState(false);
  const utteranceRef = useRef(null);
  const puntoInicioToque = useRef(null);

  // Si el dedo se movió más de esto entre el toque inicial y el click,
  // fue un scroll, no una selección real: se ignora el click.
  const UMBRAL_ARRASTRE = 10;

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      setHasHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    }
  }, []);

  // "Calienta" el motor de voz apenas se abre el modal.
  useEffect(() => {
    if (open && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
    if (!open) {
      setBusqueda("");
      setActiveIndex(null);
      setHoveredIndex(null);
      setInputEnfocado(false);
    }
  }, [open]);

  if (!open) return null;

  function leerNombre(item) {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const synth = window.speechSynthesis;
      if (synth.speaking) synth.cancel();
      const utterance = new SpeechSynthesisUtterance(item.tema);
      utterance.lang = "es-ES";
      utteranceRef.current = utterance;
      synth.speak(utterance);
    }
  }

  function detenerLectura() {
    if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }

  function manejarClickTema(item, index) {
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

    setActiveIndex(index);
  }

  function manejarHover(item, index) {
    setHoveredIndex(index);
    leerNombre(item);
  }

  function manejarSalidaHover() {
    setHoveredIndex(null);
  }

  // Si el usuario empieza a scrollear, se corta la lectura en curso para
  // que no siga leyendo un tema que ya quedó fuera de vista.
  function manejarScroll() {
    setActiveIndex(null);
    setHoveredIndex(null);
    detenerLectura();
  }

  function manejarToqueInicial(item, e) {
    puntoInicioToque.current = { x: e.clientX, y: e.clientY };
    if (!hasHover) {
      leerNombre(item);
    }
  }

  // Compara dónde empezó el toque (pointerdown) contra dónde terminó
  // (click) para distinguir un tap real de un scroll/arrastre.
  function fueArrastre(e) {
    const inicio = puntoInicioToque.current;
    if (!inicio) return false;
    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;
    return Math.sqrt(dx * dx + dy * dy) > UMBRAL_ARRASTRE;
  }

  const temasConIndice = listaTemas.map((item, index) => ({ item, index }));
  const temasFiltrados = busqueda.trim()
    ? temasConIndice.filter(({ item }) =>
      item.tema.toLowerCase().includes(busqueda.trim().toLowerCase())
    )
    : temasConIndice;

  return (
    <div
      className="levels-modal"
      style={{ zIndex: 1000 }}
      onClick={() => setActiveIndex(null)}
      onScroll={manejarScroll}
    >
      <div className="levels-modal__inner" onClick={(e) => e.stopPropagation()}>
        <h2 className="levels-modal__title">Temas de {curso}</h2>

        <div className="home-search levels-modal__search" onClick={(e) => e.stopPropagation()}>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onFocus={() => setInputEnfocado(true)}
            onBlur={() => setTimeout(() => setInputEnfocado(false), 150)}
            placeholder="Buscar tema por nombre..."
            className="home-search-input"
          />
          {inputEnfocado && (
            <div className="home-search-results">
              {temasFiltrados.length === 0 && (
                <p style={{ padding: "12px 16px", color: "var(--ink-soft)" }}>
                  Ningún tema coincide con "{busqueda}".
                </p>
              )}
              {temasFiltrados.map(({ item, index }) => (
                <button
                  key={index}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectTema(item);
                    onClose();
                  }}
                  className={`home-search-result ${item.tema === temaActual ? "is-focused" : ""}`}
                >
                  <p>
                    <span style={{ opacity: 0.6, marginRight: "8px" }}>#{index + 1}</span>
                    {item.tema}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="levels-modal__grid">
          {temasFiltrados.map(({ item, index }) => {
            const esTemaActual = item.tema === temaActual;

            return (
              <div key={index} className="level-cell">
                <button
                  className={`level-btn ${esTemaActual ? 'is-current' : ''}`}
                  onPointerDown={(e) => manejarToqueInicial(item, e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (fueArrastre(e)) return;
                    manejarClickTema(item, index);
                  }}
                  onMouseOver={() => manejarHover(item, index)}
                  onMouseOut={manejarSalidaHover}
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

        {listaTemas.length > 0 && temasFiltrados.length === 0 && (
          <p style={{ color: "var(--ink-soft)", marginBottom: "20px" }}>
            Ningún tema coincide con "{busqueda}".
          </p>
        )}

        <button className="levels-modal__close" onClick={onClose}>
          Cerrar mapa
        </button>
      </div>
    </div>
  );
}