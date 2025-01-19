/* eslint-disable react-hooks/exhaustive-deps */
/* useMediapipe.ts */

import { useEffect, useState, useRef } from "react";
import {
	HandLandmarker,
	FaceLandmarker,
	FilesetResolver,
} from "@mediapipe/tasks-vision";
import { Socket } from "socket.io-client";

import { playSound } from "@/lib/utilts"; // or wherever your playSound is
import {
	DetectionResults,
	HandDetectionResults,
	BoundingBox,
	TimestampedPosition,
} from "@/interfaces/hand.model";

import {
	convertFaceLandmarksToBoundingBox,
	convertHandLandmarksToBoundingBox,
	calculateVelocity,
	checkCollision,
} from '@/lib/logic';
import { drawHandEdges } from '@/utils/draw';
import { drawFaceBoundingBox } from '@/utils/draw';

/** The props you'll pass from your main RoomPage component. */
interface UseMediapipeProps {
	roomId: string;
	socketRef: React.MutableRefObject<Socket | null>;

	// Video refs
	localVideoRef: React.RefObject<HTMLVideoElement>;
	remoteVideoRef: React.RefObject<HTMLVideoElement>;

	// Canvas refs
	localFaceCanvasRef: React.RefObject<HTMLCanvasElement>;
	localHandCanvasRef: React.RefObject<HTMLCanvasElement>;
	remoteFaceCanvasRef: React.RefObject<HTMLCanvasElement>;
	remoteHandCanvasRef: React.RefObject<HTMLCanvasElement>;

	// Stream state
	remoteStreamExists: boolean;

	// Collision states
	isColliding: boolean;
	setIsColliding: (value: boolean) => void;
	isRemoteColliding: boolean;
	setIsRemoteColliding: (value: boolean) => void;

	// Movement states
	setHandSpeed: (value: number) => void;
	setRemoteHandSpeed: (value: number) => void;
	remotePreviousHandPositionRef: React.MutableRefObject<TimestampedPosition | null>;
	localPreviousHandPositionRef: React.MutableRefObject<TimestampedPosition | null>;
}

/**
 * Hook that initializes Mediapipe Face/Hand landmarkers
 * and performs per-frame detection + drawing.
 */
