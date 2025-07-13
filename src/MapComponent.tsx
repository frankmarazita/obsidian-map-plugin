import React, { useRef, useEffect, useState } from "react";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import { Point } from "ol/geom";
import { Feature } from "ol";
import { fromLonLat } from "ol/proj";
import { Style, Fill, Stroke, Circle, Text } from "ol/style";
import "ol/ol.css";
import { calculateBounds } from "./calculateBounds";
import { type MapPin } from "./parseMapSyntax";

interface GroupDropdownProps {
  groups: string[];
  hiddenGroups: Set<string>;
  onToggleGroup: (group: string) => void;
}

const GroupDropdown: React.FC<GroupDropdownProps> = ({
  groups,
  hiddenGroups,
  onToggleGroup,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: "28px",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px",
          padding: "0 8px",
          minWidth: "70px",
          color: "white",
          backdropFilter: "blur(4px)",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        }}
        title="Toggle pin groups"
      >
        🏷️ Groups
      </button>
      {isOpen && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              right: 0,
              marginBottom: "4px",
              backgroundColor: "var(--background-primary)",
              border: "1px solid var(--background-modifier-border)",
              borderRadius: "6px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15)",
              minWidth: "140px",
              maxWidth: "200px",
              zIndex: 1000,
              backdropFilter: "blur(8px)",
              overflow: "hidden",
            }}
          >
            {groups.map((group, index) => (
              <div
                key={group}
                onClick={() => {
                  onToggleGroup(group);
                  setIsOpen(false);
                }}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "var(--text-normal)",
                  backgroundColor: "transparent",
                  borderBottom:
                    index === groups.length - 1
                      ? "none"
                      : "1px solid var(--background-modifier-border-hover)",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--background-modifier-hover)";
                  e.currentTarget.style.color = "var(--text-accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-normal)";
                }}
              >
                <span style={{ 
                  fontSize: "14px", 
                  fontWeight: "600",
                  color: hiddenGroups.has(group) ? "var(--text-muted)" : "var(--text-accent)"
                }}>
                  {hiddenGroups.has(group) ? "☐" : "☑"}
                </span>
                <span style={{ 
                  flex: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>
                  {group}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface MapComponentProps {
  pins: MapPin[];
  initialCenter: [number, number];
  initialZoom: number;
  pinSize: number;
  defaultPinColor: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  pins,
  initialCenter,
  initialZoom,
  pinSize,
  defaultPinColor,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const olMapRef = useRef<Map | null>(null);
  const initialViewRef = useRef<{
    center: [number, number];
    zoom: number;
  } | null>(null);

  // Group filtering state
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set());

  // Get unique groups from pins
  const groups = Array.from(
    new Set(pins.map((pin) => pin.group).filter(Boolean))
  ) as string[];

  useEffect(() => {
    if (!mapRef.current || olMapRef.current) return;

    // Filter pins based on hidden groups
    const visiblePins = pins.filter(
      (pin) => !pin.group || !hiddenGroups.has(pin.group)
    );

    // Calculate optimal view for visible pins
    const optimalView =
      visiblePins.length > 1
        ? calculateBounds(visiblePins)
        : { center: initialCenter, zoom: initialZoom };
    initialViewRef.current = optimalView;

    // Create marker features with improved styling
    const features = visiblePins.map((pin, index) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([pin.lng, pin.lat])),
        name: pin.label || `${pin.lat}, ${pin.lng}`,
        index: index,
        pin: pin, // Store full pin data for styling
      });
      return feature;
    });

    // Create vector source and layer for markers
    const vectorSource = new VectorSource({
      features: features,
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        const name = feature.get("name");
        const pin = feature.get("pin") as MapPin;

        // Get pin color or use configured default
        const pinColor = getColorValue(pin.color) || defaultPinColor;

        // Get icon text or use default circle
        const iconText = getIconText(pin.icon);

        const styles = [];

        // Main pin circle (configurable size)
        styles.push(
          new Style({
            image: new Circle({
              radius: pinSize,
              fill: new Fill({ color: pinColor }),
              stroke: new Stroke({ color: "#ffffff", width: 3 }),
            }),
          })
        );

        // Icon inside the pin (if icon is specified)
        if (iconText) {
          // Scale icon size with pin size (roughly 50% of pin diameter to prevent clipping)
          const iconFontSize = Math.max(8, Math.round(pinSize * 1.0));
          styles.push(
            new Style({
              text: new Text({
                text: iconText,
                offsetY: 0, // Center the icon in the pin
                fill: new Fill({ color: "#ffffff" }),
                stroke: new Stroke({ color: pinColor, width: 1 }),
                font: `${iconFontSize}px sans-serif`,
                textAlign: "center",
              }),
            })
          );
        }

        // Label above the pin (if label exists)
        if (name) {
          styles.push(
            new Style({
              text: new Text({
                text: name,
                offsetY: -30, // Position above the pin
                fill: new Fill({ color: "#000000" }),
                stroke: new Stroke({ color: "#ffffff", width: 3 }),
                font: "12px sans-serif",
                textAlign: "center",
                backgroundFill: new Fill({ color: "rgba(255, 255, 255, 0.8)" }),
                padding: [2, 4, 2, 4],
              }),
            })
          );
        }

        return styles;
      },
    });

    const map = new Map({
      target: mapRef.current,
      controls: [],
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat(optimalView.center),
        zoom: optimalView.zoom,
      }),
    });

    olMapRef.current = map;

    return () => {
      if (olMapRef.current) {
        olMapRef.current.setTarget(undefined);
        olMapRef.current = null;
      }
    };
  }, [
    pins,
    initialCenter,
    initialZoom,
    pinSize,
    defaultPinColor,
    hiddenGroups,
  ]);

  const handleReset = () => {
    if (olMapRef.current && initialViewRef.current) {
      const view = olMapRef.current.getView();
      view.animate({
        center: fromLonLat(initialViewRef.current.center),
        zoom: initialViewRef.current.zoom,
        duration: 500,
      });
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "400px" }}>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          border: "1px solid var(--background-modifier-border)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          display: "flex",
          gap: "8px",
          zIndex: 1000,
        }}
      >
        {/* Group filter dropdown */}
        {groups.length > 0 && (
          <GroupDropdown
            groups={groups}
            hiddenGroups={hiddenGroups}
            onToggleGroup={(group) => {
              const newHiddenGroups = new Set(hiddenGroups);
              if (hiddenGroups.has(group)) {
                newHiddenGroups.delete(group);
              } else {
                newHiddenGroups.add(group);
              }
              setHiddenGroups(newHiddenGroups);
            }}
          />
        )}

        {/* Reset button */}
        <button
          onClick={handleReset}
          style={{
            width: "28px",
            height: "28px",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
          }}
          title="Reset to initial view"
        >
          🏠
        </button>
      </div>
    </div>
  );
};

