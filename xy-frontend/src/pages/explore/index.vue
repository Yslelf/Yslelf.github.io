<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useExploreStore } from '@/stores/explore'
import type { Post } from '@/types/explore'
import AppIcon from '@/components/AppIcon.vue'
import AmapExplorer from '@/components/map/AmapExplorer.vue'
import CommunitySearch from '@/components/search/CommunitySearch.vue'
import AuthorProfile from '@/components/user/AuthorProfile.vue'

const store = useExploreStore()
const viewMode = ref<'feed' | 'map'>('map')
const keyword = ref('')
const refreshing = ref(false)
const selectedPlaceId = ref<number | null>(null)
const selectedPostId = ref<number | null>(null)
const showFilter = ref(false)
const showComments = ref(false)
const showCommunitySearch = ref(false)
const selectedAuthor = ref<string | null>(null)
const selectedSort = ref<'推荐' | '距离最近' | '最新发布'>('推荐')
const maxDistance = ref(10)
const selectedAttributes = ref<string[]>(['真实到访'])
const feedChannel = ref('推荐')
const feedChannels = computed(() => ['推荐', ...store.categories.filter(item => item.name !== '全部').map(item => item.name)])
const feedTab = ref('发现')
const mapExplorerRef = ref<{
  searchPoi: (keyword: string) => Promise<{ name: string } | null>
  locateCurrent: () => Promise<{ longitude: number; latitude: number }>
} | null>(null)
const followingAuthors = ref<string[]>(uni.getStorageSync('xy-following-authors') || [])
const commentDraft = ref('')
const localComments = ref<Array<{ id: number; author: string; content: string; time: string; liked: boolean }>>([])
const allComments = computed(() => [...store.comments, ...localComments.value])
const selectedPlace = computed(() => store.places.find(item => item.id === selectedPlaceId.value))
const selectedPost = computed(() => store.posts.find(item => item.id === selectedPostId.value))
const placePosts = computed(() => store.posts.filter(item => item.placeId === selectedPlaceId.value))
const filteredPosts = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  let result = store.visiblePosts
  if (feedChannel.value !== '推荐') {
    const placeIds = store.places.filter(place => place.category === feedChannel.value || place.tags.includes(feedChannel.value)).map(place => place.id)
    result = result.filter(post => placeIds.includes(post.placeId))
  }
  if (feedTab.value === '关注') result = result.filter(post => followingAuthors.value.includes(post.author))
  if (feedTab.value === '附近') {
    result = result.filter(post => distanceNumber(placeDistance(post.placeId)) <= maxDistance.value)
  }
  if (selectedAttributes.value.includes('真实到访')) result = result.filter(post => post.checkedIn)
  if (selectedAttributes.value.includes('现场发布')) result = result.filter(post => post.live)
  if (selectedAttributes.value.includes('图文丰富')) result = result.filter(post => (post.mediaCount ?? 1) >= 3)
  if (value) result = result.filter(item => `${item.title}${item.excerpt}${placeName(item.placeId)}`.toLowerCase().includes(value))
  if (selectedSort.value === '距离最近') result = [...result].sort((a, b) => distanceNumber(placeDistance(a.placeId)) - distanceNumber(placeDistance(b.placeId)))
  if (selectedSort.value === '最新发布') result = [...result].sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
  return result
})
const leftPosts = computed(() => filteredPosts.value.filter((_, index) => index % 2 === 0))
const rightPosts = computed(() => filteredPosts.value.filter((_, index) => index % 2 === 1))

onMounted(() => store.load())
const placeName = (id: number) => store.places.find(p => p.id === id)?.name ?? '南昌宝藏地'
const placeDistance = (id: number) => store.places.find(p => p.id === id)?.distance ?? ''
const distanceNumber = (value: string) => Number.parseFloat(value) || Number.POSITIVE_INFINITY
const isWanted = computed(() => selectedPlace.value ? store.wantedPlaceIds.includes(selectedPlace.value.id) : false)

async function refresh() {
  refreshing.value = true
  await store.load()
  setTimeout(() => { refreshing.value = false }, 350)
}

async function toggleUseful(post: Post) {
  await store.toggleUseful(post)
  uni.showToast({ title: post.usefulMarked ? '已标记有用' : '操作失败，请重试', icon: 'none' })
}

function toggleLike(post: Post) {
  store.toggleLike(post)
}

function toggleCollect(post: Post) {
  store.toggleCollect(post)
  uni.showToast({ title: post.collected ? '已收藏' : '已取消收藏', icon: 'none' })
}

function toggleFollow(author: string) {
  followingAuthors.value = followingAuthors.value.includes(author)
    ? followingAuthors.value.filter(item => item !== author)
    : [...followingAuthors.value, author]
  uni.setStorageSync('xy-following-authors', followingAuthors.value)
}

function openAuthor(author: string) {
  selectedAuthor.value = author
}

function openPostFromAuthor(post: Post) {
  selectedAuthor.value = null
  openPost(post)
}

function sharePost() {
  uni.showActionSheet({ itemList: ['分享给朋友', '复制链接', '生成分享图'], success: result => {
    const labels = ['分享给朋友', '链接已复制', '分享图生成中']
    uni.showToast({ title: labels[result.tapIndex], icon: 'none' })
  } })
}

async function submitComment() {
  const content = commentDraft.value.trim()
  if (!content) return
  try {
    await store.addComment(selectedPost.value!.id, content)
    commentDraft.value = ''
    uni.showToast({ title: '评论成功', icon: 'success' })
  } catch { uni.showToast({ title: '发送失败，请重试', icon: 'none' }) }
}

function openPlace(id: number) {
  selectedPlaceId.value = id
  selectedPostId.value = null
}

function openPost(post: Post) {
  selectedPlaceId.value = post.placeId
  selectedPostId.value = post.id
}

function openPostFromSearch(post: Post) {
  showCommunitySearch.value = false
  openPost(post)
}

function openPlaceFromSearch(place: { id: number }) {
  showCommunitySearch.value = false
  viewMode.value = 'map'
  openPlace(place.id)
}

function closeDetail() {
  selectedPostId.value = null
  selectedPlaceId.value = null
  showComments.value = false
}

async function checkIn() {
  if (!selectedPlace.value) return
  try { await store.checkIn(selectedPlace.value.id); uni.showToast({ title: '已记录这次到访', icon: 'success' }) }
  catch { uni.showToast({ title: '打卡失败，请重试', icon: 'none' }) }
}

async function toggleWanted() {
  if (!selectedPlace.value) return
  await store.toggleWantedPlace(selectedPlace.value.id)
  uni.showToast({ title: isWanted.value ? '已加入想去' : '已取消想去', icon: 'none' })
}

function toggleAttribute(attribute: string) {
  selectedAttributes.value = selectedAttributes.value.includes(attribute)
    ? selectedAttributes.value.filter(item => item !== attribute)
    : [...selectedAttributes.value, attribute]
}

function navigateToPlace() {
  const place = selectedPlace.value
  if (!place) return
  uni.openLocation({ latitude: place.latitude, longitude: place.longitude, name: place.name, address: place.subtitle })
}

async function searchMap() {
  if (viewMode.value !== 'map' || !keyword.value.trim()) return
  try {
    const result = await mapExplorerRef.value?.searchPoi(keyword.value)
    if (result) uni.showToast({ title: `已定位：${result.name}`, icon: 'none' })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '地点搜索失败', icon: 'none' })
  }
}

async function locateCurrent() {
  try {
    await mapExplorerRef.value?.locateCurrent()
    uni.showToast({ title: '已定位到当前位置', icon: 'none' })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '定位失败', icon: 'none' })
  }
}
</script>

