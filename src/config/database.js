const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect("mongodb+srv://spotifypremiumuse438:ayush2811@devtinder.ntbbo.mongodb.net/devTinder")
}

module.exports = connectDB;