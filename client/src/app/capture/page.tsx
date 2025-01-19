"use client";

import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { HandData, FaceData, DetectionResults, HandDetectionResults } from "../../interfaces/hand.model";
import { convertHandLandmarksToBoundingBox, convertFaceLandmarksToBoundingBox } from "@/lib/logic";
import { emitGameState, createInitialGameState, listenToGameState } from "@/lib/socket";
import { StreamData } from "../../interfaces/stream.model";

export default function Capture() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
	const [webcamRunning, setWebcamRunning] = useState(false);
	
	// MediaPipe states
	const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
	const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
	
	// Bounding box states
	const [boundingBoxes, setBoundingBoxes] = useState<{
		hands: HandData['boundingBox'][],
		face: FaceData['boundingBox'] | null
	}>({ hands: [], face: null });

	// Initialize MediaPipe
	useEffect(() => {
		const initializeMediaPipe = async () => {
			const filesetResolver = await FilesetResolver.forVisionTasks('/models/wasm');
			
			const faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
				baseOptions: {
					modelAssetPath: '/models/face_landmarker.task',
					delegate: 'GPU'
				},
				outputFaceBlendshapes: true,
				runningMode: 'VIDEO',
				numFaces: 1
			});

			const handLandmarkerInstance = await HandLandmarker.createFromOptions(filesetResolver, {
				baseOptions: {
					modelAssetPath: '/models/hand_landmarker.task',
					delegate: 'GPU'
				},
				runningMode: 'VIDEO',
				numHands: 2
			});

			setFaceLandmarker(faceLandmarkerInstance);
			setHandLandmarker(handLandmarkerInstance);

			// Initialize canvas context
			if (canvasRef.current) {
				const context = canvasRef.current.getContext('2d');
				if (context) {
					context.globalAlpha = 0.8;
					setCtx(context);
				}
			}
		};

		initializeMediaPipe();
	}, []);

	// Start webcam
	useEffect(() => {
		if (faceLandmarker && handLandmarker) {
			navigator.mediaDevices.getUserMedia({
				video: { width: 640, height: 480 },
				audio: false
			})
			.then(stream => {
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					videoRef.current.onloadedmetadata = () => {
						videoRef.current?.play();
						setWebcamRunning(true);
					};
				}
			})
			.catch(err => console.error("Error accessing webcam:", err));
		}
	}, [faceLandmarker, handLandmarker]);

	// Detection function
	const detectFeatures = async () => {
		if (!videoRef.current || !canvasRef.current || !ctx || !faceLandmarker || !handLandmarker) return;

		const timestamp = performance.now();

		// Detect faces and hands
		const faceResults = await faceLandmarker.detectForVideo(videoRef.current, timestamp) as DetectionResults;
		const handResults = await handLandmarker.detectForVideo(videoRef.current, timestamp) as HandDetectionResults;

		// Calculate bounding boxes
		const handBoxes = handResults.landmarks?.map(landmarks => 
			convertHandLandmarksToBoundingBox(landmarks)) || [];
		
		const faceBox = faceResults.faceLandmarks?.[0] ? 
			convertFaceLandmarksToBoundingBox(faceResults.faceLandmarks[0]) : null;

		setBoundingBoxes({ hands: handBoxes, face: faceBox });

		// Clear canvas and draw
		ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

		// Draw face landmarks and box
		if (faceBox) {
			ctx.strokeStyle = '#FF0000';
			ctx.lineWidth = 2;
			const width = (faceBox.bottomRight.x - faceBox.topLeft.x) * canvasRef.current.width;
			const height = (faceBox.bottomRight.y - faceBox.topLeft.y) * canvasRef.current.height;
			ctx.strokeRect(
				faceBox.topLeft.x * canvasRef.current.width,
				faceBox.topLeft.y * canvasRef.current.height,
				width,
				height
			);
		}

		// Draw hand landmarks and boxes
		handBoxes.forEach(box => {
			ctx.strokeStyle = '#00FF00';
			ctx.lineWidth = 2;
			const width = (box.bottomRight.x - box.topLeft.x) * canvasRef.current!.width;
			const height = (box.bottomRight.y - box.topLeft.y) * canvasRef.current!.height;
			ctx.strokeRect(
				box.topLeft.x * canvasRef.current!.width,
				box.topLeft.y * canvasRef.current!.height,
				width,
				height
			);
		});

		// Log detections
		console.log('Face box:', faceBox);
		console.log('Hand boxes:', handBoxes);
	};

	// Animation loop
	useEffect(() => {
		let animationId: number;

		const animate = async () => {
			await detectFeatures();
			animationId = requestAnimationFrame(animate);
		};

		if (webcamRunning) {
			animate();
		}

		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
		};
	}, [webcamRunning]);

	return (
		<div className="relative w-full h-screen flex flex-col items-center justify-center bg-gray-900">
			<h1 className="text-white text-2xl mb-4">Capture</h1>
			<div className="relative">
				<video
					ref={videoRef}
					className="w-[640px] h-[480px] object-cover"
					autoPlay
					playsInline
					muted
				/>
				<canvas
					ref={canvasRef}
					width={640}
					height={480}
					className="absolute top-0 left-0"
				/>
			</div>
			<div className="mt-4 text-white">
				<p>Face detected: {boundingBoxes.face ? 'Yes' : 'No'}</p>
				<p>Hands detected: {boundingBoxes.hands.length}</p>
				<pre className="text-xs mt-2">
					{JSON.stringify(boundingBoxes, null, 2)}
				</pre>
			</div>
		</div>
	);
}
