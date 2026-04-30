<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from "vue";
import {
  createComment,
  deleteComment,
  fetchChildCommentList,
  fetchCommentList,
  reportComment,
  toggleCommentBlock,
  toggleCommentLike,
  type CommentCreatedDTO,
  type CommentListPageData,
  type CommentThreadItem
} from "@/api/modules/comment";
import type { FreelogApiBody } from "@/api/types";
import { isFreelogApiSuccess } from "@/api/types";
import iconLikeFull from "@/assets/icon-like-full.svg";
import LikeIconOutline from "./LikeIconOutline.vue";

interface Props {
  theme?: "light" | "dark";
  layout?: "drawer" | "vertical";
  show?: boolean;
  /** 节点商 / 节点管理员：可删除、屏蔽评论 */
  isNodeAdmin?: boolean;
  /** 展品 ID：宿主通过 widget data 传入；变化时重新请求评论列表 */
  exhibitId?: string;
  /** 展品子项 ID */
  itemId?: string;
  avatarUrl?: string;
  /** 抽屉关闭时回传主应用，与 data.onClose 一致 */
  onClose?: () => void;
  onLogin?: () => void;
  isLoggedIn?: boolean;
  /** 宿主页背景（如音乐主题 --bg-color），与评论区底色一致 */
  pageBackground?: string;
  /** 第一层级文字色：标题、正文、主按钮文案等 */
  textPrimary?: string;
  /** 第二层级文字色：时间、次信息、弱化说明*/
  textSecondary?: string;
}

const props = withDefaults(defineProps<Props>(), {
  theme: "light",
  layout: "vertical",
  show: false,
  isLoggedIn: false
});

const verticalContainerWidth = computed(() => {
  const width = document.querySelector(".vertical-container")?.clientWidth;
  return width ? `${width}px` : "100%";
});

/** 宿主注入的页面背景与字色，覆盖 theme-light/theme-dark 内默认 token */
const hostSurfaceStyle = computed(() => {
  const s: Record<string, string> = {};
  if (props.pageBackground) s.background = props.pageBackground;
  if (props.textPrimary) s["--text-primary"] = props.textPrimary;
  if (props.textSecondary) s["--text-secondary"] = props.textSecondary;
  return Object.keys(s).length ? s : undefined;
});

interface Comment {
  id: string;
  username: string;
  userRole?: "curator" | "creator";
  content: string;
  time: string;
  /** 无头像图时的占位色（mock） */
  avatar: string;
  /** 若接口已给完整头像地址可优先用 */
  avatarUrl?: string;
  /** 用于拼接默认头像 CDN，与 avatarUrl 二选一逻辑见 commentAvatarStyle */
  userId?: number;
  likes: number;
  isLiked?: boolean;
  isBlocked?: boolean;
  isExpanded?: boolean;
  replyTo?: string;
  replies?: Comment[];
  totalReplies?: number;
  showAllReplies?: boolean;
  currentReplyPage?: number;
  showReplyInput?: boolean;
  /** 主列表 replies≥10 或 replyCount>已嵌条数，需继续调 replyPage */
  needsSubReplyFetch?: boolean;
  /** 已成功用 replyPage 同步过 totalItem */
  replyMetaSynced?: boolean;
  repliesLoading?: boolean;
}

const drawerVisible = ref(false);
const commentInput = ref("");
const replyingTo = ref<Comment | null>(null);
const comments = ref<Comment[]>([]);

// 更多菜单相关
const showMoreMenu = ref<string | null>(null);
const moreMenuPosition = ref({ x: 0, y: 0 });

// 举报弹窗相关
const showReportDialog = ref(false);
const reportReason = ref<string>("");
const reportDetail = ref("");
const reportSuccess = ref(false);
/** 打开举报弹窗时写入，避免关闭「更多」菜单后丢失被举报评论 id */
const reportTargetCommentId = ref<string | null>(null);
const reportSubmitting = ref(false);

const REPORT_REASON_LABELS: Record<string, string> = {
  spam: "垃圾内容或违规商业推广",
  violence: "色情、暴力",
  harassment: "骚扰、欺诈",
  false: "不实信息",
  other: "其他"
};

function buildReportContent(): string {
  const key = reportReason.value;
  const label = REPORT_REASON_LABELS[key] ?? key;
  if (key === "other") {
    return `${label}：${reportDetail.value.trim()}`;
  }
  return label;
}

function closeReportDialog() {
  showReportDialog.value = false;
  reportSuccess.value = false;
  reportReason.value = "";
  reportDetail.value = "";
  reportTargetCommentId.value = null;
}

// 底部悬浮输入框
const showFloatingInput = ref(false);
const inputContainerRef = ref<HTMLElement | null>(null);
const commentListRef = ref<HTMLElement | null>(null);
const drawerInputRef = ref<HTMLElement | null>(null);
const drawerListRef = ref<HTMLElement | null>(null);
const drawerBodyRef = ref<HTMLElement | null>(null);
/** 一级列表滚动加载：底部锚点（垂直 / 抽屉共用 ref，二者互斥渲染） */
const rootLoadMoreSentinelRef = ref<HTMLElement | null>(null);

const toggleDrawer = () => {
  drawerVisible.value = !drawerVisible.value;

  // 抽屉打开后检查是否需要显示悬浮输入框
  if (drawerVisible.value) {
    setTimeout(handleDrawerScroll, 100);
  } else {
    showFloatingInput.value = false;
    props.onClose?.();
  }
};

watch(
  () => [props.show, props.layout] as const,
  ([showVal, layoutVal]) => {
    if (layoutVal !== "drawer") return;
    drawerVisible.value = !!showVal;
    if (showVal) {
      setTimeout(handleDrawerScroll, 100);
    } else {
      showFloatingInput.value = false;
    }
  },
  { immediate: true }
);

const commentsLoading = ref(false);
/** 一级评论列表分页：接口 totalItem */
const commentRootTotal = ref(0);
const commentsLoadingMore = ref(false);
const commentsHasMore = computed(
  () => commentRootTotal.value > 0 && comments.value.length < commentRootTotal.value
);
const publishSubmitting = ref(false);
const blockSubmitting = ref(false);
const deleteSubmitting = ref(false);

function formatCommentTime(iso: string | undefined): string {
  if (!iso?.trim()) return "";
  const raw = iso.trim();
  const t = Date.parse(raw);
  if (Number.isNaN(t)) {
    return raw.slice(0, 16).replace("T", " ");
  }
  const d = new Date(t);
  const now = Date.now();
  const diffMs = now - t;
  const skewFutureMs = t - now;

  // 轻微时钟偏差仍显示「刚刚」
  if (skewFutureMs >= 0 && skewFutureMs < 120_000) {
    return "刚刚";
  }
  if (diffMs >= 0 && diffMs < 60_000) {
    return "刚刚";
  }
  if (diffMs >= 0 && diffMs < 3600_000) {
    return `${Math.max(1, Math.floor(diffMs / 60_000))}分钟前`;
  }
  if (diffMs >= 0 && diffMs < 86400_000) {
    return `${Math.max(1, Math.floor(diffMs / 3600_000))}小时前`;
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

/** 评论头像：优先 avatarUrl，否则用 userId 拼 CDN，最后用色块 avatar */
function commentAvatarStyle(c: Comment): Record<string, string> {
  const url =
    c.avatarUrl?.trim() ||
    (c.userId != null && Number.isFinite(c.userId)
      ? `https://image.freelog.cn/avatar/${c.userId}`
      : "");
  if (url) {
    return {
      backgroundImage: `url(${JSON.stringify(url)})`,
      backgroundSize: "cover",
      backgroundPosition: "center center",
      backgroundRepeat: "no-repeat",
      backgroundColor: "#e8e8e8"
    };
  }
  return { background: c.avatar };
}

/**
 * 主列表嵌套 replies 的常见条数上限：达到 10 条即可能未带全，需用 /comments/replyPage 校准总数并续拉。
 * （严格大于 10 会漏掉「刚好嵌 10 条但 replyCount 更大」的情况。）
 */
const MAIN_LIST_EMBEDDED_REPLY_CAP = 10;
/** 一级评论分页 page 接口每页条数 */
const ROOT_COMMENT_PAGE_LIMIT = 30;

function rootNeedsSubReplyPage(item: CommentThreadItem): boolean {
  const n = (item.replies ?? []).length;
  if (n === 0) return false;

  return n >= MAIN_LIST_EMBEDDED_REPLY_CAP;
}

/** 后端无 userRole：用 articleUserId / nodeUserId 与评论 userId 推断；两者同时命中时创作者优先 */
function inferCommentUserRole(item: CommentThreadItem): Comment["userRole"] {
  const uid = item.userId;
  if (uid == null || Number.isNaN(Number(uid))) return undefined;
  const u = Number(uid);

  const articleUid = item.articleUserId;
  if (articleUid != null && !Number.isNaN(Number(articleUid)) && Number(articleUid) === u) {
    return "creator";
  }

  const nodeUid = item.nodeUserId;
  if (nodeUid != null && !Number.isNaN(Number(nodeUid)) && Number(nodeUid) === u) {
    return "curator";
  }

  return undefined;
}

function mapThreadToComment(item: CommentThreadItem, isRootThread = true): Comment {
  const id = String(item.id ?? item._id ?? "");
  const children = (item.replies ?? []).map(ch => mapThreadToComment(ch, false));
  const replyTo =
    item.recipientInfo?.username != null && String(item.recipientInfo.username).trim()
      ? String(item.recipientInfo.username)
      : undefined;
  return {
    id,
    username: String(item.username ?? ""),
    content: item.content,
    time: formatCommentTime(item.createDate),
    avatar: "#e8e8e8",
    userId: item.userId,
    likes: item.likeCount ?? 0,
    isLiked: item.isLike,
    isBlocked: item.status === "blocked",
    replyTo,
    replies: children.length ? children : undefined,
    totalReplies: children.length,
    showAllReplies: false,
    currentReplyPage: 1,
    userRole: inferCommentUserRole(item),
    ...(isRootThread && rootNeedsSubReplyPage(item) ? { needsSubReplyFetch: true } : {})
  };
}

function mergeRootCommentsById(existing: Comment[], batch: Comment[]): Comment[] {
  const seen = new Set(existing.map(c => c.id));
  const out = [...existing];
  for (const c of batch) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
    }
  }
  return out;
}

async function fetchRootCommentPage(
  exhibitId: string,
  skip: number
): Promise<{ list: CommentThreadItem[]; totalItem: number } | null> {
  const raw = await fetchCommentList({
    exhibitId,
    ...(props.itemId?.trim() ? { itemId: props.itemId.trim() } : {}),
    skip,
    limit: ROOT_COMMENT_PAGE_LIMIT
  });
  const res = raw as unknown as FreelogApiBody<CommentListPageData>;
  if (!isFreelogApiSuccess(res)) {
    return null;
  }
  const data = res.data;
  const list = data?.dataList ?? [];
  const reported =
    typeof data?.totalItem === "number" && data.totalItem >= 0
      ? data.totalItem
      : skip + list.length;
  const totalItem = Math.max(reported, skip + list.length);
  return { list, totalItem };
}

