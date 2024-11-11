import chalk from "chalk";
import { signInWithEmailAndPassword } from "../../services/firebase.js";
import { eventEmitter } from "../../broker/index.js";

function login(auth, rl) {
  return new Promise((resolve) => {
    rl.question(chalk.yellow("\nEmail: "), async (email) => {
      rl.question(chalk.yellow("Password: "), async (password) => {
        try {
          console.log(chalk.blue("\nAttempting to sign in..."));
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
          );
          console.log(chalk.green("\nSuccessfully Sign In!"));
          eventEmitter.emit("authenticated", userCredential.user);
          resolve(userCredential.user);
        } catch (error) {
          let errorMessage = "";
          switch (error.code) {
            case "auth/network-request-failed":
              errorMessage =
                "Network error. Please check your internet connection and Firebase configuration.";
              break;
            case "auth/user-not-found":
              errorMessage = "No user found with this email.";
              break;
            case "auth/wrong-password":
              errorMessage = "Incorrect password.";
              break;
            case "auth/invalid-email":
              errorMessage = "Invalid email format.";
              break;
            default:
              errorMessage = `Error (${error.code}): ${error.message}`;
          }
          console.error(chalk.red("\nError on Sign In:"), errorMessage);
          console.log(chalk.yellow("\nRetrying in 2 seconds..."));
          setTimeout(() => {
            eventEmitter.emit("showAuthMenu");
          }, 2000);
          resolve(null);
        }
      });
    });
  });
}

export { login };
