import { io } from "socket.io-client";

const socketURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(socketURL, {
  autoConnect: false,
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Socket disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("🔥 Socket connection error:", err.message);
});

export const setSocketAuthToken = (token) => {
  socket.auth = token ? { token } : {};
};

export const connectSocket = (token = localStorage.getItem("token")) => {
  setSocketAuthToken(token);

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;