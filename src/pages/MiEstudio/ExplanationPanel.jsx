import { useEffect } from "react";

export default function ExplanationPanel({
  pregunta,
  isCorrect,
  onSiguiente,
  onReintentar,
}) {
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const texto = `${isCorrect ? "Correcto." : "Incorrecto."} La alternativa correcta es: ${pregunta.opts[pregunta.correct]}. ${pregunta.explicacion}`;
      const utter = new SpeechSynthesisUtterance(texto);
      utter.lang = "es-PE";
      window.speechSynthesis.speak(utter);
    }
    return () => window.speechSynthesis && window.speechSynthesis.cancel();
  }, [pregunta, isCorrect]);

  return (
    <div className={`explanation-panel ${isCorrect ? "is-correct" : "is-wrong"}`}>
      <h4 className={`explanation-panel__title ${isCorrect ? "is-correct" : "is-wrong"}`}>
        <i className={isCorrect ? "fas fa-check-circle" : "fas fa-exclamation-triangle"} />
        {isCorrect ? "¡Respuesta correcta!" : "Respuesta incorrecta"}
      </h4>
      <p className="explanation-panel__answer">
        La alternativa correcta es: <strong>{pregunta.opts[pregunta.correct]}</strong>
      </p>
      <div className="explanation-panel__text">{pregunta.explicacion}</div>
      <div className="explanation-panel__actions">
        {isCorrect ? (
          <button onClick={onSiguiente} className="explanation-panel__btn is-next">
            Siguiente <i className="fas fa-arrow-right" />
          </button>
        ) : (
          <button onClick={onReintentar} className="explanation-panel__btn is-retry">
            Intentar de nuevo <span>(Enter)</span> <i className="fas fa-rotate-left" />
          </button>
        )}
      </div>
    </div>
  );
}
