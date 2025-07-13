# Map Plugin for Obsidian

An Obsidian plugin that allows you to embed interactive maps directly in your notes using simple coordinate syntax.

## Usage

Create a map by adding a `map` code block with coordinates:

### Single Point

````
```map
40.7589, -73.9851, Times Square
````

```

### Multiple Points
```

```map
51.5074, -0.1278, London
48.8566, 2.3522, Paris
52.5200, 13.4050, Berlin
41.9028, 12.4964, Rome
```

```

## Syntax

Each line should contain:
```

latitude, longitude[, optional label]

````

## Controls

- **Pan**: Click and drag to move around
- **Zoom**: Mouse wheel or pinch to zoom in/out
- **Reset**: Click the 🏠 button to return to initial view

## Installation

1. Download the latest release
2. Extract to your `.obsidian/plugins/` folder
3. Enable the plugin in Obsidian settings


## Technical Details

- Built with OpenLayers for map rendering
- Uses OpenStreetMap tiles
- No external API keys required

## Development

This project uses **Bun** for package management and testing:

```bash
# Install dependencies
bun install

# Development build with watch mode
bun run dev

# Production build
bun run build

# Run unit tests
bun test

# Version bump
bun run version
````

### Testing

Run tests with `bun test` to verify all functionality works correctly.
