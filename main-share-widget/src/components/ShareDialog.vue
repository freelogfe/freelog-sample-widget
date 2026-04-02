<template>
  <!-- PC 端 -->
  <input
    id="share-href-pc"
    type="text"
    class="share-hidden-input"
    :value="data.nodeInfo.nodeUrl"
    readonly
    tabindex="-1"
  />
  <Transition name="share-fade">
    <div v-show="data.show && !isMobile" class="share-overlay" @click.self="handleCloseModal">
      <Transition name="share-scale">
        <div v-show="data.show && !isMobile" class="share-dialog--pc">
          <button type="button" class="share-close" aria-label="关闭" @click="handleCloseModal">
            <img src="../assets/share-close.svg" alt="close" class="share-close-icon" />
          </button>
          <div class="share-title">分享</div>
          <div class="share-pc-body">
            <div class="share-pc-left">
              <div
                class="share-pc-card"
                ref="pcCardRef"
                :style="{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '300px',
                  height: '400px',
                  padding: '20px 30px',
                  background: '#fafbfc',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }"
              >
                <div
                  class="share-pc-node-info"
                  :style="{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    height: '146px',
                    boxSizing: 'border-box'
                  }"
                >
                  <div
                    v-if="data.nodeInfo.nodeLogo"
                    class="share-pc-node-logo"
                    role="img"
                    aria-label="节点logo"
                    :style="{
                      width: '150px',
                      height: '60px',
                      margin: '0 auto',
                      backgroundImage: `url(${JSON.stringify(data.nodeInfo.nodeLogo)})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      backgroundSize: 'contain'
                    }"
                  />

                  <h3
                    v-if="data.nodeInfo.nodeTitle"
                    class="share-pc-card-title"
                    :style="{
                      fontSize: '16px',
                      fontWeight: 600,
                      fontFamily: 'Noto-Sans-Regular',
                      lineHeight: '20px',
                      margin: '15px 0',
                      color: '#000000',
                      width: '100%',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      boxSizing: 'border-box'
                    }"
                  >
                    {{ data.nodeInfo.nodeTitle }}
                  </h3>

                  <div
                    v-if="data.nodeInfo.nodeShortDescription"
                    class="share-pc-desc"
                    :style="{
                      fontSize: '12px',
                      fontWeight: 400,
                      fontFamily: 'Noto-Sans-Regular',
                      color: '#000000',
                      lineHeight: '18px',
                      minHeight: '36px',
                      width: '100%',
                      minWidth: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      lineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      wordBreak: 'break-all',
                      boxSizing: 'border-box'
                    }"
                  >
                    {{ data.nodeInfo.nodeShortDescription }}
                  </div>
                </div>

                <div
                  class="share-pc-qr-wrap"
                  :style="{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '15px 0',
                    padding: '5px 8px',
                    background: '#fff',
                    borderRadius: '20px',
                    border: '1px solid #e4e7eb'
                  }"
                >
                  <div
                    :style="{
                      width: CARD_QR_VIEW_PX + 'px',
                      height: CARD_QR_VIEW_PX + 'px',
                      overflow: 'hidden',
                      position: 'relative',
                      flexShrink: 0
                    }"
                  >
                    <div
                      :style="{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: CARD_QR_CANVAS_PX + 'px',
                        height: CARD_QR_CANVAS_PX + 'px',
                        transform: `translate(-50%, -50%) scale(${cardQrScale})`,
                        transformOrigin: 'center center'
                      }"
                    >
                      <QrcodeVue
                        :value="data.nodeInfo.nodeUrl"
                        :size="CARD_QR_CANVAS_PX"
                        level="Q"
                        :margin="1"
                        class="qr-code"
                      />
                    </div>
                  </div>
                </div>
                <div
                  class="share-pc-author"
                  :style="{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    boxSizing: 'border-box',
                    fontSize: '12px',
                    fontWeight: 400,
                    color: '#999999'
                  }"
                >
                  <span
                    class="share-pc-avatar"
                    role="img"
                    aria-label="用户头像"
                    :style="{
                      width: '18px',
                      height: '18px',
                      minWidth: '18px',
                      marginRight: '5px',
                      borderRadius: '50%',
                      backgroundColor: '#999999',
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      backgroundImage: data.nodeInfo.avatarUrl
                        ? `url(${JSON.stringify(data.nodeInfo.avatarUrl)})`
                        : 'none',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      backgroundSize: 'contain'
                    }"
                  />
                  <span class="share-pc-name">{{ data.nodeInfo.ownerUserName }}</span>
                  <span
                    class="share-pc-divider"
                    :style="{
                      display: 'inline-block',
                      width: '1px',
                      height: '12px',
                      background: '#e4e7eb',
                      margin: '0 20px',
                      flexShrink: 0
                    }"
                  ></span>
                  <img
                    class="share-pc-freelog-wrap"
                    :src="freelogLogo"
                    alt="freelog"
                    :style="{
                      width: '46px',
                      height: '10px',
                      opacity: 0.3,
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      flexShrink: 0,
                      objectFit: 'contain'
                    }"
                  />
                </div>
              </div>
              <button type="button" class="share-pc-download" @click="handleDownloadCard">
                <img
                  src="../assets/share-icons/download.svg"
                  alt="download"
                  class="share-pc-download-icon"
                />
                下载二维码名片
              </button>
            </div>
            <div class="share-pc-right">
              <button
                v-for="item in shareBtns"
                :key="item.id"
                type="button"
                class="share-pc-cell"
                @click="handleShareItem(item)"
              >
                <span class="share-pc-cell-icon" :class="{ 'has-border': item.id === 'copy' }">
                  <img
                    :src="item.icon"
                    :alt="item.name"
                    :class="item.id === 'copy' ? 'has-border-icon' : 'normal-icon'"
                  />
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
  <input
    id="share-href-mobile"
    type="text"
    class="share-hidden-input"
    :value="data.nodeInfo.nodeUrl"
    readonly
    tabindex="-1"
  />
  <Transition name="share-slide-up">
    <div v-show="data.show && isMobile" id="mobile-share-wrap" class="mobile-share-wrap">
      <div class="mobile-panels" @click.self="handleCloseModal">
        <div
          class="mobile-card"
          ref="mobileCardRef"
          :style="{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '300px',
            height: '400px',
            padding: '20px 30px',
            background: '#fafbfc',
            borderRadius: '12px',
            textAlign: 'center',
            boxSizing: 'border-box',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }"
        >
          <div
            class="mobile-card-node-info"
            :style="{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              height: '146px',
              boxSizing: 'border-box'
            }"
          >
            <div
              v-if="data.nodeInfo.nodeLogo"
              class="mobile-card-header"
              role="img"
              aria-label="节点logo"
              :style="{
                width: '150px',
                height: '60px',
                margin: '0 auto',
                backgroundImage: `url(${JSON.stringify(data.nodeInfo.nodeLogo)})`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'contain'
              }"
            />
            <h3
              v-if="data.nodeInfo.nodeTitle"
              class="mobile-card-title"
              :style="{
                fontSize: '16px',
                fontWeight: 600,
                fontFamily: 'Noto-Sans-Regular',
                lineHeight: '20px',
                margin: '15px 0',
                color: '#000000',
                width: '100%',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box'
              }"
            >
              {{ data.nodeInfo.nodeTitle }}
            </h3>
            <div
              v-if="data.nodeInfo.nodeShortDescription"
              class="mobile-card-desc"
              :style="{
                fontSize: '12px',
                fontWeight: 400,
                fontFamily: 'Noto-Sans-Regular',
                color: '#000000',
                lineHeight: '18px',
                minHeight: '36px',
                width: '100%',
                minWidth: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                lineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-all',
                boxSizing: 'border-box'
              }"
            >
              {{ data.nodeInfo.nodeShortDescription }}
            </div>
          </div>
          <div
            class="share-pc-qr-wrap"
            :style="{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '15px 0',
              padding: '5px 8px',
              background: '#fff',
              borderRadius: '20px',
              border: '1px solid #e4e7eb'
            }"
          >
            <div
              :style="{
                width: CARD_QR_VIEW_PX + 'px',
                height: CARD_QR_VIEW_PX + 'px',
                overflow: 'hidden',
                position: 'relative',
                flexShrink: 0
              }"
            >
              <div
                :style="{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: CARD_QR_CANVAS_PX + 'px',
                  height: CARD_QR_CANVAS_PX + 'px',
                  transform: `translate(-50%, -50%) scale(${cardQrScale})`,
                  transformOrigin: 'center center'
                }"
              >
                <QrcodeVue
                  :value="data.nodeInfo.nodeUrl"
                  :size="CARD_QR_CANVAS_PX"
                  level="Q"
                  :margin="1"
                  class="qr-code"
                />
              </div>
            </div>
          </div>
          <div
            class="mobile-card-author"
            :style="{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              boxSizing: 'border-box',
              fontSize: '12px',
              fontWeight: 400,
              color: '#999999'
            }"
          >
            <span
              class="mobile-card-avatar"
              role="img"
              aria-label="用户头像"
              :style="{
                width: '18px',
                height: '18px',
                minWidth: '18px',
                marginRight: '5px',
                borderRadius: '50%',
                backgroundColor: '#999999',
                display: 'inline-block',
                verticalAlign: 'middle',
                backgroundImage: data.nodeInfo.avatarUrl
                  ? `url(${JSON.stringify(data.nodeInfo.avatarUrl)})`
                  : 'none',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'contain'
              }"
            />
            <span
              class="mobile-card-name"
              :style="{
                fontFamily: 'Noto-Sans-Regular',
                color: '#999',
                fontSize: '10px',
                fontWeight: 400,
                lineHeight: '18px'
              }"
            >
              {{ data.nodeInfo.ownerUserName }}
            </span>
            <span
              class="mobile-card-divider"
              :style="{
                display: 'inline-block',
                width: '1px',
                height: '12px',
                background: '#e4e7eb',
                margin: '0 20px',
                flexShrink: 0
              }"
            ></span>
            <img
              class="mobile-card-freelog-wrap"
              :src="freelogLogo"
              alt="freelog"
              :style="{
                width: '46px',
                height: '10px',
                opacity: 0.3,
                display: 'inline-block',
                verticalAlign: 'middle',
                flexShrink: 0,
                objectFit: 'contain'
              }"
            />
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
            @click="handleShareItem(item)"
          >
            <span
              class="mobile-share-icon"
              :class="['download', 'copy'].includes(item.id) && 'has-border'"
            >
              <img
                :src="item.icon"
                :alt="item.name"
                :class="['download', 'copy'].includes(item.id) ? 'has-border-icon' : 'normal-icon'"
              />
            </span>
            <span class="mobile-share-label">{{ item.name }}</span>
          </button>
        </div>
        <div class="mobile-share-divider"></div>
        <div class="mobile-cancel" @click="handleCloseModal">取消</div>
      </div>
    </div>
  </Transition>

  <!-- 微信/QQ 二维码分享弹窗 -->
  <Transition name="qrcode-fade">
    <div v-if="qrcodeVisible" class="qrcode-popup-wrapper" @click="qrcodeVisible = false">
      <div class="qrcode-popup" @click.stop>
        <button
          type="button"
          class="qrcode-close-btn"
          aria-label="关闭"
          @click="qrcodeVisible = false"
        >
          <img src="../assets/share-close.svg" alt="close" class="qrcode-close-icon" />
        </button>
        <div class="qrcode-text">分享到{{ qrcodeInfo.alias }}</div>
        <QrcodeVue :value="qrcodeInfo.url" :size="220" level="M" />
        <div class="qrcode-text">使用{{ qrcodeInfo.alias }}扫一扫完成分享</div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onUnmounted, reactive, onBeforeMount } from "vue";
import { widgetApi } from "freelog-runtime";
import QrcodeVue from "qrcode.vue";
import { snapdom } from "@zumer/snapdom";
import { shareBtns, shareBtnsMobile } from "../api/shareData";
import type { ShareBtnItem } from "../api/shareData";
import { MOBILE_BREAKPOINT } from "../constants/breakpoint";
import { showToast } from "../utils/common";
import freelogLogo from "../assets/freelog.png";

const data = reactive({
  show: false,
  exhibit: {} as any,
  shareText: "",
  nodeInfo: {} as any
});

const isMobile = ref(false);

function checkMobile() {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT;
}

const qrcodeVisible = ref(false);
const qrcodeInfo = ref();
const pcCardRef = ref<HTMLElement | null>(null);
const mobileCardRef = ref<HTMLElement | null>(null);

/** 名片上视觉约 144px；canvas 用更高分辨率再 scale 缩小，避免导出时被 snapdom 放大插值发糊 */
const CARD_QR_VIEW_PX = 144;
const SNAPDOM_EXPORT_SCALE = 3;
const CARD_QR_CANVAS_PX = CARD_QR_VIEW_PX * SNAPDOM_EXPORT_SCALE;
const cardQrScale = CARD_QR_VIEW_PX / CARD_QR_CANVAS_PX;

/** 名片里用到的远程图：未解码完就 snapdom 会偶发空白；OSS 需对页面 Origin 配好 CORS */
function getShareCardRemoteImageUrls(): string[] {
  const urls: string[] = [];
  const logo = data.nodeInfo?.nodeLogo;
  const avatar = data.nodeInfo?.avatarUrl;
  if (typeof logo === "string" && logo && !logo.startsWith("data:")) urls.push(logo);
  if (typeof avatar === "string" && avatar && !avatar.startsWith("data:")) urls.push(avatar);
  return [...new Set(urls)];
}

function preloadImageForCapture(url: string): Promise<void> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const done = () => resolve();
    img.onload = () => {
      img.decode?.().then(done).catch(done);
    };
    img.onerror = done;
    img.src = url;
  });
}

async function ensureShareCardImagesReady() {
  const urls = getShareCardRemoteImageUrls();
  if (urls.length === 0) return;
  await Promise.all(urls.map(preloadImageForCapture));
  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

function handleShareItem(item: ShareBtnItem) {
  if (item.id === "copy") return handleCopy();
  if (item.id === "download") return handleDownloadCard();
  const url = data.nodeInfo.nodeUrl;
  const title = data.nodeInfo.nodeTitle || "";
  const text = data.shareText || "";
  const image = data.nodeInfo?.nodeLogo;
  if (item.id === "qqZone") {
    window.open(
      `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(url)}&desc=${encodeURIComponent(text)}&summary=&title=${encodeURIComponent(title)}&pics=${encodeURIComponent(image)}`
    );
  } else if (item.id === "weibo") {
    window.open(
      `https://service.weibo.com/share/share.php?title=${encodeURIComponent(text)}&pic=${encodeURIComponent(image)}`
    );
  } else if (item.id === "douban") {
    window.open(
      `https://www.douban.com/share/service?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&image=${encodeURIComponent(image)}`
    );
  } else if (["qq", "wechat"].includes(item.id)) {
    qrcodeInfo.value = { name: item.name, alias: item.alias, url };
    qrcodeVisible.value = true;
  }
}

