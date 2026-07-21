import { useMemo, useState } from "react";
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Corta el "texto" de una card en fragmentos planos y fragmentos que
// coinciden con una entrada del glosario (término o símbolo).
function partirPorGlosario(texto, glosario) {
  const claves = Object.keys(glosario || {}).filter(Boolean);
  if (!texto || claves.length === 0) return [{ tipo: "texto", valor: texto }];

  // Términos más largos primero, para no partir "Revolución Francesa" por culpa de "Revolución".
  const ordenadas = [...claves].sort((a, b) => b.length - a.length);

  const patrones = ordenadas.map((k) => {
    const esPalabra = /^[a-zA-ZÀ-ÿ0-9\s]+$/.test(k);
    const escaped = escapeRegExp(k);
    return esPalabra ? `\\b${escaped}\\b` : escaped;
  });

  const regex = new RegExp(`(${patrones.join("|")})`, "giu");

  const partes = [];
  let ultimoIndex = 0;
  let match;
  while ((match = regex.exec(texto)) !== null) {
    if (match.index > ultimoIndex) {
      partes.push({ tipo: "texto", valor: texto.slice(ultimoIndex, match.index) });
    }
    const encontrado = match[0];
    const keyOriginal = ordenadas.find((k) => k.toLowerCase() === encontrado.toLowerCase());
    partes.push({ tipo: "termino", valor: encontrado, key: keyOriginal });
    ultimoIndex = match.index + encontrado.length;
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  if (ultimoIndex < texto.length) {
    partes.push({ tipo: "texto", valor: texto.slice(ultimoIndex) });
  }
  return partes;
}

export default function GlossaryText({ text, glosario = {} }) {
  const [activo, setActivo] = useState(null);

  const partes = useMemo(() => partirPorGlosario(text, glosario), [text, glosario]);

  return (
    <span onClick={() => setActivo(null)}>
      {partes.map((parte, i) => {
        if (parte.tipo === "texto") {
          return (
            <span key={i}>
              <Latex>{parte.valor}</Latex>
            </span>
          );
        }

        const visible = activo === i;
        return (
          <span key={i} className="glossary-term-wrap">
            <span
              className="glossary-term"
              onMouseEnter={() => setActivo(i)}
              onMouseLeave={() => setActivo((cur) => (cur === i ? null : cur))}
              onClick={(e) => {
                e.stopPropagation();
                setActivo((cur) => (cur === i ? null : i));
              }}
            >
              <Latex>{parte.valor}</Latex>
            </span>
            {visible && (
              <span className="glossary-tooltip">
                <Latex>{glosario[parte.key]}</Latex>
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}