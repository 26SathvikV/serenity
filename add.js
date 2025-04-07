let stage;
let stages = new Map([
  [0, "0"],  //choose group or task session
  [1, "1"],  //create new task session
  [2, "2"],  //populate task session
  [3, "3"],  //create new group
  [4, "4"]  //same as stage 3, but after stage 1
]);
let stageMessages = new Map([
  [0, "Choose Which to Add"],  //choose group or task session
  [1, "Make A New Task Session"],  //create new task session
  [2, "Make A New Task Session"],  //populate task session
  [3, "Make A Group"],  //create new group
  [4, "Make A Group for the Task Session"]  //create new group for stage 1
]);

let sessionName = "";
let timeDate = "";
let timeTime = "";
let tempGroup = "";
let group = "";
let sessionID = "";
let dbElems = new Map([]);
let sessionPath = "";

let sessionTaskName = "";

let groupName = "";
let groupColor = "#000000";

let taskGroupName = "";
let taskGroupColor = "#000000";

document.addEventListener("DOMContentLoaded", () => {
  load();
});

function dropdownClickEvent() {
  document.addEventListener("click", (evt) => {
    const inputElem = document.getElementById("group");
    const dropdownElem = document.getElementById("groupDropdn");
    let targetElem = evt.target; // clicked element      
    do {
      if (targetElem == dropdownElem || targetElem == inputElem) {
        // This is a click inside, does nothing, just return.
        console.log("inside");
        showDropdown();
        return;
      }
      // Go up the DOM
      targetElem = targetElem.parentNode;
    } while (targetElem);
    // This is a click outside.   
    console.log("outside");
    hideDropdown();
  });
}

function colorClickEvent() {
  $('#color').on('input',
    function() {
      changeColor();
    }
  );
}

function taskColorClickEvent() {
  $('#taskGroupColor').on('input',
    function() {
      changeTaskGroupColor();
    }
  );
}

async function load() {
  let user = await getUserId();
  let path = "users/" + user + "/groups";

  dbElems = new Map([]);
  dbElems = await collectionToList(path, "name");
  addDBElems();
  changeCreate();

  stage = 0;
  console.log("Loaded! Loading stage...")
  loadStage();
  if (stage === 1) {
    loadVarsStage1();
    dropdownClickEvent();
  }
  else if (stage === 3) {
    colorClickEvent();
  }
  else if (stage === 4) {
    taskColorClickEvent();
  }
}

async function loadVarsStage1() {
  document.getElementById("name").value = sessionName;
  document.getElementById("date").value = timeDate;
  document.getElementById("time").value = timeTime;
  document.getElementById("group").value = tempGroup;
}

function returnToHome() {
  window.location.replace("home.html");
}

async function setStage(num) {
  stage = num;
  loadStage();
  console.log(num);
  
  if (stage === 1) {
    loadVarsStage1();
    dropdownClickEvent();
  }
  else if (stage === 3) {
    colorClickEvent();
  }
  else if (stage === 4) {
    taskColorClickEvent();
  }
}

function loadStage() {
  console.log("started!");
  for (let i = 0; i < stages.size; i++) {
    let idChosen = stages.get(i);
    let message = stageMessages.get(i);
    console.log(i);
    if (i === stage) {
      document.getElementById(idChosen).style.visibility = "visible";
      document.getElementById("directions").innerHTML = message;
      console.log("visible");
    }
    else {
      document.getElementById(idChosen).style.visibility = "hidden";
      console.log("hidden");
    }
  }
  console.log("ended!");
}

//stage 1 variables
function changeName() {
  sessionName = document.getElementById("name").value;
}

function changeDate() {
  console.log(document.getElementById("date").value);
  timeDate = document.getElementById("date").value;
  console.log(timeDate);
}

function changeTime() {
  console.log(document.getElementById("time").value);
  timeTime = document.getElementById("time").value;
  console.log(timeTime);
}


//stage 2 variables
function changeTaskName() {
  sessionTaskName = document.getElementById("taskName").value;
  console.log(sessionTaskName);
}


//stage 3 variables
function changeGroupName() {
  groupName = document.getElementById("groupName").value;
}

function changeColor() {
  groupColor = document.getElementById("color").value;
  document.getElementById("color").style.backgroundColor = groupColor;
}


//stage 4 variables
function changeTaskGroupName() {
  taskGroupName = document.getElementById("taskGroupName").value;
  console.log(taskGroupName);
}

function changeTaskGroupColor() {
  taskGroupColor = document.getElementById("taskGroupColor").value;
  document.getElementById("taskGroupColor").style.backgroundColor = taskGroupColor;
}





