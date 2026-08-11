<script setup lang="ts">
import { computed, ref } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import { useExploreStore } from "@/stores/explore";
import type { Party } from "@/types/explore";

const store = useExploreStore();
const activeTab = ref<"recommend" | "nearby" | "joined">("recommend");
const selected = ref<Party | null>(null);
const query = ref("");
const tabs = [
  { id: "recommend", label: "推荐" },
  { id: "nearby", label: "附近" },
  { id: "joined", label: "已加入" },
] as const;

const visibleParties = computed(() => {
  let list = store.parties;
  if (activeTab.value === "joined") list = list.filter((item) => item.joined);
  if (activeTab.value === "nearby")
    list = [...list].sort(
      (a, b) => Number.parseFloat(a.distance) - Number.parseFloat(b.distance),
    );
  const keyword = query.value.trim().toLowerCase();
  return keyword
    ? list.filter((item) =>
        `${item.title}${item.place}${item.category}`
          .toLowerCase()
          .includes(keyword),
      )
    : list;
});

function join(party: Party) {
  store.togglePartyJoin(party);
  uni.showToast({
    title: party.joined ? "已加入组局" : "已取消报名",
    icon: "none",
  });
}

function createParty() {
  uni.showToast({ title: "从发布入口选择“发起组局”", icon: "none" });
}
</script>

