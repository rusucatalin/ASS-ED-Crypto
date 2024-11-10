import EventEmitter from "events";
import chalk from "chalk";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORTFOLIO_FILE = path.join(__dirname, "../data/portfolio.json");

class Portfolio {
  constructor() {
    this.holdings = new Map();
    this.loadPortfolio();
  }

  async loadPortfolio() {
    try {
      const data = await fs.readFile(PORTFOLIO_FILE, "utf8");
      const portfolio = JSON.parse(data);
      this.holdings = new Map(Object.entries(portfolio));
    } catch (error) {
      this.holdings = new Map();
      await this.savePortfolio();
    }
  }

  async savePortfolio() {
    try {
      const portfolioData = Object.fromEntries(this.holdings);
      await fs.writeFile(
        PORTFOLIO_FILE,
        JSON.stringify(portfolioData, null, 2),
      );
    } catch (error) {
      console.error(chalk.red("Error saving portfolio:", error.message));
    }
  }

  addHolding(crypto, amount) {
    const currentAmount = this.holdings.get(crypto) || 0;
    this.holdings.set(crypto, currentAmount + parseFloat(amount));
    this.savePortfolio();
    return this.getHoldingInfo(crypto);
  }

  removeHolding(crypto, amount) {
    const currentAmount = this.holdings.get(crypto) || 0;
    const newAmount = currentAmount - parseFloat(amount);

    if (newAmount <= 0) {
      this.holdings.delete(crypto);
    } else {
      this.holdings.set(crypto, newAmount);
    }

    this.savePortfolio();
    return this.getHoldingInfo(crypto);
  }

  getHolding(crypto) {
    return this.holdings.get(crypto) || 0;
  }

  getHoldingInfo(crypto) {
    return {
      crypto,
      amount: this.getHolding(crypto),
    };
  }

  getAllHoldings() {
    return Array.from(this.holdings.entries()).map(([crypto, amount]) => ({
      crypto,
      amount,
    }));
  }
}

export const portfolio = new Portfolio();
