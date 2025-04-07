let step = 0;
let id = "1";

async function changeID() {
  id = await generateID();
}

changeID();

enterKey(signup);

function redirectToLogin() {
  window.location.href = "index.html";
}

document.getElementById("next").addEventListener("click", async () => {
  await signup();
});

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function isUsernameValid(username) {
  const db = firebase.firestore();
  const usersCollectionRef = db.collection("users");

  try {
    const querySnapshot = await usersCollectionRef.where("username", "==", username).get();
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

async function isEmailValid(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  const db = firebase.firestore();
  const usersCollectionRef = db.collection("users");

  try {
    const querySnapshot = await usersCollectionRef.where("email", "==", email).get();
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

let isEmailValidResult = false;
let isUsernameValidResult = false;

async function signup() {
  document.getElementById("errtext").innerHTML = "";
  let value = document.getElementById("input").value;
  console.log(value);
  let path = "users/" + id;

  if (value === "") {
    document.getElementById("errtext").innerHTML = "Please put in a value.";
  } else {
    let types = ["name", "email", "username", "password"];
    let type = types[step];

    let userDoc;
    try {
      const db = firebase.firestore();
      const docRef = db.doc(path);
      const docSnapshot = await docRef.get();
      if (docSnapshot.exists) {
        userDoc = docSnapshot.data();
      }
    } catch (error) {
      console.error('Error retrieving user document:', error);
      return;
    }

    if (step === 0) {
      try {
        // If it's step 0 (name), create the document with the name and proceed to the next step (email)
        await createCollectionAtPath("users", id); // Create the collection with the randomly generated ID
        // Save the name in the document
        const db = firebase.firestore();
        await db.doc(path).set({ [type]: value }, { merge: true });
        step++;
        document.getElementById("inputtext").innerHTML = capitalizeFirstLetter(types[step]);
        document.getElementById("input").value = "";
      } catch (error) {
        console.error('Error creating user document:', error);
        return;
      }
    } else if (step === 1) { // Step 1: Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        document.getElementById("errtext").innerHTML = "Please enter a valid email address.";
        document.getElementById("input").value = "";
        return;
      }

      // No need to check if the email is available, proceed to store it
      let emailFieldName = "email";
      let counter = 2;
      while (userDoc && userDoc[emailFieldName]) {
        emailFieldName = `email_${counter}`;
        counter++;
      }

      try {
        const db = firebase.firestore();
        await db.doc(path).set({ ...userDoc, [emailFieldName]: value }, { merge: true });
        step++; // Increment step to proceed to the next stage (username)
        document.getElementById("inputtext").innerHTML = capitalizeFirstLetter(types[step]);
        document.getElementById("input").value = "";
      } catch (error) {
        console.error('Error updating user document:', error);
        return;
      }
    } else if (step === 2) { // Step 2: Username
      if (isUsernameValidResult) {
        step++; // Move to the next step (password)
        document.getElementById("inputtext").innerHTML = capitalizeFirstLetter(types[step]);
        document.getElementById("input").value = "";
      } else {
        const isUsernameAvailable = await isUsernameValid(value);
        if (!isUsernameAvailable) {
          document.getElementById("errtext").innerHTML = "That username is occupied. Please choose another username.";
          return;
        }

        try {
          const db = firebase.firestore();
          await db.doc(path).set({ ...userDoc, [type]: value }, { merge: true });
          isUsernameValidResult = true; // Mark username as collected and validated
          step++; // Move to the next step (password)
          document.getElementById("inputtext").innerHTML = capitalizeFirstLetter(types[step]);
          document.getElementById("input").value = "";
          document.getElementById("next").innerHTML = "Go!";
          document.getElementById("next").className = "go";
        } catch (error) {
          console.error('Error updating user document:', error);
          return;
        }
      }
    } else if (step === 3) { // Step 3: Password
      try {
        const ip = await getIPAddress();
        const db = firebase.firestore();
        const userPath = "users/" + id;

        // Encode the password before saving it in the document
        console.log(value);
        const hashedPassword = await encodePassword(value);
        console.log(hashedPassword);

        // Update the user document with the hashed password
        await db.doc(path).set({ ...userDoc, [type]: hashedPassword }, { merge: true });

        // Create the "sessions" collection
        await createCollectionAtPath(userPath, "sessions");

        // Create the "groups" collection
        await createCollectionAtPath(userPath, "groups");

        await addLoggedInUserWithIPAddress(id);

        // Redirect to the home page
        //window.location.replace("home.html");
      } catch (error) {
        console.error('Error updating user document:', error);
        return;
      }
    }
  }
}