import type { LocalizedText, Question } from '../types/content'

// El tipo de ejercicio de una pregunta: regla de tres, deshacer un porcentaje,
// rotación, el tema de un banco de campo…
//
// Viaja como un tag con prefijo (`kind:rule-of-three`) y no como un campo
// propio porque una pregunta tiene VARIOS —63 de las 120 numéricas del libro
// caen en más de una familia, y la serie abstracta media lleva 2,4 atributos—.
// Esa multiplicidad no es un defecto de la clasificación: es cómo son los
// ejercicios, y por eso la misma pregunta aparece en varias pestañas.
//
// El rótulo no viaja con cada pregunta: va una sola vez en el catálogo
// `QUESTION_KINDS` de su chunk. Repetirlo sumaría unos 50 kB al paquete para
// decir lo mismo 442 veces.

export const KIND_PREFIX = 'kind:'

/** Catálogo de un chunk: identificador → rótulo en los dos idiomas. */
export type KindCatalogue = Record<string, LocalizedText>

export interface KindTab {
  id: string
  label: LocalizedText
  count: number
}

/** Los tipos que lleva una pregunta. Vacío es lo normal en verbal, donde todas
 * las preguntas son el mismo ejercicio. */
export function kindsOf(tags: string[] | undefined): string[] {
  return (tags ?? [])
    .filter((tag) => tag.startsWith(KIND_PREFIX))
    .map((tag) => tag.slice(KIND_PREFIX.length))
}

/**
 * Las pestañas que tocan para este banco, de la más poblada a la menos.
 *
 * Por frecuencia y no por orden alfabético: la primera pestaña es la familia
 * que más veces va a salir en el examen, y ése es el orden en que conviene
 * practicarlas. A igual número, por rótulo, para que el orden no baile entre
 * dos compilaciones.
 *
 * Un tipo sin rótulo en el catálogo se descarta en vez de enseñarse con su
 * identificador crudo: una pestaña que ponga `rule-of-three` es peor que una
 * pestaña de menos.
 */
export function kindTabs(
  questions: Question[],
  catalogue: KindCatalogue | undefined,
  locale: 'es' | 'en' = 'es',
): KindTab[] {
  if (!catalogue) return []
  const counts = new Map<string, number>()
  for (const q of questions) {
    for (const kind of kindsOf(q.tags)) {
      if (catalogue[kind]) counts.set(kind, (counts.get(kind) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ id, label: catalogue[id], count }))
    .sort((a, b) => b.count - a.count || a.label[locale].localeCompare(b.label[locale]))
}

/**
 * ¿Entra esta pregunta en la pestaña elegida?
 *
 * `all` deja pasar todo. `none` son las que no encajaron en ninguna familia:
 * existen —seis de las numéricas del libro son aritmética suelta— y esconderlas
 * las dejaría sin practicar nunca, que es justo lo contrario de lo que hace
 * esta pantalla.
 */
export function showsInKind(kind: string, tags: string[] | undefined): boolean {
  if (kind === 'all') return true
  const kinds = kindsOf(tags)
  if (kind === 'none') return kinds.length === 0
  return kinds.includes(kind)
}

/** Cuántas preguntas se quedaron sin clasificar. Cero es lo normal. */
export function unclassifiedCount(questions: Question[]): number {
  return questions.filter((q) => kindsOf(q.tags).length === 0).length
}
