import { create } from 'zustand'
import { applyTheme, readTheme, saveTheme, type Theme } from './theme'

// El tema elegido, para que Ajustes se entere de que cambió.
//
// Sin `persist`: guardar y aplicar lo hace el propio `setTheme`, porque el
// valor tiene que quedar en una clave plana que el script de arranque del
// `index.html` sepa leer. Ver `theme.ts`.

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()((set) => ({
  // El script de arranque ya puso el atributo; esto sólo recoge el mismo valor
  // para que la interfaz sepa cuál está marcado.
  theme: readTheme(),
  setTheme: (theme) => {
    saveTheme(theme)
    applyTheme(theme)
    set({ theme })
  },
}))
