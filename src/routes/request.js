const express = require('express');

const requestRouter = express.Router();
const ConnectionRequest = require('../models/connectionRequest');
const {userAuth} = require('../middlewares/auth');
const User = require('../models/user');

//Send a connection request
requestRouter.post('/request/send/:status/:toUserId',userAuth, async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      const allowedStatus = ['interested', 'ignored'];
      if(!allowedStatus.includes(status)){
        return res
        .status(400)
        .json({message : "Invalid status type " + status});
      }

      // Check if the connection request already exists
      const existingRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId }
        ]
      });

      const toUser = await User.findById(toUserId);
      if(!toUser){
        return res
        .status(404)
        .json({message:"User not found"});
      }

      if(existingRequest){
        return res
        .status(400)
        .json({messsage:"Request already exists"});
      }

      const connectionRequest = new ConnectionRequest({
        fromUserId: fromUserId,
        toUserId: toUserId,
        status: status
      });

      const data = await connectionRequest.save();

      res.json({
        message: "Request sent successfully",
        data: data
      });

    } catch (error) {
      res.status(500).send("ERROR" + error.message);
    }
});

//Review a connection request
requestRouter.post('/request/review/:status/:requestId', userAuth, async (req, res) => {
  try {
    //loggedInUser === toUserId
    //status => interested
    const loggedInUser = req.user._id;
    const { status, requestId } = req.params;

    const allowedStatus = ['accepted', 'rejected'];
      if(!allowedStatus.includes(status)){
        return res
        .status(400)
        .json({message : "Invalid status type " + status});
      }

      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: 'interested'
      });

      if(!connectionRequest){
        return res
        .status(400)
        .json({message:"Invalid request"});
      }

      connectionRequest.status = status;
      const data = await connectionRequest.save();

      res.json({
        message: "Connection Request" + status,
        data: data
      });
  }
    catch (error) {
      res.status(500).send("ERROR" + error.message);
    }
});

module.exports = requestRouter;