<template>
  <view class="party-page">
    <view class="party-head safe-top">
      <view><text>一起出发</text><text>和同频的人，去真实的地方</text></view>
      <button @click="createParty">
        <AppIcon type="plus" size="25" color="#fff" />
      </button>
    </view>
    <view class="party-search"
      ><AppIcon type="search" size="20" color="#81938d" /><input
        v-model="query"
        placeholder="搜索活动、地点或兴趣" /><button>
        <AppIcon type="tune" size="19" color="#526d65" /></button
    ></view>
    <view class="party-tabs"
      ><button
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button></view
    >
    <scroll-view scroll-y class="party-scroll">
      <view class="party-banner"
        ><view
          ><text>本周末 · 南昌</text><text>一起去吹晚风吧</text
          ><text>已有 26 位探索者找到搭子</text></view
        ><view class="banner-orbit"
          ><AppIcon type="staff-filled" size="35" color="#fff" /></view
      ></view>
      <view v-if="visibleParties.length" class="party-list">
        <button
          v-for="party in visibleParties"
          :key="party.id"
          class="party-card"
          @click="selected = party"
        >
          <view class="party-cover"
            ><image :src="party.cover" mode="aspectFill" /><view
              class="cover-shade"
            /><text>{{ party.category }}</text
            ><view
              ><AppIcon type="location-filled" size="14" color="#fff" />{{
                party.distance
              }}</view
            ></view
          >
          <view class="party-copy">
            <text class="party-title">{{ party.title }}</text>
            <view class="party-meta"
              ><AppIcon type="calendar" size="17" color="#70847d" /><text>{{
                party.date
              }}</text></view
            >
            <view class="party-meta"
              ><AppIcon type="location" size="17" color="#70847d" /><text>{{
                party.place
              }}</text></view
            >
            <view class="party-tags"
              ><text v-for="tag in party.tags" :key="tag">{{ tag }}</text></view
            >
            <view class="party-foot"
              ><view
                ><image :src="party.avatar" /><text>{{
                  party.host
                }}</text></view
              ><view class="member-progress"
                ><text>{{ party.members }}/{{ party.capacity }} 人</text
                ><view
                  ><view
                    :style="{
                      width: `${(party.members / party.capacity) * 100}%`,
                    }" /></view></view
            ></view>
          </view>
        </button>
      </view>
      <view v-else class="party-empty"
        ><view><AppIcon type="staff" size="38" color="#8b9b96" /></view
        ><text>{{
          activeTab === "joined" ? "还没有加入组局" : "没有找到相关组局"
        }}</text
        ><text>主动发起一次，也许马上就有人同行</text
        ><button @click="createParty">发起组局</button></view
      >
      <view class="party-space" />
    </scroll-view>

    <view v-if="selected" class="party-detail" @click="selected = null">
      <view class="detail-sheet" @click.stop>
        <view class="detail-cover"
          ><image :src="selected.cover" mode="aspectFill" /><view /><button
            @click="selected = null"
          >
            <AppIcon type="closeempty" size="23" color="#263f38" /></button
          ><text>{{ selected.category }} · {{ selected.distance }}</text></view
        >
        <view class="detail-body"
          ><text>{{ selected.title }}</text
          ><view class="host"
            ><image :src="selected.avatar" /><view
              ><text>{{ selected.host }}</text
              ><text>发起人 · 已实名认证</text></view
            ><button>关注</button></view
          ><view class="detail-info"
            ><view
              ><AppIcon type="calendar" size="21" color="#2b8872" /><text>{{
                selected.date
              }}</text></view
            ><view
              ><AppIcon
                type="location-filled"
                size="21"
                color="#2b8872"
              /><text>{{ selected.place }}</text></view
            ><view
              ><AppIcon type="staff-filled" size="21" color="#2b8872" /><text
                >已有 {{ selected.members }} 人参加，还剩
                {{ selected.capacity - selected.members }} 个名额</text
              ></view
            ></view
          ><text class="detail-note">活动说明</text
          ><text class="detail-desc"
            >轻松认识新朋友，不赶行程。请准时到达集合点，临时有事记得提前告诉大家。</text
          ><button
            class="join-button"
            :class="{ joined: selected.joined }"
            @click="join(selected)"
          >
            {{ selected.joined ? "已加入 · 点击取消" : "立即加入" }}
          </button></view
        >
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.party-page {
  height: 100vh;
  background: #f6faf8;
}
.party-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(25rpx + env(safe-area-inset-top)) 27rpx 18rpx;
  background: #fff;
}
.party-head > view {
  display: flex;
  flex-direction: column;
}
.party-head > view text:first-child {
  color: var(--xy-ink);
  font-size: 34rpx;
  font-weight: 800;
}
.party-head > view text:last-child {
  margin-top: 5rpx;
  color: #899994;
  font-size: 18rpx;
}
.party-head > button {
  display: grid;
  place-items: center;
  width: 62rpx;
  height: 62rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 20rpx;
  background: var(--xy-primary);
}
.party-search {
  display: grid;
  grid-template-columns: 38rpx 1fr 50rpx;
  align-items: center;
  height: 68rpx;
  margin: 0 24rpx 15rpx;
  padding: 0 8rpx 0 17rpx;
  border-radius: 23rpx;
  background: #f0f4f2;
}
.party-search input {
  min-width: 0;
  font-size: 20rpx;
}
.party-search button {
  display: grid;
  place-items: center;
  width: 48rpx;
  height: 48rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 16rpx;
  background: #fff;
}
.party-tabs {
  display: flex;
  gap: 35rpx;
  padding: 0 27rpx;
  border-bottom: 1rpx solid #e9efed;
  background: #fff;
}
.party-tabs button {
  position: relative;
  margin: 0;
  padding: 18rpx 0;
  border: 0;
  background: transparent;
  color: #83928d;
  font-size: 22rpx;
}
.party-tabs button.active {
  color: var(--xy-ink);
  font-weight: 750;
}
.party-tabs button.active:after {
  content: "";
  position: absolute;
  right: 22%;
  bottom: 0;
  left: 22%;
  height: 5rpx;
  border-radius: 99rpx;
  background: var(--xy-primary);
}
.party-scroll {
  height: calc(100vh - 265rpx - env(safe-area-inset-top));
}
.party-banner {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20rpx 22rpx;
  padding: 26rpx;
  border-radius: 30rpx;
  background: linear-gradient(
    135deg,
    var(--xy-primary-deep),
    var(--xy-primary)
  );
  color: #fff;
}
.party-banner > view:first-child {
  display: flex;
  flex-direction: column;
}
.party-banner > view:first-child text:first-child {
  font-size: 17rpx;
  opacity: 0.8;
}
.party-banner > view:first-child text:nth-child(2) {
  margin-top: 6rpx;
  font-size: 29rpx;
  font-weight: 780;
}
.party-banner > view:first-child text:last-child {
  margin-top: 8rpx;
  font-size: 17rpx;
  opacity: 0.85;
}
.banner-orbit {
  display: grid;
  place-items: center;
  width: 88rpx;
  height: 88rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.25);
  border-radius: 31rpx;
  background: rgba(255, 255, 255, 0.14);
}
.party-list {
  display: flex;
  flex-direction: column;
  gap: 17rpx;
  padding: 0 22rpx;
}
.party-card {
  display: grid;
  grid-template-columns: 215rpx 1fr;
  overflow: hidden;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 28rpx;
  background: #fff;
  text-align: left;
  box-shadow: 0 10rpx 28rpx rgba(52, 89, 79, 0.07);
}
.party-cover {
  position: relative;
  min-height: 280rpx;
}
.party-cover > image {
  width: 100%;
  height: 100%;
}
.cover-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 45%, rgba(16, 38, 33, 0.58));
}
.party-cover > text {
  position: absolute;
  top: 14rpx;
  left: 14rpx;
  padding: 6rpx 10rpx;
  border-radius: 9rpx;
  background: rgba(255, 255, 255, 0.9);
  color: var(--xy-primary);
  font-size: 15rpx;
  font-weight: 700;
}
.party-cover > view:last-child {
  position: absolute;
  bottom: 14rpx;
  left: 14rpx;
  display: flex;
  align-items: center;
  gap: 5rpx;
  color: #fff;
  font-size: 16rpx;
}
.party-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 18rpx;
}
.party-title {
  display: -webkit-box;
  overflow: hidden;
  color: #263e37;
  font-size: 23rpx;
  font-weight: 730;
  line-height: 1.42;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.party-meta {
  display: flex;
  align-items: center;
  gap: 7rpx;
  margin-top: 10rpx;
  color: #72837e;
  font-size: 17rpx;
}
.party-meta text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.party-tags {
  display: flex;
  gap: 7rpx;
  margin-top: 11rpx;
}
.party-tags text {
  padding: 5rpx 8rpx;
  border-radius: 8rpx;
  background: var(--xy-soft);
  color: var(--xy-primary-deep);
  font-size: 14rpx;
}
.party-foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 14rpx;
}
.party-foot > view:first-child {
  display: flex;
  align-items: center;
  gap: 7rpx;
  min-width: 0;
}
.party-foot image {
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
}
.party-foot > view:first-child text {
  max-width: 100rpx;
  overflow: hidden;
  color: #7d8d88;
  font-size: 14rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.member-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.member-progress > text {
  color: #60756e;
  font-size: 14rpx;
}
.member-progress > view {
  width: 70rpx;
  height: 5rpx;
  margin-top: 5rpx;
  overflow: hidden;
  border-radius: 99rpx;
  background: #e5ece9;
}
.member-progress > view > view {
  height: 100%;
  border-radius: 99rpx;
  background: var(--xy-primary);
}
.party-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 30rpx;
  color: #879791;
}
.party-empty > view {
  display: grid;
  place-items: center;
  width: 105rpx;
  height: 105rpx;
  border-radius: 34rpx;
  background: #edf4f1;
}
.party-empty > text:nth-child(2) {
  margin-top: 18rpx;
  font-size: 23rpx;
  font-weight: 700;
}
.party-empty > text:nth-child(3) {
  margin-top: 7rpx;
  font-size: 18rpx;
}
.party-empty > button {
  margin-top: 20rpx;
  padding: 13rpx 28rpx;
  border: 0;
  border-radius: 99rpx;
  background: var(--xy-primary);
  color: #fff;
  font-size: 20rpx;
}
.party-space {
  height: 170rpx;
}
.party-detail {
  position: fixed;
  z-index: 180;
  inset: 0;
  display: flex;
  align-items: flex-end;
  background: rgba(18, 38, 33, 0.42);
  backdrop-filter: blur(5px);
}
.detail-sheet {
  overflow: hidden;
  width: 100%;
  max-height: 88vh;
  border-radius: 38rpx 38rpx 0 0;
  background: #fff;
}
.detail-cover {
  position: relative;
  height: 330rpx;
}
.detail-cover > image {
  width: 100%;
  height: 100%;
}
.detail-cover > view {
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(15, 35, 30, 0.14), rgba(15, 35, 30, 0.5));
}
.detail-cover > button {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  display: grid;
  place-items: center;
  width: 57rpx;
  height: 57rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
}
.detail-cover > text {
  position: absolute;
  bottom: 22rpx;
  left: 25rpx;
  color: #fff;
  font-size: 19rpx;
}
.detail-body {
  padding: 25rpx 27rpx calc(30rpx + env(safe-area-inset-bottom));
}
.detail-body > text:first-child {
  display: block;
  color: var(--xy-ink);
  font-size: 31rpx;
  font-weight: 790;
  line-height: 1.4;
}
.host {
  display: grid;
  grid-template-columns: 60rpx 1fr auto;
  align-items: center;
  gap: 11rpx;
  margin-top: 20rpx;
}
.host image {
  width: 58rpx;
  height: 58rpx;
  border-radius: 50%;
}
.host > view {
  display: flex;
  flex-direction: column;
}
.host > view text:first-child {
  font-size: 20rpx;
  font-weight: 680;
}
.host > view text:last-child {
  margin-top: 3rpx;
  color: #91a09b;
  font-size: 15rpx;
}
.host > button {
  margin: 0;
  padding: 9rpx 17rpx;
  border: 1rpx solid #dbe7e3;
  border-radius: 99rpx;
  background: #fff;
  color: #5c756d;
  font-size: 17rpx;
}
.detail-info {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  margin-top: 23rpx;
  padding: 20rpx;
  border-radius: 24rpx;
  background: #f3f7f5;
}
.detail-info > view {
  display: flex;
  align-items: center;
  gap: 11rpx;
  color: #566f67;
  font-size: 19rpx;
}
.detail-note {
  display: block;
  margin-top: 23rpx !important;
  font-size: 22rpx !important;
  font-weight: 720 !important;
}
.detail-desc {
  display: block;
  margin-top: 9rpx;
  color: #6c8079;
  font-size: 19rpx;
  line-height: 1.7;
}
.join-button {
  width: 100%;
  margin: 24rpx 0 0;
  padding: 20rpx;
  border: 0;
  border-radius: 22rpx;
  background: var(--xy-primary);
  color: #fff;
  font-size: 23rpx;
  font-weight: 720;
}
.join-button.joined {
  border: 1rpx solid #dce7e3;
  background: #fff;
  color: #6c8079;
}
@media (min-width: 1024px) {
  .party-page {
    height: calc(100vh - 92px);
    max-width: 960px;
    margin: 0 auto;
  }
  .party-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .party-card {
    grid-template-columns: 180px 1fr;
  }
  .party-detail {
    right: auto;
    left: 50%;
    width: 560px;
    transform: translateX(-50%);
  }
}
</style>
