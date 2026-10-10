import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { normaliseMarks, type BoardMarks, type NoticeMark } from './boardMarks'

// Las marcas del tablón y el interruptor de esconder lo visto.
//
// Almacén propio y no un campo más del perfil: el tablón se marca mientras se
// lee, y cada clic reescribiría también el objetivo semanal y la fecha de
// examen si compartieran almacén.

interface BoardState {
  marks: BoardMarks
  /** Preferencia de ESTE dispositivo, y por eso no viaja en la copia: el
   * tablón se mira de otra manera en el móvil que en el escritorio. */
  hideSeen: boolean
  mark: (id: string, mark: NoticeMark) => void
  toggleHideSeen: () => void
  clearMarks: () => void
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set) => ({
      marks: {},
      hideSeen: false,
      // Pulsar la marca que ya está puesta la quita: es el mismo botón, y así
      // no hace falta un tercer control para desmarcar.
      mark: (id, mark) =>
        set((state) => {
          const marks = { ...state.marks }
          if (marks[id] === mark) delete marks[id]
          else marks[id] = mark
          return { marks }
        }),
      toggleHideSeen: () => set((state) => ({ hideSeen: !state.hideSeen })),
      clearMarks: () => set({ marks: {} }),
    }),
    {
      name: 'epso-prep-board',
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<BoardState>
        return {
          ...current,
          marks: normaliseMarks(saved.marks),
          hideSeen: saved.hideSeen === true,
        }
      },
    },
  ),
)
