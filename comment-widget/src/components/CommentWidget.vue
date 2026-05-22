<script setup lang="ts">
import iconLikeFull from "@/assets/icon-like-full.svg";
import LikeIconOutline from "./LikeIconOutline.vue";
import { useCommentWidget, type CommentWidgetProps } from "./useCommentWidget";

const props = withDefaults(defineProps<CommentWidgetProps>(), {
  theme: "light",
  layout: "vertical",
  show: false,
  isLoggedIn: false
});

const {
  verticalContainerWidth,
  hostSurfaceStyle,
  drawerVisible,
  commentInput,
  replyingTo,
  comments,
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
  commentsLoadingMore,
  commentsHasMore,
  publishSubmitting,
  blockSubmitting,
  deleteSubmitting,
  handleLogin,
  handlePublish,
  handleReply,
  cancelReply,
  commentAvatarStyle,
  toggleLike,
  hasLikeCount,
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
  toggleReplies,
  changeReplyPage,
  nextReplyPage,
  submitReport,
  closeReportDialog,
  roleColors,
  roleNames,
  toggleDrawer,
  handleDrawerScroll
} = useCommentWidget(props);

void [
  inputContainerRef,
  commentListRef,
  drawerInputRef,
  drawerListRef,
  drawerBodyRef,
  rootLoadMoreSentinelRef
];
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

    <!-- 更多菜单：挂到 body，避免抽屉 overflow/transform 裁剪 fixed 子节点 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showMoreMenu"
          class="more-menu"
          :style="{
            left: `${moreMenuPosition.left}px`,
            top: moreMenuPosition.top != null ? `${moreMenuPosition.top}px` : 'auto',
            bottom: moreMenuPosition.bottom != null ? `${moreMenuPosition.bottom}px` : 'auto'
          }"
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
    </Teleport>

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

<style scoped src="./CommentWidget.css"></style>
