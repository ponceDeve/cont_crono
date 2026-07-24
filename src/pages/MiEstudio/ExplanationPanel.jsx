import { useEffect } from "react";
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

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
  const respuestaCorrecta = isCorrect ? respuestaCorrectaTexto(pregunta) : null;

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const base = isCorrect
        ? (respuestaCorrecta
          ? `Correcto. La respuesta correcta es: ${respuestaCorrecta}. ${pregunta.explicacion}`
          : `Correcto. ${pregunta.explicacion}`)
        : "Incorrecto. Inténtalo de nuevo.";
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
      {isCorrect ? (
        <>
          {respuestaCorrecta && (
            <p className="explanation-panel__answer">
              La alternativa correcta es: <strong><Latex>{respuestaCorrecta}</Latex></strong>
            </p>
          )}
          <div className="explanation-panel__text"><Latex>{pregunta.explicacion}</Latex></div>
        </>
      ) : (
        <p className="explanation-panel__text">No te preocupes, inténtalo de nuevo. No se muestra la respuesta para que la razones tú.</p>
      )}
      <div className="explanation-panel__actions">
        {isCorrect ? (
          <button onClick={onSiguiente} className="explanation-panel__btn is-next">
            Siguiente <i className="fas fa-arrow-right" />
          </button>
        ) : (
          <button onClick={onReintentar} className="explanation-panel__btn is-retry">
            Repetir<i className="fas fa-rotate-left" />
          </button>
        )}
      </div>
    </div>
  );
}