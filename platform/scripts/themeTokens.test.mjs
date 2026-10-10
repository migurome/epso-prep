// Auditoría de `src/index.css`: los tres bloques de color tienen que definir
// exactamente los mismos tokens.
//
// Vive aquí y no en `src/` por una razón práctica: hay que leer el fichero de
// verdad, y Vitest sustituye los módulos CSS por stubs vacíos dentro de `src/`
// —`index.css?raw` llega como cadena vacía—. Aquí se lee con `node:fs`, igual
// que el resto de las auditorías de fuente.
//
// Y existe porque este fallo no lo ve ningún otro test: jsdom no resuelve
// variables en cascada, así que un token que esté en el tema claro y falte en
// el oscuro pasa toda la suite en verde y se manifiesta en la cara de quien
// use el tema oscuro, con un texto del color del fondo.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/index.css'),
  'utf8',
)

// Los `\r?\n` no son manías: en Windows git deja el fichero con CRLF al hacer
// checkout, y una expresión atada a `\n` deja de encontrar los bloques en
// cuanto alguien clona el repositorio. El fallo se leería como «falta un
// token», que es justo lo contrario de lo que estaría pasando.
const BLOQUES = {
  claro: /:root \{\r?\n([\s\S]*?)\r?\n\}/,
  sistema: /:root:not\(\[data-theme="light"\]\) \{\r?\n([\s\S]*?)\r?\n {2}\}/,
  manual: /:root\[data-theme="dark"\] \{\r?\n([\s\S]*?)\r?\n\}/,
}

function cuerpo(nombre) {
  const encontrado = BLOQUES[nombre].exec(CSS)
  expect(encontrado, `el bloque «${nombre}» no está en index.css`).toBeTruthy()
  return encontrado[1]
}

function tokens(nombre) {
  return [...cuerpo(nombre).matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]).sort()
}

describe('los tres bloques de color', () => {
  it('el tema del sistema define exactamente los mismos tokens que el claro', () => {
    expect(tokens('sistema')).toEqual(tokens('claro'))
  })

  it('el oscuro elegido a mano también', () => {
    expect(tokens('manual')).toEqual(tokens('claro'))
  })

  it('hay bastantes tokens: si el bloque se vacía, esto no pasa por casualidad', () => {
    expect(tokens('claro').length).toBeGreaterThan(25)
  })

  it('cada variable registrada en @theme tiene valor en los tres bloques', () => {
    // `@theme` apunta a variables: `--color-raised: var(--raised)`. Registrar
    // una utilidad cuya variable no existe genera la clase y no pinta nada.
    const theme = /@theme \{\r?\n([\s\S]*?)\r?\n\}/.exec(CSS)
    expect(theme, 'no hay bloque @theme').toBeTruthy()
    const apuntadas = [...theme[1].matchAll(/var\(--([a-z0-9-]+)\)/g)].map((m) => m[1])
    expect(apuntadas.length).toBeGreaterThan(20)
    for (const nombre of ['claro', 'sistema', 'manual']) {
      const tiene = new Set(tokens(nombre))
      for (const token of apuntadas) {
        expect(tiene.has(token), `--${token} no tiene valor en el bloque «${nombre}»`).toBe(true)
      }
    }
  })
})

describe('el blanco', () => {
  it('el tema oscuro no deja ningún color en blanco puro', () => {
    // `paper` sí es blanco en los dos temas, a propósito, y por eso está en
    // `@theme` y no en los bloques del tema: las figuras de abstracto son
    // imágenes sobre blanco y sus rellenos son el dato de la pregunta.
    // Cualquier OTRO blanco dentro del bloque oscuro sería un olvido.
    const blancos = [
      ...cuerpo('manual').matchAll(/--([a-z0-9-]+):\s*(?:#ffffff|#fff|white)\b/g),
    ].map((m) => m[1])
    expect(blancos).toEqual([])
  })

  it('el blanco del papel no depende del tema', () => {
    expect(/--color-paper:\s*#ffffff/.test(CSS)).toBe(true)
  })
})
