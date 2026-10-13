// Las pestañas por tipo de ejercicio.
//
// Lo que se vigila, por orden de gravedad:
//
//   1. Que una pregunta de varias familias salga en TODAS sus pestañas. La
//      mayoría tiene más de una, y enseñarla solo en la primera dejaría la
//      mitad del banco sin practicar por una familia que sí la contiene.
//   2. Que un tipo sin rótulo no llegue a la pantalla. Una pestaña que ponga
//      «rule-of-three» es peor que una pestaña de menos.
//   3. Que las que no encajan en ninguna familia sigan siendo practicables.
import { describe, it, expect } from 'vitest'
import { kindTabs, kindsOf, showsInKind, unclassifiedCount } from './questionKind'
import type { Question } from '../types/content'

const q = (id: string, tags: string[]): Question =>
  ({ id, phase: 'reasoning', prompt: { es: '', en: '' }, options: [], tags }) as Question

const CATALOGO = {
  'rule-of-three': { es: 'Regla de tres', en: 'Rule of three' },
  averages: { es: 'Medias', en: 'Averages' },
  fractions: { es: 'Fracciones', en: 'Fractions' },
}

describe('qué tipos lleva una pregunta', () => {
  it('coge sólo los tags con prefijo, no la procedencia', () => {
    expect(kindsOf(['real', 'kind:averages', 'epso-official'])).toEqual(['averages'])
  })

  it('una pregunta sin tipos no revienta', () => {
    expect(kindsOf(undefined)).toEqual([])
    expect(kindsOf(['real'])).toEqual([])
  })
})

describe('las pestañas de un banco', () => {
  const banco = [
    q('1', ['kind:rule-of-three', 'kind:averages']),
    q('2', ['kind:averages']),
    q('3', ['kind:averages']),
    q('4', ['real']),
  ]

  it('van de la más poblada a la menos: la primera es la que más va a salir', () => {
    expect(kindTabs(banco, CATALOGO).map((x) => [x.id, x.count])).toEqual([
      ['averages', 3],
      ['rule-of-three', 1],
    ])
  })

  it('manda la frecuencia, no el alfabeto', () => {
    // Con «Medias» y «Regla de tres» el alfabeto y la frecuencia coincidían en
    // el caso de arriba, así que aquel test pasaba igual con las pestañas
    // ordenadas alfabéticamente. Aquí discrepan a propósito: la familia más
    // poblada va primera aunque su rótulo sea el último.
    const banco = [
      q('1', ['kind:rule-of-three']),
      q('2', ['kind:rule-of-three']),
      q('3', ['kind:rule-of-three']),
      q('4', ['kind:averages']),
    ]
    expect(kindTabs(banco, CATALOGO, 'es').map((x) => x.id)).toEqual([
      'rule-of-three',
      'averages',
    ])
  })

  it('una pregunta de dos familias cuenta en las dos', () => {
    const tabs = kindTabs(banco, CATALOGO)
    const total = tabs.reduce((s, x) => s + x.count, 0)
    // Tres preguntas con tipo y cuatro apariciones: la 1 sale en dos pestañas.
    // Si la suma fuera 3, alguien habría decidido que cada pregunta tiene un
    // tipo y la mitad del banco dejaría de practicarse por familia.
    expect(total).toBe(4)
    expect(tabs).toHaveLength(2)
  })

  it('un tipo sin rótulo en el catálogo no se enseña', () => {
    const tabs = kindTabs([q('5', ['kind:inventado'])], CATALOGO)
    expect(tabs).toEqual([])
  })

  it('sin catálogo no hay pestañas: es el caso de verbal', () => {
    expect(kindTabs(banco, undefined)).toEqual([])
  })

  it('a igual número ordena por rótulo, para que no baile entre compilaciones', () => {
    const empate = [q('a', ['kind:fractions']), q('b', ['kind:averages'])]
    // En español «Fracciones» va antes que «Medias»…
    expect(kindTabs(empate, CATALOGO, 'es').map((x) => x.id)).toEqual(['fractions', 'averages'])
    // …y en inglés al revés, porque manda el rótulo inglés: Averages, Fractions.
    expect(kindTabs(empate, CATALOGO, 'en').map((x) => x.id)).toEqual(['averages', 'fractions'])
  })
})

describe('qué entra en cada pestaña', () => {
  it('«todos» deja pasar hasta lo que no tiene tipo', () => {
    expect(showsInKind('all', undefined)).toBe(true)
    expect(showsInKind('all', ['kind:averages'])).toBe(true)
  })

  it('una pestaña concreta deja pasar la pregunta que la lleva entre varias', () => {
    expect(showsInKind('averages', ['kind:rule-of-three', 'kind:averages'])).toBe(true)
    expect(showsInKind('fractions', ['kind:rule-of-three', 'kind:averages'])).toBe(false)
  })

  it('las que no encajaron en ninguna familia tienen su propia pestaña', () => {
    // Seis de las 120 numéricas del libro son aritmética suelta. Esconderlas
    // las dejaría sin practicar nunca, que es lo contrario de lo que hace
    // esta pantalla.
    expect(showsInKind('none', ['real'])).toBe(true)
    expect(showsInKind('none', ['real', 'kind:averages'])).toBe(false)
    expect(unclassifiedCount([q('1', ['real']), q('2', ['kind:averages'])])).toBe(1)
  })
})
