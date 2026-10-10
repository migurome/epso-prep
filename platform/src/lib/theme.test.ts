// El tema: claro, oscuro o el del sistema.
//
// Lo que se vigila, por orden de gravedad:
//
//   1. Que «el del sistema» QUITE el atributo en vez de escribir «light». Es
//      el fallo más fácil de cometer y el más difícil de ver: en una pantalla
//      clara todo parece correcto, y quien tiene el portátil en oscuro se
//      queda clavado en claro para siempre.
//   2. Que lo guardado se lea con tolerancia: un valor de otra versión no
//      puede dejar la pantalla a medias.
//
// Que los tres bloques del CSS definan los mismos tokens se comprueba en
// `scripts/themeTokens.test.mjs`: hay que leer el fichero de verdad, y Vitest
// sustituye los módulos CSS por stubs vacíos dentro de `src/`.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { applyTheme, attributeFor, normaliseTheme, readTheme, saveTheme, THEME_KEY } from './theme'

describe('qué se escribe en el html', () => {
  it('el tema del sistema no escribe nada', () => {
    // Y esto es lo importante: `null` significa QUITAR el atributo. Escribir
    // «light» ganaría a `prefers-color-scheme` y clavaría el tema claro en un
    // portátil en modo oscuro.
    expect(attributeFor('system')).toBeNull()
  })

  it('los elegidos a mano sí', () => {
    expect(attributeFor('dark')).toBe('dark')
    expect(attributeFor('light')).toBe('light')
  })

  it('aplicar «sistema» borra el atributo que hubiera', () => {
    const root = document.createElement('html')
    root.dataset.theme = 'dark'
    applyTheme('system', root)
    expect(root.dataset.theme).toBeUndefined()
    expect(root.getAttribute('data-theme')).toBeNull()
  })

  it('aplicar oscuro lo escribe', () => {
    const root = document.createElement('html')
    applyTheme('dark', root)
    expect(root.dataset.theme).toBe('dark')
  })
})

describe('lo que se lee de lo guardado', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('sin nada guardado manda el sistema', () => {
    expect(readTheme()).toBe('system')
  })

  it('un valor de otra versión no rompe nada: manda el sistema', () => {
    localStorage.setItem(THEME_KEY, 'sepia')
    expect(readTheme()).toBe('system')
  })

  it('ida y vuelta', () => {
    saveTheme('dark')
    expect(readTheme()).toBe('dark')
  })

  it('normaliza cualquier cosa', () => {
    expect(normaliseTheme(null)).toBe('system')
    expect(normaliseTheme(42)).toBe('system')
    expect(normaliseTheme('light')).toBe('light')
  })
})
