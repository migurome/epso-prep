// Contraste WCAG de los pares de color que la plataforma usa de verdad.
//
// Existe porque este método ha encontrado tres defectos en un solo día, y los
// tres llevaban meses ahí: el blanco sobre el verde del distintivo «Nueva»
// (3,77:1), el blanco sobre el ámbar (3,19:1) y el número del día sobre el
// nivel 3 del mapa de calor (3,68:1 en claro, 3,43:1 en oscuro). Ninguno lo
// habría encontrado un test de componente, porque ninguno es un fallo de
// lógica: son dos colores que se eligieron por separado y nadie multiplicó.
//
// La lista de pares se escribe a mano, a propósito. Se probó a deducirla
// leyendo qué clases coinciden en un mismo `className` y salieron cinco falsos
// positivos —ramas distintas del mismo `clsx` leídas como si se pintaran
// juntas—, así que como herramienta de descubrimiento vale y como puerta no.
// Si se añade un par de color nuevo a la interfaz, se añade aquí.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { HEAT_LEVELS } from '../src/lib/calendarHeat.ts'

const CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/index.css'),
  'utf8',
)

/** Mínimo de WCAG AA: 4,5:1 para texto normal, 3:1 para texto grande y para
 * los elementos no textuales (un borde, una barra de un gráfico). */
const TEXTO = 4.5
const OBJETO = 3

// [tinta, fondo, mínimo, para qué]
const PARES = [
  ['ink', 'surface', TEXTO, 'texto normal sobre la página'],
  ['ink', 'raised', TEXTO, 'texto normal sobre una tarjeta'],
  ['ink', 'sunken', TEXTO, 'texto sobre lo hundido'],
  ['ink-soft', 'raised', TEXTO, 'texto secundario sobre tarjeta'],
  ['ink-soft', 'surface', TEXTO, 'texto secundario sobre la página'],
  ['ink-soft', 'sunken', TEXTO, 'texto secundario sobre lo hundido'],
  ['ink-muted', 'raised', OBJETO, 'pies y etiquetas de eje'],
  ['ink-muted', 'surface', OBJETO, 'pies sobre la página'],
  ['ink-muted', 'sunken', OBJETO, 'el día vacío del calendario'],
  ['on-accent', 'accent', TEXTO, 'texto de un botón relleno'],
  ['on-good', 'good', TEXTO, 'texto del distintivo «Nueva»'],
  ['on-bad', 'bad', TEXTO, 'texto de un aviso rojo'],
  ['on-warn', 'warn', TEXTO, 'texto de un distintivo a la espera'],
  ['accent', 'raised', OBJETO, 'enlace y borde de acento'],
  ['accent', 'surface', OBJETO, 'enlace sobre la página'],
  ['accent-ink', 'accent-soft', TEXTO, 'texto del chip de acento'],
  ['good-ink', 'good-soft', TEXTO, 'texto del chip verde'],
  ['bad-ink', 'bad-soft', TEXTO, 'texto del chip rojo'],
  ['warn-ink', 'warn-soft', TEXTO, 'texto del chip a la espera'],
  ['paper-ink', 'paper', TEXTO, 'texto sobre la hoja de papel'],
]

/**
 * El mapa de calor del calendario, que no se puede comprobar con dos colores.
 *
 * Cada nivel es el acento a una opacidad sobre la superficie, así que el fondo
 * real es una MEZCLA y hay que calcularla. Multiplicar la opacidad por el
 * color es exactamente el paso que nadie dio cuando se escribió, y de ahí
 * salió el nivel 3 en 3,43:1.
 *
 * Los pasos se IMPORTAN del módulo que pinta el calendario. Tenerlos copiados
 * aquí —que es como estaba escrito primero— deja el test comprobando sus
 * propios números: cambiar la página al 60 % otra vez no lo habría hecho
 * fallar, y eso no es una comprobación, es un adorno.
 */
const NIVELES = HEAT_LEVELS.filter((l) => l.alpha !== null).map((l) => [l.alpha, l.ink, l.level])

function bloque(patron) {
  const encontrado = patron.exec(CSS)
  expect(encontrado, 'el bloque no está en index.css').toBeTruthy()
  return Object.fromEntries(
    [...encontrado[1].matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)].map((m) => [
      m[1],
      m[2],
    ]),
  )
}

// Los fijos (`paper`) viven en @theme, no en los bloques del tema.
const FIJOS = bloque(/@theme \{\r?\n([\s\S]*?)\r?\n\}/)
const normaliza = (v) => ({ ...FIJOS, ...v, ...renombra(FIJOS) })
function renombra(fijos) {
  // En @theme los nombres llevan el prefijo `color-`: `--color-paper`.
  return Object.fromEntries(
    Object.entries(fijos)
      .filter(([k]) => k.startsWith('color-'))
      .map(([k, v]) => [k.slice('color-'.length), v]),
  )
}

