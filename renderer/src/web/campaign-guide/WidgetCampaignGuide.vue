<template>
  <Widget
    :config="config"
    :removable="true"
    :inline-edit="false"
    move-handles="top-bottom"
  >
    <div v-if="!currentMap" class="p-2 text-gray-100 p-1 flex items-center justify-between gap-4 text-[#d9d6cf] [text-shadow:1px_1px_2px_#000]">
      <span class="truncate">{{ config.wmTitle || "Untitled" }}</span>
    </div>

    <div v-if="currentMap" class="p-2 w-full min-w-[300px] max-w-[400px] rounded-md opacity-80 text-[#d9d6cf] [text-shadow:1px_1px_2px_#000]">
      <div class="px-2 pb-2 flex items-center">
        <div class="flex-1">{{ t('campaign_guide.level') }} {{ characterLevel }}</div>
        <div 
          class="flex-1 text-right"
          :class="{
            'text-red-800': expPenalty !== '100.0',
            'text-yellow-800': expPenalty == '100.0',
          }"
        >
          {{ t('campaign_guide.exp_rate' )}} {{ expPenalty }}%
        </div>
      </div>
      
      <span class="inline-block px-2 rounded-md underline underline-offset-4">
        {{ currentMap.name }}
      </span>
      <ul class="px-2 py-2 space-y-1">
        <template v-for="(g, i) in currentMap.guides" :key="i">
          <!-- section -->
          <li v-if="g.section" class="flex items-center gap-3 py-1">
            <div class="flex-1 min-w-8 border-t border-neutral-400"></div>
            <span class="text-sm italic text-neutral-400 whitespace-nowrap">{{ g.text }}</span>
            <div class="flex-1 min-w-8 border-t border-neutral-400"></div>
          </li>
          <!-- ul item -->
          <li v-else class="flex items-start gap-1.5">
            <span class="flex items-center h-[1lh] shrink-0">
             <img class="w-3 h-3" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA1MTIgNTEyJyBzdHlsZT0naGVpZ2h0OiA1MTJweDsgd2lkdGg6IDUxMnB4Oyc+PGNpcmNsZSBjeD0nMjU2JyBjeT0nMjU2JyByPScyNTYnIGZpbGw9JyMwMDAwMDAnIGZpbGwtb3BhY2l0eT0nMC4wMSc+PC9jaXJjbGU+PGcgY2xhc3M9JycgdHJhbnNmb3JtPSd0cmFuc2xhdGUoMCwwKScgc3R5bGU9Jyc+PHBhdGggZD0nTTE4LjUwNiAxOS44OTV2MzcuNTZMMTM1LjExIDE3NC4wNmwzMy43NTUtMzMuNzU3TDQ4Ljk3IDE5Ljg5NUgxOC41MDd6bTI5Ni45MjQgODEuNjA3Yy04LjM5OCAxNy42OTUtMTcuNTggMzQuNTE0LTI3LjU1NSA1MC40OCA1My4wNTIgNTUuNiAxMDkuMDk0IDE2NS4xNTUgMTQ1LjYwMiAyNzAuODI3bDYuMzMyIDE4LjMyNy0xOC4yOC02LjQ2N2MtMTA0LjY4Ny0zNy4wMzQtMjIwLjYyLTkxLjI2NC0yNzQuMzc0LTE0MS45NjctMTUuOTcyIDkuOTgtMzIuNzkzIDE5LjE2NS01MC40OSAyNy41NjMgNTMuNjkzIDM1LjY4NSAxMjEuNTcgNjkuMjIyIDE4OS40OTYgOTUuMTY2LTE0LjQzNyA3LjE4OC0yOS45MzggMTMuNTktNDYuNTggMTkuMjdsLjAwMi4wMDNjNjguMjY0IDM4LjYzIDE3NS41NyA2NS40NyAyNTQuNDEyIDY0LjEyNyAxLjMzLTc4LjA1Mi0yNy4wOC0xODguOTUtNjQuMTI3LTI1NC40MTYtNS43NiAxNi44Ny0xMi4yNTcgMzIuNTctMTkuNTYgNDcuMTY2LTI2LjQ1OC02OS4yMDUtNjAuMzg3LTEzOC4xODItOTQuODgtMTkwLjA4em0tMTE3Ljg1OCAzNi41MjNMMTM1Ljc5IDE5OS44MWMzNC4yMDcgMzEuNjIgNjcuNzc1IDU2Ljc2MyA5NC43OTggNzEuNTk4IDE0LjQ1NCA3LjkzNSAyNy4wOTQgMTIuOTUgMzYuMzM0IDE0Ljc2MiA5LjI0IDEuODEyIDEzLjc3OC4zNCAxNS41NjQtMS40NDUgMS43ODYtMS43ODYgMy4yNi02LjMyNiAxLjQ0OC0xNS41NjUtMS44MTItOS4yNC02LjgzLTIxLjg4LTE0Ljc2NC0zNi4zMzQtMTQuODM1LTI3LjAyMy0zOS45NzYtNjAuNTktNzEuNTk4LTk0Ljh6bTc5Ljc2MiAzMC4wOGMtNC42NiA2LjgxLTkuNDggMTMuNDUtMTQuNDU3IDE5LjkyNiA4Ljg5MiAxMi41NTcgMTYuNTIgMjQuNTg3IDIyLjY3NiAzNS44MDIgOC41MTUgMTUuNTEgMTQuMzA2IDI5LjQzIDE2LjcxOCA0MS43MyAyLjQxNCAxMi4zIDEuNTI4IDI0LjI4LTYuNTcgMzIuMzc3LTguMDk2IDguMDk2LTIwLjA3NiA4Ljk4Mi0zMi4zNzYgNi41Ny0xMi4zLTIuNDEzLTI2LjIyLTguMjA2LTQxLjczLTE2LjcyLTExLjEtNi4wOTQtMjMtMTMuNjMyLTM1LjQxNC0yMi40MDVhNDQ3Ljc4MiA0NDcuNzgyIDAgMCAxLTIyLjg3NyAxNi43NmM0Ny4yNjMgNDIuMjEgMTQ5LjY2NCA5Mi4zMTcgMjQ1LjU0NSAxMjcuODczLTM1LjE5LTk1Ljc2Ni04Ni4zNDctMTkyLjYwMi0xMzEuNTE0LTI0MS45MTN6JyBmaWxsPScjZmZmJyBmaWxsLW9wYWNpdHk9JzEnPjwvcGF0aD48L2c+PC9zdmc+" />
            </span>
            <span class="break-words min-w-0">
              {{ g.text }}
              <span v-if="g.optional" class="inline-block px-2 py-0.5 mx-0.5 rounded text-xs bg-gray-700 text-white">{{ t('campaign_guide.optional') }}</span>
              <span v-if="g.attr" class="inline-block px-1.5 py-0.5 mx-0.5 rounded text-xs bg-green-700 text-green-100">{{ g.attr }}</span>
              <span v-if="g.item" class="inline-block px-1.5 py-0.5 mx-0.5 rounded text-xs bg-yellow-700 text-yellow-100">{{ g.item }}</span>
            </span>
          </li>
        </template>
      </ul>
    </div>
  </Widget>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType } from "vue";

