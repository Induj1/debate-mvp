"use client";


import { useEffect, useRef, useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { getDebateState, upsertDebateState, subscribeDebateState } from '@/lib/debateState';

const PHASES = [
  { phase: 'opening1', label: 'Opening Statement (Speaker 1)', duration: 120 },
  { phase: 'opening2', label: 'Opening Statement (Speaker 2)', duration: 120 },
  { phase: 'rebuttal1', label: 'Rebuttal (Speaker 1)', duration: 60 },
  { phase: 'rebuttal2', label: 'Rebuttal (Speaker 2)', duration: 60 },
  { phase: 'closing1', label: 'Closing (Speaker 1)', duration: 60 },
  { phase: 'closing2', label: 'Closing (Speaker 2)', duration: 60 },
];


export default function DebateTimer({ matchId, onFinish }: { matchId: string, onFinish?: () => void }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PHASES[0].duration);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time sync: fetch initial state and subscribe (ignore errors if table missing)
  useEffect(() => {
    if (!matchId) return;
    let ignore = false;
    getDebateState(matchId)
      .then(({ data }) => {
        if (data && !ignore) {
          const idx = PHASES.findIndex(p => p.phase === data.phase);
          if (idx !== -1) setPhaseIndex(idx);
          setTimeLeft(data.time_left);
          setRunning(data.running);
        }
      })
      .catch(() => { /* table may not exist */ });
    const sub = subscribeDebateState(matchId, (state) => {
      const idx = PHASES.findIndex(p => p.phase === state.phase);
      if (idx !== -1) setPhaseIndex(idx);
      setTimeLeft(state.time_left);
      setRunning(state.running);
    });
    return () => { ignore = true; sub.unsubscribe(); };
  }, [matchId]);

  useEffect(() => {
    if (running && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(t => t - 1);
        upsertDebateState(matchId, PHASES[phaseIndex].phase, timeLeft - 1, true);
      }, 1000);
    } else if (running && timeLeft === 0) {
      if (phaseIndex < PHASES.length - 1) {
        setPhaseIndex(i => i + 1);
        setTimeLeft(PHASES[phaseIndex + 1].duration);
        upsertDebateState(matchId, PHASES[phaseIndex + 1].phase, PHASES[phaseIndex + 1].duration, true);
      } else {
        setRunning(false);
        upsertDebateState(matchId, PHASES[phaseIndex].phase, 0, false);
        if (onFinish) onFinish();
      }
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [running, timeLeft, phaseIndex, onFinish, matchId]);

  const start = () => {
    setRunning(true);
    upsertDebateState(matchId, PHASES[phaseIndex].phase, timeLeft, true);
  };
  const pause = () => {
    setRunning(false);
    upsertDebateState(matchId, PHASES[phaseIndex].phase, timeLeft, false);
  };
  const reset = () => {
    setRunning(false);
    setPhaseIndex(0);
    setTimeLeft(PHASES[0].duration);
    upsertDebateState(matchId, PHASES[0].phase, PHASES[0].duration, false);
  };

  const current = PHASES[phaseIndex];

  return (
    <Card className="my-6 text-center">
      <CardHeader>
        <CardTitle className="text-lg font-bold">{current.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-mono mb-4">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
        <div className="flex gap-2 justify-center mb-2">
          {!running && <Button onClick={start}>Start</Button>}
          {running && <Button variant="secondary" onClick={pause}>Pause</Button>}
          <Button variant="outline" onClick={reset}>Reset</Button>
        </div>
        <div className="mt-2 text-sm text-gray-500">Phase {phaseIndex + 1} of {PHASES.length}</div>
      </CardContent>
    </Card>
  );
}
