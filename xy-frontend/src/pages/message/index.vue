<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import AppIcon from "@/components/AppIcon.vue";
import { useMessageStore } from "@/stores/message";
import type { NoticeType } from "@/types/message";

const messageStore = useMessageStore();
const { conversations, notices, chatMessages, activeConversation, loading, error } = storeToRefs(messageStore);
const activeTab = ref<"messages" | NoticeType>("messages");
const selectedChat = computed({
  get: () => activeConversation.value?.name ?? null,
  set: (value) => { if (!value) messageStore.selectedConversationId = null; },
});
const centerMode = ref<null | "system" | "audit" | "reward">(null);
const draft = ref("");
const rewardCode = ref("");
const rewardActivated = ref(false);
const filteredNotices = computed(() =>
  notices.value.filter((item) => item.type === activeTab.value),
);
const visibleChatMessages = computed(() =>
  chatMessages.value.filter(item => item.conversationId === messageStore.selectedConversationId),
);

async function openChat(name: string) {
  const target = conversations.value.find((item) => item.name === name);
  if (target) await messageStore.openConversation(target.id);
}

async function sendMessage() {
  const content = draft.value.trim();
  if (!content) return;
  await messageStore.send(content);
  draft.value = "";
}

onMounted(() => messageStore.load());

function searchMessages() {
  uni.showToast({ title: "可搜索联系人、群聊与聊天记录", icon: "none" });
}

function createConversation() {
  uni.showActionSheet({ itemList: ["发起群聊", "添加朋友", "扫一扫"] });
}

function activateReward() {
  if (!rewardCode.value.trim()) return;
  rewardActivated.value = true;
  uni.showToast({ title: "奖励已激活", icon: "success" });
}
</script>

