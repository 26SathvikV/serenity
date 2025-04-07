document.addEventListener("DOMContentLoaded", () => {
  checkLoggedInAndRedirect();
});

var userbox = document.getElementById("username");
var passbox = document.getElementById("password");
userbox.addEventListener("keyup", fillUser);
passbox.addEventListener("keyup", fillPass);

let usernameFilled, passwordFilled = false;

enterKey(login);

function fillUser() {
  usernameFilled = (!(userbox.value === ""));
  console.log("\"" + userbox.value + "\"");
  changeButton();
}

function fillPass() {
  passwordFilled = (!(passbox.value === ""));
  console.log("\"" + passbox.value + "\"");
  changeButton();
}

async function checkLoggedInAndRedirect() {
  const loggedIn = await checkLoggedIn();
  if (loggedIn) {
    window.location.replace("home.html");
  }
}

function changeButton() {
  if (usernameFilled === true && passwordFilled === true) {
    document.getElementById("next").className = "go";
  }
  else {
    document.getElementById("next").className = "next";
  }
}

function redirectToSignup() {
  window.location.href = "signup.html";
}

async function login() {
  document.getElementById("errtext").innerHTML = "";
  const user = userbox.value;
  console.log(user);
  const enteredPassword = passbox.value;
  console.log(enteredPassword);

  if (user === "" || enteredPassword === "") {
    document.getElementById("errtext").innerHTML = "Please enter a value into all fields.";
  } else {
    const userId = await findCollectionWithVariable("users","username", user);

    if (userId === "-1") {
      document.getElementById("errtext").innerHTML = "It seems this account doesn't exist. Try <a href=\"signup.html\">signing up</a>?";
    } else {
      const hashedPassword = await getSpecificValueFromVariable("users", userId, "password");
      console.log(hashedPassword);

      if (hashedPassword === "-1") {
        document.getElementById("errtext").innerHTML = "The password is incorrect.";
      } else {
        const passwordMatches = await comparePasswords(enteredPassword, hashedPassword);

        if (passwordMatches) {
          // Check if the user's IP address is already stored in the 'loggedin' collection
          const loggedInUserId = await getUserId();

          // If the user's IP address is not stored, add it to the 'loggedin' collection
          if (loggedInUserId === null) {
            await addLoggedInUserWithIPAddress(userId);
          }

          window.location.replace("home.html");
        } else {
          document.getElementById("errtext").innerHTML = "The password is incorrect.";
        }
      }
    }
  }
}