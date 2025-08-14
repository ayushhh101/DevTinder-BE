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
  const callTimeouts = new Map();
  const userBusy = new Map();

  // Util to get both caller and callee sockets
  function getSocketsForCall(callerId, calleeId) {
    const sockets = [];
    if (onlineUsers.has(callerId)) sockets.push(onlineUsers.get(callerId).socketId);
    if (onlineUsers.has(calleeId)) sockets.push(onlineUsers.get(calleeId).socketId);
    return sockets;
  }

  function clearBusyFlags(callerId, calleeId) {
    userBusy.set(callerId, false);
    userBusy.set(calleeId, false);
  }

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
      });
    });

    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      socket.join(roomId);

      // notify the other user about who joined
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

    socket.on("callInitiated", ({ targetUserId, from }) => {
      if (userBusy.get(targetUserId)) {
        socket.emit("callRejected", { from: { userId: targetUserId, firstName: "(Busy)" }, busy: true });
        return;
      }
      userBusy.set(from.userId, true);
      userBusy.set(targetUserId, true);

      const target = onlineUsers.get(targetUserId);
      if (target) {
        // Notify callee of incoming call
        io.to(target.socketId).emit("incomingCall", {
          from, // caller info
          timestamp: new Date()
        });

        //miss call
        const callKey = `${from.userId}_${targetUserId}`;
        callTimeouts.set(callKey, setTimeout(() => {
          if (onlineUsers.has(from.userId)) io.to(onlineUsers.get(from.userId).socketId).emit("missedCall", { targetUserId });
          if (target) io.to(target.socketId).emit("missedCall", { from });
          userBusy.set(from.userId, false);
          userBusy.set(targetUserId, false);
          callTimeouts.delete(callKey);
        }, 20000));
      }
    });

    socket.on("callAccepted", ({ targetUserId, from }) => {
      const callKey = `${targetUserId}_${from.userId}`; //invert params
      clearTimeout(callTimeouts.get(callKey));
      callTimeouts.delete(callKey);

      // notify both
      const caller = onlineUsers.get(targetUserId),
        callee = onlineUsers.get(from.userId);
      if (caller) io.to(caller.socketId).emit("callAccepted", { from });
      if (callee) io.to(callee.socketId).emit("callAccepted", { from });
    });

    // Callee rejects call
    socket.on("callRejected", ({ targetUserId, from }) => {
      const callKey = `${targetUserId}_${from.userId}`; // invert for join
      clearTimeout(callTimeouts.get(callKey));
      callTimeouts.delete(callKey);
      clearBusyFlags(from.userId, targetUserId);
      const caller = onlineUsers.get(targetUserId);
      if (caller) io.to(caller.socketId).emit("callRejected", { from });
    });

    // Either ends the call
    socket.on("callEnded", ({ targetUserId, from }) => {
      clearBusyFlags(from.userId, targetUserId);
      const target = onlineUsers.get(targetUserId);
      if (target) {
        io.to(target.socketId).emit("callEnded", { from });
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
          userBusy.delete(userId);
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