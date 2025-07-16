# Map Plugin for Obsidian

An Obsidian plugin that allows you to embed interactive maps directly in your notes using simple coordinate syntax.

## Usage

Create a map by adding a `map` code block with coordinates:

### Single Point

````
```map
[40.7589, -73.9851] Times Square
```
````

### Multiple Points

````
```map
[51.5074, -0.1278] London
[48.8566, 2.3522] Paris
[52.5200, 13.4050] Berlin
[41.9028, 12.4964] Rome
```
````

## Syntax

- Each line must contain a coordinate pair
- Optional label can be added after the coordinates
- Optional properties can be specified in JSON format after the label
- Descriptions can be added using `#` at the end of the line
- Comments are ignored with `#` at the start of the line

```
# This is a comment

[latitude, longitude]

[latitude, longitude] My Label

[latitude, longitude] My Label {"color": "red", "icon": "star"}

[latitude, longitude] # My Description
```

See [EXAMPLES.md](EXAMPLES.md) for more detailed examples. Paste the code blocks into your Obsidian notes to see them in action.

### Map Configuration

You can configure the map appearance and behavior with the following syntax:

````
```map
---
mapLayerURL: "https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
---

[latitude, longitude] My Location
```
````

The `mapLayerURL` option allows you to specify a custom tile layer URL. If not provided, the default OpenStreetMap tile layer is used.

## Controls

- **Pan**: Click and drag to move around
- **Zoom**: Mouse wheel or pinch to zoom in/out
- **Reset**: Click the 🏠 button to return to initial view

## Installation

1. Clone this repository to your `.obsidian/plugins/` folder
2. Run `bun install` and `bun run build` to compile the plugin
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

# Production build
bun run build

# Run unit tests
bun run test

# Format code
bun run format
```
