const mongoose = require("mongoose");
const fs = require("fs");
const dbModels = require(__dirname + "/models.js");
const _ = require("lodash");
const support = require("../app_functions.js");

//Export find model contents functions
module.exports.getGroups = callback => {
  dbModels.Group.find((err, groups) => {
    if (!err) {
      if (groups.length == 0) {
        //Groups is empty
        callback(groups, true);
      } else {
        callback(groups, false);
      }
    } else {
      console.log(err);
      callback(null, null);
    }
  });
};
module.exports.getSettings = callback => {
  dbModels.Setting.find((err, settings) => {
    if (!err) {
      //Send settings
      callback(settings);
    } else {
      console.log(err);
      callback(null);
    }
  });
};
module.exports.getAttendances = callback => {
  dbModels.Attendance.find((err, attendances) => {
    if (!err) {
      if (attendances.length == 0) {
        //Attendances is empty
        callback(attendances, true);
      } else {
        callback(attendances, false);
      }
    } else {
      console.log(err);
      callback(null, null);
    }
  });
};

module.exports.processUploadedCSV = data => {
  var groups = [];
  data.forEach(function(person) {
    //For each Group declared in the data CSV
    groups.push(person.Group);
  });
  groups = _.uniq(groups); //List of unique group names

  var groupsToInsert = [];
  for (var i = 0; i < groups.length; i++) {
    //For every unique group (from data CSV)
    let members = [];
    //Get a list of person schemes of members of THIS specific group
    /* jshint ignore:start */
    data.forEach(person => {
      if (groups[i] == person.Group) {
        var member = new dbModels.Person({
          name: person.Name
        });
        members.push(member);
      }
    });
    /* jshint ignore:end */
    //Sort those members array alphabetically
    members.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));

    var group;
    //Create a group schema with members in it
    if (i == 0) {
      //Sets first group as main
      group = new dbModels.Group({
        name: groups[i],
        main: true,
        members: members
      });
    } else {
      //Create a non-main group document
      group = new dbModels.Group({
        name: groups[i],
        main: false,
        members: members
      });
    }
    groupsToInsert.push(group);
  }
  return groupsToInsert;
};

module.exports.updateCurrHere = (memberID, groupID) => {};
