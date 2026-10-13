// Las cifras del capítulo 9 (estrategia), vueltas a derivar de los bancos.
//
// El capítulo entero vale por sus números: «74 de 120 preguntas numéricas son
// cadenas», «el 64 % de los distractores verbales son indemostrables», «la
// opción más larga es la correcta en 437 de 442 preguntas de campo». Esos
// números salieron de contar, pero una vez escritos en prosa dejan de estar
// atados a nada: cualquiera puede añadir preguntas a un banco y el capítulo
// seguirá afirmando lo de antes, con la misma seguridad y ya sin razón.
//
// Esto lo vuelve a contar y comprueba que el capítulo dice lo que los bancos
// dicen, en los dos idiomas. Si falla, lo que hay que corregir es el capítulo
// —o entender por qué cambió el banco—, nunca el test.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { QUESTIONS, QUESTION_KINDS } from '../src/data/content.numerical.generated.ts'

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '../../Docs')
const leer = (rel) => readFileSync(join(DOCS, rel), 'utf8')

const CAPITULO_EN = leer('9.- Strategy - reading the banks.md')
const CAPITULO_ES = leer('es/9.- Estrategia - leer los bancos.md')

/** Parte un banco en enunciados y respuestas por el ENCABEZADO de respuestas.
 * Partir por la cadena a secas no vale: alguna introducción menciona
 * «`## ANSWERS`» en el propio texto. */
function partir(texto) {
  const trozos = texto.split(/^## (?:ANSWERS|RESPUESTAS)\s*$/m)
  expect(trozos.length, 'se esperaba un solo encabezado de respuestas').toBe(2)
  return { cuerpo: trozos[0], respuestas: trozos[1] }
}

// El final de un bloque se escribe `(?![\s\S])` y no `\Z`: en JavaScript `\Z`
// no es el fin de cadena, es una «Z» literal, así que el ÚLTIMO bloque de cada
// banco se perdía en silencio y todos los recuentos salían uno corto.
const bloques = (texto, re) => [...texto.matchAll(re)]

describe('numérico: las cadenas y el «imposible saberlo»', () => {
  const { cuerpo, respuestas } = partir(leer('es/2.- Razonamiento numérico (banco real).md'))
  const preguntas = bloques(cuerpo, /^\*\*(\d+)\.\*\*\s([\s\S]*?)(?=^\*\*\d+\.\*\*|(?![\s\S]))/gm)
  const sols = bloques(
    respuestas,
    /^\*\*(\d+)\.\s*([A-E])\*\*\s([\s\S]*?)(?=^\*\*\d+\.\s*[A-E]\*\*|(?![\s\S]))/gm,
  )

  it('el banco sigue teniendo 120 preguntas con su explicación', () => {
    expect(preguntas).toHaveLength(120)
    expect(sols).toHaveLength(120)
  })

  it('74 de las 120 necesitan más de una fase, y el capítulo lo dice', () => {
    // El propio libro declara las fases en su explicación: «Debemos proceder
    // en dos fases», «en tres fases». Una sola fase es la que no lo dice.
    // El cuerpo de la explicación es la CUARTA captura: [todo, número, letra,
    // cuerpo]. Cogiendo la tercera se filtraba por la letra, que nunca lleva
    // la palabra «fase», y salían las 120 como de una sola fase.
    const unaFase = sols.filter(([, , , sol]) => !/\bfase/i.test(sol)).length
    expect(unaFase).toBe(46)
    expect(120 - unaFase).toBe(74)
    for (const cap of [CAPITULO_EN, CAPITULO_ES]) {
      expect(cap).toMatch(/74 (?:of|de las) (?:the )?120/)
      expect(cap).toContain('46')
    }
  })

  it('«imposible saberlo» es la correcta exactamente una vez', () => {
    const porNumero = new Map(preguntas.map(([, n, c]) => [Number(n), c]))
    let veces = 0
    for (const [, n, letra] of sols) {
      const opciones = bloques(porNumero.get(Number(n)) ?? '', /^([a-e])\)\s*(.+)$/gm)
      const suya = opciones.find(([, l]) => l.toUpperCase() === letra)
      if (suya && /imposible/i.test(suya[2])) veces += 1
    }
    expect(veces).toBe(1)
    expect(CAPITULO_ES).toContain('es la correcta una vez')
    expect(CAPITULO_EN).toContain('it is correct once')
  })
})

