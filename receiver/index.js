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
      console.log(chalk.red(`Cryptocurrencie ${crypto} has no support`));
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
    console.log(chalk.cyan("\n=== Cryptocurrencies information ==="));
    console.log(chalk.white(`Crypto: ${chalk.yellow(cryptoId.toUpperCase())}`));
    console.log(chalk.white(`Price: ${chalk.green("$" + data.usd)}`));
    console.log(
      chalk.white(
        `24h Change: ${
          data.usd_24h_change > 0
            ? chalk.green(data.usd_24h_change?.toFixed(2) + "%")
            : chalk.red(data.usd_24h_change?.toFixed(2) + "%")
        }`,
      ),
    );
    console.log(
      chalk.white(`Market Cap: ${chalk.green("$" + data.usd_market_cap)}`),
    );
    console.log(
      chalk.white(`24h Volume: ${chalk.green("$" + data.usd_24h_vol)}`),
    );
    console.log(
      chalk.white(
        `Last Updated: ${chalk.blue(new Date(data.last_updated_at * 1000).toLocaleString())}`,
      ),
    );
    console.log(chalk.cyan("============================\n"));
  } catch (error) {
    if (error.response) {
      console.error(
        chalk.red("API Error:"),
        error.response.status,
        error.response.data,
      );
    } else {
      console.error(
        chalk.red("Error while fetching data about crypto:"),
        error.message,
      );
    }
  }
});

console.log(
  chalk.magenta("Current registered events:"),
  eventEmitter.eventNames(),
);
authMenu();
