import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uxcuxmyvnkdsmvgqrkrs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4Y3V4bXl2bmtkc212Z3Fya3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDY2MzYsImV4cCI6MjA3OTM4MjYzNn0.XnG4-YhYPio-tj2h0ejvDSc9_szGMVBxfZRWxypwYZw';

console.log('🔍 [Supabase] URL:', supabaseUrl);
console.log('🔑 [Supabase] Key cargada:', supabaseAnonKey ? '✅ Configurada' : '❌ No configurada');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Guarda una puntuación en Supabase
 * @param {string} userId - ID del usuario
 * @param {number} level - Nivel completado (0-7)
 * @param {number} score - Puntuación obtenida
 * @param {number} beersCollected - Cervezas recolectadas
 * @param {number} timeSeconds - Tiempo en segundos
 */
export async function saveScore(userId, level, score, beersCollected = 0, timeSeconds = 0) {
  try {
    console.log('💾 [Supabase] Guardando puntuación:', { userId, level, score, beersCollected, timeSeconds });

    const { data, error } = await supabase
      .from('beer_run_scores')
      .insert([
        {
          user_id: userId,
          level: level,
          score: score,
          beers_collected: beersCollected,
          time_seconds: timeSeconds
        }
      ])
      .select();

    if (error) {
      console.error('❌ [Supabase] Error guardando puntuación:', error);
      return { success: false, error };
    }

    console.log('✅ [Supabase] Puntuación guardada exitosamente:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ [Supabase] Error en saveScore:', error);
    return { success: false, error };
  }
}

/**
 * Obtiene las mejores puntuaciones de un usuario
 * @param {string} userId - ID del usuario
 * @param {number} limit - Número de resultados a devolver
 */
export async function getUserScores(userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('beer_run_scores')
      .select('*')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ [Supabase] Error obteniendo puntuaciones:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ [Supabase] Error en getUserScores:', error);
    return { success: false, error };
  }
}

/**
 * Obtiene el ranking global de un nivel
 * @param {number} level - Nivel
 * @param {number} limit - Número de resultados
 */
export async function getLeaderboard(level, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('beer_run_scores')
      .select('user_id, score, beers_collected, created_at')
      .eq('level', level)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ [Supabase] Error obteniendo leaderboard:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ [Supabase] Error en getLeaderboard:', error);
    return { success: false, error };
  }
}

/**
 * Obtiene la mejor puntuación de un usuario en un nivel específico
 * @param {string} userId - ID del usuario
 * @param {number} level - Nivel
 */
export async function getUserBestScore(userId, level) {
  try {
    console.log('🔍 [Supabase] Buscando mejor puntuación:', { userId, level });

    const { data, error } = await supabase
      .from('beer_run_scores')
      .select('score, beers_collected, time_seconds')
      .eq('user_id', userId)
      .eq('level', level)
      .order('score', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ [Supabase] Error obteniendo mejor puntuación:', error);
      return { success: false, error };
    }

    // data es un array, tomar el primer elemento si existe
    const bestScore = data && data.length > 0 ? data[0] : null;
    console.log('✅ [Supabase] Mejor puntuación obtenida:', bestScore);

    return { success: true, data: bestScore };
  } catch (error) {
    console.error('❌ [Supabase] Error en getUserBestScore:', error);
    return { success: false, error };
  }
}