async function handleDownloadCard() {
  const el = isMobile.value ? mobileCardRef.value : pcCardRef.value;

  if (!el) {
    showToast("名片未就绪");
    return;
  }
  showToast("正在生成名片...");
  const node = el as HTMLElement;
  const prevInline = node.style.cssText;
  node.style.setProperty("border", "none");
  node.style.setProperty("border-radius", "0");
  try {
    await ensureShareCardImagesReady();

    const result = await snapdom(node, {
      backgroundColor: "#fafbfc",
      scale: SNAPDOM_EXPORT_SCALE,
      quality: 1,
      embedFonts: true,
      localFonts: [
        {
          family: "Noto-Sans-Regular",
          src: "../fonts/NotoSans-Regular.ttf"
        }
      ]
    });
    const filename = `二维码名片-${(data.nodeInfo.nodeTitle || "share").replace(/[<>:"/\\|?*]/g, "_")}.jpg`;
    const blob = await result.toBlob({ type: "jpeg", quality: 0.92 });
    const file = new File([blob], filename, { type: "image/jpeg" });

    // 移动端：优先弹出分享页，用户选择「保存图片」即可存到相册（首次点击即弹出）
    if (isMobile.value && navigator.share) {
      try {
        await navigator.share({
          files: [file],
          title: "二维码名片"
        });
        showToast("已保存");
      } catch (shareErr: any) {
        if (shareErr?.name === "AbortError") {
          showToast("已取消");
          return;
        }
        await result.download({ format: "jpeg", filename } as { format: string; filename: string });
        showToast("已下载");
      }
    } else {
      await result.download({ format: "jpeg", filename } as { format: string; filename: string });
      showToast("已下载");
    }
  } catch (e) {
    console.error("[snapdom]", e);
    showToast("下载名片失败");
  } finally {
    node.style.cssText = prevInline;
  }
}

