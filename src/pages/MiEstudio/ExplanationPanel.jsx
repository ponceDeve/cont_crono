import { useEffect } from "react";

function respuestaCorrectaTexto(pregunta) {
  if (pregunta.tipo === "verdadero_falso") return null; // ya se detalla proposición por proposición en la card
  if (pregunta.tipo === "completar") return (pregunta.respuestas || []).join(" · ");
  return pregunta.opts[pregunta.correct];
}

export default function ExplanationPanel({
  pregunta,
  isCorrect,
  onSiguiente,
  onReintentar,
}) {
  const respuestaCorrecta = respuestaCorrectaTexto(pregunta);

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const base = respuestaCorrecta
        ? `${isCorrect ? "Correcto." : "Incorrecto."} La respuesta correcta es: ${respuestaCorrecta}. ${pregunta.explicacion}`
        : `${isCorrect ? "Correcto." : "Incorrecto."} ${pregunta.explicacion}`;
      const utter = new SpeechSynthesisUtterance(base);
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
      {respuestaCorrecta && (
        <p className="explanation-panel__answer">
          La alternativa correcta es: <strong>{respuestaCorrecta}</strong>
        </p>
      )}
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