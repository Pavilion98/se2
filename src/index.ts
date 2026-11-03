import path from "path";
import { parseFile, ParsedData, XmlObject } from "./utils/parsers/parser";
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

const isXmlObject = (value: unknown): value is XmlObject => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const countRecords = (data: ParsedData): number => {
  if (Array.isArray(data)) {
    return data.length;
  }

  if (isXmlObject(data) && isXmlObject(data.data)) {
    const rows = data.data.row;
    return Array.isArray(rows) ? rows.length : 1;
  }

  return 1;
};

const getSample = (data: ParsedData): unknown => {
  if (Array.isArray(data)) {
    return data.slice(0, 3);
  }

  if (isXmlObject(data) && isXmlObject(data.data)) {
    const rows = data.data.row;
    return Array.isArray(rows) ? rows.slice(0, 3) : rows;
  }

  return data;
};

async function main() {
  for (const demoFile of demoFiles) {
    try {
      const parsedData = await parseFile(demoFile.filePath);

      logger.info(
        "%s parsed %d records.",
        demoFile.label,
        countRecords(parsedData),
      );
      logger.info(
        "%s sample:\n%s",
        demoFile.label,
        JSON.stringify(getSample(parsedData), null, 2),
      );
    } catch (error) {
      logger.error("Failed to parse %s: %o", demoFile.label, error);
    }
  }
}

main();
