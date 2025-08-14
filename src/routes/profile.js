const express = require('express');

const profileRouter = express.Router();
const { userAuth } = require('../middlewares/auth');
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
    if (!validateProfileEditData(req)) {
      return res.status(400).json({ message: "Invalid Edit Fields" });
    }

    const loggedInUser = req.user;

    const editableFields = [
      "firstName",
      "lastName",
      "photoUrl",
      "age",
      "gender",
      "about",
      "skills",
      "headline",
      "currentPosition",
      "location",
      "githubUrl",
      "linkedinUrl",
      "projects",
      "bannerUrl"
    ];

    editableFields.forEach(field => {
      if (field in req.body) {
        if (typeof req.body[field] === "string") {
          loggedInUser[field] = req.body[field].trim();
        } else {
          loggedInUser[field] = req.body[field];
        }
      }
    });

    await loggedInUser.save();

    res.json(
      {
        message: `${loggedInUser.firstName}, your Profile Is Updated`,
        data: loggedInUser
      });

  } catch (error) {
    console.error("Profile edit error:", error);
    if (error.name === "ValidationError") {
    // Collect all validation errors messages
    const messages = Object.values(error.errors).map(err => err.message);
    // Join them or pick the first one to send back
    return res.status(400).json({
      message: messages.join('. ') // e.g. "Age must be at least 18."
    });
  }

    res.status(500).json({
      message: error.message || "Something went wrong while updating profile."
    });
  }
});

//Password Change
profileRouter.patch("/profile/password", userAuth, async (req, res) => {
  try {
    //Auth middleware has attached the user to the request object in middleware
    const loggedInUser = req.user;

    if (!validator.isStrongPassword(req.body.password)) {
      throw new Error("Password is not strong");
    }
    else {
      loggedInUser.password = await bcrypt.hash(req.body.password, 10);
    }

    await loggedInUser.save();
    res.json(
      {
        message: `${loggedInUser.firstName},Your Password Has Been Updated`,
        data: loggedInUser
      });

  } catch (error) {
    res.status(400).send("Error" + error);
  }
});

module.exports = profileRouter;