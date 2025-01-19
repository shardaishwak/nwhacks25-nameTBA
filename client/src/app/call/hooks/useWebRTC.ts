import { useEffect, useRef, RefObject, useState } from 'react';
import { Socket } from 'socket.io-client';

interface SignalData {
  type: RTCSdpType;  // 'offer' | 'answer' | 'pranswer' | 'rollback'
  sdp?: string;
  candidate?: RTCIceCandidate;
}

interface SignalEvent {
  from: string;
  data: SignalData;
}

interface UseWebRTCParams {
  roomId: string;
  socketRef: React.MutableRefObject<Socket | null>;
  localVideoRef: RefObject<HTMLVideoElement>;
  remoteVideoRef: RefObject<HTMLVideoElement>;
}

interface UseWebRTCResult {
  peerConnectionRef: React.MutableRefObject<RTCPeerConnection | null>;
  remoteStreamExists: boolean;
}

export default function useWebRTC({
  roomId,
  socketRef,
  localVideoRef,
  remoteVideoRef,
}: UseWebRTCParams): UseWebRTCResult {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [remoteStreamExists, setRemoteStreamExists] = useState(false);

  /**
   * 1) Create PeerConnection, getUserMedia, attach tracks, etc.
   */
  useEffect(() => {
    if (!roomId) return;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
    peerConnectionRef.current = pc;

    // When remote track is received, attach to remote <video> element
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteStreamExists(true);
      }
    };

    // When ICE candidates are found, send them via Socket.IO
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal', {
          roomId,
          data: { candidate: event.candidate },
        });
      }
    };

    // Get local media (audio + video)
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      })
      .then((stream) => {
        // Attach local stream to <video> so we can see ourselves
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add each track to the PeerConnection
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      })
      .catch((error) => {
        console.error('getUserMedia error:', error);
      });

    // Cleanup the PeerConnection on unmount
    return () => {
      pc.close();
      peerConnectionRef.current = null;
    };
  }, [roomId, socketRef, localVideoRef, remoteVideoRef]);

  /**
   * 2) Listen for Socket.IO "signal" and "peer-joined" messages
   */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleSignal = async ({ data }: SignalEvent) => {
      const pc = peerConnectionRef.current;
      if (!pc || !socket) return;

      try {
        if (data.type === 'offer') {
          // Received offer -> setRemoteDesc -> create answer -> send answer
          await pc.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('signal', { roomId, data: answer });
        } else if (data.type === 'answer') {
          // Received answer -> setRemoteDesc
          await pc.setRemoteDescription(new RTCSessionDescription(data));
        } else if (data.candidate) {
          // Received ICE candidate
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error('Error handling signal:', err);
      }
    };

    // If a peer joins the room, optionally create an offer if our ID is "lower"
    const handlePeerJoined = async (newPeerId: string) => {
      if (!socket.id) return;
      if (socket.id < newPeerId) {
        await createOffer();
      }
    };

    // Helper: create an offer
    const createOffer = async () => {
      const pc = peerConnectionRef.current;
      if (!pc || !socket) return;

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      socket.emit('signal', { roomId, data: offer });
    };

    socket.on('signal', handleSignal);
    socket.on('peer-joined', handlePeerJoined);

    // Cleanup event handlers
    return () => {
      if (socket) {
        socket.off('signal', handleSignal);
        socket.off('peer-joined', handlePeerJoined);
      }
    };
  }, [roomId, socketRef]);

  return {
    peerConnectionRef,
    remoteStreamExists,
  };
}
