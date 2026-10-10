// Los cinco pasos del mapa de calor del calendario de estudio.
//
// Están aquí y no escritos dentro del `clsx` de la página por una razón
// concreta: cada paso es el acento a una opacidad, así que el fondo que se ve
// es una MEZCLA del acento con la superficie, y si la tinta de encima no se
// comprueba contra esa mezcla el número del día puede quedarse ilegible sin
// que nada avise. Fue lo que pasó: el nivel 3 estuvo al 60 % desde que existe
// el calendario, con su número en 3,68:1 sobre su propia casilla en el tema
// claro y 3,43:1 en el oscuro, cuando un texto normal pide 4,5:1.
//
// Sacándolos a datos, `scripts/contrast.test.mjs` multiplica la opacidad por
// el color de los dos temas y compara. Antes el test tenía la opacidad escrita
// dentro, que es tanto como no comprobar nada: cambiar la página no habría
// hecho fallar el test.
//
// Las clases van escritas enteras y literales a propósito. Tailwind escanea el
// fuente buscando nombres de clase; `bg-accent/${alpha}` construido en tiempo
// de ejecución no genera ninguna regla y la casilla saldría sin fondo.

export interface HeatLevel {
  /** 0 es un día sin estudiar; 4, uno que cumplió el objetivo diario. */
  level: 0 | 1 | 2 | 3 | 4
  /**
   * Opacidad del acento sobre la superficie, para poder calcular el color
   * real. `null` en los pasos que no son acento translúcido: el 0 es el hueco
   * hundido y el 4 es el acento macizo.
   */
  alpha: number | null
  /** El token de la tinta que va encima, para comprobarla contra la mezcla. */
  ink: string
  /** Lo que se le pasa a `clsx`, literal para que Tailwind lo vea. */
  className: string
}

export const HEAT_LEVELS: HeatLevel[] = [
  { level: 0, alpha: null, ink: 'ink-muted', className: 'bg-sunken text-ink-muted hover:bg-sunken' },
  {
    level: 1,
    alpha: 0.15,
    ink: 'ink-soft',
    className: 'bg-accent/15 text-ink-soft hover:bg-accent/25',
  },
  { level: 2, alpha: 0.35, ink: 'ink', className: 'bg-accent/35 text-ink hover:bg-accent/45' },
  {
    level: 3,
    alpha: 0.8,
    ink: 'on-accent',
    className: 'bg-accent/80 text-on-accent hover:bg-accent/90',
  },
  {
    level: 4,
    alpha: 1,
    ink: 'on-accent',
    className: 'bg-accent text-on-accent hover:brightness-110',
  },
]

/** El paso que le toca a un día, por su nivel. */
export function heatClass(level: number): string {
  return (HEAT_LEVELS.find((l) => l.level === level) ?? HEAT_LEVELS[0]).className
}
