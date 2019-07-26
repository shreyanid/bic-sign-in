//Mongoose Database Handler
const mongoose = require("mongoose");

//Schemas
var urlSchema = new mongoose.Schema({
  name: String
});

var settingSchema = new mongoose.Schema({
  orgName: {
    type: String,
    default: "Sign In"
  },
  signOutText: {
    type: String,
    default: "Sign Out"
  },
  signOutIcon: {
    type: String,
    default: "fa fa-hand-peace"
  },
  signInText: {
    type: String,
    default: "Sign In"
  },
  signInIcon: {
    type: String,
    default: "fa fa-sign-in-alt"
  }
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
  Attendance: mongoose.model("attendance", attendanceSchema),
  Url: mongoose.model("url", urlSchema)
};
