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

  async getCryptoPrice(crypto) {
    const cryptoMap = {
      BTC: "bitcoin",
      ETH: "ethereum",
      DOGE: "dogecoin",
      RAY: "raydium",
    };

    try {
      const response = await fetch(
        `${process.env.COINGECKO_API_URL}?ids=${cryptoMap[crypto]}&vs_currencies=usd&x_cg_demo_api_key=${process.env.COINGECKO_API_KEY}`,
      );
      const data = await response.json();
      return data[cryptoMap[crypto]].usd;
    } catch (error) {
      console.error(chalk.red("Error fetching price:", error.message));
      return null;
    }
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
    const price = await this.getCryptoPrice(crypto);
    const usdValue = price * parseFloat(amount);

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
      usdValue,
      pricePerUnit: price,
      timestamp: Date.now(),
    };

    const userTransactions = this.transactions.get(email);
    userTransactions.push(transaction);

    await this.savePortfolio();
    await this.saveTransactionToDatabase(
      crypto,
      amount,
      usdValue,
      price,
      email,
    );
    return this.getHoldingInfo(crypto, email);
  }

  async saveTransactionToDatabase(
    crypto,
    amount,
    usdValue,
    pricePerUnit,
    email,
  ) {
    try {
      const transactionRef = ref(database, "portfolio_transactions");
      const newTransactionRef = push(transactionRef);
      await set(newTransactionRef, {
        email,
        crypto,
        amount,
        usdValue,
        pricePerUnit,
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

  async getHoldingInfo(crypto, email) {
    const amount = this.getHolding(crypto, email);
    const price = await this.getCryptoPrice(crypto);
    const usdValue = price * amount;

    return {
      crypto,
      amount,
      pricePerUnit: price,
      usdValue,
    };
  }

  async getAllHoldings(email) {
    if (!this.holdings.has(email)) return [];
    const userHoldings = this.holdings.get(email);

    const holdingsWithPrices = await Promise.all(
      Array.from(userHoldings.entries()).map(async ([crypto, amount]) => {
        const price = await this.getCryptoPrice(crypto);
        return {
          crypto,
          amount,
          pricePerUnit: price,
          usdValue: price * amount,
        };
      }),
    );

    return holdingsWithPrices;
  }

  getTransactionHistory(email) {
    if (!this.transactions.has(email)) return [];
    return this.transactions
      .get(email)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}

export const portfolio = new Portfolio();
