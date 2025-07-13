import { describe, it, expect } from "bun:test";
import { parseMapSyntax } from "../src/parseMapSyntax";

describe("parseMapSyntax", () => {
  describe("new bracket syntax", () => {
    it("should parse coordinates only", () => {
      const result = parseMapSyntax("[40.7589, -73.9851]");
      expect(result.errors).toHaveLength(0);
      expect(result.pins).toHaveLength(1);
      expect(result.pins[0]).toEqual({
        lat: 40.7589,
        lng: -73.9851,
      });
      expect(result.pins[0].plusCode).toBeUndefined();
    });

    it("should parse coordinates with label", () => {
      const result = parseMapSyntax("[40.7589, -73.9851] Times Square");
      expect(result.errors).toHaveLength(0);
      expect(result.pins).toHaveLength(1);
      expect(result.pins[0]).toEqual({
        lat: 40.7589,
        lng: -73.9851,
        label: "Times Square",
      });
    });

    it("should parse coordinates with quoted label", () => {
      const result = parseMapSyntax('[40.7589, -73.9851] "Times Square NYC"');
      expect(result.errors).toHaveLength(0);
      expect(result.pins[0].label).toBe("Times Square NYC");
    });

    it("should parse coordinates with JSON attributes only", () => {
      const result = parseMapSyntax(
        '[40.7589, -73.9851] {"color": "red", "icon": "star"}'
      );
      expect(result.errors).toHaveLength(0);
      expect(result.pins[0]).toEqual({
        lat: 40.7589,
        lng: -73.9851,
        color: "red",
        icon: "star",
      });
    });

    it("should parse coordinates with label and JSON attributes", () => {
      const result = parseMapSyntax(
        '[40.7589, -73.9851] Times Square {"color": "red", "icon": "star", "group": "attractions"}'
      );
      expect(result.errors).toHaveLength(0);
      expect(result.pins[0]).toEqual({
        lat: 40.7589,
        lng: -73.9851,
        label: "Times Square",
        color: "red",
        icon: "star",
        group: "attractions",
      });
    });

    it("should parse coordinates with quoted label and attributes", () => {
      const result = parseMapSyntax(
        '[48.8566, 2.3522] "Eiffel Tower, Paris" {"color": "blue", "group": "landmarks"}'
      );
      expect(result.errors).toHaveLength(0);
      expect(result.pins[0]).toEqual({
        lat: 48.8566,
        lng: 2.3522,
        label: "Eiffel Tower, Paris",
        color: "blue",
        group: "landmarks",
      });
    });

    it("should handle whitespace flexibility", () => {
      const result = parseMapSyntax(
        '[ 40.7589 , -73.9851 ]   Times Square   { "color" : "red" }'
      );
      expect(result.errors).toHaveLength(0);
      expect(result.pins[0]).toEqual({
        lat: 40.7589,
        lng: -73.9851,
        label: "Times Square",
        color: "red",
      });
    });

    it("should ignore unknown JSON attributes", () => {
      const result = parseMapSyntax(
        '[40.7589, -73.9851] {"color": "red", "unknown": "value", "size": 10}'
      );
      expect(result.errors).toHaveLength(0);
      expect(result.pins[0]).toEqual({
        lat: 40.7589,
        lng: -73.9851,
        color: "red",
      });
    });
  });

  describe("multiple pins in same map", () => {
    it("should handle multiple bracket syntax pins together", () => {
      const input = `
				# Multiple pins with different attributes
				[40.7589, -73.9851] Times Square {"color": "red"}
				[40.7128, -74.0060] New York {"color": "blue", "group": "cities"}
				[48.8566, 2.3522] Paris {"group": "cities"}
				[51.5074, -0.1278] London
			`;

      const result = parseMapSyntax(input);
      expect(result.errors).toHaveLength(0);
      expect(result.pins).toHaveLength(4);

      expect(result.pins[0]).toEqual({
        lat: 40.7589,
        lng: -73.9851,
        label: "Times Square",
        color: "red",
      });

      expect(result.pins[1]).toEqual({
        lat: 40.7128,
        lng: -74.0060,
        label: "New York",
        color: "blue",
        group: "cities",
      });

      expect(result.pins[2]).toEqual({
        lat: 48.8566,
        lng: 2.3522,
        label: "Paris",
        group: "cities",
      });

      expect(result.pins[3]).toEqual({
        lat: 51.5074,
        lng: -0.1278,
        label: "London",
      });
    });
  });

  describe("error handling", () => {
    it("should report invalid coordinates", () => {
      const result = parseMapSyntax("[invalid, -73.9851] Times Square");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Invalid coordinates");
    });

    it("should report latitude out of range", () => {
      const result = parseMapSyntax("[91, -73.9851] Invalid");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Latitude must be between -90 and 90");
    });

    it("should report longitude out of range", () => {
      const result = parseMapSyntax("[40.7589, 181] Invalid");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        "Longitude must be between -180 and 180"
      );
    });

    it("should report invalid JSON", () => {
      const result = parseMapSyntax(
        "[40.7589, -73.9851] Times Square {invalid json}"
      );
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Invalid JSON attributes");
    });

    it("should skip empty lines and comments", () => {
      const input = `
				# This is a comment
				[40.7589, -73.9851] Times Square
				
				# Another comment
				[48.8566, 2.3522] Paris
			`;

      const result = parseMapSyntax(input);
      expect(result.errors).toHaveLength(0);
      expect(result.pins).toHaveLength(2);
    });

    it("should report multiple errors", () => {
      const input = `
				[invalid, coords] Bad Line 1
				[91, 181] Bad Line 2
				[40.7589, -73.9851] Good Line
				[1, 2] Bad JSON {invalid}
			`;

      const result = parseMapSyntax(input);
      expect(result.errors).toHaveLength(3);
      expect(result.pins).toHaveLength(1); // Only the good line
    });
  });

  describe("attribute validation", () => {
    it("should only accept string values for attributes", () => {
      const result = parseMapSyntax(
        '[40.7589, -73.9851] {"color": 123, "icon": true, "group": "valid"}'
      );
      expect(result.errors).toHaveLength(0);
      expect(result.pins[0]).toEqual({
        lat: 40.7589,
        lng: -73.9851,
        group: "valid", // Only valid string attribute
      });
    });
  });

  describe("Plus Code syntax", () => {
    it("should parse Plus Code only", () => {
      const result = parseMapSyntax("[87G8+Q9]");
      expect(result.errors).toHaveLength(0);
      expect(result.pins).toHaveLength(1);
      expect(result.pins[0].lat).toBeCloseTo(40.32693750000003, 4);
      expect(result.pins[0].lng).toBeCloseTo(-73.73406250000001, 4);
      expect(result.pins[0].plusCode).toBe("87G8+Q9");
    });

    it("should parse Plus Code with label", () => {
      const result = parseMapSyntax("[87G8+Q9 New York, NY]");
      expect(result.errors).toHaveLength(0);
      expect(result.pins).toHaveLength(1);
      expect(result.pins[0].lat).toBeCloseTo(40.32693750000003, 4);
      expect(result.pins[0].lng).toBeCloseTo(-73.73406250000001, 4);
      expect(result.pins[0].label).toBe("New York, NY");
      expect(result.pins[0].plusCode).toBe("87G8+Q9");
    });

    it("should parse Plus Code with label override", () => {
      const result = parseMapSyntax("[87G8+Q9 New York, NY] My Label");
      expect(result.errors).toHaveLength(0);
      expect(result.pins).toHaveLength(1);
      expect(result.pins[0].lat).toBeCloseTo(40.32693750000003, 4);
      expect(result.pins[0].lng).toBeCloseTo(-73.73406250000001, 4);
      expect(result.pins[0].label).toBe("My Label");
    });

    it("should parse Plus Code with JSON attributes", () => {
      const result = parseMapSyntax(
        `[87G8+Q9] {"color": "red", "icon": "star"}`
      );
      expect(result.errors).toHaveLength(0);
      expect(result.pins[0].lat).toBeCloseTo(40.32693750000003, 4);
      expect(result.pins[0].lng).toBeCloseTo(-73.73406250000001, 4);
      expect(result.pins[0].color).toBe("red");
      expect(result.pins[0].icon).toBe("star");
    });

    it("should parse Plus Code with label and JSON attributes", () => {
      const result = parseMapSyntax(
        `[87G8+Q9 New York, NY] {"color": "blue", "group": "nyc"}`
      );
      expect(result.errors).toHaveLength(0);
      expect(result.pins[0].lat).toBeCloseTo(40.32693750000003, 4);
      expect(result.pins[0].lng).toBeCloseTo(-73.73406250000001, 4);
      expect(result.pins[0].label).toBe("New York, NY");
      expect(result.pins[0].color).toBe("blue");
      expect(result.pins[0].group).toBe("nyc");
    });

    it("should handle mixed Plus Code and coordinate syntax", () => {
      const input = `
        [87G8+Q9 New York, NY] {"color": "blue"}
        [40.7589, -73.9851] Times Square {"color": "red"}
        [87G7+WM Brooklyn]
      `;
      const result = parseMapSyntax(input);
      expect(result.errors).toHaveLength(0);
      expect(result.pins).toHaveLength(3);

      expect(result.pins[0].label).toBe("New York, NY");
      expect(result.pins[0].color).toBe("blue");

      expect(result.pins[1].label).toBe("Times Square");
      expect(result.pins[1].lat).toBe(40.7589);
      expect(result.pins[1].lng).toBe(-73.9851);

      expect(result.pins[2].label).toBe("Brooklyn");
    });

    it("should report invalid Plus Code", () => {
      const result = parseMapSyntax("[6ABZ+L0] Invalid Plus Code");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Invalid Plus Code");
    });

    it("should handle case insensitive Plus Codes", () => {
      const result = parseMapSyntax("[87g8+q9 New York]");
      expect(result.errors).toHaveLength(0);
      expect(result.pins).toHaveLength(1);
      expect(result.pins[0].lat).toBeCloseTo(40.32693750000003, 4);
      expect(result.pins[0].lng).toBeCloseTo(-73.73406250000001, 4);
    });

    it("should require brackets for Plus Codes", () => {
      const result = parseMapSyntax("87G8+Q9 New York, NY");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Invalid format");
    });
  });

  describe("comment syntax", () => {
    it("should parse comment as description for coordinates", () => {
      const result = parseMapSyntax("[40.7589, -73.9851] Times Square # Famous tourist attraction in NYC");
      expect(result.errors).toHaveLength(0);
      expect(result.pins).toHaveLength(1);
      expect(result.pins[0]).toEqual({
        lat: 40.7589,
        lng: -73.9851,
        label: "Times Square",
        description: "Famous tourist attraction in NYC"
      });
    });

    it("should parse comment as description for Plus Codes", () => {
      const result = parseMapSyntax("[87G8+Q9 New York, NY] # Big Apple city");
      expect(result.errors).toHaveLength(0);
      expect(result.pins).toHaveLength(1);
      expect(result.pins[0].lat).toBeCloseTo(40.32693750000003, 4);
      expect(result.pins[0].lng).toBeCloseTo(-73.73406250000001, 4);
      expect(result.pins[0].label).toBe("New York, NY");
      expect(result.pins[0].description).toBe("Big Apple city");
    });

    it("should parse comment with JSON attributes", () => {
      const result = parseMapSyntax('[40.7589, -73.9851] Times Square {"color": "red"} # Tourist hotspot');
      expect(result.errors).toHaveLength(0);
      expect(result.pins[0]).toEqual({
        lat: 40.7589,
        lng: -73.9851,
        label: "Times Square",
        color: "red",
        description: "Tourist hotspot"
      });
    });

    it("should prefer comment over JSON description", () => {
      const result = parseMapSyntax('[40.7589, -73.9851] {"description": "JSON description"} # Comment description');
      expect(result.errors).toHaveLength(0);
      expect(result.pins[0]).toEqual({
        lat: 40.7589,
        lng: -73.9851,
        description: "Comment description"
      });
    });

    it("should use JSON description when no comment present", () => {
      const result = parseMapSyntax('[40.7589, -73.9851] {"description": "JSON description"}');
      expect(result.errors).toHaveLength(0);
      expect(result.pins[0]).toEqual({
        lat: 40.7589,
        lng: -73.9851,
        description: "JSON description"
      });
    });

    it("should handle comment without other content", () => {
      const result = parseMapSyntax("[40.7589, -73.9851] # Just a comment");
      expect(result.errors).toHaveLength(0);
      expect(result.pins[0]).toEqual({
        lat: 40.7589,
        lng: -73.9851,
        description: "Just a comment"
      });
    });

    it("should handle empty comment", () => {
      const result = parseMapSyntax("[40.7589, -73.9851] Times Square #");
      expect(result.errors).toHaveLength(0);
      expect(result.pins[0]).toEqual({
        lat: 40.7589,
        lng: -73.9851,
        label: "Times Square"
      });
    });

    it("should handle multiple pins with comments", () => {
      const input = `
        [40.7589, -73.9851] Times Square # NYC landmark
        [87G8+Q9 New York, NY] {"color": "blue"} # American city
        [48.8566, 2.3522] Paris # City of lights
      `;
      const result = parseMapSyntax(input);
      expect(result.errors).toHaveLength(0);
      expect(result.pins).toHaveLength(3);
      
      expect(result.pins[0].description).toBe("NYC landmark");
      expect(result.pins[1].description).toBe("American city");
      expect(result.pins[2].description).toBe("City of lights");
    });
  });
});