async function syncCommentsFromApi(exhibitId: string) {
  commentsLoading.value = true;
  commentRootTotal.value = 0;
  try {
    const page = await fetchRootCommentPage(exhibitId, 0);
    if (!page) {
      comments.value = [];
      return;
    }
    commentRootTotal.value = page.totalItem;
    comments.value = page.list.map(item => mapThreadToComment(item));
    for (const c of comments.value) {
      if (c.needsSubReplyFetch) {
        void ensureReplyMetaSynced(c);
      }
    }
  } finally {
    commentsLoading.value = false;
  }
}

async function loadMoreRootComments() {
  const exhibitId = props.exhibitId?.trim();
  if (!exhibitId || !commentsHasMore.value || commentsLoadingMore.value || commentsLoading.value) {
    return;
  }
  commentsLoadingMore.value = true;
  try {
    const skip = comments.value.length;
    const page = await fetchRootCommentPage(exhibitId, skip);
    if (!page) return;
    commentRootTotal.value = Math.max(commentRootTotal.value, page.totalItem);
    const batch = page.list.map(item => mapThreadToComment(item));
    comments.value = mergeRootCommentsById(comments.value, batch);
    for (const c of batch) {
      if (c.needsSubReplyFetch) {
        void ensureReplyMetaSynced(c);
      }
    }
  } finally {
    commentsLoadingMore.value = false;
  }
}

/** 垂直列表：接近宿主视口底部时加载下一页（兼容 iframe + 父页面滚动） */
function checkVerticalRootLoadMore() {
  if (props.layout !== "vertical") return;
  const exhibitId = props.exhibitId?.trim();
  if (!exhibitId || !commentsHasMore.value || commentsLoadingMore.value || commentsLoading.value) {
    return;
  }

  const anchor =
    rootLoadMoreSentinelRef.value ?? commentListRef.value?.lastElementChild ?? commentListRef.value;
  if (!anchor) return;

  const ar = anchor.getBoundingClientRect();
  const frame = window.frameElement as HTMLIFrameElement | null;
  const threshold = 320;

  if (frame && window.parent) {
    const fr = frame.getBoundingClientRect();
    const anchorBottomOuter = fr.top + ar.bottom;
    if (anchorBottomOuter <= window.parent.innerHeight + threshold) {
      void loadMoreRootComments();
    }
    return;
  }

  if (ar.bottom <= window.innerHeight + threshold) {
    void loadMoreRootComments();
  }
}

function checkDrawerRootLoadMore() {
  if (props.layout !== "drawer" || !drawerVisible.value) return;
  const body = drawerBodyRef.value;
  if (!body) return;
  const exhibitId = props.exhibitId?.trim();
  if (!exhibitId || !commentsHasMore.value || commentsLoadingMore.value || commentsLoading.value) {
    return;
  }
  const gap = body.scrollHeight - body.scrollTop - body.clientHeight;
  if (gap < 200) {
    void loadMoreRootComments();
  }
}

watch(
  () => [props.exhibitId?.trim(), props.itemId ?? ""] as const,
  ([exhibitId]) => {
    if (!exhibitId) return;
    void syncCommentsFromApi(exhibitId);
  },
  { immediate: true }
);

const handleLogin = () => {
  props.onLogin?.();
};

function clearAllReplyInputs() {
  comments.value.forEach(comment => {
    comment.showReplyInput = false;
    if (comment.replies) {
      comment.replies.forEach(reply => {
        reply.showReplyInput = false;
      });
    }
  });
}

const handlePublish = async () => {
  const text = commentInput.value.trim();
  if (!text || publishSubmitting.value) return;

  const exhibitId = props.exhibitId?.trim();
  const replyTarget = replyingTo.value;

  if (!replyTarget && !exhibitId) {
    alert("缺少展品信息，无法发表评论");
    return;
  }

  publishSubmitting.value = true;
  try {
    const itemIdPayload = props.itemId?.trim() ? { itemId: props.itemId.trim() } : {};
    const raw = replyTarget
      ? await createComment({ content: text, parentId: replyTarget.id, ...itemIdPayload })
      : await createComment({ content: text, exhibitId: exhibitId!, ...itemIdPayload });

    const res = raw as unknown as FreelogApiBody<CommentCreatedDTO>;
    if (!isFreelogApiSuccess(res)) {
      alert(res.msg || "发送失败");
      return;
    }

    commentInput.value = "";
    clearAllReplyInputs();
    replyingTo.value = null;

    if (exhibitId) {
      await syncCommentsFromApi(exhibitId);
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : "网络错误，请稍后重试");
  } finally {
    publishSubmitting.value = false;
  }
};

