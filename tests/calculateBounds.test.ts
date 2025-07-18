import { describe, it, expect } from "bun:test";
import { calculateBounds } from "../src/calculateBounds";
import { type MapPin } from "../src/parseMapSyntax";

describe("calculateBounds", () => {
  it("should handle empty array", () => {
    const result = calculateBounds([]);
    expect(result).toEqual({ center: [0, 0], zoom: 2 });
  });

  it("should handle single point", () => {
    const pins: MapPin[] = [{ lat: 40.7589, lng: -73.9851, label: "New York" }];
    const result = calculateBounds(pins);
    expect(result).toEqual({ center: [-73.9851, 40.7589], zoom: 15 });
  });

  it("should handle close points with high zoom", () => {
    const pins: MapPin[] = [
      { lat: 40.7589, lng: -73.9851, label: "Times Square" },
      { lat: 40.7505, lng: -73.9934, label: "Empire State" },
    ];
    const result = calculateBounds(pins);

    expect(result.center[0]).toBeCloseTo(-73.98925, 4);
    expect(result.center[1]).toBeCloseTo(40.7547, 4);
    expect(result.zoom).toBeGreaterThan(10); // Should be high zoom for close points
  });

  it("should handle European cities with medium zoom", () => {
    const pins: MapPin[] = [
      { lat: 51.5074, lng: -0.1278, label: "London" },
      { lat: 48.8566, lng: 2.3522, label: "Paris" },
      { lat: 52.52, lng: 13.405, label: "Berlin" },
      { lat: 41.9028, lng: 12.4964, label: "Rome" },
    ];
    const result = calculateBounds(pins);

    expect(result.center[0]).toBeCloseTo(6.6386, 3);
    expect(result.center[1]).toBeCloseTo(47.2114, 3);
    expect(result.zoom).toBeLessThan(8); // Should be medium zoom for regional coverage
  });

  it("should handle Pacific region with date line crossing", () => {
    const pins: MapPin[] = [
      { lat: 21.3099, lng: -157.8581, label: "Honolulu" },
      { lat: 35.6762, lng: 139.6503, label: "Tokyo" },
      { lat: -36.8485, lng: 174.7633, label: "Auckland" },
    ];
    const result = calculateBounds(pins);

    // Center should be in Pacific Ocean, not over Africa
    expect(Math.abs(result.center[0])).toBeGreaterThan(140);
    expect(result.center[1]).toBeCloseTo(-0.58615, 3);
    expect(result.zoom).toBeLessThan(5); // Should be low zoom for wide Pacific coverage
  });

  it("should handle extreme locations with global zoom", () => {
    const pins: MapPin[] = [
      { lat: 71.0308, lng: -8.0267, label: "Svalbard" },
      { lat: -77.8419, lng: 166.6863, label: "McMurdo Station" },
    ];
    const result = calculateBounds(pins);

    // Should use very low zoom for extreme latitude span
    expect(result.zoom).toBeLessThan(3);
    expect(result.center[1]).toBeCloseTo(-3.4055, 3);
  });

  it("should handle date line edge case", () => {
    const pins: MapPin[] = [
      { lat: 60, lng: 179 },
      { lat: 50, lng: -179 },
    ];
    const result = calculateBounds(pins);

    // Should cross date line, center near ±180°
    expect(Math.abs(Math.abs(result.center[0]) - 180)).toBeLessThan(10);
    expect(result.center[1]).toBe(55);
    expect(result.zoom).toBeLessThan(8); // Should be medium zoom for regional coverage
  });

  describe("zoom levels", () => {
    it("should use high zoom for very close points (< 0.01°)", () => {
      const pins: MapPin[] = [
        { lat: 40.7589, lng: -73.9851 },
        { lat: 40.759, lng: -73.9852 },
      ];
      const result = calculateBounds(pins);
      expect(result.zoom).toBeGreaterThan(10); // Very close points should have high zoom
    });

    it("should use medium-high zoom for city level (< 0.1°)", () => {
      const pins: MapPin[] = [
        { lat: 40.7589, lng: -73.9851 },
        { lat: 40.8089, lng: -73.9351 },
      ];
      const result = calculateBounds(pins);
      expect(result.zoom).toBeGreaterThan(8); // City level should be medium-high zoom
      expect(result.zoom).toBeLessThan(15);
    });

    it("should use medium zoom for regional area (around 1°)", () => {
      const pins: MapPin[] = [
        { lat: 40.7589, lng: -73.9851 },
        { lat: 41.7589, lng: -72.9851 },
      ];
      const result = calculateBounds(pins);
      expect(result.zoom).toBeGreaterThan(3); // Regional should be medium zoom
      expect(result.zoom).toBeLessThan(10);
    });

    it("should use low zoom for global level (> 100°)", () => {
      const pins: MapPin[] = [
        { lat: 80, lng: 0 },
        { lat: -80, lng: 0 },
      ];
      const result = calculateBounds(pins);
      expect(result.zoom).toBeLessThan(3); // Global level should be very low zoom
    });
  });
});
