import { App, Plugin, PluginSettingTab, Setting, Modal } from "obsidian";
import React from "react";
import { createRoot } from "react-dom/client";
import { MapComponent } from "./MapComponent";
import { parseMapSyntax, type MapPin } from "./parseMapSyntax";

interface PluginSettings {
  defaultZoom: number;
  pinSize: number;
  defaultPinColor: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
  defaultZoom: 15,
  pinSize: 12,
  defaultPinColor: "#ff4444",
};

interface MapInstance {
  root: any;
  element: HTMLElement;
  renderFunction: () => void;
}

class MapModal extends Modal {
  private pins: MapPin[];
  private initialCenter: [number, number];
  private settings: PluginSettings;
  private root: any;

  constructor(app: App, pins: MapPin[], initialCenter: [number, number], settings: PluginSettings) {
    super(app);
    this.pins = pins;
    this.initialCenter = initialCenter;
    this.settings = settings;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    // Set modal size to be larger and ensure proper height
    this.modalEl.style.width = "90vw";
    this.modalEl.style.height = "90vh";
    this.modalEl.style.maxWidth = "1200px";
    this.modalEl.style.maxHeight = "800px";
    
    // Ensure content container uses full height
    contentEl.style.height = "100%";
    contentEl.style.display = "flex";
    contentEl.style.flexDirection = "column";
    contentEl.style.padding = "20px";
    contentEl.style.boxSizing = "border-box";
    
    // Create title
    const title = contentEl.createEl("h2", { text: "Map View" });
    title.style.margin = "0 0 16px 0";
    title.style.fontSize = "20px";
    title.style.fontWeight = "600";
    title.style.color = "var(--text-normal)";
    title.style.flexShrink = "0";
    
    // Create map container that takes remaining space
    const mapContainer = contentEl.createEl("div");
    mapContainer.style.width = "100%";
    mapContainer.style.flex = "1";
    mapContainer.style.minHeight = "0"; // Important for flex child
    mapContainer.style.border = "1px solid var(--background-modifier-border)";
    mapContainer.style.borderRadius = "8px";
    mapContainer.style.overflow = "hidden";
    mapContainer.style.position = "relative";
    
    // Create React root and render map
    this.root = createRoot(mapContainer);
    this.root.render(
      React.createElement(MapComponent, {
        pins: this.pins,
        initialCenter: this.initialCenter,
        initialZoom: this.settings.defaultZoom,
        pinSize: this.settings.pinSize,
        defaultPinColor: this.settings.defaultPinColor,
        height: "100%",
      })
    );
  }

  onClose() {
    if (this.root) {
      this.root.unmount();
    }
  }
}

export default class MapPlugin extends Plugin {
  settings: PluginSettings;
  private mapInstances: Map<HTMLElement, MapInstance> = new Map();

  async onload() {
    await this.loadSettings();

    this.registerMarkdownCodeBlockProcessor("map", this.processMap.bind(this));

    this.addSettingTab(new SettingTab(this.app, this));
  }

  onunload() {
    // Clean up all React roots to prevent memory leaks
    this.mapInstances.forEach((instance) => {
      try {
        instance.root.unmount();
      } catch (error) {
        console.warn("Error unmounting React root:", error);
      }
    });
    this.mapInstances.clear();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // Refresh all existing map instances with new settings
    this.refreshAllMaps();
  }

  private refreshAllMaps() {
    this.mapInstances.forEach((instance) => {
      try {
        instance.renderFunction();
      } catch (error) {
        console.warn("Error refreshing map:", error);
      }
    });
  }

  private async processMap(source: string, el: HTMLElement) {
    const parseResult = parseMapSyntax(source);

    // Show errors if any
    if (parseResult.errors.length > 0) {
      const errorDiv = el.createEl("div");
      errorDiv.style.color = "var(--text-error)";
      errorDiv.style.fontSize = "14px";
      errorDiv.style.marginBottom = "8px";
      errorDiv.style.fontFamily = "var(--font-monospace)";

      parseResult.errors.forEach((error) => {
        const errorLine = errorDiv.createEl("div");
        errorLine.textContent = "⚠ " + error;
        errorLine.style.marginBottom = "4px";
      });

      // If we have some valid pins, show them anyway
      if (parseResult.pins.length === 0) {
        return;
      }
    }

    if (parseResult.pins.length === 0) {
      el.createEl("div", {
        text: "No valid coordinates found. Use format: [lat, lng] label",
      });
      return;
    }

    const initialCenter = [parseResult.pins[0].lng, parseResult.pins[0].lat];

    // Create React container
    const reactContainer = el.createEl("div");
    reactContainer.style.overflow = "hidden";
    reactContainer.style.border = "1px solid var(--background-modifier-border)";
    reactContainer.style.borderRadius = "4px";
    reactContainer.style.height = "400px";
    reactContainer.style.width = "100%";
    reactContainer.style.position = "relative";

    // Create React root and render map component
    const root = createRoot(reactContainer);

    // Create render function that uses current settings
    const renderFunction = () => {
      root.render(
        React.createElement(MapComponent, {
          pins: parseResult.pins,
          initialCenter: initialCenter as [number, number],
          initialZoom: this.settings.defaultZoom,
          pinSize: this.settings.pinSize,
          defaultPinColor: this.settings.defaultPinColor,
          onOpenModal: () => {
            const modal = new MapModal(
              this.app, 
              parseResult.pins, 
              initialCenter as [number, number], 
              this.settings
            );
            modal.open();
          },
        })
      );
    };

    // Store the map instance for future updates
    const mapInstance: MapInstance = {
      root,
      element: reactContainer,
      renderFunction,
    };
    this.mapInstances.set(reactContainer, mapInstance);

    // Set up cleanup when element is removed from DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (
            node === reactContainer ||
            (node as Element)?.contains?.(reactContainer)
          ) {
            this.mapInstances.delete(reactContainer);
            observer.disconnect();
          }
        });
      });
    });

    // Start observing the parent for removals
    if (reactContainer.parentNode) {
      observer.observe(reactContainer.parentNode, {
        childList: true,
        subtree: true,
      });
    }

    // Initial render
    renderFunction();
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

    new Setting(containerEl)
      .setName("Pin Size")
      .setDesc("Size of map pins in pixels (8-20px)")
      .addSlider((slider) =>
        slider
          .setLimits(8, 20, 1)
          .setValue(this.plugin.settings.pinSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.pinSize = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default Pin Color")
      .setDesc("Default color for map pins (hex color code)")
      .addText((text) =>
        text
          .setPlaceholder("#ff4444")
          .setValue(this.plugin.settings.defaultPinColor)
          .onChange(async (value) => {
            // Validate hex color format
            const hexPattern = /^#[0-9A-Fa-f]{6}$/;
            if (hexPattern.test(value) || value === "") {
              this.plugin.settings.defaultPinColor = value || "#ff4444";
              await this.plugin.saveSettings();
            }
          })
      );
  }
}
