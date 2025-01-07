const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect(`mongodb+srv://spotifypremiumuse438:${process.env.MONGO_PASS}@devtinder.ntbbo.mongodb.net/devTinder`)
}

module.exports = connectDB;