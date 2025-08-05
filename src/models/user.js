const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
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
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid Email");
            }
        },
    },
    password: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        min: 18,

    },
    gender: {
        type: String,
        enum: {
            values: ['male', 'female', 'others'],
            message: '{VALUE} is not valid'
        }
    },
    photoUrl: {
        type: String,
        default: "https://www.shutterstock.com/image-vector/default-avatar-profile-icon-social-600nw-1677509740.jpg"
    },
    about: {
        type: String,
        default: "This is random default description of the user"
    },
    skills: {
        type: [String]
    },
    headline: String,
    currentPosition: String,
    location: String,
    githubUrl: String,
    linkedinUrl: String,
    projects: [
        { title: String, description: String, link: String }
    ],
    lastSeen: {
        type: Date,
        default: Date.now
    }
},

    {
        timestamps: true
    });

// mongoose.model(Name of the Model, Schema of the Model);

module.exports = mongoose.model('User', userSchema);