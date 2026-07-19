import { useState, useMemo, useEffect } from "react";
import manifest from "../../data/manifest.json";
import { registrarCursoCompletado } from "../../lib/repasoStorage";
import { useArrowKeyList } from "../../hooks/useArrowKeyList";
import QuestionCard from "./QuestionCard";
import ExplanationPanel from "./ExplanationPanel";
import TopBar from "./TopBar";
import Hud from "./Hud";
import LevelsModal from "./LevelsModal";
import SearchModal from "./SearchModal";
import PomodoroWidget from "../../components/PomodoroWidget";
import TopicsModal from "./TopicsModal";

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

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MiEstudioPage() {
  const [query, setQuery] = useState("");
  const [topicData, setTopicData] = useState(null);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flatPuntos, setFlatPuntos] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [maxUnlocked, setMaxUnlocked] = useState(0);
  const [stage, setStage] = useState("theory"); // 'theory' | 'question' | 'finished'
  const [isLevelMode, setIsLevelMode] = useState(false);

  // Niveles de examen: independientes de las tarjetas de teoría (flatPuntos)
  const [examenPreguntas, setExamenPreguntas] = useState([]);
  const [nivelIndex, setNivelIndex] = useState(0);
  const [nivelMaxUnlocked, setNivelMaxUnlocked] = useState(0);
  const [nivelCompletions, setNivelCompletions] = useState({});

  const [levelsOpen, setLevelsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pomodoroMiniOpen, setPomodoroMiniOpen] = useState(false);
  const [temasOpen, setTemasOpen] = useState(false);

  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [questionResult, setQuestionResult] = useState(null);
  const [attemptKey, setAttemptKey] = useState(0);
  const [googleQuery, setGoogleQuery] = useState("");
  const [levelCompletions, setLevelCompletions] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [configOpen, setConfigOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

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

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error al entrar en pantalla completa:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  async function abrirTema(item) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/${item.archivo}`);
      if (!res.ok) throw new Error("No se encontró el archivo del tema");
      const data = await res.json();
      const puntos = (data.theory || []).flatMap((seccion) =>
        seccion.puntos.map((p) => ({ ...p, seccionTitulo: seccion.titulo })),
      );
      const examenList = data.examen || [];

      const storageCompletionsKey = `completions_${item.curso}_${item.tema}`;
      const storedCompletions = JSON.parse(
        localStorage.getItem(storageCompletionsKey) || "{}",
      );
      setLevelCompletions(storedCompletions);

      const storageMaxUnlKey = `maxUnlocked_${item.curso}_${item.tema}`;
      const storedMax = parseInt(
        localStorage.getItem(storageMaxUnlKey) || "0",
        10,
      );
      setMaxUnlocked(storedMax);

      const storageNivelCompletionsKey = `examenCompletions_${item.curso}_${item.tema}`;
      const storedNivelCompletions = JSON.parse(
        localStorage.getItem(storageNivelCompletionsKey) || "{}",
      );
      setNivelCompletions(storedNivelCompletions);

      const storageNivelMaxKey = `examenMaxUnlocked_${item.curso}_${item.tema}`;
      const storedNivelMax = parseInt(
        localStorage.getItem(storageNivelMaxKey) || "0",
        10,
      );
      setNivelMaxUnlocked(storedNivelMax);
      setExamenPreguntas(examenList);
      setNivelIndex(0);

      setTopicData({ ...data, curso: item.curso, tema: item.tema });
      setFlatPuntos(puntos);
      setCardIndex(0);
      setStage("theory");
      setIsLevelMode(false);
      setScore(0);
      setWrongCount(0);
      setQuestionResult(null);
      setAttemptKey(0);
      setQuery("");
      setSearchOpen(false);
    } catch (e) {
      setError(`No pude cargar "${item.tema}".`);
    } finally {
      setLoading(false);
    }
  }

  function seleccionarItem(item) {
    if (item.type === "curso") {
      setCursoSeleccionado(item.nombre);
      setTemasOpen(true);
      setSearchOpen(false);
      setQuery("");
    } else {
      setCursoSeleccionado(item.curso);
      abrirTema(item);
    }
  }

  const { focusedIdx: focusedInicial, handleKeyDown: handleKeyDownInicial } =
    useArrowKeyList(results, seleccionarItem);

  function toggleStage() {
    setIsLevelMode(false);
    setStage((prev) => (prev === "theory" ? "question" : "theory"));
  }

  function irANivel(idx) {
    setNivelIndex(idx);
    setIsLevelMode(true);
    setStage("question");
    setQuestionResult(null);
    setAttemptKey(0);
    setLevelsOpen(false);
  }

  function avanzarCard() {
    if (isLevelMode) {
      if (nivelIndex < examenPreguntas.length - 1) {
        setNivelIndex(nivelIndex + 1);
        setQuestionResult(null);
        setAttemptKey(0);
      } else {
        finalizarTema();
      }
      return;
    }
    if (cardIndex < flatPuntos.length - 1) {
      setCardIndex(cardIndex + 1);
      setStage("theory");
      setIsLevelMode(false);
      setQuestionResult(null);
      setAttemptKey(0);
    } else {
      finalizarTema();
    }
  }

  function retrocederCard() {
    if (isLevelMode) {
      if (nivelIndex > 0) {
        setNivelIndex(nivelIndex - 1);
        setQuestionResult(null);
        setAttemptKey(0);
      }
      return;
    }
    if (cardIndex > 0) {
      setCardIndex(cardIndex - 1);
      setStage("theory");
      setIsLevelMode(false);
      setQuestionResult(null);
      setAttemptKey(0);
    }
  }

  function reintentarPregunta() {
    setQuestionResult(null);
    setAttemptKey((k) => k + 1);
  }

  function finalizarTema() {
    setStage("finished");
    if (topicData) {
      registrarCursoCompletado({
        subject: topicData.curso,
        tema: topicData.tema,
      });
    }
  }

  function manejarRespuesta(correcto) {
    setQuestionResult({ isCorrect: correcto });
    if (correcto) {
      setScore((s) => s + 1);

      if (isLevelMode) {
        setNivelCompletions((prev) => {
          const newCompletions = { ...prev, [nivelIndex]: (prev[nivelIndex] || 0) + 1 };
          if (topicData) {
            localStorage.setItem(
              `examenCompletions_${topicData.curso}_${topicData.tema}`,
              JSON.stringify(newCompletions),
            );
          }
          return newCompletions;
        });

        setNivelMaxUnlocked((m) => {
          const nextMax = nivelIndex === m ? m + 1 : m;
          if (topicData) {
            localStorage.setItem(`examenMaxUnlocked_${topicData.curso}_${topicData.tema}`, nextMax);
          }
          return nextMax;
        });
      } else {
        setLevelCompletions((prev) => {
          const newCompletions = { ...prev, [cardIndex]: (prev[cardIndex] || 0) + 1 };
          if (topicData) {
            localStorage.setItem(
              `completions_${topicData.curso}_${topicData.tema}`,
              JSON.stringify(newCompletions),
            );
          }
          return newCompletions;
        });

        setMaxUnlocked((m) => {
          const nextMax = cardIndex === m ? m + 1 : m;
          if (topicData) {
            localStorage.setItem(`maxUnlocked_${topicData.curso}_${topicData.tema}`, nextMax);
          }
          return nextMax;
        });
      }
    } else {
      setWrongCount((w) => w + 1);
    }
  }

  function abandonarJuego() {
    setTopicData(null);
    setConfigOpen(false);
    setConfirmLeave(false);
    setIsLevelMode(false);
  }

  function buscarEnGoogle() {
    const q = googleQuery.trim();
    if (!q) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");
  }

  const current = isLevelMode ? examenPreguntas[nivelIndex] : flatPuntos[cardIndex];
  const preguntaActual = isLevelMode ? current : current ? current.pregunta : null;
  const canAdvance = isLevelMode ? nivelIndex < nivelMaxUnlocked : cardIndex < maxUnlocked;

  useEffect(() => {
    function onKeyDown(e) {
      if (document.activeElement && document.activeElement.tagName === "INPUT") return;
      if (levelsOpen || searchOpen || configOpen || temasOpen || !topicData) return;

      if (e.key === "Enter") {
        if (stage === "theory" && !isLevelMode) {
          e.preventDefault();
          toggleStage();
        } else if (stage === "question" && questionResult && questionResult.isCorrect) {
          e.preventDefault();
          avanzarCard();
        } else if (stage === "question" && questionResult && !questionResult.isCorrect) {
          e.preventDefault();
          reintentarPregunta();
        }
      } else if (e.key === " " || e.code === "Space") {
        if (stage === "question") {
          e.preventDefault();
          if (canAdvance) avanzarCard();
        }
      } else if (e.key === "ArrowLeft") {
        retrocederCard();
      } else if (e.key === "ArrowRight") {
        if (canAdvance) avanzarCard();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stage, questionResult, levelsOpen, searchOpen, configOpen, temasOpen, topicData, cardIndex, flatPuntos, maxUnlocked, nivelIndex, examenPreguntas, nivelMaxUnlocked, canAdvance, isLevelMode]);

  const wrapClass = ["mi-estudio__wrap", topicData ? "has-topbar" : ""].join(" ");

  const nombreCursoActivo = cursoSeleccionado || (topicData ? topicData.curso : null);
  const cursoEncontrado = manifest.cursos.find(c => c.nombre === nombreCursoActivo);
  const temasDelCurso = cursoEncontrado ? cursoEncontrado.temas : [];

  return (
    <div className="mi-estudio">
      {topicData && (
        <TopBar
          tema={topicData.tema}
          curso={topicData.curso}
          onAbrirNiveles={() => setLevelsOpen(true)}
          onAbrirBuscador={() => setSearchOpen(true)}
          onTogglePomodoroMini={() => setPomodoroMiniOpen((o) => !o)}
          onAbrirTemas={() => setTemasOpen(true)}
        />
      )}

      <PomodoroWidget open={pomodoroMiniOpen} onClose={() => setPomodoroMiniOpen(false)} />

      {configOpen && (
        <div className="config-overlay">
          {confirmLeave && (
            <div className="config-overlay__confirm animate-bounce">
              Confirmar. Eres un perdedor.
            </div>
          )}
          <div className="config-overlay__row">
            <div className="config-overlay__item">
              <button
                onClick={() => {
                  if (confirmLeave) abandonarJuego();
                  else setConfirmLeave(true);
                }}
                className="config-overlay__btn is-danger"
              >
                <i className="fas fa-door-open" />
              </button>
              <span className="config-overlay__label">Abandonar</span>
            </div>

            <div className="config-overlay__item">
              <button onClick={toggleFullscreen} className="config-overlay__btn is-primary">
                <i className={`fas ${isFullscreen ? "fa-compress" : "fa-expand"}`} />
              </button>
              <span className="config-overlay__label">
                {isFullscreen ? "Minimizar" : "Pantalla Completa"}
              </span>
            </div>

            <div className="config-overlay__item">
              <button
                onClick={() => {
                  setConfigOpen(false);
                  setConfirmLeave(false);
                }}
                className="config-overlay__btn is-success"
              >
                <i className="fas fa-play" />
              </button>
              <span className="config-overlay__label">Continuar</span>
            </div>
          </div>
        </div>
      )}

      <div className={wrapClass}>
        {!topicData && (
          <div className="mi-estudio__intro">
            <div>
              <p className="mi-estudio__intro-eyebrow">Mi Estudio</p>
              <h1 className="mi-estudio__intro-title">¿Qué tema quieres repasar?</h1>
            </div>
            <div className="home-search">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDownInicial}
                placeholder="Buscar tema o curso..."
                className="home-search-input"
              />
              {results.length > 0 && (
                <div className="home-search-results">
                  {results.map((r, i) => (
                    <button
                      key={r.type === "curso" ? r.nombre : r.archivo}
                      onClick={() => seleccionarItem(r)}
                      className={`home-search-result ${i === focusedInicial ? "is-focused" : ""}`}
                    >
                      {r.type === "curso" ? (
                        <p> {r.nombre}</p>
                      ) : (
                        <>
                          <p>{r.tema}</p>
                          <p>{r.curso}</p>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {topicData && (stage === "theory" || stage === "question") && current && (
          <div className="mi-estudio__stage">
            {stage === "question" && isLevelMode && (
              <div className="mi-estudio__hud-wrap animate-fade-in">
                <Hud current={nivelIndex + 1} total={examenPreguntas.length} correct={score} wrong={wrongCount} />
              </div>
            )}

            {stage === "theory" && (
              <div className="arcade-game-container mi-estudio__theory">
                <div className="arcade-grid" />
                <div className="mi-estudio__theory-inner">
                  <p className="mi-estudio__theory-badge">
                    Nivel {cardIndex + 1}: {current.seccionTitulo}
                  </p>
                  <p className="mi-estudio__theory-text">{current.texto}</p>

                  <div className="mi-estudio__google">
                    <div className="mi-estudio__google-input-wrap">
                      <input
                        value={googleQuery}
                        onChange={(e) => setGoogleQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && buscarEnGoogle()}
                        placeholder="Pregúntale a Google..."
                        className="mi-estudio__google-input"
                      />
                      <button onClick={buscarEnGoogle} className="mi-estudio__google-btn">
                        <i className="fab fa-google" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {stage === "question" && (
              <div className="mi-estudio__question-stage">
                {isLevelMode && (
                  <button
                    onClick={() => { setConfigOpen(true); setConfirmLeave(false); }}
                    className="mi-estudio__config-btn"
                  >
                    <i className="fas fa-cog" />
                  </button>
                )}

                <div className="mi-estudio__question-inner animate-fade-in">
                  <QuestionCard
                    key={`${isLevelMode ? "nivel-" + nivelIndex : "teoria-" + cardIndex}-${attemptKey}`}
                    pregunta={preguntaActual}
                    onRespondido={manejarRespuesta}
                  />
                </div>
              </div>
            )}

            <div className="mi-estudio__nav">
              <button
                onClick={retrocederCard}
                disabled={isLevelMode ? nivelIndex === 0 : cardIndex === 0}
                className={`mi-estudio__nav-btn ${(isLevelMode ? nivelIndex === 0 : cardIndex === 0) ? "" : "is-active"}`}
                title="Anterior"
              >
                <i className="fas fa-caret-left" />
              </button>

              {!isLevelMode && (
                <button onClick={toggleStage} className="mi-estudio__nav-flip" title="Voltear Tarjeta">
                  <i className="fas fa-sync-alt" />
                </button>
              )}

              <div className="mi-estudio__nav-right">
                {(() => {
                  const esUltimo = isLevelMode
                    ? nivelIndex === examenPreguntas.length - 1
                    : cardIndex === flatPuntos.length - 1;
                  const bloqueado = !canAdvance || esUltimo;
                  return (
                    <>
                      <button
                        onClick={avanzarCard}
                        disabled={bloqueado}
                        className={`mi-estudio__nav-btn ${bloqueado ? "" : "is-active"}`}
                        title="Siguiente"
                      >
                        {esUltimo && canAdvance ? (
                          <i className="fas fa-flag-checkered" />
                        ) : (
                          <i className="fas fa-caret-right" />
                        )}
                      </button>

                      {!canAdvance && !esUltimo && (
                        <span className="mi-estudio__nav-hint">
                          ¡Supera la pregunta para avanzar!
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {stage === "question" && questionResult && (
              <div className="mi-estudio__explanation-wrap">
                <ExplanationPanel
                  pregunta={preguntaActual}
                  isCorrect={questionResult.isCorrect}
                  onSiguiente={avanzarCard}
                  onReintentar={reintentarPregunta}
                />
              </div>
            )}
          </div>
        )}

        {stage === "finished" && (
          <div className="mi-estudio__finished">
            <div className="mi-estudio__finished-emoji animate-bounce">🏆</div>
            <h2 className="mi-estudio__finished-title">¡Tema completado!</h2>
            <p className="mi-estudio__finished-sub">Excelente trabajo leyendo toda la teoría.</p>
            <button onClick={() => setSearchOpen(true)} className="mi-estudio__finished-btn">
              Elegir otro tema
            </button>
          </div>
        )}
      </div>

      {topicData && (
        <LevelsModal
          open={levelsOpen}
          onClose={() => setLevelsOpen(false)}
          flatPuntos={examenPreguntas}
          maxUnlocked={nivelMaxUnlocked}
          current={nivelIndex}
          levelCompletions={nivelCompletions}
          onSelect={irANivel}
        />
      )}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={seleccionarItem} />

      {nombreCursoActivo && (
        <TopicsModal
          open={temasOpen}
          onClose={() => setTemasOpen(false)}
          curso={nombreCursoActivo}
          temaActual={topicData ? topicData.tema : null}
          listaTemas={temasDelCurso}
          onSelectTema={(temaItem) => {
            abrirTema({
              curso: nombreCursoActivo,
              tema: temaItem.tema,
              archivo: temaItem.archivo
            });
          }}
        />
      )}
    </div>
  );
}