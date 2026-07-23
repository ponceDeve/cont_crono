import { useCallback, useState } from "react";

// Calcula una posición fija (position: fixed) para un tooltip, centrada
// horizontalmente respecto al elemento que la dispara PERO recortada
// (clamp) para que nunca se salga del viewport, sin importar qué tan
// cerca del borde de la pantalla esté ese elemento.
export function useFloatingTooltip(maxWidth = 220) {
  const [pos, setPos] = useState(null); // { top, left } en coordenadas de viewport

  const mostrarEn = useCallback(
    (el) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const halfWidth = maxWidth / 2 + 8; // margen de seguridad
      const minLeft = halfWidth;
      const maxLeft = window.innerWidth - halfWidth;
      const centerX = rect.left + rect.width / 2;
      const left = Math.min(Math.max(centerX, minLeft), maxLeft);
      const top = rect.top - 10; // justo encima del elemento
      setPos({ top, left });
    },
    [maxWidth],
  );

  const ocultar = useCallback(() => setPos(null), []);

  return { pos, mostrarEn, ocultar };
}
