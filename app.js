//jshint esversion: 9

//NPM Modules
const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const loader = require('csv-load-sync');
const _ = require('lodash');
const formidable = require('formidable');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const sleep = require('sleep');
const fs = require("fs");
const colors = require('colors');

//Local Modules
const support = require(__dirname + "/app_functions.js");

//Express App Settings
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//Load config.json file
var config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

//Make local or atlas mongoDB connections
mongoose.connect(config.mongodbURL, {
  useNewUrlParser: true,
  useFindAndModify: false
});

//Mongoose schemas and models
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
var Setting = mongoose.model('setting', settingSchema);
var personSchema = new mongoose.Schema({
  name: String,
  currentlyHere: {
    type: Boolean,
    default: false
  }
});
var Person = mongoose.model('people', personSchema);
var groupSchema = new mongoose.Schema({
  name: String,
  main: Boolean,
  members: [personSchema]
});
var Group = mongoose.model('group', groupSchema);
var attendanceSchema = new mongoose.Schema({
  timestamp: String,
  date: String,
  time: String,
  name: String,
  action: String
});
var Attendance = mongoose.model('attendance', attendanceSchema);


//Main page get route
app.get('/', function(req, res) {
  //A way to check if there's data
  Group.find(function(err, groups) { //returns all groups
    if (!err) { //Successfully found groups collections contents
      if (groups.length == 0) { //No data has been created yet
        res.render("setup");
      } else { //There is some data in the database
        var setting = new Setting({}); //Create default settings
        setting.save();
        Setting.find(function(err, settings) {
          if (!err) {
            var prefs = settings[0];
            if (prefs !== undefined) {
              res.render("index", {
                date: support.getDate(),
                groups: groups,
                orgName: prefs.orgName,
                signInText: prefs.signInText,
                signOutText: prefs.signOutText,
                signInIcon: prefs.signInIcon,
                signOutIcon: prefs.signOutIcon
              });
            } else {
              res.redirect("/");
            }
          } else {
            console.log(err);
          }
        });
      }
    } else {
      console.log("There was an error finding Groups data");
    }
  });
});

//Settings page get route
app.get("/settings", function(req, res) {
  //A way to check if there's data
  Group.find(function(err, groups) { //returns all groups
    if (!err) {
      if (groups.length == 0) {
        //No data has been created yet
        res.render("setup");
      } else {
        //There is some data in the database
        //Get a list of all people to add to export options select menu
        Attendance.find(function(err, attendances) {
          var people = [];
          var minDate = "";
          var maxDate = "";
          if (attendances.length !== 0) {
            attendances.forEach(function(roll) {
              people.push(roll.name);
            });
            people = _.uniq(people).sort();
            minDate = attendances[0].timestamp.split(" ")[0];
            maxDate = attendances[attendances.length - 1].timestamp.split(" ")[0];
          }
          if (!err) {
            res.render("settings", {
              people: people,
              minDate: minDate,
              maxDate: maxDate
            });
          }
        });
      }
    } else {
      console.log("Error in finding groups from database");
    }
  });
});

//Settings page post request handler
app.post("/settings", function(req, res) {

  var button = req.body.button;
  if (button == "home") {
    res.redirect("/");
  } else if (button == "resetAll") {
    mongoose.connection.db.dropDatabase();
    res.redirect("/");
  } else if (button == "resetAttendance") {
    mongoose.connection.collections.attendances.drop();
    res.redirect("/settings");
  } else if (button == "update") {
    mongoose.connection.collections.groups.drop();
    res.redirect("/");
  } else if (button == "preferences") {
    res.redirect("/preferences");
  } else if (button == "export") {
    //Export options for date range, name

    function exportToFile(attendances) {
      //Filter attendances based on to and from dates
      for (var i = 0; i < attendances.length; i++) {
        var date = new Date(attendances[i].timestamp.split(" ")[0]);
        var from = new Date(exParams.fromDate);
        var to = new Date(exParams.toDate);
        if (date < from) {
          attendances.splice(i, 1);
        }
        if (date > to) {
          attendances.splice(i, 1);
        }
      }
      var records = [];
      attendances.forEach(function(attendance) {
        var roll = {
          timestamp: attendance.timestamp,
          date: attendance.timestamp.split(" ")[0],
          time: attendance.timestamp.split(" ")[1],
          name: attendance.name,
          action: attendance.action
        };
        records.push(roll);
      });
      //Export the records list to CSV
      const csvWriter = createCsvWriter({
        path: __dirname + '/temp/exported_data.csv',
        header: [{
            id: "date",
            title: "Date"
          },
          {
            id: "time",
            title: "Time"
          },
          {
            id: "name",
            title: "Name"
          },
          {
            id: "action",
            title: "Action"
          },
        ]
      });
      csvWriter.writeRecords(records) // returns a promise
        .then(() => {
          res.download('./temp/exported_data.csv', 'Attendance.csv');
        });
    }

    var exParams = req.body;
    if (exParams.name !== "All Members") {
      Attendance.find({
        name: exParams.name
      }, function(err, attendances) {
        exportToFile(attendances);
      });
    } else {
      Attendance.find(function(err, attendances) {
        exportToFile(attendances);
      });
    }
  }
});

