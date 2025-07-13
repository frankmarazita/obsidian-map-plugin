export interface Pin {
	lat: number;
	lng: number;
	label?: string;
}

export const calculateBounds = (pins: Pin[]): { center: [number, number]; zoom: number } => {
	if (pins.length === 0) {
		return { center: [0, 0], zoom: 2 };
	}

	if (pins.length === 1) {
		return { center: [pins[0].lng, pins[0].lat], zoom: 15 };
	}

	const lats = pins.map(p => p.lat);
	const lngs = pins.map(p => p.lng);
	
	const minLat = Math.min(...lats);
	const maxLat = Math.max(...lats);
	const centerLat = (minLat + maxLat) / 2;
	
	// Handle longitude with date line crossing
	let minLng = Math.min(...lngs);
	let maxLng = Math.max(...lngs);
	let centerLng: number;
	let lngSpan: number;
	
	// Check if we cross the date line (span > 180°)
	const directSpan = maxLng - minLng;
	if (directSpan > 180) {
		// We cross the date line, calculate the shorter path
		const crossDateLineSpan = (minLng + 360) - maxLng;
		if (crossDateLineSpan < directSpan) {
			// Use the shorter path across date line
			centerLng = (minLng + maxLng + 360) / 2;
			if (centerLng > 180) centerLng -= 360;
			lngSpan = crossDateLineSpan;
		} else {
			// Use direct span
			centerLng = (minLng + maxLng) / 2;
			lngSpan = directSpan;
		}
	} else {
		// Normal case, no date line crossing
		centerLng = (minLng + maxLng) / 2;
		lngSpan = directSpan;
	}
	
	// Calculate zoom based on the largest span
	const latSpan = maxLat - minLat;
	const maxSpan = Math.max(latSpan, lngSpan);
	
	let zoom: number;
	if (maxSpan < 0.01) zoom = 15;        // Very close (< 1km)
	else if (maxSpan < 0.1) zoom = 12;    // City level (< 10km)
	else if (maxSpan < 1) zoom = 9;       // Metropolitan area (< 100km)
	else if (maxSpan < 10) zoom = 6;      // Country/state level (< 1000km)
	else if (maxSpan < 50) zoom = 4;      // Continental level (< 5000km)
	else if (maxSpan < 100) zoom = 3;     // Large continental (< 10000km)
	else zoom = 2;                        // Global level
	
	return { center: [centerLng, centerLat], zoom };
};