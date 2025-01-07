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
const cors = require('cors');
require('dotenv').config();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
app.use(express.json());
app.use(cookieParser());

const { validateSignUpData } = require('./utils/validation');

const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const requestRouter = require('./routes/request');
const userRouter = require('./routes/user');

app.use('/', authRouter)
app.use('/', profileRouter)
app.use('/', requestRouter)
app.use('/', userRouter)

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
