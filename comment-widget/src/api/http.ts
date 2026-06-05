import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const FRELOG_API_V2_BASE = "https://api.freelog.com/v2";

function resolveApiBaseURL(): string {
  const parts = location.hostname.split(".").filter(Boolean);
  if (parts.length < 2) return FRELOG_API_V2_BASE;

  const root = parts.length >= 3 ? parts.slice(-2).join(".") : "devfreelog.com";
  return `https://api.${root}/v2`;
}

const baseURL = resolveApiBaseURL();

/**
 * 全局 axios 实例：baseURL、超时、请求/响应拦截。
 * 业务接口写在 `src/api/modules/*`，通过本实例发请求。
 */
export const http = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json"
  }
});

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  err => Promise.reject(err)
);

http.interceptors.response.use(
  res => res.data,
  (err: AxiosError) => {
    return Promise.reject(err);
  }
);
