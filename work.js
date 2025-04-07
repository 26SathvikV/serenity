let stage = 0;
let stages = new Map([
  [0, "0"],  //set tasks
  [1, "1"],  //pre-work
  [2, "2"],  //work
  [3, "3"],  //break
  [4, "4"],  //end
  [5, "5"],  //consistent
  [6, "6"],  //task-based: set break time
  [7, "7"]   //task-based: set task times
]);
let currentSession;
let currentTasks = new Map([]);
let breakTime;
let counter = 0;
let ended = false;

document.addEventListener("DOMContentLoaded", () => {
  console.log("started");
  load();
});

async function goToHome() {
  window.location.replace("home.html");
}

async function goToSpotify() {
  window.open("https://www.spotify.com", "_blank");
}

async function finish() {
  const id = await getUserId();
  let path = "users/" + id;
  createVariableAtPath(path, "currentTask", "");

  let sessionPath = path + "/sessions/" + currentSession;
  removeCollectionAtPath(sessionPath);
  await goToHome();
}

async function load() {
  stage = 0;
  await findSession();
  console.log("Loaded! Loading stage...")
  await setStage(stage);
  await loadBreakTasks();
}

async function findSession() {
  const id = await getUserId();
  let path = "users/" + id;
  currentSession = await getValueFromDocumentVariable(path, "currentTask");
}

async function loadBreakTasks() {
  const userId = await getUserId();
  let path = "users/" + userId + "/sessions/" + currentSession + "/tasks";
  let breakTasks = await collectionToList(path, "name");
  breakTasks.forEach(function(value, key) {
    console.log(key);
    addBreakDropdownElement(key);
  })
}

async function setStage(num) {
  stage = num;
  loadStage();
  console.log(num);

  if (stage > 0 && stage < 5) {
    document.getElementById("return").style.visibility = "hidden";
  }

  if (stage == 7) {
    loadTaskBased();
  }
}

function loadStage() {
  console.log("started!");
  for (let i = 0; i < stages.size; i++) {
    let idChosen = stages.get(i);
    console.log(i);
    if (i === stage) {
      document.getElementById(idChosen).style.visibility = "visible";
      console.log("visible");
    }
    else {
      document.getElementById(idChosen).style.visibility = "hidden";
      console.log("hidden");
    }
  }
  console.log("ended!");
}

async function getTaskMap() {
  const userId = await getUserId();
  console.log(currentSession);
  let taskPath = "users/" + userId + "/sessions/" + currentSession + "/tasks";
  let tasks = await collectionToList(taskPath, "name");
  console.log(userId);
  console.log(taskPath);
  console.log(tasks);
  return tasks;
}

async function begin() {
  cycle("work");
  setStage(2);
}

async function cycle(step) {
  if (step === "work") {
    let taskList = currentTasks.keys();
    let taskTimes = currentTasks.values();
    let currentTask;
    let currentTime;

    for (const x of currentTasks.keys()) {
      currentTask = x;
      break;
    }

    for (const x of currentTasks.values()) {
      currentTime = x;
      break;
    }

    currentTime *= 60;

    console.log(taskList);
    console.log(taskTimes);
    console.log(currentTask);
    console.log(currentTime);

    let taskTimer = setInterval(function() {
      if (currentTime > 0) {
        currentTime -= 1;
        console.log(currentTime);
      }
      else {
        console.log("done");
        clearInterval(taskTimer);
        currentTasks.delete(currentTask);
        if (currentTasks.size == 0) {
          setStage(4);
        }
        else {
          cycle("break");
          setStage(3);
        }
      }
    }, 1000);
  }
  else {
    let currentBreak = breakTime;
    currentBreak *= 60;

    console.log(currentBreak);

    let breakTimer = setInterval(function() {
      if (currentBreak > 0) {
        let currentMin = currentBreak / 60;
        document.getElementById("timeLeft").innerText = "Time Left:" + currentMin + " min";

        currentBreak -= 1;
        console.log(currentBreak);

        if (ended) {
          console.log("done");
          clearInterval(breakTimer);
          setStage(4);
        }

        if (currentBreak > 60) {
          let currentRem = currentBreak % 60;
          console.log(currentRem);
          if (currentRem == 0) {
            let currentMin = Math.round(currentBreak / 60);
            document.getElementById("timeLeft").innerText = "Time Left: " + currentMin + " minutes";
            console.log("minute passed");
          }
        }
        else {
          document.getElementById("timeLeft").innerText = "Time Left:" + currentBreak + " seconds";
        }
      }
      else {
        console.log("done");
        clearInterval(breakTimer);
        cycle("work");
        setStage(2);
      }
    }, 1000);
  }
}