describe('verbal: por qué falla un distractor', () => {
  const { respuestas } = partir(leer('es/1.- Razonamiento verbal (banco).md'))
  const sols = bloques(
    respuestas,
    /^\*\*(\d+)\.\s*([A-D])\*\*\s([\s\S]*?)(?=^\*\*\d+\.\s*[A-D]\*\*|(?![\s\S]))/gm,
  )

  it('dos tercios de los distractores son «no se puede saber», no «falso»', () => {
    let noSePuede = 0
    let falso = 0
    for (const [, , correcta, cuerpo] of sols) {
      for (const [, letra, veredicto] of bloques(
        cuerpo,
        /^([A-D])\.\s*(Verdadero|Falso|No se puede saber)\b/gm,
      )) {
        if (letra === correcta) continue
        if (veredicto === 'Falso') falso += 1
        else if (veredicto === 'No se puede saber') noSePuede += 1
      }
    }
    expect(sols).toHaveLength(180)
    expect(noSePuede).toBe(345)
    expect(falso).toBe(195)
    const porcentaje = (noSePuede * 100) / (noSePuede + falso)
    expect(porcentaje.toFixed(1)).toBe('63.9')
    expect(CAPITULO_ES).toContain('63,9')
    expect(CAPITULO_EN).toContain('63.9')
  })
})

describe('abstracto: el relleno manda', () => {
  const { respuestas } = partir(leer('es/3.- Razonamiento abstracto (banco real).md'))
  const sols = bloques(
    respuestas,
    /^\*\*(\d+)\.\s*([A-E])\*\*\s([\s\S]*?)(?=^\*\*\d+\.\s*[A-E]\*\*|(?![\s\S]))/gm,
  )

  it('el relleno aparece en 77 de las 120 series, por encima de la rotación', () => {
    const conRelleno = sols.filter(([, , , s]) =>
      /relleno|sombreado|rayad|negro|gris|en blanco|vac[ií]o/i.test(s),
    ).length
    const conRotacion = sols.filter(([, , , s]) =>
      /rota|gira|sentido (?:horario|antihorario)|\d+\s*°/i.test(s),
    ).length
    expect(sols).toHaveLength(120)
    expect(conRelleno).toBe(77)
    expect(conRotacion).toBe(48)
    expect(conRelleno).toBeGreaterThan(conRotacion)
    for (const cap of [CAPITULO_EN, CAPITULO_ES]) {
      expect(cap).toContain('77')
      expect(cap).toContain('48')
    }
  })
})

