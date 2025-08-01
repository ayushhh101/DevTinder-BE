const express = require('express');
const User = require('../models/user');
const { userAuth } = require('../middlewares/auth');
const userRouter = express.Router();
const ConnectionRequest = require('../models/connectionRequest');

const USER_SAFE_DATA = 'firstName lastName age about skills photoUrl'

//Get all the pending connection requests for the loggedIN user
userRouter.get('/user/requests/received', userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequest = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: 'interested'
    }).populate('fromUserId', USER_SAFE_DATA); //populate the fromUserId with firstName and lastName

    res.json({
      message: 'Connection Requests Fetched',
      data: connectionRequest
    })
  } catch (error) {
    res.status(400).send("ERROR" + error.message);
  }
});

//Get all the accepted connections
userRouter.get('/user/connections', userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id },
        { toUserId: loggedInUser._id }
      ],
      status: 'accepted'
    }).populate('fromUserId', USER_SAFE_DATA).populate('toUserId', USER_SAFE_DATA);

    const data = connectionRequests.map((row) => {
      if (row.fromUserId._id.equals(loggedInUser._id)) {
        return row.toUserId;
      }
      return row.fromUserId;
    });

    res.json({
      message: 'Connections Fetched',
      data: data
    })

  } catch (error) {
    res.status(400).send("ERROR" + error.message);
  }
});

//Feed of the user
userRouter.get('/user/feed', userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 30 ? 30 : limit;
    const skip = (page-1)*limit;

    //Find all the connection requests ( send and received )
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id },
        { toUserId: loggedInUser._id }
      ]
    }).select('fromUserId toUserId')

    //Set() is a collection of unique values
    const hideUsersFromFeed = new Set()
    connectionRequests.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString())
      hideUsersFromFeed.add(req.toUserId.toString())
    })

    const users = await User.find({
      $and: [
      {_id: {
        //ID should not be in present in the hideUsersFromFeed
        $nin: Array.from(hideUsersFromFeed)
      }},
      //ID should not be the loggedInUser
      {_id: {
        $ne: loggedInUser._id
      }}
    ]
    }).select(USER_SAFE_DATA).skip(skip).limit(limit);

    res.send(users)

  }catch(error){
    res.status(400).send("ERROR" + error.message);
  }
});

userRouter.get('/user/search', async (req, res) => {
  try {
    const {
      skills,        // comma-separated skill strings
      location,
      name,
      headline,
      currentPosition,
      minAge,
      maxAge,
      page = 1,
      limit = 20,
    } = req.query;

    let filter = {};

    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      filter.skills = { $in: skillsArray };
    }
    if (location) {
      filter.location = location;
    }
    if (name) {
      filter.$or = [
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } }
      ];
    }
    if (headline) {
      filter.headline = { $regex: headline, $options: 'i' };
    }
    if (currentPosition) {
      filter.currentPosition = { $regex: currentPosition, $options: 'i' };
    }
    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = Number(minAge);
      if (maxAge) filter.age.$lte = Number(maxAge);
    }

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select('-password')     // exclude sensitive info
      .skip(skip)
      .limit(Number(limit))
      .exec();

    const total = await User.countDocuments(filter);

    res.json({ results: users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = userRouter;