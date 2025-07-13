# Map Plugin Test Cases

## Basic Functionality

### Single Pin with Label

```map

[40.7589, -73.9851] Times Square

```

### Single Pin without Label

```map

[40.7128, -74.0060]

```

### Two Points (Auto-zoom)

```map

[40.7589, -73.9851] Times Square

[40.7505, -73.9934] Empire State Building

```

## Multiple Points (Auto-zoom & Centering)

### American Cities

```map

[40.7589, -73.9851] New York

[34.0522, -118.2437] Los Angeles

[41.8781, -87.6298] Chicago

[29.7604, -95.3698] Houston

```

### New York Attractions (Close zoom)

```map

[40.7589, -73.9851] Times Square

[40.7505, -73.9934] Empire State Building

[40.7829, -73.9654] Central Park

[40.7808, -73.9772] American Museum of Natural History

```

### European Cities (Wide zoom)

```map

[51.5074, -0.1278] London

[48.8566, 2.3522] Paris

[52.5200, 13.4050] Berlin

[41.9028, 12.4964] Rome

```

## Special Cases

### Complex Labels

```map

[48.8566, 2.3522] "Paris, France - Eiffel Tower"

[51.5074, -0.1278] "London, UK - Big Ben & Parliament"

```

### Mixed Labels

```map

[-34.6037, -58.3816] Buenos Aires

[-22.9068, -43.1729]

[-12.0464, -77.0428] "Lima, Peru"

```

### Extreme Locations

```map

[71.0308, -8.0267] "Svalbard, Norway"

[-77.8419, 166.6863] "McMurdo Station, Antarctica"

```

### Pacific Region (Date Line)

```map

[21.3099, -157.8581] Honolulu

[35.6762, 139.6503] Tokyo

[-36.8485, 174.7633] Auckland

```

## New Bracket Syntax Examples

### Basic Bracket Syntax

```map

[40.7589, -73.9851] Times Square

[40.7505, -73.9934] Empire State Building

[48.8566, 2.3522] Eiffel Tower

```

### Colors and Icons

```map

[40.7589, -73.9851] Times Square {"color": "red", "icon": "star"}

[40.7505, -73.9934] Empire State Building {"color": "blue", "icon": "flag"}

[40.7614, -73.9776] Central Park {"color": "green", "icon": "park"}

```

### Grouping with Colors

```map

[48.8566, 2.3522] Eiffel Tower {"color": "blue", "group": "landmarks"}

[48.8606, 2.3376] Arc de Triomphe {"color": "blue", "group": "landmarks"}

[48.8530, 2.3499] Notre Dame {"color": "blue", "group": "landmarks"}

[48.8738, 2.2950] Restaurant Le Jules Verne {"color": "orange", "icon": "restaurant", "group": "dining"}

```

### Multiple Pins with Groups

```map

# Different groups for organization

[40.7589, -73.9851] Times Square {"color": "red", "icon": "star", "group": "attractions"}

[-37.8136, 144.9631] Melbourne {"color": "blue", "group": "cities"}

[48.8566, 2.3522] Paris {"color": "purple", "group": "cities"}

[51.5074, -0.1278] London {"color": "green", "group": "cities"}

```

### Icon Reference

Available icons: star ⭐, heart ❤️, flag 🚩, pin 📍, home 🏠, office 🏢, school 🏫, hospital 🏥, restaurant 🍽️, cafe ☕, hotel 🏨, park 🌳, beach 🏖️, mountain ⛰️, airport ✈️, train 🚂, bus 🚌, car 🚗, bike 🚲, walk 🚶, shopping 🛍️, museum 🏛️, church ⛪, warning ⚠️, info ℹ️, check ✅, cross ❌

### Color Reference

Supported colors: red, blue, green, yellow, orange, purple, pink, brown, gray, black, white, or any hex color like "#ff0000"

## Plus Code Support

### Basic Plus Codes

```map

[87G8Q257+HX] Times Square

[87G7MXQ4+M6] Statue of Liberty

[87G8Q224+5J] Empire State Building

```

### Plus Codes with Labels

