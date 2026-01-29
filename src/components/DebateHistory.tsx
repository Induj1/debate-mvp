"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface DebateHistoryItem {
  id: string;
  topic: string;
  side: string;
  created_at: string;
  result?: string;
}

export default function DebateHistory() {
  const { user } = useAuth();
  const [debates, setDebates] = useState<DebateHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      if (!user) {
        setDebates([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("match_queue")
        .select("id, topic, side, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setDebates(data);
      setLoading(false);
    }
    fetchHistory();
  }, [user]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Debate History</CardTitle>
      </CardHeader>
      <CardContent>
        {!user ? (
          <p className="text-center text-muted-foreground py-4">
            Sign in to view your debate history.
          </p>
        ) : loading ? (
          <div className="text-center text-muted-foreground py-4">Loading...</div>
        ) : debates.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No debates yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {debates.map((debate) => (
              <li key={debate.id} className="py-3">
                <div className="font-semibold">{debate.topic}</div>
                <div className="text-sm text-muted-foreground">
                  {debate.side ? `Side: ${debate.side} · ` : ""}
                  {new Date(debate.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
