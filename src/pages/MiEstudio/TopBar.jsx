import { useState } from "react";
import { Link } from "react-router-dom";

export default function TopBar({
  tema,
  curso,
  onAbrirNiveles,
  onAbrirBuscador,
  onTogglePomodoroMini,
  onAbrirTemas // <-- Nueva función
}) {
  const [configOpen, setConfigOpen] = useState(false);
  const pomodoroHref = `/pomodoro?curso=${encodeURIComponent(curso)}&tema=${encodeURIComponent(tema)}`;

  const botones = [
    { title: "Niveles", label: "Nvl", icon: "fa-solid fa-flag-checkered", onClick: onAbrirNiveles },
    { title: "Mini cronómetro", label: "Timer", icon: "fa-solid fa-clock", onClick: onTogglePomodoroMini },
    { title: "Ir al Pomodoro de este curso", label: "Pomo", icon: "fa-solid fa-calendar-alt", href: pomodoroHref, target: "_blank" },
    { title: "Ir a Mis Repasos", label: "Repaso", icon: "fa-solid fa-brain", href: "/repaso", target: "_blank" },
    { title: "Buscar otro tema", label: "Buscar", icon: "fa-solid fa-magnifying-glass", onClick: onAbrirBuscador },
  ];

  function renderBoton(b, cls) {
    const content = (
      <>
        <i className={b.icon} />
        <span>{b.label}</span>
      </>
    );
    if (b.to) {
      return (
        <Link key={b.title} to={b.to} title={b.title} className={cls} onClick={() => setConfigOpen(false)}>
          {content}
        </Link>
      );
    }
    if (b.href) {
      return (
        <a key={b.title} href={b.href} target={b.target} rel="noopener noreferrer" title={b.title} className={cls}>
          {content}
        </a>
      );
    }
    return (
      <button
        key={b.title}
        onClick={() => {
          b.onClick();
          setConfigOpen(false);
        }}
        title={b.title}
        className={cls}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="topbar">
      <div className="topbar__title">
        <span className="topbar__tema">{tema}</span>
        {/* Aquí hacemos que el curso sea clickeable */}
        <span
          className="topbar__curso topbar__curso--clickable"
          onClick={onAbrirTemas}
          title="Ver mapa de temas de este curso"
        >
          {curso}
        </span>
      </div>

      <div className="topbar__nav">
        {botones.map((b) => renderBoton(b, "topbar__nav-btn"))}
      </div>

      <button onClick={() => setConfigOpen(true)} title="Opciones" className="topbar__gear">
        <i className="fa-solid fa-gear" />
      </button>

      {configOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && setConfigOpen(false)}
          className="topbar__overlay"
        >
          <div className="topbar__overlay-inner">
            <div className="topbar__overlay-row1">
              {botones.slice(0, 3).map((b) => renderBoton(b, "topbar__overlay-btn"))}
            </div>
            <div className="topbar__overlay-row2">
              {botones.slice(3, 5).map((b) => renderBoton(b, "topbar__overlay-btn"))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}