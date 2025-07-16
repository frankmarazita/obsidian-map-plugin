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

export interface MapConfig {
  mapLayerURL?: string;
}

export interface ParsedMapData {
  pins: MapPin[];
  errors: string[];
  config?: MapConfig;
}

/**
 * Parse enhanced map syntax with coordinates in brackets or Plus Codes
 * Formats:
 * - [lat, lng] optional_label {"optional": "json", "attributes": "here"} # optional comment
 * - [Plus Code location] optional_label_override {"optional": "json", "attributes": "here"} # optional comment
 * - [lat, lng] {"description": "from json"} # comment takes preference over json description
 * 
 * With optional YAML frontmatter config:
 * ---
 * mapLayerURL: "https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
 * ---
 * 
 * [lat, lng] label
 */
export function parseMapSyntax(source: string): ParsedMapData {
  const trimmedSource = source.trim();
  let config: MapConfig | undefined;
  let contentToParse = trimmedSource;

  // Check for YAML frontmatter
  if (trimmedSource.startsWith('---')) {
    const frontmatterEndIndex = trimmedSource.indexOf('---', 3);
    if (frontmatterEndIndex !== -1) {
      const frontmatterContent = trimmedSource.substring(3, frontmatterEndIndex).trim();
      contentToParse = trimmedSource.substring(frontmatterEndIndex + 3).trim();
      
      // Parse YAML frontmatter for config
      try {
        config = parseYamlConfig(frontmatterContent);
      } catch (error) {
        // If YAML parsing fails, treat it as content instead
        contentToParse = trimmedSource;
      }
    }
  }

  const lines = contentToParse
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

  return { pins, errors, config };
}

/**
 * Find the index of a comment (#) that is not inside a JSON object or quoted string
 * This prevents hex colors like #ff0000 from being treated as comments
 */
function findCommentIndex(line: string): number {
  let insideQuotes = false;
  let quoteChar = '';
  let braceDepth = 0;
  let escaped = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      continue;
    }
    
    if (insideQuotes) {
      if (char === quoteChar) {
        insideQuotes = false;
        quoteChar = '';
      }
    } else {
      if (char === '"' || char === "'") {
        insideQuotes = true;
        quoteChar = char;
      } else if (char === '{') {
        braceDepth++;
      } else if (char === '}') {
        braceDepth--;
      } else if (char === '#' && braceDepth === 0) {
        // Found a comment outside of JSON and quotes
        return i;
      }
    }
  }
  
  return -1;
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
  const commentIndex = findCommentIndex(line);
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

/**
 * Parse YAML-like config from frontmatter
 * Simple key: value parser for basic YAML syntax
 */
function parseYamlConfig(yamlContent: string): MapConfig {
  const config: MapConfig = {};
  const lines = yamlContent.split('\n').map(line => line.trim()).filter(line => line);
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Map known config keys
    if (key === 'mapLayerURL') {
      config.mapLayerURL = value;
    }
  }
  
  return config;
}
