# Map Plugin Test Cases

## Basic Functionality

### Single Pin with Label

```map

[-37.8136, 144.9631] Melbourne CBD

```

### Single Pin without Label

```map

[-33.8568, 151.2153]

```

### Two Points (Auto-zoom)

```map

[40.7589, -73.9851] Times Square

[40.7505, -73.9934] Empire State Building

```

## Multiple Points (Auto-zoom & Centering)

### Australian Cities

```map

[-37.8136, 144.9631] Melbourne

[-33.8688, 151.2093] Sydney

[-27.4705, 153.0260] Brisbane

[-31.9505, 115.8605] Perth

```

### Melbourne Attractions (Close zoom)

```map

[-37.8136, 144.9631] Melbourne CBD

[-37.8210, 144.9633] Federation Square

[-37.8182, 144.9685] Royal Botanic Gardens

[-37.8004, 144.9842] Melbourne Zoo

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

[-37.8136, 144.9631] Melbourne CBD

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
