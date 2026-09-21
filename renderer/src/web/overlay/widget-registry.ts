import type { Component } from "vue";
import type { WidgetSpec } from "./interfaces";
import WidgetTimer from "../stopwatch/WidgetTimer.vue";
import WidgetStashSearch from "../stash-search/WidgetStashSearch.vue";
import WidgetMenu from "./WidgetMenu.vue";
import PriceCheckWindow from "@/web/price-check/PriceCheckWindow.vue";
import WidgetItemCheck from "@/web/item-check/WidgetItemCheck.vue";
import WidgetImageStrip from "./WidgetImageStrip.vue";
import WidgetDelveGrid from "./WidgetDelveGrid.vue";
import WidgetItemSearch from "../item-search/WidgetItemSearch.vue";
import WidgetSettings from "../settings/SettingsWindow.vue";
import WidgetXpTracker from "../leveling/WidgetXpTracker.vue";
import WidgetNotepad from "../notepad/WidgetNotepad.vue";
import WidgetLibrary from "../library/WidgetLibrary.vue";
import WidgetExpedition from "../expedition-check/WidgetExpedition.vue";
import WidgetPriceTrack from "../price-track/WidgetPriceTrack.vue";
import WidgetUrlList from "../url-list/WidgetUrlList.vue";
import WidgetCampaignGuide from "../campaign-guide/WidgetCampaignGuide.vue";
import WidgetCrafting from "../crafting/WidgetCrafting.vue";
import WidgetBuildPlanner from "../build-planner/WidgetBuildPlanner.vue";

type WidgetComponent = Component & { widget: WidgetSpec };

export const registry = {
  widgets: [] as WidgetComponent[],

  getWidgetComponent(wmType: string) {
    return this.widgets.find((component) => component.widget.type === wmType);
  },
};

// Core
registry.widgets.push(WidgetMenu as unknown as WidgetComponent);
registry.widgets.push(WidgetSettings as unknown as WidgetComponent);
// Extra
registry.widgets.push(WidgetItemSearch as unknown as WidgetComponent);
registry.widgets.push(WidgetXpTracker as unknown as WidgetComponent);
registry.widgets.push(WidgetTimer as unknown as WidgetComponent);
registry.widgets.push(WidgetStashSearch as unknown as WidgetComponent);
registry.widgets.push(PriceCheckWindow as unknown as WidgetComponent);
registry.widgets.push(WidgetItemCheck as unknown as WidgetComponent);
registry.widgets.push(WidgetImageStrip as unknown as WidgetComponent);
registry.widgets.push(WidgetDelveGrid as unknown as WidgetComponent);
registry.widgets.push(WidgetNotepad as unknown as WidgetComponent);
registry.widgets.push(WidgetLibrary as unknown as WidgetComponent);
registry.widgets.push(WidgetExpedition as unknown as WidgetComponent);
registry.widgets.push(WidgetPriceTrack as unknown as WidgetComponent);
registry.widgets.push(WidgetUrlList as unknown as WidgetComponent);
registry.widgets.push(WidgetCampaignGuide as unknown as WidgetComponent);
registry.widgets.push(WidgetCrafting as unknown as WidgetComponent);
registry.widgets.push(WidgetBuildPlanner as unknown as WidgetComponent);
