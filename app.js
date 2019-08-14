// NPM Modules
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const mongoose = require("mongoose");
const loader = require("csv-load-sync");
const _ = require("lodash");
const formidable = require("formidable");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");
const colors = require("colors");
const editJsonFile = require("edit-json-file");
const puppeteer = require("puppeteer");

// Local Modules
const support = require(__dirname + "/app_functions.js");
const dbModels = require(__dirname + "/database/models.js");
const db = require(__dirname + "/database/dbInterface.js");

// Express App Settings
const app = express();

app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(express.static("public"));

var pwdRead = JSON.parse(
  fs.readFileSync("./password.json", "utf-8")
);

//Load config.json file
var configRead = JSON.parse(
  fs.readFileSync(__dirname + "/config.json", "utf-8")
);
let configWrite = editJsonFile(__dirname + "/config.json");

//Make local or atlas mongoDB connections
var connected = false;
let tryConnect = async url => {
  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useFindAndModify: false
    });
    if (mongoose.connection.readyState === 1) {
      connected = true;
    }
  } catch (error) {
    console.log("Couldn't connect to DB");
  }
};

tryConnect(configRead.mongodbURL);

app.post("/mongosetup", async (req, res) => {
  await tryConnect(req.body.url);
  if (connected) {
    // The connection is good so save URL to file
    // Set reset all button to also reset the config.json file ORRR maybe not
    configWrite.set("mongodbURL", req.body.url);
    configWrite.save();
    res.render("setup");
  } else {
    res.render("mongodbsetup");
  }
});

// Main page get route
app.get("/", (req, res) => {
  if (!connected) {
    res.render("mongodbSetup");
  } else {
    db.getGroups((groups, groupsIsEmpty) => {
      //Check if there is data in the db
      if (groups && !groupsIsEmpty) {
        //Populate settings db with some default prefs
        new dbModels.Setting().save(err => {
          if (!err) {
            db.getSettings(settings => {
              if (settings) {
                let prefs = settings[0];
                res.render("index", {
                  date: support.getDate(),
                  groups: groups,
                  orgName: prefs.orgName,
                  signInText: prefs.signInText,
                  signOutText: prefs.signOutText,
                  signInIcon: prefs.signInIcon,
                  signOutIcon: prefs.signOutIcon,
                  password: pwdRead.pwd
                });
              } else {
                // In case settings is empty for some reason
                res.redirect("/");
              }
            });
          }
        });
      } else {
        // If there is no data in the db, let the user upload a file
        res.render("setup");
      }
    });
  }
});

// Settings page get route
app.get("/settings", (req, res) => {
  db.getGroups((groups, groupsIsEmpty) => {
    if (groups && !groupsIsEmpty) {
      // Get attendances to generate options for export attendance button
      db.getAttendances((attendances, attendancesIsEmpty) => {
        let people = [];
        let minDate = "";
        let maxDate = "";
        if (attendances && !attendancesIsEmpty) {
          attendances.forEach(roll => {
            people.push(roll.name);
          });
          people = _.uniq(people).sort();
          minDate = attendances[0].timestamp.split(" ")[0];
          maxDate = attendances[attendances.length - 1].timestamp.split(" ")[0];
        }
        res.render("settings", {
          people: people,
          minDate: minDate,
          maxDate: maxDate
        });
      });
    } else {
      // If groups is empty
      res.render("setup");
    }
  });
});

//Settings page post request handler
app.post("/settings", (req, res) => {
  let button = req.body.button;
  switch (button) {
    case "home":
      res.redirect("/");
      break;
    case "resetAll":
      mongoose.connection.db.dropDatabase();
      configWrite.set("mongodbURL", "");
      configWrite.save();
      connected = false;
      res.render("mongodbSetup");
      break;
    case "resetAttendance":
      mongoose.connection.collections.attendances.drop();
      res.redirect("/settings");
      break;
    case "update":
      mongoose.connection.collections.groups.drop();
      res.redirect("/");
      break;
    case "preferences":
      res.redirect("/preferences");
      break;
    case "export":
      let exportOptions = req.body;
      // Function for exporting data to CSV
      function exportToFile(attendances, exportOptions) {
        //Filter attendances based on to and from dates
        for (var i = 0; i < attendances.length; i++) {
          var date = new Date(attendances[i].timestamp.split(" ")[0]);
          var from = new Date(exportOptions.fromDate);
          var to = new Date(exportOptions.toDate);
          if (date < from) {
            attendances.splice(i, 1);
          }
          if (date > to) {
            attendances.splice(i, 1);
          }
        }
        var records = [];
        attendances.forEach(attendance => {
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
          path: __dirname + "/temp/exported_data.csv",
          header: [
            {
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
            }
          ]
        });
        csvWriter
          .writeRecords(records) // returns a promise
          .then(() => {
            res.download("./temp/exported_data.csv", "Attendance.csv");
          });
      }
      if (exportOptions.name !== "All Members") {
        dbModels.Attendance.find(
          {
            name: exportOptions.name
          },
          (err, attendances) => {
            if (!err) {
              exportToFile(attendances, exportOptions);
            } else {
              res.render("error", {
                error:
                  "Could not get attendances from database. Please check your internet connection."
              });
            }
          }
        );
      } else {
        db.getAttendances(attendances => {
          if (attendances) {
            exportToFile(attendances, exportOptions);
          } else {
            res.render("error", {
              error:
                "Could not get attendances from database. Please check your internet connection."
            });
          }
        });
      }
      break;
  }
});