```map

[87G8Q257+HX Times Square, NY] America's crossroads

[87G7MXQ4+M6 Liberty Island, NY] {"color": "red", "icon": "star"}

[87G8Q224+5J Midtown, NY] Iconic skyscraper

```

### Plus Codes with Override Labels

```map

[87G8Q257+HX Times Square, NY] My Custom Label

[87G7MXQ4+M6 Liberty Island, NY] Different Label {"color": "blue"}

```

### Mixed Coordinates and Plus Codes

```map

[87G8+Q9 New York, NY] {"color": "blue", "group": "us-cities"}

[40.7589, -73.9851] Times Square {"color": "red", "group": "us-cities"}

[87G8+2G Queens, NY] {"color": "green", "group": "us-cities"}

[48.8566, 2.3522] Paris {"color": "purple", "group": "eu-cities"}

```

## Comment Descriptions

### Basic Comments

```map

[40.7589, -73.9851] Times Square # Famous tourist attraction in NYC

[87G8+Q9 New York, NY] # America's largest city

[48.8566, 2.3522] Paris # City of lights and romance

```

### Comments with JSON Attributes

```map

[40.7589, -73.9851] Times Square {"color": "red", "icon": "star"} # Tourist hotspot

[87G8+Q9 New York, NY] {"color": "blue"} # America's largest city

[48.8566, 2.3522] Paris {"color": "purple", "group": "europe"} # Romantic destination

```

### Comment Priority over JSON Description

```map

[40.7589, -73.9851] {"description": "JSON description"} # Comment takes preference

[87G8+Q9] {"description": "Will be overridden"} # This comment wins

[48.8566, 2.3522] {"description": "Only used if no comment"}

```

### Multiple Pins with Comments

```map

# Different types of locations with descriptions

[40.7589, -73.9851] Times Square {"color": "red"} # NYC landmark and tourist hub

[87G8+Q9 New York, NY] {"color": "blue"} # America's largest city

[48.8566, 2.3522] Eiffel Tower {"color": "purple"} # Iconic iron tower in Paris

[51.5074, -0.1278] Big Ben {"color": "green"} # Famous clock tower in London

```

## Advanced Examples

### Travel Itinerary with Descriptions

```map

# European Grand Tour

[48.8566, 2.3522] Paris {"color": "red", "icon": "star"} # Start: City of lights, 3 days

[50.8503, 4.3517] Brussels {"color": "orange"} # Day 4: EU capital, famous waffles

[52.3702, 4.8952] Amsterdam {"color": "blue"} # Day 6: Canals and museums

[52.5200, 13.4050] Berlin {"color": "green"} # Day 9: History and culture

[50.0755, 14.4378] Prague {"color": "purple"} # Day 12: Beautiful architecture

```

### Restaurant Guide with Comments

```map

# New York Food Scene

[87G8Q257+HX] {"color": "red", "icon": "restaurant"} # Times Square dining district

[87G7MXQ4+M6 Liberty Island, NY] {"color": "orange"} # Harbor area restaurants

[87G8Q224+5J Midtown, NY] {"color": "green"} # Business district dining

[87G8Q2MM+5R Central Park, NY] {"color": "blue"} # Park area cafes and food

```

## Features to Test

- **Auto-zoom**: Maps automatically fit all pins in view

- **Labels**: Visible above each pin with white background

- **Colors**: Pins can be colored using color attribute

- **Icons**: Pins can display emoji icons instead of default circles

- **Groups**: Pins can be grouped for organization with dropdown filter

- **Group Filtering**: Use the "Groups" dropdown to toggle pin group visibility

- **Reset button**: Bottom-right tools panel (🏠) to return to initial view

- **Smooth animations**: Reset button animates back to optimal view

- **Interactive**: Pan and zoom with mouse/touch

- **Bracket Syntax**: Clean `[lat, lng] label {"attributes"}` syntax only

- **Plus Codes**: Support for `[Plus Code location] label {"attributes"}` format

- **Comments**: Use `# comment` for descriptions that take priority over JSON

- **Descriptions**: Comments become description field for additional context
