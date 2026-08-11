<script setup lang="ts">
import { computed, ref } from "vue";
import ExplorePage from "@/pages/explore/index.vue";
import PlaceholderPage from "@/pages/common/placeholder.vue";
import AppIcon from "@/components/AppIcon.vue";
import PublishComposer from "@/components/publish/PublishComposer.vue";
import MinePage from "@/pages/mine/index.vue";
import MessagePage from "@/pages/message/index.vue";
import PartyPage from "@/pages/party/index.vue";
import type { Post } from "@/types/explore";
import { useExploreStore } from "@/stores/explore";
import { themes, useThemeStore, type ThemeId } from "@/stores/theme";

type TabKey = "explore" | "party" | "message" | "mine";
const active = ref<TabKey>("explore");
const theme = useThemeStore();
const showThemePicker = ref(false);
const showPublishSheet = ref(false);
const showComposer = ref(false);
const composerAlbumFirst = ref(false);
const exploreStore = useExploreStore();
const tabs: Array<{
  key: TabKey;
  label: string;
  icon: string;
  activeIcon: string;
}> = [
  {
    key: "explore",
    label: "探索",
    icon: "map",
    activeIcon: "paperplane-filled",
  },
  { key: "party", label: "组局", icon: "staff", activeIcon: "staff-filled" },
  { key: "message", label: "消息", icon: "chat", activeIcon: "chat-filled" },
  { key: "mine", label: "我的", icon: "person", activeIcon: "person-filled" },
];
const placeholder = computed(
  () =>
    ({
      party: {
        title: "组局",
        copy: "找到同频的人，一起去有趣的地方。",
        icon: "staff-filled",
      },
      message: {
        title: "消息",
        copy: "新鲜互动和同行邀请都会出现在这里。",
        icon: "chat-filled",
      },
      mine: {
        title: "我的",
        copy: "管理你的 XY 名片、足迹与收藏。",
        icon: "person-filled",
      },
    })[active.value as Exclude<TabKey, "explore">],
);

function choosePublish(type: "post" | "party" | "checkin" | "album") {
  showPublishSheet.value = false;
  if (type === "post" || type === "album") {
    composerAlbumFirst.value = type === "album";
    showComposer.value = true;
    return;
  }
  const labels = { party: "发起组局", checkin: "现场打卡" };
  uni.showToast({ title: `${labels[type]}功能即将展开`, icon: "none" });
}

function handlePublished(post: Post) {
  exploreStore.posts.unshift(post);
  showComposer.value = false;
  active.value = "explore";
  uni.showToast({ title: "发布成功", icon: "success" });
}
</script>

