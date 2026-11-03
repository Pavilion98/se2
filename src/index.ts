import path from "path";
import { parseCSV } from "./utils/parsers/parser";
import logger from "./utils/logger";

const filePath = path.resolve(__dirname, "./data/Cake orders.csv");

async function main() {
  try {
    const products = await parseCSV(filePath);
    for (const product of products) {
      logger.info(product + "\n");
    }
  } catch (error) {
    logger.error(error);
  }
}

main();
