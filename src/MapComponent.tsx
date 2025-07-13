import React, { useRef, useEffect } from "react";
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
import { calculateBounds, type Pin } from "./calculateBounds";

interface MapComponentProps {
	pins: Pin[];
	initialCenter: [number, number];
	initialZoom: number;
}

export const MapComponent: React.FC<MapComponentProps> = ({
	pins,
	initialCenter,
	initialZoom,
}) => {
	const mapRef = useRef<HTMLDivElement>(null);
	const olMapRef = useRef<Map | null>(null);
	const initialViewRef = useRef<{ center: [number, number]; zoom: number } | null>(null);

	useEffect(() => {
		if (!mapRef.current || olMapRef.current) return;

		// Calculate optimal view for multiple pins
		const optimalView = pins.length > 1 ? calculateBounds(pins) : { center: initialCenter, zoom: initialZoom };
		initialViewRef.current = optimalView;

		// Create marker features with improved styling
		const features = pins.map((pin, index) => {
			const feature = new Feature({
				geometry: new Point(fromLonLat([pin.lng, pin.lat])),
				name: pin.label || `${pin.lat}, ${pin.lng}`,
				index: index,
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
				const name = feature.get('name');
				return new Style({
					image: new Circle({
						radius: 8,
						fill: new Fill({ color: '#ff4444' }),
						stroke: new Stroke({ color: '#ffffff', width: 3 }),
					}),
					text: new Text({
						text: name,
						offsetY: -25,
						fill: new Fill({ color: '#000000' }),
						stroke: new Stroke({ color: '#ffffff', width: 3 }),
						font: '12px sans-serif',
						textAlign: 'center',
						backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 0.8)' }),
						padding: [2, 4, 2, 4],
					}),
				});
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
	}, [pins, initialCenter, initialZoom]);

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
					bottom: "10px",
					right: "10px",
					backgroundColor: "rgba(255, 255, 255, 0.9)",
					border: "1px solid #ccc",
					borderRadius: "6px",
					padding: "4px",
					display: "flex",
					gap: "4px",
					zIndex: 1000,
					boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
				}}
			>
				<button
					onClick={handleReset}
					style={{
						width: "28px",
						height: "28px",
						backgroundColor: "transparent",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
						fontSize: "14px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						transition: "background-color 0.2s",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.1)";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.backgroundColor = "transparent";
					}}
					title="Reset to initial view"
				>
					🏠
				</button>
			</div>
		</div>
	);
};
