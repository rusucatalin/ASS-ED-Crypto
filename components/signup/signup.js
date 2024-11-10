import chalk from "chalk";
import { createUserWithEmailAndPassword } from "../../services/firebase.js";
import { eventEmitter } from "../../broker/index.js";

function register(auth, rl) {
  return new Promise((resolve) => {
    rl.question(chalk.yellow("\nEmail: "), async (email) => {
      rl.question(chalk.yellow("Password: "), async (password) => {
        try {
          console.log(chalk.blue("\nAttempting to create account..."));
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );
          console.log(chalk.green("\nSuccessfully Sign Up!"));
          eventEmitter.emit("authenticated", userCredential.user);
          resolve(userCredential.user);
        } catch (error) {
          let errorMessage = "";
          switch (error.code) {
            case "auth/network-request-failed":
              errorMessage =
                "Network error. Please check your internet connection and Firebase configuration.";
              break;
            case "auth/email-already-in-use":
              errorMessage = "Email already registered.";
              break;
            case "auth/weak-password":
              errorMessage = "Password should be at least 6 characters.";
              break;
            case "auth/invalid-email":
              errorMessage = "Invalid email format.";
              break;
            default:
              errorMessage = `Error (${error.code}): ${error.message}`;
          }
          console.error(chalk.red("\nError on Sign Up:"), errorMessage);
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

export { register };