import Widget from "../overlay/Widget.vue";
import { WidgetManager, WidgetSpec } from "../overlay/interfaces.js";
import { CampaignGuideWidget, Map } from "./widget.js";
import { useI18n } from "vue-i18n";
import { useClientLog } from "../client-log/client-log.js";

function calcBaseSafeZone(playerLevel: number): number {
  return Math.floor(playerLevel / 16) + 3;
}

function getOverIdeal(playerLevel: number, monsterLevel: number): number {
  const safeZone = calcBaseSafeZone(playerLevel);
  return safeZone - (monsterLevel - playerLevel);
}

function getExpPenalty(playerLevel: number, monsterLevel: number): number {
  const safeZone =
    monsterLevel > playerLevel ? calcBaseSafeZone(playerLevel) : 0;

  const effectiveDiff = Math.max(
    Math.abs(monsterLevel - playerLevel) - safeZone,
    0,
  );

  const expMulti = Math.max(
    0.01,
    ((playerLevel + 5) / (playerLevel + 5 + effectiveDiff ** 2.5)) ** 1.3,
  );

  return 100 * expMulti;
}

export default defineComponent({
  widget: {
    type: "campaign-guide",
    instances: "multi",
    trNameKey: "campaign_guide.name",
  } satisfies WidgetSpec,
  components: { Widget },
  props: {
    config: {
      type: Object as PropType<CampaignGuideWidget>,
      required: true,
    },
  },
  setup(props) {
    const { playerLevel, setPlayerLevel, areaLevel, currentZone } = useClientLog();

    const characterLevel = computed({
      get() {
        return playerLevel.value;
      },
      set(value: number) {
        setPlayerLevel(value);
      },
    });

    const wm = inject<WidgetManager>("wm")!;

    const { t, tm } = useI18n();

    function tmArray<T>(key: string): T[] {
      try {
        const raw = tm(key)
        return Array.isArray(raw) ? (raw as T[]) : []
      } catch {
        return []
      }
    }

    const defaultMaps = computed(() => tmArray<Map>('campaign_guide.default_maps'))

    if (props.config.wmFlags[0] === "uninitialized") {
      props.config.wmFlags = [];
      props.config.anchor = {
        pos: "tl",
        x: Math.random() * (40 - 20) + 20,
        y: Math.random() * (40 - 20) + 20,
      };
      props.config.wmTitle = t("campaign_guide.default_title")
      props.config.maps = defaultMaps.value
      wm.show(props.config.wmId);
    }

    const currentMap = computed(() =>
      props.config.maps.find((m) => m.mapId === currentZone.value)
    );
    
    return {
      t,
      currentMap,
      characterLevel,
      areaLevel,
      expPenalty: computed(() => {
        return getExpPenalty(characterLevel.value, areaLevel.value).toFixed(1);
      }),
      overIdeal: computed(() => {
        return getOverIdeal(characterLevel.value, areaLevel.value);
      }),
    };
  },
});
</script>

<style lang="postcss" module>
.xpInput {
  @apply bg-gray-900;
  @apply text-gray-300;
  @apply text-center;
  @apply w-8;
  @apply px-1;
  @apply border border-transparent;
  @apply rounded;

  &::placeholder {
    @apply text-gray-700;
    font-size: 0.8125rem;
  }

  /* &:not(:placeholder-shown) { @apply border-gray-600; } */

  &:focus {
    @apply border-gray-500;
    cursor: none;
  }
}

.xpContainer {
  @apply flex flex-row;
  @apply justify-between items-center;
  @apply px-2;

  @apply rounded;
  @apply bg-gray-800;
  @apply border-4 border-gray-900;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.75), 0 1px 2px 0 rgba(0, 0, 0, 0.75);
}
</style>
