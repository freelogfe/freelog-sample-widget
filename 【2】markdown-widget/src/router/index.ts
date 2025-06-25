import { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/:pathMatch(.*)*",
    component: () => import("../views/index.vue"),
  },
  {
    path: "/",
    name: "index",
    component: () => import("../views/index.vue"),
  },
];

export default routes;
