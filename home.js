let loadedIn = false;

function fadeIn(object, durationInSeconds) {
  object.style.opacity = 0;
  const numberOfSteps = 50; // Adjust as needed for desired smoothness
  const interval = (durationInSeconds * 1000) / numberOfSteps;
  const opacityStep = 1 / numberOfSteps;
  let currOpacity = 0;

  let fadeInterval = setInterval(() => {
    currOpacity += opacityStep;
    object.style.opacity = currOpacity;

    if (currOpacity >= 1) {
      clearInterval(fadeInterval);
    }
  }, interval);
}

async function checkLoggedInAndRedirect() {
  const loggedIn = await checkLoggedIn();
  if (!loggedIn) {
    window.location.replace("index.html");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  checkLoggedInAndRedirect();
  load();
});

let cachedUserData = null;

async function addTasks(id) {
  let path = "users/" + id + "/sessions";
  let name = await mostRecentDateName(path);
  document.getElementById("nexttaskname").innerHTML = name;

  if (!(name === "All tasks are delayed." || name === "No tasks made yet!")) {
    document.getElementById("nexttaskschedge").innerHTML = "Scheduled For:";
    let mostRecentId = await mostRecentDateId(path);
    document.getElementById("nexttaskschedge").onclick = begin(mostRecentId);
  }

  document.getElementById("nexttaskdate").innerHTML = await mostRecentDateDate(path);
  document.getElementById("nexttasktime").innerHTML = await mostRecentDateTime(path);

  let upcomingMap = await upcomingDates(path);
  console.log(upcomingMap);
  upcomingMap.forEach(function(value, key) {
    console.log(key);
    addDropdownElement(key, value, "upcomingDropdn");
  })

  let delayedMap = await delayedDates(path);
  console.log(delayedMap);
  delayedMap.forEach(function(value, key) {
    console.log(key);
    addDropdownElement(key, value, "delayedDropdn");
  })

  loadedIn = true;
}

function addDropdownElement(value, id, dropdownid) {
  console.log(id);
  if (id === "null") {
    addTextDropdownElement(value, id, dropdownid);
  }
  else {
    addTaskDropdownElement(value, id, dropdownid);
  }
}

async function addTaskDropdownElement(value, id, dropdownid) {
  var divRef = document.getElementById(dropdownid);
  console.log("creating element " + value + " with id " + id + " in " + dropdownid);
  console.log(divRef);

  const userId = await getUserId();
  let path = "users/" + userId + "/sessions/" + id;
  const group = await getValueFromDocumentVariable(path, "groupID");
  let groupPath = "users/" + userId + "/groups/" + group;
  let groupColor = await getValueFromDocumentVariable(groupPath, "color");

  console.log(group);
  console.log(groupPath);
  console.log(groupColor);
  console.log("");

  var div = document.createElement('div');
  div.className = "homeTaskDiv";

  var innerDiv = document.createElement('div');
  innerDiv.className = "homeTaskInnerDiv";

  var color = document.createElement('div');
  color.className = "homeTaskColor";
  color.style.backgroundColor = groupColor;

  var elem = document.createElement('a');
  elem.textContent = value;
  elem.className = "homeTask";
  var br = document.createElement("br");

  div.onclick = function() {
    begin(id);
  };

  console.log(elem);

  divRef.appendChild(br);
  divRef.appendChild(div);

  div.appendChild(color);
  div.appendChild(innerDiv);

  innerDiv.appendChild(elem);
}

async function addTextDropdownElement(value, id, dropdownid) {
  var div = document.getElementById(dropdownid);
  console.log("creating element " + value + " with id " + id + " in " + dropdownid);
  console.log(div);
  var elem = document.createElement('p');
  elem.textContent = value;

  console.log(elem);

  div.appendChild(elem);
}

async function load() {
  const loggedIn = await checkLoggedIn();
  if (!loggedIn) {
    console.log("Redirecting to index.html");
    window.location.replace("index.html");
  } else {
    console.log("User is logged in");
    const id = await getUserId();
    console.log(id);
    if (id === "-1") {
      console.log("Error getting user ID");
      return;
    } else {
      // Check if user data is already cached
      if (cachedUserData && cachedUserData.id === id) {
        // Use cached data if available
        const name = cachedUserData.name;
        const msg = "Welcome, " + name + "!";
        document.getElementById("welcometext").innerHTML = msg;
      } else {
        await addTasks(id);

        const collectionName = "users"; // Update this with the correct collection name if needed
        const variableName = "name"; // The name of the variable you want to fetch
        const name = await getSpecificValueFromVariable(collectionName, id, variableName);

        // Cache the user data for future use
        cachedUserData = { id, name };

        const msg = "Welcome, " + name + "!";
        const welcomebox = document.getElementById("welcometext");
        welcomebox.style.opacity = 0;
        welcomebox.innerHTML = msg;
        fadeIn(welcomebox, 1);
      }
    }
  }
}

async function begin(taskID) {
  const id = await getUserId();
  let path = "users/" + id;
  createVariableAtPath(path, "currentTask", taskID);

  if (loadedIn) {
    window.location.replace("work.html");
  }
}