describe('campo: la pista de longitud sigue ahí (y el capítulo avisa)', () => {
  const BANCOS = [
    ['4.- MCQ de campo - Ciberseguridad (banco).md', 120, 120],
    ['4.- MCQ de campo - Ciencia de Datos (banco).md', 82, 81],
    ['4.- MCQ de campo - Gestión de Proyectos TIC (banco).md', 80, 76],
    ['4.- MCQ de campo - Infraestructura TIC (banco).md', 80, 80],
    ['4.- MCQ de campo - Nubes y Redes (banco).md', 80, 80],
  ]

  it.each(BANCOS)('%s: la más larga acierta %d veces de %d', (archivo, total, esperadas) => {
    const { cuerpo, respuestas } = partir(leer(`es/${archivo}`))
    const sols = new Map(
      bloques(respuestas, /^\*\*(\d+)\.\s*([A-D])\*\*/gm).map(([, n, l]) => [Number(n), l]),
    )
    const preguntas = bloques(cuerpo, /^\*\*(\d+)\.\*\*\s([\s\S]*?)(?=^\*\*\d+\.\*\*|^###|(?![\s\S]))/gm)
    let largaCorrecta = 0
    let validas = 0
    for (const [, n, c] of preguntas) {
      const ops = Object.fromEntries(bloques(c, /^([A-D])\.\s+(.+?)\s*$/gm).map((m) => [m[1], m[2]]))
      const correcta = sols.get(Number(n))
      if (Object.keys(ops).length !== 4 || !correcta) continue
      validas += 1
      const masLarga = Object.keys(ops).reduce((a, b) => (ops[a].length >= ops[b].length ? a : b))
      if (masLarga === correcta) largaCorrecta += 1
    }
    expect(validas).toBe(total)
    expect(largaCorrecta).toBe(esperadas)
  })

  it('el capítulo da la cifra conjunta y la llama defecto, no táctica', () => {
    const total = BANCOS.reduce((s, [, t]) => s + t, 0)
    const aciertos = BANCOS.reduce((s, [, , a]) => s + a, 0)
    expect(total).toBe(442)
    expect(aciertos).toBe(437)
    expect(CAPITULO_EN).toContain('437 of 442')
    expect(CAPITULO_ES).toContain('437 de 442')
    // Lo importante no es la cifra, es cómo se presenta: si algún día alguien
    // reescribe esto como un atajo útil, el test se queja.
    expect(CAPITULO_ES).toMatch(/defecto del banco, no una táctica/)
    expect(CAPITULO_EN).toMatch(/defect in the bank, not a tactic/)
  })
})

describe('los dos idiomas cuentan lo mismo', () => {
  it('las dos versiones tienen las mismas secciones', () => {
    const secciones = (t) => (t.match(/^## /gm) ?? []).length
    expect(secciones(CAPITULO_ES)).toBe(secciones(CAPITULO_EN))
  })

  it('ninguna de las dos se ha quedado a medias', () => {
    for (const cap of [CAPITULO_EN, CAPITULO_ES]) {
      expect(cap.length).toBeGreaterThan(9000)
    }
  })
})

describe('el capítulo y las pestañas cuentan lo mismo', () => {
  // Esto es lo que se escapó la primera vez. El capítulo se escribió con un
  // guion de análisis y las pestañas salen del clasificador del generador, así
  // que había dos clasificadores y dos juegos de cifras para el mismo concepto:
  // el capítulo decía 62 reglas de porcentaje y la plataforma enseñaba 67.
  // Ahora el clasificador del generador es el único, y esto comprueba que el
  // capítulo dice lo que la plataforma enseña.
  // Se IMPORTA el módulo generado en vez de leerlo con una expresión regular:
  // el fichero está en CRLF y pesa megas, y un patrón atado a `\n` fallaba sin
  // decir por qué. Importarlo es además lo que hace la propia aplicación.
  const rotulos = QUESTION_KINDS
  const libro = QUESTIONS.filter((q) => q.id.startsWith('num-real-'))
  const tiposDe = (q) =>
    (q.tags ?? []).filter((t) => t.startsWith('kind:')).map((t) => t.slice(5))

  it('el banco del libro sigue siendo de 120 y todas sus familias tienen rótulo', () => {
    expect(libro).toHaveLength(120)
    for (const q of libro) {
      for (const tipo of tiposDe(q)) {
        expect(rotulos[tipo], `${tipo} sin rótulo en el catálogo`).toBeTruthy()
        expect(rotulos[tipo].es).toBeTruthy()
        expect(rotulos[tipo].en).toBeTruthy()
      }
    }
  })

  it('cada familia con cinco preguntas o más aparece en el capítulo con su cifra', () => {
    const cuenta = new Map()
    for (const q of libro) {
      for (const tipo of tiposDe(q)) cuenta.set(tipo, (cuenta.get(tipo) ?? 0) + 1)
    }
    // Las de menos de cinco no se exigen en la tabla: una familia de dos no
    // merece una fila, y pedirlo aquí ataría el capítulo a un ruido.
    const grandes = [...cuenta.entries()].filter(([, n]) => n >= 5)
    expect(grandes.length).toBeGreaterThan(8)
    for (const [tipo, n] of grandes) {
      // Las barras van dobladas: dentro de una plantilla `` `...` `` de
      // JavaScript, `\s` se queda en una «s» y la expresión deja de ser la
      // que uno lee.
      const fila = new RegExp(`\|[^|]*\|\s*${n}\s*\|`)
      expect(CAPITULO_ES, `falta la fila de ${tipo} con ${n}`).toMatch(fila)
      expect(CAPITULO_EN, `missing the ${tipo} row with ${n}`).toMatch(fila)
    }
  })

  it('el número de preguntas con más de una familia es el que dice el capítulo', () => {
    const varias = libro.filter((q) => tiposDe(q).length >= 2).length
    const ninguna = libro.filter((q) => tiposDe(q).length === 0).length
    expect(varias).toBe(63)
    expect(ninguna).toBe(6)
    expect(CAPITULO_ES).toContain('63 de las 120')
    expect(CAPITULO_EN).toContain('63 of the 120')
  })
})
