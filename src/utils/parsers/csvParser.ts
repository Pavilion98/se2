import { promises as fs } from "fs";
import logger from "../logger";

const addCSVRow = (
  rows: string[][],
  currentRow: string[],
  currentField: string,
): void => {
  const row = [...currentRow, currentField].map((field) => field.trim());

  if (row.some((field) => field !== "")) {
    rows.push(row);
  }
};

export const parseCSVContent = (content: string): string[][] => {
  if (content.trim() === "") {
    return [];
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let isInsideQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const nextCharacter = content[index + 1];

    if (isInsideQuotes) {
      if (character === '"' && nextCharacter === '"') {
        currentField += '"';
        index += 1;
      } else if (character === '"') {
        isInsideQuotes = false;
      } else {
        currentField += character;
      }

      continue;
    }

    if (character === '"') {
      if (currentField.trim() !== "") {
        throw new Error("Malformed CSV: unexpected quote in unquoted field.");
      }

      isInsideQuotes = true;
    } else if (character === ",") {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if (character === "\n" || character === "\r") {
      addCSVRow(rows, currentRow, currentField);
      currentRow = [];
      currentField = "";

      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
    } else {
      currentField += character;
    }
  }

  if (isInsideQuotes) {
    throw new Error("Malformed CSV: unclosed quoted field.");
  }

  addCSVRow(rows, currentRow, currentField);
  return rows;
};

export const parseCSV = async (filePath: string): Promise<string[][]> => {
  try {
    const content = await fs.readFile(filePath, { encoding: "utf-8" });
    return parseCSVContent(content);
  } catch (error) {
    logger.error("Failed to parse CSV file %s: %o", filePath, error);
    throw error;
  }
};
