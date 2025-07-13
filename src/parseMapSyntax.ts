import type { OpenLocationCode as T } from "open-location-code";
const OpenLocationCode = require("open-location-code").OpenLocationCode;
export interface MapPin {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  icon?: string;
  group?: string;
  description?: string;
  plusCode?: string;
}

export interface ParsedMapData {
  pins: MapPin[];
  errors: string[];
}

/**
 * Parse enhanced map syntax with coordinates in brackets or Plus Codes
 * Formats:
 * - [lat, lng] optional_label {"optional": "json", "attributes": "here"} # optional comment
 * - [Plus Code location] optional_label_override {"optional": "json", "attributes": "here"} # optional comment
 * - [lat, lng] {"description": "from json"} # comment takes preference over json description
 */
export function parseMapSyntax(source: string): ParsedMapData {
  const lines = source
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#")); // Allow comments

  const pins: MapPin[] = [];
  const errors: string[] = [];

  for (const [lineIndex, line] of lines.entries()) {
    try {
      const pin = parseMapLine(line);
      if (pin) {
        pins.push(pin);
      }
    } catch (error) {
      errors.push(
        `Line ${lineIndex + 1}: ${error instanceof Error ? error.message : "Invalid format"}`
      );
    }
  }

  return { pins, errors };
}

/**
 * Parse a single line of map syntax
 * Examples:
 * [40.7589, -73.9851] Times Square
 * [40.7589, -73.9851] Times Square {"color": "red", "icon": "star"}
 * [40.7589, -73.9851] {"color": "red"}
 * [40.7589, -73.9851] # This is a comment description
 * [87G8+Q9 New York, NY]
 * [87G8+Q9 New York, NY] My Label
 * [87G8+Q9 New York, NY] {"color": "blue"}
 * [87G8+Q9 New York, NY] My Label {"color": "blue"} # Comment description
 * [40.7589, -73.9851] {"description": "JSON description"} # Comment takes preference
 */
function parseMapLine(line: string): MapPin | null {
  if (!line.trim()) return null;

  // Extract comment from end of line first
  let workingLine = line;
  let comment = "";
  const commentIndex = line.indexOf("#");
  if (commentIndex !== -1) {
    comment = line.substring(commentIndex + 1).trim();
    workingLine = line.substring(0, commentIndex).trim();
  }

  // Parse bracket syntax
  const bracketMatch = workingLine.match(/^\[([^\]]+)\](.*)$/);
  if (bracketMatch) {
    const contents = bracketMatch[1];
    const remainder = bracketMatch[2];

    // Check if contents is a Plus Code
    const plusCodeMatch = contents.match(/^([A-Z0-9]{4,}\+[A-Z0-9]{2,})(.*)$/i);
    if (plusCodeMatch) {
      const plusCode = plusCodeMatch[1];
      const plusCodeLabel = plusCodeMatch[2].trim();

      const pin = parsePlusCode(plusCode);

      // Store the original Plus Code
      pin.plusCode = plusCode.toUpperCase();

      // If there's a label within the Plus Code part, use it
      if (plusCodeLabel) {
        pin.label = parseLabel(plusCodeLabel);
      }

      // Parse remainder for label override and JSON attributes
      const finalPin = parseRemainderAndApply(pin, remainder);

      // Add comment as description if present
      if (comment) {
        finalPin.description = comment;
      }

      return finalPin;
    } else {
      // Try to parse as lat, lng coordinates
      const coordMatch = contents.match(/^([^,]+),\s*([^,]+)$/);
      if (coordMatch) {
        const pin = parseBracket(coordMatch[1], coordMatch[2]);
        const finalPin = parseRemainderAndApply(pin, remainder);

        // Add comment as description if present
        if (comment) {
          finalPin.description = comment;
        }

        return finalPin;
      }
    }
  }

  // Invalid format
  throw new Error(
    'Invalid format. Use: [lat, lng] label {"optional": "attributes"} or [Plus Code] label {"optional": "attributes"}'
  );
}

/**
 * Parse remainder of line for label override and JSON attributes
 */
function parseRemainderAndApply(pin: MapPin, remainder: string): MapPin {
  const remainderTrimmed = remainder.trim();
  if (!remainderTrimmed) {
    return pin; // Nothing to parse
  }

  // Look for JSON block at the end
  const jsonMatch = remainderTrimmed.match(/^(.*)(\{.*\})$/);

  if (jsonMatch) {
    // Has JSON attributes
    const labelPart = jsonMatch[1].trim();
    const jsonPart = jsonMatch[2];

    // Parse label override if present
    if (labelPart) {
      pin.label = parseLabel(labelPart);
    }

    // Parse JSON attributes
    try {
      const attributes = parseAttributes(jsonPart);
      if (typeof attributes === "object" && attributes !== null) {
        if (attributes.color && typeof attributes.color === "string") {
          pin.color = attributes.color;
        }
        if (attributes.icon && typeof attributes.icon === "string") {
          pin.icon = attributes.icon;
        }
        if (attributes.group && typeof attributes.group === "string") {
          pin.group = attributes.group;
        }
        if (
          attributes.description &&
          typeof attributes.description === "string"
        ) {
          pin.description = attributes.description;
        }
      }
    } catch (error) {
      throw new Error("Invalid JSON attributes");
    }
  } else {
    // No JSON, just a label override
    pin.label = parseLabel(remainderTrimmed);
  }

  return pin;
}

/**
 * Parse bracket syntax: [lat, lng]
 */
function parseBracket(latStr: string, lngStr: string): MapPin {
  const lat = parseFloat(latStr.trim());
  const lng = parseFloat(lngStr.trim());

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error("Invalid coordinates");
  }

  if (lat < -90 || lat > 90) {
    throw new Error("Latitude must be between -90 and 90");
  }

  if (lng < -180 || lng > 180) {
    throw new Error("Longitude must be between -180 and 180");
  }

  return { lat, lng };
}

/**
 * Parse Plus Code syntax: 87G8+Q9
 * Handles both full and short Plus Codes. For short codes, uses New York as reference location.
 */
function parsePlusCode(plusCode: string): MapPin {
  try {
    const olc = new OpenLocationCode() as typeof T;
    let codeToUse = plusCode.toUpperCase();

    // Check if it's a short code (less than 8 characters before +)
    const plusIndex = codeToUse.indexOf("+");
    if (plusIndex < 8) {
      // It's a short code, expand it using New York as reference location
      // New York coordinates: 40.7589, -73.9851
      codeToUse = olc.recoverNearest(codeToUse, 40.7589, -73.9851);
    }

    const decoded = olc.decode(codeToUse);

    return {
      lat: decoded.latitudeCenter,
      lng: decoded.longitudeCenter,
    };
  } catch (error) {
    throw new Error(
      `Invalid Plus Code: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Parse label, handling quoted strings
 */
function parseLabel(labelStr: string): string {
  const trimmed = labelStr.trim();

  // Handle quoted strings
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

/**
 * Parse JSON attributes from a string
 * Example: {"color": "red", "icon": "star"}
 */
function parseAttributes(attributesStr: string): Record<string, any> {
  const trimmed = attributesStr.trim();
  if (!trimmed) return {};

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new Error("Invalid JSON attributes");
  }
}
