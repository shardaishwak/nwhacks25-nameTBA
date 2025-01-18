import { useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";

let socket: Socket;

export default function Capture() {
	const videoRef = useRef(null);

	useEffect(() => {
		// Initialize Socket.IO client
		socket = io();

		// Access the user's camera
		navigator.mediaDevices
			.getUserMedia({ video: true, audio: true })
			.then((stream) => {
				videoRef.current.srcObject = stream;

				const mediaRecorder = new MediaRecorder(stream);
				mediaRecorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						socket.emit("video-stream", event.data);
					}
				};

				mediaRecorder.start(100); // Send video chunks every 100ms
			})
			.catch((error) => console.error("Error accessing media devices:", error));

		return () => {
			if (socket) socket.disconnect();
		};
	}, []);

	return (
		<div>
			<h1>Capture</h1>
			<video ref={videoRef} autoPlay muted style={{ width: "100%" }} />
		</div>
	);
}
