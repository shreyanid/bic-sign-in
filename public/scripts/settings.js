//jshint esversion: 9
function makeResetAttendance() {
  let $button = $('<button/>', {
    type: "submit",
    class: "btn btn-danger btn-lg btn-block setting-button",
    name: "button",
    value: "resetAttendance"
  });
  $button.text("Click Again To Confirm Resetting Attendance Data");
  return $button;
}

function makeResetAll() {
  let $button = $('<button/>', {
    type: "submit",
    class: "btn btn-danger btn-lg btn-block setting-button",
    name: "button",
    value: "resetAll"
  });
  $button.text("Click Again To Confirm Resetting All Data");
  return $button;
}

function clickedResetAtt() {
  $(".reset-att").empty();
  $(".reset-att").append(makeResetAttendance());
}

function clickedResetAll() {
  $(".reset-all").empty();
  $(".reset-all").append(makeResetAll());
}

function makeUpdateButton() {
  let $button = $('<button/>', {
    type: "submit",
    class: "btn btn-warning btn-lg btn-block setting-button update-button",
    name: "button",
    value: "update"
  });
  $button.text("Click Again To Update Organization Members");
  return $button;
}

function clickedUpdate() {
  $(".update-button-container").empty();
  $(".update-button-container").append(makeUpdateButton());
}
