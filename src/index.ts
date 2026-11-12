import path from "path";
import { parseFile } from "./utils/parsers/parser";
import logger from "./utils/logger";

interface ParserDemoFile {
  label: string;
  filePath: string;
}

const demoFiles: ParserDemoFile[] = [
  {
    label: "Cake orders CSV",
    filePath: path.resolve(__dirname, "./data/cake orders.csv"),
  },
  {
    label: "Book orders JSON",
    filePath: path.resolve(__dirname, "./data/book orders.json"),
  },
  {
    label: "Toy orders XML",
    filePath: path.resolve(__dirname, "./data/toy orders.xml"),
  },
];

const countRecords = (data: unknown): number => {
  if (!Array.isArray(data)) {
    throw new Error(
      "Parser returned an unexpected shape; expected an array of records.",
    );
  }

  return data.length;
};

async function main() {
  for (const demoFile of demoFiles) {
    try {
      const records = await parseFile(demoFile.filePath);

      logger.info(
        "%s parsed %d records.",
        demoFile.label,
        countRecords(records),
      );
      logger.info(
        "%s sample:\n%s",
        demoFile.label,
        JSON.stringify(records.slice(0, 3), null, 2),
      );
    } catch (error) {
      logger.error("Failed to parse %s: %o", demoFile.label, error);
    }
  }
}

main();
