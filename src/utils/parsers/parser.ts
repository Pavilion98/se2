// src/utils/parser.ts
import fs from "fs";
import logger from "../logger";

export const parseCSV = (filePath: string): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const results: string[][] = []; // Store parsed CSV rows as arrays
    const readStream = fs.createReadStream(filePath, { encoding: "utf-8" }); // Create a readable stream for the file

    readStream.on("data", (chunk: string) => {
      // Process data chunks from the file
      const lines = chunk.split("\n").filter((line) => line.trim() !== ""); // Split data into lines and remove empty lines
      lines.forEach((line) => {
        const columns = line
          .split(",")
          .map((value) => value.trim().replace(/^"(.*)"$/, "$1"));
        // Split line into columns, trim spaces, and remove quotes
        results.push(columns); // Add parsed row to results
      });
    });

    readStream.on("end", () => {
      resolve(results); // Resolve the promise with parsed data when done
    });

    readStream.on("error", (error) => {
      logger.error(
        "Error while reading the stream of file %s, $o",
        filePath,
        error,
      );
      reject(error); // Reject the promise if an error occurs
    });
  });
};
