import EventEmitter from "events";
import chalk from "chalk";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { getDatabase, ref, push, set } from "firebase/database";
import { auth } from "../../services/firebase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORTFOLIO_FILE = path.join(__dirname, "../../data/portfolio.json");
const database = getDatabase();

class Portfolio {
  constructor() {
    this.holdings = new Map();
    this.transactions = new Map();
    this.loadPortfolio();
  }

  async loadPortfolio() {
    try {
      const data = await fs.readFile(PORTFOLIO_FILE, "utf8");
      const portfolio = JSON.parse(data);

      if (portfolio.holdings) {
        this.holdings = new Map(
          Object.entries(portfolio.holdings).map(([email, holdings]) => [
            email,
            new Map(Object.entries(holdings)),
          ]),
        );
      }

      if (portfolio.transactions) {
        this.transactions = new Map(Object.entries(portfolio.transactions));
      }
    } catch (error) {
      this.holdings = new Map();
      this.transactions = new Map();
      await this.savePortfolio();
    }
  }

  async savePortfolio() {
    try {
      const portfolioData = {
        holdings: Object.fromEntries(
          Array.from(this.holdings.entries()).map(([email, holdings]) => [
            email,
            Object.fromEntries(holdings),
          ]),
        ),
        transactions: Object.fromEntries(this.transactions),
      };

      await fs.writeFile(
        PORTFOLIO_FILE,
        JSON.stringify(portfolioData, null, 2),
      );
    } catch (error) {
      console.error(chalk.red("Error saving portfolio:", error.message));
    }
  }

  async addHolding(crypto, amount, email) {
    if (!this.holdings.has(email)) {
      this.holdings.set(email, new Map());
    }

    const userHoldings = this.holdings.get(email);
    const currentAmount = userHoldings.get(crypto) || 0;
    userHoldings.set(crypto, currentAmount + parseFloat(amount));

    if (!this.transactions.has(email)) {
      this.transactions.set(email, []);
    }

    const transaction = {
      type: "BUY",
      crypto,
      amount: parseFloat(amount),
      timestamp: Date.now(),
    };

    const userTransactions = this.transactions.get(email);
    userTransactions.push(transaction);

    await this.savePortfolio();
    await this.saveTransactionToDatabase(crypto, amount, email);

    return this.getHoldingInfo(crypto, email);
  }

  async saveTransactionToDatabase(crypto, amount, email) {
    try {
      const transactionRef = ref(database, "portfolio_transactions");
      const newTransactionRef = push(transactionRef);
      await set(newTransactionRef, {
        email,
        crypto,
        amount,
        timestamp: Date.now(),
      });
      console.log(chalk.green(`\nTransaction saved to Firebase for ${email}`));
    } catch (error) {
      console.error(
        chalk.red("Error saving transaction to Firebase:", error.message),
      );
    }
  }

  removeHolding(crypto, amount, email) {
    if (!this.holdings.has(email)) return null;

    const userHoldings = this.holdings.get(email);
    const currentAmount = userHoldings.get(crypto) || 0;
    const newAmount = currentAmount - parseFloat(amount);

    if (newAmount <= 0) {
      userHoldings.delete(crypto);
    } else {
      userHoldings.set(crypto, newAmount);
    }

    this.savePortfolio();
    return this.getHoldingInfo(crypto, email);
  }

  getHolding(crypto, email) {
    if (!this.holdings.has(email)) return 0;
    return this.holdings.get(email).get(crypto) || 0;
  }

  getHoldingInfo(crypto, email) {
    return {
      crypto,
      amount: this.getHolding(crypto, email),
    };
  }

  getAllHoldings(email) {
    if (!this.holdings.has(email)) return [];

    const userHoldings = this.holdings.get(email);
    return Array.from(userHoldings.entries()).map(([crypto, amount]) => ({
      crypto,
      amount,
    }));
  }

  getTransactionHistory(email) {
    if (!this.transactions.has(email)) return [];
    return this.transactions
      .get(email)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}

export const portfolio = new Portfolio();