function handleCopy() {
  const id = isMobile.value ? "share-href-mobile" : "share-href-pc";
  const input = document.getElementById(id) as HTMLInputElement;
  if (input) {
    input.select();
    document.execCommand("copy");
    showToast("链接复制成功～");
  }
}

function handleCloseModal() {
  if (isMobile.value) {
    const el = document.getElementById("mobile-share-wrap");
    if (el) el.style.display = "none";
  } else {
    data.show = false;
    const widgetConfig = widgetApi.getData();
    widgetConfig.onClose();
  }
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
  checkMobile();
  (window as any).__MICRO_APP_ENVIRONMENT__ && initData();
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", checkMobile);
  }
});
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

.share-pc-qr-wrap :deep(canvas) {
  display: block;
}

.share-pc-name,
.mobile-card-name {
  color: #999999;
  font-family: "Noto-Sans-Regular";
}

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

  img {
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
  /* font-family:
    -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
    sans-serif; */
}

.mobile-panels {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.mobile-share-panel {
  flex-shrink: 0;
  background: #ffffff;
  padding: 20px;
  border-radius: 20px 20px 0 0;
}

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
  background: #e4e7eb;
  margin: 15px 0;
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

  &.has-border {
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
  color: #222;
  text-align: center;
}

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
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.share-scale-enter-from,
.share-scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}

.share-slide-up-enter-active,
.share-slide-up-leave-active {
  transition:
    transform 0.3s ease-out,
    opacity 0.3s ease;
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
