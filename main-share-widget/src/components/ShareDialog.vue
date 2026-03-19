<template>
  <!-- PC 端 -->
  <input id="share-href-pc" type="text" class="share-hidden-input" :value="data.nodeInfo.nodeUrl" readonly tabindex="-1" />
  <Transition name="share-fade">
    <div
      v-show="data.show && !isMobile"
      class="share-overlay"
      @click.self="handleCloseModal"
    >
      <Transition name="share-scale">
        <div v-show="data.show && !isMobile" class="share-dialog--pc">
          <button type="button" class="share-close" aria-label="关闭" @click="handleCloseModal">
            <img src="../assets/share-close.svg" alt="close" class="share-close-icon" />
          </button>
          <div class="share-title">分享</div>
          <div class="share-pc-body">
            <div class="share-pc-left">
              <div class="share-pc-card">
                <div class="share-pc-node-logo" v-if="data.nodeInfo.nodeLogo">
                  <img :src="data.nodeInfo.nodeLogo" alt="节点logo" />
                </div>
                  <h3 class="share-pc-card-title" v-if="data.nodeInfo.nodeTitle">{{ data.nodeInfo.nodeTitle}}</h3>
                <div class="share-pc-desc" v-if="data.nodeInfo.nodeShortDescription">{{ data.nodeInfo.nodeShortDescription }}</div>
                <div ref="qrWrapRef" class="share-pc-qr-wrap">
                  <QrcodeVue :value="data.nodeInfo.nodeUrl" :size="144" level="Q" :margin="1" class="qr-code" />
                </div>
                <div class="share-pc-author">
                  <span class="share-pc-avatar">
                    <img :src="data.nodeInfo.avatarUrl" alt="用户头像" />
                  </span>
                  <span class="share-pc-name">{{ data.nodeInfo.ownerUserName  }}</span>
                  <span class="share-pc-divider"></span>
                  <div class="share-pc-freelog-wrap">
                    <img src="../assets/freelog.png" alt="freelog" class="share-pc-freelog-icon" />
                  </div>
                </div>
              </div>
              <button type="button" class="share-pc-download" @click="handleDownloadCard">
                <img src="../assets/share-icons/download.svg" alt="download" class="share-pc-download-icon" />
                下载二维码名片
              </button>
            </div>
            <div class="share-pc-right">
              <button
                v-for="item in shareBtns"
                :key="item.id"
                type="button"
                class="share-pc-cell"
                @click="handleSharePc(item)"
              >
                <span class="share-pc-cell-icon" :class="{  'has-border': item.id === 'copy' }" >
                  <img :src="item.icon" :alt="item.name" :class="item.id === 'copy' ? 'has-border-icon' : 'normal-icon'" />
                </span>
                <span class="share-pc-cell-label">{{ item.name }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>

  <!-- 移动端 -->
  <input id="share-href-mobile" type="text" class="share-hidden-input" :value="href" readonly tabindex="-1" />
  <Transition name="share-slide-up">
    <div v-show="data.show && isMobile" id="mobile-share-wrap" class="mobile-share-wrap">
      <div class="mobile-panels" @click.self="handleCloseModal">
        <div class="mobile-card">
          <div class="mobile-card-header" v-if="data.nodeInfo.nodeLogo">
            <img :src="data.nodeInfo.nodeLogo" alt="节点logo" />
          </div>
          <h3 class="mobile-card-title" v-if="data.nodeInfo.nodeTitle">{{ data.nodeInfo.nodeTitle }}</h3>
          <p class="mobile-card-desc" v-if="data.nodeInfo.nodeShortDescription">{{ data.nodeInfo.nodeShortDescription }}</p>
          <div class="mobile-card-qr">
            <div ref="mobileQrWrapRef" class="mobile-card-qr-wrap">
              <QrcodeVue :value="data.nodeInfo.nodeUrl" :size="144" level="Q" :margin="1" class="qr-code" />
            </div>
          </div>
          <div class="mobile-card-author">
            <span class="mobile-card-avatar">
              <img :src="data.nodeInfo.avatarUrl" alt="用户头像" />
            </span>
            <span class="mobile-card-name">{{ data.nodeInfo.ownerUserName  }}</span>
            <span class="mobile-card-divider"></span>
            <div class="mobile-card-freelog-wrap">
              <img src="../assets/freelog.png" alt="freelog" class="mobile-card-freelog-icon">
            </div>
          </div>
        </div>
      </div>
      <div class="mobile-share-panel">
        <div class="mobile-share-title">分享</div>
        <div class="mobile-share-grid">
          <button
            v-for="item in shareBtnsMobile"
            :key="item.id"
            type="button"
            class="mobile-share-cell"
            @click="handleShareMobile(item)"
          >
            <span class="mobile-share-icon" :class="['download', 'copy'].includes(item.id) && 'has-border'" >
              <img :src="item.icon" :alt="item.name" :class="['download', 'copy'].includes(item.id) ? 'has-border-icon' : 'normal-icon'" />
            </span>
            <span class="mobile-share-label">{{ item.name }}</span>
          </button>
        </div>
        <div class="mobile-share-divider"></div>
        <div  class="mobile-cancel" @click="handleCloseModal">取消</div>
      </div>
    </div>
  </Transition>

  <!-- 微信/QQ 二维码分享弹窗 -->
  <Transition name="qrcode-fade">
    <div
      v-if="qrcodeVisible"
      class="qrcode-popup-wrapper"
      @click="qrcodeVisible = false"
    >
      <div class="qrcode-popup" @click.stop>
        <button type="button" class="qrcode-close-btn" aria-label="关闭" @click="qrcodeVisible = false">
          <img src="../assets/share-close.svg" alt="close" class="qrcode-close-icon" />
        </button>
        <div class="qrcode-text">分享到{{ qrcodeInfo.alias }}</div>
        <QrcodeVue :value="qrcodeInfo.url" :size="220" level="M" />
        <div class="qrcode-text">
          使用{{ qrcodeInfo.alias }}扫一扫完成分享
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onUnmounted, reactive, onBeforeMount } from 'vue'
import {   widgetApi } from "freelog-runtime";
import QrcodeVue from 'qrcode.vue'
import { shareBtns, shareBtnsMobile } from '../api/shareData'
import type { ShareBtnItem } from '../api/shareData'
import { MOBILE_BREAKPOINT } from '../constants/breakpoint'
import { showToast } from '../utils/common';

