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
// The pinned 2023 UniApp H5 compiler drops object-style bindings on <image>.
// Keep icon dimensions in static CSS classes so H5, App and mini-program builds
// all receive an explicit size instead of the H5 default 320 × 240 image box.
const sizeClass = computed(() => `app-icon--${Number.parseInt(String(props.size), 10) || 18}`);
</script>

<template>
  <image
    :class="['app-icon', sizeClass]"
    :src="src"
    mode="aspectFit"
  />
</template>

<style scoped>
.app-icon {
  display: inline-block;
  flex: none;
  vertical-align: middle;
}
.app-icon--12 { width: 12px; height: 12px; }
.app-icon--14 { width: 14px; height: 14px; }
.app-icon--15 { width: 15px; height: 15px; }
.app-icon--16 { width: 16px; height: 16px; }
.app-icon--17 { width: 17px; height: 17px; }
.app-icon--18 { width: 18px; height: 18px; }
.app-icon--19 { width: 19px; height: 19px; }
.app-icon--20 { width: 20px; height: 20px; }
.app-icon--21 { width: 21px; height: 21px; }
.app-icon--22 { width: 22px; height: 22px; }
.app-icon--23 { width: 23px; height: 23px; }
.app-icon--24 { width: 24px; height: 24px; }
.app-icon--25 { width: 25px; height: 25px; }
.app-icon--27 { width: 27px; height: 27px; }
.app-icon--28 { width: 28px; height: 28px; }
.app-icon--29 { width: 29px; height: 29px; }
.app-icon--30 { width: 30px; height: 30px; }
.app-icon--31 { width: 31px; height: 31px; }
.app-icon--33 { width: 33px; height: 33px; }
.app-icon--34 { width: 34px; height: 34px; }
.app-icon--35 { width: 35px; height: 35px; }
.app-icon--38 { width: 38px; height: 38px; }
.app-icon--40 { width: 40px; height: 40px; }
</style>
