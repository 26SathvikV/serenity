const firebaseConfig = {
  apiKey: "",
  authDomain: "serenity-736ae.firebaseapp.com",
  databaseURL: "https://serenity-736ae-default-rtdb.firebaseio.com",
  projectId: "serenity-736ae",
  storageBucket: "serenity-736ae.appspot.com",
  messagingSenderId: "349692253033",
  appId: "1:349692253033:web:2d825d0dadabb0c169a3f8",
  measurementId: "G-FN6P38X88F"
};

firebase.initializeApp(firebaseConfig);

async function generateID() {
  const chars = [
    ...Array.from(Array(10).keys()), // Numbers 0 to 9
    ...Array.from(Array(26), (_, i) => String.fromCharCode(97 + i)), // Lowercase letters 'a' to 'z'
    ...Array.from(Array(26), (_, i) => String.fromCharCode(65 + i)), // Uppercase letters 'A' to 'Z'
  ];

  const db = firebase.firestore();
  const usersCollectionRef = db.collection("users");

  let isUniqueID = false;
  let generatedID = "";

  while (!isUniqueID) {
    // Generate a new ID
    generatedID = "";
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      generatedID += chars[randomIndex];
    }

    try {
      // Check if the generated ID already exists in the database
      const querySnapshot = await usersCollectionRef.doc(generatedID).get();
      isUniqueID = !querySnapshot.exists;
    } catch (error) {
      console.error('Error checking ID uniqueness:', error);
      // In case of an error, we'll return a fallback value or throw an error as per the requirement
      return null;
    }
  }

  return generatedID;
}

async function findCollectionWithVariable(collectionName, variableName, variableValue) {
  const db = firebase.firestore();
  const collectionRef = db.collection(collectionName);

  try {
    const querySnapshot = await collectionRef.where(variableName, '==', variableValue).get();
    if (!querySnapshot.empty) {
      console.log(querySnapshot.docs[0].id);
      return querySnapshot.docs[0].id;
    } else {
      return "-1";
    }
  } catch (error) {
    console.error('Error:', error);
    return "-1";
  }
}

//even segments
async function getValueFromDocumentVariable(documentPath, variableName) {
  const db = firebase.firestore();
  const documentRef = db.doc(documentPath);

  try {
    const documentSnapshot = await documentRef.get();
    if (documentSnapshot.exists) {
      const documentData = documentSnapshot.data();
      if (variableName in documentData) {
        return documentData[variableName];
      }
    }
    return "-1";
  } catch (error) {
    console.error('Error:', error);
    return "-1";
  }
}

//odd segments
async function getValueFromVariable(collectionName, variableName) {
  const db = firebase.firestore();
  const collectionRef = db.collection(collectionName);

  try {
    const snapshot = await collectionRef.limit(1).get();
    if (!snapshot.empty) {
      const documentData = snapshot.docs[0].data();
      if (variableName in documentData) {
        return documentData[variableName];
      }
    }
    return "-1";
  } catch (error) {
    console.error('Error:', error);
    return "-1";
  }
}

function createCollectionAtPath(path, collectionName) {
  // Initialize Firestore from Firebase (Assuming Firebase has already been initialized)
  const db = firebase.firestore();

  // Create an array to hold the segments
  const segments = path.split('/');
  console.log(path);
  console.log(segments.length);

  // Determine if the path has an odd or even number of segments
  const isOddSegments = segments.length % 2 === 1;
  console.log(isOddSegments);

  // Create a reference to the specified document (even number of segments)
  // or the specified collection (odd number of segments)
  const reference = isOddSegments ? db.collection(path) : db.doc(path);

  // Create a subcollection (if it's a document reference)
  if (isOddSegments) {
    return reference
      .doc(collectionName)
      .set({ /* Initial data for the "temp" document */ })
      .then(() => {
        console.log(`Collection "${collectionName}" with document "temp" created successfully.`);
      })
      .catch((error) => {
        console.error(`Error creating collection "${collectionName}":`, error);
      });
  } else {
    // Create a document called "temp" within the specified collection
    const subcollectionRef = reference.collection(collectionName);
    return subcollectionRef
      .doc("temp")
      .set({ /* Initial data for the "temp" document */ })
      .then(() => {
        console.log(`Collection "${collectionName}" with document "temp" created successfully.`);
      })
      .catch((error) => {
        console.error(`Error creating collection "${collectionName}":`, error);
      });
  }
}

