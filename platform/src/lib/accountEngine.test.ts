// El progreso local es de una cuenta. Si en el navegador entra otra, la
// primera sincronización fusionaría lo de la anterior y lo subiría a su fila.
import { beforeEach, describe, expect, it } from 'vitest'
import { claimLocalProgress } from './accountEngine'
import { usePracticeStore } from './practiceStore'
import { useSyncStore } from './syncStore'

const answered = () => Object.keys(usePracticeStore.getState().answers).length

beforeEach(() => {
  usePracticeStore.setState({ answers: { q1: { optionId: 'a', at: '' } }, orderSeed: {} })
  useSyncStore.setState({ owner: null })
})

describe('claimLocalProgress', () => {
  it('sin dueño (instalación anterior): se adopta sin borrar nada', () => {
    claimLocalProgress('A')
    expect(answered()).toBe(1)
    expect(useSyncStore.getState().owner).toBe('A')
  })

  it('la misma cuenta que vuelve conserva lo que no llegó a subir', () => {
    useSyncStore.setState({ owner: 'A' })
    claimLocalProgress('A')
    expect(answered()).toBe(1)
  })

  it('otra cuenta encuentra el navegador vacío', () => {
    useSyncStore.setState({ owner: 'A' })
    claimLocalProgress('B')
    expect(answered()).toBe(0)
    expect(useSyncStore.getState().owner).toBe('B')
  })
})
