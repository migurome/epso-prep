import clsx from 'clsx'

/** Recorte de la figura original del libro de referencia.
 *
 * El banco real describe muchas figuras en prosa (un elefante, una cara de
 * gato, un muro de ladrillos, un reloj) que no se reducen al juego de símbolos
 * que dibuja `ShapeIcon`. Redibujarlas obligaba a elegir entre inventar
 * geometría o esconder en un pie de texto justo lo que distingue unas opciones
 * de otras. El recorte del propio libro no tiene ese problema: es la figura que
 * el alumno verá en el examen.
 *
 * Las imágenes las genera `scripts/extract_figures.py` a partir del PDF de
 * referencia (que no está en el repositorio) y viven en `public/figures/`.
 */
export function ScannedFigure({
  questionId,
  kind,
  alt,
  className,
}: {
  questionId: string
  kind: 'prompt' | 'options'
  alt: string
  className?: string
}) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}figures/abstract/${questionId}-${kind}.webp`}
      alt={alt}
      // El escaneo es una foto de papel, y por eso va sobre `paper` y no sobre
      // la superficie del tema: es la única cosa de la plataforma que NO se
      // oscurece. La imagen está renderizada sobre blanco y sus rellenos son el
      // dato de la pregunta —cuál de las figuras es la clara y cuál la oscura—,
      // así que invertirla cambiaría la figura y no el fondo. Queda como una
      // hoja apoyada en la mesa, que además es como se ve el examen de verdad.
      className={clsx(
        'mx-auto block h-auto w-full max-w-3xl rounded-lg border border-line bg-paper',
        className,
      )}
      loading="lazy"
    />
  )
}
