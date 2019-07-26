const { app, BrowserWindow } = require("electron");
const path = require("path");
require(__dirname + "/app.js");
const electron = require("electron");
const dialog = electron.dialog;

// Disable error dialogs by overriding
dialog.showErrorBox = function(title, content) {
  console.log(`${title}\n${content}`);
};

let mainWindow = null;

function main() {
  mainWindow = new BrowserWindow({
    backgroundColor: "#f5f6fA",
    title: "Sign In",
    show: false
  });
  mainWindow.maximize();
  mainWindow.loadURL(`http://localhost:3005/`);

  mainWindow.on("ready-to-show", function() {
    mainWindow.reload();
    setTimeout(function() {
      mainWindow.show();
      mainWindow.focus();
    }, 500);
  });
  mainWindow.on("close", event => {
    mainWindow = null;
  });
}

app.on("ready", main);