export default function useMediapipe({
	roomId,
	socketRef,
	localVideoRef,
	remoteVideoRef,
	localFaceCanvasRef,
	localHandCanvasRef,
	remoteFaceCanvasRef,
	remoteHandCanvasRef,
	remoteStreamExists,
	isColliding,
	setIsColliding,
	isRemoteColliding,
	setIsRemoteColliding,
	setHandSpeed,
	setRemoteHandSpeed,
	remotePreviousHandPositionRef,
	localPreviousHandPositionRef,
}: UseMediapipeProps) {
	// Add states for landmarkers and contexts
	const [localFaceLandmarker, setLocalFaceLandmarker] =
		useState<FaceLandmarker | null>(null);
	const [localHandLandmarker, setLocalHandLandmarker] =
		useState<HandLandmarker | null>(null);
	const [remoteFaceLandmarker, setRemoteFaceLandmarker] =
		useState<FaceLandmarker | null>(null);
	const [remoteHandLandmarker, setRemoteHandLandmarker] =
		useState<HandLandmarker | null>(null);

	const [localFaceCtx, setLocalFaceCtx] =
		useState<CanvasRenderingContext2D | null>(null);
	const [localHandCtx, setLocalHandCtx] =
		useState<CanvasRenderingContext2D | null>(null);
	const [remoteFaceCtx, setRemoteFaceCtx] =
		useState<CanvasRenderingContext2D | null>(null);
	const [remoteHandCtx, setRemoteHandCtx] =
		useState<CanvasRenderingContext2D | null>(null);

	// Add states for face bounding boxes
	const [localFaceBoundingBox, setLocalFaceBoundingBox] =
		useState<BoundingBox | null>(null);
	const [remoteFaceBoundingBox, setRemoteFaceBoundingBox] =
		useState<BoundingBox | null>(null);

	// -----------------------------------------
	// 1) Initialize Mediapipe Face & Hand
	// -----------------------------------------
	useEffect(() => {
		let mounted = true;

		const initializeLandmarkers = async () => {
			try {
				const filesetResolver = await FilesetResolver.forVisionTasks(
					"/models/wasm"
				);

				// Face detection options
				const faceOptions = {
					baseOptions: {
						modelAssetPath: "/models/face_landmarker.task",
						delegate: "GPU" as const,
					},
					outputFaceBlendshapes: false,
					runningMode: "VIDEO" as const,
					numFaces: 1,
				};

				// Hand detection options
				const handOptions = {
					baseOptions: {
						modelAssetPath: "/models/hand_landmarker.task",
						delegate: "GPU" as const,
					},
					runningMode: "VIDEO" as const,
					numHands: 1,
				};

				// Bail if unmounted
				if (!mounted) return;

				// Create local face/hand detectors
				const localFace = await FaceLandmarker.createFromOptions(
					filesetResolver,
					faceOptions
				);
				const localHand = await HandLandmarker.createFromOptions(
					filesetResolver,
					handOptions
				);

				// Create remote face/hand detectors
				const remoteFace = await FaceLandmarker.createFromOptions(
					filesetResolver,
					faceOptions
				);
				const remoteHand = await HandLandmarker.createFromOptions(
					filesetResolver,
					handOptions
				);

				// Update states
				setLocalFaceLandmarker(localFace);
				setLocalHandLandmarker(localHand);
				setRemoteFaceLandmarker(remoteFace);
				setRemoteHandLandmarker(remoteHand);

				// Also set up canvas contexts if not done already
				if (localFaceCanvasRef.current && !localFaceCtx) {
					const ctx = localFaceCanvasRef.current.getContext("2d");
					if (ctx) {
						ctx.globalAlpha = 0.9;
						setLocalFaceCtx(ctx);
					}
				}
				if (localHandCanvasRef.current && !localHandCtx) {
					const ctx = localHandCanvasRef.current.getContext("2d");
					if (ctx) {
						ctx.globalAlpha = 0.9;
						setLocalHandCtx(ctx);
					}
				}
				if (remoteFaceCanvasRef.current && !remoteFaceCtx) {
					const ctx = remoteFaceCanvasRef.current.getContext("2d");
					if (ctx) {
						ctx.globalAlpha = 0.9;
						setRemoteFaceCtx(ctx);
					}
				}
				if (remoteHandCanvasRef.current && !remoteHandCtx) {
					const ctx = remoteHandCanvasRef.current.getContext("2d");
					if (ctx) {
						ctx.globalAlpha = 0.9;
						setRemoteHandCtx(ctx);
					}
				}
			} catch (err) {
				console.error("Error initializing Mediapipe tasks:", err);
			}
		};

		initializeLandmarkers();

		return () => {
			mounted = false;
		};
	}, [
		localFaceCanvasRef,
		localHandCanvasRef,
		remoteFaceCanvasRef,
		remoteHandCanvasRef,
		localFaceCtx,
		localHandCtx,
		remoteFaceCtx,
		remoteHandCtx,
		setLocalFaceCtx,
		setLocalHandCtx,
		setRemoteFaceCtx,
		setRemoteHandCtx,
		setLocalFaceLandmarker,
		setLocalHandLandmarker,
		setRemoteFaceLandmarker,
		setRemoteHandLandmarker,
	]);

	// -----------------------------------------
	// 2) Per-frame detection + drawing
	// -----------------------------------------
	useEffect(() => {
		// If no landmarkers yet, wait
		if (!localFaceLandmarker || !localHandLandmarker) {
			return;
		}

		let animationFrameId = 0;
		let lastProcessedTimestamp = 0;

		const animate = async () => {
			const timestamp = performance.now();

			// ~60 FPS throttle
			if (timestamp - lastProcessedTimestamp < 16) {
				animationFrameId = requestAnimationFrame(animate);
				return;
			}

			try {
				// -------------------------------------
				// LOCAL VIDEO DETECTION & DRAW
				// -------------------------------------
				if (
					localVideoRef.current &&
					!localVideoRef.current.paused &&
					!localVideoRef.current.ended
				) {
					const video = localVideoRef.current;
					const roundedTimestamp = Math.round(timestamp);

					// Detect local face & hand
					const faceResults = (await localFaceLandmarker.detectForVideo(
						video,
						roundedTimestamp
					)) as DetectionResults;

					const handResults = (await localHandLandmarker.detectForVideo(
						video,
						roundedTimestamp
					)) as HandDetectionResults;

					// 1) Track local face bounding box
					if (faceResults?.faceLandmarks?.[0]) {
						const faceLm = faceResults.faceLandmarks[0];
						const faceBox = convertFaceLandmarksToBoundingBox(faceLm);
						setLocalFaceBoundingBox(faceBox);
					}

					// 2) Process local hand bounding box
					if (handResults?.landmarks && handResults.landmarks[0]) {
						const handLm = handResults.landmarks[0];
						const currentHandBox = convertHandLandmarksToBoundingBox(handLm);
						const currentPosition: TimestampedPosition = {
							box: currentHandBox,
							timestamp,
						};

						const prev = localPreviousHandPositionRef.current;
						if (prev && timestamp - prev.timestamp > 0) {
							const velocity = calculateVelocity(currentHandBox, prev.box, timestamp - prev.timestamp);

							// Speed
							setHandSpeed(velocity * 1000);

							// Check collision with remote face
							if (remoteFaceBoundingBox) {
								const collision = checkCollision(
									currentHandBox,
									remoteFaceBoundingBox,
									true
								);
								setIsColliding(collision);

								// Emit collision event
								if (collision && socketRef.current) {
									socketRef.current.emit('collision', {
										roomId,
										data: {
											speed: velocity,
											timestamp,
										},
									});
								}
							}
						}
						localPreviousHandPositionRef.current = currentPosition;
					}

					// 3) Draw local face & hand
					if (localFaceCtx && localFaceCanvasRef.current) {
						const faceCanvas = localFaceCanvasRef.current;
						localFaceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

						if (faceResults?.faceLandmarks) {
							faceResults.faceLandmarks.forEach((lm) => {
								drawFaceBoundingBox(lm, localFaceCtx, faceCanvas, true);
							});
						}
					}
					if (localHandCtx && localHandCanvasRef.current) {
						const handCanvas = localHandCanvasRef.current;
						localHandCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);

						if (handResults?.landmarks) {
							handResults.landmarks.forEach((lm) => {
								drawHandEdges(lm, localHandCtx, handCanvas, true);
							});
						}
					}
				}

				// -------------------------------------
				// REMOTE VIDEO DETECTION & DRAW
				// -------------------------------------
				if (
					remoteStreamExists &&
					remoteVideoRef.current &&
					!remoteVideoRef.current.paused &&
					!remoteVideoRef.current.ended &&
					remoteFaceLandmarker &&
					remoteHandLandmarker
				) {
					const video = remoteVideoRef.current;
					const remoteTs = Math.round(timestamp) + 1;

					// Detect remote face & hand
					const faceResults = (await remoteFaceLandmarker.detectForVideo(
						video,
						remoteTs
					)) as DetectionResults;

					const handResults = (await remoteHandLandmarker.detectForVideo(
						video,
						remoteTs
					)) as HandDetectionResults;

					// 1) Track remote face bounding box
					if (faceResults?.faceLandmarks?.[0]) {
						const faceLm = faceResults.faceLandmarks[0];
						const faceBox = convertFaceLandmarksToBoundingBox(faceLm);
						setRemoteFaceBoundingBox(faceBox);
					}

					// 2) Process remote hand bounding box
					if (handResults?.landmarks && handResults.landmarks[0]) {
						const handLm = handResults.landmarks[0];
						const currentHandBox = convertHandLandmarksToBoundingBox(handLm);
						const currentPosition: TimestampedPosition = {
							box: currentHandBox,
							timestamp,
						};

						const prev = remotePreviousHandPositionRef.current;
						if (prev && timestamp - prev.timestamp > 0) {
							const velocity = calculateVelocity(
								currentHandBox,
								prev.box,
								timestamp - prev.timestamp
							);

							setRemoteHandSpeed(velocity * 1000);

							// Check collision with local face bounding box
							if (localFaceBoundingBox) {
								const collision = checkCollision(
									currentHandBox,
									localFaceBoundingBox,
									true
								);
								setIsRemoteColliding(collision);
							}
						}
						remotePreviousHandPositionRef.current = currentPosition;
					}

					// 3) Draw remote face & hand
					if (remoteFaceCtx && remoteFaceCanvasRef.current) {
						const faceCanvas = remoteFaceCanvasRef.current;
						remoteFaceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

						if (faceResults?.faceLandmarks) {
							faceResults.faceLandmarks.forEach((lm) => {
								drawFaceBoundingBox(lm, remoteFaceCtx, faceCanvas, false);
							});
						}
					}
					if (remoteHandCtx && remoteHandCanvasRef.current) {
						const handCanvas = remoteHandCanvasRef.current;
						remoteHandCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);

						if (handResults?.landmarks) {
							handResults.landmarks.forEach((lm) => {
								drawHandEdges(lm, remoteHandCtx, handCanvas, false);
							});
						}
					}
				}

				lastProcessedTimestamp = timestamp;
			} catch (err) {
				console.warn("Detection error:", err);
			}

			animationFrameId = requestAnimationFrame(animate);
		};

		animate();

		// Cleanup
		return () => {
			if (animationFrameId) cancelAnimationFrame(animationFrameId);
		};
	}, [roomId, socketRef, localVideoRef, remoteVideoRef, remoteFaceLandmarker, remoteHandLandmarker, localFaceLandmarker, localHandLandmarker, remoteStreamExists, localFaceCtx, localHandCtx, remoteFaceCtx, remoteHandCtx, localFaceBoundingBox, remoteFaceBoundingBox, localPreviousHandPositionRef, remotePreviousHandPositionRef, setRemoteFaceBoundingBox, setLocalFaceBoundingBox, setHandSpeed, setIsColliding, setRemoteHandSpeed, setIsRemoteColliding, localFaceCanvasRef, localHandCanvasRef, remoteFaceCanvasRef, remoteHandCanvasRef]);

	// -----------------------------------------
	// 3) Play sound effect on collisions
	// -----------------------------------------
	useEffect(() => {
		if (isColliding || isRemoteColliding) {
			playSound("punch");
		}
	}, [isColliding, isRemoteColliding]);
}
