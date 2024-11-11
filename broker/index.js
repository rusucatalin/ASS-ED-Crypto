import EventEmitter from "events";
import chalk from "chalk";
import { auth } from "../services/firebase.js";
import { login } from "../components/sigin/signin.js";
import { register } from "../components/signup/signup.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";
import readline from "readline";
import { portfolio } from "../components/portfolio/portfolio.js";

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
    selectedOption === 3
      ? chalk.green("> Add to Portfolio")
      : chalk.white("  Add to Portfolio"),
  );
  console.log(
    selectedOption === 4
      ? chalk.green("> View Portfolio")
      : chalk.white("  View Portfolio"),
  );
  console.log(
    selectedOption === 5
      ? chalk.green("> Transaction History")
      : chalk.white("  Transaction History"),
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
          currentOption = currentOption > 0 ? currentOption - 1 : 5;
        }
        if (key[2] === 66) {
          currentOption = currentOption < 5 ? currentOption + 1 : 0;
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
    await login(auth, rl);
  } else {
    console.log(chalk.blue("\nSign Up"));
    await register(auth, rl);
  }
}

function addToPortfolio(email) {
  return new Promise((resolve) => {
    console.clear();
    console.log(chalk.cyan("\n---| Add to Portfolio |---\n"));

    rl.question(chalk.yellow("Enter crypto (BTC/ETH/DOGE): "), (crypto) => {
      if (!["BTC", "ETH", "DOGE"].includes(crypto.toUpperCase())) {
        console.log(chalk.red("\nInvalid cryptocurrency!"));
        setTimeout(() => resolve(), 2000);
        return;
      }

      rl.question(chalk.yellow("Enter amount: "), (amount) => {
        if (isNaN(amount) || parseFloat(amount) <= 0) {
          console.log(chalk.red("\nInvalid amount!"));
          setTimeout(() => resolve(), 2000);
          return;
        }

        const holding = portfolio.addHolding(
          crypto.toUpperCase(),
          parseFloat(amount),
          email,
        );
        console.log(
          chalk.green(
            `\nAdded ${amount} ${crypto.toUpperCase()} to portfolio!`,
          ),
        );
        setTimeout(() => resolve(), 2000);
      });
    });
  });
}

function viewPortfolio() {
  return new Promise((resolve) => {
    console.clear();
    console.log(chalk.cyan("\n---| Your Portfolio |---\n"));

    const holdings = portfolio.getAllHoldings();

    if (holdings.length === 0) {
      console.log(chalk.yellow("Your portfolio is empty!"));
    } else {
      holdings.forEach((holding) => {
        console.log(
          chalk.white(`${holding.crypto}: ${chalk.green(holding.amount)}`),
        );
      });
    }

    console.log(chalk.gray("\nPress any key to continue..."));
    process.stdin.once("data", () => resolve());
  });
}

function viewTransactionHistory() {
  return new Promise((resolve) => {
    console.clear();
    console.log(chalk.cyan("\n---| Transaction History |---\n"));

    const transactions = portfolio.getTransactionHistory();

    if (transactions.length === 0) {
      console.log(chalk.yellow("No transactions found!"));
    } else {
      transactions.forEach((tx) => {
        const date = new Date(tx.timestamp).toLocaleString();
        console.log(
          chalk.white(
            `${date} - ${tx.type}: ${chalk.green(tx.amount)} ${tx.crypto}`,
          ),
        );
      });
    }

    console.log(chalk.gray("\nPress any key to continue..."));
    process.stdin.once("data", () => resolve());
  });
}

async function cryptoMenu() {
  console.clear();
  drawCryptoMenu(0, cryptoHistory);
  const selectedOption = await handleCryptoMenuKeypress(0);
  const cryptoOptions = ["btc", "eth", "doge"];

  if (selectedOption === 3) {
    await addToPortfolio();
  } else if (selectedOption === 4) {
    await viewPortfolio();
  } else if (selectedOption === 5) {
    await viewTransactionHistory();
  } else {
    console.log(
      chalk.green(`\nSelected: ${cryptoOptions[selectedOption].toUpperCase()}`),
    );
    eventEmitter.emit("cryptoSelected", cryptoOptions[selectedOption]);
  }

  await new Promise((resolve) => setTimeout(resolve, 100));
  cryptoMenu();
}

function createTrendBar(change, isPositive) {
  const maxBars = 20;
  const bars = Math.min(Math.round((change / 10) * maxBars), maxBars);
  const symbol = isPositive ? chalk.green("▲") : chalk.red("▼");
  return symbol.repeat(bars);
}

eventEmitter.on("authenticated", () => {
  cryptoMenu();
});

eventEmitter.removeAllListeners("updateCryptoData");

eventEmitter.on("updateCryptoData", (data) => {
  let newData;
  if (data.error) {
    newData = `
${chalk.cyan("---| Error |---")}
${chalk.red(data.message)}
${chalk.cyan("============================")}`;
  } else {
    newData = `
${chalk.cyan("---| Cryptocurrencies data |---")}
${chalk.white(`Crypto: ${chalk.yellow(data.name.toUpperCase())}`)}
${chalk.white(`Price: ${chalk.green("$" + data.price)}`)}
${chalk.white(
  `24h Change: ${
    data.change > 0
      ? chalk.green(`↗ ${data.change}% ${createTrendBar(data.change, true)}`)
      : chalk.red(
          `↘ ${data.change}% ${createTrendBar(Math.abs(data.change), false)}`,
        )
  }`,
)}
${chalk.white(`Market Cap: ${chalk.green("$" + data.marketCap)}`)}
${chalk.white(`24h Volume: ${chalk.green("$" + data.volume)}`)}
${chalk.white(`Last Updated: ${chalk.blue(data.lastUpdated)}`)}
${chalk.cyan("============================")}`;
  }

  cryptoHistory = cryptoHistory ? `${cryptoHistory}\n${newData}` : newData;

  console.clear();
  drawCryptoMenu(0, cryptoHistory);
});

export { eventEmitter, authMenu, cryptoMenu };
