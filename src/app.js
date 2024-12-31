const express = require('express');
// Import the database connection
const connectDB = require('./config/database');
const User = require('./models/user');
// Create an instance of express application
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { userAuth } = require('./middlewares/auth');
const cookieParser = require('cookie-parser');
// Middleware to parse the incoming request body & it works for all the routes automatically
app.use(express.json());
app.use(cookieParser());

const { validateSignUpData } = require('./utils/validation');

//Creating a new user
app.post("/signup", async (req, res) => {
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
app.post("/login", async (req, res) => {
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
      console.log(token)

      //Add the Token to Cookie and send the response back to the user
      res.cookie("token", token)
      res.send("User Logged In");
    }
    else {
      throw new Error("Invalid Credentials");
    }

  } catch (error) {
    res.status(400).send("Error" + error);
  }
});

//Get User Profile
app.get("/profile", userAuth ,async (req, res) => {
  const user = req.user;
  res.send(user);
});
//Updating using the emailId
app.put("/user", async (req, res) => {
  try {
    const emailId = req.body.emailId;
    const data = req.body;
    const user = await User.findOneAndUpdate({ emailId }, data);
    res.send("User Updated");
  } catch (error) {
    res.send("Error" + error);
  }
});

//First connect to the database and then start listening to your port 
connectDB().then(() => {
  console.log("Connected to MongoDB");
  //Listening on some port so that anybody can connect 
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}).catch((err) => {
  console.log("Error connecting to MongoDB", err);
});
