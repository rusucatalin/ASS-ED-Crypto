import EventEmitter from "events";
import chalk from "chalk";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "../services/firebase.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const eventEmitter = new EventEmitter();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function authMenu() {
  console.log(chalk.cyan("\n===Auth Menu ==="));
  rl.question(
    chalk.yellow("Select option:\n1 - Sign In\n2 - Sign Up\n"),
    (option) => {
      if (option === "1") {
        console.log(chalk.blue("Sign In"));
        login();
      } else if (option === "2") {
        console.log(chalk.blue("Sign Up"));
        register();
      } else {
        console.log(chalk.red("Invalid option"));
        authMenu();
      }
    },
  );
}

function register() {
  rl.question(chalk.yellow("Email: "), (email) => {
    rl.question(chalk.yellow("Password: "), (password) => {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          console.log(chalk.green("Successfully Sign Up!"));
          eventEmitter.emit("authenticated");
        })
        .catch((error) => {
          console.error(
            chalk.red("Error ocured during sign up:"),
            error.message,
          );
          authMenu();
        });
    });
  });
}

function login() {
  rl.question(chalk.yellow("Email: "), (email) => {
    rl.question(chalk.yellow("Password: "), (password) => {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          console.log(chalk.green("Successfully Sign In!"));
          eventEmitter.emit("authenticated");
        })
        .catch((error) => {
          console.error(
            chalk.red("Error ocured during sign in:"),
            error.message,
          );
          authMenu();
        });
    });
  });
}

function cryptoMenu() {
  console.log(chalk.cyan("\n=== Cryptocurrencies available ==="));
  console.log(chalk.yellow("- btc") + chalk.gray(" (Bitcoin)"));
  console.log(chalk.yellow("- eth") + chalk.gray(" (Ethereum)"));
  console.log(chalk.yellow("- doge") + chalk.gray(" (Dogecoin)\n"));

  rl.question(
    chalk.blue("Select cryptocurrencies (btc/eth/doge): "),
    (crypto) => {
      console.log(chalk.green(`You select: ${crypto}`));
      eventEmitter.emit("cryptoSelected", crypto.toLowerCase());
      setTimeout(() => {
        cryptoMenu();
      }, 2000);
    },
  );
}

eventEmitter.on("authenticated", () => {
  cryptoMenu();
});

export { eventEmitter, authMenu, cryptoMenu };
