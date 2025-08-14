const express = require('express');

const authRouter = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validateSignUpData } = require('../utils/validation');
const { userAuth } = require('../middlewares/auth');

authRouter.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req.body);
    const { firstName, lastName, emailId, password } = req.body;

    if (await User.findOne({ emailId })) {
      return res.status(409).json({ message: "Email is already registered. Please log in." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      lastSeen: Date.now()
    })

    const savedUser = await user.save();
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.cookie("token", token)
    res.json({ message: "User Created", data: savedUser });

  } catch (error) {
    console.log(error)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.emailId) {
      return res.status(409).json({ message: "Email is already registered. Please log in." });
    }
    const msg = error.message || "Something went wrong. Please try again.";
    res.status(400).json({ message: msg });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId });
    if (!user) {
      throw new Error("Invalid Credentials");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const token = jwt.sign({ _id: user._id }, "mysecretkey");
      user.lastSeen = Date.now();
      await user.save();
      res.cookie("token", token)
      res.json({ message: "Login successful", data: user });
    }
    else {
      throw new Error("Invalid Credentials");
    }

  } catch (error) {
    const msg = error.message || "Something went wrong. Please try again.";
    res.status(400).json({ message: msg });
  }
});

authRouter.post("/logout", userAuth, async (req, res) => {
  const userId = req.user._id;
  await User.findByIdAndUpdate(userId, { lastSeen: Date.now() });
  res.clearCookie("token");
  res.send("User Logged Out");
});

module.exports = authRouter;