import { supabase } from './supabaseClient';

/** Get debate state for a match (null if none or table missing). */
export async function getDebateState(matchId: string) {
  const { data, error } = await supabase
    .from('debate_state')
    .select('*')
    .eq('match_id', matchId)
    .maybeSingle();
  if (error) return { data: null, error };
  return { data, error: null };
}

/** Update or create debate state. Works without UNIQUE on match_id. */
export async function upsertDebateState(matchId: string, phase: string, time_left: number, running: boolean) {
  const { data: existing } = await supabase
    .from('debate_state')
    .select('id')
    .eq('match_id', matchId)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from('debate_state')
      .update({ phase, time_left, running })
      .eq('id', existing.id)
      .select()
      .maybeSingle();
    return { data, error };
  }

  const { data, error } = await supabase
    .from('debate_state')
    .insert({ match_id: matchId, phase, time_left, running })
    .select()
    .maybeSingle();
  return { data, error };
}

export function subscribeDebateState(matchId: string, onChange: (state: any) => void) {
  return supabase
    .channel('debate-state-' + matchId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'debate_state', filter: `match_id=eq.${matchId}` }, (payload) => {
      if (payload.new) onChange(payload.new);
    })
    .subscribe();
}
