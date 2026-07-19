export default function Hud({ current, total, correct, wrong }) {
  return (
    <div className="hud">
      <span>
        Avance: <span className="hud__progress-value">{current}/{total}</span>
      </span>
      <span className="hud__correct">
        <i className="fas fa-check" /> {correct}
      </span>
      <span className="hud__wrong">
        <i className="fas fa-times" /> {wrong}
      </span>
    </div>
  );
}