
import { Server } from "socket.io";

let io = null;

/* Initialize Socket.IO */
export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[SOCKET] Connected: ${socket.id}`);

    socket.on("media:subscribe", ({ entityType, entityId } = {}) => {
      if (!entityType || !entityId) return;

      const room = `entity:${entityType}:${entityId}`;
      socket.join(room);

      console.log(`[SOCKET] ${socket.id} joined ${room}`);
    });

    socket.on("media:unsubscribe", ({ entityType, entityId } = {}) => {
      if (!entityType || !entityId) return;

      const room = `entity:${entityType}:${entityId}`;
      socket.leave(room);

      console.log(`[SOCKET] ${socket.id} left ${room}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `[SOCKET] Disconnected: ${socket.id} - ${reason}`
      );
    });
  });

  return io;
}

/* Emit media completed event */
export async function emitMediaCompleted({
  entityType,
  entityId,
  field,
  mediaId,
}) {
  if (!io) return;

  const room = `entity:${entityType}:${entityId}`;

  io.to(room).emit("media:processed", {
    entityType,
    entityId,
    field,
    mediaId,
    status: "completed",
  });
}
