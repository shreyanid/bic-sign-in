// Node modules
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const dbModels = require("./database/models.js");

//Get timestamp for attendance log
exports.getTimestamp = function() {
  var d = new Date();
  var date = d.toLocaleDateString();
  var time = d.toLocaleTimeString();
  return date + " " + time;
};

//Get data to display on home page
exports.getDate = function() {
  var d = new Date();
  var date = d.toLocaleDateString();
  return date;
};
