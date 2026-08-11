<script setup lang="ts">
import { computed, ref } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import { useExploreStore } from "@/stores/explore";

type LibraryMode =
  | "following"
  | "followers"
  | "collections"
  | "history"
  | "drafts"
  | "management";
const props = defineProps<{ mode: LibraryMode }>();
const emit = defineEmits(["close", "compose"]);
const store = useExploreStore();
const currentMode = ref<LibraryMode>(props.mode);
const query = ref("");
const draft = ref<Record<string, unknown>>(
  uni.getStorageSync("xy-post-draft") || {},
);
const people = ref([
  {
    id: 1,
    name: "小宇在散步",
    bio: "分享南昌散步路线和晚霞",
    avatar: "https://i.pravatar.cc/160?img=12",
    following: true,
    relation: "互相关注",
  },
  {
    id: 2,
    name: "四月影像",
    bio: "城市摄影 · 夜景机位",
    avatar: "https://i.pravatar.cc/160?img=11",
    following: true,
    relation: "关注了你",
  },
  {
    id: 3,
    name: "栗子周末",
    bio: "周末吃喝玩乐不踩雷",
    avatar: "https://i.pravatar.cc/160?img=9",
    following: false,
    relation: "关注了你",
  },
  {
    id: 4,
    name: "阿白看展中",
    bio: "展览和独立咖啡店爱好者",
    avatar: "https://i.pravatar.cc/160?img=32",
    following: true,
    relation: "互相关注",
  },
]);
const title = computed(
  () =>
    ({
      following: "我的关注",
      followers: "我的粉丝",
      collections: "我的收藏",
      history: "浏览记录",
      drafts: "草稿箱",
      management: "笔记管理",
    })[currentMode.value],
);
const shownPeople = computed(() =>
  people.value.filter((item) =>
    `${item.name}${item.bio}`.includes(query.value.trim()),
  ),
);
const shownPosts = computed(() =>
  currentMode.value === "collections"
    ? store.posts.filter((post) => post.collected)
    : currentMode.value === "management"
      ? store.posts.filter((post) => post.author === "我在南昌")
      : store.posts.slice(0, 8),
);
const hasDraft = computed(() => Object.keys(draft.value).length > 0);

function toggleFollow(id: number) {
  const person = people.value.find((item) => item.id === id);
  if (person) person.following = !person.following;
}
function removeDraft() {
  uni.removeStorageSync("xy-post-draft");
  draft.value = {};
  uni.showToast({ title: "草稿已删除", icon: "none" });
}
function managePost(action: string) {
  uni.showToast({ title: `${action}操作已记录`, icon: "none" });
}
</script>

