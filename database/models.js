//Mongoose Database Handler
const mongoose = require("mongoose");

//Schemas
var settingSchema = new mongoose.Schema({
  orgName: {
    type: String,
    default: "Sign In"
  },
  signOutText: {
    type: String,
    default: "Sign Out"
  },
  signOutIcon: String,
  signInText: {
    type: String,
    default: "Sign In"
  },
  signInIcon: String
});

var personSchema = new mongoose.Schema({
  name: String,
  currentlyHere: {
    type: Boolean,
    default: false
  }
});

var groupSchema = new mongoose.Schema({
  name: String,
  main: Boolean,
  members: [personSchema]
});

var attendanceSchema = new mongoose.Schema({
  timestamp: String,
  date: String,
  time: String,
  name: String,
  action: String
});

//Mongoose Models
module.exports = {
  Setting: mongoose.model("setting", settingSchema),
  Person: mongoose.model("people", personSchema),
  Group: mongoose.model("group", groupSchema),
  Attendance: mongoose.model("attendance", attendanceSchema)
};
