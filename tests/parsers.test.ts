import path from "path";
import { parseCSV, parseCSVContent } from "../src/utils/parsers/csvParser";
import { parseFile } from "../src/utils/parsers/parser";
import { parseJSON, parseJSONContent } from "../src/utils/parsers/jsonParser";
import { parseXML, parseXMLContent } from "../src/utils/parsers/xmlParser";

const dataDirectory = path.resolve(__dirname, "../src/data");

describe("CSV parser", () => {
  it("skips the header row and maps each row to an object", () => {
    const csv = [
      '"id","name","note"',
      '"1","Alice","hello, world"',
      '"2","Bob","He said ""hi"""',
    ].join("\n");

    expect(parseCSVContent(csv)).toEqual([
      { id: "1", name: "Alice", note: "hello, world" },
      { id: "2", name: "Bob", note: 'He said "hi"' },
    ]);
  });

  it("parses the cake orders file into records without the header", async () => {
    const rows = await parseCSV(path.join(dataDirectory, "cake orders.csv"));

    expect(rows).toHaveLength(263);
    expect(rows[0]).toMatchObject({
      id: "0",
      Type: "Sponge",
      Flavor: "Vanilla",
    });
  });

  it("returns an empty array for empty CSV content", () => {
    expect(parseCSVContent("")).toEqual([]);
  });

  it("returns an empty array when CSV only contains a header", () => {
    expect(parseCSVContent('"id","name"')).toEqual([]);
  });

  it("throws a helpful error for malformed CSV content", () => {
    expect(() => parseCSVContent('"id","name"\n"1","Alice')).toThrow(
      "Malformed CSV",
    );
  });
});

describe("JSON parser", () => {
  it("parses JSON objects while preserving nested data types", () => {
    expect(
      parseJSONContent(
        JSON.stringify({
          title: "Clean Code",
          price: 42,
          available: true,
          formats: ["hardcover", "ebook"],
          metadata: { pages: 464, signed: false },
          discount: null,
        }),
      ),
    ).toEqual([
      {
        title: "Clean Code",
        price: 42,
        available: true,
        formats: ["hardcover", "ebook"],
        metadata: { pages: 464, signed: false },
        discount: null,
      },
    ]);
  });

  it("parses the book orders file", async () => {
    const orders = await parseJSON(path.join(dataDirectory, "book orders.json"));

    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(1);
    expect(orders[0]).toMatchObject({
      "Order ID": "2001",
      "Book Title": "Edge of Eternity",
    });
  });

  it("throws a helpful error for empty JSON content", () => {
    expect(() => parseJSONContent("")).toThrow("JSON file is empty");
  });

  it("throws a helpful error for malformed JSON content", () => {
    expect(() => parseJSONContent('{"title": "Broken",}')).toThrow(
      "Invalid JSON format",
    );
  });

  it("throws a helpful error when JSON is not records", () => {
    expect(() => parseJSONContent('"just a string"')).toThrow(
      "JSON must be an object or an array of objects.",
    );
  });
});

describe("XML parser", () => {
  it("parses nested elements, attributes, entities, and repeated tags into records", () => {
    const result = parseXMLContent(`
      <?xml version="1.0"?>
      <store>
        <order id="1">
          <title>Book &amp; Pen</title>
          <items>
            <item>Book</item>
            <item>Pen</item>
          </items>
        </order>
        <order id="2">
          <title>Toy</title>
        </order>
      </store>
    `);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      "@attributes": { id: "1" },
      title: "Book & Pen",
      items: { item: ["Book", "Pen"] },
    });
    expect(result[1]).toMatchObject({ title: "Toy" });
  });

  it("parses the toy orders file into an array of records", async () => {
    const rows = await parseXML(path.join(dataDirectory, "toy orders.xml"));

    expect(rows.length).toBeGreaterThan(1);
    expect(rows[0]).toMatchObject({
      OrderID: "5001",
      Type: "Plush Toy",
    });
  });

  it("throws a helpful error for empty XML content", () => {
    expect(() => parseXMLContent("")).toThrow("XML file is empty");
  });

  it("throws a helpful error for malformed XML content", () => {
    expect(() => parseXMLContent("<root><item></root>")).toThrow(
      "Unexpected closing tag",
    );
  });
});

describe("parser engine", () => {
  it("routes CSV files by extension and returns records", async () => {
    const parsedData = await parseFile(
      path.join(dataDirectory, "cake orders.csv"),
    );

    expect(Array.isArray(parsedData)).toBe(true);
    expect(parsedData[0]).toMatchObject({ id: "0", Type: "Sponge" });
  });

  it("routes JSON files by extension and returns records", async () => {
    const parsedData = await parseFile(
      path.join(dataDirectory, "book orders.json"),
    );

    expect(Array.isArray(parsedData)).toBe(true);
    expect(parsedData[0]).toMatchObject({ "Order ID": "2001" });
  });

  it("routes XML files by extension and returns records", async () => {
    const parsedData = await parseFile(
      path.join(dataDirectory, "toy orders.xml"),
    );

    expect(Array.isArray(parsedData)).toBe(true);
    expect(parsedData[0]).toMatchObject({ OrderID: "5001" });
  });

  it("rejects unsupported file extensions", async () => {
    await expect(
      parseFile(path.join(dataDirectory, "orders.txt")),
    ).rejects.toThrow("Unsupported file format");
  });
});
