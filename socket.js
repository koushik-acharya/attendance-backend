// Handles real-time communication for attendance sessions.
// Room naming convention: "session-<sessionId>"
// - Teacher joins the room when they start a session (to receive live scan updates)
// - Students join the room right after their QR scan is validated
// - When teacher ends session, everyone in the room gets a "session-ended" event

function initSocket(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Client calls this after starting a session (teacher) or validating a QR (student)
    socket.on("join-session", (sessionId) => {
      socket.join(`session-${sessionId}`);
      console.log(`Socket ${socket.id} joined session-${sessionId}`);
    });

    socket.on("leave-session", (sessionId) => {
      socket.leave(`session-${sessionId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = initSocket;
