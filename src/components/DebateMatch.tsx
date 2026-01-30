
"use client";

import { useEffect, useState } from "react";
import { requestDebate, listenForMatch } from "@/lib/debateMatch";
import { useAuth } from "@/lib/AuthContext";
import DebateRoom from "./DebateRoom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";

export default function DebateMatch() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "waiting" | "matched">("idle");
  const [topic, setTopic] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || status !== "waiting") return;
    const sub = listenForMatch(user.id, (match) => {
      setStatus("matched");
      setTopic(match.topic);
      setMatchId(match.match_id || match.id);
    });
    return () => {
      sub.unsubscribe();
    };
  }, [user, status]);

  useEffect(() => {
    if (!user || status !== "waiting") return;
    const retryCount = 5;
    const intervalMs = 2200;
    let attempts = 0;
    const t = setInterval(async () => {
      attempts += 1;
      if (attempts > retryCount) return;
      const { data, error: err } = await requestDebate(user.id);
      if (err) return;
      if (data?.match_id && data?.topic) {
        setStatus("matched");
        setMatchId(data.match_id);
        setTopic(data.topic);
      }
    }, intervalMs);
    return () => clearInterval(t);
  }, [user, status]);

  const handleStart = async () => {
    setError("");
    if (!user) {
      setError("You must be signed in.");
      return;
    }
    setStatus("waiting");
    const { data, error: reqError } = await requestDebate(user.id);
    if (reqError) {
      setError(reqError.message);
      setStatus("idle");
      return;
    }
    if (data?.match_id && data?.topic) {
      setStatus("matched");
      setMatchId(data.match_id);
      setTopic(data.topic);
      return;
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Start a debate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Sign in above to join the lobby and get matched with an opponent.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === "matched" && topic && matchId) {
    return <DebateRoom topic={topic} matchId={matchId} />;
  }
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle>Debate Lobby</CardTitle>
      </CardHeader>
      <CardContent>
        {status === "idle" && (
          <Button onClick={handleStart} className="w-full">
            Start Debate
          </Button>
        )}
        {status === "waiting" && (
          <div className="flex flex-col items-center gap-2">
            <Spinner className="mx-auto" />
            <span className="text-muted-foreground">Waiting for an opponent...</span>
          </div>
        )}
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </CardContent>
    </Card>
  );
}
