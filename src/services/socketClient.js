import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL || "https://express-linko.onrender.com";
const SOCKET_URL = API_URL.replace(/\/api$/, ''); // Enlève /api si présent

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  withCredentials: true,
});

export default socket;