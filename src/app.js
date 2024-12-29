const express = require('express');
// Import the database connection
const connectDB = require('./config/database');
const User = require('./models/user');
// Create an instance of express application
const app = express();

app.post("/signup", async (req, res) => {
  //Creating a new instance of the User model 
  const user = new User({
    firstName: "Whyrat",
    lastName: "req.body.lastName",
    emailId: "req.body.emailId",
    password: "req.body.password",
    age: "1",
    gender: "haha"
  })
  try {
    await user.save();
    res.send("User Created");
  } catch (error) {
    res.status(400).send("Error", + error);
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
