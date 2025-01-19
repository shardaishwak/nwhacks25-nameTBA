/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";
import {
	HandLandmarker,
	FaceLandmarker,
	FilesetResolver,
} from "@mediapipe/tasks-vision";

interface FaceLandmark {
	x: number;
	y: number;
}

interface HandLandmark {
	x: number;
	y: number;
	z: number;
}

interface DetectionResults {
	faceLandmarks: FaceLandmark[][];
}

interface HandDetectionResults {
	landmarks: HandLandmark[][];
}

export default function RoomPage() {
	const { roomId } = useParams() as { roomId: string };

	const socketRef = useRef<any>(null);
	const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

	// Video refs
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);

	// Canvas refs for local face & hand
	const localFaceCanvasRef = useRef<HTMLCanvasElement>(null);
	const localHandCanvasRef = useRef<HTMLCanvasElement>(null);

	// Canvas refs for remote face & hand
	const remoteFaceCanvasRef = useRef<HTMLCanvasElement>(null);
	const remoteHandCanvasRef = useRef<HTMLCanvasElement>(null);

	// State for the Mediapipe landmarker instances
	const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(
		null
	);
	const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(
		null
	);

	// Canvas contexts for local face & hand
	const [localFaceCtx, setLocalFaceCtx] =
		useState<CanvasRenderingContext2D | null>(null);
	const [localHandCtx, setLocalHandCtx] =
		useState<CanvasRenderingContext2D | null>(null);

	// Canvas contexts for remote face & hand
	const [remoteFaceCtx, setRemoteFaceCtx] =
		useState<CanvasRenderingContext2D | null>(null);
	const [remoteHandCtx, setRemoteHandCtx] =
		useState<CanvasRenderingContext2D | null>(null);

	// Track if we have a remote stream
	const [remoteStreamExists, setRemoteStreamExists] = useState(false);

	// 1) Initialize Mediapipe tasks & canvas contexts
	useEffect(() => {
		const initializeLandmarkers = async () => {
			const filesetResolver = await FilesetResolver.forVisionTasks(
				"/models/wasm"
			);

			const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(
				filesetResolver,
				{
					baseOptions: {
						modelAssetPath: "/models/face_landmarker.task",
						delegate: "GPU",
					},
					outputFaceBlendshapes: true,
					runningMode: "VIDEO",
					numFaces: 5,
				}
			);

			const handLandmarkerInstance = await HandLandmarker.createFromOptions(
				filesetResolver,
				{
					baseOptions: {
						modelAssetPath: "/models/hand_landmarker.task",
						delegate: "GPU",
					},
					runningMode: "VIDEO",
					numHands: 4,
				}
			);

			setFaceLandmarker(faceLandmarkerInstance);
			setHandLandmarker(handLandmarkerInstance);

			// Set canvas contexts
			if (localFaceCanvasRef.current) {
				const ctx = localFaceCanvasRef.current.getContext("2d");
				if (ctx) {
					ctx.globalAlpha = 0.9;
					setLocalFaceCtx(ctx);
				}
			}
			if (localHandCanvasRef.current) {
				const ctx = localHandCanvasRef.current.getContext("2d");
				if (ctx) {
					ctx.globalAlpha = 0.9;
					setLocalHandCtx(ctx);
				}
			}
			if (remoteFaceCanvasRef.current) {
				const ctx = remoteFaceCanvasRef.current.getContext("2d");
				if (ctx) {
					ctx.globalAlpha = 0.9;
					setRemoteFaceCtx(ctx);
				}
			}
			if (remoteHandCanvasRef.current) {
				const ctx = remoteHandCanvasRef.current.getContext("2d");
				if (ctx) {
					ctx.globalAlpha = 0.9;
					setRemoteHandCtx(ctx);
				}
			}
		};

		initializeLandmarkers();
	}, []);

	// 2) Per-frame detection
	useEffect(() => {
		let animationFrameId: number;

		const animate = async () => {
			if (!faceLandmarker || !handLandmarker) {
				animationFrameId = requestAnimationFrame(animate);
				return;
			}

			// --- Detect and draw for LOCAL video ---
			if (
				localVideoRef.current &&
				!localVideoRef.current.paused &&
				!localVideoRef.current.ended
			) {
				const video = localVideoRef.current;
				const timestamp = performance.now();

				const faceResults = faceLandmarker.detectForVideo(
					video,
					timestamp
				) as DetectionResults;
				const handResults = handLandmarker.detectForVideo(
					video,
					timestamp
				) as HandDetectionResults;

				// Draw face landmarks on localFaceCanvas
				if (localFaceCtx && localFaceCanvasRef.current) {
					const faceCanvas = localFaceCanvasRef.current;
					localFaceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

					if (faceResults?.faceLandmarks) {
						faceResults.faceLandmarks.forEach((landmarks) => {
							landmarks.forEach((lm) => {
								localFaceCtx.beginPath();
								localFaceCtx.arc(
									lm.x * faceCanvas.width,
									lm.y * faceCanvas.height,
									2,
									0,
									Math.PI * 2
								);
								localFaceCtx.fillStyle = "#FFFFFF";
								localFaceCtx.fill();
							});
						});
					}
				}

				// Draw hand landmarks on localHandCanvas
				if (localHandCtx && localHandCanvasRef.current) {
					const handCanvas = localHandCanvasRef.current;
					localHandCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);

					if (handResults?.landmarks) {
						handResults.landmarks.forEach((landmarks) => {
							landmarks.forEach((lm) => {
								localHandCtx.beginPath();
								localHandCtx.arc(
									lm.x * handCanvas.width,
									lm.y * handCanvas.height,
									3,
									0,
									Math.PI * 2
								);
								localHandCtx.fillStyle = "#00FF00";
								localHandCtx.fill();
							});
						});
					}
				}
			}

			// --- Detect and draw for REMOTE video ---
			if (
				remoteStreamExists &&
				remoteVideoRef.current &&
				!remoteVideoRef.current.paused &&
				!remoteVideoRef.current.ended
			) {
				const video = remoteVideoRef.current;
				const timestamp = performance.now();

				const faceResults = faceLandmarker.detectForVideo(
					video,
					timestamp
				) as DetectionResults;
				const handResults = handLandmarker.detectForVideo(
					video,
					timestamp
				) as HandDetectionResults;

				// Draw face on remoteFaceCanvas
				if (remoteFaceCtx && remoteFaceCanvasRef.current) {
					const faceCanvas = remoteFaceCanvasRef.current;
					remoteFaceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

					if (faceResults?.faceLandmarks) {
						faceResults.faceLandmarks.forEach((landmarks) => {
							landmarks.forEach((lm) => {
								remoteFaceCtx.beginPath();
								remoteFaceCtx.arc(
									lm.x * faceCanvas.width,
									lm.y * faceCanvas.height,
									2,
									0,
									Math.PI * 2
								);
								remoteFaceCtx.fillStyle = "#FFFFFF";
								remoteFaceCtx.fill();
							});
						});
					}
				}

				// Draw hand on remoteHandCanvas
				if (remoteHandCtx && remoteHandCanvasRef.current) {
					const handCanvas = remoteHandCanvasRef.current;
					remoteHandCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);

					if (handResults?.landmarks) {
						handResults.landmarks.forEach((landmarks) => {
							landmarks.forEach((lm) => {
								remoteHandCtx.beginPath();
								remoteHandCtx.arc(
									lm.x * handCanvas.width,
									lm.y * handCanvas.height,
									3,
									0,
									Math.PI * 2
								);
								remoteHandCtx.fillStyle = "#00FF00";
								remoteHandCtx.fill();
							});
						});
					}
				}
			}

			animationFrameId = requestAnimationFrame(animate);
		};

		animate();

		return () => {
			if (animationFrameId) cancelAnimationFrame(animationFrameId);
		};
	}, [faceLandmarker, handLandmarker, remoteStreamExists]);

	// 3) WebRTC + Socket.IO logic
	useEffect(() => {
		if (!roomId) return;

		// 1) Connect to Socket.IO
		socketRef.current = io("https://nwhacks25-nametba.onrender.com", {
			transports: ["websocket"],
		});

		// 2) Create RTCPeerConnection
		const configuration: RTCConfiguration = {
			iceServers: [
				{ urls: "stun:stun.l.google.com:19302" },
				{ urls: "stun:stun1.l.google.com:19302" },
			],
		};
		const pc = new RTCPeerConnection(configuration);
		peerConnectionRef.current = pc;

		// 3) Socket events
		socketRef.current.on("connect", () => {
			console.log("Connected to signaling server:", socketRef.current.id);
			socketRef.current.emit("join-room", roomId);
		});

		// 4) Handle remote track
		pc.ontrack = (event) => {
			console.log("Got remote track:", event.streams[0]);
			if (remoteVideoRef.current && event.streams[0]) {
				remoteVideoRef.current.srcObject = event.streams[0];
				setRemoteStreamExists(true);
			}
		};

		// 5) ICE candidates
		pc.onicecandidate = (event) => {
			if (event.candidate) {
				socketRef.current.emit("signal", {
					roomId,
					data: { candidate: event.candidate },
				});
			}
		};

		pc.onconnectionstatechange = () => {
			console.log("Connection state:", pc.connectionState);
		};

		pc.oniceconnectionstatechange = () => {
			console.log("ICE connection state:", pc.iceConnectionState);
		};

		// 6) Get local stream
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
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
				}
				stream.getTracks().forEach((track) => {
					pc.addTrack(track, stream);
				});
			})
			.catch((err) => console.error("getUserMedia error:", err));

		// 7) Peer joined
		socketRef.current.on("peer-joined", async (newPeerId: string) => {
			console.log("Peer joined:", newPeerId);
			if (socketRef.current.id < newPeerId) {
				try {
					await createOffer();
				} catch (err) {
					console.error("Error creating offer:", err);
				}
			}
		});

		// 8) Signaling
		socketRef.current.on("signal", async ({ from, data }: any) => {
			try {
				if (data.type === "offer") {
					console.log("Received offer, creating answer");
					await pc.setRemoteDescription(new RTCSessionDescription(data));
					const answer = await pc.createAnswer();
					await pc.setLocalDescription(answer);
					socketRef.current.emit("signal", { roomId, data: answer });
				} else if (data.type === "answer") {
					console.log("Received answer");
					await pc.setRemoteDescription(new RTCSessionDescription(data));
				} else if (data.candidate) {
					console.log("Received ICE candidate");
					await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
				}
			} catch (err) {
				console.error("Error handling signal:", err);
			}
		});

		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
			if (peerConnectionRef.current) {
				peerConnectionRef.current.close();
			}
		};
	}, [roomId]);

	async function createOffer() {
		try {
			const pc = peerConnectionRef.current;
			if (!pc) return;
			console.log("Creating offer");
			const offer = await pc.createOffer({
				offerToReceiveAudio: true,
				offerToReceiveVideo: true,
			});
			await pc.setLocalDescription(offer);
			socketRef.current.emit("signal", {
				roomId,
				data: offer,
			});
		} catch (err) {
			console.error("Error creating offer:", err);
		}
	}

	// 4) JSX layout with separate canvas elements
	return (
		<div className="grid grid-cols-2 gap-4 p-4 h-screen bg-gray-800">
			{/* -------- LOCAL VIDEO + Face & Hand Canvas -------- */}
			<div className="relative w-[640px] h-[480px] mx-auto">
				<video
					ref={localVideoRef}
					muted
					autoPlay
					playsInline
					className="w-full h-full object-cover bg-gray-900 rounded-lg"
				/>

				{/* Local Face Canvas */}
				<canvas
					ref={localFaceCanvasRef}
					width={640}
					height={480}
					className="absolute top-0 left-0 w-full h-full rounded-lg pointer-events-none"
				/>

				{/* Local Hand Canvas */}
				<canvas
					ref={remoteHandCanvasRef}
					width={640}
					height={480}
					className="absolute top-0 left-0 w-full h-full rounded-lg pointer-events-none"
				/>
			</div>

			{/* -------- REMOTE VIDEO + Face & Hand Canvas -------- */}
			<div className="relative w-[640px] h-[480px] mx-auto">
				<video
					ref={remoteVideoRef}
					autoPlay
					playsInline
					className="w-full h-full object-cover bg-gray-900 rounded-lg"
				/>

				{/* Remote Face Canvas */}
				<canvas
					ref={remoteFaceCanvasRef}
					width={640}
					height={480}
					className="absolute top-0 left-0 w-full h-full rounded-lg pointer-events-none"
				/>

				{/* Remote Hand Canvas */}
				<canvas
					ref={localHandCanvasRef}
					width={640}
					height={480}
					className="absolute top-0 left-0 w-full h-full rounded-lg pointer-events-none"
				/>
			</div>
		</div>
	);
}
