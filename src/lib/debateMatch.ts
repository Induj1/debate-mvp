import { supabase } from '@/lib/supabaseClient';

export type MatchResult = { match_id: string; topic: string } | null;

/**
 * Request a debate: pairs with one waiting user if any, otherwise joins the queue.
 * Returns match_id + topic when paired, null when waiting.
 */
export async function requestDebate(_userId: string): Promise<{ data: MatchResult; error: Error | null }> {
  const { data: rpcData, error } = await supabase.rpc('match_with_waiting_user');

  if (error) {
    return { data: null, error };
  }

  const matchId = rpcData?.match_id ?? null;
  const topic = rpcData?.topic ?? null;

  if (rpcData?.error) {
    return { data: null, error: new Error(String(rpcData.error)) };
  }

  if (matchId && topic) {
    return { data: { match_id: matchId, topic }, error: null };
  }

  return { data: null, error: null };
}

// Listen for a match assignment
export function listenForMatch(userId: string, onMatch: (match: any) => void) {
  return supabase
    .channel('debate-matches')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'match_queue', filter: `user_id=eq.${userId}` },
      (payload) => {
        if (payload.new.status === 'matched') {
          onMatch(payload.new);
        }
      }
    )
    .subscribe();
}

// Assign a topic and sides (to be run by backend/admin)
export async function assignDebate(matchId: string, topic: string) {
  // Update the match_queue row with topic and sides
  const { data, error } = await supabase
    .from('match_queue')
    .update({ status: 'matched', topic })
    .eq('id', matchId)
    .select();
  return { data, error };
}
