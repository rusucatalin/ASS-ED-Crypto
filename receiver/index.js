import { eventEmitter, authMenu, cryptoMenu } from "../broker/index.js";
import chalk from "chalk";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

import kafka from "kafka-node";
const client = new kafka.KafkaClient({ kafkaHost: "localhost:9092" });

const producer = new kafka.Producer(client);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const cryptoIds = {
  btc: "bitcoin",
  eth: "ethereum",
  doge: "dogecoin",
  ray: "raydium",
  fsusd: "fdusd",
};

function drawLoadingBar(progress) {
  const barLength = 30;
  const filledLength = Math.round(barLength * (progress / 100));
  const emptyLength = barLength - filledLength;

  const filled = "#".repeat(filledLength);
  const empty = ".".repeat(emptyLength);

  process.stdout.write(
    `\r${chalk.cyan("Loading: [")}${chalk.green(filled)}${chalk.gray(empty)}${chalk.cyan("]")} ${progress}%`,
  );
}

async function simulateLoading() {
  for (let i = 0; i <= 100; i += 10) {
    drawLoadingBar(i);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  console.log("\n");
}

eventEmitter.removeAllListeners("cryptoSelected");

eventEmitter.on("cryptoSelected", async (crypto) => {
  try {
    const cryptoId = cryptoIds[crypto.toLowerCase()];
    if (!cryptoId) {
      console.log(chalk.red(`Cryptocurrencies ${crypto} has no support`));
      return;
    }

    console.log(chalk.yellow(`\nFetching data for ${cryptoId}...`));
    await simulateLoading();

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
      throw new Error(`No data for ${crypto}`);
    }

    const data = response.data[cryptoId];

    eventEmitter.emit("updateCryptoData", {
      name: cryptoId,
      price: data.usd,
      change: data.usd_24h_change?.toFixed(2),
      marketCap: data.usd_market_cap,
      volume: data.usd_24h_vol,
      lastUpdated: new Date(data.last_updated_at * 1000).toLocaleString(),
    });
  } catch (error) {
    console.error(chalk.red("\nError:"), error.message);
    eventEmitter.emit("updateCryptoData", {
      name: crypto,
      error: true,
      message: "Failed to fetch data",
    });
  }
});

authMenu();
