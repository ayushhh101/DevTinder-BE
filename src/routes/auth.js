const express = require('express');

const authRouter = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {validateSignUpData} = require('../utils/validation');

//Creating a new user
authRouter.post("/signup", async (req, res) => {
  try {
    // Validation of data
    validateSignUpData(req);
    //Encrypt the password
    const { firstName, lastName, emailId, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);
    //Creating a new instance of the User model 
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash
    })

    await user.save();
    res.send("User Created");
  } catch (error) {
    res.status(400).send("Error" + error);
  }
});

//Login in 
authRouter.post("/login", async (req, res) => {
  try {
    //Encrypt the password
    const { emailId, password } = req.body;

    //Checking if emailId exists in DB
    const user = await User.findOne({ emailId });
    if (!user) {
      throw new Error("Invalid Credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      //Create a JWT Token
      const token = jwt.sign({_id : user._id},"mysecretkey");

      //Add the Token to Cookie and send the response back to the user
      res.cookie("token", token)
      res.json({
        message: "User Logged In",
        data : user
      });
    }
    else {
      throw new Error("Invalid Credentials");
    }

  } catch (error) {
    res.status(400).send("Error" + error);
  }
});

//Logout
authRouter.post("/logout", async (req, res) => {
  res.clearCookie("token");
  res.send("User Logged Out");
});

module.exports = authRouter;