<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Place } from '@/types/explore'

const props = defineProps<{ places: Place[]; selectedId?: number | null }>()
const emit = defineEmits(['select', 'ready', 'error'])

const mapKey = import.meta.env.VITE_AMAP_KEY?.trim() ?? ''
const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE?.trim() ?? ''
const configured = computed(() => Boolean(mapKey && securityCode))
const state = ref<'loading' | 'ready' | 'unconfigured' | 'error'>(configured.value ? 'loading' : 'unconfigured')
const message = ref('')
let mapInstance: any
let markerInstances: any[] = []
let amapApi: any
let placeSearchService: any
let searchMarker: any
let searchInfoWindow: any
let geolocationService: any
let userMarker: any
let searchSequence = 0

async function waitForMapReady(timeout = 5000) {
  const startedAt = Date.now()
  while ((!mapInstance || !amapApi || state.value !== 'ready') && Date.now() - startedAt < timeout) {
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  if (!mapInstance || !amapApi) throw new Error('地图仍在初始化，请稍后再试')
}

function focusPlace(id: number) {
  const index = props.places.findIndex(place => place.id === id)
  const marker = markerInstances[index]
  if (!mapInstance || !marker) return
  mapInstance.setZoomAndCenter(15, marker.getPosition(), false, 420)
}

onMounted(async () => {
  // #ifdef H5
  if (!configured.value) return
  try {
    ;(window as any)._AMapSecurityConfig = { securityJsCode: securityCode }
    const { default: AMapLoader } = await import('@amap/amap-jsapi-loader')
    const AMap = await AMapLoader.load({ key: mapKey, version: '2.0', plugins: ['AMap.Scale', 'AMap.Geolocation', 'AMap.PlaceSearch'] })
    amapApi = AMap
    mapInstance = new AMap.Map('xy-amap-container', {
      zoom: 12.4,
      center: [115.8581, 28.6829],
      viewMode: '2D',
      mapStyle: 'amap://styles/fresh',
      resizeEnable: true,
      zoomEnable: true,
    })
    mapInstance.addControl(new AMap.Scale({ position: 'LB' }))
    markerInstances = props.places.map((place, index) => {
      const marker = new AMap.Marker({
        position: [place.longitude, place.latitude],
        title: place.name,
        anchor: 'bottom-center',
        content: `<button class="xy-amap-marker" aria-label="${place.name}"><b class="xy-amap-marker-number">${index + 1}</b></button>`,
      })
      marker.on('click', () => emit('select', place.id))
      return marker
    })
    mapInstance.add(markerInstances)
    state.value = 'ready'
    emit('ready')
  } catch (error) {
    message.value = error instanceof Error ? error.message : '地图服务加载失败'
    state.value = 'error'
    emit('error', message.value)
  }
  // #endif
})

async function searchPoi(keyword: string) {
  // #ifdef H5
  if (!keyword.trim()) return null
  const currentSequence = ++searchSequence
  await waitForMapReady()
  placeSearchService ||= new amapApi.PlaceSearch({ city: '南昌', citylimit: true, pageSize: 10, pageIndex: 1 })
  const poi = await new Promise<any>((resolve, reject) => {
    placeSearchService.search(keyword.trim(), (status: string, result: any) => {
      const first = result?.poiList?.pois?.[0]
      if (status === 'complete' && first?.location) resolve(first)
      else reject(new Error(status === 'no_data' ? '没有搜索到这个地点' : '地点搜索暂时不可用'))
    })
  })
  if (currentSequence !== searchSequence) return null
  const position = [poi.location.lng, poi.location.lat]
  if (!searchMarker) {
    searchMarker = new amapApi.Marker({ position, anchor: 'bottom-center', zIndex: 130 })
    mapInstance.add(searchMarker)
  } else {
    searchMarker.setPosition(position)
  }
  searchMarker.setTitle(poi.name)
  searchInfoWindow?.close?.()
  const viewSettled = new Promise<void>(resolve => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      mapInstance?.off?.('moveend', finish)
      resolve()
    }
    mapInstance.once('moveend', finish)
    setTimeout(finish, 900)
  })
  mapInstance.setZoomAndCenter(16, position, false, 650)
  searchInfoWindow ||= new amapApi.InfoWindow({ offset: new amapApi.Pixel(0, -34), closeWhenClickMap: true, autoMove: false })
  searchInfoWindow.setContent(`<div style="padding:4px 6px;min-width:150px"><b style="font-size:14px">${poi.name}</b><div style="margin-top:5px;color:#71817d;font-size:12px">${poi.address || poi.pname + poi.cityname}</div></div>`)
  await viewSettled
  if (currentSequence !== searchSequence) return null
  searchInfoWindow.open(mapInstance, position)
  return { name: poi.name, address: poi.address ?? '', longitude: poi.location.lng, latitude: poi.location.lat }
  // #endif
  // #ifndef H5
  return null
  // #endif
}