// Helper function to convert color names/hex to valid color values
function getColorValue(color?: string): string | undefined {
  if (!color) return undefined;

  // Color name mapping
  const colorMap: Record<string, string> = {
    red: "#ff4444",
    blue: "#4444ff",
    green: "#44ff44",
    yellow: "#ffff44",
    orange: "#ff8844",
    purple: "#8844ff",
    pink: "#ff44ff",
    brown: "#8b4513",
    gray: "#888888",
    black: "#000000",
    white: "#ffffff",
  };

  // Return mapped color or assume it's a hex value
  return colorMap[color.toLowerCase()] || color;
}

// Helper function to convert icon names to emoji or symbols
function getIconText(icon?: string): string | undefined {
  if (!icon) return undefined;

  // Icon mapping
  const iconMap: Record<string, string> = {
    star: "⭐",
    heart: "❤️",
    flag: "🚩",
    pin: "📍",
    marker: "📍",
    home: "🏠",
    office: "🏢",
    school: "🏫",
    hospital: "🏥",
    restaurant: "🍽️",
    cafe: "☕",
    hotel: "🏨",
    park: "🌳",
    beach: "🏖️",
    mountain: "⛰️",
    airport: "✈️",
    train: "🚂",
    bus: "🚌",
    car: "🚗",
    bike: "🚲",
    walk: "🚶",
    shopping: "🛍️",
    museum: "🏛️",
    church: "⛪",
    warning: "⚠️",
    info: "ℹ️",
    check: "✅",
    cross: "❌",
  };

  return iconMap[icon.toLowerCase()];
}