const handleReply = (comment: Comment, parentComment?: Comment) => {
  // 如果点击的是同一个评论的回复按钮，则取消回复
  if (replyingTo.value && replyingTo.value.id === comment.id) {
    cancelReply();
    return;
  }

  replyingTo.value = comment;
  commentInput.value = "";

  // 同时切换：隐藏所有输入框，并显示当前点击的输入框
  // 这样避免了先隐藏再显示造成的闪烁

  // 如果是回复楼中楼，输入框显示在该回复的下方
  if (parentComment) {
    const parentCommentObj = comments.value.find(c => c.id === parentComment.id);

    // 遍历所有评论，一次性完成切换
    comments.value.forEach(c => {
      if (c.id === parentComment.id && parentCommentObj && parentCommentObj.replies) {
        c.showReplyInput = false;
        // 显示目标回复的输入框，隐藏其他回复的输入框
        if (c.replies) {
          c.replies.forEach(r => {
            r.showReplyInput = r.id === comment.id;
          });
        }
      } else {
        c.showReplyInput = false;
        if (c.replies) {
          c.replies.forEach(r => {
            r.showReplyInput = false;
          });
        }
      }
    });
  } else {
    // 回复主评论时，直接显示在该评论下方
    comments.value.forEach(c => {
      c.showReplyInput = c.id === comment.id;
      if (c.replies) {
        c.replies.forEach(r => {
          r.showReplyInput = false;
        });
      }
    });
  }

  // 延迟聚焦到输入框并滚动到可视区域
  setTimeout(() => {
    const replyInput = document.querySelector(
      ".reply-input-section textarea"
    ) as HTMLTextAreaElement;
    if (replyInput) {
      replyInput.focus();

      // 检查输入框是否在视口内，只有不在时才滚动
      const replySection = replyInput.closest(".reply-input-section") as HTMLElement;
      if (replySection) {
        const rect = replySection.getBoundingClientRect();
        const isInViewport =
          rect.top >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);

        // 只有当输入框不在视口内或部分不可见时才滚动
        if (!isInViewport || rect.top < 100 || rect.bottom > window.innerHeight - 100) {
          replySection.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }, 50);
};

const cancelReply = () => {
  // 清除所有评论和回复的回复输入框显示状态
  comments.value.forEach(comment => {
    comment.showReplyInput = false;
    if (comment.replies) {
      comment.replies.forEach(reply => {
        reply.showReplyInput = false;
      });
    }
  });
  replyingTo.value = null;
  commentInput.value = "";
};

const likeSubmittingIds = ref<Set<string>>(new Set());

/** 点赞 / 取消点赞 */
const toggleLike = async (comment: Comment) => {
  if (!props.isLoggedIn) {
    props.onLogin?.();
    return;
  }
  const id = comment.id?.trim();
  // 无有效 id 或该评论请求未结束时不重复提交
  if (!id || likeSubmittingIds.value.has(id)) return;

  // 发请求前的状态，接口报错时要还原
  const prevLiked = !!comment.isLiked;
  const prevLikes = comment.likes;
  // 本次点击目标：在「已赞 / 未赞」之间切换
  const nextLiked = !prevLiked;
  // 先改 UI，接口失败再恢复
  comment.isLiked = nextLiked;
  comment.likes = Math.max(0, prevLikes + (nextLiked ? 1 : -1));

  // 把当前评论 id 记入「请求进行中」集合：复制 Set 再赋值，方便 Vue 追踪；避免同一条连点重复请求
  const nextSet = new Set(likeSubmittingIds.value);
  nextSet.add(id);
  likeSubmittingIds.value = nextSet;

  try {
    const raw = await toggleCommentLike(id, nextLiked ? 1 : 0);
    const res = raw as unknown as FreelogApiBody<boolean>;
    if (!isFreelogApiSuccess(res)) {
      comment.isLiked = prevLiked;
      comment.likes = prevLikes;
      alert(res.msg || "操作失败");
    }
  } catch (e) {
    comment.isLiked = prevLiked;
    comment.likes = prevLikes;
    alert(e instanceof Error ? e.message : "网络错误，请稍后重试");
  } finally {
    const done = new Set(likeSubmittingIds.value);
    done.delete(id);
    likeSubmittingIds.value = done;
  }
};

/** 是否展示点赞数字（无赞时不渲染节点，避免占宽） */
function hasLikeCount(likes: number | undefined): boolean {
  return (likes ?? 0) > 0;
}

const toggleMoreMenu = (commentId: string, event: MouseEvent) => {
  event.stopPropagation();
  if (showMoreMenu.value === commentId) {
    showMoreMenu.value = null;
  } else {
    showMoreMenu.value = commentId;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    moreMenuPosition.value = {
      x: rect.left,
      y: rect.bottom + 5
    };
  }
};

const closeMoreMenu = () => {
  showMoreMenu.value = null;
};

function findCommentById(id: string): Comment | null {
  function walk(list: Comment[]): Comment | null {
    for (const c of list) {
      if (c.id === id) return c;
      if (c.replies?.length) {
        const found = walk(c.replies);
        if (found) return found;
      }
    }
    return null;
  }
  return walk(comments.value);
}

/** 无 exhibitId 时从本地树移除评论（主评或回复） */
function removeCommentFromTree(commentId: string): boolean {
  const id = commentId.trim();
  const list = comments.value;
  for (let i = 0; i < list.length; i++) {
    const c = list[i]!;
    if (c.id === id) {
      list.splice(i, 1);
      return true;
    }
    const replies = c.replies;
    if (replies?.length) {
      const j = replies.findIndex(r => r.id === id);
      if (j !== -1) {
        replies.splice(j, 1);
        if (c.totalReplies != null) {
          c.totalReplies = Math.max(0, c.totalReplies - 1);
        }
        if (!replies.length) {
          c.replies = undefined;
        }
        return true;
      }
    }
  }
  return false;
}

const menuTargetComment = computed(() => {
  const id = showMoreMenu.value;
  if (!id) return null;
  return findCommentById(id);
});

const handleDelete = async (comment: Comment) => {
  if (!props.isNodeAdmin) return;
  if (deleteSubmitting.value || blockSubmitting.value) return;
  const id = comment.id?.trim();
  if (!id) return;

  deleteSubmitting.value = true;
  try {
    const raw = await deleteComment(id);
    const res = raw as unknown as FreelogApiBody<boolean>;
    if (!isFreelogApiSuccess(res)) {
      alert(res.msg || "删除失败");
      return;
    }
    closeMoreMenu();
    const exhibitId = props.exhibitId?.trim();
    if (exhibitId) {
      await syncCommentsFromApi(exhibitId);
    } else {
      removeCommentFromTree(id);
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : "网络错误，请稍后重试");
  } finally {
    deleteSubmitting.value = false;
  }
};

const handleReport = () => {
  const id = showMoreMenu.value?.trim() || null;
  reportTargetCommentId.value = id;
  reportReason.value = "";
  reportDetail.value = "";
  reportSuccess.value = false;
  showReportDialog.value = true;
  closeMoreMenu();
};

const handleBlock = async (comment: Comment) => {
  if (!props.isNodeAdmin) return;
  if (blockSubmitting.value || deleteSubmitting.value) return;
  blockSubmitting.value = true;
  try {
    const raw = await toggleCommentBlock(comment.id, 1);
    const res = raw as unknown as FreelogApiBody<boolean>;
    if (!isFreelogApiSuccess(res)) {
      alert(res.msg || "屏蔽失败");
      return;
    }
    closeMoreMenu();
    const exhibitId = props.exhibitId?.trim();
    if (exhibitId) {
      await syncCommentsFromApi(exhibitId);
    } else {
      comment.isBlocked = true;
      comment.isExpanded = false;
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : "网络错误，请稍后重试");
  } finally {
    blockSubmitting.value = false;
  }
};

const handleUnblock = async (comment: Comment) => {
  if (!props.isNodeAdmin) return;
  if (blockSubmitting.value || deleteSubmitting.value) return;
  blockSubmitting.value = true;
  try {
    const raw = await toggleCommentBlock(comment.id, 0);
    const res = raw as unknown as FreelogApiBody<boolean>;
    if (!isFreelogApiSuccess(res)) {
      alert(res.msg || "操作失败");
      return;
    }
    const exhibitId = props.exhibitId?.trim();
    if (exhibitId) {
      await syncCommentsFromApi(exhibitId);
    } else {
      comment.isBlocked = false;
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : "网络错误，请稍后重试");
  } finally {
    blockSubmitting.value = false;
  }
};

const toggleBlockedComment = (comment: Comment) => {
  comment.isExpanded = !comment.isExpanded;
};

/** 抽屉模式：展开后每页条数 */
const REPLY_PAGE_SIZE_DRAWER = 10;

/** 垂直模式 vertical-container：折叠预览与展开翻页均为每页 3 条 */
const REPLY_PAGE_SIZE_VERTICAL = 3;

/** 垂直每页 3 条，抽屉每页 10 条 */
function getReplyPageSizeByLayout(): number {
  return props.layout === "vertical" ? REPLY_PAGE_SIZE_VERTICAL : REPLY_PAGE_SIZE_DRAWER;
}

/** 回复条数：优先接口 total，并与已加载列表取较大值，避免只拉了前几条但总数更大时不显示「展开」 */
function getReplyListTotal(comment: Comment): number {
  const loaded = comment.replies?.length ?? 0;
  const reported = comment.totalReplies;
  if (reported != null && reported > 0) {
    return Math.max(reported, loaded);
  }
  return loaded;
}

/** 当前 UI 展示所需的最少已加载子评论数（折叠=第 1 页，展开=当前页及之前） */
function getRequiredLoadedReplyCount(comment: Comment): number {
  const pageSize = getReplyPageSizeByLayout();
  const total = getReplyListTotal(comment);
  const page = comment.showAllReplies ? comment.currentReplyPage || 1 : 1;
  return Math.min(total, page * pageSize);
}

const replyMetaSyncPromises = new Map<string, Promise<void>>();

function applyReplyPageTotal(comment: Comment, data: CommentListPageData | undefined): void {
  if (data != null && typeof data.totalItem === "number" && data.totalItem >= 0) {
    comment.totalReplies = data.totalItem;
  }
}

/** 合并子评论分页结果，按 id 去重；无新增则返回 false */
function mergeRepliesInto(comment: Comment, batch: Comment[]): boolean {
  if (batch.length === 0) return false;
  if (!comment.replies) comment.replies = [];
  const before = comment.replies.length;
  for (const item of batch) {
    if (!comment.replies.some(r => r.id === item.id)) {
      comment.replies.push(item);
    }
  }
  return comment.replies.length > before;
}

/** 用 replyPage skip=0&limit=1 同步 totalItem，修正「共 X 条」与总页数 */
async function ensureReplyMetaSynced(comment: Comment): Promise<void> {
  if (!comment.needsSubReplyFetch || comment.replyMetaSynced) return;

  let inflight = replyMetaSyncPromises.get(comment.id);
  if (!inflight) {
    inflight = (async () => {
      try {
        const raw = await fetchChildCommentList({
          commentId: comment.id,
          skip: 0,
          limit: 1
        });
        const res = raw as unknown as FreelogApiBody<CommentListPageData>;
        const data = res.data;
        if (isFreelogApiSuccess(res) && data != null && typeof data.totalItem === "number") {
          comment.totalReplies = data.totalItem;
          comment.replyMetaSynced = true;
        }
      } catch {
        /* 失败不标记 synced，展开/翻页时可重试 */
      }
    })();
    replyMetaSyncPromises.set(comment.id, inflight);
  }

  await inflight;
  replyMetaSyncPromises.delete(comment.id);
}

/** 按当前页从 replyPage 补拉子评论（skip=已有 replies.length） */
async function fetchMoreSubRepliesIfNeeded(comment: Comment): Promise<void> {
  if (!comment.needsSubReplyFetch) return;
  await ensureReplyMetaSynced(comment);
  if (comment.repliesLoading) return;

  comment.repliesLoading = true;
  try {
    while (true) {
      const total = getReplyListTotal(comment);
      const loaded = comment.replies?.length ?? 0;
      if (loaded >= total) break;
      const required = getRequiredLoadedReplyCount(comment);
      if (loaded >= required) break;

      const limit = Math.min(100, Math.max(required - loaded, 10));
      const raw = await fetchChildCommentList({
        commentId: comment.id,
        skip: loaded,
        limit
      });
      const res = raw as unknown as FreelogApiBody<CommentListPageData>;
      if (!isFreelogApiSuccess(res)) {
        alert(res.msg || "加载回复失败");
        break;
      }
      applyReplyPageTotal(comment, res.data);
      const batch = (res.data?.dataList ?? []).map(ch => mapThreadToComment(ch, false));
      if (!mergeRepliesInto(comment, batch)) break;
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : "网络错误，请稍后重试");
  } finally {
    comment.repliesLoading = false;
  }
}

function shouldShowReplyExpandControl(comment: Comment): boolean {
  const pageSize = getReplyPageSizeByLayout();
  return (comment.replies?.length ?? 0) > 0 && getReplyListTotal(comment) > pageSize;
}

const toggleReplies = (comment: Comment) => {
  if (!comment.showAllReplies) {
    comment.showAllReplies = true;
    comment.currentReplyPage = 1;
    void fetchMoreSubRepliesIfNeeded(comment);
  } else {
    comment.showAllReplies = false;
    comment.currentReplyPage = 1;
  }
};

const changeReplyPage = (comment: Comment, page: number) => {
  comment.currentReplyPage = page;
  void fetchMoreSubRepliesIfNeeded(comment);
};

const nextReplyPage = (comment: Comment) => {
  const pageSize = getReplyPageSizeByLayout();
  const totalPages = Math.ceil(getReplyListTotal(comment) / pageSize);
  if (comment.currentReplyPage && comment.currentReplyPage < totalPages) {
    comment.currentReplyPage++;
    void fetchMoreSubRepliesIfNeeded(comment);
  }
};

const getDisplayedReplies = (comment: Comment) => {
  if (!comment.replies) return [];

  if (!comment.showAllReplies) {
    return comment.replies.slice(0, getReplyPageSizeByLayout());
  }
  const pageSize = getReplyPageSizeByLayout();
  const page = comment.currentReplyPage || 1;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return comment.replies.slice(startIndex, endIndex);
};

const getTotalReplyPages = (comment: Comment) => {
  const pageSize = getReplyPageSizeByLayout();
  return Math.ceil(getReplyListTotal(comment) / pageSize);
};

const submitReport = async () => {
  if (!props.isLoggedIn) {
    props.onLogin?.();
    return;
  }
  const commentId = reportTargetCommentId.value?.trim();
  if (!commentId) {
    alert("缺少评论信息，请重新操作");
    return;
  }
  if (!reportReason.value || (reportReason.value === "other" && !reportDetail.value.trim())) {
    alert("请完整填写举报信息");
    return;
  }
  if (reportSubmitting.value) return;

  reportSubmitting.value = true;
  try {
    const raw = await reportComment(commentId, buildReportContent());
    const res = raw as unknown as FreelogApiBody<boolean>;
    if (!isFreelogApiSuccess(res)) {
      alert(res.msg || "举报失败");
      return;
    }
    reportSuccess.value = true;
    setTimeout(() => {
      closeReportDialog();
    }, 2000);
  } catch (e) {
    alert(e instanceof Error ? e.message : "网络错误，请稍后重试");
  } finally {
    reportSubmitting.value = false;
  }
};

const roleColors = {
  curator: "#BEBEBE",
  creator: "#2784FF"
};

const roleNames = {
  curator: "策展人",
  creator: "创作者"
};

/**
 * 顶部输入是否已完全滚出「用户看到的视口」上方。
 * - 独立运行：相对本 window，底边 < 0 即滚出。
 * - iframe 内：父页面滚动时子 window 的 scroll 不会触发，且 rect 相对 iframe 视口不变；
 *   需用 frameElement 把输入框底边换算到父页面坐标再判断。
 */
function isVerticalTopInputScrolledOut(): boolean {
  const el = inputContainerRef.value;
  if (!el) return false;

  const ir = el.getBoundingClientRect();
  const frame = window.frameElement as HTMLIFrameElement | null;
  if (frame) {
    const fr = frame.getBoundingClientRect();
    const bottomInOuterViewport = fr.top + ir.bottom;
    return bottomInOuterViewport < 1;
  }

  return ir.bottom < 1;
}

// 垂直模式：顶部输入滚出宿主视口后显示底部悬浮条；滚回则隐藏（不依赖「评论列表高度」，长页面 + 短列表也会滚走输入框）
const handleScroll = () => {
  if (props.layout !== "vertical") return;

  checkVerticalRootLoadMore();

  if (!inputContainerRef.value) return;

  showFloatingInput.value = isVerticalTopInputScrolledOut();
};

// 抽屉模式的滚动处理
const handleDrawerScroll = () => {
  if (props.layout === "drawer" && drawerBodyRef.value) {
    checkDrawerRootLoadMore();

    if (!drawerInputRef.value || !drawerListRef.value) return;

    // 检查抽屉中评论列表高度是否大于抽屉可视区域
    const scrollContainer = drawerBodyRef.value;
    const listHeight = drawerListRef.value.scrollHeight;
    const containerHeight = scrollContainer.clientHeight - 100; // 减去底部空白

    // 只有当评论列表足够长时才显示悬浮输入框
    if (listHeight <= containerHeight) {
      showFloatingInput.value = false;
      return;
    }

    // 获取输入框相对于滚动容器的位置
    const inputRect = drawerInputRef.value.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();

    // 检查输入框是否完全滚出可视区域（加上20px缓冲）
    showFloatingInput.value = inputRect.bottom < containerRect.top + 20;
  }
};

/** 滚动类监听用 passive，减少主线程阻塞；capture 用于 document 上兜 wheel/touch，与注册时成对移除 */
const passiveScroll: AddEventListenerOptions = { passive: true };
const passiveCapture: AddEventListenerOptions = { passive: true, capture: true };

/**
 * 宿主页（音乐主题等）侧滚动监听卸载函数。
 *
 * 背景：评论以 iframe 嵌在主题里时，用户滚的是父页面的 #app（fixed + overflow-y: auto），
 * iframe 内 window 往往不触发 scroll，必须用父窗口上的事件/轮询，才能更新「顶栏是否滚出」，
 * 从而切换底部悬浮输入框（见 isVerticalTopInputScrolledOut、handleScroll）。
 *
 * 绑定说明（同源 parent 可访问时）：
 * - resize：父窗口/视口高度变化时重算
 * - #app 或 parent：主题真实滚动容器（无 #app 则退化为监听 parent）
 * - visualViewport：移动端地址栏伸缩等
 * - wheel / touchmove：部分环境 scroll 不可靠时，用手势间接触发检测
 * - setInterval：iframe 内兜底轮询，避免漏事件
 *
 * 卸载：所有注册推入 cleanups，组件卸载时一次性执行，避免泄漏。
 */
let unbindParentScroll: (() => void) | null = null;

function bindParentScrollListeners() {
  const cleanups: Array<() => void> = [];
  try {
    const p = window.parent;
    if (!p || p === window) return;

    const on = handleScroll;
    const bump = () => handleScroll();

    p.addEventListener("resize", on);
    cleanups.push(() => p.removeEventListener("resize", on));

    const scrollTarget: EventTarget = p.document.getElementById("app") ?? p;
    scrollTarget.addEventListener("scroll", on, passiveScroll);
    cleanups.push(() => scrollTarget.removeEventListener("scroll", on));

    const vv = p.visualViewport;
    if (vv) {
      vv.addEventListener("scroll", on, passiveScroll);
      vv.addEventListener("resize", on);
      cleanups.push(() => {
        vv.removeEventListener("scroll", on);
        vv.removeEventListener("resize", on);
      });
    }

    const doc = p.document;
    doc.addEventListener("wheel", bump, passiveCapture);
    doc.addEventListener("touchmove", bump, passiveCapture);
    cleanups.push(() => {
      doc.removeEventListener("wheel", bump, passiveCapture);
      doc.removeEventListener("touchmove", bump, passiveCapture);
    });

    if (window.frameElement) {
      const id = window.setInterval(handleScroll, 120);
      cleanups.push(() => clearInterval(id));
    }

    unbindParentScroll = () => cleanups.forEach(c => c());
  } catch {
    cleanups.forEach(c => c());
    unbindParentScroll = null;
  }
}

onMounted(() => {
  /* 插件独立运行或 iframe 内文档自身滚动时 */
  window.addEventListener("scroll", handleScroll, passiveScroll);
  window.addEventListener("resize", handleScroll);
  window.addEventListener("click", closeMoreMenu);

  bindParentScrollListeners();

  setTimeout(() => {
    handleScroll();
    handleDrawerScroll();
  }, 100);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("resize", handleScroll);
  window.removeEventListener("click", closeMoreMenu);
  unbindParentScroll?.();
  unbindParentScroll = null;
});
</script>

<template>
  <div
    class="comment-widget"
    :class="[`theme-${theme}`, `layout-${layout}`]"
    :style="hostSurfaceStyle"
  >
    <!-- 垂直模式 -->
    <div v-if="layout === 'vertical'" class="vertical-container">
      <div class="comment-content">
        <!-- 未登录提示 -->
        <div v-if="!isLoggedIn" class="login-prompt">
          <span>游客身份，登录后发布评论</span>
          <button class="btn-login" @click="handleLogin">登录</button>
        </div>

        <!-- 评论输入框 (已登录) - 仅用于发布新评论 -->
        <div v-if="isLoggedIn && !replyingTo" ref="inputContainerRef" class="comment-input-section">
          <div class="avatar">
            <img :src="avatarUrl" alt="avatar" />
          </div>
          <div class="input-box">
            <textarea v-model="commentInput" placeholder="写下你的评论..."></textarea>
            <button
              class="btn-publish"
              :class="{ disabled: !commentInput.trim() || publishSubmitting }"
              @click="handlePublish"
            >
              发布
            </button>
          </div>
        </div>

        <!-- 评论列表 -->
        <div ref="commentListRef" class="comment-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-main">
              <div class="avatar" :style="commentAvatarStyle(comment)"></div>
              <div class="comment-body">
                <div class="comment-header">
                  <div class="user-info">
                    <span class="username">{{ comment.username }}</span>
                    <span
                      v-if="comment.userRole"
                      class="user-role"
                      :style="{ background: roleColors[comment.userRole] }"
                    >
                      {{ roleNames[comment.userRole] }}
                    </span>
                  </div>
                </div>

                <div
                  class="comment-content-text"
                  :class="{ blocked: comment.isBlocked && !comment.isExpanded }"
                >
                  <template v-if="comment.isBlocked && !comment.isExpanded">
                    <span class="blocked-text">该评论已屏蔽</span>
                    <span class="view-link" @click="toggleBlockedComment(comment)">点击查看</span>
                  </template>
                  <template v-else>
                    <span :class="{ 'blocked-content': comment.isBlocked }">{{
                      comment.content
                    }}</span>
                    <span
                      v-if="comment.isBlocked"
                      class="collapse-link"
                      @click="toggleBlockedComment(comment)"
                      >收起</span
                    >
                  </template>
                </div>

                <div class="comment-actions">
                  <span class="time">{{ comment.time }}</span>

                  <div class="action-button" @click="toggleLike(comment)">
                    <img v-if="comment.isLiked" :src="iconLikeFull" width="14" height="14" alt="" />
                    <LikeIconOutline v-else />
                    <span v-if="hasLikeCount(comment.likes)" class="like-count">{{
                      comment.likes
                    }}</span>
                  </div>

                  <div class="action-button" @click="handleReply(comment)">
                    <svg width="14" height="13" viewBox="0 0 14 12.2544" fill="none">
                      <path
                        d="M13.125 6.12537C13.125 3.28452 10.4461 0.875053 7 0.875053C3.55391 0.875053 0.875 3.28452 0.875 6.12537C0.875 7.03616 1.14573 7.89456 1.62631 8.64521C1.63041 8.65162 1.63171 8.65365 1.64062 8.66743L1.84891 8.98916L1.30075 11.1285L3.8403 10.6299L4.09793 10.7491C4.96007 11.148 5.9478 11.3757 7 11.3757V12.2507C5.8214 12.2507 4.70827 11.9955 3.7305 11.5432L0.109375 12.2544L0.906189 9.14319C0.900562 9.13451 0.894893 9.12585 0.889313 9.11713C0.324561 8.23502 0 7.21422 0 6.12537C0 2.68574 3.19488 0 7 0C10.8051 0 14 2.68574 14 6.12537C14 9.565 10.8051 12.2507 7 12.2507V11.3757C10.4461 11.3757 13.125 8.96622 13.125 6.12537Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>

                  <div class="action-button more" @click="toggleMoreMenu(comment.id, $event)">
                    <svg width="14" height="3" viewBox="0 0 14 3">
                      <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
                      <circle cx="7" cy="1.5" r="1.5" fill="currentColor" />
                      <circle cx="12.5" cy="1.5" r="1.5" fill="currentColor" />
                    </svg>
                  </div>

                  <span
                    v-if="comment.isBlocked && comment.isExpanded && isNodeAdmin"
                    class="action"
                    @click="handleUnblock(comment)"
                    >取消屏蔽</span
                  >
                </div>
              </div>
            </div>

            <!-- 主评论的回复输入框 -->
            <div
              v-if="comment.showReplyInput && replyingTo"
              class="reply-input-section"
              :data-reply-to="replyingTo.id"
            >
              <div class="avatar small">
                <img :src="avatarUrl" alt="avatar" />
              </div>
              <div class="input-box">
                <textarea
                  v-model="commentInput"
                  :placeholder="`回复@${replyingTo.username}：`"
                  @keydown.enter.ctrl="handlePublish"
                ></textarea>
                <button class="btn-cancel-reply" @click="cancelReply">取消</button>
                <button
                  class="btn-publish"
                  :class="{ disabled: !commentInput.trim() || publishSubmitting }"
                  @click="handlePublish"
                >
                  发布
                </button>
              </div>
            </div>

            <!-- 回复列表 -->
            <div v-if="comment.replies && comment.replies.length > 0" class="replies-section">
              <div class="replies">
                <div
                  v-for="reply in getDisplayedReplies(comment)"
                  :key="reply.id"
                  class="comment-item reply-item"
                >
                  <div class="comment-main">
                    <div class="avatar small" :style="commentAvatarStyle(reply)"></div>
                    <div class="comment-body">
                      <div class="comment-header">
                        <div class="user-info">
                          <span class="username">{{ reply.username }}</span>
                          <span
                            v-if="reply.userRole"
                            class="user-role"
                            :style="{ background: roleColors[reply.userRole] }"
                          >
                            {{ roleNames[reply.userRole] }}
                          </span>
                          <span v-if="reply.replyTo" class="reply-to">回复</span>
                          <span v-if="reply.replyTo" class="username">{{ reply.replyTo }}</span>
                        </div>
                      </div>
                      <div class="comment-content-text">{{ reply.content }}</div>
                      <div class="comment-actions">
                        <span class="time">{{ reply.time }}</span>

                        <div class="action-button" @click="toggleLike(reply)">
                          <img
                            v-if="reply.isLiked"
                            :src="iconLikeFull"
                            width="14"
                            height="14"
                            alt=""
                          />
                          <LikeIconOutline v-else />
                          <span v-if="hasLikeCount(reply.likes)" class="like-count">{{
                            reply.likes
                          }}</span>
                        </div>

                        <div class="action-button" @click="handleReply(reply, comment)">
                          <svg width="14" height="13" viewBox="0 0 14 12.2544" fill="none">
                            <path
                              d="M13.125 6.12537C13.125 3.28452 10.4461 0.875053 7 0.875053C3.55391 0.875053 0.875 3.28452 0.875 6.12537C0.875 7.03616 1.14573 7.89456 1.62631 8.64521C1.63041 8.65162 1.63171 8.65365 1.64062 8.66743L1.84891 8.98916L1.30075 11.1285L3.8403 10.6299L4.09793 10.7491C4.96007 11.148 5.9478 11.3757 7 11.3757V12.2507C5.8214 12.2507 4.70827 11.9955 3.7305 11.5432L0.109375 12.2544L0.906189 9.14319C0.900562 9.13451 0.894893 9.12585 0.889313 9.11713C0.324561 8.23502 0 7.21422 0 6.12537C0 2.68574 3.19488 0 7 0C10.8051 0 14 2.68574 14 6.12537C14 9.565 10.8051 12.2507 7 12.2507V11.3757C10.4461 11.3757 13.125 8.96622 13.125 6.12537Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>

                        <div class="action-button more" @click="toggleMoreMenu(reply.id, $event)">
                          <svg width="14" height="3" viewBox="0 0 14 3">
                            <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
                            <circle cx="7" cy="1.5" r="1.5" fill="currentColor" />
                            <circle cx="12.5" cy="1.5" r="1.5" fill="currentColor" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 回复的回复输入框 -->
                  <div v-if="reply.showReplyInput && replyingTo" class="reply-input-section nested">
                    <div class="avatar small">
                      <img :src="avatarUrl" alt="avatar" />
                    </div>
                    <div class="input-box">
                      <textarea
                        v-model="commentInput"
                        :placeholder="`回复@${replyingTo.username}：`"
                        @keydown.enter.ctrl="handlePublish"
                      ></textarea>
                      <button class="btn-cancel-reply" @click="cancelReply">取消</button>
                      <button
                        class="btn-publish"
                        :class="{ disabled: !commentInput.trim() || publishSubmitting }"
                        @click="handlePublish"
                      >
                        发布
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 展开/收起回复：默认 3 条，超出显示「共 X 条回复，点击查看」 -->
              <div v-if="shouldShowReplyExpandControl(comment)" class="replies-toggle">
                <!-- 未展开时显示提示 -->
                <span
                  v-if="!comment.showAllReplies"
                  class="toggle-link"
                  @click="toggleReplies(comment)"
                >
                  共{{ getReplyListTotal(comment) }}条回复，点击查看
                </span>
                <!-- 展开后显示分页 -->
                <template v-else>
                  <span class="page-info"
                    >共{{ getTotalReplyPages(comment) }}页
                    {{ getReplyListTotal(comment) }}条回复</span
                  >
                  <span v-if="comment.repliesLoading" class="replies-loading">加载中…</span>
                  <span
                    v-for="page in getTotalReplyPages(comment)"
                    :key="page"
                    class="page-link"
                    :class="{ active: comment.currentReplyPage === page }"
                    @click="changeReplyPage(comment, page)"
                  >
                    {{ page }}
                  </span>
                  <span
                    v-if="
                      comment.currentReplyPage &&
                      comment.currentReplyPage < getTotalReplyPages(comment)
                    "
                    class="page-link"
                    @click="nextReplyPage(comment)"
                  >
                    下一页
                  </span>
                  <span class="page-link" @click="toggleReplies(comment)">收起</span>
                </template>
              </div>
            </div>
          </div>
          <div ref="rootLoadMoreSentinelRef" class="comment-root-load-more-tail">
            <span v-if="commentsLoadingMore" class="root-loading-more">加载中…</span>
            <span v-else-if="!commentsHasMore && comments.length > 0" class="root-no-more"
              >没有更多了</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 底部悬浮输入框 - 仅用于发布新评论 -->
    <Transition name="slide-up">
      <div
        v-if="isLoggedIn && showFloatingInput && layout === 'vertical' && !replyingTo"
        class="floating-input"
        :style="{ width: verticalContainerWidth }"
      >
        <div class="avatar small">
          <img :src="avatarUrl" alt="avatar" />
        </div>
        <div class="input-box">
          <textarea v-model="commentInput" placeholder="写下你的评论..."></textarea>
          <button
            class="btn-publish"
            :class="{ disabled: !commentInput.trim() || publishSubmitting }"
            @click="handlePublish"
          >
            发布
          </button>
        </div>
      </div>
    </Transition>

    <!-- 更多菜单 -->
    <Transition name="fade">
      <div
        v-if="showMoreMenu"
        class="more-menu"
        :style="{ left: `${moreMenuPosition.x}px`, top: `${moreMenuPosition.y}px` }"
        @click.stop
      >
        <div
          v-if="menuTargetComment && isNodeAdmin"
          class="menu-item"
          :class="{ 'is-disabled': blockSubmitting || deleteSubmitting }"
          @click="handleDelete(menuTargetComment)"
        >
          <svg
            width="15"
            height="16"
            viewBox="0 0 60 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M40 0C43.3137 0 46 2.68629 46 6V7H60V11H53V58C53 61.3137 50.3137 64 47 64H13C9.68629 64 7 61.3137 7 58V11H0V7H14V6C14 2.68629 16.6863 9.66384e-08 20 0H40ZM11 58C11 59.1046 11.8954 60 13 60H47C48.1046 60 49 59.1046 49 58V11H11V58ZM22 49H18V21H22V49ZM32 49H28V21H32V49ZM42 49H38V21H42V49ZM20 4C18.8954 4 18 4.89543 18 6V7H42V6C42 4.89543 41.1046 4 40 4H20Z"
              fill="currentColor"
            />
          </svg>
          <span>删除</span>
        </div>
        <div class="menu-item" @click="handleReport()">
          <svg
            width="15"
            height="16"
            viewBox="0 0 62 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M59.9846 59.4143C61.0892 59.4143 61.9846 60.3097 61.9846 61.4143C61.9844 62.5187 61.089 63.4143 59.9846 63.4143H3.9846C2.88038 63.4141 1.98485 62.5185 1.9846 61.4143C1.9846 60.3099 2.88023 59.4145 3.9846 59.4143H59.9846ZM31.9846 9.41429C43.5826 9.41429 52.9846 18.8163 52.9846 30.4143V55.4143H10.9846V30.4143C10.9846 18.8165 20.3868 9.41453 31.9846 9.41429ZM31.9846 13.4143C22.596 13.4145 14.9846 21.0256 14.9846 30.4143V51.4143H48.9846V30.4143C48.9846 21.0254 41.3734 13.4143 31.9846 13.4143ZM24.7844 19.3147C25.668 18.652 26.9214 18.8307 27.5842 19.7141C28.2468 20.5976 28.0682 21.8511 27.1848 22.5139C23.7921 25.0587 21.9846 28.9025 21.9846 34.4143C21.9844 35.5187 21.089 36.4143 19.9846 36.4143C18.8804 36.4141 17.9848 35.5185 17.9846 34.4143C17.9846 27.9267 20.1779 22.7699 24.7844 19.3147ZM0.0685865 19.3108C0.354481 18.2439 1.45186 17.6108 2.51878 17.8967L6.38206 18.9319C7.4489 19.2177 8.08182 20.3142 7.79613 21.3811C7.51025 22.448 6.4138 23.0819 5.34691 22.7961L1.48363 21.76C0.416693 21.4741 -0.217297 20.3777 0.0685865 19.3108ZM4.74241 3.99925C5.52338 3.21853 6.78954 3.21858 7.57054 3.99925L13.2278 9.65648C14.0087 10.4375 14.0086 11.7036 13.2278 12.4846C12.4467 13.2656 11.1807 13.2656 10.3996 12.4846L4.74241 6.82835C3.96137 6.0473 3.96137 4.7803 4.74241 3.99925ZM20.0178 0.0685865C21.0847 -0.217297 22.1821 0.416693 22.468 1.48363L23.5032 5.34691C23.789 6.41367 23.1557 7.51003 22.0891 7.79613C21.0222 8.08201 19.9248 7.449 19.6389 6.38206L18.6037 2.51878C18.3179 1.4519 18.951 0.354532 20.0178 0.0685865Z"
              fill="currentColor"
            />
          </svg>
          <span>举报</span>
        </div>
        <div
          v-if="menuTargetComment && isNodeAdmin"
          class="menu-item"
          :class="{ 'is-disabled': blockSubmitting || deleteSubmitting }"
          @click="handleBlock(menuTargetComment)"
        >
          <svg
            width="16"
            height="11"
            viewBox="0 0 64 44"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M32 0C44.2216 0 57.3358 6.80938 63.6455 21.1924L64 22L63.6455 22.8076C57.3358 37.1906 44.2216 44 32 44C19.7784 44 6.66416 37.1906 0.354492 22.8076L0 22L0.354492 21.1924C6.66416 6.80938 19.7784 2.04973e-07 32 0ZM32 4C21.4478 4 10.1077 9.7428 4.36035 22C10.1077 34.2572 21.4478 40 32 40C42.5521 40 53.8913 34.2569 59.6387 22C53.8913 9.74306 42.5521 4 32 4ZM32 10C38.589 10 43.9307 15.3726 43.9307 22C43.9307 28.6274 38.589 34 32 34C25.411 34 20.0693 28.6274 20.0693 22C20.0693 15.3726 25.411 10 32 10ZM32 14C27.6073 14 24.0459 17.5817 24.0459 22C24.0459 26.4183 27.6073 30 32 30C36.3927 30 39.9541 26.4183 39.9541 22C39.9541 17.5817 36.3927 14 32 14Z"
              fill="currentColor"
            />
          </svg>
          <span>屏蔽</span>
        </div>
      </div>
    </Transition>

    <!-- 抽屉模式 -->
    <template v-if="layout === 'drawer'">
      <!-- 触发按钮 -->
      <!-- <div class="drawer-triggers">
        <button class="float-button share">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M13 5L13 11M10 8L16 8M7 14L2 14C1.44772 14 1 13.5523 1 13L1 3C1 2.44772 1.44772 2 2 2L7 2M7 2L12 7M7 2L7 7"
              stroke="currentColor"
              stroke-width="1.5"
            />
          </svg>
        </button>
        <button class="float-button comment" @click="toggleDrawer">
          <svg width="16" height="14" viewBox="0 0 16 14" fill="currentColor">
            <path
              d="M14 0H2C0.9 0 0 0.9 0 2V10C0 11.1 0.9 12 2 12H12L16 16V2C16 0.9 15.1 0 14 0Z"
            />
          </svg>
          <span class="badge">{{ comments.length }}</span>
        </button>
      </div> -->

      <!-- 抽屉内容 -->
      <Transition name="slide-right">
        <div v-if="drawerVisible" class="drawer-overlay" @click="toggleDrawer">
          <div class="drawer-content" @click.stop="closeMoreMenu">
            <div class="drawer-header">
              <h3>评论</h3>
              <button class="close-btn" @click="toggleDrawer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>

            <div ref="drawerBodyRef" class="drawer-body" @scroll="handleDrawerScroll">
              <!-- 未登录提示 -->
              <div v-if="!isLoggedIn" class="login-prompt">
                <span>游客身份，登录后发布评论</span>
                <button class="btn-login" @click="handleLogin">登录</button>
              </div>

              <!-- 评论输入框 (已登录) - 仅用于发布新评论 -->
              <div
                v-if="isLoggedIn && !replyingTo"
                ref="drawerInputRef"
                class="comment-input-section"
              >
                <div class="avatar">
                  <img :src="avatarUrl" alt="avatar" />
                </div>
                <div class="input-box">
                  <textarea v-model="commentInput" placeholder="写下你的评论..."></textarea>
                  <button
                    class="btn-publish"
                    :class="{ disabled: !commentInput.trim() || publishSubmitting }"
                    @click="handlePublish"
                  >
                    发布
                  </button>
                </div>
              </div>

              <!-- 评论列表 -->
              <div ref="drawerListRef" class="comment-list">
                <div v-for="comment in comments" :key="comment.id" class="comment-item">
                  <div class="comment-main">
                    <div class="avatar" :style="commentAvatarStyle(comment)"></div>
                    <div class="comment-body">
                      <div class="comment-header">
                        <div class="user-info">
                          <span class="username">{{ comment.username }}</span>
                          <span
                            v-if="comment.userRole"
                            class="user-role"
                            :style="{ background: roleColors[comment.userRole] }"
                          >
                            {{ roleNames[comment.userRole] }}
                          </span>
                        </div>
                      </div>

                      <div
                        class="comment-content-text"
                        :class="{ blocked: comment.isBlocked && !comment.isExpanded }"
                      >
                        <template v-if="comment.isBlocked && !comment.isExpanded">
                          <span class="blocked-text">该评论已屏蔽</span>
                          <span class="view-link" @click="toggleBlockedComment(comment)"
                            >点击查看</span
                          >
                        </template>
                        <template v-else>
                          <span :class="{ 'blocked-content': comment.isBlocked }">{{
                            comment.content
                          }}</span>
                          <span
                            v-if="comment.isBlocked"
                            class="collapse-link"
                            @click="toggleBlockedComment(comment)"
                            >收起</span
                          >
                        </template>
                      </div>

                      <div class="comment-actions">
                        <span class="time">{{ comment.time }}</span>

                        <div class="action-button" @click="toggleLike(comment)">
                          <img
                            v-if="comment.isLiked"
                            :src="iconLikeFull"
                            width="14"
                            height="14"
                            alt=""
                          />
                          <LikeIconOutline v-else />
                          <span v-if="hasLikeCount(comment.likes)" class="like-count">{{
                            comment.likes
                          }}</span>
                        </div>

                        <div class="action-button" @click="handleReply(comment)">
                          <svg width="14" height="13" viewBox="0 0 14 12.2544" fill="none">
                            <path
                              d="M13.125 6.12537C13.125 3.28452 10.4461 0.875053 7 0.875053C3.55391 0.875053 0.875 3.28452 0.875 6.12537C0.875 7.03616 1.14573 7.89456 1.62631 8.64521C1.63041 8.65162 1.63171 8.65365 1.64062 8.66743L1.84891 8.98916L1.30075 11.1285L3.8403 10.6299L4.09793 10.7491C4.96007 11.148 5.9478 11.3757 7 11.3757V12.2507C5.8214 12.2507 4.70827 11.9955 3.7305 11.5432L0.109375 12.2544L0.906189 9.14319C0.900562 9.13451 0.894893 9.12585 0.889313 9.11713C0.324561 8.23502 0 7.21422 0 6.12537C0 2.68574 3.19488 0 7 0C10.8051 0 14 2.68574 14 6.12537C14 9.565 10.8051 12.2507 7 12.2507V11.3757C10.4461 11.3757 13.125 8.96622 13.125 6.12537Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>

                        <div class="action-button more" @click="toggleMoreMenu(comment.id, $event)">
                          <svg width="14" height="3" viewBox="0 0 14 3">
                            <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
                            <circle cx="7" cy="1.5" r="1.5" fill="currentColor" />
                            <circle cx="12.5" cy="1.5" r="1.5" fill="currentColor" />
                          </svg>
                        </div>

                        <span
                          v-if="comment.isBlocked && comment.isExpanded && isNodeAdmin"
                          class="action"
                          @click="handleUnblock(comment)"
                          >取消屏蔽</span
                        >
                      </div>
                    </div>
                  </div>

                  <!-- 主评论的回复输入框 -->
                  <div
                    v-if="comment.showReplyInput && replyingTo"
                    class="reply-input-section"
                    :data-reply-to="replyingTo.id"
                  >
                    <div class="avatar small">
                      <img :src="avatarUrl" alt="avatar" />
                    </div>
                    <div class="input-box">
                      <textarea
                        v-model="commentInput"
                        :placeholder="`回复@${replyingTo.username}：`"
                        @keydown.enter.ctrl="handlePublish"
                      ></textarea>
                      <button class="btn-cancel-reply" @click="cancelReply">取消</button>
                      <button
                        class="btn-publish"
                        :class="{ disabled: !commentInput.trim() || publishSubmitting }"
                        @click="handlePublish"
                      >
                        发布
                      </button>
                    </div>
                  </div>

                  <!-- 回复列表 -->
                  <div v-if="comment.replies && comment.replies.length > 0" class="replies-section">
                    <div class="replies">
                      <div
                        v-for="reply in getDisplayedReplies(comment)"
                        :key="reply.id"
                        class="comment-item reply-item"
                      >
                        <div class="comment-main">
                          <div class="avatar small" :style="commentAvatarStyle(reply)"></div>
                          <div class="comment-body">
                            <div class="comment-header">
                              <div class="user-info">
                                <span class="username">{{ reply.username }}</span>
                                <span
                                  v-if="reply.userRole"
                                  class="user-role"
                                  :style="{ background: roleColors[reply.userRole] }"
                                >
                                  {{ roleNames[reply.userRole] }}
                                </span>
                                <span v-if="reply.replyTo" class="reply-to">回复</span>
                                <span v-if="reply.replyTo" class="username">{{
                                  reply.replyTo
                                }}</span>
                              </div>
                            </div>
                            <div class="comment-content-text">{{ reply.content }}</div>
                            <div class="comment-actions">
                              <span class="time">{{ reply.time }}</span>

                              <div class="action-button" @click="toggleLike(reply)">
                                <img
                                  v-if="reply.isLiked"
                                  :src="iconLikeFull"
                                  width="14"
                                  height="14"
                                  alt=""
                                />
                                <LikeIconOutline v-else />
                                <span v-if="hasLikeCount(reply.likes)" class="like-count">{{
                                  reply.likes
                                }}</span>
                              </div>

                              <div class="action-button" @click="handleReply(reply, comment)">
                                <svg width="14" height="13" viewBox="0 0 14 12.2544" fill="none">
                                  <path
                                    d="M13.125 6.12537C13.125 3.28452 10.4461 0.875053 7 0.875053C3.55391 0.875053 0.875 3.28452 0.875 6.12537C0.875 7.03616 1.14573 7.89456 1.62631 8.64521C1.63041 8.65162 1.63171 8.65365 1.64062 8.66743L1.84891 8.98916L1.30075 11.1285L3.8403 10.6299L4.09793 10.7491C4.96007 11.148 5.9478 11.3757 7 11.3757V12.2507C5.8214 12.2507 4.70827 11.9955 3.7305 11.5432L0.109375 12.2544L0.906189 9.14319C0.900562 9.13451 0.894893 9.12585 0.889313 9.11713C0.324561 8.23502 0 7.21422 0 6.12537C0 2.68574 3.19488 0 7 0C10.8051 0 14 2.68574 14 6.12537C14 9.565 10.8051 12.2507 7 12.2507V11.3757C10.4461 11.3757 13.125 8.96622 13.125 6.12537Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </div>

                              <div
                                class="action-button more"
                                @click="toggleMoreMenu(reply.id, $event)"
                              >
                                <svg width="14" height="3" viewBox="0 0 14 3">
                                  <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
                                  <circle cx="7" cy="1.5" r="1.5" fill="currentColor" />
                                  <circle cx="12.5" cy="1.5" r="1.5" fill="currentColor" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- 回复的回复输入框 -->
                        <div
                          v-if="reply.showReplyInput && replyingTo"
                          class="reply-input-section nested"
                        >
                          <div class="avatar small">
                            <img :src="avatarUrl" alt="avatar" />
                          </div>
                          <div class="input-box">
                            <textarea
                              v-model="commentInput"
                              :placeholder="`回复@${replyingTo.username}：`"
                              @keydown.enter.ctrl="handlePublish"
                            ></textarea>
                            <button class="btn-cancel-reply" @click="cancelReply">取消</button>
                            <button
                              class="btn-publish"
                              :class="{ disabled: !commentInput.trim() || publishSubmitting }"
                              @click="handlePublish"
                            >
                              发布
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 展开/收起回复：默认 3 条，超出显示「共 X 条回复，点击查看」 -->
                    <div v-if="shouldShowReplyExpandControl(comment)" class="replies-toggle">
                      <!-- 未展开时显示提示 -->
                      <span
                        v-if="!comment.showAllReplies"
                        class="toggle-link"
                        @click="toggleReplies(comment)"
                      >
                        共{{ getReplyListTotal(comment) }}条回复，点击查看
                      </span>
                      <!-- 展开后显示分页 -->
                      <template v-else>
                        <span class="page-info"
                          >共{{ getTotalReplyPages(comment) }}页
                          {{ getReplyListTotal(comment) }}条回复</span
                        >
                        <span v-if="comment.repliesLoading" class="replies-loading">加载中…</span>
                        <span
                          v-for="page in getTotalReplyPages(comment)"
                          :key="page"
                          class="page-link"
                          :class="{ active: comment.currentReplyPage === page }"
                          @click="changeReplyPage(comment, page)"
                        >
                          {{ page }}
                        </span>
                        <span
                          v-if="
                            comment.currentReplyPage &&
                            comment.currentReplyPage < getTotalReplyPages(comment)
                          "
                          class="page-link"
                          @click="nextReplyPage(comment)"
                        >
                          下一页
                        </span>
                        <span class="page-link" @click="toggleReplies(comment)">收起</span>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
              <div ref="rootLoadMoreSentinelRef" class="comment-root-load-more-tail">
                <span v-if="commentsLoadingMore" class="root-loading-more">加载中…</span>
                <span v-else-if="!commentsHasMore && comments.length > 0" class="root-no-more"
                  >没有更多了</span
                >
              </div>
            </div>

            <!-- 抽屉底部悬浮输入框 - 仅用于发布新评论 -->
            <Transition name="drawer-slide-up">
              <div
                v-if="isLoggedIn && showFloatingInput && !replyingTo"
                class="drawer-floating-input"
              >
                <div class="avatar small">
                  <img :src="avatarUrl" alt="avatar" />
                </div>
                <div class="input-box">
                  <textarea v-model="commentInput" placeholder="写下你的评论..."></textarea>
                  <button
                    class="btn-publish"
                    :class="{ disabled: !commentInput.trim() || publishSubmitting }"
                    @click="handlePublish"
                  >
                    发布
                  </button>
                </div>
              </div>
            </Transition>

            <!-- 抽屉内的举报弹窗 -->
            <Transition name="fade">
              <div v-if="showReportDialog" class="drawer-report-panel" @click.stop>
                <div class="report-header">
                  <h3>举报</h3>
                  <div class="button-group">
                    <button class="btn btn-secondary" @click="closeReportDialog">取消</button>
                    <button
                      class="btn btn-primary"
                      :disabled="reportSubmitting || reportSuccess"
                      @click="submitReport"
                    >
                      提交
                    </button>
                  </div>
                </div>

                <div class="report-content">
                  <div
                    class="report-option"
                    :class="{ active: reportReason === 'spam' }"
                    @click="reportReason = 'spam'"
                  >
                    <span>垃圾内容或违规商业推广</span>
                    <div class="radio" :class="{ checked: reportReason === 'spam' }">
                      <div v-if="reportReason === 'spam'" class="radio-dot"></div>
                    </div>
                  </div>

                  <div
                    class="report-option"
                    :class="{ active: reportReason === 'violence' }"
                    @click="reportReason = 'violence'"
                  >
                    <span>色情、暴力</span>
                    <div class="radio" :class="{ checked: reportReason === 'violence' }">
                      <div v-if="reportReason === 'violence'" class="radio-dot"></div>
                    </div>
                  </div>

                  <div
                    class="report-option"
                    :class="{ active: reportReason === 'harassment' }"
                    @click="reportReason = 'harassment'"
                  >
                    <span>骚扰、欺诈</span>
                    <div class="radio" :class="{ checked: reportReason === 'harassment' }">
                      <div v-if="reportReason === 'harassment'" class="radio-dot"></div>
                    </div>
                  </div>

                  <div
                    class="report-option"
                    :class="{ active: reportReason === 'false' }"
                    @click="reportReason = 'false'"
                  >
                    <span>不实信息</span>
                    <div class="radio" :class="{ checked: reportReason === 'false' }">
                      <div v-if="reportReason === 'false'" class="radio-dot"></div>
                    </div>
                  </div>

                  <div
                    class="report-option"
                    :class="{ active: reportReason === 'other' }"
                    @click="reportReason = 'other'"
                  >
                    <span>其他</span>
                    <div class="radio" :class="{ checked: reportReason === 'other' }">
                      <div v-if="reportReason === 'other'" class="radio-dot"></div>
                    </div>
                  </div>

                  <template v-if="reportReason === 'other'">
                    <p class="hint">请填写举报理由（必填）</p>
                    <textarea
                      v-model="reportDetail"
                      class="report-detail"
                      placeholder="请详细描述..."
                    ></textarea>
                  </template>
                </div>

                <!-- 抽屉内的举报成功提示 -->
                <Transition name="fade">
                  <div v-if="reportSuccess" class="drawer-report-success">举报已受理</div>
                </Transition>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </template>

    <!-- 垂直模式的举报弹窗 -->
    <Transition name="fade">
      <div
        v-if="showReportDialog && layout === 'vertical'"
        class="report-overlay"
        @click="closeReportDialog"
      >
        <div class="report-dialog" @click.stop>
          <div class="report-header">
            <h3>举报</h3>
            <div class="button-group">
              <button class="btn btn-secondary" @click="closeReportDialog">取消</button>
              <button
                class="btn btn-primary"
                :disabled="reportSubmitting || reportSuccess"
                @click="submitReport"
              >
                提交
              </button>
            </div>
          </div>

          <div class="report-content">
            <div
              class="report-option"
              :class="{ active: reportReason === 'spam' }"
              @click="reportReason = 'spam'"
            >
              <span>垃圾内容或违规商业推广</span>
              <div class="radio" :class="{ checked: reportReason === 'spam' }">
                <div v-if="reportReason === 'spam'" class="radio-dot"></div>
              </div>
            </div>

            <div
              class="report-option"
              :class="{ active: reportReason === 'violence' }"
              @click="reportReason = 'violence'"
            >
              <span>色情、暴力</span>
              <div class="radio" :class="{ checked: reportReason === 'violence' }">
                <div v-if="reportReason === 'violence'" class="radio-dot"></div>
              </div>
            </div>

            <div
              class="report-option"
              :class="{ active: reportReason === 'harassment' }"
              @click="reportReason = 'harassment'"
            >
              <span>骚扰、欺诈</span>
              <div class="radio" :class="{ checked: reportReason === 'harassment' }">
                <div v-if="reportReason === 'harassment'" class="radio-dot"></div>
              </div>
            </div>

            <div
              class="report-option"
              :class="{ active: reportReason === 'false' }"
              @click="reportReason = 'false'"
            >
              <span>不实信息</span>
              <div class="radio" :class="{ checked: reportReason === 'false' }">
                <div v-if="reportReason === 'false'" class="radio-dot"></div>
              </div>
            </div>

            <div
              class="report-option"
              :class="{ active: reportReason === 'other' }"
              @click="reportReason = 'other'"
            >
              <span>其他</span>
              <div class="radio" :class="{ checked: reportReason === 'other' }">
                <div v-if="reportReason === 'other'" class="radio-dot"></div>
              </div>
            </div>

            <template v-if="reportReason === 'other'">
              <p class="hint">请填写举报理由（必填）</p>
              <textarea
                v-model="reportDetail"
                class="report-detail"
                placeholder="请详细描述..."
              ></textarea>
            </template>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 垂直模式的举报成功提示 -->
    <Transition name="fade">
      <div v-if="reportSuccess && layout === 'vertical'" class="report-success">举报已受理</div>
    </Transition>
  </div>
</template>

<style scoped>
.comment-widget {
  font-family: Inter, sans-serif;
  box-sizing: border-box;
}

/* 垂直模式 */
.vertical-container {
  margin: 0 auto;
  /* padding: 40px 20px; */
}

/* 亮色主题 */
.theme-light {
  --bg-primary: #ffffff;
  --text-primary: #222222;
  --text-secondary: #999999;
  --border-color: #e4e7eb;
  --theme-color: #2784ff;
}

/* 暗黑主题 */
.theme-dark {
  --bg-primary: #222222;
  --text-primary: #ffffff;
  --text-secondary: #999999;
  --border-color: rgba(255, 255, 255, 0.2);
  --theme-color: #2784ff;
}

/* 登录提示 */
.login-prompt {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px 164px;
  background: var(--bg-color);
  border-radius: 4px;
  margin-bottom: 30px;
}

.login-prompt span {
  font-size: 14px;
  color: var(--text-primary);
}

.btn-login {
  padding: 9px 20px;
  background: var(--theme-color);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-login:hover {
  opacity: 0.8;
}

/* 评论输入框 */
.comment-input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background: var(--bg-color);
  border-radius: 4px;
  padding: 10px;
  padding-left: 0;
  padding-right: 0;
}

/* 回复输入框 */
.reply-input-section {
  display: flex;
  gap: 10px;
  padding: 10px;
  margin-top: 10px;
  margin-left: 50px;
  background: var(--bg-color);
  border-radius: 4px;
}

/* 嵌套回复输入框（回复的回复） */
.reply-input-section.nested {
  margin-left: 0;
  margin-top: 10px;
}

/* 回复输入框动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease-in-out;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid var(--border-color);

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
}

.avatar.small {
  width: 30px;
  height: 30px;
}

.input-box {
  flex: 1;
  position: relative;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 10px;
  min-height: 60px;
}

.input-box textarea {
  width: 100%;
  height: 40px;
  border: none;
  outline: none;
  resize: none;
  font-family: Inter, sans-serif;
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;
}

.btn-publish,
.btn-cancel-reply {
  position: absolute;
  bottom: 10px;
  padding: 6px 15px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-publish {
  right: 10px;
  background: var(--theme-color);
  color: #fff;
}

.btn-cancel-reply {
  right: 80px;
  background: var(--border-color);
  color: #666;
}

.btn-publish.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-publish:not(.disabled):hover {
  opacity: 0.8;
}

/* 评论列表 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-root-load-more-tail {
  padding: 8px 0 4px;
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 18px;
}

.comment-root-load-more-tail .root-loading-more,
.comment-root-load-more-tail .root-no-more {
  opacity: 0.75;
}

.comment-item {
  background: var(--bg-color);
  border-radius: 4px;
}

.comment-main {
  display: flex;
  gap: 10px;
  padding: 10px;
}

.comment-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.user-role {
  padding: 0 5px;
  color: #fff;
  font-size: 11px;
  line-height: 1.64;
  border-radius: 4px;
}

.username {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--text-primary);
}

.reply-to {
  font-size: 12px;
  color: var(--text-secondary);
}

.comment-content-text {
  display: flex;
  gap: 10px;
  font-size: 14px;
  line-height: 1.43;
  color: var(--text-primary);
  word-break: break-word;
}

.comment-content-text.blocked {
  display: flex;
  gap: 10px;
}

.blocked-text {
  color: var(--text-secondary);
}

.blocked-content {
  opacity: 0.4;
}

.view-link,
.collapse-link,
.toggle-link {
  color: var(--theme-color);
  cursor: pointer;
}

.view-link:hover,
.collapse-link:hover,
.toggle-link:hover {
  text-decoration: underline;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 12px;
  line-height: 1.5;
}

.time {
  color: var(--text-secondary);
}

.action {
  color: var(--text-secondary);
  cursor: pointer;
}

.action:hover {
  color: var(--theme-color);
}

.action-button {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 2px;
}

.action-button:hover {
  color: var(--theme-color);
}

.action-button svg,
.action-button img {
  width: 14px;
  height: 14px;
}

.action-button.more svg,
.action-button.more img {
  width: 14px;
  height: 3px;
}

/* 点赞数：仅 v-if 有时存在，不占空位 */
.like-count {
  font-variant-numeric: tabular-nums;
  line-height: 14px;
}

/* 回复区域 */
.replies-section {
  padding: 0 0 0 50px;
}

.replies {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reply-item {
  padding-left: 0;
}

.replies-toggle {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 15px;
  padding: 8px 0 0;
  margin-top: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.toggle-link {
  color: var(--text-secondary);
  cursor: pointer;
}

.toggle-link:hover {
  color: var(--theme-color);
}

.page-info {
  color: var(--text-secondary);
}

.page-link {
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}

.page-link:hover {
  color: var(--theme-color);
}

.page-link.active {
  color: var(--theme-color);
  font-weight: 600;
}

.replies-loading {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 底部悬浮输入框 */
.floating-input {
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translate(-50%, 0);
  /* width: calc(100% - 40px); */
  /* min-width: 1280px; */
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(4px);
  box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  z-index: 100;
}

.theme-dark .floating-input {
  background: rgba(34, 34, 34, 0.8);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.3s,
    opacity 0.3s;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translate(-50%, 100%);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translate(-50%, 0);
  opacity: 1;
}

/* 更多菜单 */
.more-menu {
  position: fixed;
  width: 110px;
  background: var(--bg-color);
  border-radius: 4px;
  box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.2);
  padding: 10px 0;
  z-index: 3000;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover {
  background: var(--theme-color);
  color: #fff;
}

.menu-item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.menu-item.primary {
  background: var(--theme-color);
  color: #fff;
}

.menu-item.primary:hover {
  background: var(--theme-color);
  opacity: 0.9;
}

.menu-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--text-primary);
  transition: color 0.2s;
}

.menu-item:hover svg {
  color: #fff;
}

.theme-dark .menu-item:hover {
  background: var(--theme-color);
  color: #fff;
}

/* 举报弹窗（垂直模式和抽屉模式共用） */
.report-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.report-dialog {
  width: 700px;
  max-height: 90vh;
  background: var(--bg-color);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid var(--border-color);
  height: 70px;
}

.report-header h3 {
  font-size: 20px;
  font-weight: 400;
  margin: 0;
  color: var(--text-primary);
}

.button-group {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 9px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* .btn-secondary {
  background: var(--border-color);
  color: #666;
} */

.btn-primary {
  background: var(--theme-color);
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 亮色模式按钮 */
.comment-widget.theme-light .report-dialog .btn-secondary {
  background: #e4e7eb;
  color: #666;
}

.comment-widget.theme-light .report-dialog .btn-secondary:hover {
  background: #d0d3d7;
}

/* 暗黑模式按钮 */
.comment-widget.theme-dark .report-dialog .btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.comment-widget.theme-dark .report-dialog .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.report-content {
  padding: 30px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.report-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.report-option:hover {
  border-color: var(--theme-color);
}

.report-option.active {
  background: rgba(39, 132, 255, 0.1);
  border-color: var(--theme-color);
}

.radio {
  width: 16px;
  height: 16px;
  border: 1px solid var(--text-primary);
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio.checked {
  border-color: var(--theme-color);
}

.radio-dot {
  width: 10px;
  height: 10px;
  background: var(--theme-color);
  border-radius: 50%;
}

.hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 10px;
}

.hint {
  font-size: 12px;
  line-height: 18px;
  color: var(--text-secondary);
  margin: 10px 0 0;
}

.report-detail {
  width: 100%;
  height: 160px;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: Inter, sans-serif;
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;
  resize: none;
  outline: none;
}

/* 垂直模式的举报成功提示 */
.report-success {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 10px 30px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 20px;
  z-index: 3001;
}

/* 亮色模式 */
.comment-widget.theme-light .report-success {
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
}

/* 暗黑模式 */
.comment-widget.theme-dark .report-success {
  background: rgba(255, 255, 255, 0.4);
  color: #222;
}

/* 抽屉内的举报面板 */
.drawer-report-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 700px;
  max-width: 90vw;
  background: var(--bg-color);
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
}

.drawer-report-panel .report-header {
  padding: 20px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.drawer-report-panel .report-header h3 {
  font-size: 20px;
  line-height: 26px;
  font-weight: 400;
  color: var(--text-primary);
  margin: 0;
}

.drawer-report-panel .button-group {
  display: flex;
  gap: 10px;
}

.drawer-report-panel .btn {
  padding: 9px 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

/* 亮色模式按钮 */
.comment-widget.theme-light .drawer-report-panel .btn-secondary {
  background: #e4e7eb;
  color: #666;
}

.comment-widget.theme-light .drawer-report-panel .btn-secondary:hover {
  background: #d0d3d7;
}

/* 暗黑模式按钮 */
.comment-widget.theme-dark .drawer-report-panel .btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.comment-widget.theme-dark .drawer-report-panel .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.drawer-report-panel .btn-primary {
  background: #2784ff;
  color: #fff;
}

.drawer-report-panel .btn-primary:hover {
  background: #1a73e8;
}

.drawer-report-panel .report-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drawer-report-panel .report-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.drawer-report-panel .report-option:hover {
  border-color: var(--theme-color);
}

.drawer-report-panel .report-option.active {
  background: rgba(39, 132, 255, 0.1);
  border-color: var(--theme-color);
}

.drawer-report-panel .report-option span {
  font-size: 14px;
  line-height: 20px;
  color: var(--text-primary);
}

.drawer-report-panel .radio {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  position: relative;
  transition: all 0.2s;
}

/* 亮色模式单选框 */
.comment-widget.theme-light .drawer-report-panel .radio {
  border: 1px solid #222;
}

.comment-widget.theme-light .drawer-report-panel .radio.checked {
  border-color: var(--theme-color);
}

/* 暗黑模式单选框 */
.comment-widget.theme-dark .drawer-report-panel .radio {
  border: 1px solid #fff;
}

.comment-widget.theme-dark .drawer-report-panel .radio.checked {
  border-color: var(--theme-color);
}

.drawer-report-panel .radio-dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--theme-color);
}

.drawer-report-panel .hint {
  font-size: 12px;
  line-height: 18px;
  color: var(--text-secondary);
  margin: 10px 0 0;
}

.drawer-report-panel .report-detail {
  width: 100%;
  height: 160px;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 20px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.drawer-report-panel .report-detail:focus {
  border-color: var(--theme-color);
}

.drawer-report-panel .report-detail::placeholder {
  color: var(--text-secondary);
}

/* 抽屉内的举报成功提示 */
.drawer-report-success {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 10px 30px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 20px;
  z-index: 101;
  pointer-events: none;
}

/* 亮色模式 */
.comment-widget.theme-light .drawer-report-success {
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
}

/* 暗黑模式 */
.comment-widget.theme-dark .drawer-report-success {
  background: rgba(255, 255, 255, 0.4);
  color: #222;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 抽屉模式 */
.drawer-triggers {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
}

.float-button {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-dark .float-button {
  color: #fff;
}

.theme-light .float-button {
  color: #000;
  border-color: rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.9);
}

.float-button:hover {
  transform: scale(1.05);
}

.float-button .badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: #ff4757;
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}

/* 抽屉覆盖层 */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
}

/* 抽屉内容 */
.drawer-content {
  position: relative;
  width: 700px;
  max-width: 90vw;
  height: 100vh;
  background: var(--bg-color);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (max-width: 768px) {
  .drawer-content {
    width: 100vw;
    max-width: 100vw;
  }
}

/* 抽屉头部 */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  height: 70px;
}

.drawer-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
}

/* 抽屉主体 */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 100px; /* 为悬浮输入框留出空间 */
  background: var(--bg-color);
}

.drawer-body .comment-list {
  margin-top: 0;
}

.drawer-body .login-prompt {
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.drawer-body .comment-input-section {
  margin-bottom: 20px;
  padding: 10px;
  background: var(--bg-color);
  border-radius: 8px;
}

/* 抽屉中的回复输入框 */
.drawer-body .reply-input-section {
  margin-left: 40px;
  margin-top: 10px;
  margin-bottom: 10px;
}

/* 抽屉中的嵌套回复输入框 */
.drawer-body .reply-input-section.nested {
  margin-left: 0;
  margin-top: 10px;
  margin-bottom: 10px;
}

/* 抽屉中的评论项样式优化 */
.drawer-body .comment-item {
  margin-bottom: 10px;
}

/* 抽屉滚动条样式 */
.drawer-body::-webkit-scrollbar {
  width: 6px;
}

.drawer-body::-webkit-scrollbar-track {
  background: transparent;
}

.drawer-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.drawer-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.theme-dark .drawer-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.theme-dark .drawer-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 抽屉悬浮输入框 */
.drawer-floating-input {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  box-shadow: 0px -2px 15px 0px rgba(0, 0, 0, 0.08);
  border-top: 1px solid var(--border-color);
  z-index: 10;
}

.theme-dark .drawer-floating-input {
  background: rgba(34, 34, 34, 0.98);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.drawer-floating-input .input-box {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px 10px;
  min-height: 50px;
  position: relative;
}

.drawer-floating-input .input-box textarea {
  width: 100%;
  height: 34px;
  border: none;
  outline: none;
  resize: none;
  font-family: Inter, sans-serif;
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;
}

.drawer-floating-input .btn-publish,
.drawer-floating-input .btn-cancel-reply {
  position: absolute;
  bottom: 8px;
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.drawer-floating-input .btn-publish {
  right: 10px;
  background: var(--theme-color);
  color: #fff;
}

.drawer-floating-input .btn-cancel-reply {
  right: 70px;
  background: var(--border-color);
  color: #666;
}

.drawer-floating-input .btn-publish.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.drawer-floating-input .btn-publish:not(.disabled):hover {
  opacity: 0.9;
}

/* 抽屉悬浮输入框动画 */
.drawer-slide-up-enter-active,
.drawer-slide-up-leave-active {
  transition: all 0.25s ease-out;
}

.drawer-slide-up-enter-from,
.drawer-slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.drawer-slide-up-enter-to,
.drawer-slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}

/* 抽屉滑入动画 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from .drawer-content,
.slide-right-leave-to .drawer-content {
  transform: translateX(100%);
}

.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
}

.slide-right-enter-to,
.slide-right-leave-from {
  opacity: 1;
}

.slide-right-enter-to .drawer-content,
.slide-right-leave-from .drawer-content {
  transform: translateX(0);
}
</style>
