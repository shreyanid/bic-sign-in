//Generate search bars per group
var options = {
  valueNames: ["name"]
};

//Get all the "-user" IDs
IDs = [];
$("div[id$='-users']").each(function() {
  IDs.push($(this).attr("id"));
});

//Generate search bars per group
IDs.forEach(function(id) {
  list = new List(id, options);
});

//Function for Popup modal on button click
function buttonClicked() {
  $("#myModal").modal(options);
}
