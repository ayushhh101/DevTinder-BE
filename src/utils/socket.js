const socket = require('socket.io');
const crypto = require('crypto');
const Chat = require('../models/chat');
const ConnectionRequest = require('../models/connectionRequest');

const getSecretRoomId = (userId, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetUserId].sort().join("_"))
    .digest("hex")
}

const TYPING_TIMEOUT = 3000;

const intializeSocket = (server) => {

  const io = socket(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
      transports: ['websocket']
    }
  })

  const onlineUsers = new Map();

  io.on("connection", (socket) => {

    socket.on("setOnline", (userId) => {
      onlineUsers.set(userId, {
        socketId: socket.id,
        // lastSeen: null,
        status: "online"
      });
      io.emit("userStatusChanged", { userId, status: "online" });
    });

    socket.on("getUserStatus", (targetUserId) => {
      const userData = onlineUsers.get(targetUserId);
      socket.emit("userStatusResponse", {
        userId: targetUserId,
        status: userData?.status || "offline",
        // lastSeen: userData?.lastSeen || new Date()
      });
    });

    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      socket.join(roomId);

      // Notify the other user about who joined
      socket.to(roomId).emit("userJoined", {
        userId,
        firstName,
        status: onlineUsers.has(userId) ? "online" : "offline"
      });
    });

    socket.on("sendMessage", async ({ firstName, lastName, userId, targetUserId, text }) => {
      //Save message to database
      //2 Cases: Chat exists or not and creating a new chat if it doesnt exist
      try {
        const roomId = getSecretRoomId(userId, targetUserId)
        console.log(firstName + " Sent message to room :" + text)

        //Check if userId and targetUserId are friends
        const friends = await ConnectionRequest.findOne({
          $or: [
            { fromUserId: userId, toUserId: targetUserId, status: "accepted" },
            { fromUserId: targetUserId, toUserId: userId, status: "accepted" }
          ],
        })

        if (!friends) {
          res.json("You are not friends to have a chat")
          return
        }
        let chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] }
        })

        if (!chat) {
          chat = new Chat({
            participants: [userId, targetUserId],
            messages: []
          })
        }

        chat.messages.push({
          senderId: userId,
          text
        })

        await chat.save()
        //sending message to the room that both users are in 
        io.to(roomId).emit("messageReceived", {
          firstName,
          lastName,
          text,
          senderId: userId
        });

        //Send push-style notification to the receiver only if online
        const targetUser = onlineUsers.get(targetUserId);
        if (targetUser) {
          io.to(targetUser.socketId).emit("newMessageNotification", {
            fromUserId: userId,
            firstName,
            lastName,
            text,
            timestamp: new Date()
          });
        }


      } catch (error) {
        console.log(error)
      }
    })

    socket.on("typing", ({ userId, targetUserId, firstName }) => {
      const roomId = getSecretRoomId(userId, targetUserId);

      // Clear any existing timeout for this user
      if (socket.typingTimeout) {
        clearTimeout(socket.typingTimeout);
      }

      // Broadcast typing event
      socket.to(roomId).emit("typing", {
        userId,
        firstName,
        isTyping: true
      });

      // Set timeout to automatically stop typing
      socket.typingTimeout = setTimeout(() => {
        socket.to(roomId).emit("stopTyping", { userId });
      }, TYPING_TIMEOUT);
    });

    socket.on("sendConnectionRequestNotification", ({ fromUserId, toUserId, firstName, lastName }) => {
      const target = onlineUsers.get(toUserId);
      if (target) {
        io.to(target.socketId).emit("newConnectionRequest", {
          fromUserId,
          firstName,
          lastName,
          message: `${firstName} sent you a connection request.`,
          timestamp: new Date()
        });
      }
    });

    // CONNECTION ACCEPTED NOTIFICATION
    socket.on("sendConnectionAcceptedNotification", ({ fromUserId, toUserId, firstName, lastName }) => {
      const target = onlineUsers.get(toUserId);
      if (target) {
        io.to(target.socketId).emit("connectionAccepted", {
          fromUserId,
          firstName,
          lastName,
          message: `${firstName} accepted your connection request.`,
          timestamp: new Date()
        });
        // 🔔 Optional: also notify that a new connection was added
        io.to(target.socketId).emit("connectionAdded", {
          fromUserId,
          firstName,
          lastName,
          message: `You are now connected with ${firstName}.`,
          timestamp: new Date()
        });
      }
    });

    socket.on("video-offer", ({ targetUserId, offer, from }) => {
      const target = onlineUsers.get(targetUserId);
      if (target) io.to(target.socketId).emit("video-offer", { offer, from });
    });
    socket.on("video-answer", ({ targetUserId, answer, from }) => {
      const target = onlineUsers.get(targetUserId);
      if (target) io.to(target.socketId).emit("video-answer", { answer, from });
    });

    socket.on("ice-candidate", ({ targetUserId, candidate, from }) => {
      const target = onlineUsers.get(targetUserId);
      if (target) io.to(target.socketId).emit("ice-candidate", { candidate, from });
    });

    socket.on("disconnect", () => {
      for (const [userId, userData] of onlineUsers) {
        if (userData.socketId === socket.id) {
          onlineUsers.set(userId, {
            ...userData,
            status: "offline",
            // lastSeen: new Date()
          });
          io.emit("userStatusChanged", {
            userId,
            status: "offline",
            // lastSeen: new Date()
          });
          break;
        }
      }
    })
  })
}



module.exports = intializeSocket;