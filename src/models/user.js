const mongoose = require('mongoose');

const userSchema = new  mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50
    },
    lastName: {
      type: String
  },
    emailId: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    age:{
        type: Number,
        min: 18,
        
    },
    gender:{
        type: String
    },
    photoUrl:{
        type: String
    },
    about:{
        type: String,
        default :"This is random default description of the user"
    },
    skills:{
        type: [String]
    },
});

// mongoose.model(Name of the Model, Schema of the Model);

module.exports = mongoose.model('User', userSchema);