function showDropdown() {
  document.getElementById("groupDropdn").classList.add("show");
}

function hideDropdown() {
  document.getElementById("groupDropdn").classList.remove("show");
}

function addDropdownElement(value, id) {
  let input = document.getElementById("group");
  var div = document.getElementById('groupDropdn');
  console.log("creating element " + value);
  var elem = document.createElement('a');
  elem.textContent = value;

  elem.onclick = function() {
    group = id;
    input.value = value;
    tempGroup = value;
    filterFunction();
  };

  div.appendChild(elem);
}

function removeCreate() {
  let createElem = document.getElementById("create");
  if (createElem != null) {
    createElem.remove();
  }
}

function changeCreate() {
  removeCreate();
  let input = document.getElementById("group");
  let value = input.value;
  var div = document.getElementById('groupDropdn');
  var elem = document.createElement('a');

  if (value == "") {
    elem.textContent = "Type to add an element";
  }
  else {
    elem.textContent = "Add " + value;
    elem.onclick = function() { setStage(4) };
  }

  elem.id = "create";
  div.appendChild(elem);
}

function addDBElems() {
  dbElems.forEach(function(value, key) {
    console.log(key);
    addDropdownElement(key, value);
  })
}

function filterFunction() {
  var input, filter, ul, li, a, i;
  input = document.getElementById("group");
  filter = input.value.toUpperCase();

  changeCreate();

  div = document.getElementById("groupDropdn");
  a = div.getElementsByTagName("a");
  for (i = 0; i < a.length; i++) {
    txtValue = a[i].textContent || a[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      a[i].style.display = "";
    } else {
      a[i].style.display = "none";
    }
  }
}

async function continueTaskSession() {
  if (sessionName != "" && timeDate != "" && timeTime != "" && group != "") {
    document.getElementById("errTaskGroupText").innerHTML = "";

    let user = await getUserId();
    let id = await generateID();
    sessionPath = "users/" + user + "/sessions";

    await createCollectionAtPath(sessionPath, id);
    sessionPath += "/" + id;
    console.log(sessionPath);
    await createVariableAtPath(sessionPath, "name", sessionName);
    await createDate(sessionPath,timeDate,timeTime);
    await createVariableAtPath(sessionPath, "groupID", group);
    await createCollectionAtPath(sessionPath, "tasks");

    setStage(2);

  }
  else {
    document.getElementById("errtext").innerHTML = "Please input a valid value in all fields.";
  }
}

async function addTask() {
  let id = await generateID();
  let taskPath = sessionPath + "/tasks";
  
  await createCollectionAtPath(taskPath, id);
  taskPath += "/" + id;
  await createVariableAtPath(taskPath, "name", sessionTaskName);
  sessionTaskName = "";
}

async function continueTaskCreation() {
  if (sessionTaskName != "") {
    document.getElementById("errTaskGroupText").innerHTML = "";
    addTask();
    document.getElementById("taskName").value = "";
  }
  else {
    document.getElementById("errtext").innerHTML = "Please input a valid value in all fields.";
  }
}

async function finishTaskSession() {
  if (sessionTaskName != "") {
    document.getElementById("errTaskGroupText").innerHTML = "";
    addTask();
    setStage(0);
    sessionName = "";
    timeDate = "";
    timeTime = "";
    tempGroup = "";
    group = "";
    sessionID = "";
    dbElems.clear();
    sessionPath = "";

let sessionTaskName = "";
  }
  else {
    document.getElementById("errtext").innerHTML = "Please input a valid value in all fields.";
  }
  
}

async function addGroup() {
  if (groupName != "") {
    document.getElementById("errGroupText").innerHTML = "";

    let user = await getUserId();
    let id = await generateID();
    let path = "users/" + user + "/groups";

    await createCollectionAtPath(path, id);
    path += "/" + id;
    console.log(path);
    await createVariableAtPath(path, "name", groupName);

    await createVariableAtPath(path, "color", groupColor);
    setStage(0);
  }
  else {
    document.getElementById("errGroupText").innerHTML = "Please input a value in all fields.";
  }
}

async function addTaskGroup() {

  if (taskGroupName != "") {
    document.getElementById("errTaskGroupText").innerHTML = "";

    let user = await getUserId();
    let id = await generateID();
    let path = "users/" + user + "/groups";

    await createCollectionAtPath(path, id);
    path += "/" + id;
    console.log(path);

    await createVariableAtPath(path, "name", taskGroupName);
    await createVariableAtPath(path, "color", taskGroupColor);

    addDropdownElement(key, value);

    setStage(1);
  }
  else {
    document.getElementById("errTaskGroupText").innerHTML = "Please input a value in all fields.";
  }
}