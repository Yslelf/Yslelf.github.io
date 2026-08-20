<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { Place, Post } from '@/types/explore'

const props = defineProps<{ posts: Post[]; places: Place[] }>()
const emit = defineEmits(['close', 'post', 'place', 'author'])
const query = ref('')
const activeTab = ref<'all' | 'posts' | 'users' | 'places'>('all')
const searched = ref(false)
const history = ref<string[]>(uni.getStorageSync('xy-search-history') || ['南昌日落', '周末看展'])
const trends = ['南昌秋水广场晚霞', '本地人私藏散步路线', '南昌周末去哪儿', '宝藏咖啡店', '免费拍照地']
const users = computed(() => Array.from(new Map(props.posts.map(post => [post.author, { name: post.author, avatar: post.avatar, noteCount: props.posts.filter(item => item.author === post.author).length }])).values()))
const normalized = computed(() => query.value.trim().toLowerCase())
const postResults = computed(() => props.posts.filter(post => `${post.title}${post.excerpt}${post.author}`.toLowerCase().includes(normalized.value)))
const placeResults = computed(() => props.places.filter(place => `${place.name}${place.subtitle}${place.tags.join('')}`.toLowerCase().includes(normalized.value)))
const userResults = computed(() => users.value.filter(user => user.name.toLowerCase().includes(normalized.value)))

function search(value = query.value) {
  query.value = value
  if (!query.value.trim()) return
  searched.value = true
  history.value = [query.value.trim(), ...history.value.filter(item => item !== query.value.trim())].slice(0, 8)
  uni.setStorageSync('xy-search-history', history.value)
}

function clearHistory() {
  history.value = []
  uni.removeStorageSync('xy-search-history')
}
</script>

