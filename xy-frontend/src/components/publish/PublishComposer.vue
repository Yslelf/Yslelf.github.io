<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { Place, Post } from '@/types/explore'

const props = defineProps<{ places: Place[]; initialAlbum?: boolean }>()
const emit = defineEmits(['close', 'published'])

const saved = uni.getStorageSync('xy-post-draft') || {}
const form = reactive({
  title: saved.title || '',
  content: saved.content || '',
  images: (saved.images || []) as string[],
  placeId: (saved.placeId || null) as number | null,
  tags: (saved.tags || []) as string[],
  visibility: saved.visibility || '公开',
})
const tagDraft = ref('')
const publishing = ref(false)
const activeStep = ref<'media' | 'content'>('media')
const canPublish = computed(() => form.images.length > 0 && form.title.trim().length >= 2 && form.content.trim().length >= 5)
const selectedPlace = computed(() => props.places.find(place => place.id === form.placeId))

function chooseImages() {
  uni.chooseImage({ count: 9 - form.images.length, sizeType: ['compressed'], sourceType: ['album', 'camera'], success: result => {
    form.images.push(...result.tempFilePaths)
    if (form.images.length) activeStep.value = 'content'
  } })
}

function removeImage(index: number) {
  form.images.splice(index, 1)
}

function addTag() {
  const value = tagDraft.value.trim().replace(/^#/, '')
  if (!value || form.tags.includes(value) || form.tags.length >= 10) return
  form.tags.push(value)
  tagDraft.value = ''
}

function choosePlace() {
  uni.showActionSheet({ itemList: props.places.map(place => place.name), success: result => { form.placeId = props.places[result.tapIndex]?.id ?? null } })
}

function saveDraft() {
  uni.setStorageSync('xy-post-draft', { ...form })
  uni.showToast({ title: '草稿已保存', icon: 'success' })
}

async function publish() {
  if (!canPublish.value || publishing.value) return
  publishing.value = true
  await new Promise(resolve => setTimeout(resolve, 550))
  const post: Post = {
    id: Date.now(),
    placeId: form.placeId || props.places[0]?.id || 101,
    title: form.title.trim(),
    excerpt: form.content.trim(),
    author: '我在南昌',
    avatar: 'https://i.pravatar.cc/160?img=14',
    cover: form.images[0],
    likes: 0,
    useful: 0,
    checkedIn: Boolean(form.placeId),
    live: true,
  }
  uni.removeStorageSync('xy-post-draft')
  publishing.value = false
  emit('published', post)
}
</script>

<template>
  <view class="composer-layer">
    <view class="composer-header safe-top">
      <button aria-label="关闭" @click="emit('close')"><AppIcon type="closeempty" size="24" color="#263f38"/></button>
      <view class="composer-tabs"><button :class="{active:activeStep==='media'}" @click="activeStep='media'">图片</button><button :class="{active:activeStep==='content'}" @click="activeStep='content'">文字</button></view>
      <button class="draft-link" @click="saveDraft">存草稿</button>
    </view>

    <scroll-view scroll-y class="composer-scroll">
      <view v-if="activeStep==='media'" class="media-stage">
        <view v-if="form.images.length" class="media-grid">
          <view v-for="(image,index) in form.images" :key="image" class="media-item"><image :src="image" mode="aspectFill"/><text>{{ index+1 }}</text><button @click="removeImage(index)">×</button></view>
          <button v-if="form.images.length<9" class="media-add compact" @click="chooseImages"><AppIcon type="plus" size="28" color="#70857f"/><text>{{ form.images.length }}/9</text></button>
        </view>
        <button v-else class="media-add hero-add" @click="chooseImages"><view><AppIcon type="image" size="40" color="#fff"/></view><text>添加照片</text><text>支持拍摄或从相册选择，最多 9 张</text></button>
        <view class="media-tips"><text>创作建议</text><view><text>4:5 竖图更适合内容流</text><text>首图会作为封面</text><text>避免包含联系方式和二维码</text></view></view>
      </view>

      <view v-else class="content-stage">
        <view v-if="form.images.length" class="cover-preview"><image :src="form.images[0]" mode="aspectFill"/><view><text>{{ form.images.length }} 张图片</text><button @click="activeStep='media'">编辑图片</button></view></view>
        <view class="editor-card"><input v-model="form.title" maxlength="40" placeholder="填写标题会有更多赞哦"/><text class="count">{{ form.title.length }}/40</text><textarea v-model="form.content" maxlength="2000" auto-height placeholder="分享真实体验和有用攻略…"/><text class="count">{{ form.content.length }}/2000</text></view>
        <view class="tag-editor"><view class="tag-list"><button v-for="tag in form.tags" :key="tag" @click="form.tags=form.tags.filter(item=>item!==tag)"># {{ tag }} ×</button></view><view class="tag-input"><text>#</text><input v-model="tagDraft" maxlength="12" placeholder="添加话题" confirm-type="done" @confirm="addTag"/><button @click="addTag">添加</button></view></view>
        <view class="publish-settings"><button @click="choosePlace"><AppIcon type="location-filled" size="21" color="#3c806f"/><view><text>关联地点</text><text>{{ selectedPlace?.name || '让附近的人看到你的分享' }}</text></view><AppIcon type="right" size="17" color="#91a09c"/></button><button @click="form.visibility=form.visibility==='公开'?'仅自己可见':'公开'"><AppIcon type="person" size="21" color="#3c806f"/><view><text>谁可以看</text><text>{{ form.visibility }}</text></view><AppIcon type="right" size="17" color="#91a09c"/></button></view>
      </view>
      <view class="composer-space"/>
    </scroll-view>

    <view class="composer-footer safe-bottom"><button class="save-button" @click="saveDraft">存草稿</button><button class="publish-button" :disabled="!canPublish||publishing" @click="publish">{{ publishing?'发布中…':'发布笔记' }}</button></view>
  </view>
</template>

<style scoped lang="scss">
.composer-layer{position:fixed;z-index:220;inset:0;background:#f7faf9}.composer-header{display:grid;grid-template-columns:90rpx 1fr 100rpx;align-items:center;height:104rpx;padding:env(safe-area-inset-top) 22rpx 0;border-bottom:1rpx solid #e9efed;background:rgba(255,255,255,.96)}.composer-header>button{display:grid;place-items:center;width:66rpx;height:66rpx;margin:0;padding:0;border:0;background:transparent}.composer-header .draft-link{width:auto;color:var(--xy-primary);font-size:21rpx}.composer-tabs{display:flex;justify-content:center;gap:45rpx}.composer-tabs button{position:relative;margin:0;padding:25rpx 4rpx;border:0;background:transparent;color:#899994;font-size:25rpx}.composer-tabs button.active{color:var(--xy-ink);font-weight:750}.composer-tabs button.active:after{content:'';position:absolute;right:22%;bottom:13rpx;left:22%;height:5rpx;border-radius:99rpx;background:var(--xy-primary)}.composer-scroll{height:calc(100vh - 220rpx - env(safe-area-inset-top) - env(safe-area-inset-bottom))}.media-stage,.content-stage{padding:28rpx 24rpx}.media-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12rpx}.media-item{position:relative;overflow:hidden;aspect-ratio:1;border-radius:20rpx;background:#e5eeeb}.media-item image{width:100%;height:100%}.media-item>text{position:absolute;top:9rpx;left:9rpx;display:grid;place-items:center;width:36rpx;height:36rpx;border-radius:50%;background:rgba(23,43,38,.58);color:#fff;font-size:17rpx}.media-item>button{position:absolute;top:8rpx;right:8rpx;display:grid;place-items:center;width:38rpx;height:38rpx;margin:0;padding:0;border:0;border-radius:50%;background:rgba(23,43,38,.65);color:#fff;font-size:25rpx}.media-add{display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0;border:2rpx dashed #cbdad5;background:#eef5f2;color:#71867f}.media-add.compact{aspect-ratio:1;border-radius:20rpx;font-size:18rpx}.hero-add{width:100%;height:600rpx;border-radius:32rpx}.hero-add>view{display:grid;place-items:center;width:100rpx;height:100rpx;border-radius:32rpx;background:linear-gradient(145deg,var(--xy-primary),var(--xy-primary-deep));box-shadow:0 14rpx 32rpx color-mix(in srgb,var(--xy-primary) 25%,transparent)}.hero-add>text:nth-child(2){margin-top:25rpx;color:var(--xy-ink);font-size:29rpx;font-weight:720}.hero-add>text:last-child{margin-top:9rpx;font-size:20rpx}.media-tips{margin-top:27rpx;padding:25rpx;border-radius:26rpx;background:#fff}.media-tips>text{font-size:24rpx;font-weight:700}.media-tips>view{display:flex;flex-direction:column;gap:12rpx;margin-top:15rpx;color:#83948f;font-size:20rpx}.media-tips>view text:before{content:'✓';margin-right:10rpx;color:var(--xy-primary)}.cover-preview{display:grid;grid-template-columns:130rpx 1fr;gap:16rpx;padding:12rpx;border-radius:23rpx;background:#fff}.cover-preview image{width:130rpx;height:130rpx;border-radius:17rpx}.cover-preview>view{display:flex;flex-direction:column;justify-content:center;align-items:flex-start}.cover-preview text{color:#71847e;font-size:20rpx}.cover-preview button{margin:12rpx 0 0;padding:8rpx 15rpx;border:0;border-radius:99rpx;background:var(--xy-soft);color:var(--xy-primary);font-size:18rpx}.editor-card,.tag-editor,.publish-settings{margin-top:18rpx;border-radius:26rpx;background:#fff}.editor-card{position:relative;padding:12rpx 24rpx}.editor-card input{height:90rpx;border-bottom:1rpx solid #edf1ef;font-size:29rpx;font-weight:700}.editor-card textarea{width:100%;min-height:280rpx;padding:22rpx 0;font-size:24rpx;line-height:1.75}.count{display:block;color:#a0aaa7;font-size:17rpx;text-align:right}.tag-editor{padding:20rpx}.tag-list{display:flex;flex-wrap:wrap;gap:10rpx}.tag-list button{margin:0;padding:8rpx 13rpx;border:0;border-radius:99rpx;background:var(--xy-soft);color:var(--xy-primary);font-size:18rpx}.tag-input{display:grid;grid-template-columns:25rpx 1fr auto;align-items:center;margin-top:12rpx;padding:12rpx 15rpx;border-radius:18rpx;background:#f2f6f4}.tag-input input{font-size:21rpx}.tag-input button{margin:0;padding:7rpx 13rpx;border:0;background:transparent;color:var(--xy-primary);font-size:19rpx}.publish-settings{padding:0 20rpx}.publish-settings>button{display:grid;grid-template-columns:45rpx 1fr 30rpx;align-items:center;width:100%;margin:0;padding:21rpx 0;border:0;border-bottom:1rpx solid #edf1ef;background:transparent;text-align:left}.publish-settings>button:last-child{border-bottom:0}.publish-settings>button>view{display:flex;flex-direction:column}.publish-settings>button>view text:first-child{font-size:23rpx;font-weight:650}.publish-settings>button>view text:last-child{margin-top:4rpx;color:#879792;font-size:18rpx}.composer-footer{position:fixed;right:0;bottom:0;left:0;z-index:3;display:grid;grid-template-columns:180rpx 1fr;gap:15rpx;padding:16rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));border-top:1rpx solid #e8eeec;background:rgba(255,255,255,.96)}.composer-footer button{height:82rpx;margin:0;border:0;border-radius:24rpx;font-size:24rpx;font-weight:700}.save-button{background:#eef4f2;color:#557168}.publish-button{background:linear-gradient(145deg,var(--xy-primary),var(--xy-primary-deep));color:#fff}.publish-button[disabled]{opacity:.38}.composer-space{height:80rpx}@media (min-width:760px){.composer-layer{right:auto;left:50%;width:520px;transform:translateX(-50%)}.composer-footer{right:auto;left:50%;width:520px;transform:translateX(-50%)}}
</style>