const props = withDefaults(
  defineProps<{
    href?: string
    title?: string
    typeLabel?: string
    description?: string
    authorName?: string
  }>(),
  {
    href: '',
    title: '',
    typeLabel: 'COMICS',
    description: '每周带你探索未知边界发现生活的新可能',
    authorName: '张三李四',
  }
)

const data = reactive({
      show: false,
      exhibit: {} as any,
      shareText: "",
      href: "",
      nodeInfo: {} as any,
    });


const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
}

const qrcodeVisible = ref(false)
const qrcodeInfo = ref()
const qrWrapRef = ref<HTMLElement | null>(null)
const mobileQrWrapRef = ref<HTMLElement | null>(null)

function handleSharePc(item: ShareBtnItem) {
  if (item.id === 'copy') {
    handleCopy()
    return
  }
  handleShare(item)
}

function handleShare(item: ShareBtnItem) {
  const url = data.nodeInfo.nodeUrl
  const title = data.nodeInfo.nodeTitle   || ''
  const text = data.shareText || ''
  const image = data.nodeInfo?.nodeLogo;

  if (item.id === 'qqZone') {
    const shareWeb = `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(url)}&desc=${encodeURIComponent(text)}&summary=&title=${encodeURIComponent(title)}&pics=${encodeURIComponent(image)}`
    window.open(shareWeb)
  } else if (item.id === 'weibo') {
    window.open(
      `https://service.weibo.com/share/share.php?title=${encodeURIComponent(text)}&pic=${encodeURIComponent(image)}`
    )
  } else if (item.id === 'douban') {
    window.open(
      `https://www.douban.com/share/service?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&image=${encodeURIComponent(image)}`
    )
  } else if (['qq', 'wechat'].includes(item.id)) {
    qrcodeInfo.value = { name: item.name, alias: item.alias, url }
    qrcodeVisible.value = true
  }
}

function handleShareMobile(item: ShareBtnItem) {
  if (item.id === 'copy') {
    handleCopy()
    return
  }
  if (item.id === 'download') {
    handleDownloadCard()
    return
  }
  handleShare(item)
}

