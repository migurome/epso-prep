// Lo que el candidato ha hecho con cada convocatoria del tablón.
//
// El tablón lo escribe el bot y crece solo: en cuanto hay un año entero
// publicado, la lista pasa de cuatro convocatorias a treinta y leerla de
// arriba abajo cada semana para ver si hay algo nuevo deja de funcionar. Estas
// marcas son la respuesta: lo repasado se aparta y queda a la vista lo que
// todavía pide una decisión.
//
// Las marcas son del candidato, no del dato: viven en su navegador y viajan
// con el resto del progreso. El fichero generado no se toca nunca, y por eso
// una marca sobrevive a que el bot actualice el plazo o la fase.

/**
 * Las dos marcas, que no son dos pasos de lo mismo.
 *
 * `seen` es orden en la mesa: la he leído y no tengo nada que hacer con ella.
 * `applied` es un hecho del mundo: me he presentado. No se encadenan —marcar
 * «vista» una a la que te has presentado no significa nada— y por eso cada
 * convocatoria tiene UNA marca y no dos casillas independientes.
 */
export type NoticeMark = 'seen' | 'applied'

/** Marca por `id` de convocatoria. Ausente es sin marcar, que es lo normal. */
export type BoardMarks = Record<string, NoticeMark>

const MARKS: NoticeMark[] = ['seen', 'applied']

/**
 * Las marcas guardadas, descartando lo que no reconozcamos.
 *
 * Entra de un fichero de copia o del `localStorage`, así que puede traer una
 * marca de una versión posterior de la plataforma. Se tira: una marca que no
 * se sabe pintar es peor que ninguna.
 */
export function normaliseMarks(value: unknown): BoardMarks {
  if (value === null || typeof value !== 'object') return {}
  const out: BoardMarks = {}
  for (const [id, mark] of Object.entries(value as Record<string, unknown>)) {
    if (typeof mark === 'string' && (MARKS as string[]).includes(mark)) {
      out[id] = mark as NoticeMark
    }
  }
  return out
}

/**
 * Une las marcas de dos dispositivos, ganando las locales.
 *
 * Igual que las respuestas de práctica: se importa desde el dispositivo que se
 * tiene delante, y pisar en silencio lo que está en pantalla es peor que dejar
 * fuera lo del fichero. El precio es conocido: desmarcar en el móvil y
 * sincronizar no desmarca en el PC, porque una marca borrada y una marca que
 * nunca existió son indistinguibles en este formato.
 */
export function mergeMarks(local: BoardMarks, incoming: BoardMarks): BoardMarks {
  return { ...incoming, ...local }
}

/**
 * Las convocatorias que se enseñan.
 *
 * **Sólo se esconde lo marcado como visto.** Una convocatoria a la que te has
 * presentado es precisamente la que más te importa —sus fechas de prueba son
 * tus fechas de prueba—, así que esconderla convertiría esta opción en una
 * manera de perder de vista tu propia candidatura. Quien quiera quitársela de
 * delante la marca como vista, que para eso está.
 */
export function visibleNotices<T extends { id: string }>(
  notices: T[],
  marks: BoardMarks,
  hideSeen: boolean,
): T[] {
  if (!hideSeen) return notices
  return notices.filter((notice) => marks[notice.id] !== 'seen')
}

/** Cuántas hay marcadas como vistas, que es lo que el interruptor esconde. */
export function seenCount(notices: { id: string }[], marks: BoardMarks): number {
  return notices.filter((notice) => marks[notice.id] === 'seen').length
}
