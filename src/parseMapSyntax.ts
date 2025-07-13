export interface MapPin {
	lat: number;
	lng: number;
	label?: string;
	color?: string;
	icon?: string;
	group?: string;
}

export interface ParsedMapData {
	pins: MapPin[];
	errors: string[];
}

/**
 * Parse enhanced map syntax with coordinates in brackets
 * Format: [lat, lng] optional_label {"optional": "json", "attributes": "here"}
 */
export function parseMapSyntax(source: string): ParsedMapData {
	const lines = source
		.trim()
		.split('\n')
		.map(line => line.trim())
		.filter(line => line && !line.startsWith('#')); // Allow comments

	const pins: MapPin[] = [];
	const errors: string[] = [];

	for (const [lineIndex, line] of lines.entries()) {
		try {
			const pin = parseMapLine(line);
			if (pin) {
				pins.push(pin);
			}
		} catch (error) {
			errors.push(`Line ${lineIndex + 1}: ${error instanceof Error ? error.message : 'Invalid format'}`);
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
 * [40.7589, -73.9851]
 */
function parseMapLine(line: string): MapPin | null {
	if (!line.trim()) return null;

	// Parse bracket syntax
	const bracketMatch = line.match(/^\[([^,]+),\s*([^,]+)\](.*)$/);
	if (bracketMatch) {
		return parseBracketSyntax(bracketMatch[1], bracketMatch[2], bracketMatch[3]);
	}

	// Invalid format
	throw new Error('Invalid format. Use: [lat, lng] label {"optional": "attributes"}');
}

/**
 * Parse bracket syntax: [lat, lng] optional_label {"optional": "json"}
 */
function parseBracketSyntax(latStr: string, lngStr: string, remainder: string): MapPin {
	const lat = parseFloat(latStr.trim());
	const lng = parseFloat(lngStr.trim());

	if (isNaN(lat) || isNaN(lng)) {
		throw new Error('Invalid coordinates');
	}

	if (lat < -90 || lat > 90) {
		throw new Error('Latitude must be between -90 and 90');
	}

	if (lng < -180 || lng > 180) {
		throw new Error('Longitude must be between -180 and 180');
	}

	const pin: MapPin = { lat, lng };

	// Parse remainder for label and JSON attributes
	const remainderTrimmed = remainder.trim();
	if (!remainderTrimmed) {
		return pin; // Just coordinates
	}

	// Look for JSON block at the end
	const jsonMatch = remainderTrimmed.match(/^(.*)(\{.*\})$/);
	
	if (jsonMatch) {
		// Has JSON attributes
		const labelPart = jsonMatch[1].trim();
		const jsonPart = jsonMatch[2];

		// Parse label if present
		if (labelPart) {
			pin.label = parseLabel(labelPart);
		}

		// Parse JSON attributes
		try {
			const attributes = JSON.parse(jsonPart);
			if (typeof attributes === 'object' && attributes !== null) {
				if (attributes.color && typeof attributes.color === 'string') {
					pin.color = attributes.color;
				}
				if (attributes.icon && typeof attributes.icon === 'string') {
					pin.icon = attributes.icon;
				}
				if (attributes.group && typeof attributes.group === 'string') {
					pin.group = attributes.group;
				}
			}
		} catch (error) {
			throw new Error('Invalid JSON attributes');
		}
	} else {
		// No JSON, just a label
		pin.label = parseLabel(remainderTrimmed);
	}

	return pin;
}


/**
 * Parse label, handling quoted strings
 */
function parseLabel(labelStr: string): string {
	const trimmed = labelStr.trim();
	
	// Handle quoted strings
	if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))) {
		return trimmed.slice(1, -1);
	}
	
	return trimmed;
}