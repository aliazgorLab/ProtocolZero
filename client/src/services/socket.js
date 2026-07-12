import { io } from "socket.io-client";

// Connect to the backend socket server
// Assuming the backend is on the same host or define it via env
const socketURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const socket = io(socketURL, {
  autoConnect: true,
});

export default socket;
