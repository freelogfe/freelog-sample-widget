<script setup lang="ts">
import { onBeforeMount, ref } from "vue";
import { widgetApi } from "freelog-runtime";
import CommentWidget from "./components/CommentWidget.vue";

const theme = ref<"light" | "dark">("light");
const layout = ref<"drawer" | "vertical">("drawer");
const show = ref(false);
const onCloseRef = ref<(() => void) | undefined>();
const onLoginRef = ref<(() => void) | undefined>();
const pageBackground = ref<string | undefined>();
const pageColor = ref<string | undefined>();
const textPrimary = ref<string | undefined>();
const textSecondary = ref<string | undefined>();
const borderColor = ref<string | undefined>();
const exhibitId = ref<string | undefined>();
const itemId = ref<string | undefined>();
const avatarUrl = ref<string | undefined>();
const currentUserId = ref<number | undefined>();
const isNodeAdmin = ref(false);
const isLoggedIn = ref(true); // 本地调试：已登录 / 未登录

// const toggleTheme = () => {
//   theme.value = theme.value === "light" ? "dark" : "light";
// };

// const toggleMode = () => {
//   layout.value = layout.value === "drawer" ? "vertical" : "drawer";
// };

// const toggleLogin = () => {
//   isLoggedIn.value = !isLoggedIn.value;
// };

function applyWidgetData(data: Record<string, unknown> | null | undefined) {
  if (!data) return;
  if (data.layout === "drawer" || data.layout === "vertical") {
    layout.value = data.layout;
  }
  if (typeof data.show === "boolean") {
    console.log("data.show", data.show);
    show.value = data.show;
  }
  if (typeof data.onClose === "function") {
    onCloseRef.value = data.onClose as () => void;
  }
  if (typeof data.onLogin === "function") {
    onLoginRef.value = data.onLogin as () => void;
  }
  if ("isLoggedIn" in data) {
    isLoggedIn.value = data.isLoggedIn as boolean;
  }
  if (data.theme === "light" || data.theme === "dark") {
    theme.value = data.theme;
  }
  if ("pageBackground" in data) {
    pageBackground.value =
      typeof data.pageBackground === "string" && data.pageBackground.trim()
        ? data.pageBackground.trim()
        : undefined;
  }
  if ("pageColor" in data) {
    pageColor.value =
      typeof data.pageColor === "string" && data.pageColor.trim()
        ? data.pageColor.trim()
        : undefined;
  }
  if ("textPrimary" in data) {
    textPrimary.value =
      typeof data.textPrimary === "string" && data.textPrimary.trim()
        ? data.textPrimary.trim()
        : undefined;
  }
  if ("textSecondary" in data) {
    textSecondary.value =
      typeof data.textSecondary === "string" && data.textSecondary.trim()
        ? data.textSecondary.trim()
        : undefined;
  }
  if ("borderColor" in data) {
    borderColor.value =
      typeof data.borderColor === "string" && data.borderColor.trim()
        ? data.borderColor.trim()
        : undefined;
  }
  if ("avatarUrl" in data) {
    avatarUrl.value =
      typeof data.avatarUrl === "string" && data.avatarUrl.trim()
        ? data.avatarUrl.trim()
        : undefined;
  }
  if ("currentUserId" in data) {
    const raw = data.currentUserId;
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    currentUserId.value = Number.isFinite(n) ? n : undefined;
  }
  if ("isNodeAdmin" in data) {
    isNodeAdmin.value = data.isNodeAdmin as boolean;
  }
  if (typeof data.exhibitId === "string" && data.exhibitId.trim()) {
    exhibitId.value = data.exhibitId.trim();
  }
  if (typeof data.itemId === "string" && data.itemId.trim()) {
    itemId.value = data.itemId.trim();
  }
}

const handleDrawerCloseFromChild = () => {
  onCloseRef.value?.();
};

const handleLoginFromChild = () => {
  onLoginRef.value?.();
};

/** 宿主通过 freelog-runtime 注入 / 更新 data（含 setData 合并结果） */
const initHostData = () => {
  try {
    const initial = widgetApi.getData?.() as Record<string, unknown> | undefined;
    applyWidgetData(initial);
    widgetApi.addDataListener?.((props: Record<string, unknown>) => {
      // console.log("props", props);
      applyWidgetData(props);
    }, true);
  } catch {
    /* 独立运行无宿主 */
  }
};

onBeforeMount(() => {
  initHostData();
});
</script>

<template>
  <div id="comment-widget-container" :class="`theme-${theme}`">
    <!-- <div class="controls">
      <button @click="toggleTheme">
        切换主题: {{ theme === "light" ? "☀️ 亮色" : "🌙 暗色" }}
      </button>
      <button @click="toggleMode">
        切换模式: {{ layout === "drawer" ? "抽屉(drawer)" : "垂直(vertical)" }}
      </button>
      <button @click="toggleLogin">
        {{ isLoggedIn ? "👤 已登录" : "👤 未登录" }}
      </button>
    </div> -->

    <CommentWidget
      :theme="theme"
      :layout="layout"
      :show="show"
      :is-node-admin="isNodeAdmin"
      :exhibit-id="exhibitId"
      :item-id="itemId"
      :avatar-url="avatarUrl"
      :current-user-id="currentUserId"
      :on-close="handleDrawerCloseFromChild"
      :on-login="handleLoginFromChild"
      :is-logged-in="isLoggedIn"
      :page-background="pageBackground"
      :page-color="pageColor"
      :text-primary="textPrimary"
      :text-secondary="textSecondary"
      :border-color="borderColor"
    />
  </div>
</template>

<style>
#comment-widget-container {
  width: 100%;
  min-height: 100%;
}

#comment-widget-container.theme-light {
  background-color: #f5f5f5;
  color: #222222;
}

#comment-widget-container.theme-dark {
  background-color: #444444;
  color: #ffffff;
}

.controls {
  position: fixed;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 10px;
  z-index: 9999;
}

.controls button {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.theme-dark .controls button {
  background: rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.controls button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
