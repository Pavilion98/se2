import path from "path";
import { parseCSV, parseCSVContent } from "../src/utils/parsers/csvParser";
import { parseFile } from "../src/utils/parsers/parser";
import { parseJSON, parseJSONContent } from "../src/utils/parsers/jsonParser";
import { parseXML, parseXMLContent } from "../src/utils/parsers/xmlParser";

const dataDirectory = path.resolve(__dirname, "../src/data");

describe("CSV parser", () => {
  it("parses quoted fields and commas correctly", () => {
    const csv = [
      '"id","name","note"',
      '"1","Alice","hello, world"',
      '"2","Bob","He said ""hi"""',
    ].join("\n");

    expect(parseCSVContent(csv)).toEqual([
      ["id", "name", "note"],
      ["1", "Alice", "hello, world"],
      ["2", "Bob", 'He said "hi"'],
    ]);
  });

  it("parses the cake orders file", async () => {
    const rows = await parseCSV(path.join(dataDirectory, "cake orders.csv"));

    expect(rows.length).toBeGreaterThan(1);
    expect(rows[0][0]).toBe("id");
    expect(rows[1][1]).toBe("Sponge");
  });

  it("returns an empty array for empty CSV content", () => {
    expect(parseCSVContent("")).toEqual([]);
  });

  it("throws a helpful error for malformed CSV content", () => {
    expect(() => parseCSVContent('"id","name"\n"1","Alice')).toThrow(
      "Malformed CSV",
    );
  });
});

describe("JSON parser", () => {
  it("parses JSON values while preserving data types", () => {
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
    ).toEqual({
      title: "Clean Code",
      price: 42,
      available: true,
      formats: ["hardcover", "ebook"],
      metadata: { pages: 464, signed: false },
      discount: null,
    });
  });

  it("parses the book orders file", async () => {
    const orders = await parseJSON(path.join(dataDirectory, "book orders.json"));

    expect(Array.isArray(orders)).toBe(true);

    if (!Array.isArray(orders)) {
      throw new Error("Expected book orders to be an array.");
    }

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
});

describe("XML parser", () => {
  it("parses nested elements, attributes, entities, and repeated tags", () => {
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
    `) as unknown as {
      store: {
        order: Array<{
          "@attributes": { id: string };
          title: string;
          items?: { item: string[] };
        }>;
      };
    };

    expect(result.store.order).toHaveLength(2);
    expect(result.store.order[0]["@attributes"].id).toBe("1");
    expect(result.store.order[0].title).toBe("Book & Pen");
    expect(result.store.order[0].items?.item).toEqual(["Book", "Pen"]);
  });

  it("parses the toy orders file", async () => {
    const parsedXml = (await parseXML(
      path.join(dataDirectory, "toy orders.xml"),
    )) as unknown as {
      data: { row: Array<{ OrderID: string; Type: string }> };
    };

    expect(parsedXml.data.row.length).toBeGreaterThan(1);
    expect(parsedXml.data.row[0]).toMatchObject({
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
  it("routes CSV files by extension", async () => {
    const parsedData = await parseFile(
      path.join(dataDirectory, "cake orders.csv"),
    );

    expect(Array.isArray(parsedData)).toBe(true);

    if (!Array.isArray(parsedData)) {
      throw new Error("Expected cake orders to be an array.");
    }

    const csvRows = parsedData as string[][];

    expect(csvRows[0][0]).toBe("id");
  });

  it("routes JSON files by extension", async () => {
    const parsedData = await parseFile(
      path.join(dataDirectory, "book orders.json"),
    );

    expect(Array.isArray(parsedData)).toBe(true);
  });

  it("routes XML files by extension", async () => {
    const parsedData = (await parseFile(
      path.join(dataDirectory, "toy orders.xml"),
    )) as unknown as {
      data: { row: Array<{ OrderID: string }> };
    };

    expect(parsedData.data.row[0].OrderID).toBe("5001");
  });

  it("rejects unsupported file extensions", async () => {
    await expect(parseFile(path.join(dataDirectory, "orders.txt"))).rejects.toThrow(
      "Unsupported file format",
    );
  });
});