function handleDownloadCard() {
  const wrap = isMobile.value ? mobileQrWrapRef.value : qrWrapRef.value
  const canvas = wrap?.querySelector('canvas')
  if (!canvas) {
    showToast('二维码未就绪')
    return
  }
  canvas.toBlob((blob) => {
    if (!blob) {
      showToast('生成图片失败')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `二维码-${(data.nodeInfo.nodeTitle || 'share').replace(/[<>:"/\\|?*]/g, '_')}.png`
    a.click()
    URL.revokeObjectURL(url)
    showToast('节点二维码名片已下载')
  }, 'image/png')
}

function handleCopy() {
  const id = isMobile.value ? 'share-href-mobile' : 'share-href-pc'
  const input = document.getElementById(id) as HTMLInputElement
  if (input) {
    input.select()
    document.execCommand('copy')
    showToast('链接复制成功～')
  }
}



function handleCloseModal() {
  if(isMobile.value) {
    const el = document.getElementById("mobile-share-wrap");
    if (el) el.style.display =  "none";
  }else{
    data.show = false;
    const widgetConfig = widgetApi.getData();
    widgetConfig.onClose();
  }
}

if (typeof window !== 'undefined') {
  checkMobile()
  window.addEventListener('resize', checkMobile)
}

  /** 初始化数据 */
  const initData = async () => {
      widgetApi.addDataListener((props: any) => {
        data.nodeInfo = props.exhibit;
        data.show = props.show;
      }, true);

      const widgetConfig = widgetApi.getData();

      const type = widgetConfig.type || "展品";
      data.exhibit = widgetConfig.exhibit;
      data.shareText = `我在freelog发现一个不错的${type}：\n《${data.exhibit.exhibitTitle}》\n${data.nodeInfo.nodeUrl}`;
    };

    onBeforeMount(() => {
      initData()
    })

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkMobile)
  }
})


</script>

<style scoped>
.share-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2000;
}

.share-overlay--mobile {
  align-items: flex-end;
  background: transparent;
}



/* PC 端 */
.share-dialog--pc {
position: relative;
  width: 790px;
  height: 596px;
  padding: 30px 70px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 4px;
}

.share-dialog--pc .share-close {
  position: absolute;
  top: 35px;
  right: 30px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}


.share-dialog--pc .share-title {
  font-size: 20px;
  font-weight: 400;
  color: #222;
  line-height: 26px;
  text-align: center;
  margin-bottom: 30px;
}

.share-pc-body {
  display: flex;
  gap: 50px;
}

.share-pc-left {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-pc-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 300px;
  height: 400px;
  padding: 20px 30px;
  background: #FAFBFC;
  border-radius: 12px;
  text-align: center;
  box-sizing: border-box;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.share-pc-node-logo {
  width: 150px;
  height: 60px;
  margin-bottom: 4px;

  img{
    width: 100%;
    height: 100%;
    object-fit: contain;    
  }
}


.share-pc-card-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  margin: 16.5px 0;
  color: #000000;
}

.share-pc-desc {
  font-size: 12px;
  font-weight: 400;
  color: #000000;
  line-height: 18px;
  min-height: 36px; /* 2行 × 18px，避免第二行被裁切 */
  width: 100%;
  min-width: 0; /* 允许 flex 子项收缩 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all; /* 全英文无空格时强制换行 */
}

.share-pc-qr-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16.5px 0;
  padding: 5px 8px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid #E4E7EB;
}

.share-pc-qr-wrap :deep(canvas) {
  display: block;
}

.share-pc-author {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 400;
  color: #999999;
}

