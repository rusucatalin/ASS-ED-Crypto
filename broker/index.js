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

process.stdin.setRawMode(true);
process.stdin.resume();

let cryptoHistory = "";

function drawAuthMenu(selectedOption) {
  console.clear();
  console.log(chalk.cyan("\n---| Auth Menu |---\n"));
  console.log(
    selectedOption === 0 ? chalk.green("> Sign In") : chalk.white(" Sign In "),
  );
  console.log(
    selectedOption === 1
      ? chalk.green("> Sign Up ")
      : chalk.white("  Sign Up "),
  );
  console.log(
    chalk.gray(
      "\nUse arrow for navigation ↑↓ after selected option press ENTER",
    ),
  );
}

function drawCryptoMenu(selectedOption, previousData = "") {
  console.clear();
  if (previousData) {
    console.log(previousData);
  }

  console.log(chalk.cyan("\n---| Cryptocurrencies available |---\n"));
  console.log(
    selectedOption === 0
      ? chalk.green("> BTC (Bitcoin)")
      : chalk.white("  BTC (Bitcoin)"),
  );
  console.log(
    selectedOption === 1
      ? chalk.green("> ETH (Ethereum)")
      : chalk.white("  ETH (Ethereum)"),
  );
  console.log(
    selectedOption === 2
      ? chalk.green("> DOGE (Dogecoin)")
      : chalk.white("  DOGE (Dogecoin)"),
  );
  console.log(
    chalk.gray(
      "\nUse arrow for navigation ↑↓ after selected option press ENTER",
    ),
  );
}

function handleAuthMenuKeypress(selectedOption) {
  let currentOption = selectedOption;

  return new Promise((resolve) => {
    process.stdin.once("data", (key) => {
      if (key[0] === 3) {
        process.exit();
      }

      if (key[0] === 27 && key[1] === 91) {
        if (key[2] === 65) {
          currentOption = currentOption > 0 ? currentOption - 1 : 1;
        }
        if (key[2] === 66) {
          currentOption = currentOption < 1 ? currentOption + 1 : 0;
        }
        drawAuthMenu(currentOption);
        resolve(handleAuthMenuKeypress(currentOption));
      }

      if (key[0] === 13) {
        resolve(currentOption);
        return;
      }

      resolve(handleAuthMenuKeypress(currentOption));
    });
  });
}

function handleCryptoMenuKeypress(selectedOption) {
  let currentOption = selectedOption;

  return new Promise((resolve) => {
    process.stdin.once("data", (key) => {
      if (key[0] === 3) {
        process.exit();
      }

      if (key[0] === 27 && key[1] === 91) {
        if (key[2] === 65) {
          currentOption = currentOption > 0 ? currentOption - 1 : 2;
        }
        if (key[2] === 66) {
          currentOption = currentOption < 2 ? currentOption + 1 : 0;
        }
        drawCryptoMenu(currentOption, cryptoHistory);
        resolve(handleCryptoMenuKeypress(currentOption));
      }

      if (key[0] === 13) {
        resolve(currentOption);
        return;
      }

      resolve(handleCryptoMenuKeypress(currentOption));
    });
  });
}

async function authMenu() {
  drawAuthMenu(0);
  const selectedOption = await handleAuthMenuKeypress(0);

  if (selectedOption === 0) {
    console.log(chalk.blue("\nSign In"));
    login();
  } else {
    console.log(chalk.blue("\nSign Up"));
    register();
  }
}

async function cryptoMenu() {
  console.clear();
  drawCryptoMenu(0, cryptoHistory);
  const selectedOption = await handleCryptoMenuKeypress(0);
  const cryptoOptions = ["btc", "eth", "doge"];

  console.log(
    chalk.green(
      `\nAi selectat: ${cryptoOptions[selectedOption].toUpperCase()}`,
    ),
  );
  eventEmitter.emit("cryptoSelected", cryptoOptions[selectedOption]);

  await new Promise((resolve) => setTimeout(resolve, 100));
  cryptoMenu();
}

function register() {
  rl.question(chalk.yellow("\nEmail: "), (email) => {
    rl.question(chalk.yellow("Password: "), (password) => {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          console.log(chalk.green("\nSuccesfully Sign Up!"));
          eventEmitter.emit("authenticated");
        })
        .catch((error) => {
          console.error(chalk.red("\nError on Sign Up:"), error.message);
          setTimeout(() => {
            authMenu();
          }, 2000);
        });
    });
  });
}

function login() {
  rl.question(chalk.yellow("\nEmail: "), (email) => {
    rl.question(chalk.yellow("Password: "), (password) => {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          console.log(chalk.green("\nSuccessfully Sign In!"));
          eventEmitter.emit("authenticated");
        })
        .catch((error) => {
          console.error(chalk.red("\nError on Sign In:"), error.message);
          setTimeout(() => {
            authMenu();
          }, 2000);
        });
    });
  });
}

eventEmitter.on("authenticated", () => {
  cryptoMenu();
});

eventEmitter.on("cryptoData", (data) => {
  const newData = `
${chalk.cyan("---| Cryptocurrencies data |---")}
${chalk.white(`Crypto: ${chalk.yellow(data.name.toUpperCase())}`)}
${chalk.white(`Price: ${chalk.green("$" + data.price)}`)}
${chalk.white(
  `24h Change: ${
    data.change > 0
      ? chalk.green(data.change + "%")
      : chalk.red(data.change + "%")
  }`,
)}
${chalk.white(`Market Cap: ${chalk.green("$" + data.marketCap)}`)}
${chalk.white(`24h Volume: ${chalk.green("$" + data.volume)}`)}
${chalk.white(`Last Updated: ${chalk.blue(data.lastUpdated)}`)}
${chalk.cyan("============================")}
`;

  cryptoHistory = cryptoHistory ? `${cryptoHistory}\n${newData}` : newData;
  console.clear();
  drawCryptoMenu(0, cryptoHistory);
});

export { eventEmitter, authMenu, cryptoMenu };
