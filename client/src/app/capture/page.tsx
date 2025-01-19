"use client";

import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { HandData, FaceData, DetectionResults, HandDetectionResults, BoundingBox, MovementData } from "../../interfaces/hand.model";
import { convertHandLandmarksToBoundingBox, convertFaceLandmarksToBoundingBox, calculateVelocity, calculateDirection, checkCollision, getBoundingBoxCenter } from "@/lib/logic";
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

	// Add state for previous positions and timestamps
	const [previousPositions, setPreviousPositions] = useState<{
		hands: BoundingBox[];
		face: BoundingBox | null;
		timestamp: number;
	}>({
		hands: [],
		face: null,
		timestamp: performance.now()
	});

	// Update movement data state
	const [movementData, setMovementData] = useState<{
		hands: MovementData[];
		face: MovementData | null;
	}>({
		hands: [],
		face: null
	});

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

		const currentTimestamp = performance.now();
		const timeElapsed = currentTimestamp - previousPositions.timestamp;

		if (timeElapsed < 1000) return; // Only calculate every second

		// Detect faces and hands
		const faceResults = faceLandmarker.detectForVideo(videoRef.current, currentTimestamp) as DetectionResults;
		const handResults = handLandmarker.detectForVideo(videoRef.current, currentTimestamp) as HandDetectionResults;

		// Calculate bounding boxes
		const handBoxes = handResults.landmarks?.map(landmarks => 
			convertHandLandmarksToBoundingBox(landmarks)) || [];
		
		const faceBox = faceResults.faceLandmarks?.[0] ? 
			convertFaceLandmarksToBoundingBox(faceResults.faceLandmarks[0]) : null;

		setBoundingBoxes({ hands: handBoxes, face: faceBox });

		 // Calculate center points for hands and face
		 const handCenters = handBoxes.map(getBoundingBoxCenter);

		const faceCenter = faceBox ? getBoundingBoxCenter(faceBox) : null;

		// Calculate velocities and directions using bounding boxes
		const handMovements = handBoxes.map((box, index) => {
			const prevBox = previousPositions.hands[index];
			if (!prevBox) return { velocity: 0, direction: 0 };

			return {
				velocity: calculateVelocity(box, prevBox, timeElapsed),
				direction: calculateDirection(box, prevBox)
			};
		});

		console.log(handMovements);
		

		const faceMovement = faceBox && previousPositions.face ? {
			velocity: calculateVelocity(faceBox, previousPositions.face, timeElapsed),
			direction: calculateDirection(faceBox, previousPositions.face)
		} : null;

		 // Check for collisions
		 const collisions = handBoxes.map(handBox => faceBox && checkCollision(handBox, faceBox));

		// Update movement data
		setMovementData({
			hands: handMovements,
			face: faceMovement
		});

		// Update previous positions with full bounding boxes
		setPreviousPositions({
			hands: handBoxes,
			face: faceBox,
			timestamp: currentTimestamp
		});

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
 
		 // Add velocity and direction text to canvas
		 ctx.font = '12px Arial';
		 ctx.fillStyle = '#FFFFFF';
		 
		 handMovements.forEach((data, index) => {
			 if (handCenters[index]) {
				 const x = handCenters[index].x * canvasRef.current!.width;
				 const y = handCenters[index].y * canvasRef.current!.height;
				 ctx.fillText(
					 `v: ${data.velocity.toFixed(2)} ang: ${data.direction.toFixed(1)}°`,
					 x,
					 y - 10
				 );
			 }
		 });
 
		 if (faceMovement && faceCenter) {
			 const x = faceCenter.x * canvasRef.current!.width;
			 const y = faceCenter.y * canvasRef.current!.height;
			 ctx.fillText(
				 `v: ${faceMovement.velocity.toFixed(2)} ang: ${faceMovement.direction.toFixed(1)}°`,
				 x,
				 y - 10
			 );
		 }

		 // Display collision status
		 collisions.forEach((collision, index) => {
			 if (collision) {
				 ctx.fillText(`Collision with face`, handCenters[index].x * canvasRef.current!.width, handCenters[index].y * canvasRef.current!.height + 10);
			 }
		 });
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
		<div className="w-full h-screen flex flex-row  bg-gray-900 *:w-1/2">
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
				{movementData.hands.map((data, index) => (
					<div key={index}>
						<p>Hand {index + 1} - Speed: {data.velocity.toFixed(2)} px/ms, Direction: {data.direction.toFixed(1)}°</p>
					</div>
				))}
				{movementData.face && (
					<div>
						<p>Face - Speed: {movementData.face.velocity.toFixed(2)} px/ms, Direction: {movementData.face.direction.toFixed(1)}°</p>
					</div>
				)}
				<pre className="text-xs mt-2">
					{JSON.stringify(boundingBoxes, null, 2)}
				</pre>
			</div>
		</div>
	);
}
