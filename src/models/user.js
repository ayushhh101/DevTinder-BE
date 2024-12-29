const mongoose = require('mongoose');

const userSchema = new  mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
      type: String,
      required: true
  },
    emailId: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    age:{
        type: Number,
        required: true
    },
    gender:{
        type: String,
        required: true
    },
});

// mongoose.model(Name of the Model, Schema of the Model);

module.exports = mongoose.model('User', userSchema);