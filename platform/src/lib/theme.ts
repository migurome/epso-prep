// Claro, oscuro, o lo que diga el sistema.
//
// Tres estados y no un interruptor de dos, porque «lo que diga el sistema» es
// una respuesta distinta de «claro»: quien tiene el portátil en automático
// quiere que la plataforma cambie sola al atardecer, y un interruptor de dos
// posiciones le obliga a elegir un bando para siempre.
//
// **No se guarda con `zustand/persist`.** El valor lo lee también un script en
// línea del `index.html`, antes del primer pintado, porque si esperara a que
// arranque React quien tiene el tema oscuro vería un fogonazo blanco en cada
// recarga. Ese script tiene que leer algo plano, y `persist` guarda
// `{"state":{…},"version":n}`: acoplar el arranque al formato interno de
// zustand es pedir que se rompa en silencio el día que zustand cambie el
// envoltorio. Así que una clave propia con la cadena pelada.
//
// Tampoco viaja en la copia de seguridad, igual que el interruptor de esconder
// las convocatorias vistas: es preferencia de cada pantalla. Elegir oscuro en
// el móvil no es motivo para oscurecer el portátil.

export type Theme = 'system' | 'light' | 'dark'

export const THEMES: Theme[] = ['system', 'light', 'dark']

/** La clave, que comparten este módulo y el script de arranque. Si cambia aquí
 * hay que cambiarla en `index.html`, y entonces el fogonazo vuelve. */
export const THEME_KEY = 'epso-prep-theme'

/** Lo guardado, o `system` si no hay nada o no se entiende. */
export function normaliseTheme(value: unknown): Theme {
  return THEMES.includes(value as Theme) ? (value as Theme) : 'system'
}

/**
 * Qué poner en `data-theme` del `<html>`.
 *
 * `system` devuelve `null`, que significa **quitar el atributo**, no poner
 * «light»: el CSS resuelve el tema del sistema con `prefers-color-scheme`, y
 * dejar escrito `data-theme="light"` ganaría a esa consulta y clavaría el tema
 * claro en un portátil en modo oscuro. Es el fallo más fácil de cometer aquí y
 * el más difícil de ver, porque en una pantalla clara todo parece correcto.
 */
export function attributeFor(theme: Theme): 'light' | 'dark' | null {
  return theme === 'system' ? null : theme
}

export function readTheme(): Theme {
  try {
    return normaliseTheme(localStorage.getItem(THEME_KEY))
  } catch {
    // Ventana privada, almacenamiento bloqueado: se trabaja sin recordar nada.
    return 'system'
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Si no se puede guardar, el tema vale para esta sesión y se pierde al
    // recargar. Es peor fallar y dejar la pantalla a medias.
  }
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  const value = attributeFor(theme)
  if (value === null) delete root.dataset.theme
  else root.dataset.theme = value
}
