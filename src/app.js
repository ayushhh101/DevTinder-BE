const express = require('express');

// Create an instance of express application
const app = express();

app.get("/user/:userId",(req, res) => {
  console.log(req.params)
  res.send({firstName:"Akshay",lastName:"Kumar"});
});

//Listening on some port so that anybody can connect 
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});