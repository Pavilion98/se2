import path from "path";
import { parseCSV } from "./csvParser";
import { parseJSON } from "./jsonParser";
import { parseXML } from "./xmlParser";
import { ParsedData } from "./types";

export const parseFile = async (filePath: string): Promise<ParsedData> => {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".csv":
      return parseCSV(filePath);
    case ".json":
      return parseJSON(filePath);
    case ".xml":
      return parseXML(filePath);
    default:
      throw new Error(`Unsupported file format: ${extension || "unknown"}.`);
  }
};

export { parseCSV, parseCSVContent } from "./csvParser";
export { parseJSON } from "./jsonParser";
export { parseXML } from "./xmlParser";
export type { JsonValue, ParsedData, XmlObject, XmlValue } from "./types";
