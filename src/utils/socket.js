const socket = require('socket.io');
const crypto = require('crypto');
const Chat = require('../models/chat');
const ConnectionRequest = require('../models/connectionRequest');

const getSecretRoomId = (userId, targetUserId)=>{
  return crypto
  .createHash("sha256")
  .update([userId, targetUserId].sort().join("_"))
  .digest("hex")
}

const intializeSocket = (server) => {

  const io = socket(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true
    }
  })

  io.on("connection", (socket) => {
    //Handle events
    socket.on("joinChat",({firstName , userId ,targetUserId})=>{
      //A unique room id is created for each chat ( 2 users )
      const roomId = getSecretRoomId(userId, targetUserId)
      console.log(firstName + " Joined room :"+ roomId)
      socket.join(roomId)
    })

    socket.on("sendMessage",async({ firstName,lastName, userId, targetUserId, text })=>{
     

      //Save message to database
      //2 Cases: Chat exists or not and creating a new chat if it doesnt exist
      try {
        const roomId = getSecretRoomId(userId, targetUserId)
        console.log(firstName + " Sent message to room :"+ text)

        //Check if userId and targetUserId are friends
        const friends = await ConnectionRequest.findOne({
          $or:[
          {fromUserId:userId, toUserId: targetUserId, status: "accepted"},
          { fromUserId:targetUserId, toUserId: userId, status: "accepted"}
          ],
        })

        if(!friends)
        {
          res.json("You are not friends to have a chat")
          return
        }
        let chat = await Chat.findOne({
          participants: {$all: [userId, targetUserId]}
        })

        if(!chat)
        {
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
        io.to(roomId).emit("messageReceived", { firstName,lastName, text })
      } catch (error) {
        console.log(error)
      }
    })

    socket.on("disconnect",()=>{

    })
  })
}

module.exports = intializeSocket;