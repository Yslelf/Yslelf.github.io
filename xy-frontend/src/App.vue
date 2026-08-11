<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
  // 全局初始化入口：后续在这里恢复登录态、加载远程配置。
})
</script>

<style lang="scss">
page {
  background: #f6faf8;
  color: #18332d;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
button::after,
uni-button::after { border: 0 !important; }

@media (min-width: 760px) {
  page { background: #e9f1ee; }
  uni-page-body { display: block; max-width: 520px; min-height: 100vh; margin: 0 auto; background: #f6faf8; box-shadow: 0 0 80px rgba(36, 77, 67, .14); }
}
@media (min-width: 1024px) {
  uni-page-body { max-width:1440px; box-shadow:0 0 90px rgba(36,77,67,.08); }
}
</style>
