import type { RemoteBackend } from './remoteSync'
import { describeDbError as describe, supabase } from './supabaseClient'

// El progreso guardado en Supabase: una fila por cuenta.
//
// Está partido en dos a propósito. `stateRows` es lo único que sabe de
// PostgREST —cuatro llamadas, ninguna decisión—, y `remoteBackend` traduce esa
// fila a lo que el sincronizador entiende. La traducción sí se prueba, porque
// es donde algo puede salir torcido: el estado viaja como texto entre
// dispositivos y se guarda como `jsonb`, así que hay una conversión en cada
// sentido que tiene que devolver exactamente lo que entró.
//
// La tabla, sus políticas (RLS) y el disparador que pone `updated_at` están en
// Docs/sql/01-study-state.sql y 02-profiles.sql; la política vigente es la de 02
// (fila propia si la cuenta está aprobada, o cualquiera si eres admin).

/** La tabla donde vive el progreso. */
export const STATE_TABLE = 'study_state'

/**
 * Lo que hace falta de la tabla, y nada más.
 *
 * `read` devuelve null cuando la cuenta todavía no tiene fila, que es lo normal
 * el primer día y no un error.
 */
export interface StateRows {
  read(userId: string): Promise<{ snapshot: unknown; updatedAt: string } | null>
  write(userId: string, snapshot: unknown): Promise<{ updatedAt: string }>
}

/** Lo que habla con PostgREST de verdad. */
export function stateRows(): StateRows {
  return {
    async read(userId) {
      const { data, error } = await supabase()
        .from(STATE_TABLE)
        .select('snapshot, updated_at')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw new Error(describe(error))
      if (!data) return null
      return { snapshot: data.snapshot, updatedAt: String(data.updated_at) }
    },
    async write(userId, snapshot) {
      const { data, error } = await supabase()
        .from(STATE_TABLE)
        .upsert({ user_id: userId, snapshot }, { onConflict: 'user_id' })
        .select('updated_at')
        .single()
      if (error) throw new Error(describe(error))
      return { updatedAt: String(data.updated_at) }
    },
  }
}

/**
 * La fila de Supabase vista como almacén remoto.
 *
 * `ref` es la cuenta: no hay ficheros que localizar, la fila está donde está.
 * `version` es `updated_at`, que lo pone la base de datos en cada escritura.
 */
export function remoteBackend(userId: string, rows: StateRows): RemoteBackend {
  return {
    async read() {
      const row = await rows.read(userId)
      if (!row) return null
      return { ref: userId, version: row.updatedAt, text: JSON.stringify(row.snapshot) }
    },
    async write(text) {
      const { updatedAt } = await rows.write(userId, JSON.parse(text))
      return { ref: userId, version: updatedAt }
    },
  }
}
