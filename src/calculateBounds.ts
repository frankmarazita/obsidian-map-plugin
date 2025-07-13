import { type MapPin } from "./parseMapSyntax";

export const calculateBounds = (
  pins: MapPin[],
  containerWidth = 400,
  containerHeight = 400
): { center: [number, number]; zoom: number } => {
  if (pins.length === 0) {
    return { center: [0, 0], zoom: 2 };
  }

  if (pins.length === 1) {
    return { center: [pins[0].lng, pins[0].lat], zoom: 15 };
  }

  const lats = pins.map((p) => p.lat);
  const lngs = pins.map((p) => p.lng);

  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  // Handle date line crossing
  const directSpan = maxLng - minLng;
  let lngSpan = directSpan;
  let centerLng = (minLng + maxLng) / 2;

  // Only use date line crossing if:
  // 1. One longitude is close to +180 and another close to -180
  // 2. The crossing path is actually shorter
  if (directSpan > 180) {
    // True date line crossing: one point near +180, another near -180
    const nearDateLine = minLng < -150 && maxLng > 150;

    if (nearDateLine) {
      const crossSpan = 360 - directSpan;

      if (crossSpan < directSpan) {
        // Use the shorter path across date line
        lngSpan = crossSpan;

        // Calculate center going the "short way" around the world
        centerLng = (minLng + 360 + maxLng) / 2;
        if (centerLng > 180) centerLng -= 360;
      }
    }
    // Otherwise use direct span even if > 180° (e.g., NY to Melbourne)
  }

  const latSpan = maxLat - minLat;
  const centerLat = (minLat + maxLat) / 2;

  // Adaptive padding: smaller percentage for very small spans, larger for big spans
  // For very close pins (< 0.01°), use minimal padding
  // For larger spans, use percentage-based padding
  const getAdaptivePadding = (span: number): number => {
    if (span < 0.001) return 0.0001; // Very close pins - minimal padding
    if (span < 0.01) return Math.max(span * 0.08, 0.0005); // Close pins - 8% padding
    if (span < 1) return span * 0.04; // Regional - 4% padding
    return span * 0.03; // Large spans - 3% padding
  };

  const latPadding = getAdaptivePadding(latSpan);
  const lngPadding = getAdaptivePadding(lngSpan);

  const paddedLatSpan = latSpan + 2 * latPadding;
  const paddedLngSpan = lngSpan + 2 * lngPadding;

  // Web Mercator zoom calculation
  // At zoom level z: world width = 256 * 2^z pixels, world spans 360 degrees longitude
  const zoomLng = Math.log2((containerWidth * 360) / (paddedLngSpan * 256));

  // For latitude in Web Mercator: account for projection distortion
  // Convert latitude span to Mercator y-coordinate span
  const toMercatorY = (lat: number) =>
    Math.log(Math.tan(((90 + lat) * Math.PI) / 360));

  const paddedMinLat = Math.max(-85, centerLat - paddedLatSpan / 2);
  const paddedMaxLat = Math.min(85, centerLat + paddedLatSpan / 2);

  const mercatorSpan = toMercatorY(paddedMaxLat) - toMercatorY(paddedMinLat);
  const worldMercatorHeight = toMercatorY(85) - toMercatorY(-85); // Total Mercator height

  const zoomLat = Math.log2(
    (containerHeight * worldMercatorHeight) / (mercatorSpan * 256)
  );

  // Use the more restrictive zoom to ensure everything fits
  let zoom = Math.min(zoomLng, zoomLat);

  // Clamp and floor to ensure all pins are visible
  zoom = Math.max(1, Math.min(18, Math.floor(zoom)));

  return { center: [centerLng, centerLat], zoom };
};