<template>
  <scroll-view class="explore-page" scroll-y refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="refresh">
    <view v-if="viewMode === 'map'" class="hero">
      <view class="hero-glow glow-one" /><view class="hero-glow glow-two" />
      <view class="topline">
        <button class="city-button"><AppIcon type="location-filled" size="18" color="#1f816d" /><text>{{ store.city }}</text><AppIcon type="down" size="12" color="#64867d" /></button>
        <view class="weather"><AppIcon type="fire-filled" size="17" color="#efa35b" /><text>{{ store.weather }}</text></view>
      </view>
      <view class="headline"><text class="eyebrow">DISCOVER AROUND</text><text class="title">今天，去发现点<text class="accent">新鲜的</text></text><text class="subtitle">真实体验，正在你身边发生</text></view>
      <view class="search-box"><AppIcon type="search" size="20" color="#78938c" /><input v-model="keyword" confirm-type="search" placeholder="搜地点，如南昌理工学院" placeholder-class="search-placeholder" @confirm="searchMap" /><button class="filter-button" aria-label="搜索地点" @click="searchMap"><AppIcon type="search" size="20" color="#fff" /></button></view>
    </view>

    <view v-else class="feed-topbar">
      <button class="feed-map-entry" aria-label="打开地图" @click="viewMode='map'"><AppIcon type="map-filled" size="22" color="#263e38"/></button>
      <view class="feed-main-tabs"><button v-for="tab in ['关注','发现','附近']" :key="tab" :class="{active:feedTab===tab}" @click="feedTab=tab">{{ tab }}</button></view>
      <button class="feed-search-entry" aria-label="搜索" @click="showCommunitySearch=true"><AppIcon type="search" size="23" color="#263e38"/></button>
    </view>

    <view v-if="viewMode === 'map'" class="explore-switch">
      <button class="active" @click="viewMode = 'map'"><AppIcon type="map-filled" size="18" color="#fff"/><text>地图</text></button>
      <button @click="viewMode = 'feed'"><AppIcon type="image" size="18" color="#789089"/><text>逛逛</text></button>
    </view>

    <scroll-view v-if="viewMode === 'feed'" class="feed-channels" scroll-x :show-scrollbar="false">
      <view class="feed-channel-row">
        <button v-for="channel in feedChannels" :key="channel" :class="{ active: feedChannel === channel }" @click="feedChannel=channel">{{ channel }}</button>
      </view>
    </scroll-view>

    <view v-if="viewMode === 'map'" class="map-card">
      <AmapExplorer ref="mapExplorerRef" :places="store.places" :selected-id="selectedPlaceId" @select="openPlace" />
      <view class="map-tools"><button @click="showFilter=true"><AppIcon type="tune-filled" size="20" color="#267F6B"/></button><button @click="locateCurrent"><AppIcon type="location-filled" size="20" color="#267F6B"/></button></view>
      <view class="map-status"><view class="pulse"/><text>以你为中心 · 发现 {{ store.places.length }} 个宝藏点</text></view>
      <scroll-view class="map-place-scroll" scroll-x :show-scrollbar="false">
        <view class="map-place-row">
          <button v-for="place in store.places" :key="place.id" class="map-place-card" @click="openPlace(place.id)">
            <image :src="place.image" mode="aspectFill"/><view><text>{{ place.name }}</text><text>{{ place.subtitle }}</text><view><text>{{ place.score }} 体验分</text><text>{{ place.distance }}</text></view></view>
          </button>
        </view>
      </scroll-view>
    </view>

    <view v-else class="feed-list">
      <view v-if="store.loading" v-for="n in 2" :key="n" class="post-card skeleton-card"><view class="skeleton cover"/><view class="skeleton line wide"/><view class="skeleton line"/></view>
      <template v-else>
        <view class="feed-column">
          <article v-for="post in leftPosts" :key="post.id" class="post-card" @click="openPost(post)">
            <view class="cover-wrap"><image class="post-cover" :src="post.cover" mode="aspectFill" /><view v-if="post.live" class="live-badge">现场</view><view v-if="(post.mediaCount ?? 1)>1" class="image-count">{{ post.mediaCount }}图</view></view>
            <view class="post-body"><text class="post-title">{{ post.title }}</text><view class="post-footer"><button class="author" @click.stop="openAuthor(post.author)"><image :src="post.avatar"/><text>{{ post.author }}</text></button><button class="like-button" :class="{active:post.liked}" @click.stop="toggleLike(post)"><AppIcon :type="post.liked?'heart-filled':'heart'" size="16" :color="post.liked?'#e85d6a':'#71817d'"/><text>{{ post.likes }}</text></button></view></view>
          </article>
        </view>
        <view class="feed-column">
          <article v-for="post in rightPosts" :key="post.id" class="post-card" @click="openPost(post)">
            <view class="cover-wrap"><image class="post-cover" :src="post.cover" mode="aspectFill" /><view v-if="post.live" class="live-badge">现场</view><view v-if="(post.mediaCount ?? 1)>1" class="image-count">{{ post.mediaCount }}图</view></view>
            <view class="post-body"><text class="post-title">{{ post.title }}</text><view class="post-footer"><button class="author" @click.stop="openAuthor(post.author)"><image :src="post.avatar"/><text>{{ post.author }}</text></button><button class="like-button" :class="{active:post.liked}" @click.stop="toggleLike(post)"><AppIcon :type="post.liked?'heart-filled':'heart'" size="16" :color="post.liked?'#e85d6a':'#71817d'"/><text>{{ post.likes }}</text></button></view></view>
          </article>
        </view>
      </template>
      <view v-if="!store.loading && !filteredPosts.length" class="empty"><AppIcon type="search" size="30" color="#8ba29c"/><text>没有找到相符的灵感</text><button @click="keyword='';store.selectedCategory='全部'">看看全部</button></view>
    </view>
    <view class="bottom-space" />
  </scroll-view>

  <view v-if="showFilter" class="sheet-layer" @click="showFilter=false">
    <view class="filter-sheet" @click.stop>
      <view class="sheet-handle"/><view class="sheet-head"><text>筛选附近灵感</text><button @click="showFilter=false"><AppIcon type="closeempty" size="22" color="#42645b"/></button></view>
      <view class="filter-group"><text class="filter-label">排序方式</text><view class="filter-options"><button v-for="sort in ['推荐','距离最近','最新发布']" :key="sort" :class="{active:selectedSort===sort}" @click="selectedSort=sort as typeof selectedSort">{{ sort }}</button></view></view>
      <view class="filter-group"><view class="distance-line"><text class="filter-label">距离范围</text><text>{{ maxDistance }} km 内</text></view><slider :value="maxDistance" min="1" max="30" activeColor="#278c74" backgroundColor="#dfeae6" block-color="#278c74" block-size="20" @change="maxDistance=Number($event.detail.value)"/></view>
      <view class="filter-group"><text class="filter-label">内容属性</text><view class="filter-options"><button v-for="attribute in ['真实到访','现场发布','图文丰富']" :key="attribute" :class="{active:selectedAttributes.includes(attribute)}" @click="toggleAttribute(attribute)">{{ attribute }}</button></view></view>
      <button class="apply-filter" @click="showFilter=false">查看 {{ filteredPosts.length }} 条结果</button>
    </view>
  </view>

  <view v-if="selectedPlace" class="detail-layer">
    <scroll-view scroll-y class="detail-page">
      <view class="detail-hero"><image :src="selectedPost?.cover || selectedPlace.image" mode="aspectFill"/><view class="detail-gradient"/><button class="round-back" @click="closeDetail"><AppIcon type="back" size="23" color="#24463d"/></button><button class="round-share" @click="sharePost"><AppIcon type="redo" size="22" color="#24463d"/></button><view class="detail-place-label"><AppIcon type="location-filled" size="16" color="#fff"/><text>{{ selectedPlace.name }}</text></view></view>
      <view v-if="!selectedPost" class="place-detail-body">
        <view class="place-title-row"><view><text class="detail-kicker">{{ selectedPlace.category }} · {{ selectedPlace.distance }}</text><text class="detail-title">{{ selectedPlace.name }}</text><text class="detail-sub">{{ selectedPlace.subtitle }}</text></view><view class="score-orb"><text>{{ selectedPlace.score }}</text><text>体验分</text></view></view>
        <view class="detail-tags"><text v-for="tag in selectedPlace.tags" :key="tag">{{ tag }}</text></view>
        <view class="place-actions"><button @click="navigateToPlace"><AppIcon type="paperplane-filled" size="21" color="#267f6b"/><text>导航</text></button><button @click="checkIn"><AppIcon type="location-filled" size="21" color="#267f6b"/><text>现场打卡</text></button><button :class="{active:isWanted}" @click="toggleWanted"><AppIcon :type="isWanted?'heart-filled':'heart'" size="21" :color="isWanted?'#fff':'#267f6b'"/><text>{{ isWanted?'已想去':'想去' }}</text></button></view>
        <view class="info-card"><view><AppIcon type="map-pin-ellipse" size="20" color="#4b8e7c"/><text>红谷滩区赣江中大道附近</text></view><view><AppIcon type="calendar" size="20" color="#4b8e7c"/><text>建议 17:30—19:20 到达</text></view></view>
        <view class="detail-section-head"><text>这里的真实体验</text><text>{{ placePosts.length }} 篇 ›</text></view>
        <button v-for="post in placePosts" :key="post.id" class="detail-post" @click="openPost(post)"><image :src="post.cover" mode="aspectFill"/><view><text>{{ post.title }}</text><text>{{ post.author }} · 有用 {{ post.useful }}</text></view></button>
      </view>
      <view v-else class="post-detail-body">
        <view class="post-author-large"><image :src="selectedPost.avatar" @click="openAuthor(selectedPost.author)"/><view @click="openAuthor(selectedPost.author)"><text>{{ selectedPost.author }}</text><text>{{ selectedPost.checkedIn?'已到访认证 · 2小时前':'XY 探索者' }}</text></view><button :class="{followed:followingAuthors.includes(selectedPost.author)}" @click="toggleFollow(selectedPost.author)">{{ followingAuthors.includes(selectedPost.author)?'已关注':'关注' }}</button></view>
        <text class="detail-title">{{ selectedPost.title }}</text><text class="post-copy">{{ selectedPost.excerpt }}\n\n沿江的风会比市区大一些，建议带件薄外套。从地铁站出来步行十分钟左右，沿途也有不少适合停下来的位置。这里不需要门票，尽量把垃圾随手带走。</text>
        <view class="detail-tags"><text v-for="tag in selectedPlace.tags" :key="tag"># {{ tag }}</text></view>
        <button class="linked-place" @click="selectedPostId=null"><AppIcon type="location-filled" size="21" color="#278b74"/><view><text>{{ selectedPlace.name }}</text><text>{{ selectedPlace.subtitle }} · 查看地点</text></view><AppIcon type="right" size="17" color="#849a94"/></button>
        <view class="post-stats"><text>{{ selectedPost.likes }} 人喜欢</text><button :class="{active:selectedPost.usefulMarked}" @click="toggleUseful(selectedPost)">{{ selectedPost.usefulMarked?'已标记有用':`${selectedPost.useful} 人觉得有用` }}</button><text>{{ allComments.length + 2 }} 条评论</text></view>
        <view class="post-actionbar"><button :class="{active:selectedPost.liked}" @click="toggleLike(selectedPost)"><AppIcon :type="selectedPost.liked?'heart-filled':'heart'" size="21" :color="selectedPost.liked?'#e85d6a':'#327d6b'"/>{{ selectedPost.liked?'已赞':'点赞' }}</button><button @click="showComments=true"><AppIcon type="chat" size="21" color="#327d6b"/>评论</button><button :class="{active:selectedPost.collected}" @click="toggleCollect(selectedPost)"><AppIcon :type="selectedPost.collected?'star-filled':'star'" size="21" :color="selectedPost.collected?'#e3a342':'#327d6b'"/>{{ selectedPost.collected?'已收藏':'收藏' }}</button></view>
      </view>
      <view class="bottom-space"/>
    </scroll-view>
  </view>

  <view v-if="showComments && selectedPost" class="sheet-layer" @click="showComments=false">
    <view class="comment-sheet" @click.stop><view class="sheet-handle"/><view class="sheet-head"><text>{{ allComments.length + 2 }} 条真实评论</text><button @click="showComments=false"><AppIcon type="closeempty" size="22" color="#42645b"/></button></view>
      <view class="comment"><view class="comment-avatar">林</view><view><text>林同学</text><text>傍晚六点左右的光线最好，江边风也很舒服。</text><text>2小时前 · 回复　<text class="reply">展开2条回复</text></text></view><AppIcon type="heart" size="17" color="#81958f"/></view>
      <view class="comment"><view class="comment-avatar blue">周</view><view><text>周末散步</text><text>请问地铁出来要走多久？</text><text>5小时前 · 回复</text></view><AppIcon type="heart" size="17" color="#81958f"/></view>
      <view v-for="comment in allComments" :key="comment.id" class="comment"><view class="comment-avatar">{{ comment.author.slice(0,1) }}</view><view><text>{{ comment.author }}</text><text>{{ comment.content }}</text><text>{{ comment.time }} · 回复</text></view><button class="comment-like" @click="comment.liked=!comment.liked"><AppIcon :type="comment.liked?'heart-filled':'heart'" size="17" :color="comment.liked?'#e85d6a':'#81958f'"/></button></view>
      <view class="comment-input"><input v-model="commentDraft" confirm-type="send" placeholder="说点真实感受…" @confirm="submitComment"/><button @click="submitComment"><AppIcon type="paperplane-filled" size="18" color="#fff"/></button></view>
    </view>
  </view>
  <CommunitySearch v-if="showCommunitySearch" :posts="store.posts" :places="store.places" @close="showCommunitySearch=false" @post="openPostFromSearch" @place="openPlaceFromSearch" @author="author=>{showCommunitySearch=false;openAuthor(author)}"/>
  <AuthorProfile v-if="selectedAuthor" :author="selectedAuthor" :posts="store.posts" :followed="followingAuthors.includes(selectedAuthor)" @close="selectedAuthor=null" @follow="toggleFollow" @post="openPostFromAuthor"/>
