<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
defineProps<{ title: string; copy: string; icon: string }>()
</script>

<template>
  <view class="placeholder-page">
    <view class="placeholder-orb"><AppIcon :type="icon" size="38" color="#2b9179" /></view>
    <text class="placeholder-title">{{ title }}</text>
    <text class="placeholder-copy">{{ copy }}</text>
    <view class="placeholder-chip">模块即将展开</view>
  </view>
</template>

<style scoped lang="scss">
.placeholder-page { min-height: 82vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60rpx; text-align: center; background: radial-gradient(circle at 50% 35%, #e5f7ef 0, transparent 36%); }
.placeholder-orb { width: 124rpx; height: 124rpx; display: grid; place-items: center; margin-bottom: 26rpx; border-radius: 42rpx; background: #fff; box-shadow: 0 18rpx 54rpx rgba(58, 121, 103, .14); transform: rotate(-4deg); }
.placeholder-title { font-size: 42rpx; font-weight: 700; letter-spacing: 2rpx; }
.placeholder-copy { max-width: 470rpx; margin-top: 12rpx; color: #72837e; font-size: 26rpx; line-height: 1.7; }
.placeholder-chip { margin-top: 30rpx; padding: 10rpx 22rpx; border-radius: 999rpx; background: #e6f5f0; color: #33826e; font-size: 22rpx; }
</style>