const TEMAS = {
  claro: normaliza(bloque(/:root \{\r?\n([\s\S]*?)\r?\n\}/)),
  oscuro: normaliza(bloque(/:root\[data-theme="dark"\] \{\r?\n([\s\S]*?)\r?\n\}/)),
}

function rgb(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = [...h].map((c) => c + c).join('')
  return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16))
}

function luminancia(canales) {
  const lineal = canales.map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lineal[0] + 0.7152 * lineal[1] + 0.0722 * lineal[2]
}

function razon(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/** El color que se ve al poner `frente` con opacidad `alfa` sobre `fondo`. */
function mezcla(frente, fondo, alfa) {
  const [f, b] = [rgb(frente), rgb(fondo)]
  return f.map((c, i) => Math.round(c * alfa + b[i] * (1 - alfa)))
}

describe.each(Object.keys(TEMAS))('contraste del tema %s', (tema) => {
  const v = TEMAS[tema]

  it.each(PARES)('%s sobre %s llega al mínimo (%d:1) — %s', (tinta, fondo, minimo) => {
    expect(v[tinta], `falta --${tinta} en el tema ${tema}`).toBeTruthy()
    expect(v[fondo], `falta --${fondo} en el tema ${tema}`).toBeTruthy()
    const r = razon(rgb(v[tinta]), rgb(v[fondo]))
    expect(Number(r.toFixed(2)), `${tinta} sobre ${fondo} = ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(
      minimo,
    )
  })

  it.each(NIVELES)(
    'el acento al %d por uno deja leer el número del día con text-%s (nivel %d)',
    (alfa, tinta) => {
      const fondo = mezcla(v.accent, v.raised, alfa)
      const r = razon(rgb(v[tinta]), fondo)
      expect(Number(r.toFixed(2)), `acento al ${alfa * 100}% = ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        TEXTO,
      )
    },
  )
})

describe('las seis series de un gráfico', () => {
  const series = (v) => [1, 2, 3, 4, 5, 6].map((i) => v[`series-${i}`])
  const flojas = (v) =>
    series(v)
      .map((hex, i) => [i + 1, razon(rgb(hex), rgb(v.raised))])
      .filter(([, r]) => r < OBJETO)
      .map(([n]) => n)

  it('en el tema oscuro las seis se separan del fondo (3:1)', () => {
    expect(flojas(TEMAS.oscuro)).toEqual([])
  })

  it('en el claro son tres, las documentadas, y la tabla es su alivio', () => {
    // Aqua, amarillo y magenta. No es un descuido: es la paleta validada del
    // libro de estilo, y su remedio documentado es que el gráfico SIEMPRE
    // lleva su tabla debajo. Si algún día fueran otras tres, o cuatro, este
    // test lo dice en vez de dejarlo pasar.
    expect(flojas(TEMAS.claro)).toEqual([3, 4, 5])
  })
})

describe('los pasos del mapa de calor dicen la verdad sobre sí mismos', () => {
  // Lo de arriba comprueba el contraste de `alpha` y de `ink`. Pero lo que la
  // pantalla pinta es `className`, y si los tres se desincronizan el test
  // seguiría en verde midiendo un color que nadie ve. Esto los ata.
  it.each(HEAT_LEVELS.filter((l) => l.alpha !== null && l.alpha < 1))(
    'el nivel %s lleva en su clase la misma opacidad que declara',
    (nivel) => {
      const escrita = /bg-accent\/(\d+)\b/.exec(nivel.className)
      expect(escrita, `el nivel ${nivel.level} no lleva bg-accent/NN`).toBeTruthy()
      expect(Number(escrita[1])).toBe(Math.round(nivel.alpha * 100))
    },
  )

  it('el paso macizo no lleva opacidad en la clase', () => {
    const macizo = HEAT_LEVELS.find((l) => l.alpha === 1)
    expect(macizo.className).toContain('bg-accent ')
    expect(macizo.className).not.toMatch(/bg-accent\/\d/)
  })

  it.each(HEAT_LEVELS)('el nivel %s lleva en su clase la tinta que declara', (nivel) => {
    expect(nivel.className).toContain(`text-${nivel.ink}`)
  })

  it('están los cinco pasos, del 0 al 4, y una sola vez cada uno', () => {
    expect(HEAT_LEVELS.map((l) => l.level)).toEqual([0, 1, 2, 3, 4])
  })
})
