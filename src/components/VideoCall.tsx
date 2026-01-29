"use client";

import { useRef, useEffect } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";

/**
 * WebRTC video call: peer-to-peer audio/video using Supabase Realtime for signaling.
 * No third-party video service or API key required.
 */
export default function VideoCall({
  matchId,
  userId,
}: {
  matchId: string;
  userId: string;
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { localStream, remoteStream, status, error, retry } = useWebRTC(matchId, userId);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    const video = remoteVideoRef.current;
    if (!video || !remoteStream) return;
    video.srcObject = remoteStream;
    video.muted = false;
    video.play().catch(() => {});
  }, [remoteStream]);

  if (error) {
    return (
      <div className="w-full h-48 md:h-64 rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center">
        <div className="text-center px-4 py-6 max-w-sm">
          <p className="font-medium text-foreground mb-1">Video unavailable</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-3">
            In the address bar, click the lock or camera icon and set Camera and Microphone to
            Allow, then click Try again.
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden bg-black border border-border">
      <div className="aspect-video relative">
        {/* Remote (opponent) video - full area */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted={false}
          className="absolute inset-0 w-full h-full object-cover bg-black"
          title="Opponent"
        />
        {/* Local (you) video - picture-in-picture */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-2 right-2 w-32 h-24 md:w-40 md:h-28 object-cover rounded-lg border-2 border-white shadow-lg bg-muted"
          title="You"
        />
        {/* Status overlay when not yet connected */}
        {status === "connecting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="text-white text-sm">Connecting… Waiting for opponent.</p>
          </div>
        )}
        {status === "disconnected" && remoteStream === null && localStream !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="text-white text-sm">Waiting for opponent to join.</p>
          </div>
        )}
        {status === "connected" && remoteStream && remoteStream.getVideoTracks().length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="text-white text-sm">Opponent’s camera is off.</p>
          </div>
        )}
      </div>
    </div>
  );
}
