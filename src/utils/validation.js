const validator = require("validator");
const { validate } = require("../models/user");

const validateSignUpData = (body) => {
  const { firstName, lastName, emailId, password } = body;

  if (!firstName || !lastName) {
    throw new Error("First Name and Last Name are required");
  }
  else if (!validator.isEmail(emailId)) {
    throw new Error("Email is not valid");
  }
  else if (!validator.isStrongPassword(password)) {
    throw new Error("Password is not strong");
  }
}

const validateProfileEditData = (req) => {
  const allowedEditFields = [
    'firstName',
    'lastName',
    'emailId',
    'age',
    'photoUrl',
    'skills',
    'gender',
    'about',
    'headline',
    'location',
    'currentPosition',
    'githubUrl',
    'linkedinUrl',
    'projects'
  ];

  const isEditAllowed = Object.keys(req.body).every((field) =>
    allowedEditFields.includes(field)
  );

  return isEditAllowed
}

module.exports = {
  validateSignUpData,
  validateProfileEditData
};