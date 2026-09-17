<template>
  <Widget
    :config="config"
    :removable="true"
    :inline-edit="false"
    move-handles="top-bottom"
  >
    <div v-if="currentMap" class="widget-default-style p-2 w-[400px]">
        <span class="inline-block px-2 py-1 rounded-md bg-slate-700 text-slate-100 font-bold">
          {{ currentMap.name }}
        </span>
      <ul class="px-2 py-3 space-y-1">
        <template v-for="(g, i) in currentMap.guides" :key="i">
          <!-- section -->
          <li v-if="g.section" class="flex items-center gap-3 py-1">
            <div class="flex-1 min-w-8 border-t border-neutral-400"></div>
            <span class="text-sm italic text-neutral-400 whitespace-nowrap">{{ g.text }}</span>
            <div class="flex-1 min-w-8 border-t border-neutral-400"></div>
          </li>
          <!-- ul item -->
          <li v-else class="flex items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-neutral-500 shrink-0"></span>
            <span> • {{ g.text }}
              <!-- optional -->
              <span v-if="g.optional" class="px-2 py-0.5 mx-0.5 ml-1.5 rounded text-xs bg-gray-700 text-white">可選</span>
              <!-- attr -->
              <span v-if="g.attr" class="px-1.5 py-0.5 mx-0.5 rounded text-xs bg-green-700 text-green-100">{{ g.attr }}</span>
              <!-- item -->
              <span v-if="g.item" class="px-1.5 py-0.5 mx-0.5 rounded text-xs bg-yellow-700 text-yellow-100">{{ g.item }}</span>
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
import { CampaignGuideWidget } from "./widget.js";
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
    defaultInstances: (): CampaignGuideWidget[] => {
      return [{
        wmId: 0,
        wmType: "campaign-guide",
        wmTitle: "Campaign guide",
        wmWants: "hide",
        wmZorder: null,
        wmFlags: [],
        anchor: {
          pos: "cr",
          x: 60,
          y: 46,
        },
        maps: []
      }];
    },
  } satisfies WidgetSpec,
  components: { Widget },
  props: {
    config: {
      type: Object as PropType<CampaignGuideWidget>,
      required: true,
    },
  },
  setup(props) {
    const { playerLevel, setPlayerLevel, areaLevel, zoneName } = useClientLog();

    const characterLevel = computed({
      get() {
        return playerLevel.value;
      },
      set(value: number) {
        setPlayerLevel(value);
      },
    });

    const wm = inject<WidgetManager>("wm")!;

    if (props.config.wmFlags[0] === "uninitialized") {
      props.config.anchor = {
        pos: "tl",
        x: Math.random() * (40 - 20) + 20,
        y: Math.random() * (40 - 20) + 20,
      };
      props.config.maps = [
        {
          mapId: "G1_1",
          name: "皆伐營地",
          guides: [
            {"optional":true,"text":"與倫利交談 → 前往 皆伐", attr: "+10% 冰冷抗性", item: "技能寶石(5)"}, 
            {"section": true, "optional":false,"text":"完成 赤谷 後"},
            {"optional":false,"text":"與倫利交談 → 返回 葛瑞爾林"}
          ]
        },
        {
          mapId: "G1_2",
          name: "河岸",
          guides: [{"optional":false,"text":"擊殺臃腫磨坊主"}, {"optional":false,"text":"进入城镇"}]
        }
      ]
      wm.show(props.config.wmId);
    }

    const { t } = useI18n();

    const currentMap = computed(() =>
      props.config.maps.find((m) => m.mapId === zoneName.value)
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