<template>
  <view class="search-layer">
    <view class="search-header safe-top"><button @click="emit('close')"><AppIcon type="back" size="24" color="#263f38"/></button><view class="search-field"><AppIcon type="search" size="19" color="#869691"/><input v-model="query" focus confirm-type="search" placeholder="搜索笔记、用户或地点" @confirm="search()"/><button v-if="query" @click="query='';searched=false"><AppIcon type="closeempty" size="17" color="#899893"/></button></view><button class="search-submit" @click="search()">搜索</button></view>
    <scroll-view scroll-y class="search-scroll">
      <template v-if="!searched">
        <view v-if="history.length" class="search-section"><view class="search-title"><text>搜索历史</text><button @click="clearHistory">清空</button></view><view class="history-list"><button v-for="item in history" :key="item" @click="search(item)">{{ item }}</button></view></view>
        <view class="search-section"><view class="search-title"><text>南昌热榜</text><text>实时</text></view><button v-for="(trend,index) in trends" :key="trend" class="trend-item" @click="search(trend)"><text :class="{hot:index<3}">{{ index+1 }}</text><view><text>{{ trend }}</text><text>{{ 23-index*3 }}.{{ index+2 }}万热度</text></view><text v-if="index<2" class="hot-tag">热</text></button></view>
      </template>
      <template v-else>
        <scroll-view scroll-x class="result-tabs" :show-scrollbar="false"><view><button v-for="tab in [{id:'all',label:'全部'},{id:'posts',label:'笔记'},{id:'users',label:'用户'},{id:'places',label:'地点'}]" :key="tab.id" :class="{active:activeTab===tab.id}" @click="activeTab=tab.id as typeof activeTab">{{ tab.label }}</button></view></scroll-view>
        <view v-if="activeTab==='all'||activeTab==='posts'" class="result-section"><text class="result-heading">相关笔记 · {{ postResults.length }}</text><view class="search-post-grid"><button v-for="post in postResults.slice(0,activeTab==='all'?4:20)" :key="post.id" @click="emit('post',post)"><image :src="post.cover" mode="aspectFill"/><text>{{ post.title }}</text><view><image :src="post.avatar"/><text>{{ post.author }}</text><text>♡ {{ post.likes }}</text></view></button></view></view>
        <view v-if="activeTab==='all'||activeTab==='users'" class="result-section"><text class="result-heading">相关用户 · {{ userResults.length }}</text><button v-for="user in userResults" :key="user.name" class="user-result" @click="emit('author',user.name)"><image :src="user.avatar"/><view><text>{{ user.name }}</text><text>{{ user.noteCount }} 篇笔记 · IP属地江西</text></view><text>查看</text></button></view>
        <view v-if="activeTab==='all'||activeTab==='places'" class="result-section"><text class="result-heading">相关地点 · {{ placeResults.length }}</text><button v-for="place in placeResults" :key="place.id" class="place-result" @click="emit('place',place)"><image :src="place.image" mode="aspectFill"/><view><text>{{ place.name }}</text><text>{{ place.subtitle }}</text><text>{{ place.distance }} · {{ place.score }} 分</text></view><AppIcon type="right" size="17" color="#91a09c"/></button></view>
        <view v-if="!postResults.length&&!userResults.length&&!placeResults.length" class="search-empty"><AppIcon type="search" size="34" color="#91a29d"/><text>暂时没有找到相关内容</text><text>换个关键词试试吧</text></view>
      </template>
      <view class="search-space"/>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.search-layer{position:fixed;z-index:210;inset:0;background:#f7faf9}.search-header{display:grid;grid-template-columns:64rpx 1fr 75rpx;align-items:center;gap:10rpx;padding:calc(18rpx + env(safe-area-inset-top)) 18rpx 14rpx;border-bottom:1rpx solid #e9efed;background:#fff}.search-header>button{display:grid;place-items:center;height:66rpx;margin:0;padding:0;border:0;background:transparent}.search-field{display:grid;grid-template-columns:38rpx 1fr 36rpx;align-items:center;height:66rpx;padding:0 17rpx;border-radius:999rpx;background:#f0f4f2}.search-field input{min-width:0;font-size:22rpx}.search-field button{display:grid;place-items:center;margin:0;padding:0;border:0;background:transparent}.search-submit{color:var(--xy-primary);font-size:21rpx;font-weight:700}.search-scroll{height:calc(100vh - 100rpx - env(safe-area-inset-top))}.search-section,.result-section{margin-top:16rpx;padding:25rpx 24rpx;background:#fff}.search-title{display:flex;align-items:center;justify-content:space-between}.search-title text:first-child,.result-heading{font-size:26rpx;font-weight:750;color:var(--xy-ink)}.search-title button,.search-title text:last-child{margin:0;padding:0;border:0;background:transparent;color:#91a09c;font-size:19rpx}.history-list{display:flex;flex-wrap:wrap;gap:13rpx;margin-top:20rpx}.history-list button{margin:0;padding:11rpx 18rpx;border:0;border-radius:99rpx;background:#f0f5f3;color:#587168;font-size:20rpx}.trend-item{display:grid;grid-template-columns:50rpx 1fr 45rpx;align-items:center;width:100%;margin:0;padding:20rpx 0;border:0;border-bottom:1rpx solid #edf1ef;background:transparent;text-align:left}.trend-item>text:first-child{color:#84948f;font-size:24rpx;font-weight:800}.trend-item>text.hot{color:#ed765e}.trend-item>view{display:flex;flex-direction:column}.trend-item>view text:first-child{font-size:23rpx;font-weight:650}.trend-item>view text:last-child{margin-top:5rpx;color:#9aa6a2;font-size:17rpx}.hot-tag{padding:4rpx 7rpx;border-radius:7rpx;background:#fff0eb;color:#e86d58;font-size:15rpx}.result-tabs{height:82rpx;background:#fff;white-space:nowrap}.result-tabs>view{display:inline-flex;gap:44rpx;padding:0 28rpx}.result-tabs button{position:relative;margin:0;padding:26rpx 3rpx;border:0;background:transparent;color:#7e8c88;font-size:22rpx}.result-tabs button.active{color:var(--xy-ink);font-weight:750}.result-tabs button.active:after{content:'';position:absolute;right:25%;bottom:13rpx;left:25%;height:4rpx;border-radius:99rpx;background:var(--xy-primary)}.result-heading{display:block;margin-bottom:19rpx}.search-post-grid{display:grid;grid-template-columns:1fr 1fr;gap:18rpx 13rpx}.search-post-grid>button{margin:0;padding:0;border:0;background:transparent;text-align:left}.search-post-grid>button>image{width:100%;height:300rpx;border-radius:17rpx}.search-post-grid>button>text{display:-webkit-box;margin-top:10rpx;overflow:hidden;font-size:21rpx;font-weight:620;line-height:1.45;-webkit-box-orient:vertical;-webkit-line-clamp:2}.search-post-grid>button>view{display:grid;grid-template-columns:34rpx 1fr auto;align-items:center;gap:7rpx;margin-top:10rpx;color:#81908c;font-size:16rpx}.search-post-grid>button>view image{width:32rpx;height:32rpx;border-radius:50%}.user-result,.place-result{display:grid;align-items:center;width:100%;margin:0;padding:16rpx 0;border:0;border-bottom:1rpx solid #edf1ef;background:transparent;text-align:left}.user-result{grid-template-columns:70rpx 1fr auto;gap:14rpx}.user-result>image{width:66rpx;height:66rpx;border-radius:50%}.user-result>view,.place-result>view{display:flex;flex-direction:column}.user-result>view text:first-child,.place-result>view text:first-child{font-size:22rpx;font-weight:680}.user-result>view text:last-child,.place-result>view text:nth-child(2){margin-top:5rpx;color:#8b9a96;font-size:18rpx}.user-result>text{padding:8rpx 17rpx;border-radius:99rpx;background:var(--xy-primary);color:#fff;font-size:18rpx}.place-result{grid-template-columns:105rpx 1fr 30rpx;gap:15rpx}.place-result>image{width:102rpx;height:85rpx;border-radius:15rpx}.place-result>view text:last-child{margin-top:5rpx;color:var(--xy-primary);font-size:17rpx}.search-empty{display:flex;flex-direction:column;align-items:center;padding:130rpx 20rpx;color:#758983}.search-empty text:nth-child(2){margin-top:17rpx;font-size:24rpx;font-weight:650}.search-empty text:last-child{margin-top:6rpx;color:#9ba8a4;font-size:19rpx}.search-space{height:100rpx}@media (min-width:760px){.search-layer{right:auto;left:50%;width:520px;transform:translateX(-50%)}}
</style>
