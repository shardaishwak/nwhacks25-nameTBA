"use client";

// pages/sender.js
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function Sender() {
	const videoRef = useRef(null);
	const peerConnectionRef = useRef(null);
	const socketRef = useRef(null);

	// Instead of hardcoding "RECEIVER_ID", store it in state
	const [receiverID, setReceiverID] = useState("");

	useEffect(() => {
		if (typeof window === "undefined") return;

		// Create a new RTCPeerConnection
		const configuration = {
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		};
		peerConnectionRef.current = new RTCPeerConnection(configuration);

		// Connect to Socket.IO server once
		socketRef.current = io("http://localhost:8080", {
			transports: ["websocket"],
		});

		// Handle inbound signals (answers, ICE candidates)
		socketRef.current.on("signal", async ({ from, signal }) => {
			if (signal.type === "answer") {
				await peerConnectionRef.current.setRemoteDescription(
					new RTCSessionDescription(signal)
				);
			} else if (signal.candidate) {
				await peerConnectionRef.current.addIceCandidate(
					new RTCIceCandidate(signal)
				);
			}
		});

		// Capture local camera
		navigator.mediaDevices
			.getUserMedia({ video: true, audio: true })
			.then((stream) => {
				videoRef.current.srcObject = stream;
				// Attach tracks to the connection
				stream
					.getTracks()
					.forEach((track) =>
						peerConnectionRef.current.addTrack(track, stream)
					);
			})
			.catch((err) => console.error("Error accessing camera:", err));

		// Send ICE candidates to the server -> Receiver
		peerConnectionRef.current.onicecandidate = (event) => {
			if (event.candidate && receiverID) {
				socketRef.current.emit("signal", {
					to: receiverID,
					signal: event.candidate,
				});
			}
		};

		return () => {
			if (socketRef.current) socketRef.current.disconnect();
			if (peerConnectionRef.current) peerConnectionRef.current.close();
		};
	}, [receiverID]);
	// Notice "receiverID" in the dependency array so we can create an offer after the user inputs the ID

	// Function to create and send the offer (called after user enters the receiverID)
	const handleConnect = async () => {
		try {
			const offer = await peerConnectionRef.current.createOffer();
			await peerConnectionRef.current.setLocalDescription(offer);
			socketRef.current.emit("signal", {
				to: receiverID,
				signal: offer,
			});
		} catch (error) {
			console.error("Error creating offer:", error);
		}
	};

	return (
		<div>
			<h1>Sender</h1>
			<video
				ref={videoRef}
				autoPlay
				muted
				style={{ width: "100%", maxWidth: 400 }}
			/>
			<div>
				<input
					type="text"
					placeholder="Enter Receiver ID"
					value={receiverID}
					onChange={(e) => setReceiverID(e.target.value)}
				/>
				<button onClick={handleConnect}>Connect</button>
			</div>
		</div>
	);
}
