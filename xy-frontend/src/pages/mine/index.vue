<script setup lang="ts">
import { computed, ref } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import UserLibrary from "@/components/user/UserLibrary.vue";
import { useExploreStore } from "@/stores/explore";

type LibraryMode =
  | "following"
  | "followers"
  | "collections"
  | "history"
  | "drafts"
  | "management";
const emit = defineEmits(["compose"]);
const store = useExploreStore();
const activeTab = ref<"notes" | "collections" | "likes">("notes");
const libraryMode = ref<LibraryMode | null>(null);
const tabs = [
  { id: "notes", label: "笔记" },
  { id: "collections", label: "收藏" },
  { id: "likes", label: "赞过" },
] as const;
const myPosts = computed(() =>
  store.posts.filter((post) => post.author === "我在南昌"),
);
const visiblePosts = computed(() =>
  activeTab.value === "notes"
    ? myPosts.value
    : activeTab.value === "collections"
      ? store.posts.filter((post) => post.collected)
      : store.posts.filter((post) => post.liked),
);

function editProfile() {
  uni.showToast({ title: "编辑资料页即将展开", icon: "none" });
}
function settings() {
  uni.showActionSheet({
    itemList: ["账号与安全", "隐私设置", "内容偏好", "关于 XY 南昌"],
  });
}
function continueDraft() {
  libraryMode.value = null;
  emit("compose");
}
</script>

<template>
  <scroll-view scroll-y class="mine-page">
    <view class="mine-hero"
      ><view class="mine-glow one" /><view class="mine-glow two" /><view
        class="mine-top safe-top"
        ><text>我的</text
        ><button @click="settings">
          <AppIcon type="tune" size="23" color="#fff" /></button></view
    ></view>
    <view class="mine-profile">
      <view class="profile-main"
        ><image src="https://i.pravatar.cc/160?img=14" /><view
          ><text>我在南昌</text><text>XY号：XY-NC-2026</text></view
        ><button @click="editProfile">编辑资料</button></view
      >
      <text class="mine-bio"
        >去真实的地方，认识有趣的人。正在收集南昌的晚风和周末。</text
      >
      <view class="mine-tags"
        ><text>📍 南昌</text><text>城市探索者</text><text>周末摄影</text></view
      >
      <view class="mine-stats"
        ><button @click="libraryMode = 'following'">
          <text>18</text><text>关注</text></button
        ><button @click="libraryMode = 'followers'">
          <text>126</text><text>粉丝</text></button
        ><button @click="libraryMode = 'collections'">
          <text>{{ store.posts.filter((post) => post.liked).length }}</text
          ><text>获赞与收藏</text>
        </button></view
      >
    </view>
    <view class="mine-tools"
      ><button @click="libraryMode = 'collections'">
        <view><AppIcon type="star-filled" size="24" color="#d99a45" /></view
        ><text>我的收藏</text></button
      ><button @click="libraryMode = 'history'">
        <view><AppIcon type="calendar" size="24" color="#397f9e" /></view
        ><text>浏览记录</text></button
      ><button @click="libraryMode = 'management'">
        <view><AppIcon type="image" size="24" color="#2c8b73" /></view
        ><text>笔记管理</text></button
      ><button @click="libraryMode = 'drafts'">
        <view><AppIcon type="list" size="24" color="#806aa3" /></view
        ><text>草稿箱</text>
      </button></view
    >
    <view class="mine-tabs"
      ><button
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button></view
    >
    <view v-if="visiblePosts.length" class="mine-grid"
      ><button v-for="post in visiblePosts" :key="post.id">
        <view
          ><image :src="post.cover" mode="aspectFill" /><text v-if="post.live"
            >现场</text
          ></view
        ><text>{{ post.title }}</text
        ><view
          ><AppIcon type="heart" size="15" color="#82908c" /><text>{{
            post.likes
          }}</text></view
        >
      </button></view
    >
    <view v-else class="mine-empty"
      ><view
        ><AppIcon
          :type="
            activeTab === 'notes'
              ? 'image'
              : activeTab === 'collections'
                ? 'star'
                : 'heart'
          "
          size="38"
          color="#91a19c" /></view
      ><text>{{
        activeTab === "notes"
          ? "还没有发布笔记"
          : activeTab === "collections"
            ? "还没有收藏内容"
            : "还没有点赞内容"
      }}</text
      ><text>{{
        activeTab === "notes"
          ? "从记录一次真实体验开始吧"
          : "去探索页发现喜欢的内容"
      }}</text></view
    >
    <view class="mine-space" />
    <UserLibrary
      v-if="libraryMode"
      :mode="libraryMode"
      @close="libraryMode = null"
      @compose="continueDraft"
    />
  </scroll-view>
</template>

