import { useState, useRef, useCallback, useEffect } from "react";

// Cuenta regresiva reutilizable. El mismo hook alimenta:
//  - el reloj grande de horario_estudio (Pomodoro)
//  - el widget flotante mini-Pomodoro dentro de mi-estudio
// Antes esta lógica estaba escrita dos veces (una en script.js, otra
// pegada directo en el <script> de index.html).
export function useCountdown(initialMinutes, onComplete) {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clear();
          setIsRunning(false);
          onCompleteRef.current && onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clear]);

  const pause = useCallback(() => {
    clear();
    setIsRunning(false);
  }, [clear]);

  const reset = useCallback(
    (minutes) => {
      clear();
      setIsRunning(false);
      setSecondsLeft((minutes ?? initialMinutes) * 60);
    },
    [clear, initialMinutes],
  );

  const setMinutes = useCallback(
    (minutes) => {
      clear();
      setIsRunning(false);
      setSecondsLeft(minutes * 60);
    },
    [clear],
  );

  useEffect(() => clear, [clear]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return {
    secondsLeft,
    formatted: `${mm}:${ss}`,
    isRunning,
    start,
    pause,
    reset,
    setMinutes,
  };
}
