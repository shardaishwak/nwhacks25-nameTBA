import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketIOResult {
	socketRef: React.MutableRefObject<Socket | null>;
}

/**
 * Hook to initialize and manage a Socket.IO connection.
 *
 * @param roomId The ID of the room to join
 * @returns An object containing a reference to the socket instance
 */
export default function useSocketIO(roomId: string): UseSocketIOResult {
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		if (!roomId) return;

		// Connect to your socket server:
		// Adjust the URL to your server endpoint.
		socketRef.current = io("https://nwhacks25-nametba.onrender.com", {
			transports: ["websocket"],
		});

		// On connect, join the specified room.
		socketRef.current.on("connect", () => {
			console.log("Connected to socket server:", socketRef.current?.id);
			socketRef.current?.emit("join-room", roomId);
		});

		// Clean up on unmount
		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
				socketRef.current = null;
			}
		};
	}, [roomId]);

	return { socketRef };
}
