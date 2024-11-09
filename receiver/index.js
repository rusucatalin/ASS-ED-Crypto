import { eventEmitter, authMenu } from "../broker/index.js";
import chalk from "chalk";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const cryptoIds = {
  btc: "bitcoin",
  eth: "ethereum",
  doge: "dogecoin",
};

eventEmitter.on("cryptoSelected", async (crypto) => {
  try {
    const cryptoId = cryptoIds[crypto.toLowerCase()];
    if (!cryptoId) {
      console.log(chalk.red(`Cryptocurrencies ${crypto} has no support`));
      return;
    }

    console.log(chalk.yellow(`Fetching data for ${cryptoId}...`));

    const response = await axios.get(`${process.env.COINGECKO_API_URL}`, {
      params: {
        ids: cryptoId,
        vs_currencies: "usd",
        include_market_cap: "true",
        include_24hr_vol: "true",
        include_24hr_change: "true",
        include_last_updated_at: "true",
      },
    });

    if (!response.data || !response.data[cryptoId]) {
      console.log(chalk.red(`No data for ${crypto}`));
      return;
    }

    const data = response.data[cryptoId];

    eventEmitter.emit("cryptoData", {
      name: cryptoId,
      price: data.usd,
      change: data.usd_24h_change?.toFixed(2),
      marketCap: data.usd_market_cap,
      volume: data.usd_24h_vol,
      lastUpdated: new Date(data.last_updated_at * 1000).toLocaleString(),
    });
  } catch (error) {
    if (error.response) {
      console.error(
        chalk.red("API Error:"),
        error.response.status,
        error.response.data,
      );
    } else {
      console.error(chalk.red("Error fetching data:"), error.message);
    }
  }
});

authMenu();