.share-pc-avatar {
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin-right: 5px;
  border-radius: 50%;
  background: #999999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: #fff;

  img{
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.share-pc-name {
  color: #999999;
}

.share-pc-divider {
  width: 1px;
  height: 12px;
  background: #E4E7EB;
  margin: 0 20px;
  flex-shrink: 0;
}

.share-pc-freelog-wrap {
  width: 46px;
  height: 10px;
  opacity: 0.3;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999999;
}

.share-pc-freelog-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* 模块2：下载按钮 */
.share-pc-download {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6.5px;
  width: 100%;
  padding: 15px 50px;
  font-weight: 600;
  border: 1px solid #999;
  border-radius: 4px;
  font-size: 14px;
  color: #000000;
  background: #fff;
  cursor: pointer;

  img{
    width: 14.5px;
  }
}



.share-pc-right {
  width: 300px;
  height: 460px;
  padding: 60px 66px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40px;
  align-content: start;
  box-sizing: border-box;
}

/* 分享单元  */
.share-pc-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}


.share-pc-cell-icon {
  width: 64px;
  height: 64px;
  min-width: 64px;
  min-height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-pc-cell-icon.has-bg {
  color: #fff;
}

.share-pc-cell-icon.has-border {
  border-radius: 6px;
  border: 1px solid #999;
  background: #fff;
}

.share-pc-cell-icon .normal-icon {
  width: 64px;
  height: 64px;
  display: block;
  object-fit: contain;
}

.share-pc-cell-icon .has-border-icon {
  width: 30px;
  height: 30px;
}

.share-pc-cell-label {
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #222;
  text-align: center;
}

/*
 * 移动端 
 */
.mobile-share-wrap {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.35);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.mobile-panels {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-top: 43px;
}



.mobile-card {
  width: 300px;
  height: 400px;
  background: #ffffff;
  padding: 20px 30px;
  border-radius: 12px;
  box-sizing: border-box;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
  text-align: center;
  margin: auto;
}

.mobile-card-header {
  width: 150px;
  height: 60px;
  margin: auto;

  img{
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

}

.mobile-card-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: #000000;
  margin: 16.5px 0;
}

.mobile-card-desc {
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #000000;
  margin-bottom: 16.5px;
  min-height: 36px;
  width: 100%;
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

/* 二维码：居中，白底圆角框 */
.mobile-card-qr {
  display: flex;
  justify-content: center;
  margin: 16.5px 0;
}

.mobile-card-qr-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 8px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid #E4E7EB;
}




/* 作者区：头像 + 名字 + 竖线 + freelog logo */
.mobile-card-author {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 400;
  color: #999999;
}

.mobile-card-avatar {
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin-right: 5px;
  border-radius: 50%;
  background: #999999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  img{
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.mobile-card-name {
  color:#999999;
}

/* 竖线分隔 */
.mobile-card-divider {
  width: 1px;
  height: 12px;
  background: #E4E7EB;
  margin: 0 20px;
}

/* freelog logo 区域 */
.mobile-card-freelog-wrap {
  width: 46px;
  height: 10px;
  opacity: 0.3;
  display: flex;
  align-items: center;
}

.mobile-card-freelog-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.mobile-share-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2001;
  background: #FFFFFF;
  padding: 20px;
  border-radius: 20px 20px 0 0;
}

/* 标题：无分隔线 */
.mobile-share-title {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #222222;
  text-align: center;
  margin-bottom: 15px;
}

.mobile-share-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px 12px;
}

.mobile-share-divider {
  height: 1px;
  background: #E4E7EB;
  margin: 15px 0 ;
}

.mobile-share-cell:nth-child(6) {
  grid-column: 1;
}

.mobile-share-cell:nth-child(7) {
  grid-column: 2;
}

.mobile-share-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.mobile-share-icon {
  width: 38px;
  height: 38px;
  min-width: 38px;
  min-height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  transition: transform 0.12s ease;
  
  &.has-border{
    border-radius: 6px;
    border: 1px solid #999;
  }
}

.mobile-share-icon .normal-icon {
  width: 38px;
  height: 38px;
  display: block;
  object-fit: contain;
}

.mobile-share-icon .has-border-icon {
  width: 20px;
  height: 20px;
}

.mobile-share-label {
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color:#222;
  text-align: center;
}

/* 取消：纯文字，无边框 */
.mobile-cancel {
  width: 100%;
  font-size: 14px;
  font-weight: 400;
  color: #333;
  cursor: pointer;
  line-height: 20px;
}


.share-hidden-input {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}


/* Toast */
.share-toast {
  position: fixed;
  left: 50%;
  bottom: 80px;
  transform: translateX(-50%) translateY(10px);
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 14px;
  border-radius: 8px;
  z-index: 3000;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
}

.share-toast--show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* 动画 */
.share-fade-enter-active,
.share-fade-leave-active {
  transition: opacity 0.2s ease;
}

.share-fade-enter-from,
.share-fade-leave-to {
  opacity: 0;
}

.share-scale-enter-active,
.share-scale-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.share-scale-enter-from,
.share-scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}

.share-slide-up-enter-active,
.share-slide-up-leave-active {
  transition: transform 0.3s ease-out, opacity 0.3s ease;
}

.share-slide-up-enter-from,
.share-slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* 微信/QQ 二维码弹窗--开始*/
.qrcode-popup-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 3000;
}

.qrcode-popup {
  position: relative;
  padding: 30px 40px;
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e4e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.qrcode-close-btn {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 24px;
  height: 24px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
}

.qrcode-close-btn .qrcode-close-icon {
  width: 16px;
  height: 16px;
  display: block;
}

.qrcode-text {
  font-size: 16px;
  color: #222;
  line-height: 22px;
  margin: 16px 0;
}

.qrcode-fade-enter-active,
.qrcode-fade-leave-active {
  transition: opacity 0.2s ease;
}

.qrcode-fade-enter-from,
.qrcode-fade-leave-to {
  opacity: 0;
}
/* 微信/QQ 二维码弹窗--结束 */

</style>
