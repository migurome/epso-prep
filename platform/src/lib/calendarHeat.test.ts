// Los pasos del mapa de calor del calendario.
//
// El contraste de cada paso contra su propia mezcla se comprueba en
// `scripts/contrast.test.mjs`, que tiene que leer el CSS. Aquí sólo se vigila
// el reparto: que cada día reciba el paso que le toca.
import { describe, it, expect } from 'vitest'
import { HEAT_LEVELS, heatClass } from './calendarHeat'

describe('a cada día su paso', () => {
  it('cada nivel recibe su propia clase, y no la del vecino', () => {
    for (const nivel of HEAT_LEVELS) {
      expect(heatClass(nivel.level)).toBe(nivel.className)
    }
  })

  it('los cinco pasos son distintos: si dos coinciden, el mapa deja de medir', () => {
    const clases = new Set(HEAT_LEVELS.map((l) => l.className))
    expect(clases.size).toBe(HEAT_LEVELS.length)
  })

  it('un día sin estudiar y uno que cumplió el objetivo no se pintan igual', () => {
    expect(heatClass(0)).not.toBe(heatClass(4))
  })

  it('un nivel que no existe cae en el paso vacío, no en undefined', () => {
    // Si el cálculo del nivel cambiara y devolviera un 5, la casilla se
    // quedaría sin clase y sin fondo. Mejor pintarla como un día vacío.
    expect(heatClass(9)).toBe(HEAT_LEVELS[0].className)
    expect(heatClass(-1)).toBe(HEAT_LEVELS[0].className)
  })
})