</template>

<style scoped lang="scss">
.explore-page{height:100vh;background:#f6faf8}.hero{position:relative;overflow:hidden;padding:calc(30rpx + env(safe-area-inset-top)) 30rpx 42rpx;border-radius:0 0 56rpx 56rpx;background:linear-gradient(145deg,#eefbf4 0%,#f8fcfa 48%,#e9f5f6 100%)}.hero-glow{position:absolute;border-radius:50%;filter:blur(2rpx)}.glow-one{width:280rpx;height:280rpx;right:-80rpx;top:-100rpx;background:rgba(119,211,181,.18)}.glow-two{width:180rpx;height:180rpx;left:-70rpx;bottom:-70rpx;background:rgba(91,190,211,.12)}.topline{position:relative;display:flex;align-items:center;justify-content:space-between}.city-button,.weather{display:flex;align-items:center;gap:8rpx}.city-button{margin:0;padding:0;background:transparent;color:#244a40;font-size:29rpx;font-weight:650}.weather{padding:9rpx 16rpx;border:1rpx solid rgba(51,115,98,.08);border-radius:999rpx;background:rgba(255,255,255,.7);color:#5b7770;font-size:22rpx}.headline{position:relative;display:flex;flex-direction:column;margin:50rpx 2rpx 30rpx}.eyebrow{color:#55a792;font-size:18rpx;font-weight:700;letter-spacing:5rpx}.title{margin-top:10rpx;color:#183d34;font-size:48rpx;font-weight:800;letter-spacing:-1rpx}.accent{position:relative;color:#238b74}.subtitle{margin-top:10rpx;color:#758b85;font-size:24rpx}.search-box{position:relative;display:flex;align-items:center;gap:14rpx;height:92rpx;padding:10rpx 12rpx 10rpx 24rpx;border:1rpx solid rgba(42,93,80,.08);border-radius:28rpx;background:#fff;box-shadow:0 14rpx 40rpx rgba(70,122,108,.11)}.search-box input{flex:1;font-size:26rpx}.search-placeholder{color:#9aacA7}.filter-button{display:grid;place-items:center;width:70rpx;height:70rpx;margin:0;padding:0;border-radius:23rpx;background:linear-gradient(145deg,#3ca68c,#20806d);box-shadow:0 9rpx 22rpx rgba(31,130,108,.25)}.category-scroll{width:100%;white-space:nowrap}.category-row{display:inline-flex;gap:17rpx;padding:28rpx 30rpx 14rpx}.category{display:flex;align-items:center;gap:10rpx;height:66rpx;margin:0;padding:6rpx 20rpx 6rpx 7rpx;border:1rpx solid #e7efec;border-radius:999rpx;background:#fff;color:#607a73;font-size:23rpx}.category-icon{display:grid;place-items:center;width:49rpx;height:49rpx;border-radius:50%;background:#eaf6f1}.category.active{border-color:#258a73;background:#258a73;color:#fff;box-shadow:0 10rpx 24rpx rgba(37,138,115,.22)}.category.active .category-icon{background:rgba(255,255,255,.16)}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;padding:28rpx 30rpx 22rpx}.section-heading>view:first-child{display:flex;flex-direction:column}.section-title{font-size:34rpx;font-weight:750}.section-subtitle{margin-top:5rpx;color:#8a9c97;font-size:21rpx}.mode-switch{display:flex;gap:5rpx;padding:5rpx;border-radius:18rpx;background:#eaf0ee}.mode-switch button{display:grid;place-items:center;width:54rpx;height:48rpx;margin:0;padding:0;border-radius:14rpx;background:transparent}.mode-switch button.active{background:#2c8f78;box-shadow:0 5rpx 12rpx rgba(44,143,120,.18)}.feed-list{display:flex;flex-direction:column;gap:24rpx;padding:0 25rpx}.post-card{overflow:hidden;border:1rpx solid rgba(42,86,75,.07);border-radius:34rpx;background:#fff;box-shadow:0 14rpx 40rpx rgba(55,93,83,.09)}.cover-wrap{position:relative;height:370rpx}.post-cover{width:100%;height:100%}.cover-wrap:after{content:'';position:absolute;right:0;bottom:0;left:0;height:42%;background:linear-gradient(transparent,rgba(13,39,33,.58))}.live-badge,.place-chip{position:absolute;z-index:2;display:flex;align-items:center}.live-badge{top:20rpx;left:20rpx;gap:8rpx;padding:8rpx 14rpx;border-radius:999rpx;background:rgba(255,255,255,.9);color:#2d6e5e;font-size:19rpx;font-weight:600}.pulse{width:12rpx;height:12rpx;border-radius:50%;background:#54bd91;box-shadow:0 0 0 6rpx rgba(84,189,145,.16)}.collect{position:absolute;z-index:2;top:18rpx;right:18rpx;display:grid;place-items:center;width:64rpx;height:64rpx;margin:0;padding:0;border-radius:50%;background:rgba(255,255,255,.88);backdrop-filter:blur(10px)}.place-chip{right:22rpx;bottom:18rpx;left:22rpx;gap:7rpx;color:#fff;font-size:21rpx}.place-chip text:first-of-type{font-weight:650}.post-body{display:flex;flex-direction:column;padding:24rpx}.post-title{color:#1c3e36;font-size:31rpx;font-weight:750;line-height:1.4}.post-excerpt{display:-webkit-box;margin-top:10rpx;overflow:hidden;color:#70827d;font-size:23rpx;line-height:1.65;-webkit-box-orient:vertical;-webkit-line-clamp:2}.tag-row{display:flex;gap:16rpx;margin-top:14rpx;color:#328b75;font-size:20rpx}.post-footer{display:flex;align-items:center;justify-content:space-between;margin-top:23rpx;padding-top:20rpx;border-top:1rpx solid #edf2f0}.author{display:flex;align-items:center;gap:12rpx}.author image{width:56rpx;height:56rpx;border:3rpx solid #e4f3ed;border-radius:50%}.author view{display:flex;flex-direction:column}.author text:first-child{font-size:22rpx;font-weight:650}.author text:last-child{margin-top:3rpx;color:#94a39f;font-size:18rpx}.metrics{display:flex;gap:8rpx}.metrics button{display:flex;align-items:center;gap:6rpx;margin:0;padding:10rpx 11rpx;background:transparent;color:#70857f;font-size:20rpx}.map-card{position:relative;overflow:hidden;height:780rpx;margin:0 25rpx;border-radius:34rpx;box-shadow:0 14rpx 40rpx rgba(55,93,83,.13)}.map{width:100%;height:100%}.map-note{position:absolute;right:24rpx;bottom:24rpx;left:24rpx;display:flex;align-items:center;justify-content:center;gap:14rpx;padding:22rpx;border-radius:22rpx;background:rgba(255,255,255,.94);color:#386d60;font-size:23rpx;box-shadow:0 10rpx 30rpx rgba(37,72,64,.16)}.skeleton-card{padding-bottom:25rpx}.skeleton{margin:20rpx;border-radius:18rpx;background:linear-gradient(90deg,#edf3f0,#f8faf9,#edf3f0);background-size:200% 100%;animation:shimmer 1.2s infinite}.skeleton.cover{height:330rpx;margin:0}.skeleton.line{height:24rpx;width:55%}.skeleton.line.wide{width:85%;height:32rpx}@keyframes shimmer{to{background-position:-200% 0}}.empty{display:flex;flex-direction:column;align-items:center;gap:13rpx;padding:90rpx 20rpx;color:#849892;font-size:24rpx}.empty button{margin-top:6rpx;padding:12rpx 27rpx;border-radius:999rpx;background:#e4f4ee;color:#2d856e;font-size:22rpx}.bottom-space{height:170rpx}

.discovery-strip{padding-top:24rpx}.strip-title{display:flex;align-items:flex-end;justify-content:space-between;padding:0 30rpx 17rpx}.strip-title text:first-child{font-size:31rpx;font-weight:750}.strip-title text:last-child{color:#8b9d98;font-size:19rpx}.place-scroll{white-space:nowrap}.place-row{display:inline-flex;gap:18rpx;padding:0 30rpx 18rpx}.place-mini{position:relative;overflow:hidden;width:310rpx;height:220rpx;margin:0;padding:0;border-radius:29rpx;background:#dbe9e4;text-align:left;box-shadow:0 12rpx 28rpx rgba(47,90,79,.11)}.place-mini image{width:100%;height:100%}.place-mini-shade{position:absolute;inset:0;background:linear-gradient(120deg,rgba(12,41,34,.05),rgba(12,41,34,.64))}.place-rank{position:absolute;top:16rpx;left:16rpx;padding:7rpx 11rpx;border-radius:13rpx;background:rgba(255,255,255,.88);color:#236f5e;font-size:18rpx;font-weight:750}.place-mini-copy{position:absolute;right:18rpx;bottom:17rpx;left:18rpx;display:flex;flex-direction:column;color:#fff}.place-mini-copy text:first-child{font-size:25rpx;font-weight:700}.place-mini-copy text:last-child{margin-top:5rpx;font-size:18rpx;opacity:.86}.quick-grid{display:grid;grid-template-columns:1fr 1fr;gap:16rpx;padding:18rpx 25rpx 5rpx}.quick-grid>button{display:grid;grid-template-columns:58rpx 1fr 25rpx;align-items:center;gap:10rpx;margin:0;padding:17rpx;border:1rpx solid #e8efed;border-radius:25rpx;background:#fff;text-align:left}.quick-grid>button>view:nth-child(2){display:flex;flex-direction:column;min-width:0}.quick-grid>button>view:nth-child(2) text:first-child{font-size:23rpx;font-weight:680}.quick-grid>button>view:nth-child(2) text:last-child{margin-top:2rpx;overflow:hidden;color:#91a19d;font-size:17rpx;text-overflow:ellipsis;white-space:nowrap}.quick-icon{display:grid;place-items:center;width:54rpx;height:54rpx;border-radius:18rpx}.quick-icon.mint{background:#e6f6ef}.quick-icon.amber{background:#fff2df}
.sheet-layer{position:fixed;z-index:120;inset:0;display:flex;align-items:flex-end;background:rgba(20,48,41,.35);backdrop-filter:blur(4px)}.filter-sheet,.comment-sheet{width:100%;padding:12rpx 28rpx calc(30rpx + env(safe-area-inset-bottom));border-radius:38rpx 38rpx 0 0;background:#fbfdfc;box-shadow:0 -18rpx 60rpx rgba(26,62,53,.2)}.sheet-handle{width:72rpx;height:8rpx;margin:2rpx auto 15rpx;border-radius:999rpx;background:#d9e4e0}.sheet-head{display:flex;align-items:center;justify-content:space-between;padding:7rpx 0 22rpx;font-size:30rpx;font-weight:740}.sheet-head button{display:grid;place-items:center;width:52rpx;height:52rpx;margin:0;padding:0;border-radius:50%;background:#edf4f1}.filter-group{padding:22rpx 0;border-top:1rpx solid #eaf0ee}.filter-label{font-size:24rpx;font-weight:650}.filter-options{display:flex;flex-wrap:wrap;gap:13rpx;margin-top:15rpx}.filter-options button{margin:0;padding:13rpx 22rpx;border:1rpx solid #e0eae6;border-radius:999rpx;background:#fff;color:#6c817b;font-size:21rpx}.filter-options button.active{border-color:#278c74;background:#e4f5ee;color:#247964}.distance-line{display:flex;justify-content:space-between}.distance-line text:last-child{color:#278c74;font-size:21rpx}.apply-filter{margin:23rpx 0 0;padding:23rpx;border-radius:24rpx;background:linear-gradient(135deg,#36a087,#207d69);color:#fff;font-size:26rpx;font-weight:680;box-shadow:0 11rpx 25rpx rgba(32,125,105,.2)}
.detail-layer{position:fixed;z-index:100;inset:0;background:#f7faf9}.detail-page{height:100vh}.detail-hero{position:relative;height:530rpx}.detail-hero>image{width:100%;height:100%}.detail-gradient{position:absolute;inset:0;background:linear-gradient(rgba(14,38,33,.18),transparent 45%,rgba(11,34,29,.62))}.round-back,.round-share{position:absolute;top:calc(24rpx + env(safe-area-inset-top));display:grid;place-items:center;width:68rpx;height:68rpx;margin:0;padding:0;border-radius:50%;background:rgba(255,255,255,.9);box-shadow:0 8rpx 25rpx rgba(19,45,38,.15)}.round-back{left:25rpx}.round-share{right:25rpx}.detail-place-label{position:absolute;right:28rpx;bottom:27rpx;left:28rpx;display:flex;align-items:center;gap:8rpx;color:#fff;font-size:23rpx}.place-detail-body,.post-detail-body{position:relative;margin-top:-4rpx;padding:31rpx 28rpx 10rpx;border-radius:36rpx 36rpx 0 0;background:#f7faf9}.place-title-row{display:flex;justify-content:space-between;gap:25rpx}.place-title-row>view:first-child{display:flex;flex-direction:column;min-width:0}.detail-kicker{color:#278a73;font-size:20rpx;font-weight:650}.detail-title{margin-top:6rpx;color:#193e35;font-size:38rpx;font-weight:780;line-height:1.35}.detail-sub{margin-top:7rpx;color:#758983;font-size:22rpx}.score-orb{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;width:94rpx;height:94rpx;border-radius:30rpx;background:#e3f4ed;color:#237d68}.score-orb text:first-child{font-size:31rpx;font-weight:800}.score-orb text:last-child{font-size:16rpx}.detail-tags{display:flex;flex-wrap:wrap;gap:12rpx;margin-top:20rpx}.detail-tags text{padding:8rpx 15rpx;border-radius:999rpx;background:#e6f4ef;color:#377b6b;font-size:19rpx}.place-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:12rpx;margin-top:27rpx}.place-actions button{display:flex;align-items:center;justify-content:center;gap:8rpx;margin:0;padding:20rpx 5rpx;border:1rpx solid #dfebe7;border-radius:22rpx;background:#fff;color:#3b685d;font-size:21rpx}.info-card{display:flex;flex-direction:column;gap:20rpx;margin-top:22rpx;padding:24rpx;border-radius:25rpx;background:#fff}.info-card>view{display:flex;align-items:center;gap:14rpx;color:#607871;font-size:21rpx}.detail-section-head{display:flex;justify-content:space-between;margin:31rpx 0 17rpx}.detail-section-head text:first-child{font-size:27rpx;font-weight:720}.detail-section-head text:last-child{color:#4e8a79;font-size:20rpx}.detail-post{display:flex;align-items:center;gap:18rpx;width:100%;margin:0 0 15rpx;padding:12rpx;border-radius:22rpx;background:#fff;text-align:left}.detail-post image{width:145rpx;height:112rpx;border-radius:17rpx}.detail-post view{display:flex;flex-direction:column;gap:9rpx}.detail-post view text:first-child{font-size:22rpx;font-weight:650;line-height:1.35}.detail-post view text:last-child{color:#8a9a96;font-size:18rpx}.post-author-large{display:grid;grid-template-columns:65rpx 1fr auto;align-items:center;gap:13rpx;margin-bottom:22rpx}.post-author-large image{width:62rpx;height:62rpx;border-radius:50%}.post-author-large view{display:flex;flex-direction:column}.post-author-large view text:first-child{font-size:22rpx;font-weight:680}.post-author-large view text:last-child{margin-top:3rpx;color:#8b9c97;font-size:17rpx}.post-author-large button{margin:0;padding:10rpx 21rpx;border-radius:999rpx;background:#e4f4ee;color:#287d69;font-size:20rpx}.post-copy{display:block;margin-top:20rpx;color:#526b64;font-size:24rpx;line-height:1.9;white-space:pre-line}.linked-place{display:grid;grid-template-columns:46rpx 1fr 30rpx;align-items:center;width:100%;margin:26rpx 0 0;padding:19rpx;border-radius:23rpx;background:#fff;text-align:left}.linked-place view{display:flex;flex-direction:column}.linked-place view text:first-child{font-size:22rpx;font-weight:670}.linked-place view text:last-child{margin-top:3rpx;color:#899b96;font-size:18rpx}.post-stats{display:flex;gap:20rpx;margin-top:27rpx;color:#80938d;font-size:19rpx}.post-actionbar{display:grid;grid-template-columns:repeat(3,1fr);margin-top:20rpx;padding:12rpx;border-radius:25rpx;background:#fff}.post-actionbar button{display:flex;align-items:center;justify-content:center;gap:8rpx;margin:0;padding:14rpx 3rpx;background:transparent;color:#527168;font-size:21rpx}.comment-sheet{max-height:76vh}.comment{display:grid;grid-template-columns:58rpx 1fr 30rpx;gap:14rpx;padding:20rpx 0;border-top:1rpx solid #e9efed}.comment-avatar{display:grid;place-items:center;width:55rpx;height:55rpx;border-radius:50%;background:#dff3eb;color:#287d69;font-size:21rpx;font-weight:700}.comment-avatar.blue{background:#e2eff4;color:#34758b}.comment>view:nth-child(2){display:flex;flex-direction:column;gap:6rpx}.comment>view:nth-child(2)>text:first-child{color:#668078;font-size:19rpx;font-weight:650}.comment>view:nth-child(2)>text:nth-child(2){font-size:22rpx;line-height:1.55}.comment>view:nth-child(2)>text:last-child{color:#93a39f;font-size:17rpx}.reply{color:#29816d}.comment-input{display:flex;align-items:center;justify-content:space-between;margin-top:15rpx;padding:10rpx 10rpx 10rpx 22rpx;border-radius:999rpx;background:#edf3f1;color:#92a29e;font-size:21rpx}.comment-input button{display:grid;place-items:center;width:58rpx;height:58rpx;margin:0;padding:0;border-radius:50%;background:#298b74}
@media (min-width: 760px) {
  .sheet-layer,.detail-layer { right: auto; left: 50%; width: 520px; transform: translateX(-50%); }
}

/* Motion language: soft, quick and purposeful. */
.hero { animation: hero-in .62s cubic-bezier(.2,.8,.2,1) both; }
.glow-one { animation: glow-drift 7s ease-in-out infinite alternate; }
.glow-two { animation: glow-drift 9s ease-in-out -2s infinite alternate-reverse; }
.headline > text { animation: copy-rise .5s cubic-bezier(.2,.8,.2,1) both; }
.headline > text:nth-child(2) { animation-delay:.08s; }
.headline > text:nth-child(3) { animation-delay:.15s; }
.search-box { animation: copy-rise .52s .2s cubic-bezier(.2,.8,.2,1) both; transition:box-shadow .25s ease, transform .2s ease; }
.search-box:focus-within { transform:translateY(-3rpx); box-shadow:0 20rpx 48rpx rgba(47,130,108,.17); }
.category { animation: chip-in .42s cubic-bezier(.22,1.3,.45,1) both; transition:transform .18s ease, box-shadow .2s ease, background-color .2s ease; }
.category:nth-child(2){animation-delay:.04s}.category:nth-child(3){animation-delay:.08s}.category:nth-child(4){animation-delay:.12s}.category:nth-child(5){animation-delay:.16s}.category:nth-child(6){animation-delay:.2s}
.category:active,.quick-grid>button:active,.place-mini:active { transform:scale(.95); }
.place-mini { animation:card-rise .5s cubic-bezier(.2,.8,.2,1) both; transition:transform .22s ease, box-shadow .22s ease; }
.place-mini:nth-child(2){animation-delay:.07s}.place-mini:nth-child(3){animation-delay:.14s}
.quick-grid>button { animation:card-rise .48s cubic-bezier(.2,.8,.2,1) both; transition:transform .18s ease, box-shadow .2s ease; }
.quick-grid>button:nth-child(2){animation-delay:.08s}
.post-card { animation:card-rise .55s cubic-bezier(.2,.8,.2,1) both; transition:transform .22s ease, box-shadow .22s ease; }
.post-card:nth-child(2){animation-delay:.08s}.post-card:nth-child(3){animation-delay:.16s}
.post-card:active { transform:scale(.985); box-shadow:0 8rpx 24rpx rgba(55,93,83,.08); }
.post-cover { transition:transform .65s cubic-bezier(.2,.8,.2,1); }
.post-card:active .post-cover { transform:scale(1.025); }
.pulse { animation:live-pulse 1.8s ease-out infinite; }
.filter-button,.collect,.mode-switch button,.metrics button,.place-actions button,.post-actionbar button { transition:transform .16s ease, filter .16s ease; }
.filter-button:active,.collect:active,.mode-switch button:active,.metrics button:active,.place-actions button:active,.post-actionbar button:active { transform:scale(.86); filter:brightness(.96); }
.sheet-layer { animation:fade-in .22s ease both; }
.filter-sheet,.comment-sheet { animation:sheet-up .42s cubic-bezier(.2,1.15,.35,1) both; }
.detail-layer { animation:fade-in .24s ease both; }
.detail-page { animation:detail-up .42s cubic-bezier(.2,.85,.25,1) both; }
.score-orb { animation:score-pop .5s .14s cubic-bezier(.22,1.5,.45,1) both; }
.skeleton { animation:shimmer 1.2s linear infinite; }

@keyframes hero-in { from{opacity:0;transform:translateY(-18rpx)} to{opacity:1;transform:none} }
@keyframes copy-rise { from{opacity:0;transform:translateY(18rpx)} to{opacity:1;transform:none} }
@keyframes chip-in { from{opacity:0;transform:translateX(18rpx) scale(.92)} to{opacity:1;transform:none} }
@keyframes card-rise { from{opacity:0;transform:translateY(28rpx) scale(.975)} to{opacity:1;transform:none} }
@keyframes glow-drift { from{transform:translate3d(-8rpx,-4rpx,0) scale(.96)} to{transform:translate3d(18rpx,14rpx,0) scale(1.08)} }
@keyframes live-pulse { 0%{box-shadow:0 0 0 0 rgba(84,189,145,.4)} 70%{box-shadow:0 0 0 12rpx rgba(84,189,145,0)} 100%{box-shadow:0 0 0 0 rgba(84,189,145,0)} }
@keyframes fade-in { from{opacity:0} to{opacity:1} }
@keyframes sheet-up { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:none} }
@keyframes detail-up { from{opacity:.4;transform:translateY(35rpx) scale(.985)} to{opacity:1;transform:none} }
@keyframes score-pop { from{opacity:0;transform:scale(.65) rotate(-8deg)} to{opacity:1;transform:scale(1)} }

@media (hover:hover) {
  .place-mini:hover,.quick-grid>button:hover,.post-card:hover { transform:translateY(-5rpx); box-shadow:0 22rpx 48rpx rgba(48,98,84,.15); }
  .post-card:hover .post-cover { transform:scale(1.035); }
}
@media (prefers-reduced-motion: reduce) {
  .hero,.glow-one,.glow-two,.headline>text,.search-box,.category,.place-mini,.quick-grid>button,.post-card,.pulse,.sheet-layer,.filter-sheet,.comment-sheet,.detail-layer,.detail-page,.score-orb { animation:none!important; transition:none!important; }
}

/* Theme tokens inherited from the application shell. */
.explore-page { background:var(--xy-page); transition:background-color .35s ease; }
.hero { background:linear-gradient(145deg,color-mix(in srgb,var(--xy-soft) 78%,white),var(--xy-page) 52%,color-mix(in srgb,var(--xy-soft) 55%,#e9f5f6)); }
.title,.section-title,.strip-title text:first-child,.post-title,.detail-title { color:var(--xy-ink); }
.accent,.eyebrow,.tag-row,.detail-kicker,.detail-section-head text:last-child { color:var(--xy-primary); }
.filter-button,.category.active,.mode-switch button.active,.apply-filter,.comment-input button { background:linear-gradient(145deg,color-mix(in srgb,var(--xy-primary) 84%,white),var(--xy-primary-deep)); }
.category.active { border-color:var(--xy-primary); box-shadow:0 10rpx 24rpx color-mix(in srgb,var(--xy-primary) 22%,transparent); }
.category-icon,.quick-icon.mint,.detail-tags text,.post-author-large button,.empty button { background:var(--xy-soft); color:var(--xy-primary); }
.filter-options button.active { border-color:var(--xy-primary); background:var(--xy-soft); color:var(--xy-primary-deep); }
.score-orb { background:var(--xy-soft); color:var(--xy-primary-deep); }
:global(.theme-river) .glow-one,:global(.theme-river) .glow-two { background:rgba(91,170,208,.16); }
:global(.theme-sunset) .glow-one { background:rgba(221,150,104,.18); }
:global(.theme-sunset) .glow-two { background:rgba(237,190,125,.13); }

/* Explore has two first-class subpages: Map and Discover. */
.explore-switch{position:relative;z-index:4;display:grid;grid-template-columns:1fr 1fr;gap:7rpx;width:310rpx;margin:-22rpx auto 18rpx;padding:7rpx;border:1rpx solid rgba(46,91,79,.08);border-radius:999rpx;background:rgba(255,255,255,.96);box-shadow:0 12rpx 32rpx rgba(45,88,77,.13);animation:copy-rise .48s .16s cubic-bezier(.2,.8,.2,1) both}.explore-switch button{display:flex;align-items:center;justify-content:center;gap:8rpx;margin:0;padding:14rpx 18rpx;border-radius:999rpx;background:transparent;color:#748b84;font-size:23rpx;transition:transform .18s ease,background .25s ease,color .25s ease}.explore-switch button.active{background:var(--xy-primary);color:#fff;box-shadow:0 7rpx 18rpx color-mix(in srgb,var(--xy-primary) 25%,transparent)}.explore-switch button:active{transform:scale(.93)}
.feed-sort{display:flex;align-items:center;gap:7rpx;margin:0;padding:10rpx 16rpx;border-radius:999rpx;background:#eaf1ee;color:#607870;font-size:20rpx}
.map-card{height:calc(100vh - 390rpx);min-height:720rpx;margin:0 20rpx 160rpx;border-radius:34rpx;animation:map-in .55s cubic-bezier(.2,.8,.2,1) both}.map-tools{position:absolute;z-index:5;top:22rpx;right:20rpx;display:flex;flex-direction:column;gap:12rpx}.map-tools button{display:grid;place-items:center;width:68rpx;height:68rpx;margin:0;padding:0;border:1rpx solid rgba(38,87,74,.08);border-radius:22rpx;background:rgba(255,255,255,.94);box-shadow:0 8rpx 22rpx rgba(31,69,59,.14);transition:transform .18s ease}.map-tools button:active{transform:scale(.87)}.map-status{position:absolute;z-index:4;top:22rpx;left:20rpx;display:flex;align-items:center;gap:13rpx;padding:15rpx 19rpx;border-radius:999rpx;background:rgba(255,255,255,.94);color:#527068;font-size:20rpx;box-shadow:0 8rpx 22rpx rgba(31,69,59,.12)}.map-place-scroll{position:absolute;z-index:5;right:0;bottom:24rpx;left:0;white-space:nowrap}.map-place-row{display:inline-flex;gap:16rpx;padding:0 20rpx}.map-place-card{display:grid;grid-template-columns:126rpx 1fr;gap:15rpx;width:520rpx;margin:0;padding:12rpx;border:1rpx solid rgba(40,80,69,.08);border-radius:27rpx;background:rgba(255,255,255,.96);box-shadow:0 14rpx 36rpx rgba(27,66,56,.18);text-align:left;backdrop-filter:blur(12px);transition:transform .18s ease}.map-place-card:active{transform:scale(.97)}.map-place-card>image{width:126rpx;height:116rpx;border-radius:20rpx}.map-place-card>view{display:flex;flex-direction:column;min-width:0;padding:5rpx 5rpx 3rpx 0}.map-place-card>view>text:first-child{overflow:hidden;color:var(--xy-ink);font-size:25rpx;font-weight:720;text-overflow:ellipsis;white-space:nowrap}.map-place-card>view>text:nth-child(2){margin-top:5rpx;overflow:hidden;color:#80938d;font-size:19rpx;text-overflow:ellipsis;white-space:nowrap}.map-place-card>view>view{display:flex;justify-content:space-between;margin-top:auto}.map-place-card>view>view text:first-child{color:var(--xy-primary);font-size:19rpx;font-weight:650}.map-place-card>view>view text:last-child{color:#879a94;font-size:18rpx}
.feed-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:16rpx;padding:0 20rpx}.post-card{min-width:0;border-radius:25rpx}.post-card:nth-child(even){margin-top:34rpx}.cover-wrap{height:285rpx}.post-card:nth-child(3n+2) .cover-wrap{height:350rpx}.post-card:nth-child(3n) .cover-wrap{height:315rpx}.post-body{padding:18rpx}.post-title{display:-webkit-box;overflow:hidden;font-size:24rpx;line-height:1.45;-webkit-box-orient:vertical;-webkit-line-clamp:2}.post-excerpt{display:none}.tag-row{gap:8rpx;margin-top:9rpx;overflow:hidden;font-size:17rpx;white-space:nowrap}.tag-row text:nth-child(n+3){display:none}.post-footer{margin-top:14rpx;padding-top:13rpx}.author{min-width:0;gap:8rpx}.author image{width:42rpx;height:42rpx}.author view{min-width:0}.author text:first-child{overflow:hidden;font-size:18rpx;text-overflow:ellipsis;white-space:nowrap}.author text:last-child{display:none}.metrics{gap:0}.metrics button{gap:3rpx;padding:7rpx 4rpx;font-size:16rpx}.metrics button:first-child{display:none}.live-badge{top:13rpx;left:13rpx;padding:6rpx 10rpx;font-size:16rpx}.collect{top:12rpx;right:12rpx;width:50rpx;height:50rpx}.place-chip{right:13rpx;bottom:12rpx;left:13rpx;overflow:hidden;font-size:17rpx;white-space:nowrap}.place-chip text:nth-of-type(2){display:none}
.feed-topbar{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14rpx;padding:calc(24rpx + env(safe-area-inset-top)) 22rpx 15rpx;background:#fff}.feed-city{display:flex;align-items:center;gap:4rpx;color:#263e38;font-size:25rpx;font-weight:720}.feed-search{display:flex;align-items:center;gap:10rpx;height:68rpx;padding:0 18rpx;border-radius:999rpx;background:#f2f5f4}.feed-search input{min-width:0;flex:1;font-size:22rpx}.feed-create{display:grid;place-items:center;width:62rpx;height:62rpx;margin:0;padding:0;border-radius:50%;background:var(--xy-primary)}.feed-topbar + .explore-switch{margin:7rpx auto 11rpx}.feed-channels{width:100%;border-bottom:1rpx solid #edf0ef;background:#fff;white-space:nowrap}.feed-channel-row{display:inline-flex;gap:34rpx;padding:5rpx 24rpx 15rpx}.feed-channel-row button{position:relative;margin:0;padding:12rpx 0;background:transparent;color:#7a8985;font-size:23rpx}.feed-channel-row button.active{color:#203a34;font-weight:750}.feed-channel-row button.active:after{content:'';position:absolute;right:20%;bottom:0;left:20%;height:5rpx;border-radius:999rpx;background:var(--xy-primary)}.feed-list{padding-top:16rpx;background:#f6f7f7}.post-card{border:0;border-radius:18rpx;box-shadow:none}.cover-wrap:after{display:none}.image-count{position:absolute;right:12rpx;top:12rpx;padding:5rpx 9rpx;border-radius:999rpx;background:rgba(20,31,28,.55);color:#fff;font-size:15rpx}.post-footer{border:0}.author>text{overflow:hidden;color:#73827e;font-size:18rpx;text-overflow:ellipsis;white-space:nowrap}.like-button{display:flex;align-items:center;gap:4rpx;margin:0;padding:4rpx;background:transparent;color:#71817d;font-size:17rpx}.live-badge{border-radius:8rpx;background:rgba(255,255,255,.9);color:var(--xy-primary);font-weight:720}
/* Discover feed: compact, content-first and true two-column masonry. */
.feed-topbar{position:sticky;z-index:20;top:0;display:grid;grid-template-columns:72rpx 1fr 72rpx;height:calc(96rpx + env(safe-area-inset-top));padding:env(safe-area-inset-top) 18rpx 0;border-bottom:1rpx solid #f0f1f1;background:rgba(255,255,255,.96);backdrop-filter:blur(18px)}
.feed-map-entry,.feed-search-entry{display:grid;place-items:center;width:64rpx;height:64rpx;margin:auto;padding:0;border:0!important;border-radius:0;background:transparent;line-height:1}.feed-main-tabs{display:flex;align-items:center;justify-content:center;gap:42rpx}.feed-main-tabs button{position:relative;margin:0;padding:25rpx 0 22rpx;border:0!important;border-radius:0;background:transparent;color:#8a9491;font-size:26rpx;line-height:1.2}.feed-main-tabs button.active{color:#1d2d29;font-size:28rpx;font-weight:780}.feed-main-tabs button.active:after{content:'';position:absolute;right:28%;bottom:12rpx;left:28%;height:5rpx;border:0;border-radius:999rpx;background:var(--xy-primary)}
.feed-channels{width:100%;height:76rpx!important;border-bottom:1rpx solid #f1f2f2;background:#fff;white-space:nowrap}.feed-channel-row{display:inline-flex;align-items:center;gap:38rpx;height:76rpx;padding:0 24rpx}.feed-channel-row button{position:relative;flex:none;margin:0;padding:20rpx 0 17rpx;border:0!important;border-radius:0;background:transparent;color:#757f7c;font-size:22rpx;line-height:1.2}.feed-channel-row button.active{color:#1f302b;font-weight:720}.feed-channel-row button.active:after{content:'';position:absolute;right:25%;bottom:8rpx;left:25%;height:4rpx;border:0;border-radius:999rpx;background:var(--xy-primary)}
.feed-list{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start;gap:12rpx;padding:12rpx 12rpx 180rpx;background:#fff}.feed-column{display:flex;min-width:0;flex-direction:column;gap:24rpx}.feed-column:nth-child(2){padding-top:26rpx}.feed-column .post-card{margin:0;border:0;border-radius:14rpx;background:#fff;box-shadow:none;animation:card-rise .42s cubic-bezier(.2,.8,.2,1) both}.feed-column .cover-wrap{height:390rpx;overflow:hidden;border-radius:14rpx;background:#edf1f0}.feed-column .post-card:nth-child(3n+2) .cover-wrap{height:470rpx}.feed-column .post-card:nth-child(3n) .cover-wrap{height:330rpx}.feed-column:nth-child(2) .post-card:nth-child(3n+1) .cover-wrap{height:450rpx}.feed-column:nth-child(2) .post-card:nth-child(3n+2) .cover-wrap{height:345rpx}.feed-column .post-body{padding:14rpx 8rpx 0}.feed-column .post-title{color:#202b28;font-size:23rpx;font-weight:620;line-height:1.48;-webkit-line-clamp:2}.feed-column .post-footer{display:flex;align-items:center;justify-content:space-between;margin-top:13rpx;padding:0;border:0}.feed-column .author{display:flex;min-width:0;align-items:center;gap:8rpx}.feed-column .author image{width:38rpx;height:38rpx;border:0}.feed-column .author>text{max-width:150rpx;color:#788480;font-size:17rpx}.feed-column .like-button{flex:none}.feed-column .live-badge{top:12rpx;left:12rpx;padding:5rpx 9rpx;border-radius:7rpx;font-size:15rpx}.feed-column .image-count{top:12rpx;right:12rpx;padding:5rpx 9rpx;font-size:14rpx}
@keyframes map-in{from{opacity:0;transform:scale(.97) translateY(18rpx)}to{opacity:1;transform:none}}
.comment-input input{min-width:0;flex:1;font-size:21rpx}.comment-like{display:grid;place-items:center;width:30rpx;height:36rpx;margin:0;padding:0;border:0;background:transparent}.post-author-large button.followed{border:1rpx solid #dce7e3;background:#fff;color:#7a8e88}.like-button.active,.post-actionbar button.active{color:#e85d6a}.post-actionbar button{transition:transform .18s ease,color .18s ease}.post-actionbar button:active{transform:scale(.9)}
.post-footer .author{margin:0;padding:0;border:0;background:transparent;text-align:left;line-height:1.2}
@media (max-width:360px){.map-place-card{width:470rpx}.feed-list{gap:12rpx;padding:0 14rpx}}
@media (min-width:1024px){
  .explore-page{height:calc(100vh - 92px);background:#fff}.feed-topbar{display:none}.feed-channels{position:sticky;z-index:18;top:0;height:70px!important;border:0;background:rgba(255,255,255,.97);backdrop-filter:blur(16px)}.feed-channel-row{gap:34px;height:70px;padding:0 18px}.feed-channel-row button{padding:23px 2px;font-size:15px}.feed-channel-row button.active{padding:12px 20px;border-radius:999px;background:var(--xy-soft);color:var(--xy-primary-deep)}.feed-channel-row button.active:after{display:none}.feed-list{display:block;padding:12px 8px 120px;column-count:5;column-gap:18px}.feed-column{display:contents}.feed-column:nth-child(2){padding-top:0}.feed-column .post-card{display:inline-block;width:100%;margin:0 0 24px;break-inside:avoid;vertical-align:top}.feed-column .cover-wrap,.feed-column .post-card:nth-child(3n+2) .cover-wrap,.feed-column .post-card:nth-child(3n) .cover-wrap,.feed-column:nth-child(2) .post-card:nth-child(3n+1) .cover-wrap,.feed-column:nth-child(2) .post-card:nth-child(3n+2) .cover-wrap{height:auto;aspect-ratio:4/5}.feed-column .post-card:nth-child(3n+2) .cover-wrap{aspect-ratio:1/1}.feed-column .post-card:nth-child(3n) .cover-wrap{aspect-ratio:3/4}.feed-column .post-body{padding:11px 5px 0}.feed-column .post-title{font-size:15px}.feed-column .author image{width:24px;height:24px}.feed-column .author>text{max-width:90px;font-size:12px}.feed-column .like-button{font-size:12px}.map-card{height:calc(100vh - 220px);min-height:620px;margin:0 10px 30px}.hero{padding:22px 28px 30px;border-radius:0 0 32px 32px}.headline{margin:26px 2px 22px}.title{font-size:34px}.search-box{max-width:680px;height:64px}.explore-switch{margin:-18px auto 16px}.detail-layer{right:auto;left:50%;width:560px;transform:translateX(-50%)}
}
.place-actions button.active{border-color:var(--xy-primary);background:var(--xy-primary);color:#fff}.post-stats{align-items:center}.post-stats button{margin:0;padding:0;border:0;background:transparent;color:#80938d;font-size:19rpx}.post-stats button.active{color:var(--xy-primary);font-weight:650}
</style>
