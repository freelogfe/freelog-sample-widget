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

export interface CommentWidgetProps {
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
  /** 当前登录用户的 userId，与评论条的 userId 比对；宿主传入后即可禁止举报本人评论 */
  currentUserId?: number;
  /** 抽屉关闭时回传主应用，与 data.onClose 一致 */
  onClose?: () => void;
  onLogin?: () => void;
  isLoggedIn?: boolean;
  /** 宿主页背景（如音乐主题 --bg-color），与评论区底色一致 */
  pageBackground?: string;
  pageColor?: string;
  /** 第一层级文字色：标题、正文、主按钮文案等 */
  textPrimary?: string;
  /** 第二层级文字色：时间、次信息、弱化说明*/
  textSecondary?: string;
  /** 边框色，与宿主 --border-color 同步 */
  borderColor?: string;
}

export interface Comment {
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
  /** 被回复用户角色（创作者 / 策展人） */
  replyToUserRole?: "curator" | "creator";
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

export type ReplyPageLinkItem = { type: "page"; page: number } | { type: "ellipsis" };

/** 发表评论 / 回复内容最大字符数 */
export const COMMENT_MAX_LENGTH = 1000;

export function useCommentWidget(props: CommentWidgetProps) {
const verticalContainerWidth = computed(() => {
  const width = document.querySelector(".vertical-container")?.clientWidth;
  return width ? `${width}px` : "100%";
});

/** 宿主注入的页面背景与字色，覆盖 theme-light/theme-dark 内默认 token */
const hostSurfaceStyle = computed(() => {
  const s: Record<string, string> = {};
  if (props.pageBackground) s.background = props.pageBackground;
  if (props.pageColor) s["--page-color"] = props.pageColor;
  if (props.textPrimary) s["--text-primary"] = props.textPrimary;
  if (props.textSecondary) s["--text-secondary"] = props.textSecondary;
  if (props.borderColor) s["--border-color"] = props.borderColor;
  return Object.keys(s).length ? s : undefined;
});

const drawerVisible = ref(false);
const commentInput = ref("");
const replyingTo = ref<Comment | null>(null);
const comments = ref<Comment[]>([]);
const visibleComments = computed(() => comments.value.filter(isCommentVisibleToViewer));

// 更多菜单相关
const showMoreMenu = ref<string | null>(null);
/** 固定定位下拉菜单：`top` / `bottom` 二选一，避免贴底时被裁掉「屏蔽」等项 */
const moreMenuPosition = ref<{
  left: number;
  top: number | null;
  bottom: number | null;
}>({ left: 0, top: 0, bottom: null });

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

watch(
  () => props.layout === "drawer" && drawerVisible.value,
  open => {
    document.documentElement.classList.toggle("comment-drawer-open", open);
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
const actionToastMessage = ref("");
let actionToastTimer: ReturnType<typeof setTimeout> | null = null;

function showActionToast(message: string, durationMs = 2000) {
  if (actionToastTimer) clearTimeout(actionToastTimer);
  actionToastMessage.value = message;
  actionToastTimer = setTimeout(() => {
    actionToastMessage.value = "";
    actionToastTimer = null;
  }, durationMs);
}

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

/** 用展品 articleUserId / nodeUserId 与目标 userId 推断创作者或策展人 */
function inferUserRoleFromExhibit(
  userId: number | undefined,
  articleUserId?: number,
  nodeUserId?: number
): Comment["userRole"] {
  if (userId == null || Number.isNaN(Number(userId))) return undefined;
  const u = Number(userId);

  if (articleUserId != null && !Number.isNaN(Number(articleUserId)) && Number(articleUserId) === u) {
    return "creator";
  }

  if (nodeUserId != null && !Number.isNaN(Number(nodeUserId)) && Number(nodeUserId) === u) {
    return "curator";
  }

  return undefined;
}

/** 后端无 userRole：用 articleUserId / nodeUserId 与评论 userId 推断；两者同时命中时创作者优先 */
function inferCommentUserRole(item: CommentThreadItem): Comment["userRole"] {
  return inferUserRoleFromExhibit(item.userId, item.articleUserId, item.nodeUserId);
}

function findUserIdInThread(node: CommentThreadItem, username: string): number | undefined {
  if (String(node.username ?? "") === username && node.userId != null) {
    return node.userId;
  }
  for (const child of node.replies ?? []) {
    const found = findUserIdInThread(child, username);
    if (found != null) return found;
  }
  return undefined;
}

function mapThreadToComment(
  item: CommentThreadItem,
  isRootThread = true,
  threadRoot?: CommentThreadItem
): Comment {
  const id = String(item.id ?? item._id ?? "");
  const root = threadRoot ?? item;
  const children = (item.replies ?? []).map(ch => mapThreadToComment(ch, false, root));
  const replyTo =
    item.recipientInfo?.username != null && String(item.recipientInfo.username).trim()
      ? String(item.recipientInfo.username)
      : undefined;
  const recipientUserId =
    item.recipientInfo?.userId ??
    (replyTo ? findUserIdInThread(root, replyTo) : undefined);
  const replyToUserRole = inferUserRoleFromExhibit(
    recipientUserId,
    root.articleUserId,
    root.nodeUserId
  );
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
    replyToUserRole,
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

  if (!props.isLoggedIn) {
    props.onLogin?.();
    return;
  }
  
  const text = commentInput.value.trim();
  if (!text || publishSubmitting.value) return;
  if (text.length > COMMENT_MAX_LENGTH) {
    alert(`评论内容不能超过 ${COMMENT_MAX_LENGTH} 字`);
    return;
  }

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
  if (!canReplyToComment(comment, parentComment)) return;
  if (!props.isLoggedIn) {
    props.onLogin?.();
    return;
  }
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
const toggleLike = async (comment: Comment, parentComment?: Comment) => {
  if (!canLikeComment(comment, parentComment)) return;
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

function resolvedViewerUserId(): number | undefined {
  const raw = props.currentUserId;
  if (raw != null && Number.isFinite(Number(raw))) return Number(raw);
  return undefined;
}

function commentIsOwnByViewer(comment: Comment): boolean {
  const vid = resolvedViewerUserId();
  const aid = comment.userId;
  if (vid == null || aid == null) return false;
  return Number(vid) === Number(aid);
}

/** 是否展示「已屏蔽」视觉：仅节点商可见，发布者本人无感 */
function shouldShowBlockedUI(comment: Comment): boolean {
  return !!(comment.isBlocked && props.isNodeAdmin && !commentIsOwnByViewer(comment));
}

/** 子评论是否因父评论被屏蔽而呈现屏蔽态（父评论发布者看自己线程时无感） */
function shouldInheritParentBlockedUI(parentComment: Comment): boolean {
  return shouldShowBlockedUI(parentComment);
}

/** 当前浏览者是否能看到该评论（被屏蔽时：发布者无感可见，节点商可见，其他用户不可见） */
function isCommentVisibleToViewer(comment: Comment): boolean {
  if (!comment.isBlocked) return true;
  if (commentIsOwnByViewer(comment)) return true;
  if (props.isNodeAdmin) return true;
  return false;
}

function getVisibleReplies(comment: Comment): Comment[] {
  if (!comment.replies) return [];
  return comment.replies.filter(r => isCommentVisibleToViewer(r));
}

function hasVisibleReplies(comment: Comment): boolean {
  return getVisibleReplies(comment).length > 0;
}

/** 父评论被屏蔽且未展开时，节点商不展示子评论区 */
function shouldShowRepliesSection(comment: Comment): boolean {
  if (!hasVisibleReplies(comment)) return false;
  if (!shouldShowBlockedUI(comment)) return true;
  return !!comment.isExpanded;
}

/** 节点商可删任意评论；发布者可删自己的评论 */
function canDeleteComment(comment: Comment): boolean {
  if (!props.isLoggedIn) return false;
  if (props.isNodeAdmin) return true;
  return commentIsOwnByViewer(comment);
}

/** 「更多」里是否展示举报（不能举报本人评论；已屏蔽的评论不展示举报） */
function showReportInMoreMenuFor(comment: Comment): boolean {
  if (comment.isBlocked) return false;
  return !commentIsOwnByViewer(comment);
}

function countMoreMenuRows(comment: Comment): number {
  let n = 0;
  if (canDeleteComment(comment)) n += 1;
  if (showReportInMoreMenuFor(comment)) n += 1;
  if (props.isNodeAdmin && !comment.isBlocked) n += 1;
  return n;
}

function commentHasMoreMenuActions(comment: Comment): boolean {
  return countMoreMenuRows(comment) > 0;
}

/** 节点商不可对已屏蔽评论（含父评论已屏蔽时的子评论）点赞/回复 */
function isBlockedForNodeAdminInteraction(
  comment: Comment,
  parentComment?: Comment
): boolean {
  return !!(comment.isBlocked || parentComment?.isBlocked);
}

/** 节点商不可对已屏蔽评论点赞 */
function canLikeComment(comment: Comment, parentComment?: Comment): boolean {
  return !(props.isNodeAdmin && isBlockedForNodeAdminInteraction(comment, parentComment));
}

/** 节点商不可对已屏蔽评论回复 */
function canReplyToComment(comment: Comment, parentComment?: Comment): boolean {
  return !(props.isNodeAdmin && isBlockedForNodeAdminInteraction(comment, parentComment));
}

const toggleMoreMenu = (commentId: string, event: MouseEvent) => {
  event.stopPropagation();
  const opener = findCommentById(commentId);
  if (!opener || countMoreMenuRows(opener) === 0) {
    return;
  }
  if (showMoreMenu.value === commentId) {
    showMoreMenu.value = null;
  } else {
    showMoreMenu.value = commentId;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const GAP = 8;
    const MENU_W = 110;
    const menuPad = 20;
    const rowH = 44;
    const menuRows = countMoreMenuRows(opener);
    const estimatedH = menuPad + rowH * menuRows;
    const margin = 8;
    const left = Math.max(margin, Math.min(rect.left, vw - MENU_W - margin));
    const spaceBelow = vh - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;
    /** 下方放不下时翻到上方（上方够高或比下方更宽裕时翻转） */
    const openAbove =
      spaceBelow < estimatedH &&
      (spaceAbove >= estimatedH || spaceAbove > spaceBelow);
    moreMenuPosition.value = openAbove
      ? { left, top: null, bottom: vh - rect.top + GAP }
      : { left, top: rect.bottom + GAP, bottom: null };
  }
};

const closeMoreMenu = () => {
  showMoreMenu.value = null;
};

/** 任意滚动（含列表/抽屉内 overflow）时收起「更多」菜单；Teleport 菜单不在触发元素树内需全局监听 */
function closeMoreMenuOnScroll() {
  if (showMoreMenu.value) closeMoreMenu();
}

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
  if (!canDeleteComment(comment)) return;
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
    showActionToast("删除成功");
  } catch (e) {
    alert(e instanceof Error ? e.message : "网络错误，请稍后重试");
  } finally {
    deleteSubmitting.value = false;
  }
};

const handleReport = () => {
  if (!props.isLoggedIn) {
    props.onLogin?.();
    return;
  }
  const c = menuTargetComment.value;
  if (!c || !showReportInMoreMenuFor(c)) return;
  const id = c.id?.trim() || null;
  if (!id) return;
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
    const target = findCommentById(comment.id) ?? comment;
    target.isBlocked = true;
    target.isExpanded = false;
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
    closeMoreMenu();
    const target = findCommentById(comment.id) ?? comment;
    target.isBlocked = false;
    target.isExpanded = false;
  } catch (e) {
    alert(e instanceof Error ? e.message : "网络错误，请稍后重试");
  } finally {
    blockSubmitting.value = false;
  }
};

const toggleBlockedComment = (comment: Comment) => {
  comment.isExpanded = !comment.isExpanded;
};

/** 垂直模式折叠时预览条数 */
const REPLY_PREVIEW_SIZE_VERTICAL = 3;

/** 展开回复后每页条数（垂直 / 抽屉一致） */
const REPLY_PAGE_SIZE_EXPANDED = 10;

/** 折叠预览：垂直 / 抽屉均为 3 条 */
function getReplyPreviewSize(): number {
  return REPLY_PREVIEW_SIZE_VERTICAL;
}

function getReplyExpandedPageSize(): number {
  return REPLY_PAGE_SIZE_EXPANDED;
}

function getReplyPageSize(comment: Comment): number {
  return comment.showAllReplies ? getReplyExpandedPageSize() : getReplyPreviewSize();
}

/** 回复条数：节点商用接口 total；其他角色只计当前可见回复 */
function getReplyListTotal(comment: Comment): number {
  const loaded = comment.replies?.length ?? 0;
  const reported = comment.totalReplies;
  if (props.isNodeAdmin) {
    if (reported != null && reported > 0) {
      return Math.max(reported, loaded);
    }
    return loaded;
  }
  return getVisibleReplies(comment).length;
}

/** 当前 UI 展示所需的最少已加载子评论数（折叠=第 1 页，展开=当前页及之前） */
function getRequiredLoadedReplyCount(comment: Comment): number {
  const pageSize = getReplyPageSize(comment);
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
  const pageSize = getReplyPreviewSize();
  return hasVisibleReplies(comment) && getReplyListTotal(comment) > pageSize;
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
  const pageSize = getReplyExpandedPageSize();
  const totalPages = Math.ceil(getReplyListTotal(comment) / pageSize);
  if (comment.currentReplyPage && comment.currentReplyPage < totalPages) {
    comment.currentReplyPage++;
    void fetchMoreSubRepliesIfNeeded(comment);
  }
};

const getDisplayedReplies = (comment: Comment) => {
  const visible = getVisibleReplies(comment);
  if (!visible.length) return [];

  if (!comment.showAllReplies) {
    return visible.slice(0, getReplyPreviewSize());
  }
  const pageSize = getReplyExpandedPageSize();
  const page = comment.currentReplyPage || 1;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return visible.slice(startIndex, endIndex);
};

const getTotalReplyPages = (comment: Comment) => {
  const pageSize = getReplyExpandedPageSize();
  return Math.ceil(getReplyListTotal(comment) / pageSize);
};

/** 折叠页码：始终保留首尾页，当前页及相邻页，中间用省略号 */
function buildReplyPageLinks(
  totalPages: number,
  currentPage: number,
  siblingCount = 1,
  boundaryCount = 1
): ReplyPageLinkItem[] {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => ({
      type: "page" as const,
      page: i + 1
    }));
  }

  const pages = new Set<number>();
  for (let i = 1; i <= Math.min(boundaryCount, totalPages); i++) pages.add(i);
  for (let i = Math.max(1, totalPages - boundaryCount + 1); i <= totalPages; i++) {
    pages.add(i);
  }
  for (let i = currentPage - siblingCount; i <= currentPage + siblingCount; i++) {
    if (i >= 1 && i <= totalPages) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items: ReplyPageLinkItem[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const page = sorted[i]!;
    if (i > 0 && page - sorted[i - 1]! > 1) {
      items.push({ type: "ellipsis" });
    }
    items.push({ type: "page", page });
  }
  return items;
}

const getReplyPageLinkItems = (comment: Comment): ReplyPageLinkItem[] => {
  const totalPages = getTotalReplyPages(comment);
  const currentPage = comment.currentReplyPage || 1;
  return buildReplyPageLinks(totalPages, currentPage);
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
  const reported = findCommentById(commentId);
  if (reported && !showReportInMoreMenuFor(reported)) {
    alert("不能举报自己的评论");
    closeReportDialog();
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
  creator: props.pageColor
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
  closeMoreMenuOnScroll();
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
 * - setInterval：iframe 内兜底轮询，仅更新「顶栏是否滚出」（不可关「更多」菜单，否则约 120ms 会误关一次导致闪烁）
 *
 * 卸载：所有注册推入 cleanups，组件卸载时一次性执行，避免泄漏。
 */
let unbindParentScroll: (() => void) | null = null;

function bindParentScrollListeners() {
  const cleanups: Array<() => void> = [];
  try {
    const p = window.parent;
    if (!p || p === window) return;

    const onDockFloatingInputOnly = handleScroll;

    /** 宿主真实滚动或视口变化时：更新悬浮输入 + 收起「更多」菜单 */
    const onParentScrollOrViewportChange = () => {
      handleScroll();
      closeMoreMenuOnScroll();
    };

    /** 宿主滚动手势：scroll 不可靠时用 wheel/touchmove 间接触发；同时收菜单 */
    const bumpWheelOrTouchForDock = () => {
      handleScroll();
      closeMoreMenuOnScroll();
    };

    p.addEventListener("resize", onParentScrollOrViewportChange);
    cleanups.push(() => p.removeEventListener("resize", onParentScrollOrViewportChange));

    const scrollTarget: EventTarget = p.document.getElementById("app") ?? p;
    scrollTarget.addEventListener("scroll", onParentScrollOrViewportChange, passiveScroll);
    cleanups.push(() => scrollTarget.removeEventListener("scroll", onParentScrollOrViewportChange));

    const vv = p.visualViewport;
    if (vv) {
      vv.addEventListener("scroll", onParentScrollOrViewportChange, passiveScroll);
      vv.addEventListener("resize", onParentScrollOrViewportChange);
      cleanups.push(() => {
        vv.removeEventListener("scroll", onParentScrollOrViewportChange);
        vv.removeEventListener("resize", onParentScrollOrViewportChange);
      });
    }

    const doc = p.document;
    doc.addEventListener("wheel", bumpWheelOrTouchForDock, passiveCapture);
    doc.addEventListener("touchmove", bumpWheelOrTouchForDock, passiveCapture);
    doc.addEventListener("scroll", closeMoreMenuOnScroll, passiveCapture);
    cleanups.push(() => {
      doc.removeEventListener("wheel", bumpWheelOrTouchForDock, passiveCapture);
      doc.removeEventListener("touchmove", bumpWheelOrTouchForDock, passiveCapture);
      doc.removeEventListener("scroll", closeMoreMenuOnScroll, passiveCapture);
    });

    if (window.frameElement) {
      /** 仅轮询「顶栏是否滚出」；勿在此关菜单，否则会每 ~120ms 误关闪烁 */
      const id = window.setInterval(onDockFloatingInputOnly, 120);
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
  window.addEventListener("scroll", closeMoreMenuOnScroll, passiveScroll);
  window.addEventListener("resize", handleScroll);
  window.addEventListener("click", closeMoreMenu);
  /** 捕获子树内任意滚动（不冒泡的 scroll）；与 window 兜底并用 */
  document.addEventListener("scroll", closeMoreMenuOnScroll, passiveCapture);

  bindParentScrollListeners();

  setTimeout(() => {
    handleScroll();
    handleDrawerScroll();
  }, 100);
});

onUnmounted(() => {
  if (actionToastTimer) clearTimeout(actionToastTimer);
  document.documentElement.classList.remove("comment-drawer-open");
  window.removeEventListener("scroll", handleScroll, passiveScroll);
  window.removeEventListener("scroll", closeMoreMenuOnScroll, passiveScroll);
  window.removeEventListener("resize", handleScroll);
  window.removeEventListener("click", closeMoreMenu);
  document.removeEventListener("scroll", closeMoreMenuOnScroll, passiveCapture);
  unbindParentScroll?.();
  unbindParentScroll = null;
});

  return {
    verticalContainerWidth,
    hostSurfaceStyle,
    drawerVisible,
    commentInput,
    COMMENT_MAX_LENGTH,
    replyingTo,
    comments,
    visibleComments,
    showMoreMenu,
    moreMenuPosition,
    showReportDialog,
    reportReason,
    reportDetail,
    reportSuccess,
    reportSubmitting,
    showFloatingInput,
    inputContainerRef,
    commentListRef,
    drawerInputRef,
    drawerListRef,
    drawerBodyRef,
    rootLoadMoreSentinelRef,
    commentsLoading,
    commentsLoadingMore,
    commentsHasMore,
    publishSubmitting,
    blockSubmitting,
    deleteSubmitting,
    actionToastMessage,
    handleLogin,
    handlePublish,
    handleReply,
    cancelReply,
    commentAvatarStyle,
    toggleLike,
    hasLikeCount,
    commentHasMoreMenuActions,
    canLikeComment,
    canReplyToComment,
    canDeleteComment,
    shouldShowBlockedUI,
    shouldInheritParentBlockedUI,
    shouldShowRepliesSection,
    showReportInMoreMenuFor,
    toggleMoreMenu,
    closeMoreMenu,
    menuTargetComment,
    handleDelete,
    handleReport,
    handleBlock,
    handleUnblock,
    toggleBlockedComment,
    getDisplayedReplies,
    shouldShowReplyExpandControl,
    getReplyListTotal,
    getTotalReplyPages,
    getReplyPageLinkItems,
    toggleReplies,
    changeReplyPage,
    nextReplyPage,
    submitReport,
    closeReportDialog,
    roleColors,
    roleNames,
    toggleDrawer,
    handleDrawerScroll
  };
}
