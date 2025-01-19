/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"; // Ensure this file is treated as a Client Component

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";
import {
	HandLandmarker,
	FaceLandmarker,
	FilesetResolver,
} from '@mediapipe/tasks-vision';

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

	// New refs for landmark detection
	const localCanvasRef = useRef<HTMLCanvasElement>(null);
	const remoteCanvasRef = useRef<HTMLCanvasElement>(null);

	// State for landmark detection
	const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
	const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
	const [localCtx, setLocalCtx] = useState<CanvasRenderingContext2D | null>(null);
	const [remoteCtx, setRemoteCtx] = useState<CanvasRenderingContext2D | null>(null);

	// Track if we have a remote stream
	const [remoteStreamExists, setRemoteStreamExists] = useState(false);

	// Initialize landmarkers
	useEffect(() => {
		const initializeLandmarkers = async () => {
			const filesetResolver = await FilesetResolver.forVisionTasks('/models/wasm');
			
			const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
				baseOptions: {
					modelAssetPath: '/models/face_landmarker.task',
					delegate: 'GPU',
				},
				outputFaceBlendshapes: true,
				runningMode: 'VIDEO',
				numFaces: 5,
			});

			const handLandmarkerInstance = await HandLandmarker.createFromOptions(filesetResolver, {
				baseOptions: {
					modelAssetPath: '/models/hand_landmarker.task',
					delegate: 'GPU',
				},
				runningMode: 'VIDEO',
				numHands: 4,
			});

			setFaceLandmarker(faceLandmarkerInstance);
			setHandLandmarker(handLandmarkerInstance);

			// Initialize canvas contexts
			if (localCanvasRef.current) {
				const ctx = localCanvasRef.current.getContext('2d');
				if (ctx) {
					ctx.globalAlpha = 0.8;
					setLocalCtx(ctx);
				}
			}

			if (remoteCanvasRef.current) {
				const ctx = remoteCanvasRef.current.getContext('2d');
				if (ctx) {
					ctx.globalAlpha = 0.8;
					setRemoteCtx(ctx);
				}
			}
		};

		initializeLandmarkers();
	}, []);

	// Detection function
	const detectFeaturesInVideo = async (
		video: HTMLVideoElement,
		canvas: HTMLCanvasElement,
		context: CanvasRenderingContext2D
	) => {
		if (!video || !canvas || !context || video.paused || video.ended || !faceLandmarker || !handLandmarker) return;

		try {
			const timestamp = performance.now();

			// Detect faces
			const faceResults = faceLandmarker.detectForVideo(video, timestamp) as DetectionResults;
			
			// Detect hands
			const handResults = handLandmarker.detectForVideo(video, timestamp) as HandDetectionResults;

			// Clear canvas
			context.clearRect(0, 0, canvas.width, canvas.height);

			// Draw face landmarks
			if (faceResults?.faceLandmarks) {
				faceResults.faceLandmarks.forEach((landmarks) => {
					landmarks.forEach((landmark) => {
						context.beginPath();
						context.arc(
							landmark.x * canvas.width,
							landmark.y * canvas.height,
							2,
							0,
							Math.PI * 2
						);
						context.fillStyle = '#FFFFFF';
						context.fill();
					});
				});
			}

			// Draw hand landmarks
			if (handResults?.landmarks) {
				handResults.landmarks.forEach((landmarks) => {
					landmarks.forEach((landmark) => {
						context.beginPath();
						context.arc(
							landmark.x * canvas.width,
							landmark.y * canvas.height,
							3,
							0,
							Math.PI * 2
						);
						context.fillStyle = '#00FF00';
						context.fill();
					});
				});
			}
		} catch (error) {
			console.error('Error in detection:', error);
		}
	};

	// Animation frame handler
	useEffect(() => {
		let animationFrameId: number;

		const animate = async () => {
			// Detect for local video
			if (localVideoRef.current && localCanvasRef.current && localCtx) {
				await detectFeaturesInVideo(
					localVideoRef.current,
					localCanvasRef.current,
					localCtx
				);
			}

			// Detect for remote video
			if (remoteVideoRef.current && remoteCanvasRef.current && remoteCtx && remoteStreamExists) {
				await detectFeaturesInVideo(
					remoteVideoRef.current,
					remoteCanvasRef.current,
					remoteCtx
				);
			}

			animationFrameId = requestAnimationFrame(animate);
		};

		animate();

		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	}, [faceLandmarker, handLandmarker, localCtx, remoteCtx, remoteStreamExists]);

	useEffect(() => {
		if (!roomId) return;

		// 1) Connect to Socket.IO signaling server
		socketRef.current = io("https://nwhacks25-nametba.onrender.com", {
			transports: ["websocket"],
		});

		// 2) Create RTCPeerConnection first
		const configuration: RTCConfiguration = {
			iceServers: [
				{ urls: "stun:stun.l.google.com:19302" },
				{ urls: "stun:stun1.l.google.com:19302" },
			],
		};
		const pc = new RTCPeerConnection(configuration);
		peerConnectionRef.current = pc;

		// 3) Set up connection handlers
		socketRef.current.on("connect", () => {
			console.log("Connected to signaling server:", socketRef.current.id);
			socketRef.current.emit("join-room", roomId);
		});

		// 4) Handle remote tracks
		pc.ontrack = (event) => {
			console.log("Got remote track:", event.streams[0]);
			if (remoteVideoRef.current && event.streams[0]) {
				remoteVideoRef.current.srcObject = event.streams[0];
				setRemoteStreamExists(true);
			}
		};

		// 5) Handle ICE candidates
		pc.onicecandidate = (event) => {
			if (event.candidate) {
				socketRef.current.emit("signal", {
					roomId,
					data: { candidate: event.candidate },
				});
			}
		};

		// 6) Handle peer connection state changes
		pc.onconnectionstatechange = () => {
			console.log("Connection state:", pc.connectionState);
		};

		// 7) Handle ICE connection state changes
		pc.oniceconnectionstatechange = () => {
			console.log("ICE connection state:", pc.iceConnectionState);
		};

		// 8) Set up local stream first
		navigator.mediaDevices
			.getUserMedia({ video: true, audio: true })
			.then((stream) => {
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
				}
				// Add all tracks to the peer connection
				stream.getTracks().forEach((track) => {
					pc.addTrack(track, stream);
				});
			})
			.catch((err) => console.error("getUserMedia error:", err));

		// 9) Handle peer joining
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

		// 10) Handle signaling
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

		// Cleanup
		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
			if (peerConnectionRef.current) {
				peerConnectionRef.current.close();
			}
		};
	}, [roomId]);

	// Function to create an offer
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
		<div className="grid grid-cols-2 gap-4 p-4 h-screen bg-gray-800">
			{/* Local Video Container */}
			<div className="relative">
				<video
					ref={localVideoRef}
					muted
					autoPlay
					playsInline
					className="w-full h-full object-cover"
				/>
				<canvas
					ref={localCanvasRef}
					width={640}
					height={480}
					className="absolute top-0 left-0 w-full h-full"
				/>
			</div>

			{/* Remote Video Container */}
			<div className="relative">
				<video
					ref={remoteVideoRef}
					autoPlay
					playsInline
					className="w-full h-full object-cover"
				/>
				<canvas
					ref={remoteCanvasRef}
					width={640}
					height={480}
					className="absolute top-0 left-0 w-full h-full"
				/>
			</div>
		</div>
	);
}
