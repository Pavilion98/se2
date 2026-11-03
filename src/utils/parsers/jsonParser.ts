import { promises as fs } from "fs";
import logger from "../logger";
import { JsonValue } from "./types";

export const parseJSONContent = (content: string): JsonValue => {
  if (content.trim() === "") {
    throw new Error("JSON file is empty.");
  }

  try {
    return JSON.parse(content) as JsonValue;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON format: ${message}`, { cause: error });
  }
};

export const parseJSON = async (filePath: string): Promise<JsonValue> => {
  try {
    const content = await fs.readFile(filePath, { encoding: "utf-8" });
    return parseJSONContent(content);
  } catch (error) {
    logger.error("Failed to parse JSON file %s: %o", filePath, error);
    throw error;
  }
};
