import { promises as fs } from "fs";
import logger from "../logger";
import { isRecord, ParsedData, ParsedRecord, XmlObject, XmlValue } from "./types";

interface OpenElement {
  name: string;
  children: XmlObject;
  textParts: string[];
}

interface ParsedTag {
  name: string;
  attributes: XmlObject;
  isClosing: boolean;
  isSelfClosing: boolean;
  isSkippable: boolean;
}

const decodeXmlEntities = (value: string): string => {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
};

const addChild = (target: XmlObject, name: string, value: XmlValue): void => {
  const existingValue = target[name];

  if (existingValue === undefined) {
    target[name] = value;
    return;
  }

  if (Array.isArray(existingValue)) {
    existingValue.push(value);
    return;
  }

  target[name] = [existingValue, value];
};

const elementToValue = (element: OpenElement): XmlValue => {
  const text = decodeXmlEntities(element.textParts.join("").trim());
  const hasChildren = Object.keys(element.children).length > 0;

  if (!hasChildren) {
    return text;
  }

  if (text !== "") {
    element.children["#text"] = text;
  }

  return element.children;
};

const parseTag = (token: string): ParsedTag => {
  const trimmedToken = token.trim();

  if (
    trimmedToken.startsWith("<?") ||
    trimmedToken.startsWith("<!--") ||
    trimmedToken.startsWith("<!DOCTYPE")
  ) {
    return {
      name: "",
      attributes: {},
      isClosing: false,
      isSelfClosing: false,
      isSkippable: true,
    };
  }

  if (!trimmedToken.startsWith("<") || !trimmedToken.endsWith(">")) {
    throw new Error(`Malformed XML token: ${token}`);
  }

  const isClosing = trimmedToken.startsWith("</");
  const isSelfClosing = trimmedToken.endsWith("/>");
  const content = trimmedToken
    .slice(isClosing ? 2 : 1, isSelfClosing ? -2 : -1)
    .trim();

  const tagNameMatch = content.match(/^([A-Za-z_][\w:.-]*)/);

  if (!tagNameMatch) {
    throw new Error(`Malformed XML tag: ${token}`);
  }

  const [, name] = tagNameMatch;
  const attributes: XmlObject = {};
  const attributesContent = content.slice(name.length).trim();
  const attributePattern = /([A-Za-z_][\w:.-]*)\s*=\s*(["'])(.*?)\2/g;
  let attributeMatch = attributePattern.exec(attributesContent);

  while (attributeMatch !== null) {
    const [, attributeName, , attributeValue] = attributeMatch;
    attributes[attributeName] = decodeXmlEntities(attributeValue);
    attributeMatch = attributePattern.exec(attributesContent);
  }

  return {
    name,
    attributes,
    isClosing,
    isSelfClosing,
    isSkippable: false,
  };
};

const appendCompletedElement = (
  stack: OpenElement[],
  root: XmlObject,
  element: OpenElement,
): void => {
  const value = elementToValue(element);
  const parent = stack[stack.length - 1];

  if (parent) {
    addChild(parent.children, element.name, value);
    return;
  }

  if (Object.keys(root).length > 0) {
    throw new Error("XML must contain a single root element.");
  }

  root[element.name] = value;
};

const toRecord = (value: XmlValue): ParsedRecord => {
  if (isRecord(value)) {
    return value;
  }

  if (typeof value === "string") {
    return { value };
  }

  throw new Error("XML does not contain records.");
};

const extractRecords = (parsed: XmlObject): ParsedData => {
  const rootKeys = Object.keys(parsed);

  if (rootKeys.length === 0) {
    return [];
  }

  if (rootKeys.length > 1) {
    return [parsed];
  }

  const rootValue = parsed[rootKeys[0]];

  if (Array.isArray(rootValue)) {
    return rootValue.map(toRecord);
  }

  if (rootValue === "" || (isRecord(rootValue) && Object.keys(rootValue).length === 0)) {
    return [];
  }

  if (!isRecord(rootValue)) {
    throw new Error("XML does not contain records.");
  }

  const childKeys = Object.keys(rootValue);

  if (childKeys.length === 1) {
    const onlyChild = rootValue[childKeys[0]];

    if (Array.isArray(onlyChild)) {
      return onlyChild.map(toRecord);
    }

    if (isRecord(onlyChild)) {
      return [onlyChild];
    }
  }

  return [rootValue];
};

export const parseXMLContent = (content: string): ParsedData => {
  if (content.trim() === "") {
    throw new Error("XML file is empty.");
  }

  const root: XmlObject = {};
  const stack: OpenElement[] = [];
  const tokenPattern = /<[^>]+>|[^<]+/g;
  let tokenMatch = tokenPattern.exec(content);

  while (tokenMatch !== null) {
    const token = tokenMatch[0];

    if (token.startsWith("<")) {
      const tag = parseTag(token);

      if (tag.isSkippable) {
        tokenMatch = tokenPattern.exec(content);
        continue;
      }

      if (tag.isClosing) {
        const currentElement = stack.pop();

        if (!currentElement || currentElement.name !== tag.name) {
          throw new Error(`Unexpected closing tag: ${tag.name}`);
        }

        appendCompletedElement(stack, root, currentElement);
      } else if (tag.isSelfClosing) {
        const element: OpenElement = {
          name: tag.name,
          children:
            Object.keys(tag.attributes).length > 0
              ? { "@attributes": tag.attributes }
              : {},
          textParts: [],
        };

        appendCompletedElement(stack, root, element);
      } else {
        stack.push({
          name: tag.name,
          children:
            Object.keys(tag.attributes).length > 0
              ? { "@attributes": tag.attributes }
              : {},
          textParts: [],
        });
      }
    } else if (stack.length > 0) {
      stack[stack.length - 1].textParts.push(token);
    } else if (token.trim() !== "") {
      throw new Error("XML contains text outside the root element.");
    }

    tokenMatch = tokenPattern.exec(content);
  }

  if (stack.length > 0) {
    throw new Error(`Unclosed XML tag: ${stack[stack.length - 1].name}`);
  }

  if (Object.keys(root).length === 0) {
    throw new Error("XML does not contain a root element.");
  }

  return extractRecords(root);
};

export const parseXML = async (filePath: string): Promise<ParsedData> => {
  try {
    const content = await fs.readFile(filePath, { encoding: "utf-8" });
    return parseXMLContent(content);
  } catch (error) {
    logger.error("Failed to parse XML file %s: %o", filePath, error);
    throw error;
  }
};
