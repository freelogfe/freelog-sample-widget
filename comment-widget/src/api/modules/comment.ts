import { http } from "../http";
import type { FreelogApiBody } from "../types";

/** 评论接口公共 query（page / replyPage 共用字段） */
export interface CommentListQuery {
  skip?: number;
  limit?: number;
  projection?: string;
  sort?: string;
  itemId?: string;
}

export type CommentPageParams = CommentListQuery & { exhibitId: string };

export type ReplyPageParams = CommentListQuery & {
  commentId: string;
};

/** 被回复对象摘要（子评论常见） */
export interface CommentRecipientInfo {
  userId?: number;
  username?: string;
}

/**
 * 评论树节点（含 replies；字段与文档一致，可按需扩展）
 */
export interface CommentThreadItem {
  id?: string;
  _id?: string;
  content: string;
  status?: string;
  likeCount?: number;
  replyCount?: number;
  reportCount?: number;
  exhibitId?: string;
  exhibitTitle?: string;
  articleUserId?: number;
  nodeDomain?: string;
  nodeName?: string;
  nodeUserId?: number;
  nodeId?: number;
  userId?: number;
  username?: string;
  userType?: number;
  createDate?: string;
  updateDate?: string;
  isLike?: boolean;
  parentId?: string;
  rootId?: string;
  level?: number;
  recipientInfo?: CommentRecipientInfo;
  replies?: CommentThreadItem[];
  [key: string]: unknown;
}

/** 分页接口 data 载荷 */
export interface CommentListPageData {
  skip: number;
  limit: number;
  totalItem: number;
  dataList: CommentThreadItem[];
}

/** 发表评论 body：一级传 exhibitId，回复传 parentId，二者互斥且至少其一 */
export type CreateCommentBody =
  | { content: string; exhibitId: string; parentId?: never; itemId?: string }
  | { content: string; parentId: string; exhibitId?: never; itemId?: string };

/** 发表评论成功时 data 内评论结构（字段以后端为准，可再扩展） */
export interface CommentCreatedDTO {
  id: string;
  content: string;
  parentId?: string;
  status?: string;
  likeCount?: number;
  replyCount?: number;
  reportCount?: number;
  exhibitId?: string;
  exhibitTitle?: string;
  level?: number;
  userType?: number;
  createDate?: string;
  updateDate?: string;
  [key: string]: unknown;
}

/** 点赞：1；取消点赞：0 */
export type CommentLikeStatus = 0 | 1;

/** 屏蔽：1；取消屏蔽恢复公开：0 */
export type CommentBlockStatus = 0 | 1;

/**
 * 查询展品评论分页列表
 */
export function fetchCommentList(params: CommentPageParams) {
  return http.get<FreelogApiBody<CommentListPageData>>("/comments/page", { params });
}

/**
 * 查询展品评论的回复分页列表
 */
export function fetchChildCommentList(params: ReplyPageParams) {
  return http.get<FreelogApiBody<CommentListPageData>>("/comments/replyPage", { params });
}

/**
 * 发表评论（一级评论或回复）
 */
export function createComment(body: CreateCommentBody) {
  return http.post<FreelogApiBody<CommentCreatedDTO>>("/comments", body);
}

/**
 * 点赞或取消点赞评论
 */
export function toggleCommentLike(commentId: string, status: CommentLikeStatus) {
  return http.post<FreelogApiBody<boolean>>(`/comments/${commentId}/like`, {
    status
  });
}

/**
 * 举报评论
 */
export function reportComment(commentId: string, content: string) {
  return http.post<FreelogApiBody<boolean>>(`/comments/${encodeURIComponent(commentId)}/report`, {
    content
  });
}

/**
 * 删除评论
 */
export function deleteComment(commentId: string) {
  return http.delete<FreelogApiBody<boolean>>(`/comments/${encodeURIComponent(commentId)}`);
}

/**
 * 屏蔽或取消屏蔽评论
 */
export function toggleCommentBlock(commentId: string, status: CommentBlockStatus) {
  return http.put<FreelogApiBody<boolean>>(`/comments/${encodeURIComponent(commentId)}/block`, {
    status
  });
}