<template>
  <view class="library-layer">
    <view class="library-header safe-top"
      ><button @click="emit('close')">
        <AppIcon type="back" size="24" color="#263f38" /></button
      ><text>{{ title }}</text
      ><button><AppIcon type="search" size="23" color="#536d65" /></button
    ></view>
    <view
      v-if="currentMode === 'following' || currentMode === 'followers'"
      class="follow-switch"
      ><button
        :class="{ active: currentMode === 'following' }"
        @click="currentMode = 'following'"
      >
        关注 {{ people.filter((item) => item.following).length }}</button
      ><button
        :class="{ active: currentMode === 'followers' }"
        @click="currentMode = 'followers'"
      >
        粉丝 126
      </button></view
    >
    <view
      v-if="currentMode === 'following' || currentMode === 'followers'"
      class="people-search"
      ><AppIcon type="search" size="18" color="#879791" /><input
        v-model="query"
        placeholder="搜索用户"
    /></view>
    <scroll-view scroll-y class="library-scroll">
      <view
        v-if="currentMode === 'following' || currentMode === 'followers'"
        class="people-list"
        ><view v-for="person in shownPeople" :key="person.id" class="person-row"
          ><image :src="person.avatar" /><view
            ><text>{{ person.name }}</text
            ><text>{{ person.bio }}</text
            ><text>{{ person.relation }}</text></view
          ><button
            :class="{ followed: person.following }"
            @click="toggleFollow(person.id)"
          >
            {{ person.following ? "已关注" : "关注" }}
          </button></view
        ></view
      >

      <view v-else-if="currentMode === 'drafts'" class="draft-list">
        <view v-if="hasDraft" class="draft-card"
          ><view class="draft-cover"
            ><image
              v-if="(draft.images as string[])?.length"
              :src="(draft.images as string[])[0]"
              mode="aspectFill"
            /><view v-else
              ><AppIcon type="image" size="33" color="#879a94" /></view
            ><text>图文草稿</text></view
          ><view class="draft-copy"
            ><text>{{ draft.title || "未填写标题" }}</text
            ><text>{{ draft.content || "继续记录你的真实体验…" }}</text
            ><text
              >刚刚保存 ·
              {{ (draft.images as string[])?.length || 0 }} 张图片</text
            ><view
              ><button @click="emit('compose')">继续编辑</button
              ><button @click="removeDraft">删除</button></view
            ></view
          ></view
        >
        <view class="draft-card"
          ><view class="draft-cover sample"
            ><image
              src="https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=500&q=75"
              mode="aspectFill"
            /><text>图文草稿</text></view
          ><view class="draft-copy"
            ><text>周末去看一场江边日落</text
            ><text>路线和最佳拍摄时间还没有整理完…</text
            ><text>8月10日保存 · 3 张图片</text
            ><view
              ><button @click="emit('compose')">继续编辑</button
              ><button @click="managePost('删除')">删除</button></view
            ></view
          ></view
        >
      </view>

      <view v-else-if="shownPosts.length" class="library-grid"
        ><view v-for="post in shownPosts" :key="post.id" class="library-post"
          ><image :src="post.cover" mode="aspectFill" /><text>{{
            post.title
          }}</text
          ><view v-if="currentMode === 'management'" class="post-manage"
            ><text>公开 · {{ post.likes }} 赞</text
            ><button @click="managePost('更多')">•••</button></view
          ><view v-else
            ><AppIcon
              :type="currentMode === 'collections' ? 'star-filled' : 'heart'"
              size="15"
              color="#7e918a"
            /><text>{{ post.likes }}</text></view
          ></view
        ></view
      >
      <view v-else class="library-empty"
        ><view
          ><AppIcon
            :type="
              currentMode === 'collections'
                ? 'star'
                : currentMode === 'management'
                  ? 'image'
                  : 'list'
            "
            size="38"
            color="#8d9e98" /></view
        ><text>{{
          currentMode === "collections"
            ? "还没有收藏内容"
            : currentMode === "management"
              ? "还没有发布笔记"
              : "暂无浏览记录"
        }}</text
        ><text>去探索页看看大家正在分享什么</text></view
      >
      <view class="library-space" />
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.library-layer {
  position: fixed;
  z-index: 210;
  inset: 0;
  background: #f7faf9;
}
.library-header {
  display: grid;
  grid-template-columns: 70rpx 1fr 70rpx;
  align-items: center;
  padding: calc(18rpx + env(safe-area-inset-top)) 18rpx 14rpx;
  border-bottom: 1rpx solid #e7edeb;
  background: #fff;
}
.library-header > button {
  display: grid;
  place-items: center;
  width: 62rpx;
  height: 62rpx;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
}
.library-header > text {
  text-align: center;
  font-size: 26rpx;
  font-weight: 760;
}
.follow-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 76rpx;
  border-bottom: 1rpx solid #e9eeec;
  background: #fff;
}
.follow-switch button {
  position: relative;
  margin: 0;
  border: 0;
  background: transparent;
  color: #83928d;
  font-size: 21rpx;
}
.follow-switch button.active {
  color: var(--xy-ink);
  font-weight: 730;
}
.follow-switch button.active:after {
  content: "";
  position: absolute;
  right: 39%;
  bottom: 0;
  left: 39%;
  height: 5rpx;
  border-radius: 99rpx;
  background: var(--xy-primary);
}
.people-search {
  display: flex;
  align-items: center;
  gap: 10rpx;
  height: 64rpx;
  margin: 17rpx 24rpx;
  padding: 0 18rpx;
  border-radius: 21rpx;
  background: #edf3f1;
}
.people-search input {
  flex: 1;
  font-size: 20rpx;
}
.library-scroll {
  height: calc(100vh - 100rpx - env(safe-area-inset-top));
}
.follow-switch + .people-search + .library-scroll {
  height: calc(100vh - 257rpx - env(safe-area-inset-top));
}
.people-list {
  background: #fff;
}
.person-row {
  display: grid;
  grid-template-columns: 82rpx 1fr auto;
  align-items: center;
  gap: 14rpx;
  padding: 20rpx 25rpx;
}
.person-row > image {
  width: 78rpx;
  height: 78rpx;
  border-radius: 50%;
}
.person-row > view {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.person-row > view text:first-child {
  font-size: 22rpx;
  font-weight: 700;
}
.person-row > view text:nth-child(2) {
  margin-top: 4rpx;
  overflow: hidden;
  color: #7d8e88;
  font-size: 17rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.person-row > view text:last-child {
  margin-top: 4rpx;
  color: #9aa6a2;
  font-size: 15rpx;
}
.person-row > button {
  min-width: 100rpx;
  margin: 0;
  padding: 11rpx 17rpx;
  border: 0;
  border-radius: 99rpx;
  background: var(--xy-primary);
  color: #fff;
  font-size: 18rpx;
}
.person-row > button.followed {
  border: 1rpx solid #dce7e3;
  background: #fff;
  color: #73857f;
}
.library-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx;
  padding: 14rpx;
}
.library-post {
  overflow: hidden;
  border-radius: 17rpx;
  background: #fff;
}
.library-post > image {
  width: 100%;
  height: 325rpx;
}
.library-post > text {
  display: -webkit-box;
  margin: 11rpx 11rpx 0;
  overflow: hidden;
  font-size: 20rpx;
  font-weight: 650;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.library-post > view {
  display: flex;
  align-items: center;
  gap: 5rpx;
  margin: 9rpx 11rpx 12rpx;
  color: #81918c;
  font-size: 16rpx;
}
.post-manage {
  justify-content: space-between;
}
.post-manage button {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #697c76;
  font-size: 20rpx;
}
.draft-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  padding: 18rpx;
}
.draft-card {
  display: grid;
  grid-template-columns: 190rpx 1fr;
  overflow: hidden;
  border-radius: 25rpx;
  background: #fff;
}
.draft-cover {
  position: relative;
  height: 220rpx;
  background: #edf3f1;
}
.draft-cover > image {
  width: 100%;
  height: 100%;
}
.draft-cover > view {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
}
.draft-cover > text {
  position: absolute;
  top: 11rpx;
  left: 11rpx;
  padding: 5rpx 9rpx;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.9);
  color: var(--xy-primary);
  font-size: 14rpx;
}
.draft-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 17rpx;
}
.draft-copy > text:first-child {
  font-size: 22rpx;
  font-weight: 700;
}
.draft-copy > text:nth-child(2) {
  display: -webkit-box;
  margin-top: 7rpx;
  overflow: hidden;
  color: #70837c;
  font-size: 17rpx;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.draft-copy > text:nth-child(3) {
  margin-top: auto;
  color: #9aa6a2;
  font-size: 14rpx;
}
.draft-copy > view {
  display: flex;
  gap: 8rpx;
  margin-top: 9rpx;
}
.draft-copy button {
  margin: 0;
  padding: 7rpx 12rpx;
  border: 0;
  border-radius: 10rpx;
  background: var(--xy-soft);
  color: var(--xy-primary-deep);
  font-size: 16rpx;
}
.draft-copy button:last-child {
  background: #f1f3f2;
  color: #7b8985;
}
.library-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 130rpx 25rpx;
  color: #879893;
}
.library-empty > view {
  display: grid;
  place-items: center;
  width: 104rpx;
  height: 104rpx;
  border-radius: 33rpx;
  background: #edf3f1;
}
.library-empty > text:nth-child(2) {
  margin-top: 18rpx;
  font-size: 22rpx;
  font-weight: 700;
}
.library-empty > text:last-child {
  margin-top: 7rpx;
  font-size: 17rpx;
}
.library-space {
  height: 100rpx;
}
@media (min-width: 1024px) {
  .library-layer {
    right: auto;
    left: 50%;
    width: 760px;
    transform: translateX(-50%);
  }
  .library-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .library-post > image {
    height: auto;
    aspect-ratio: 4/5;
  }
}
</style>