//Renders preferences page
app.get("/preferences", (req, res) => {
  db.getGroups((groups, groupsIsEmpty) => {
    if (groups) {
      if (groupsIsEmpty) {
        res.render("setup");
      } else {
        db.getSettings((settings, settingsIsEmpty) => {
          if (settings) {
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
      res.render("error", {
        error:
          "Could not get data from database. Please check your internet connection."
      });
    }
  });
});

//Post request from preferences page handler
app.post("/preferences", (req, res) => {
  let button = req.body.button;
  let pref = req.body;

  if (button == "settings") {
    res.redirect("/settings");
  } else {
    //Change preferences
    mongoose.connection.collections.settings.drop(); //Delete old settings
    var setting = new dbModels.Setting({
      orgName: pref.orgName,
      signOutText: pref.signOutText,
      signOutIcon: pref.signOutIcon,
      signInText: pref.signInText,
      signInIcon: pref.signInIcon
    });
    setting.save(err => {
      if (!err) {
        res.redirect("/settings");
      } else {
        res.render("error", {
          error:
            "Could not save new preferences. Please check your internet connection."
        });
      }
    });
  }
});

//Setup page upload post request handler
app.post("/upload", (req, res) => {
  //Read data from post
  var form = new formidable.IncomingForm();
  form.parse(req);
  form.on("fileBegin", (name, file) => {
    file.path = __dirname + "/temp/" + file.name;
  });
  form.on("file", (name, file) => {
    //Once the CSV file has been uploaded ...
    let data = loader(__dirname + "/temp/" + file.name);
    let groupsToInsert = db.processUploadedCSV(data);
    dbModels.Group.insertMany(groupsToInsert, (err, docs) => {
      if (!err) {
        //Copy file to stored location
        fs.copyFileSync(
          __dirname + "/temp/" + file.name,
          __dirname + "/public/data/current_members.csv"
        );
        fs.unlinkSync(__dirname + "/temp/" + file.name); //Delete file
        res.redirect("/");
      } else {
        console.log("There was an error saving groups from the CSV");
      }
    });
  });
});

//Sign in/out Button click post request handler
app.post("/", (req, res) => {
  var memberID = req.body.memberID;
  var groupID = req.body.groupID;

  //Update currentlyHere status of member of group
  dbModels.Group.findById(
    groupID,
    {
      _id: 0,
      members: 1
    },
    (err, found) => {
      var whichPersonToUpdate = 0;
      found.members.forEach(function(member) {
        if (member._id == memberID) {
          //A workaround to dot notation
          updateStatement = "members." + whichPersonToUpdate + ".currentlyHere";
          var $set = {};
          var roll;
          if (member.currentlyHere) {
            //They signed out
            $set[updateStatement] = false;
            roll = new dbModels.Attendance({
              timestamp: support.getTimestamp(),
              name: member.name,
              action: "Signed Out"
            });
            roll.save();
          } else {
            //They signed in
            $set[updateStatement] = true;
            roll = new dbModels.Attendance({
              timestamp: support.getTimestamp(),
              name: member.name,
              action: "Signed In"
            });
            roll.save();
          }
          dbModels.Group.findOneAndUpdate(
            {
              _id: groupID
            },
            {
              $set: $set
            },
            (err, foundList) => {
              if (!err) {
                setTimeout(function() {
                  res.redirect("/");
                }, 850);
              } else {
                res.render("error", {
                  error:
                    "Could not connect to database, please check your internet connection."
                });
              }
            }
          );
        } else {
          whichPersonToUpdate += 1;
        }
      });
    }
  );
});

//For Heroku
var use_heroku = true;
let port = process.env.PORT;
if (port == null || port == "") {
  var portRead = JSON.parse(
    fs.readFileSync("./port.json", "utf-8")
  );
  port = portRead.port;
  use_heroku = false;
}

//Regular locahost
// let port = 3000

var server = app.listen(port, _ => {
  if (use_heroku) {
    console.log("Server has started Successfully");
  } else {
    console.log(
      "Local server has started successfully on port " +
        colors.white.underline(port)
    );
    (async () => {
      let options = {
        headless: false,
        defaultViewport: null,
        args: ["--disable-infobars", "--start-fullscreen"],
        ignoreHTTPSErrors: true
      };
      if (process.platform == "darwin") {
        options.executablePath =
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
      } else if (process.platform == "win32") {
        options.executablePath =
          "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";
      }
      const browser = await puppeteer.launch(options);
      const page = (await browser.pages())[0];
      await page.goto("http://localhost:" + port);
      browser.on("disconnected", async _ => {
        server.close();
        process.exit();
      });
    })();
  }
});
