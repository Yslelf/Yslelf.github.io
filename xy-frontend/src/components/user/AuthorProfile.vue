<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { Post } from '@/types/explore'

const props = defineProps<{ author: string; posts: Post[]; followed?: boolean }>()
const emit = defineEmits(['close', 'follow', 'post'])
const activeTab = ref<'notes' | 'collections'>('notes')
const authorPosts = computed(() => props.posts.filter(post => post.author === props.author))
const avatar = computed(() => authorPosts.value[0]?.avatar || 'https://i.pravatar.cc/160?img=14')
const displayPosts = computed(() => activeTab.value === 'notes' ? authorPosts.value : props.posts.filter(post => post.collected).slice(0, 8))
const seed = computed(() => Array.from(props.author).reduce((sum, char) => sum + char.charCodeAt(0), 0))
const stats = computed(() => ({ following: 36 + seed.value % 80, followers: 128 + seed.value % 900, likes: authorPosts.value.reduce((sum, post) => sum + post.likes, 0) }))

function message() {
  uni.showToast({ title: '已进入私信会话', icon: 'none' })
}
</script>

<template>
  <view class="profile-layer">
    <scroll-view scroll-y class="profile-scroll">
      <view class="profile-cover"><view class="cover-glow one"/><view class="cover-glow two"/><button class="profile-back" @click="emit('close')"><AppIcon type="back" size="24" color="#fff"/></button><button class="profile-share"><AppIcon type="redo" size="22" color="#fff"/></button></view>
      <view class="profile-card">
        <image class="profile-avatar" :src="avatar" mode="aspectFill"/>
        <view class="profile-name"><text>{{ author }}</text><text>XY号：NC{{ 100000 + seed % 899999 }}</text></view>
        <text class="profile-bio">记录南昌的日落、街巷和周末灵感。认真生活，也认真分享每一次真实到访。</text>
        <view class="profile-tags"><text>♀ 江西</text><text>📍 南昌</text><text>城市探索者</text></view>
        <view class="profile-stats"><button><text>{{ stats.following }}</text><text>关注</text></button><button><text>{{ stats.followers }}</text><text>粉丝</text></button><button><text>{{ stats.likes }}</text><text>获赞与收藏</text></button></view>
        <view class="profile-actions"><button class="follow-button" :class="{followed}" @click="emit('follow',author)">{{ followed?'已关注':'关注' }}</button><button class="message-button" @click="message"><AppIcon type="chat" size="20" color="#42695f"/>私信</button></view>
      </view>
      <view class="profile-tabs"><button :class="{active:activeTab==='notes'}" @click="activeTab='notes'">笔记 {{ authorPosts.length }}</button><button :class="{active:activeTab==='collections'}" @click="activeTab='collections'">收藏</button></view>
      <view v-if="displayPosts.length" class="profile-grid"><button v-for="post in displayPosts" :key="post.id" @click="emit('post',post)"><view><image :src="post.cover" mode="aspectFill"/><text v-if="post.live">现场</text></view><text>{{ post.title }}</text><view><AppIcon type="heart" size="15" color="#82908c"/><text>{{ post.likes }}</text></view></button></view>
      <view v-else class="profile-empty"><AppIcon type="image" size="40" color="#95a49f"/><text>{{ activeTab==='notes'?'还没有发布笔记':'收藏内容仅自己可见' }}</text></view>
      <view class="profile-space"/>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.profile-layer{position:fixed;z-index:205;inset:0;background:#f7faf9}.profile-scroll{height:100vh}.profile-cover{position:relative;overflow:hidden;height:290rpx;background:linear-gradient(145deg,var(--xy-primary-deep),color-mix(in srgb,var(--xy-primary) 62%,#8dbbac))}.cover-glow{position:absolute;border-radius:50%;background:rgba(255,255,255,.12)}.cover-glow.one{top:-100rpx;right:-60rpx;width:300rpx;height:300rpx}.cover-glow.two{bottom:-120rpx;left:-30rpx;width:250rpx;height:250rpx}.profile-back,.profile-share{position:absolute;top:calc(26rpx + env(safe-area-inset-top));display:grid;place-items:center;width:64rpx;height:64rpx;margin:0;padding:0;border:0;border-radius:50%;background:rgba(25,55,47,.22);backdrop-filter:blur(8px)}.profile-back{left:24rpx}.profile-share{right:24rpx}.profile-card{position:relative;margin-top:-58rpx;padding:0 28rpx 28rpx;border-radius:38rpx 38rpx 0 0;background:#fff}.profile-avatar{width:142rpx;height:142rpx;margin-top:-70rpx;border:7rpx solid #fff;border-radius:50%;box-shadow:0 10rpx 28rpx rgba(35,75,64,.14)}.profile-name{display:flex;flex-direction:column;margin-top:12rpx}.profile-name text:first-child{color:var(--xy-ink);font-size:35rpx;font-weight:800}.profile-name text:last-child{margin-top:6rpx;color:#8b9a96;font-size:18rpx}.profile-bio{display:block;margin-top:20rpx;color:#536c65;font-size:22rpx;line-height:1.7}.profile-tags{display:flex;gap:10rpx;margin-top:17rpx}.profile-tags text{padding:7rpx 12rpx;border-radius:99rpx;background:#f0f4f2;color:#72847e;font-size:17rpx}.profile-stats{display:flex;gap:35rpx;margin-top:24rpx}.profile-stats button{display:flex;flex-direction:column;align-items:flex-start;margin:0;padding:0;border:0;background:transparent}.profile-stats button text:first-child{color:var(--xy-ink);font-size:25rpx;font-weight:760}.profile-stats button text:last-child{margin-top:3rpx;color:#8b9995;font-size:17rpx}.profile-actions{display:grid;grid-template-columns:1fr 1fr;gap:13rpx;margin-top:25rpx}.profile-actions button{display:flex;align-items:center;justify-content:center;gap:8rpx;height:70rpx;margin:0;border-radius:20rpx;font-size:21rpx;font-weight:680}.follow-button{border:0;background:var(--xy-primary);color:#fff}.follow-button.followed{border:1rpx solid #dce6e2;background:#fff;color:#72857e}.message-button{border:1rpx solid #dce7e3;background:#fff;color:#42695f}.profile-tabs{position:sticky;z-index:4;top:0;display:grid;grid-template-columns:1fr 1fr;height:82rpx;border-bottom:1rpx solid #e9eeec;background:rgba(255,255,255,.96)}.profile-tabs button{position:relative;margin:0;border:0;background:transparent;color:#83918d;font-size:22rpx}.profile-tabs button.active{color:var(--xy-ink);font-weight:750}.profile-tabs button.active:after{content:'';position:absolute;right:38%;bottom:0;left:38%;height:5rpx;border-radius:99rpx;background:var(--xy-primary)}.profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:16rpx;padding:16rpx}.profile-grid>button{position:relative;margin:0;padding:0 0 12rpx;border:0;border-radius:17rpx;background:#fff;text-align:left}.profile-grid>button>view:first-child{position:relative;height:330rpx;overflow:hidden;border-radius:17rpx}.profile-grid>button>view:first-child image{width:100%;height:100%}.profile-grid>button>view:first-child text{position:absolute;top:10rpx;left:10rpx;padding:5rpx 9rpx;border-radius:8rpx;background:rgba(255,255,255,.9);color:var(--xy-primary);font-size:15rpx}.profile-grid>button>text{display:-webkit-box;margin:11rpx 8rpx 0;overflow:hidden;font-size:21rpx;font-weight:620;line-height:1.45;-webkit-box-orient:vertical;-webkit-line-clamp:2}.profile-grid>button>view:last-child{display:flex;align-items:center;gap:5rpx;margin:9rpx 8rpx 0;color:#82908c;font-size:16rpx}.profile-empty{display:flex;flex-direction:column;align-items:center;padding:110rpx 20rpx;color:#899994}.profile-empty text{margin-top:15rpx;font-size:21rpx}.profile-space{height:120rpx}@media (min-width:760px){.profile-layer{right:auto;left:50%;width:520px;transform:translateX(-50%)}}
</style>