<template>
  <view class="app-shell" :class="`theme-${theme.current}`">
    <header class="desktop-topbar">
      <view class="desktop-brand"><view>XY</view><text>南昌</text></view
      ><view class="desktop-search"
        ><AppIcon type="search" size="20" color="#91a09c" /><input
          placeholder="搜索南昌地点与新鲜体验"
          confirm-type="search" /></view
      ><view class="desktop-links"
        ><button @click="showPublishSheet = true">创作中心</button
        ><button>业务合作</button></view
      >
    </header>
    <ExplorePage v-if="active === 'explore'" />
    <MinePage v-else-if="active === 'mine'" @compose="showComposer = true" />
    <MessagePage v-else-if="active === 'message'" />
    <PartyPage v-else-if="active === 'party'" />
    <PlaceholderPage v-else v-bind="placeholder" />
    <aside v-if="active === 'explore'" class="desktop-context">
      <view class="desktop-user"
        ><image src="https://i.pravatar.cc/160?img=14" /><view
          ><text>我在南昌</text><text>今天也去发现新鲜事</text></view
        ></view
      >
      <view class="desktop-panel"
        ><view class="desktop-panel-title"
          ><text>南昌正在流行</text><text>实时</text></view
        ><button
          v-for="(topic, index) in [
            '赣江晚霞机位',
            '周末免费展览',
            '南昌宝藏咖啡',
            '下班散步路线',
            '夜宵不踩雷',
          ]"
          :key="topic"
        >
          <text>0{{ index + 1 }}</text
          ><view
            ><text>{{ topic }}</text
            ><text>{{ 26 - index * 3 }}.{{ index + 1 }}k 人在看</text></view
          >
        </button></view
      >
      <view class="desktop-panel compact"
        ><view class="desktop-panel-title"><text>创作中心</text></view
        ><button @click="showPublishSheet = true">
          <view class="desktop-create-icon"
            ><AppIcon type="plus" size="22" color="#fff" /></view
          ><view
            ><text>发布新的体验</text><text>图文、组局或现场打卡</text></view
          >
        </button></view
      >
    </aside>
    <view class="desktop-side-footer"
      ><button><AppIcon type="list" size="22" color="#53655f" />更多</button
      ><button>
        <AppIcon type="star" size="22" color="#53655f" />关于我们
      </button></view
    >
    <view class="tabbar safe-bottom">
      <button
        v-for="tab in tabs.slice(0, 2)"
        :key="tab.key"
        class="tabbar-item"
        :class="{ active: active === tab.key }"
        @click="active = tab.key"
      >
        <view class="tab-icon-wrap">
          <AppIcon
            :type="active === tab.key ? tab.activeIcon : tab.icon"
            size="23"
            :color="active === tab.key ? '#208b72' : '#8c9b97'"
          />
        </view>
        <text>{{ tab.label }}</text>
      </button>
      <button
        class="publish-tab"
        aria-label="发布"
        @click="showPublishSheet = true"
      >
        <view class="publish-icon"
          ><AppIcon type="plus" size="27" color="#fff" /></view
        ><text>发布</text>
      </button>
      <button
        v-for="tab in tabs.slice(2)"
        :key="tab.key"
        class="tabbar-item"
        :class="{ active: active === tab.key }"
        @click="active = tab.key"
      >
        <view class="tab-icon-wrap">
          <AppIcon
            :type="active === tab.key ? tab.activeIcon : tab.icon"
            size="23"
            :color="active === tab.key ? '#208b72' : '#8c9b97'"
          />
          <view v-if="tab.key === 'message'" class="notice-dot" />
        </view>
        <text>{{ tab.label }}</text>
      </button>
    </view>
    <button
      class="theme-fab"
      aria-label="切换主题"
      @click="showThemePicker = true"
    >
      <AppIcon type="palette" size="22" color="#258A73" />
    </button>
    <view
      v-if="showThemePicker"
      class="theme-layer"
      @click="showThemePicker = false"
    >
      <view class="theme-sheet" @click.stop>
        <view class="theme-handle" />
        <view class="theme-title"
          ><view><text>选择主题色</text><text>界面与图标会同步变化</text></view
          ><button @click="showThemePicker = false">×</button></view
        >
        <button
          v-for="item in themes"
          :key="item.id"
          class="theme-option"
          :class="{ active: theme.current === item.id }"
          @click="theme.setTheme(item.id as ThemeId)"
        >
          <view class="theme-preview" :style="{ background: item.soft }"
            ><view :style="{ background: item.color }" /><view
              :style="{ borderColor: item.color }"
          /></view>
          <view class="theme-copy"
            ><text>{{ item.name }}</text
            ><text>{{ item.description }}</text></view
          >
          <view
            class="theme-check"
            :style="theme.current === item.id ? { background: item.color } : {}"
            >{{ theme.current === item.id ? "✓" : "" }}</view
          >
        </button>
      </view>
    </view>
    <view
      v-if="showPublishSheet"
      class="publish-layer"
      @click="showPublishSheet = false"
    >
      <view class="publish-sheet" @click.stop>
        <view class="publish-handle" />
        <view class="publish-heading"
          ><view
            ><text>分享此刻</text
            ><text>记录真实体验，也可以找人一起出发</text></view
          ><button @click="showPublishSheet = false">×</button></view
        >
        <view class="publish-actions">
          <button @click="choosePublish('post')">
            <view class="publish-action-icon mint"
              ><AppIcon type="image" size="27" color="#258A73" /></view
            ><text>发布图文</text><text>分享地点与体验</text>
          </button>
          <button @click="choosePublish('party')">
            <view class="publish-action-icon blue"
              ><AppIcon type="staff-filled" size="27" color="#367FA3" /></view
            ><text>发起组局</text><text>邀请同频的人</text>
          </button>
          <button @click="choosePublish('checkin')">
            <view class="publish-action-icon amber"
              ><AppIcon
                type="location-filled"
                size="27"
                color="#C97848" /></view
            ><text>现场打卡</text><text>记录正在发生</text>
          </button>
          <button @click="choosePublish('album')">
            <view class="publish-action-icon violet"
              ><AppIcon type="plus" size="27" color="#806AA3" /></view
            ><text>从相册选择</text><text>快速创建内容</text>
          </button>
        </view>
      </view>
    </view>
    <PublishComposer
      v-if="showComposer"
      :places="exploreStore.places"
      :initial-album="composerAlbumFirst"
      @close="showComposer = false"
      @published="handlePublished"
    />
  </view>
</template>

