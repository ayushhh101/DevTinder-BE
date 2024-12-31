const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
  //Read the token from req cookies
  //Validate the token
  //Find the user 
  try {
    const cookies = req.cookies;

    const { token } = cookies;
    if (!token) {
      throw new Error("Token is not Valid !");
    }

    const decodedObj = await jwt.verify(token, "mysecretkey");

    const { _id } = decodedObj;

    const user = await User.findById(_id);
    if (!user) {
      throw new Error("User not found");
    }

    //Attach the user to the req object so that it can be used baad mein
    req.user = user;

    next();
  } catch (error) {
    res.status(401).send("Unauthorized User");
  }
}

  module.exports = {
    userAuth
  };