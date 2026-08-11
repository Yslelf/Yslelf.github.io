<script setup lang="ts">
import { computed } from "vue";
import { useThemeStore } from "@/stores/theme";

const props = withDefaults(
  defineProps<{ type: string; size?: string | number; color?: string }>(),
  {
    size: 18,
    color: "#267F6B",
  },
);
const theme = useThemeStore();

const iconNames: Record<string, string> = {
  map: "map",
  "map-filled": "map",
  "map-pin-ellipse": "map-pin",
  location: "map-pin",
  "location-filled": "map-pin",
  search: "search",
  tune: "sliders-horizontal",
  "tune-filled": "sliders-horizontal",
  star: "star",
  "star-filled": "star",
  fire: "flame",
  "fire-filled": "flame",
  shop: "store",
  "shop-filled": "store",
  image: "image",
  paperplane: "send",
  "paperplane-filled": "send",
  staff: "users",
  "staff-filled": "users",
  chat: "message-circle",
  "chat-filled": "message-circle",
  notification: "bell",
  audit: "badge-check",
  reward: "gift",
  person: "user",
  "person-filled": "user",
  down: "chevron-down",
  right: "chevron-right",
  back: "chevron-left",
  list: "list",
  calendar: "calendar-days",
  "hand-up": "thumbs-up",
  heart: "heart",
  "heart-filled": "heart",
  redo: "share-2",
  closeempty: "x",
  palette: "palette",
  plus: "plus",
};

const tone = computed(() => {
  const value = props.color.toLowerCase();
  if (value === "#fff" || value === "#ffffff" || value === "white")
    return "white";
  if (value.includes("efa3") || value.includes("d993")) return "amber";
  if (value.includes("2446") || value.includes("2645")) return "dark";
  if (/^#(6|7|8|9)/.test(value)) return "muted";
  if (theme.current === "river") return "river";
  if (theme.current === "sunset") return "sunset";
  return "green";
});
const iconName = computed(() => iconNames[props.type] ?? "star");
const src = computed(() => `/static/icons/${iconName.value}-${tone.value}.png`);
const dimension = computed(() =>
  typeof props.size === "number" ? `${props.size}px` : props.size,
);
</script>

<template>
  <image
    class="app-icon"
    :src="src"
    mode="aspectFit"
    :style="{ width: dimension, height: dimension }"
  />
</template>

<style scoped>
.app-icon {
  display: inline-block;
  flex: none;
  vertical-align: middle;
}
</style>
