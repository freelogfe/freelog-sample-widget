import { createApp } from "vue";
import type { App as AppType } from "vue";
import "./style.css";
import App from "./App.vue";
import { initFreelogApp } from "freelog-runtime";

const myWindow = window as Window & {
  mount?: () => void;
  unmount?: () => void;
  __MICRO_APP_ENVIRONMENT__?: boolean;
};
let app: AppType<Element> | null = null;

myWindow.mount = () => {
  initFreelogApp();
  app = createApp(App);
  app.mount("#comment-widget-app");
};

myWindow.unmount = () => {
  app?.unmount();
  app = null;
};

if (!myWindow.__MICRO_APP_ENVIRONMENT__) {
  myWindow.mount();
}