<style scoped lang="scss">
.mine-page {
  height: 100vh;
  background: #f7faf9;
}
.mine-hero {
  position: relative;
  overflow: hidden;
  height: 270rpx;
  background: linear-gradient(
    145deg,
    var(--xy-primary-deep),
    color-mix(in srgb, var(--xy-primary) 64%, #9cc4b8)
  );
}
.mine-glow {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}
.mine-glow.one {
  top: -120rpx;
  right: -50rpx;
  width: 330rpx;
  height: 330rpx;
}
.mine-glow.two {
  bottom: -140rpx;
  left: 20rpx;
  width: 280rpx;
  height: 280rpx;
}
.mine-top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(25rpx + env(safe-area-inset-top)) 27rpx 0;
  color: #fff;
}
.mine-top > text {
  font-size: 31rpx;
  font-weight: 780;
}
.mine-top button {
  display: grid;
  place-items: center;
  width: 62rpx;
  height: 62rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(21, 50, 42, 0.18);
}
.mine-profile {
  position: relative;
  margin: -74rpx 20rpx 0;
  padding: 25rpx;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 16rpx 42rpx rgba(45, 84, 74, 0.1);
}
.profile-main {
  display: grid;
  grid-template-columns: 120rpx 1fr auto;
  align-items: end;
  gap: 15rpx;
}
.profile-main > image {
  width: 116rpx;
  height: 116rpx;
  border: 6rpx solid #fff;
  border-radius: 50%;
  box-shadow: 0 8rpx 24rpx rgba(42, 79, 69, 0.14);
}
.profile-main > view {
  display: flex;
  flex-direction: column;
  padding-bottom: 8rpx;
}
.profile-main > view text:first-child {
  color: var(--xy-ink);
  font-size: 31rpx;
  font-weight: 790;
}
.profile-main > view text:last-child {
  margin-top: 5rpx;
  color: #899893;
  font-size: 17rpx;
}
.profile-main > button {
  margin: 0 0 9rpx;
  padding: 10rpx 16rpx;
  border: 1rpx solid #dae6e2;
  border-radius: 99rpx;
  background: #fff;
  color: #597169;
  font-size: 18rpx;
}
.mine-bio {
  display: block;
  margin-top: 19rpx;
  color: #536c65;
  font-size: 21rpx;
  line-height: 1.65;
}
.mine-tags {
  display: flex;
  gap: 9rpx;
  margin-top: 14rpx;
}
.mine-tags text {
  padding: 6rpx 11rpx;
  border-radius: 99rpx;
  background: #f0f5f3;
  color: #758780;
  font-size: 16rpx;
}
.mine-stats {
  display: flex;
  gap: 36rpx;
  margin-top: 22rpx;
}
.mine-stats button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
}
.mine-stats button text:first-child {
  font-size: 24rpx;
  font-weight: 760;
}
.mine-stats button text:last-child {
  margin-top: 3rpx;
  color: #8b9995;
  font-size: 16rpx;
}
.mine-tools {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10rpx;
  margin: 18rpx 20rpx;
  padding: 22rpx 10rpx;
  border-radius: 29rpx;
  background: #fff;
}
.mine-tools button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9rpx;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #60766f;
  font-size: 17rpx;
}
.mine-tools button > view {
  display: grid;
  place-items: center;
  width: 68rpx;
  height: 68rpx;
  border-radius: 22rpx;
  background: #f2f6f4;
}
.mine-tabs {
  position: sticky;
  z-index: 4;
  top: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  height: 78rpx;
  border-bottom: 1rpx solid #e8eeec;
  background: rgba(255, 255, 255, 0.96);
}
.mine-tabs button {
  position: relative;
  margin: 0;
  border: 0;
  background: transparent;
  color: #84928e;
  font-size: 21rpx;
}
.mine-tabs button.active {
  color: var(--xy-ink);
  font-weight: 750;
}
.mine-tabs button.active:after {
  content: "";
  position: absolute;
  right: 39%;
  bottom: 0;
  left: 39%;
  height: 5rpx;
  border-radius: 99rpx;
  background: var(--xy-primary);
}
.mine-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15rpx;
  padding: 15rpx;
}
.mine-grid > button {
  margin: 0;
  padding: 0 0 11rpx;
  border: 0;
  border-radius: 17rpx;
  background: #fff;
  text-align: left;
}
.mine-grid > button > view:first-child {
  position: relative;
  height: 320rpx;
  overflow: hidden;
  border-radius: 17rpx;
}
.mine-grid > button > view:first-child image {
  width: 100%;
  height: 100%;
}
.mine-grid > button > view:first-child text {
  position: absolute;
  top: 9rpx;
  left: 9rpx;
  padding: 5rpx 8rpx;
  border-radius: 7rpx;
  background: rgba(255, 255, 255, 0.9);
  color: var(--xy-primary);
  font-size: 14rpx;
}
.mine-grid > button > text {
  display: -webkit-box;
  margin: 10rpx 8rpx 0;
  overflow: hidden;
  font-size: 20rpx;
  font-weight: 620;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.mine-grid > button > view:last-child {
  display: flex;
  align-items: center;
  gap: 5rpx;
  margin: 8rpx 8rpx 0;
  color: #82908c;
  font-size: 16rpx;
}
.mine-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 90rpx 20rpx;
}
.mine-empty > view {
  display: grid;
  place-items: center;
  width: 100rpx;
  height: 100rpx;
  border-radius: 32rpx;
  background: #eef4f2;
}
.mine-empty > text:nth-child(2) {
  margin-top: 18rpx;
  color: #687d76;
  font-size: 22rpx;
  font-weight: 680;
}
.mine-empty > text:last-child {
  margin-top: 6rpx;
  color: #98a5a1;
  font-size: 18rpx;
}
.mine-space {
  height: 170rpx;
}
@media (min-width: 1024px) {
  .mine-page {
    height: calc(100vh - 92px);
    max-width: 800px;
    margin: 0 auto;
  }
  .mine-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .mine-grid > button > view:first-child {
    height: auto;
    aspect-ratio: 4/5;
  }
}
</style>
