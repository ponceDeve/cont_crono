import { useState, useRef, useCallback, useEffect } from "react";

// Cuenta regresiva reutilizable. El mismo hook alimenta:
//  - el reloj grande de horario_estudio (Pomodoro)
//  - el widget flotante mini-Pomodoro dentro de mi-estudio
// (Mejorado con sincronización de tiempo absoluto para evitar congelamientos en segundo plano)
export function useCountdown(initialMinutes, onComplete) {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef(null);
  const endTimeRef = useRef(null); // NUEVO: Guarda la meta exacta en el tiempo
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // NUEVO: Función centralizada que calcula el tiempo restante matemático
  const tick = useCallback(() => {
    if (!endTimeRef.current) return;
    const now = Date.now();
    const remaining = Math.round((endTimeRef.current - now) / 1000);

    if (remaining <= 0) {
      clear();
      setIsRunning(false);
      setSecondsLeft(0);
      onCompleteRef.current && onCompleteRef.current();
    } else {
      setSecondsLeft(remaining);
    }
  }, [clear]);

  const start = useCallback(() => {
    if (intervalRef.current) return;

    setIsRunning(true);
    // NUEVO: Proyectamos la hora exacta en la que debe acabar
    endTimeRef.current = Date.now() + secondsLeft * 1000;

    intervalRef.current = setInterval(tick, 1000);
  }, [secondsLeft, tick]);

  const pause = useCallback(() => {
    clear();
    setIsRunning(false);
    endTimeRef.current = null; // Al pausar, borramos la meta final
  }, [clear]);

  const reset = useCallback(
    (minutes) => {
      clear();
      setIsRunning(false);
      endTimeRef.current = null;
      setSecondsLeft((minutes ?? initialMinutes) * 60);
    },
    [clear, initialMinutes],
  );

  const setMinutes = useCallback(
    (minutes) => {
      clear();
      setIsRunning(false);
      endTimeRef.current = null;
      setSecondsLeft(minutes * 60);
    },
    [clear],
  );

  useEffect(() => clear, [clear]);

  // NUEVO: Si cambiaste de pestaña y vuelves, actualiza el reloj instantáneamente
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isRunning) {
        tick();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning, tick]);

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