async function removeCollectionAtPath(path) {
  try {
    const db = firebase.firestore();
    const docRef = db.doc(path);
    
    // Check if the document or collection exists at the specified path
    const docSnapshot = await docRef.get();

    if (docSnapshot.exists) {
      // If it exists, delete it
      await docRef.delete();
      console.log(`Document or collection at path "${path}" deleted successfully.`);
    } else {
      console.log(`No document or collection found at path "${path}". Nothing to delete.`);
    }
  } catch (error) {
    console.error(`Error removing document or collection at path "${path}":`, error);
  }
}

async function getSpecificValueFromVariable(collectionName, documentId, variableName) {
  const db = firebase.firestore();
  const collectionRef = db.collection(collectionName);

  try {
    const docRef = collectionRef.doc(documentId);
    const docSnapshot = await docRef.get();

    if (docSnapshot.exists) {
      const documentData = docSnapshot.data();
      if (variableName in documentData) {
        return documentData[variableName];
      }
    }
    return "-1";
  } catch (error) {
    console.error('Error:', error);
    return "-1";
  }
}

async function encodePassword(password) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hashedPassword;
  } catch (error) {
    console.error('Error encoding password:', error);
    return null;
  }
}

async function comparePasswords(plaintextPassword, encodedPassword) {
  console.log(plaintextPassword);
  let hashesPassword = await encodePassword(plaintextPassword);
  console.log(hashesPassword);
  console.log(encodedPassword);
  return (encodedPassword === hashesPassword);
}

async function createVariableAtPath(firebasePath, variableName, value) {
  try {
    const db = firebase.firestore();
    const docRef = db.doc(firebasePath);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      // If the document doesn't exist, create it with the variableName and value
      await docRef.set({ [variableName]: value });
    } else {
      // If the document exists, update only the specified variable
      await docRef.update({ [variableName]: value });
    }
  } catch (error) {
    console.error('Error creating variable:', error);
  }
}

async function collectionToList(collectionPath, variableName) {
  const db = firebase.firestore();
  const collectionRef = db.collection(collectionPath);
  let elems = new Map([]);

  try {
    const querySnapshot = await collectionRef.get();
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.hasOwnProperty(variableName)) {
        elems.set(data[variableName], doc.id);
      }
    });
    return elems;
  } catch (error) {
    console.error("Error getting documents: ", error);
    return elems;
  }
}

async function getIPAddress() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching IP address:', error);
    return null;
  }
}

async function addLoggedInUserWithIPAddress(userId) {
  try {
    const ipAddress = await getIPAddress();
    if (!ipAddress) {
      console.error('IP address not available.');
      return;
    }

    const db = firebase.firestore();
    const loggedinCollectionRef = db.collection('loggedin');

    // Check if the IP address document already exists in the "loggedin" collection
    const ipAddressDocRef = loggedinCollectionRef.doc(ipAddress);
    const ipAddressDocSnapshot = await ipAddressDocRef.get();

    if (ipAddressDocSnapshot.exists) {
      // If the IP address document exists, update it with the user ID
      await ipAddressDocRef.update({ userid: userId }); // Use the "userid" field name and set the value to the user ID
    } else {
      // If the IP address document doesn't exist, create it with the user ID
      await ipAddressDocRef.set({ userid: userId }); // Use the "userid" field name and set the value to the user ID
    }

    console.log('User added to loggedin collection with IP address successfully!');
  } catch (error) {
    console.error('Error adding user to loggedin collection:', error);
  }
}

