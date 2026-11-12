export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export type XmlValue = string | XmlObject | XmlValue[];

export interface XmlObject {
  [key: string]: XmlValue;
}

export type ParsedRecord = Record<string, unknown>;

export type ParsedData = ParsedRecord[];

export const isRecord = (value: unknown): value is ParsedRecord => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};
