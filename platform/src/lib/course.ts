import { kindsOf } from './questionKind'
import type { Question, TheoryDoc } from '../types/content'

// Emparejado de la teoría del curso con su banco de preguntas.
//
// El generador (scripts/build_content.py) etiqueta cada pregunta con el título
// del módulo al que pertenece y comprueba, al construir, que ese título existe
// entre los módulos: si alguien renombra un módulo y se olvida del encabezado
// del banco, la construcción falla en vez de dejar preguntas huérfanas que
// desaparecerían de la interfaz sin que nada avisara.
//
// Aquí sólo se rehace ese emparejado en el navegador, y se ordena por el
// número que lleva el identificador del documento.

/** Etiquetas que no son títulos de módulo. */
// El módulo de una pregunta viaja como su tipo de ejercicio (`kind:<slug>`),
// igual que las familias de numérico o los temas de campo: para el candidato,
// el módulo del curso ES el tipo de ejercicio que está practicando.

export interface CourseModule {
  doc: TheoryDoc
  questions: Question[]
}

/** Número de módulo a partir de un id 'course-<algo>-m<N>'. Devuelve 0 para la
 * introducción, que así queda siempre la primera al ordenar. */
export function moduleNumber(id: string): number {
  const match = /-m(\d+)$/.exec(id)
  return match ? Number(match[1]) : 0
}

function moduleTags(question: Question): string[] {
  return kindsOf(question.tags)
}

/**
 * El identificador que lleva el tag, a partir del título del módulo.
 *
 * Tiene que coincidir con `slug()` de scripts/lib/question_kinds.py, que es
 * quien lo escribe. Si las dos se separan, las preguntas dejan de encontrar su
 * módulo y el curso se queda con doce módulos vacíos sin que nada falle: lo
 * comprueba `course.test.ts` sobre el contenido publicado de verdad.
 */
export function moduleSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Los módulos del curso, en orden, cada uno con sus preguntas. La
 * introducción no es un módulo y se excluye. */
export function courseModules(theory: TheoryDoc[], questions: Question[]): CourseModule[] {
  const byTitle = new Map<string, Question[]>()
  for (const question of questions) {
    for (const tag of moduleTags(question)) {
      const list = byTitle.get(tag)
      if (list) list.push(question)
      else byTitle.set(tag, [question])
    }
  }

  return theory
    .filter((doc) => moduleNumber(doc.id) > 0)
    .sort((a, b) => moduleNumber(a.id) - moduleNumber(b.id))
    .map((doc) => ({ doc, questions: byTitle.get(moduleSlug(doc.title.en)) ?? [] }))
}

export function findModule(
  theory: TheoryDoc[],
  questions: Question[],
  number: number,
): CourseModule | undefined {
  return courseModules(theory, questions).find((m) => moduleNumber(m.doc.id) === number)
}
