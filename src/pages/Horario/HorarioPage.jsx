import { useState, useRef, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCountdown } from "../../hooks/useCountdown";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { scheduleData, DIAS } from "../../data/schedule";
import { registrarCursoCompletado } from "../../lib/repasoStorage";
import TemaModal from "../../components/TemaModal";
import Modal from "../../components/Modal";

const POMODORO_MIN = 25;
const REST_MIN = 5;

const NOMBRE_DIA = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
};

const DIAS_FILA1 = ["lunes", "martes", "miercoles"];
const DIAS_FILA2 = ["jueves", "viernes", "sabado"];

function levelClass(level) {
  if (level === "easy") return "level-easy";
  if (level === "medium") return "level-medium";
  return "level-hard";
}

function buildCourseTasks(course) {
  const tasks = [];
  for (let i = 1; i <= course.pomodoros; i++) {
    tasks.push({
      type: "course",
      detail: `Pomodoro ${i} de ${course.pomodoros}`,
      duration: POMODORO_MIN,
    });
    if (i < course.pomodoros) tasks.push({ type: "rest", duration: REST_MIN });
  }
  return tasks;
}

function progressKey(day, subject) {
  return `${day}::${subject}`;
}

export default function HorarioPage() {
  const [searchParams] = useSearchParams();
  const [selectedDay, setSelectedDay] = useState("lunes");
  const [activeCourseIdx, setActiveCourseIdx] = useState(null);
  const [progress, setProgress] = useLocalStorage(
    "horario_task_progress_v1",
    {},
  );
  const [temaDesdeLink, setTemaDesdeLink] = useState(null);

  const [pendingCourseComplete, setPendingCourseComplete] = useState(null);
  const [temaModalOpen, setTemaModalOpen] = useState(false);
  const [courseCompleteOpen, setCourseCompleteOpen] = useState(false);

  const alarmRef = useRef(null);

  const courses = scheduleData[selectedDay];
  const activeCourse =
    activeCourseIdx !== null ? courses[activeCourseIdx] : null;
  const activeTasks = useMemo(
    () => (activeCourse ? buildCourseTasks(activeCourse) : []),
    [activeCourse],
  );

  function getTaskIndex(day, subject) {
    return progress[progressKey(day, subject)] || 0;
  }

  function getDonePomodoros(day, subject, pomodoros) {
    const tasks = buildCourseTasks({ pomodoros });
    const idx = getTaskIndex(day, subject);
    return tasks.slice(0, idx).filter((t) => t.type === "course").length;
  }

  function handleTaskComplete() {
    if (alarmRef.current) {
      alarmRef.current.currentTime = 0;
      alarmRef.current.play().catch(() => { });
    }
    if (!activeCourse) return;
    const key = progressKey(selectedDay, activeCourse.subject);
    const currentIdx = getTaskIndex(selectedDay, activeCourse.subject);
    const nextIdx = currentIdx + 1;
    setProgress({ ...progress, [key]: nextIdx });

    if (nextIdx >= activeTasks.length) {
      setPendingCourseComplete({
        subject: activeCourse.subject,
        day: selectedDay,
        level: activeCourse.level,
      });
      setCourseCompleteOpen(true);
      setActiveCourseIdx(null);
    } else {
      reset(activeTasks[nextIdx].duration);
    }
  }

  const { formatted, secondsLeft, isRunning, start, pause, reset } =
    useCountdown(POMODORO_MIN, handleTaskComplete);

  const currentTaskDuration = activeCourse
    ? activeTasks[getTaskIndex(selectedDay, activeCourse.subject)]?.duration ||
    POMODORO_MIN
    : POMODORO_MIN;
  const progressPct = Math.round(
    ((currentTaskDuration * 60 - secondsLeft) / (currentTaskDuration * 60)) *
    100,
  );

  function abrirCurso(idx) {
    const course = courses[idx];
    const tasks = buildCourseTasks(course);
    const taskIdx = getTaskIndex(selectedDay, course.subject);
    setActiveCourseIdx(idx);
    if (taskIdx < tasks.length) {
      reset(tasks[taskIdx].duration);
    }
  }

  function cerrarCourseComplete() {
    setCourseCompleteOpen(false);
    const vieneConTema =
      pendingCourseComplete &&
      temaDesdeLink &&
      temaDesdeLink.curso.toLowerCase() ===
      pendingCourseComplete.subject.toLowerCase();
    if (vieneConTema) {
      registrarCursoCompletado({
        ...pendingCourseComplete,
        tema: temaDesdeLink.tema,
      });
      setPendingCourseComplete(null);
    } else {
      setTemaModalOpen(true);
    }
  }

  function guardarTema(tema) {
    if (pendingCourseComplete)
      registrarCursoCompletado({ ...pendingCourseComplete, tema });
    setPendingCourseComplete(null);
    setTemaModalOpen(false);
  }

  function omitirTema() {
    if (pendingCourseComplete)
      registrarCursoCompletado({ ...pendingCourseComplete, tema: "" });
    setPendingCourseComplete(null);
    setTemaModalOpen(false);
  }

  const activeTaskIdx = activeCourse
    ? getTaskIndex(selectedDay, activeCourse.subject)
    : 0;

  useEffect(() => {
    const cursoParam = searchParams.get("curso");
    const temaParam = searchParams.get("tema");
    if (!cursoParam) return;

    for (const dia of DIAS) {
      const idx = scheduleData[dia].findIndex(
        (c) => c.subject.toLowerCase() === cursoParam.toLowerCase(),
      );
      if (idx !== -1) {
        setSelectedDay(dia);
        setTemaDesdeLink({ curso: cursoParam, tema: temaParam || "" });
        const tasks = buildCourseTasks(scheduleData[dia][idx]);
        const taskIdx =
          progress[progressKey(dia, scheduleData[dia][idx].subject)] || 0;
        setActiveCourseIdx(idx);
        if (taskIdx < tasks.length) reset(tasks[taskIdx].duration);
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="horario">
      <div className="horario__back">
        <Link to="/" className="horario__back-link">
          <i className="fas fa-arrow-left" /> Volver a Mi Estudio
        </Link>
      </div>

      <main className="horario__main">
        {/* Temporizador */}
        <section className="horario__timer-section">
          <div className="horario__timer-card">
            <div className="horario__timer-center">
              {activeCourse && (
                <p className="horario__timer-label">
                  {activeCourse.subject} ·{" "}
                  {activeTasks[activeTaskIdx]?.type === "rest"
                    ? "Descanso"
                    : activeTasks[activeTaskIdx]?.detail || "Completado"}
                </p>
              )}
              <h2 className="timer-font horario__timer-clock">{formatted}</h2>
              <div className="horario__progress-track">
                <div className="horario__progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="horario__timer-controls">
              <div className="horario__timer-btn-row">
                <button
                  onClick={start}
                  disabled={!activeCourse || isRunning}
                  className="horario__btn is-start"
                >
                  <i className="fas fa-play" /> Iniciar
                </button>
                <button
                  onClick={pause}
                  disabled={!isRunning}
                  className="horario__btn is-pause"
                >
                  <i className="fas fa-pause" /> Pausar
                </button>
                <button
                  onClick={() => reset(currentTaskDuration)}
                  className="horario__btn-reset"
                >
                  <i className="fas fa-rotate-left" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Días + lista de cursos / desglose de pomodoros */}
        <section className="horario__side-section">
          <div className="horario__day-tabs">
            <div className="horario__day-row">
              {DIAS_FILA1.map((dia) => (
                <button
                  key={dia}
                  onClick={() => {
                    setSelectedDay(dia);
                    setActiveCourseIdx(null);
                  }}
                  className={`horario__day-btn ${selectedDay === dia ? "is-active" : ""}`}
                >
                  {NOMBRE_DIA[dia]}
                </button>
              ))}
            </div>
            <div className="horario__day-row">
              {DIAS_FILA2.map((dia) => (
                <button
                  key={dia}
                  onClick={() => {
                    setSelectedDay(dia);
                    setActiveCourseIdx(null);
                  }}
                  className={`horario__day-btn ${selectedDay === dia ? "is-active" : ""}`}
                >
                  {NOMBRE_DIA[dia]}
                </button>
              ))}
            </div>
          </div>

          <div className="horario__courses-card">
            <div className="horario__courses-header">
              <div className="horario__courses-header-left">
                {activeCourse && (
                  <button onClick={() => setActiveCourseIdx(null)} className="horario__back-course">
                    <i className="fas fa-arrow-left" />
                  </button>
                )}
                <div>
                  <h3 className="horario__day-title">{NOMBRE_DIA[selectedDay]}</h3>
                  <p className="horario__day-sub">
                    {activeCourse
                      ? `${activeCourse.subject} · ${getDonePomodoros(selectedDay, activeCourse.subject, activeCourse.pomodoros)}/${activeCourse.pomodoros} pomodoros`
                      : "Elige un curso para empezar"}
                  </p>
                </div>
              </div>
              {!activeCourse && (
                <button
                  onClick={() => {
                    const cleared = { ...progress };
                    courses.forEach(
                      (c) => delete cleared[progressKey(selectedDay, c.subject)],
                    );
                    setProgress(cleared);
                  }}
                  className="horario__reset-link"
                >
                  <i className="fas fa-rotate-left" /> Reiniciar
                </button>
              )}
            </div>

            {/* Lista de cursos del día */}
            {!activeCourse && (
              <div className="horario__course-list">
                {courses.map((c, idx) => {
                  const done = getDonePomodoros(selectedDay, c.subject, c.pomodoros);
                  const isComplete = done >= c.pomodoros;
                  const pct = Math.round((done / c.pomodoros) * 100);
                  const lc = levelClass(c.level);
                  const statusText = isComplete
                    ? "Completado"
                    : done > 0
                      ? "En curso"
                      : "No iniciado";

                  return (
                    <div
                      key={c.subject}
                      onClick={() => !isComplete && abrirCurso(idx)}
                      className={`horario__course-item ${lc} ${isComplete ? "is-complete" : ""}`}
                    >
                      <div className="horario__course-top">
                        <div className="horario__course-tags">
                          <span className={`horario__level-badge ${lc}`}>{c.level}</span>
                          <h4 className="horario__course-name">{c.subject}</h4>
                        </div>
                        {isComplete ? (
                          <i className="fas fa-check horario__check-icon" />
                        ) : (
                          <i className="fas fa-chevron-right horario__chevron-icon" />
                        )}
                      </div>
                      <div className="horario__course-progress">
                        <div className="horario__mini-track">
                          <div className={`horario__mini-fill ${lc}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="horario__course-count">{done}/{c.pomodoros} 🍅</span>
                      </div>
                      <p className="horario__course-status">{statusText}</p>
                    </div>
                  );
                })}

                <div className="horario__rest-row">
                  <button className="horario__rest-btn">Desc. 10</button>
                  <button className="horario__rest-btn">Desc. 30</button>
                </div>
              </div>
            )}

            {/* Desglose de pomodoros + descansos del curso activo */}
            {activeCourse && (
              <div className="horario__task-list">
                {activeTasks.map((task, index) => {
                  const isActive = index === activeTaskIdx;
                  const isPast = index < activeTaskIdx;
                  const lc = levelClass(activeCourse.level);

                  if (task.type === "course") {
                    return (
                      <div key={index} className="horario__task-row">
                        <div className={`horario__task-dot ${isPast ? "is-past" : ""}`}>
                          {isPast ? (
                            <i className="fas fa-check horario__task-check-icon" />
                          ) : (
                            <span>{Math.floor(index / 2) + 1}</span>
                          )}
                        </div>
                        <div
                          className={`horario__task-box ${isPast ? "is-past" : ""} ${isActive ? "is-active" : ""}`}
                        >
                          <div className="horario__task-box-top">
                            <h4 className="horario__task-box-title">{activeCourse.subject}</h4>
                            <span className={`horario__level-badge ${lc}`}>{activeCourse.level}</span>
                          </div>
                          <p className="horario__task-box-detail">{task.detail}</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className="horario__task-row">
                      <div className="horario__rest-dot">☕</div>
                      <div
                        className={`horario__rest-box ${isPast ? "is-past" : ""} ${isActive ? "is-active" : ""}`}
                      >
                        Descanso ({task.duration} min)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <div className="horario__repaso-link-wrap">
        <div className="horario__repaso-link-wrap">
          <a href={`${window.location.origin}/cont_crono/repaso`} target="_blank" rel="noopener noreferrer" className="horario__repaso-link">
            <i className="bi bi-calendar-check" /> Ver mis repasos de hoy
          </a>
        </div>
      </div>

      <audio ref={alarmRef} src="/sonidos/loud-alarm-ringtones-annoying.mp3" preload="auto" />

      <Modal open={courseCompleteOpen} wide>
        <div className="horario__complete-modal">
          <div className="horario__complete-emoji">🎉</div>
          <h2 className="horario__complete-title">¡Felicidades!</h2>
          <p className="horario__complete-sub">
            Completaste el curso de {pendingCourseComplete?.subject}
          </p>
          <p className="horario__complete-msg">
            Así es como entran a la UNMSM:
            <br />
            curso por curso 🎓
          </p>
          <button onClick={cerrarCourseComplete} className="horario__complete-btn">
            Seguir así
          </button>
        </div>
      </Modal>

      <TemaModal
        open={temaModalOpen}
        subject={pendingCourseComplete?.subject}
        day={pendingCourseComplete?.day}
        onGuardar={guardarTema}
        onOmitir={omitirTema}
      />
    </div>
  );
}