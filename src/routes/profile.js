const express = require('express');

const profileRouter = express.Router();
const {userAuth} = require('../middlewares/auth');
const { validateProfileEditData } = require('../utils/validation');
const bcrypt = require('bcrypt');
const validator = require('validator');

//Get User Profile
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (error) {
    res.status(400).send("Error" + error);
  }
});

//Edit User Profile
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateProfileEditData(req)){
      throw new Error("Invalid Edit Fields");
    }
    //Auth middleware has attached the user to the request object in middleware
    const loggedInUser = req.user;

    Object.keys(req.body).forEach((field) => {
      loggedInUser[field] = req.body[field];
    });

    await loggedInUser.save();
    res.json(
      {
        message : `${loggedInUser.firstName},Your Profile Is Updated`,
        data: loggedInUser
      });

  } catch (error) {
    res.status(400).send("Error" + error);
  }
});

//Password Change
profileRouter.patch("/profile/password", userAuth, async (req, res) => {
  try {
    //Auth middleware has attached the user to the request object in middleware
    const loggedInUser = req.user;

    if(!validator.isStrongPassword(req.body.password)){
      throw new Error("Password is not strong");
    }
    else{
      loggedInUser.password = await bcrypt.hash(req.body.password, 10);
    }

    await loggedInUser.save();
    res.json(
      {
        message : `${loggedInUser.firstName},Your Password Has Been Updated`,
        data: loggedInUser
      });

  } catch (error) {
    res.status(400).send("Error" + error);
  }
});

module.exports = profileRouter;