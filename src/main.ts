import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	MarkdownPostProcessorContext,
} from "obsidian";
import React from "react";
import { createRoot } from "react-dom/client";
import { MapComponent } from "./MapComponent";

interface PluginSettings {
	defaultZoom: number;
}

const DEFAULT_SETTINGS: PluginSettings = {
	defaultZoom: 15,
};

export default class MapPlugin extends Plugin {
	settings: PluginSettings;
	private reactRoots: Set<any> = new Set();

	async onload() {
		await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor(
			"map",
			this.processMap.bind(this)
		);

		this.addSettingTab(new SettingTab(this.app, this));
	}

	onunload() {
		// Clean up all React roots to prevent memory leaks
		this.reactRoots.forEach((root) => {
			try {
				root.unmount();
			} catch (error) {
				console.warn("Error unmounting React root:", error);
			}
		});
		this.reactRoots.clear();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private parseCoordinates(
		source: string
	): Array<{ lat: number; lng: number; label?: string }> {
		const lines = source
			.trim()
			.split("\n")
			.filter((line) => line.trim());
		const coordinates: Array<{ lat: number; lng: number; label?: string }> =
			[];

		for (const line of lines) {
			const parts = line.split(",").map((s) => s.trim());
			if (parts.length >= 2) {
				const lat = parseFloat(parts[0]);
				const lng = parseFloat(parts[1]);
				const label =
					parts.length > 2
						? parts.slice(2).join(",").trim()
						: undefined;

				if (!isNaN(lat) && !isNaN(lng)) {
					coordinates.push({ lat, lng, label });
				}
			}
		}

		return coordinates;
	}

	private async processMap(
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) {
		const coordinates = this.parseCoordinates(source);

		if (coordinates.length === 0) {
			el.createEl("div", {
				text: "Invalid coordinates. Use format: lat,lng or multiple lines with lat,lng,label",
			});
			return;
		}

		const initialCenter = [coordinates[0].lng, coordinates[0].lat];

		// Create React container
		const reactContainer = el.createEl("div");
		reactContainer.style.overflow = "hidden";
		reactContainer.style.border =
			"1px solid var(--background-modifier-border)";
		reactContainer.style.borderRadius = "4px";
		reactContainer.style.height = "400px";
		reactContainer.style.width = "100%";
		reactContainer.style.height = "100%";
		reactContainer.style.position = "relative";

		// Create React root and render map component
		const root = createRoot(reactContainer);
		this.reactRoots.add(root);

		root.render(
			React.createElement(MapComponent, {
				pins: coordinates,
				initialCenter: initialCenter as [number, number],
				initialZoom: this.settings.defaultZoom,
			})
		);
	}
}

class SettingTab extends PluginSettingTab {
	plugin: MapPlugin;

	constructor(app: App, plugin: MapPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "OpenStreetMap Settings" });

		new Setting(containerEl)
			.setName("Default Zoom Level")
			.setDesc("Default zoom level for maps (1-20)")
			.addSlider((slider) =>
				slider
					.setLimits(1, 20, 1)
					.setValue(this.plugin.settings.defaultZoom)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.defaultZoom = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
