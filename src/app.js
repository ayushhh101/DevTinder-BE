const express = require('express');

// Create an instance of express application
const app = express();

app.use("/test",(req, res) => {
  res.send('Hello Not world');
});

app.use((req, res) => {
  res.send('Hello World 1');
});

//Listening on some port so that anybody can connect 
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});