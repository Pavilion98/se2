import { promises as fs } from "fs";
import logger from "../logger";
import { isRecord, JsonValue, ParsedData } from "./types";

const toRecords = (value: JsonValue): ParsedData => {
  if (Array.isArray(value)) {
    if (!value.every(isRecord)) {
      throw new Error("JSON array must contain objects (records).");
    }

    return value as ParsedData;
  }

  if (isRecord(value)) {
    return [value];
  }

  throw new Error("JSON must be an object or an array of objects.");
};

export const parseJSONContent = (content: string): ParsedData => {
  if (content.trim() === "") {
    throw new Error("JSON file is empty.");
  }

  let parsed: JsonValue;

  try {
    parsed = JSON.parse(content) as JsonValue;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON format: ${message}`, { cause: error });
  }

  return toRecords(parsed);
};

export const parseJSON = async (filePath: string): Promise<ParsedData> => {
  try {
    const content = await fs.readFile(filePath, { encoding: "utf-8" });
    return parseJSONContent(content);
  } catch (error) {
    logger.error("Failed to parse JSON file %s: %o", filePath, error);
    throw error;
  }
};