async function getUserId() {
  try {
    const ipAddress = await getIPAddress();
    if (!ipAddress) {
      console.error('IP address not available.');
      return null;
    }

    const db = firebase.firestore();
    const loggedinCollectionRef = db.collection('loggedin');

    // Query for the document with the matching IP address as a field
    const ipAddressDocRef = loggedinCollectionRef.doc(ipAddress);
    const ipAddressDocSnapshot = await ipAddressDocRef.get();

    if (ipAddressDocSnapshot.exists) {
      // If the IP address document exists, extract the user ID from the document data
      const userId = ipAddressDocSnapshot.data().userid;
      return userId;
    } else {
      console.log('User not found for the given IP address:', ipAddress);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user ID:', error);
    return null;
  }
}

async function checkLoggedIn() {
  const loggedInUserId = await getUserId();

  if (loggedInUserId !== null) {
    return true;
  } else {
    return false;
  }
}

async function signoff() {
  // Get the current IP address using the getIPAddress() function
  const ipAddress = await getIPAddress();
  console.log(ipAddress);

  // Reference to the Firebase Firestore collection
  const firestore = firebase.firestore();
  const collectionRef = firestore.collection("loggedin");
  console.log("initialized collection ref");

  // Delete the document with the current IP address
  const documentRef = collectionRef.doc(ipAddress);
  documentRef
    .delete()
    .then(() => {
      console.log("Document successfully deleted!");

      // Redirect the user to "index.html"
      window.location.href = "index.html";
    })
    .catch((error) => {
      console.error("Error deleting document: ", error);
    });
}


function enterKey(func) {
  document.onkeydown = function(e) {
    if (e.code === "Enter") {
      func();
    }
  };
}

function addredirect() {
  window.location.replace("add.html");
}

async function createDate(path, date, time) {
  let day = date + "T" + time;
  let currentDate = new Date(day);
  let dateString = currentDate.toString();

  createVariableAtPath(path, "date", dateString);
}

async function getDate(documentID, location) {
  let gottenDate = await getSpecificValueFromVariable(documentID, location, "date");
  let taskDate = new Date(gottenDate);
  return taskDate;
}

async function compareDate(date1, date2) {
  if (date1 > date2) {
    return 1;
  }
  else if (date1 < date2) {
    return -1;
  }
  else {
    return 0;
  }
}

async function mostRecentDateName(collectionName) {
  let tasks = await collectionToList(collectionName, "date");
  if (tasks.size > 0) {
    let currentDate = new Date();
    let takenDate = new Date("9999-10-25T01:15");
    let collection = "";
    let name = "";

    for (const x of tasks.entries()) {
      let day = new Date(x[0]);
      let comparison1 = await compareDate(day, currentDate);
      let comparison2 = await compareDate(day, takenDate);
      if (comparison1 > -1 && comparison2 < 1) {
        takenDate = day;
        collection = x[1];
        let path = collectionName + "/" + collection;
        name = await getValueFromDocumentVariable(path, "name");
      }
    }

    if (name === "") {
      return "No upcoming tasks found.";
    }
    else {
      return name;
    }
  }
  else {
    return "No tasks made yet!";
  }
}

async function mostRecentDateId(collectionName) {
  let tasks = await collectionToList(collectionName, "date");
  if (tasks.size > 0) {
    let currentDate = new Date();
    let takenDate = new Date("9999-10-25T01:15");
    let collection = "";

    for (const x of tasks.entries()) {
      let day = new Date(x[0]);
      let comparison1 = await compareDate(day, currentDate);
      let comparison2 = await compareDate(day, takenDate);
      if (comparison1 > -1 && comparison2 < 1) {
        takenDate = day;
        collection = x[1];
        let path = collectionName + "/" + collection;
      }
    }

    if (collection === "") {
      return "No upcoming tasks found.";
    }
    else {
      return collection;
    }
  }
  else {
    return "No tasks made yet!";
  }
}

async function mostRecentDate(collectionName) {
  let tasks = await collectionToList(collectionName, "date");
  console.log(tasks);
  if (tasks.size > 0) {
    let currentDate = new Date();
    let takenDate = new Date("9999-10-25T01:15");
    let collection = "";
    let date = "";

    for (const x of tasks.entries()) {
      let day = new Date(x[0]);
      console.log(day);
      let comparison1 = await compareDate(day, currentDate);
      let comparison2 = await compareDate(day, takenDate);
      console.log(comparison1);
      console.log(comparison2);
      if (comparison1 > -1 && comparison2 < 1) {
        takenDate = day;
        collection = x[1];
        let path = collectionName + "/" + collection;
        date = new Date(await getValueFromDocumentVariable(path, "date"));
        console.log(takenDate);
        console.log(collection);
        console.log(path);
        console.log(date);
      }
    }

    if (date === "") {
      return "All tasks are delayed.";
    }
    else {
      return date;
    }
  }
  else {
    return "No tasks made yet!";
  }
}

async function mostRecentDateDate(collectionName) {
  let date = await mostRecentDate(collectionName);
  let formattedDate = "All tasks are";
  console.log(date);
  if (date !== "No tasks made yet!" && date !== "All tasks are delayed.") {
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    formattedDate = month + "/" + day + "/" + year + " at";
  }
  else if (date === "No tasks made yet!") {
    formattedDate = "Make tasks at";
  }
  return formattedDate;
}

async function mostRecentDateTime(collectionName) {
  let date = await mostRecentDate(collectionName);
  let formattedTime = "delayed.";
  console.log(date);
  if (date !== "No tasks made yet!" && date !== "All tasks are delayed.") {
    let hour = date.getHours();
    let modulation = "am";
    if (hour > 12) {
      hour -= 12;
      modulation = "pm";
    }

    let minute = date.getMinutes();
    if (minute < 10) {
      minute = "0" + minute;
    }

    formattedTime = hour + ":" + minute + " " + modulation;
  }
  else if (date === "No tasks made yet!") {
    formattedTime = "the add button.";
  }
  return formattedTime;
}

async function upcomingDates(collectionName) {
  let tasks = await collectionToList(collectionName, "date");
  let days = new Map();

  if (tasks.size > 0) {
    let currentDate = new Date();
    let collection = "";
    let name = "";
    let upcoming = await mostRecentDateName(collectionName);

    for (const x of tasks.entries()) {
      let day = new Date(x[0]);
      let comparison1 = await compareDate(day, currentDate);
      if (comparison1 > -1) {
        collection = x[1];
        let path = collectionName + "/" + collection;
        name = await getValueFromDocumentVariable(path, "name");

        if (name != upcoming) {
          days.set(name, x[1]);
        }
      }
    }

    if (days.size == 0) {
      days.set("No upcoming tasks!", "null");
    }

    return days;
  }
  else {
    days.set("No upcoming tasks!", "null");
    return days;
  }
}

async function delayedDates(collectionName) {
  let tasks = await collectionToList(collectionName, "date");
  let days = new Map();

  if (tasks.size > 0) {
    let currentDate = new Date();
    let collection = "";
    let name = "";
    let upcoming = await mostRecentDateName(collectionName);

    for (const x of tasks.entries()) {
      let day = new Date(x[0]);
      let comparison1 = await compareDate(day, currentDate);
      if (comparison1 < 0) {
        collection = x[1];
        let path = collectionName + "/" + collection;
        name = await getValueFromDocumentVariable(path, "name");

        if (name != upcoming) {
          days.set(name, x[1]);
        }
      }
    }

    if (days.size == 0) {
      days.set("No delayed tasks!", "null");
    }

    return days;
  }
  else {
    days.set("No delayed tasks!", "null");
    return days;
  }
}