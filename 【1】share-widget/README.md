# 展品分享插件

挂载插件时可在 `renderWidgetOptions.data` 中传入可选的复制按钮配色：

```js
copyButtonColors: {
  background: '#8fc914',
  hover: '#9fd52a',
  active: '#7eb010',
  text: '#111314'
}
```

不传 `copyButtonColors` 时保持旧配色：背景 `#2784ff`、悬停 `#529dff`、按下 `#2376e5`、文字 `#fff`。仅传背景时，悬停和按下沿用该背景，不会变回蓝色。也支持通过 `setData({ copyButtonColors: ... })` 更新；传空对象或 `null` 恢复默认配色。此配置只影响复制按钮，不改变社交平台图标颜色。
