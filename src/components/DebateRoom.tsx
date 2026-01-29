
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

import FeedbackPanel from "./FeedbackPanel";
import ReportButton from "./ReportButton";
import DebateTimer from "./DebateTimer";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import VideoCall from "./VideoCall";

export default function DebateRoom({ topic, matchId }: { topic: string; matchId: string }) {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  const handleDebateEnd = () => {
    setFeedback(
      `Speaker A:\n- Strong arguments, clear delivery.\n- Missed one rebuttal opportunity.\n\nSpeaker B:\n- Good use of evidence.\n- Some logical fallacies detected.\n\nWinner: Speaker A (clearer structure)`
    );
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Debate Room</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-center">
            <span className="font-semibold">Topic:</span> {topic}
          </div>
          <div className="mb-6">
            {user ? (
              <VideoCall matchId={matchId} userId={user.id} />
            ) : (
              <div className="w-full h-48 rounded-lg bg-muted border border-border flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Sign in to join the call.</p>
              </div>
            )}
          </div>
          <DebateTimer matchId={matchId} onFinish={handleDebateEnd} />
          <FeedbackPanel feedback={feedback} />
          <div className="mt-4 flex justify-end">
            <ReportButton onReport={() => setReported(true)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