<style scoped lang="scss">
.app-shell {
  --xy-primary: #258a73;
  --xy-primary-deep: #207d69;
  --xy-soft: #e4f5ee;
  --xy-page: #f6faf8;
  --xy-ink: #18332d;
  min-height: 100vh;
  padding-bottom: calc(132rpx + env(safe-area-inset-bottom));
  background: var(--xy-page);
  transition:
    background-color 0.35s ease,
    color 0.35s ease;
}
.desktop-topbar,
.desktop-side-footer {
  display: none;
}
.theme-river {
  --xy-primary: #367fa3;
  --xy-primary-deep: #2c6f8f;
  --xy-soft: #e5f2f7;
  --xy-page: #f5f9fb;
  --xy-ink: #193947;
}
.theme-sunset {
  --xy-primary: #c97848;
  --xy-primary-deep: #ad6037;
  --xy-soft: #faece3;
  --xy-page: #fcf8f5;
  --xy-ink: #493126;
}
.tabbar {
  position: fixed;
  z-index: 50;
  right: 24rpx;
  bottom: 18rpx;
  left: 24rpx;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  min-height: 104rpx;
  padding: 12rpx 8rpx;
  border: 1rpx solid rgba(43, 92, 80, 0.08);
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18rpx 54rpx rgba(46, 86, 76, 0.16);
  backdrop-filter: blur(18px);
  animation: tabbar-rise 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.tabbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3rpx;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8c9b97;
  font-size: 20rpx;
  line-height: 1.3;
  transition:
    color 0.24s ease,
    transform 0.18s ease;
}
.tabbar-item:active {
  transform: scale(0.91);
}
.tabbar-item.active {
  color: var(--xy-primary);
  font-weight: 600;
}
.tab-icon-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 52rpx;
  height: 52rpx;
  border-radius: 18rpx;
}
.active .tab-icon-wrap {
  background: var(--xy-soft);
  animation: icon-pop 0.38s cubic-bezier(0.22, 1.5, 0.45, 1) both;
}
.notice-dot {
  position: absolute;
  top: 3rpx;
  right: 2rpx;
  width: 12rpx;
  height: 12rpx;
  border: 3rpx solid #fff;
  border-radius: 50%;
  background: var(--xy-primary);
  box-shadow: 0 0 0 4rpx var(--xy-soft);
}
.publish-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3rpx;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--xy-primary);
  font-size: 19rpx;
  line-height: 1.2;
}
.publish-icon {
  display: grid;
  place-items: center;
  width: 72rpx;
  height: 55rpx;
  border-radius: 18rpx;
  background: linear-gradient(
    145deg,
    var(--xy-primary),
    var(--xy-primary-deep)
  );
  box-shadow: 0 9rpx 22rpx
    color-mix(in srgb, var(--xy-primary) 28%, transparent);
  transition: transform 0.18s ease;
}
.publish-tab:active .publish-icon {
  transform: scale(0.88);
}
.publish-layer {
  position: fixed;
  z-index: 170;
  inset: 0;
  display: flex;
  align-items: flex-end;
  background: rgba(18, 35, 31, 0.42);
  backdrop-filter: blur(5px);
  animation: theme-fade 0.2s ease both;
}
.publish-sheet {
  width: 100%;
  padding: 12rpx 26rpx calc(38rpx + env(safe-area-inset-bottom));
  border-radius: 40rpx 40rpx 0 0;
  background: #fbfdfc;
  animation: theme-up 0.4s cubic-bezier(0.2, 1.08, 0.35, 1) both;
}
.publish-handle {
  width: 68rpx;
  height: 8rpx;
  margin: 2rpx auto 20rpx;
  border-radius: 99rpx;
  background: #d9e3df;
}
.publish-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 3rpx 24rpx;
}
.publish-heading > view {
  display: flex;
  flex-direction: column;
}
.publish-heading > view text:first-child {
  color: var(--xy-ink);
  font-size: 32rpx;
  font-weight: 780;
}
.publish-heading > view text:last-child {
  margin-top: 5rpx;
  color: #879792;
  font-size: 20rpx;
}
.publish-heading > button {
  display: grid;
  place-items: center;
  width: 54rpx;
  height: 54rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #edf2f0;
  color: #667b75;
  font-size: 32rpx;
}
.publish-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}
.publish-actions > button {
  display: grid;
  grid-template-columns: 72rpx 1fr;
  grid-template-rows: auto auto;
  column-gap: 15rpx;
  width: 100%;
  margin: 0;
  padding: 20rpx;
  border: 1rpx solid #e7eeeb;
  border-radius: 26rpx;
  background: #fff;
  text-align: left;
}
.publish-action-icon {
  grid-row: 1/3;
  display: grid;
  place-items: center;
  width: 70rpx;
  height: 70rpx;
  border-radius: 23rpx;
}
.publish-action-icon.mint {
  background: #e5f5ef;
}
.publish-action-icon.blue {
  background: #e6f2f7;
}
.publish-action-icon.amber {
  background: #faece3;
}
.publish-action-icon.violet {
  background: #f0ebf6;
}
.publish-actions > button > text:nth-child(2) {
  align-self: end;
  color: #263f38;
  font-size: 23rpx;
  font-weight: 700;
}
.publish-actions > button > text:last-child {
  align-self: start;
  margin-top: 3rpx;
  color: #8b9a96;
  font-size: 17rpx;
}
.theme-fab {
  position: fixed;
  z-index: 52;
  right: 32rpx;
  bottom: calc(158rpx + env(safe-area-inset-bottom));
  display: grid;
  place-items: center;
  width: 68rpx;
  height: 68rpx;
  margin: 0;
  padding: 0;
  border: 1rpx solid rgba(42, 85, 74, 0.08);
  border-radius: 23rpx;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10rpx 26rpx rgba(43, 85, 74, 0.15);
  backdrop-filter: blur(12px);
  transition: transform 0.18s ease;
}
.theme-fab:active {
  transform: scale(0.88) rotate(-8deg);
}
.theme-layer {
  position: fixed;
  z-index: 160;
  inset: 0;
  display: flex;
  align-items: flex-end;
  background: rgba(20, 43, 37, 0.38);
  backdrop-filter: blur(5px);
  animation: theme-fade 0.2s ease both;
}
.theme-sheet {
  width: 100%;
  padding: 12rpx 28rpx calc(34rpx + env(safe-area-inset-bottom));
  border-radius: 38rpx 38rpx 0 0;
  background: #fbfdfc;
  animation: theme-up 0.38s cubic-bezier(0.2, 1.1, 0.35, 1) both;
}
.theme-handle {
  width: 70rpx;
  height: 8rpx;
  margin: 2rpx auto 18rpx;
  border-radius: 99rpx;
  background: #d9e3df;
}
.theme-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20rpx;
}
.theme-title > view {
  display: flex;
  flex-direction: column;
}
.theme-title > view text:first-child {
  font-size: 31rpx;
  font-weight: 750;
  color: var(--xy-ink);
}
.theme-title > view text:last-child {
  margin-top: 5rpx;
  color: #899a95;
  font-size: 19rpx;
}
.theme-title > button {
  display: grid;
  place-items: center;
  width: 52rpx;
  height: 52rpx;
  margin: 0;
  padding: 0;
  border-radius: 50%;
  background: #edf3f1;
  color: #627a73;
  font-size: 32rpx;
  line-height: 1;
}
.theme-option {
  display: grid;
  grid-template-columns: 105rpx 1fr 48rpx;
  align-items: center;
  gap: 17rpx;
  width: 100%;
  margin: 13rpx 0 0;
  padding: 15rpx;
  border: 2rpx solid transparent;
  border-radius: 25rpx;
  background: #fff;
  text-align: left;
  transition:
    transform 0.18s ease,
    border-color 0.2s ease;
}
.theme-option.active {
  border-color: var(--xy-primary);
}
.theme-option:active {
  transform: scale(0.98);
}
.theme-preview {
  position: relative;
  overflow: hidden;
  width: 104rpx;
  height: 76rpx;
  border-radius: 18rpx;
}
.theme-preview > view:first-child {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  width: 30rpx;
  height: 30rpx;
  border-radius: 10rpx;
}
.theme-preview > view:last-child {
  position: absolute;
  right: 10rpx;
  bottom: 10rpx;
  width: 48rpx;
  height: 20rpx;
  border: 3rpx solid;
  border-radius: 99rpx;
}
.theme-copy {
  display: flex;
  flex-direction: column;
}
.theme-copy text:first-child {
  color: #28483f;
  font-size: 24rpx;
  font-weight: 680;
}
.theme-copy text:last-child {
  margin-top: 4rpx;
  color: #8a9a96;
  font-size: 19rpx;
}
.theme-check {
  display: grid;
  place-items: center;
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #dae5e1;
  border-radius: 50%;
  color: #fff;
  font-size: 20rpx;
}
.theme-option.active .theme-check {
  border-color: transparent;
}
@keyframes theme-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes theme-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: none;
  }
}
.safe-bottom {
  padding-bottom: max(12rpx, env(safe-area-inset-bottom));
}
@keyframes tabbar-rise {
  from {
    opacity: 0;
    transform: translateY(35rpx) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes icon-pop {
  0% {
    transform: scale(0.72) rotate(-8deg);
  }
  70% {
    transform: scale(1.12) rotate(2deg);
  }
  100% {
    transform: scale(1);
  }
}
@media (min-width: 760px) {
  .tabbar {
    right: auto;
    left: 50%;
    width: 496px;
    transform: translateX(-50%);
    animation-name: tabbar-rise-desktop;
  }
  .theme-fab {
    right: calc(50% - 246px);
  }
  .theme-layer {
    right: auto;
    left: 50%;
    width: 520px;
    transform: translateX(-50%);
  }
  .publish-layer {
    right: auto;
    left: 50%;
    width: 520px;
    transform: translateX(-50%);
  }
}
@media (min-width: 1024px) {
  .app-shell {
    position: relative;
    box-sizing: border-box;
    max-width: 1440px;
    margin: 0 auto;
    padding: 92px 22px 30px 245px;
    background: #fff;
  }
  .desktop-topbar {
    position: fixed;
    z-index: 60;
    top: 0;
    left: 50%;
    display: grid;
    grid-template-columns: 220px minmax(360px, 600px) 1fr;
    align-items: center;
    width: min(1440px, 100vw);
    height: 88px;
    padding: 0 38px;
    box-sizing: border-box;
    border-bottom: 1px solid #edf0ef;
    background: rgba(255, 255, 255, 0.97);
    transform: translateX(-50%);
    backdrop-filter: blur(18px);
  }
  .desktop-brand {
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .desktop-brand > view {
    display: grid;
    place-items: center;
    width: 48px;
    height: 38px;
    border-radius: 13px;
    background: var(--xy-primary);
    color: #fff;
    font-size: 16px;
    font-weight: 850;
  }
  .desktop-brand > text {
    color: var(--xy-ink);
    font-size: 18px;
    font-weight: 800;
  }
  .desktop-search {
    display: grid;
    grid-template-columns: 30px 1fr;
    align-items: center;
    height: 50px;
    padding: 0 20px;
    border-radius: 999px;
    background: #f4f6f5;
  }
  .desktop-search input {
    font-size: 15px;
  }
  .desktop-links {
    display: flex;
    justify-content: flex-end;
    gap: 24px;
  }
  .desktop-links button {
    margin: 0;
    padding: 10px 5px;
    border: 0;
    background: transparent;
    color: #5d6d68;
    font-size: 15px;
  }
  .tabbar {
    top: 108px;
    right: auto;
    bottom: auto;
    left: calc(50% - min(720px, 50vw) + 24px);
    grid-template-columns: 1fr;
    width: 190px;
    min-height: auto;
    padding: 10px;
    border: 0;
    border-radius: 24px;
    background: transparent;
    box-shadow: none;
    transform: none;
    animation: desktop-nav-in 0.5s ease both;
  }
  .tabbar-item,
  .publish-tab {
    min-height: 64px;
    flex-direction: row;
    justify-content: flex-start;
    gap: 14px;
    padding: 0 18px;
    border-radius: 18px;
    font-size: 16px;
  }
  .tabbar-item.active {
    background: var(--xy-soft);
  }
  .publish-icon {
    width: 42px;
    height: 38px;
    border-radius: 12px;
    box-shadow: none;
  }
  .publish-tab {
    color: #5b6c67;
  }
  .tab-icon-wrap {
    width: 38px;
    height: 38px;
  }
  .active .tab-icon-wrap {
    background: transparent;
  }
  .theme-fab {
    right: auto;
    bottom: 34px;
    left: calc(50% - min(720px, 50vw) + 164px);
    width: 48px;
    height: 48px;
  }
  .desktop-context {
    display: none !important;
  }
  .desktop-side-footer {
    position: fixed;
    z-index: 20;
    bottom: 34px;
    left: calc(50% - min(720px, 50vw) + 40px);
    display: flex;
    width: 165px;
    flex-direction: column;
    gap: 7px;
  }
  .desktop-side-footer button {
    display: flex;
    align-items: center;
    gap: 13px;
    margin: 0;
    padding: 12px;
    border: 0;
    background: transparent;
    color: #53655f;
    font-size: 15px;
  }
  .desktop-side-footer + .tabbar {
  }
  .publish-layer,
  .theme-layer {
    left: 50%;
    width: 520px;
    transform: translateX(-50%);
  }
}
@keyframes desktop-nav-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes tabbar-rise-desktop {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(35rpx) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .tabbar,
  .active .tab-icon-wrap {
    animation: none;
  }
  .tabbar-item {
    transition: none;
  }
}
</style>
