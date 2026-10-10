// Las marcas del tablón.
//
// Lo que se vigila, por orden de gravedad:
//
//   1. Que una convocatoria PRESENTADA no se esconda nunca. Es la que más
//      importa —sus fechas de prueba son las del candidato— y esconderla
//      convertiría el filtro en una manera de perder la propia candidatura.
//   2. Que al fusionar dos dispositivos gane lo que está en pantalla.
//   3. Que una marca desconocida se tire en vez de llegar a la vista.
import { describe, it, expect } from 'vitest'
import { mergeMarks, normaliseMarks, seenCount, visibleNotices } from './boardMarks'

const NOTICES = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

describe('qué se esconde', () => {
  it('con el interruptor apagado no se esconde nada', () => {
    const marks = { a: 'seen', b: 'applied' } as const
    expect(visibleNotices(NOTICES, marks, false)).toHaveLength(3)
  })

  it('esconde las vistas', () => {
    expect(visibleNotices(NOTICES, { a: 'seen' }, true).map((n) => n.id)).toEqual(['b', 'c'])
  })

  it('NO esconde una presentada, aunque el interruptor esté puesto', () => {
    // Es la decisión de diseño del filtro, no un descuido: a esa te has
    // presentado, y sus fechas son las tuyas.
    const marks = { a: 'seen', b: 'applied' } as const
    expect(visibleNotices(NOTICES, marks, true).map((n) => n.id)).toEqual(['b', 'c'])
  })

  it('el contador cuenta vistas y no presentadas: es lo que el botón esconde', () => {
    expect(seenCount(NOTICES, { a: 'seen', b: 'applied', c: 'seen' })).toBe(2)
  })

  it('sin marcas no hay nada que esconder ni que contar', () => {
    expect(visibleNotices(NOTICES, {}, true)).toHaveLength(3)
    expect(seenCount(NOTICES, {})).toBe(0)
  })
})

describe('fusionar dos dispositivos', () => {
  it('gana la marca local: pisar lo que está en pantalla es peor', () => {
    expect(mergeMarks({ a: 'seen' }, { a: 'applied' })).toEqual({ a: 'seen' })
  })

  it('se trae las marcas que aquí no hay', () => {
    expect(mergeMarks({ a: 'seen' }, { b: 'applied' })).toEqual({ a: 'seen', b: 'applied' })
  })

  it('fusionar dos veces el mismo fichero deja lo mismo', () => {
    const once = mergeMarks({ a: 'seen' }, { b: 'applied' })
    expect(mergeMarks(once, { b: 'applied' })).toEqual(once)
  })
})

describe('lo que llega guardado', () => {
  it('descarta una marca que no sabemos pintar', () => {
    // Un fichero de una versión posterior puede traer marcas nuevas. Una marca
    // que no se sabe dibujar ensuciaría la vista sin decir nada.
    expect(normaliseMarks({ a: 'seen', b: 'shortlisted', c: 'applied' })).toEqual({
      a: 'seen',
      c: 'applied',
    })
  })

  it('aguanta que no haya nada, o que lo que haya no sea un objeto', () => {
    expect(normaliseMarks(undefined)).toEqual({})
    expect(normaliseMarks(null)).toEqual({})
    expect(normaliseMarks('seen')).toEqual({})
  })
})
