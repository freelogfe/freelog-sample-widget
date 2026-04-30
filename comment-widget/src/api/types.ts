export interface FreelogApiBody<T = unknown> {
  ret?: number;
  errCode?: number;
  msg?: string;
  data?: T;
}

/** 与后端约定：ret===0 且 errCode 为 0 或未返回 */
export function isFreelogApiSuccess(body: FreelogApiBody): boolean {
  if (body.ret !== 0) return false;
  const ec = body.errCode;
  return ec === undefined || ec === 0;
}
