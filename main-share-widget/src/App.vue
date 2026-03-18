<script setup>
import { ref, onMounted } from 'vue'
import ShareDialog from './components/ShareDialog.vue'
import wechatIcon from './assets/share-icons/wechat.png'

const shareVisible = ref(false)
const shareHref = ref('https://freelog.com')
const shareText = ref('')

onMounted(() => {
  shareHref.value = window.location.href
})
</script>

<template>

  <!-- 分享入口：点击打开分享弹窗 -->
  <!-- <button
    type="button"
    class="share-trigger"
    aria-label="分享"
    @click="shareVisible = true"
  >
    <img :src="wechatIcon" alt="分享" class="share-trigger-icon" />
    <span>分享</span>
  </button> -->

  <ShareDialog
    :visible="shareVisible"
    :href="shareHref"
    v-model:share-text="shareText"
    title="我的漫画节点"
    brand-subtitle="freelog · 漫画"
    type-label="COMICS"
    description="每周带你探索未知边界发现生活的新可能"
    author-name="张三李四"
    @close="shareVisible = false"
  />

</template>

<style>
.share-trigger {
  position: fixed;
  right: 24px;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;
  font-size: 14px;
  color: #222;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.share-trigger:hover {
  background: #f8f8f8;
  border-color: #ccc;
}
.share-trigger-icon {
  width: 20px;
  height: 20px;
}

.toast-wrapper {
  position: fixed;
  top: 50%;
  left: 50%;
  color: #fff;
  font-weight: bold;
  transform: translate(-50%, -50%);
  padding: 19px 50px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  font-size: 16px;
  line-height: 22px;
  animation: fade-in-out 2s linear;
  white-space: nowrap;
  z-index: 9999;
}
</style>
