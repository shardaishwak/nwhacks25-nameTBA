"use client"; // Ensure this file is treated as a Client Component

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";

export default function RoomPage() {
	// `useParams` is provided by Next.js 13+ for reading dynamic route segments
	const { roomId } = useParams() as { roomId: string };

	const socketRef = useRef<any>(null);
	const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

	// Hidden local & remote <video> elements
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);

	// Canvas for merging
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Final merged <video>
	const mergedVideoRef = useRef<HTMLVideoElement>(null);

	// Track if we have a remote stream
	const [remoteStreamExists, setRemoteStreamExists] = useState(false);

	useEffect(() => {
		if (!roomId) return; // If the route param isn't ready, do nothing

		// 1) Connect to Socket.IO signaling server
		socketRef.current = io("https://nwhacks25-nametba.onrender.com", {
			transports: ["websocket"],
		});
		socketRef.current.on("connect", () => {
			console.log("Connected to signaling server:", socketRef.current.id);
			// Join the specified room
			socketRef.current.emit("join-room", roomId);
		});

		// 2) Create an RTCPeerConnection
		const configuration: RTCConfiguration = {
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		};
		const pc = new RTCPeerConnection(configuration);
		peerConnectionRef.current = pc;

		// ICE candidates -> socket
		pc.onicecandidate = (event) => {
			if (event.candidate) {
				socketRef.current.emit("signal", {
					roomId,
					data: { candidate: event.candidate },
				});
			}
		};

		// When remote tracks arrive
		pc.ontrack = (event) => {
			console.log("Got remote track:", event.streams[0]);
			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = event.streams[0];
			}
			setRemoteStreamExists(true);
		};

		// 3) If another peer joins, decide who offers
		socketRef.current.on("peer-joined", async (newPeerId: string) => {
			// Arbitrary logic: the smaller ID is the one to createOffer
			if (socketRef.current.id < newPeerId) {
				await createOffer();
			}
		});

		// 4) Handle incoming signals (offer, answer, candidates)
		socketRef.current.on("signal", async ({ from, data }: any) => {
			if (data.type === "offer") {
				// Set remote desc, create answer
				await pc.setRemoteDescription(new RTCSessionDescription(data));
				const answer = await pc.createAnswer();
				await pc.setLocalDescription(answer);
				socketRef.current.emit("signal", { roomId, data: answer });
			} else if (data.type === "answer") {
				await pc.setRemoteDescription(new RTCSessionDescription(data));
			} else if (data.candidate) {
				await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
			}
		});

		// 5) Capture local camera
		navigator.mediaDevices
			.getUserMedia({ video: true, audio: true })
			.then((stream) => {
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
				}
				stream.getTracks().forEach((track) => {
					pc.addTrack(track, stream);
				});
			})
			.catch((err) => console.error("getUserMedia error:", err));

		// Cleanup
		return () => {
			if (socketRef.current) socketRef.current.disconnect();
			if (peerConnectionRef.current) peerConnectionRef.current.close();
		};

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomId]);

	// Function to create an offer
	async function createOffer() {
		try {
			const pc = peerConnectionRef.current;
			if (!pc) return;
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);
			socketRef.current.emit("signal", {
				roomId,
				data: offer,
			});
		} catch (err) {
			console.error("Error creating offer:", err);
		}
	}

	// -----------------------
	// MERGING THE TWO FEEDS
	// -----------------------
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// We'll do 320x240 for each feed side by side
		canvas.width = 640;
		canvas.height = 240;

		const fps = 30;
		const interval = setInterval(() => {
			if (!localVideoRef.current || !remoteVideoRef.current) return;

			// Draw local left
			ctx.drawImage(localVideoRef.current, 0, 0, 320, 240);

			// Draw remote right (if available)
			if (remoteStreamExists) {
				ctx.drawImage(remoteVideoRef.current, 320, 0, 320, 240);
			}
		}, 1000 / fps);

		// Capture the canvas as a stream
		const mergedStream = canvas.captureStream(fps);
		if (mergedVideoRef.current) {
			mergedVideoRef.current.srcObject = mergedStream;
		}

		return () => clearInterval(interval);
	}, [remoteStreamExists]);

	return (
		<div style={{ padding: 20 }}>
			<h1>Room ID: {roomId}</h1>

			{/* Hidden local video */}
			<video
				ref={localVideoRef}
				muted
				autoPlay
				playsInline
				style={{ width: 0, height: 0 }}
			/>

			{/* Hidden remote video */}
			<video
				ref={remoteVideoRef}
				autoPlay
				playsInline
				style={{ width: 0, height: 0 }}
			/>

			{/* Hidden canvas for merging */}
			<canvas ref={canvasRef} style={{ display: "none" }} />

			<h2>Merged Video (Side by Side)</h2>
			<video
				ref={mergedVideoRef}
				autoPlay
				playsInline
				controls
				style={{ border: "1px solid black" }}
			/>
		</div>
	);
}
