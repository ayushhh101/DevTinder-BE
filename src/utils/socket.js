const socket = require('socket.io');

const intializeSocket = (server) => {

  const io = socket(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true
    }
  })

  io.on("Connection", (socket) => {
    //Handle events
  })
}

module.exports = intializeSocket;