export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export type XmlValue = string | XmlObject | XmlValue[];

export interface XmlObject {
  [key: string]: XmlValue;
}

export type ParsedData = string[][] | JsonValue | XmlObject;
