const { Server } = require("socket.io");

const io = new Server(5000, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("new-user", (id) => {
    socket.broadcast.emit("new-peer", id);
  });
});
