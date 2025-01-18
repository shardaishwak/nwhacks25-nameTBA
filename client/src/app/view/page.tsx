"use client";

// pages/receiver.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function Receiver() {
	const videoRef = useRef(null);
	const peerConnectionRef = useRef(null);
	const socketRef = useRef(null);

	useEffect(() => {
		if (typeof window === "undefined") return; // Ensure client-side

		const configuration = {
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		};
		peerConnectionRef.current = new RTCPeerConnection(configuration);

		// Connect to the Socket.IO server
		socketRef.current = io("http://localhost:5001", {
			transports: ["websocket"],
		});

		// Handle signaling messages from the server (offer, ICE candidates)
		socketRef.current.on("signal", async ({ from, signal }) => {
			if (signal.type === "offer") {
				console.log("Receiver got offer from Sender");
				// Set remote description to the Sender's offer
				await peerConnectionRef.current.setRemoteDescription(
					new RTCSessionDescription(signal)
				);
				// Create and send an answer
				const answer = await peerConnectionRef.current.createAnswer();
				await peerConnectionRef.current.setLocalDescription(answer);
				console.log("Receiver sending answer to Sender");
				socketRef.current.emit("signal", {
					to: from, // The Sender's socket.id
					signal: answer,
				});
			} else if (signal.candidate) {
				console.log("Receiver adding ICE candidate from Sender");
				await peerConnectionRef.current.addIceCandidate(
					new RTCIceCandidate(signal)
				);
			}
		});

		// Send ICE candidates back to the Sender
		peerConnectionRef.current.onicecandidate = (event) => {
			if (event.candidate) {
				console.log("Receiver sending ICE candidate");
				socketRef.current.emit("signal", {
					to: "nuSieVGmF8tp5EMwAAAL", // Replace with actual sender's socket.id
					signal: event.candidate,
				});
			}
		};

		// When a track is received, display it in the video element
		peerConnectionRef.current.ontrack = (event) => {
			console.log("Receiver got track from Sender");
			videoRef.current.srcObject = event.streams[0];
		};

		// Cleanup on unmount
		return () => {
			if (socketRef.current) socketRef.current.disconnect();
			if (peerConnectionRef.current) peerConnectionRef.current.close();
		};
	}, []);

	return (
		<div>
			<h1>Receiver</h1>
			<video ref={videoRef} autoPlay controls style={{ width: "100%" }} />
		</div>
	);
}
