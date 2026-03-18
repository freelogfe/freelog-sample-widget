<template>
  <!-- PC 端 -->
  <input id="share-href-pc" type="text" class="share-hidden-input" :value="data.href || href" readonly tabindex="-1" />
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
            <!-- 左侧：模块1 内容卡片 + 模块2 下载按钮 -->
            <div class="share-pc-left">
              <!-- 模块1：二维码名片内容卡 -->
              <div class="share-pc-card">
                <div class="share-pc-brand"></div>
                <h3 class="share-pc-card-title">{{ title || '我的漫画节点' }}</h3>
                <p class="share-pc-desc">{{ description || '每周带你探索未知边界发现生活的新可能' }}</p>
                <div class="share-pc-qr-wrap">
                  <QrcodeVue :value="data.href || href || 'https://freelog.com'" :size="144" level="Q" :margin="1" class="qr-code" />
                </div>
                <div class="share-pc-author">
                  <span class="share-pc-avatar">{{ (authorName || '张三李四').charAt(0) }}</span>
                  <span class="share-pc-name">{{ authorName || '张三李四' }}</span>
                  <span class="share-pc-divider"></span>
                  <div class="share-pc-freelog-wrap">
                    <img src="../assets/freelog.png" alt="freelog" class="share-pc-freelog-icon" />
                  </div>
                </div>
              </div>
              <!-- 模块2：下载按钮 -->
              <button type="button" class="share-pc-download" @click="handleDownloadCard">
                <img src="../assets/share-icons/download.svg" alt="download" class="share-pc-download-icon" />
                下载二维码名片
              </button>
            </div>
            <!-- 右侧：分享选项 3×2 网格 -->
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
          <div class="mobile-card-header">
          </div>
          <h3 class="mobile-card-title">{{ title || '我的漫画节点' }}</h3>
          <p class="mobile-card-desc">{{ description || '每周带你探索未知边界发现生活的新可能' }}</p>
          <div class="mobile-card-qr">
            <div class="mobile-card-qr-wrap">
              <QrcodeVue :value="data.href || href || 'https://freelog.com'" :size="144" level="Q" :margin="1" class="qr-code" />
            </div>
          </div>
          <div class="mobile-card-author">
            <span class="mobile-card-avatar">{{ (authorName || '张三李四').charAt(0) }}</span>
            <span class="mobile-card-name">{{ authorName || '张三李四' }}</span>
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
</template>

<script setup lang="ts">
import { ref, onUnmounted, reactive, onBeforeMount } from 'vue'
import {  freelogApp, widgetApi } from "freelog-runtime";
import QrcodeVue from 'qrcode.vue'
import { shareBtns, shareBtnsMobile } from '../api/shareData'
import type { ShareBtnItem } from '../api/shareData'
import { MOBILE_BREAKPOINT } from '../constants/breakpoint'

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
      qrcodeShow: false,
      qrcodeInfo: { name: "", url: "" },
    });


const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
}

const qrcodeVisible = ref(false)
const qrcodeInfo = ref({ name: '', url: '' })



function handleSharePc(item: ShareBtnItem) {
  if (item.id === 'copy') {
    handleCopy()
    return
  }
  handleShare(item)
}

function handleShare(item: ShareBtnItem) {
  const url = data.href || props.href
  const title = props.title || ''
  const text = data.shareText || ''
  const image = ''

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
    qrcodeInfo.value = { name: item.name, url }
    qrcodeVisible.value = true
  }
}

function handleShareMobile(item: ShareBtnItem) {
  if (item.id === 'copy') {
    handleCopy()
    return
  }
  if (item.id === 'download') {
    showToast('下载名片功能需主应用配合')
    return
  }
  handleShare(item)
}

function handleDownloadCard() {
  showToast('下载名片功能需主应用配合')
}

function handleCopy() {
  const id = isMobile.value ? 'share-href-mobile' : 'share-href-pc'
  const input = document.getElementById(id) as HTMLInputElement
  if (input) {
    input.select()
    document.execCommand('copy')
    showToast('链接已复制')
  }
}


function showToast(msg: string) {
  const el = document.createElement('div')
  el.className = 'share-toast'
  el.textContent = msg
  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('share-toast--show'))
  setTimeout(() => {
    el.classList.remove('share-toast--show')
    setTimeout(() => el.remove(), 300)
  }, 1500)
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
      let params = {};
      widgetApi.addDataListener((props: any) => {
        data.show = props.show;
      }, true);

      const widgetConfig = widgetApi.getData();

      const type = widgetConfig.type || "展品";
      data.exhibit = widgetConfig.exhibit;
      const { exhibitId, itemId, collection } = widgetConfig.exhibit;
      
      if (type === "漫画") {
        if (itemId) {
          params = { exhibitId, itemId, query: { collection } };
        } else {
          params = { exhibitId };
        }

        data.href = (freelogApp as any).getShareUrl(
          params,
          widgetConfig.routerType
        );
      } else if (type === "小说") {
        if (itemId) {
          params = { exhibitId, itemId, query: { collection } };
        } else {
          params = { exhibitId };
        }

        data.href = (freelogApp as any).getShareUrl(
          params,
          widgetConfig.routerType
        );
      } else if (type === "博客") {
        if (itemId) {
          params = { exhibitId, itemId };
        } else {
          params = { exhibitId };
        }

        data.href = (freelogApp as any).getShareUrl(
          params,
          widgetConfig.routerType
        );
      } else {
        data.href = freelogApp.getShareUrl(
          widgetConfig.exhibit.exhibitId,
          widgetConfig.routerType
        );
      }

      data.shareText = `我在freelog发现一个不错的${type}：\n《${data.exhibit.exhibitTitle}》\n${data.href}`;
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

.share-pc-brand {
  width: 150px;
  height: 60px;
  background-color: pink;
  margin-bottom: 4px;
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
  background-color: pink;
  margin: auto;

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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.qrcode-fade-enter-active,
.qrcode-fade-leave-active {
  transition: opacity 0.2s ease;
}

.qrcode-fade-enter-from,
.qrcode-fade-leave-to {
  opacity: 0;
}
</style>