async function locateCurrent() {
  // #ifdef H5
  await waitForMapReady()
  geolocationService ||= new amapApi.Geolocation({ enableHighAccuracy: true, timeout: 8000, zoomToAccuracy: false })
  const result = await new Promise<any>((resolve, reject) => {
    geolocationService.getCurrentPosition((status: string, value: any) => {
      if (status === 'complete' && value?.position) resolve(value)
      else reject(new Error('无法获取当前位置，请检查浏览器定位权限'))
    })
  })
  const position = [result.position.lng, result.position.lat]
  if (!userMarker) {
    userMarker = new amapApi.Marker({
      position,
      anchor: 'center',
      zIndex: 150,
      content: '<div class="xy-user-location"><span class="xy-user-location-dot"></span></div>',
    })
    mapInstance.add(userMarker)
  } else userMarker.setPosition(position)
  mapInstance.setZoomAndCenter(15, position, false, 600)
  return { longitude: result.position.lng, latitude: result.position.lat }
  // #endif
  // #ifndef H5
  return new Promise<{ longitude: number; latitude: number }>((resolve, reject) => {
    uni.getLocation({ type: 'gcj02', success: value => resolve(value), fail: () => reject(new Error('无法获取当前位置')) })
  })
  // #endif
}

defineExpose({ searchPoi, locateCurrent })

watch(() => props.selectedId, id => { if (id) focusPlace(id) })

onBeforeUnmount(() => {
  mapInstance?.destroy?.()
  mapInstance = undefined
  markerInstances = []
  amapApi = undefined
  placeSearchService = undefined
  searchMarker = undefined
  searchInfoWindow = undefined
  geolocationService = undefined
  userMarker = undefined
})
</script>

<template>
  <!-- #ifdef H5 -->
  <view id="xy-amap-container" class="amap-host" />
  <view v-if="state !== 'ready'" class="map-fallback">
    <view class="fallback-orbit"><view /><view /><view /></view>
    <text class="fallback-title">{{ state === 'unconfigured' ? '高德地图等待配置' : state === 'loading' ? '正在加载高德地图' : '地图暂时没有加载成功' }}</text>
    <text class="fallback-copy">{{ state === 'unconfigured' ? '在 .env.local 填入 Web Key 与安全密钥即可启用' : message || '请稍后重试' }}</text>
  </view>
  <!-- #endif -->

  <!-- #ifndef H5 -->
  <map class="amap-host" provider="amap" :latitude="28.6829" :longitude="115.8581" :scale="12"
    :markers="places.map((place,index)=>({id:place.id,latitude:place.latitude,longitude:place.longitude,title:place.name,width:32,height:32,label:{content:String(index+1),color:'#ffffff',fontSize:12,borderRadius:20,bgColor:'#238d75',padding:5}}))"
    @markertap="emit('select', Number($event.detail.markerId))" />
  <!-- #endif -->
</template>

<style scoped lang="scss">
.amap-host{width:100%;height:100%;background:#dcebe5}.map-fallback{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:50rpx;background:radial-gradient(circle at 30% 20%,#eef9f4,#dcece6);text-align:center}.fallback-orbit{position:relative;width:150rpx;height:150rpx;margin-bottom:28rpx;border:2rpx solid rgba(35,139,116,.2);border-radius:50%}.fallback-orbit:before,.fallback-orbit:after{content:'';position:absolute;background:rgba(35,139,116,.18)}.fallback-orbit:before{top:50%;left:-45rpx;width:240rpx;height:2rpx;transform:rotate(-28deg)}.fallback-orbit:after{top:-45rpx;left:50%;width:2rpx;height:240rpx;transform:rotate(38deg)}.fallback-orbit view{position:absolute;width:22rpx;height:22rpx;border:5rpx solid #fff;border-radius:50%;background:#238b74;box-shadow:0 7rpx 20rpx rgba(35,139,116,.3)}.fallback-orbit view:nth-child(1){top:25rpx;left:36rpx}.fallback-orbit view:nth-child(2){right:18rpx;bottom:35rpx}.fallback-orbit view:nth-child(3){bottom:12rpx;left:22rpx}.fallback-title{color:#23483e;font-size:28rpx;font-weight:750}.fallback-copy{max-width:480rpx;margin-top:10rpx;color:#6f8981;font-size:21rpx;line-height:1.6}
:global(.xy-amap-marker){position:relative;width:42px;height:42px;padding:0;border:4px solid rgba(255,255,255,.94);border-radius:50% 50% 50% 12%;background:#238b74;color:#fff;box-shadow:0 8px 18px rgba(28,91,74,.28);font-weight:700;transform:rotate(-45deg)}:global(.xy-amap-marker-number){display:block;transform:rotate(45deg)}
:global(.xy-user-location){display:grid;place-items:center;width:28px;height:28px;border:2px solid rgba(255,255,255,.95);border-radius:50%;background:rgba(46,139,117,.18);box-shadow:0 4px 18px rgba(30,98,81,.3)}:global(.xy-user-location-dot){width:12px;height:12px;border:3px solid #fff;border-radius:50%;background:#238b74;box-shadow:0 0 0 5px rgba(35,139,116,.2)}
</style>
