import "./public-path";
import { App, createApp } from "vue";
import * as VueRouter from "vue-router";
import AppPage from "./App.vue";
import routes from "./router";
import hljs from "highlight.js";
import "highlight.js/styles/a11y-dark.css";
import { initFreelogApp } from "freelog-runtime";

const myWindow: any = window;
let app: App<Element> | null = null;
let router: VueRouter.Router | null = null;
let history: VueRouter.RouterHistory | null = null;

myWindow.mount = () => {
  history = VueRouter.createWebHistory();
  router = VueRouter.createRouter({
    history,
    routes,
  });

  initFreelogApp();

  app = createApp(AppPage);
  app.use(router);
  app.mount("#markdown-widget-app");

  // 定义⾃定义指令 highlight 代码⾼亮
  hljs.configure({ ignoreUnescapedHTML: true });
  app.directive("highlight", (el) => {
    const blocks = el.querySelectorAll("pre code");
    blocks.forEach((block: any) => {
      hljs.highlightBlock(block);
    });
  });
};

myWindow.unmount = () => {
  app?.unmount();
  history?.destroy();
  app = null;
  router = null;
  history = null;
};

if (!myWindow.__MICRO_APP_ENVIRONMENT__) {
  myWindow.mount();
}
