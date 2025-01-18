import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
	console.log("A user connected:", socket.id);

	// Handle incoming video chunks
	socket.on("video-stream", (data) => {
		// Broadcast video chunks to all clients except the sender
		socket.broadcast.emit("video-broadcast", data);
	});

	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);
	});
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