async function addBreakDropdownElement(value) {
  var divRef = document.getElementById("tasksRemaining");
  console.log("creating element " + value);
  console.log(divRef);

  let currentTaskId = counter;
  let taskId = "task" + currentTaskId;

  const div = document.createElement('div');
  div.classList.add('workTaskContainer');
  div.id = taskId;
  div.onclick = () => remove(currentTaskId);
  console.log(currentTaskId);

  console.log(div);

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'radio';

  console.log(radio);

  const trueRadio = document.createElement('span');
  trueRadio.classList.add('workTaskCheck');

  console.log(trueRadio);

  const text = document.createElement('p');
  text.classList.add('workTask');
  text.textContent = value;

  console.log(text);

  divRef.appendChild(div);

  div.appendChild(radio);
  div.appendChild(trueRadio);
  div.appendChild(text);

  console.log(div);

  counter++;
}

function remove(id) {
  var divRef = document.getElementById("tasksRemaining");
  console.log(divRef);
  console.log(divRef.children.length);

  console.log(id);
  let idString = "task" + id.toString();
  console.log(idString);
  var elem = document.getElementById(idString);
  console.log(elem);
  elem.remove();
  if (divRef.children.length == 0) {
    cycle("work");
  }
}

//consistent task session functions
async function setupConsistent() {
  let workTime = document.getElementById("consistentWork").value;
  breakTime = document.getElementById("consistentBreak").value;
  console.log(workTime);
  console.log(breakTime);

  if (workTime != "" && breakTime != "") {
    document.getElementById("consistentErrText").innerText = "";

    workTime = parseInt(workTime);
    breakTime = parseInt(breakTime);

    let tempTasks = await getTaskMap();
    tempTasks.forEach(function(value, key) {
      console.log(key);
      currentTasks.set(key, workTime);
    })

    setStage(1);
  }
  else {
    document.getElementById("consistentErrText").innerText = "Please fill in all fields.";
  }
}

//task-based task session functions
async function loadTaskBased() {
  let tasks = await getTaskMap();
  tasks.forEach(function(value, key) {
    console.log(key);
    addTaskBasedDropdownElement(key);
  })
}

function addTaskBasedDropdownElement(value) {
  var div = document.getElementById("taskBasedDropdown");

  var taskContainer = document.createElement('div');
  taskContainer.classList.add('taskBasedTaskContainer');

  var title = document.createElement('h3');
  title.classList.add('taskBasedInput');
  title.textContent = value;
  title.style.marginRight = '50%';

  var centerContainer = document.createElement('div');
  centerContainer.classList.add('taskBasedCenterContainer');

  var timeInput = document.createElement('input');
  timeInput.type = 'number';
  timeInput.classList.add('smallNumInput');
  timeInput.id = value + 'TaskBasedTask';
  timeInput.name = value + 'TaskBasedTask';
  timeInput.autocomplete = 'off';

  var text = document.createElement('p');
  text.textContent = 'min';
  text.style.marginLeft = '10px';

  div.appendChild(taskContainer);

  taskContainer.appendChild(title);
  taskContainer.appendChild(centerContainer);

  centerContainer.appendChild(timeInput);
  centerContainer.appendChild(text);
}

async function startSetupTaskBased() {
  breakTime = document.getElementById("taskBasedBreak").value;
  console.log(breakTime);

  if (breakTime != "") {
    document.getElementById("taskBasedBreakErrText").innerText = "";

    breakTime = parseInt(breakTime);
    setStage(7);
  }
  else {
    document.getElementById("taskBasedBreakErrText").innerText = "Please fill in the field above.";
  }
}

async function endSetupTaskBased() {
  let allTimesFull = true;

  let workTimes = new Map([]);
  let counter = 0;
  let tasks = await getTaskMap();
  tasks.forEach(function(value, key) {
    let id = key + "TaskBasedTask";
    let time = document.getElementById(id).value;

    console.log(key);
    console.log(id);
    console.log(time);

    if (time != "") {
      workTimes.set(key, time)
      counter++;
    }
    else {
      allTimesFull = false;
    }
  })
  console.log(workTimes);

  if (allTimesFull) {
    document.getElementById("taskBasedTaskErrText").innerText = "";

    workTimes.forEach(function(value, key) {
      console.log(key);
      console.log(value);
      currentTasks.set(key, value);
    })

    setStage(1);
  }
  else {
    document.getElementById("taskBasedTaskErrText").innerText = "Please fill in all fields.";
  }
}