<template>
  <view class="message-page">
    <view class="message-header safe-top">
      <view class="header-spacer" />
      <text>消息</text>
      <view class="header-actions">
        <button aria-label="搜索消息" @click="searchMessages">
          <AppIcon type="search" size="27" color="#263f38" />
        </button>
        <button aria-label="发起聊天" @click="createConversation">
          <AppIcon type="plus" size="29" color="#263f38" />
        </button>
      </view>
    </view>
    <view class="message-shortcuts">
      <button
        :class="{ active: activeTab !== 'messages' }"
        @click="activeTab = 'comments'"
      >
        <view class="shortcut-icon interaction"
          ><AppIcon type="heart" size="20" color="#258A73" /></view
        ><text>互动</text><view class="shortcut-badge">12</view>
      </button>
      <button @click="centerMode = 'system'">
        <view class="shortcut-icon system"
          ><AppIcon type="notification" size="20" color="#367FA3" /></view
        ><text>系统</text>
      </button>
      <button @click="centerMode = 'audit'">
        <view class="shortcut-icon audit"
          ><AppIcon type="audit" size="20" color="#806AA3" /></view
        ><text>审核</text><view class="shortcut-badge">2</view>
      </button>
      <button @click="centerMode = 'reward'">
        <view class="shortcut-icon reward"
          ><AppIcon type="reward" size="20" color="#C97848" /></view
        ><text>奖励</text><view class="shortcut-badge">1</view>
      </button>
    </view>
    <button
      v-if="activeTab !== 'messages'"
      class="back-to-messages"
      @click="activeTab = 'messages'"
    >
      <AppIcon type="back" size="18" color="#526a63" />返回聊天
    </button>
    <scroll-view scroll-y class="message-scroll">
      <view v-if="activeTab === 'messages'" class="conversation-list">
        <view v-if="loading" class="notice-empty">
          <text>正在加载消息…</text>
        </view>
        <view v-else-if="error" class="notice-empty">
          <AppIcon type="notification" size="30" color="#93a19d" />
          <text>{{ error }}</text><button @click="messageStore.load()">重新加载</button>
        </view>
        <template v-else>
        <button class="system-row">
          <view class="system-icon"
            ><AppIcon type="notification" size="25" color="#fff" /></view
          ><view
            ><text>系统通知</text
            ><text>欢迎加入 XY 南昌，探索从这里开始</text></view
          ><text>昨天</text>
        </button>
        <button class="system-row" @click="centerMode = 'audit'">
          <view class="system-icon audit"
            ><AppIcon type="audit" size="24" color="#fff" /></view
          ><view
            ><text>XY 审核助手</text><text>你的地点帖已经审核通过</text></view
          ><text>19:06</text>
        </button>
        <button class="system-row" @click="centerMode = 'reward'">
          <view class="system-icon reward"
            ><AppIcon type="reward" size="24" color="#fff" /></view
          ><view><text>XY 奖励中心</text><text>地点共建奖励待激活</text></view
          ><text>昨天</text>
        </button>
        <button
          v-for="item in conversations"
          :key="item.id"
          class="conversation"
          @click="openChat(item.name)"
        >
          <view class="avatar-wrap"
            ><image :src="item.avatar" /><text v-if="item.online" /><view
              v-if="item.unread"
              >{{ item.unread }}</view
            ></view
          ><view
            ><text>{{ item.name }}</text
            ><text>{{ item.text }}</text></view
          ><text>{{ item.time }}</text>
        </button>
        </template>
      </view>
      <view v-else class="notice-list"
        ><view v-if="filteredNotices.length"
          ><view
            v-for="notice in filteredNotices"
            :key="notice.id"
            class="notice-row"
            ><image :src="notice.avatar" /><view
              ><text
                ><b>{{ notice.user }}</b> {{ notice.action }}</text
              ><text>{{ notice.content }}</text
              ><text>{{ notice.time }} · 回复</text></view
            ><image
              v-if="notice.cover"
              :src="notice.cover"
              mode="aspectFill"
            /><button v-else>关注</button></view
          ></view
        ><view v-else class="notice-empty"
          ><AppIcon type="notification" size="38" color="#93a19d" /><text
            >暂时没有新消息</text
          ></view
        ></view
      >
      <view class="message-space" />
    </scroll-view>

    <view v-if="centerMode" class="center-layer">
      <view class="center-header safe-top"
        ><button @click="centerMode = null">
          <AppIcon type="back" size="24" color="#263f38" /></button
        ><text>{{
          centerMode === "audit"
            ? "审核中心"
            : centerMode === "reward"
              ? "奖励中心"
              : "系统通知"
        }}</text
        ><button><AppIcon type="list" size="22" color="#5d716b" /></button
      ></view>
      <scroll-view scroll-y class="center-scroll">
        <view v-if="centerMode === 'audit'" class="audit-page">
          <view class="center-summary"
            ><view><AppIcon type="audit" size="31" color="#fff" /></view
            ><text>内容审核进度</text
            ><text>公开内容会经过机器与人工复核</text></view
          >
          <view class="audit-filter"
            ><button class="active">全部</button><button>审核中</button
            ><button>已通过</button><button>需修改</button></view
          >
          <view class="audit-item"
            ><image
              src="https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=300&q=70"
              mode="aspectFill"
            /><view
              ><text>把南昌的橘子汽水天空收进口袋</text
              ><text>地点笔记 · 今天 18:56</text
              ><text class="status passed">已通过</text></view
            ></view
          >
          <view class="audit-item"
            ><image
              src="https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=300&q=70"
              mode="aspectFill"
            /><view
              ><text>699园区周末看展攻略</text><text>地点笔记 · 今天 19:02</text
              ><text class="status checking">审核中 · 预计 10 分钟</text></view
            ></view
          >
          <view class="audit-item"
            ><view class="audit-placeholder"
              ><AppIcon type="staff" size="28" color="#81938d" /></view
            ><view
              ><text>周末摄影组局</text><text>组局申请 · 昨天 20:16</text
              ><text class="status revise">需补充集合地点</text></view
            ></view
          >
          <view class="rule-card"
            ><text>审核说明</text
            ><text
              >地点、组局和公开笔记采用不同审核规则；未通过时会明确展示原因和修改入口。</text
            ></view
          >
        </view>
        <view v-else-if="centerMode === 'reward'" class="reward-page">
          <view class="reward-wallet"
            ><text>我的探索值</text><view><text>286</text><text>分</text></view
            ><text>完成真实地点共建可持续获得奖励</text
            ><view class="wallet-bubbles"><i /><i /><i /></view
          ></view>
          <view v-if="rewardActivated" class="reward-success"
            ><view><AppIcon type="reward" size="28" color="#fff" /></view
            ><view
              ><text>激活成功</text
              ><text>“城市探索徽章”已经放入账户</text></view
            ></view
          >
          <view class="activate-card"
            ><view
              ><text>激活奖励</text
              ><text>输入活动或审核通过后获得的激活码</text></view
            ><view class="code-input"
              ><input
                v-model="rewardCode"
                maxlength="20"
                placeholder="请输入奖励激活码"
              /><button :disabled="!rewardCode.trim()" @click="activateReward">
                激活
              </button></view
            ></view
          >
          <view class="reward-title"
            ><text>待领取</text><text>奖励记录</text></view
          >
          <view class="reward-card"
            ><view class="reward-icon"
              ><AppIcon type="reward" size="25" color="#C97848" /></view
            ><view
              ><text>优质地点共建奖励</text
              ><text>赣江观景步道信息已审核通过</text
              ><text>有效期至 8月31日</text></view
            ><button @click="rewardActivated = true">领取</button></view
          >
          <view class="reward-card"
            ><view class="reward-icon blue"
              ><AppIcon type="star-filled" size="25" color="#367FA3" /></view
            ><view
              ><text>城市探索者徽章</text><text>累计发布 3 条有效地点笔记</text
              ><text>永久有效</text></view
            ><button class="received">已领取</button></view
          >
          <view class="rule-card"
            ><text>奖励边界</text
            ><text
              >用户端负责激活、领取与查看记录；奖励创建、审核与批量发放由运营后台完成。</text
            ></view
          >
        </view>
        <view v-else class="system-page"
          ><view
            v-for="item in [
              '隐私政策更新提醒',
              '账号安全登录通知',
              '本周社区治理周报',
              '新版本功能说明',
            ]"
            :key="item"
            class="system-notice"
            ><view><AppIcon type="notification" size="21" color="#fff" /></view
            ><view
              ><text>{{ item }}</text
              ><text>XY 官方助手 · 查看详情</text></view
            ><text>昨天</text></view
          ></view
        >
        <view class="center-space" />
      </scroll-view>
    </view>

    <view v-if="selectedChat && activeConversation" class="chat-layer">
      <view class="chat-header safe-top"
        ><button @click="selectedChat = null">
          <AppIcon type="back" size="24" color="#263f38" /></button
        ><view
          ><text>{{ activeConversation.name }}</text
          ><text>{{
            activeConversation.online ? "在线" : "刚刚活跃"
          }}</text></view
        ><button><AppIcon type="list" size="22" color="#5d716b" /></button
      ></view>
      <scroll-view scroll-y class="chat-scroll"
        ><view class="chat-time">今天 18:30</view
        ><view
          v-for="message in visibleChatMessages"
          :key="message.id"
          class="bubble-row"
          :class="{ mine: message.mine }"
          ><image
            :src="
              message.mine
                ? 'https://i.pravatar.cc/160?img=14'
                : activeConversation.avatar
            "
          /><view
            ><text>{{ message.content }}</text
            ><text>{{ message.time }}</text></view
          ></view
        ><view class="chat-space"
      /></scroll-view>
      <view class="chat-input safe-bottom"
        ><button><AppIcon type="plus" size="22" color="#61756e" /></button
        ><input
          v-model="draft"
          confirm-type="send"
          placeholder="发消息…"
          @confirm="sendMessage" /><button
          class="send"
          :disabled="!draft.trim()"
          @click="sendMessage"
        >
          <AppIcon type="paperplane-filled" size="19" color="#fff" /></button
      ></view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.message-page {
  height: 100vh;
  background: #fff;
}
.message-header {
  display: grid;
  grid-template-columns: 150rpx 1fr 150rpx;
  align-items: center;
  min-height: 104rpx;
  padding: calc(18rpx + env(safe-area-inset-top)) 24rpx 8rpx;
  background: #fff;
}
.message-header > text {
  color: var(--xy-ink);
  font-size: 31rpx;
  font-weight: 760;
  text-align: center;
}
.header-actions {
  display: flex;
  justify-content: flex-end;
  gap: 18rpx;
}
.header-actions button {
  display: grid;
  place-items: center;
  width: 55rpx;
  height: 55rpx;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
}
.message-shortcuts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 19rpx 22rpx 22rpx;
  background: #fff;
}
.message-shortcuts > button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9rpx;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #33443f;
  font-size: 19rpx;
}
.shortcut-icon {
  display: grid;
  place-items: center;
  width: 62rpx;
  height: 62rpx;
  border-radius: 19rpx;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.shortcut-icon.interaction {
  background: #e5f6ef;
}
.shortcut-icon.system {
  background: #e9f3f8;
}
.shortcut-icon.audit {
  background: #f1ebf7;
}
.shortcut-icon.reward {
  background: #fff1e9;
}
.shortcut-badge {
  position: absolute;
  top: -8rpx;
  left: calc(50% + 16rpx);
  display: grid;
  place-items: center;
  min-width: 25rpx;
  height: 25rpx;
  padding: 0 4rpx;
  border: 3rpx solid #fff;
  border-radius: 99rpx;
  background: var(--xy-primary);
  color: #fff;
  font-size: 12rpx;
}
.message-shortcuts > button.active .shortcut-icon {
  transform: translateY(-3rpx);
  box-shadow: 0 12rpx 28rpx
    color-mix(in srgb, var(--xy-primary) 18%, transparent);
}
.back-to-messages {
  display: flex;
  align-items: center;
  gap: 5rpx;
  width: max-content;
  margin: 0 24rpx 10rpx;
  padding: 9rpx 16rpx;
  border: 0;
  border-radius: 99rpx;
  background: var(--xy-soft);
  color: #526a63;
  font-size: 18rpx;
}
.message-scroll {
  height: calc(100vh - 255rpx - env(safe-area-inset-top));
}
/* Legacy tab selectors intentionally kept out: the mobile design uses visual shortcut cards. */
.message-tabs {
  display: none;
}
.message-tabs button > text {
  border-radius: 99rpx;
  background: var(--xy-primary);
  color: #fff;
  font-size: 14rpx;
}
.system-row,
.conversation {
  display: grid;
  align-items: center;
  width: 100%;
  margin: 0;
  border: 0;
  border-bottom: 0;
  background: #fff;
  text-align: left;
}
.system-row {
  grid-template-columns: 74rpx 1fr auto;
  gap: 14rpx;
  padding: 20rpx 24rpx;
}
.system-icon {
  display: grid;
  place-items: center;
  width: 68rpx;
  height: 68rpx;
  border-radius: 22rpx;
  background: linear-gradient(
    145deg,
    var(--xy-primary),
    var(--xy-primary-deep)
  );
}
.system-icon.audit {
  background: linear-gradient(145deg, #8e78ad, #6f5d8d);
}
.system-icon.reward {
  background: linear-gradient(145deg, #d79063, #b96d43);
}
.system-row > view:nth-child(2),
.conversation > view:nth-child(2) {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.system-row > view:nth-child(2) text:first-child,
.conversation > view:nth-child(2) text:first-child {
  font-size: 23rpx;
  font-weight: 700;
}
.system-row > view:nth-child(2) text:last-child,
.conversation > view:nth-child(2) text:last-child {
  margin-top: 6rpx;
  overflow: hidden;
  color: #899793;
  font-size: 18rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.system-row > text,
.conversation > text {
  align-self: start;
  margin-top: 7rpx;
  color: #9aa6a2;
  font-size: 16rpx;
}
.conversation {
  grid-template-columns: 92rpx 1fr auto;
  gap: 14rpx;
  padding: 18rpx 28rpx;
}
.avatar-wrap {
  position: relative;
  width: 84rpx;
  height: 84rpx;
}
.avatar-wrap image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}
.avatar-wrap > text {
  position: absolute;
  right: 1rpx;
  bottom: 3rpx;
  width: 17rpx;
  height: 17rpx;
  border: 4rpx solid #fff;
  border-radius: 50%;
  background: #48b884;
}
.avatar-wrap > view {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  display: grid;
  place-items: center;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 5rpx;
  border: 3rpx solid #fff;
  border-radius: 99rpx;
  background: var(--xy-primary);
  color: #fff;
  font-size: 14rpx;
}
.notice-row {
  display: grid;
  grid-template-columns: 75rpx 1fr 90rpx;
  gap: 14rpx;
  width: 100%;
  margin: 0;
  padding: 22rpx 24rpx;
  border: 0;
  border-bottom: 1rpx solid #edf1ef;
  background: #fff;
  text-align: left;
}
.notice-row > image:first-child {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
}
.notice-row > view {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.notice-row > view text:first-child {
  color: #677a74;
  font-size: 19rpx;
}
.notice-row > view text:first-child b {
  color: var(--xy-ink);
}
.notice-row > view text:nth-child(2) {
  margin-top: 7rpx;
  font-size: 21rpx;
  line-height: 1.45;
}
.notice-row > view text:last-child {
  margin-top: 7rpx;
  color: #98a49f;
  font-size: 16rpx;
}
.notice-row > image:last-child {
  width: 86rpx;
  height: 86rpx;
  border-radius: 12rpx;
}
.notice-row > button {
  align-self: center;
  margin: 0;
  padding: 9rpx 13rpx;
  border: 0;
  border-radius: 99rpx;
  background: var(--xy-primary);
  color: #fff;
  font-size: 17rpx;
}
.notice-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 140rpx 20rpx;
  color: #8a9995;
}
.notice-empty text {
  margin-top: 16rpx;
  font-size: 21rpx;
}
.message-space {
  height: 170rpx;
}
.center-layer {
  position: fixed;
  z-index: 185;
  inset: 0;
  background: #f5f8f7;
}
.center-header {
  display: grid;
  grid-template-columns: 70rpx 1fr 70rpx;
  align-items: center;
  padding: calc(18rpx + env(safe-area-inset-top)) 18rpx 14rpx;
  border-bottom: 1rpx solid #e4ebe8;
  background: #fff;
}
.center-header > button {
  display: grid;
  place-items: center;
  width: 62rpx;
  height: 62rpx;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
}
.center-header > text {
  text-align: center;
  font-size: 25rpx;
  font-weight: 760;
}
.center-scroll {
  height: calc(100vh - 96rpx - env(safe-area-inset-top));
}
.center-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 24rpx 26rpx;
  background: #fff;
}
.center-summary > view {
  display: grid;
  place-items: center;
  width: 74rpx;
  height: 74rpx;
  border-radius: 24rpx;
  background: linear-gradient(
    145deg,
    var(--xy-primary),
    var(--xy-primary-deep)
  );
}
.center-summary > text:nth-child(2) {
  margin-top: 14rpx;
  color: var(--xy-ink);
  font-size: 25rpx;
  font-weight: 750;
}
.center-summary > text:last-child {
  margin-top: 5rpx;
  color: #899994;
  font-size: 17rpx;
}
.audit-filter {
  display: flex;
  gap: 10rpx;
  padding: 16rpx 20rpx;
  background: #fff;
}
.audit-filter button {
  margin: 0;
  padding: 10rpx 17rpx;
  border: 0;
  border-radius: 99rpx;
  background: #f0f4f2;
  color: #71847d;
  font-size: 17rpx;
}
.audit-filter button.active {
  background: var(--xy-soft);
  color: var(--xy-primary-deep);
}
.audit-item {
  display: grid;
  grid-template-columns: 100rpx 1fr;
  gap: 14rpx;
  margin-top: 1rpx;
  padding: 19rpx 23rpx;
  background: #fff;
}
.audit-item > image,
.audit-placeholder {
  width: 96rpx;
  height: 96rpx;
  border-radius: 17rpx;
}
.audit-placeholder {
  display: grid;
  place-items: center;
  background: #e9f0ed;
}
.audit-item > view:last-child {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.audit-item > view:last-child > text:first-child {
  overflow: hidden;
  font-size: 21rpx;
  font-weight: 690;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.audit-item > view:last-child > text:nth-child(2) {
  margin-top: 6rpx;
  color: #8c9a96;
  font-size: 16rpx;
}
.status {
  width: max-content;
  margin-top: 7rpx;
  padding: 5rpx 9rpx;
  border-radius: 7rpx;
  font-size: 15rpx !important;
}
.status.passed {
  background: #e6f5ee;
  color: #26816b;
}
.status.checking {
  background: #edf3f7;
  color: #417e98;
}
.status.revise {
  background: #fff1e7;
  color: #ba6f42;
}
.rule-card {
  display: flex;
  flex-direction: column;
  margin: 18rpx 20rpx;
  padding: 20rpx;
  border-radius: 22rpx;
  background: #fff;
}
.rule-card text:first-child {
  font-size: 20rpx;
  font-weight: 700;
}
.rule-card text:last-child {
  margin-top: 8rpx;
  color: #7b8d87;
  font-size: 17rpx;
  line-height: 1.65;
}
.reward-page {
  padding-top: 18rpx;
}
.reward-wallet {
  position: relative;
  overflow: hidden;
  margin: 0 20rpx;
  padding: 27rpx;
  border-radius: 29rpx;
  background: linear-gradient(
    135deg,
    var(--xy-primary-deep),
    var(--xy-primary)
  );
  color: #fff;
}
.reward-wallet > text:first-child {
  font-size: 18rpx;
  opacity: 0.85;
}
.reward-wallet > view:nth-child(2) {
  display: flex;
  align-items: baseline;
  gap: 7rpx;
  margin-top: 7rpx;
}
.reward-wallet > view:nth-child(2) text:first-child {
  font-size: 47rpx;
  font-weight: 820;
}
.reward-wallet > view:nth-child(2) text:last-child {
  font-size: 18rpx;
}
.reward-wallet > text:nth-child(3) {
  display: block;
  margin-top: 8rpx;
  font-size: 16rpx;
  opacity: 0.82;
}
.wallet-bubbles i {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}
.wallet-bubbles i:nth-child(1) {
  top: -45rpx;
  right: -20rpx;
  width: 150rpx;
  height: 150rpx;
}
.wallet-bubbles i:nth-child(2) {
  right: 100rpx;
  bottom: -55rpx;
  width: 110rpx;
  height: 110rpx;
}
.reward-success {
  display: grid;
  grid-template-columns: 58rpx 1fr;
  align-items: center;
  gap: 12rpx;
  margin: 15rpx 20rpx 0;
  padding: 16rpx;
  border-radius: 20rpx;
  background: #e7f5ef;
}
.reward-success > view:first-child {
  display: grid;
  place-items: center;
  width: 54rpx;
  height: 54rpx;
  border-radius: 18rpx;
  background: var(--xy-primary);
}
.reward-success > view:last-child {
  display: flex;
  flex-direction: column;
}
.reward-success text:first-child {
  font-size: 19rpx;
  font-weight: 700;
}
.reward-success text:last-child {
  margin-top: 3rpx;
  color: #668078;
  font-size: 15rpx;
}
.activate-card {
  margin: 15rpx 20rpx;
  padding: 21rpx;
  border-radius: 24rpx;
  background: #fff;
}
.activate-card > view:first-child {
  display: flex;
  flex-direction: column;
}
.activate-card > view:first-child text:first-child {
  font-size: 22rpx;
  font-weight: 720;
}
.activate-card > view:first-child text:last-child {
  margin-top: 5rpx;
  color: #8a9995;
  font-size: 16rpx;
}
.code-input {
  display: grid;
  grid-template-columns: 1fr 100rpx;
  gap: 10rpx;
  margin-top: 16rpx;
}
.code-input input {
  height: 65rpx;
  padding: 0 15rpx;
  border-radius: 18rpx;
  background: #f0f4f2;
  font-size: 18rpx;
}
.code-input button {
  margin: 0;
  border: 0;
  border-radius: 18rpx;
  background: var(--xy-primary);
  color: #fff;
  font-size: 18rpx;
}
.code-input button[disabled] {
  opacity: 0.38;
}
.reward-title {
  display: flex;
  justify-content: space-between;
  padding: 15rpx 24rpx 10rpx;
}
.reward-title text:first-child {
  font-size: 23rpx;
  font-weight: 730;
}
.reward-title text:last-child {
  color: #84958f;
  font-size: 17rpx;
}
.reward-card {
  display: grid;
  grid-template-columns: 65rpx 1fr auto;
  align-items: center;
  gap: 12rpx;
  margin: 0 20rpx 12rpx;
  padding: 18rpx;
  border-radius: 23rpx;
  background: #fff;
}
.reward-icon {
  display: grid;
  place-items: center;
  width: 62rpx;
  height: 62rpx;
  border-radius: 20rpx;
  background: #fff0e6;
}
.reward-icon.blue {
  background: #e7f1f6;
}
.reward-card > view:nth-child(2) {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.reward-card > view:nth-child(2) text:first-child {
  font-size: 20rpx;
  font-weight: 700;
}
.reward-card > view:nth-child(2) text:nth-child(2) {
  margin-top: 4rpx;
  overflow: hidden;
  color: #758780;
  font-size: 16rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.reward-card > view:nth-child(2) text:last-child {
  margin-top: 4rpx;
  color: #9aa6a2;
  font-size: 14rpx;
}
.reward-card > button {
  margin: 0;
  padding: 10rpx 16rpx;
  border: 0;
  border-radius: 99rpx;
  background: var(--xy-primary);
  color: #fff;
  font-size: 17rpx;
}
.reward-card > button.received {
  background: #edf2f0;
  color: #81908b;
}
.system-page {
  background: #fff;
}
.system-notice {
  display: grid;
  grid-template-columns: 66rpx 1fr auto;
  align-items: center;
  gap: 13rpx;
  padding: 20rpx 23rpx;
}
.system-notice > view:first-child {
  display: grid;
  place-items: center;
  width: 62rpx;
  height: 62rpx;
  border-radius: 20rpx;
  background: var(--xy-primary);
}
.system-notice > view:nth-child(2) {
  display: flex;
  flex-direction: column;
}
.system-notice > view:nth-child(2) text:first-child {
  font-size: 20rpx;
  font-weight: 680;
}
.system-notice > view:nth-child(2) text:last-child {
  margin-top: 5rpx;
  color: #8b9a96;
  font-size: 15rpx;
}
.system-notice > text {
  align-self: start;
  color: #9ba6a3;
  font-size: 14rpx;
}
.center-space {
  height: 80rpx;
}
.chat-layer {
  position: fixed;
  z-index: 190;
  inset: 0;
  background: #f3f7f5;
}
.chat-header {
  display: grid;
  grid-template-columns: 70rpx 1fr 70rpx;
  align-items: center;
  padding: calc(18rpx + env(safe-area-inset-top)) 18rpx 14rpx;
  border-bottom: 1rpx solid #e4ebe8;
  background: #fff;
}
.chat-header > button {
  display: grid;
  place-items: center;
  width: 62rpx;
  height: 62rpx;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
}
.chat-header > view {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.chat-header > view text:first-child {
  font-size: 24rpx;
  font-weight: 750;
}
.chat-header > view text:last-child {
  margin-top: 3rpx;
  color: #68a28f;
  font-size: 15rpx;
}
.chat-scroll {
  height: calc(
    100vh - 190rpx - env(safe-area-inset-top) - env(safe-area-inset-bottom)
  );
}
.chat-time {
  padding: 25rpx 0;
  color: #98a5a1;
  font-size: 16rpx;
  text-align: center;
}
.bubble-row {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 11rpx 25rpx;
}
.bubble-row > image {
  width: 62rpx;
  height: 62rpx;
  border-radius: 50%;
}
.bubble-row > view {
  display: flex;
  max-width: 68%;
  flex-direction: column;
  align-items: flex-start;
}
.bubble-row > view > text:first-child {
  padding: 17rpx 20rpx;
  border-radius: 8rpx 24rpx 24rpx;
  background: #fff;
  color: #354a44;
  font-size: 21rpx;
  line-height: 1.55;
  box-shadow: 0 5rpx 18rpx rgba(50, 85, 75, 0.06);
}
.bubble-row > view > text:last-child {
  margin-top: 5rpx;
  color: #9aa6a2;
  font-size: 14rpx;
}
.bubble-row.mine {
  flex-direction: row-reverse;
}
.bubble-row.mine > view {
  align-items: flex-end;
}
.bubble-row.mine > view > text:first-child {
  border-radius: 24rpx 8rpx 24rpx 24rpx;
  background: var(--xy-primary);
  color: #fff;
}
.chat-input {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: 58rpx 1fr 62rpx;
  align-items: center;
  gap: 10rpx;
  padding: 13rpx 20rpx calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #e4ebe8;
  background: #fff;
}
.chat-input > button {
  display: grid;
  place-items: center;
  width: 56rpx;
  height: 56rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #edf3f1;
}
.chat-input > input {
  height: 66rpx;
  padding: 0 18rpx;
  border-radius: 22rpx;
  background: #f0f4f2;
  font-size: 21rpx;
}
.chat-input > button.send {
  background: var(--xy-primary);
}
.chat-input > button.send[disabled] {
  opacity: 0.4;
}
.chat-space {
  height: 80rpx;
}
@media (min-width: 1024px) {
  .message-page {
    height: calc(100vh - 92px);
    max-width: 920px;
    margin: 0 auto;
  }
  .conversation-list,
  .notice-list {
    max-width: 680px;
    margin: 0 auto;
  }
  .chat-layer {
    right: auto;
    left: 50%;
    width: 620px;
    transform: translateX(-50%);
  }
  .center-layer {
    right: auto;
    left: 50%;
    width: 620px;
    transform: translateX(-50%);
  }
  .chat-input {
    right: auto;
    left: 50%;
    width: 620px;
    transform: translateX(-50%);
  }
}
</style>