//Renders preferences page
app.get("/preferences", function(req, res) {
  //A way to check if there's data
  Group.find(function(err, groups) { //returns all groups
    if (!err) {
      if (groups.length == 0) {
        //No data has been created yet
        res.render("setup");
      } else {
        //There is some data in the database
        Setting.find(function(err, settings) {
          if (!err) {
            if (settings !== undefined) {
              res.render("preferences", {
                orgName: settings[0].orgName,
                signInText: settings[0].signInText,
                signOutText: settings[0].signOutText,
                signInIcon: settings[0].signInIcon,
                signOutIcon: settings[0].signOutIcon
              });
            } else {
              res.redirect("/preferences");
            }
          }
        });
      }
    } else {
      console.log("Error in finding groups from database");
    }
  });
});

//Post request from preferences page handler
app.post("/preferences", function(req, res) {

  var button = req.body.button;
  var pref = req.body;

  if (button == "settings") {
    res.redirect("/settings");
  } else {
    //Change preferences
    mongoose.connection.collections.settings.drop(); //Delete old settings
    var setting = new Setting({
      orgName: pref.orgName,
      signOutText: pref.signOutText,
      signOutIcon: pref.signOutIcon,
      signInText: pref.signInText,
      signInIcon: pref.signInIcon
    });
    setting.save();
  }
  res.redirect("/settings");
});

//Setup page upload post request handler
app.post('/upload', function(req, res) {
  //Read data from post
  var form = new formidable.IncomingForm();
  form.parse(req);
  form.on('fileBegin', function(name, file) {
    file.path = __dirname + '/temp/' + file.name;
  });
  form.on('file', function(name, file) {
    //Once the CSV file has been uploaded ...
    var data = loader(__dirname + "/temp/" + file.name);
    groups = [];
    data.forEach(function(person) { //For each Group declared in the data CSV
      groups.push(person.Group);
    });
    groups = _.uniq(groups); //List of unique group names

    var groupsToInsert = [];
    for (var i = 0; i < groups.length; i++) { //For every unique group (from data CSV)
      members = [];
      //Get a list of person schemes of members of THIS specific group
      data.forEach(function(person) {
        if (groups[i] == person.Group) {
          var member = new Person({
            name: person.Name
          });
          members.push(member);
        }
      });
      //Sort those members array alphabetically
      members.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));

      //Create a group schema with members in it
      if (i == 0) {
        //Sets first group as main
        var group = new Group({
          name: groups[i],
          main: true,
          members: members
        });
      } else {
        //Create a non-main group document
        var group = new Group({
          name: groups[i],
          main: false,
          members: members
        });
      }
      groupsToInsert.push(group);
    }
    Group.insertMany(groupsToInsert, function(err, docs) {
      if (!err) {

        //Copy file to stored location
        fs.copyFile(__dirname + "/temp/" + file.name, __dirname + "/public/data/current_members.csv", (err) => {
          if (err) throw err;
        });

        fs.unlinkSync(__dirname + "/temp/" + file.name); //Delete file
        res.redirect("/");
      } else {
        console.log("There was an error saving groups from the CSV");
      }
    });
  });
});


//Button click post request handler
app.post("/", function(req, res) {

  var memberID = req.body.memberID;
  var groupID = req.body.groupID;

  //Update currentlyHere status of member of group
  Group.findById(groupID, {
    _id: 0,
    members: 1
  }, function(err, found) {
    var whichPersonToUpdate = 0;
    found.members.forEach(function(member) {
      if (member._id == memberID) {
        //A workaround to dot notation
        updateStatement = "members." + whichPersonToUpdate + ".currentlyHere";
        var $set = {};
        if (member.currentlyHere) {
          //They signed out
          $set[updateStatement] = false;
          var roll = new Attendance({
            timestamp: support.getTimestamp(),
            name: member.name,
            action: "Signed Out",
          });
          roll.save();
        } else {
          //They signed in
          $set[updateStatement] = true;
          var roll = new Attendance({
            timestamp: support.getTimestamp(),
            name: member.name,
            action: "Signed In",
          });
          roll.save();
        }
        Group.findOneAndUpdate({
          _id: groupID
        }, {
          $set: $set
        }, function(err, foundList) {
          if (!err) {
            sleep.msleep(400);
            res.redirect("/");
          }
        });
      } else {
        whichPersonToUpdate += 1;
      }
    });
  });

});


//For Heroku
var use_heroku = true;
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3005;
  use_heroku = false;
}

//Regular locahost
// let port = 3000

app.listen(port, function() {
  if (use_heroku) {
    console.log("Server has started Successfully");
  } else {
    console.log("Local server has started successfully on port " + colors.white.underline(port));
  }
});
