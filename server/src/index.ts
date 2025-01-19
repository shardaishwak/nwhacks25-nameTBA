import { Socket } from "socket.io";

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});
io.on("connection", (socket: Socket) => {
	console.log(`Socket connected: ${socket.id}`);

	socket.on("join-room", (roomId) => {
		console.log(`Socket ${socket.id} joining room ${roomId}`);
		socket.join(roomId);

		// Let others in the room know a new peer joined
		socket.to(roomId).emit("peer-joined", socket.id);
	});

	// Relay signaling data (offer, answer, ICE candidates)
	socket.on("signal", ({ roomId, data }) => {
		// Broadcast to everyone else in the room
		socket.to(roomId).emit("signal", {
			from: socket.id,
			data,
		});
	});

	// socket.on("face", ({ roomId, data }) => {
	// 	// send to everyone except the sender
	// 	socket.broadcast.to(roomId).emit("face", {
	// 		from: socket.id,
	// 		data,
	// 	});
	// });

	socket.on("update", ({ roomId, data }) => {
		socket.broadcast.to(roomId).emit("update", {
			from: socket.id,
			data,
		});
	});

	// socket.on("hand", ({ roomId, data }) => {
	// 	socket.broadcast.to(roomId).emit("face", {
	// 		from: socket.id,
	// 		data,
	// 	});
	// });
	socket.on("disconnect", () => {
		console.log(`Socket disconnected: ${socket.id}`);
	});
});
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
	console.log(`Express server is running on http://localhost:${PORT}`);
});
