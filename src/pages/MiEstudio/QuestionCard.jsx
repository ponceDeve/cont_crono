import { useState, useRef, useMemo, useEffect } from "react";

function normalizeWord(w) {
  return w
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w]/g, "");
}

function getWords(str) {
  return (str || "")
    .split(/\s+/)
    .map(normalizeWord)
    .filter((w) => w.length > 2);
}

function respuestaSeParece(typed, correctText) {
  const correctWords = getWords(correctText);
  if (correctWords.length === 0) {
    return normalizeWord(typed) === normalizeWord(correctText);
  }
  const typedWords = new Set(getWords(typed));
  const coincidencias = correctWords.filter((w) => typedWords.has(w)).length;
  return coincidencias / correctWords.length >= 0.5;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuestionCard({ pregunta, onRespondido, onRendirse }) {
  const [answered, setAnswered] = useState(false);
  const [chosenIdx, setChosenIdx] = useState(null);
  const [typed, setTyped] = useState("");
  const hurraRef = useRef(null);

  const shuffled = useMemo(
    () => shuffle(pregunta.opts.map((text, originalIndex) => ({ text, originalIndex }))),
    [pregunta],
  );

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(pregunta.q);
      utter.lang = "es-PE";
      window.speechSynthesis.speak(utter);
    }
    return () => window.speechSynthesis && window.speechSynthesis.cancel();
  }, [pregunta]);

  function resolver(correct, idx) {
    setChosenIdx(idx ?? null);
    setAnswered(true);
    if (correct && hurraRef.current) {
      hurraRef.current.currentTime = 0;
      hurraRef.current.play().catch(() => {});
    }
    onRespondido(correct);
  }

  function elegirOpcion(idx) {
    if (answered) return;
    const correct = shuffled[idx].originalIndex === pregunta.correct;
    resolver(correct, idx);
  }

  function responderTexto() {
    if (answered || !typed.trim()) return;
    const correct = respuestaSeParece(typed, pregunta.opts[pregunta.correct]);
    const idxCorrecta = shuffled.findIndex((o) => o.originalIndex === pregunta.correct);
    resolver(correct, correct ? idxCorrecta : null);
  }

  return (
    <div className="arcade-game-container question-card">
      <div className="arcade-grid" />

      <div className="question-card__inner">
        <h3 className="question-card__q">{pregunta.q}</h3>

        <div className="question-card__options">
          {shuffled.map((opt, i) => {
            const isChosen = answered && chosenIdx === i;
            const isTheCorrectOne = answered && opt.originalIndex === pregunta.correct;
            let cls = "";
            if (answered) {
              if (isTheCorrectOne) cls = "is-correct";
              else if (isChosen) cls = "is-wrong";
              else cls = "is-muted";
            }
            return (
              <button
                key={i}
                onClick={() => elegirOpcion(i)}
                disabled={answered}
                className={`question-card__opt ${cls}`}
              >
                {opt.text}
              </button>
            );
          })}
        </div>

        {!answered && (
          <div className="question-card__type-wrap">
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  responderTexto();
                }
              }}
              placeholder="Respuesta"
              className="question-card__input"
            />
            <button onClick={responderTexto} className="question-card__submit">
              Responder
            </button>
          </div>
        )}
      </div>

      <audio ref={hurraRef} src="/sonidos/hurra-bob-esponja.mp3" preload="auto" />
    </div>
  );
}
