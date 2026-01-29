"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type SignalMessage =
  | { type: "join"; from: string }
  | { type: "offer"; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; from: string; candidate: RTCIceCandidateInit };

function getMediaErrorMessage(e: unknown): string {
  if (e instanceof DOMException) {
    switch (e.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "Camera or microphone was blocked. Click the lock/camera icon in the address bar and allow access, then try again.";
      case "NotFoundError":
        return "No camera or microphone found. Connect a device and try again.";
      case "NotReadableError":
        return "Camera or microphone is in use. Click Done on the browser pop-up if it’s open, then click Try again. Or close other apps using the camera.";
      case "OverconstrainedError":
        return "Your device doesn't support the requested camera or microphone settings.";
      default:
        return e.message || "Could not access camera or microphone.";
    }
  }
  return e instanceof Error ? e.message : "Could not access camera or microphone.";
}

export function useWebRTC(matchId: string, userId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">(
    "connecting"
  );
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const otherUserIdRef = useRef<string | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const retry = useCallback(() => {
    setError(null);
    setStatus("connecting");
    setRetryCount((c) => c + 1);
  }, []);

  const sendSignal = useCallback(
    (msg: SignalMessage) => {
      const ch = channelRef.current;
      if (!ch) return;
      ch.send({
        type: "broadcast",
        event: "webrtc",
        payload: msg,
      });
    },
    []
  );

  useEffect(() => {
    if (!matchId || !userId) return;

    let cancelled = false;
    let pc: RTCPeerConnection | null = null;
    let delayId: ReturnType<typeof setTimeout> | null = null;
    const channelName = `webrtc-${matchId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channelRef.current = channel;

    async function start() {
      try {
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
          setError(
            "Camera and microphone require HTTPS or localhost. They are not available in this context."
          );
          setStatus("error");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        pc = new RTCPeerConnection({
          iceServers: STUN_SERVERS,
        });
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc!.addTrack(track, stream));

        pc.ontrack = (e) => {
          if (cancelled) return;
          setRemoteStream(e.streams[0]);
          setStatus("connected");
        };

        pc.oniceconnectionstatechange = () => {
          if (cancelled || !pc) return;
          if (pc.iceConnectionState === "connected") setStatus("connected");
          else if (
            pc.iceConnectionState === "disconnected" ||
            pc.iceConnectionState === "failed" ||
            pc.iceConnectionState === "closed"
          )
            setStatus("disconnected");
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            const json = e.candidate.toJSON();
            sendSignal({ type: "ice", from: userId, candidate: json });
          }
        };

        /** Serialize SDP to plain JSON so Supabase broadcast accepts it (avoids 400). */
        function toPlainSdp(sdp: RTCSessionDescriptionInit): { type: RTCSdpType; sdp: string } {
          return { type: sdp.type as RTCSdpType, sdp: sdp.sdp || "" };
        }

        async function createOffer() {
          if (!pc) return;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal({ type: "offer", from: userId, sdp: toPlainSdp(offer) });
        }

        async function handleOffer(sdp: RTCSessionDescriptionInit) {
          if (!pc) return;
          const peer = pc;
          await peer.setRemoteDescription(new RTCSessionDescription(sdp));
          pendingCandidatesRef.current.forEach((c) => peer.addIceCandidate(new RTCIceCandidate(c)));
          pendingCandidatesRef.current = [];
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          sendSignal({ type: "answer", from: userId, sdp: toPlainSdp(answer) });
        }

        channel
          .on("broadcast", { event: "webrtc" }, (payload) => {
            const msg = payload.payload as SignalMessage;
            if (msg.from === userId) return;

            if (msg.type === "join") {
              otherUserIdRef.current = msg.from;
              const isOfferer = userId < msg.from;
              if (isOfferer) {
                createOffer();
              }
            } else if (msg.type === "offer") {
              handleOffer(msg.sdp);
            } else if (msg.type === "answer") {
              pc?.setRemoteDescription(new RTCSessionDescription(msg.sdp)).then(() => {
                pendingCandidatesRef.current.forEach((c) =>
                  pc?.addIceCandidate(new RTCIceCandidate(c))
                );
                pendingCandidatesRef.current = [];
              });
            } else if (msg.type === "ice") {
              const candidate = new RTCIceCandidate(msg.candidate);
              if (pc?.remoteDescription) {
                pc.addIceCandidate(candidate);
              } else {
                pendingCandidatesRef.current.push(msg.candidate);
              }
            }
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              sendSignal({ type: "join", from: userId });
            }
          });
      } catch (e) {
        if (!cancelled) {
          setError(getMediaErrorMessage(e));
          setStatus("error");
        }
      }
    }

    // On retry, wait for previous stream to release the device before requesting again
    if (retryCount > 0) {
      delayId = setTimeout(() => {
        delayId = null;
        if (!cancelled) start();
      }, 600);
    } else {
      start();
    }

    return () => {
      cancelled = true;
      if (delayId) clearTimeout(delayId);
      channel.unsubscribe();
      channelRef.current = null;
      otherUserIdRef.current = null;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
      if (pc) {
        pc.close();
        pcRef.current = null;
      }
      setStatus("disconnected");
    };
  }, [matchId, userId, sendSignal, retryCount]);

  return { localStream, remoteStream, status, error, retry };
}
