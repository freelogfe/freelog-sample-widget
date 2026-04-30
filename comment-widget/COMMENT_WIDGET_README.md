# 评论插件 (Comment Widget)

一个功能完整的 Vue 3 评论插件，支持暗黑模式和多种展示方式。

## 功能特性

### 1. 双主题支持
- **亮色主题** (Light Mode) - 适合白天使用
- **暗黑主题** (Dark Mode) - 适合夜间使用

### 2. 两种展示模式
- **垂直模式** (Vertical Mode) - 直接嵌入页面内容中
- **抽屉模式** (Drawer Mode) - 右侧浮动按钮触发的侧边栏

### 3. 用户状态
- **未登录状态** - 显示"游客身份，登录后发布评论"提示
- **已登录状态** - 显示评论输入框，可发布评论

### 4. 评论功能
- ✅ 发布评论
- ✅ 嵌套回复（支持多级回复）
- ✅ 用户身份标识（策展人、创作者等）
- ✅ 点赞、删除、屏蔽、举报功能
- ✅ 被屏蔽评论的展开/收起
- ✅ 回复特定用户

## 使用方法

### 基础用法

```vue
<template>
  <CommentWidget 
    :theme="'light'"
    :mode="'vertical'"
    :is-logged-in="false"
  />
</template>

<script setup>
import CommentWidget from './components/CommentWidget.vue'
</script>
```

### Props 配置

| 属性 | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| `theme` | `'light' \| 'dark'` | `'light'` | 主题模式 |
| `mode` | `'drawer' \| 'vertical'` | `'vertical'` | 展示模式 |
| `is-logged-in` | `boolean` | `false` | 用户登录状态 |

### 示例配置

#### 1. 亮色垂直模式（默认）
```vue
<CommentWidget 
  :theme="'light'"
  :mode="'vertical'"
  :is-logged-in="true"
/>
```

#### 2. 暗黑抽屉模式
```vue
<CommentWidget 
  :theme="'dark'"
  :mode="'drawer'"
  :is-logged-in="true"
/>
```

#### 3. 未登录状态
```vue
<CommentWidget 
  :theme="'light'"
  :mode="'vertical'"
  :is-logged-in="false"
/>
```

## 设计规范

### 颜色系统

**亮色主题**
- 背景色：`#FFFFFF`
- 主文字：`#222222`
- 辅助文字：`#999999`
- 分割线：`#E4E7EB`
- 主题色：`#2784FF`

**暗黑主题**
- 背景色：`#222222` (带毛玻璃效果)
- 主文字：`#FFFFFF`
- 辅助文字：`#999999`
- 分割线：`rgba(255, 255, 255, 0.2)`
- 主题色：`#2784FF`

**身份标识**
- 策展人：`#FA7F7F`
- 创作者：`#B957FF`

### 字体规范

- 标题：`Inter 20px / 600`
- 用户名：`Inter 12px / 600`
- 评论内容：`Inter 14px / 400`
- 时间/操作：`Inter 12px / 400`

## 交互说明

### 垂直模式
- 直接在页面中显示所有评论
- 评论列表支持滚动
- 嵌套回复左侧缩进 50px

### 抽屉模式
- 右侧浮动按钮（分享、评论）
- 点击评论按钮打开侧边栏
- 评论数量徽章显示
- 点击遮罩层或关闭按钮关闭抽屉
- 带滑入/滑出动画

### 被屏蔽评论
- 默认显示"该评论已屏蔽"
- 点击"点击查看"可展开查看内容
- 展开后显示"收起"按钮
- 被屏蔽的评论内容半透明显示

## 开发指南

### 启动项目

```bash
cd comment-widget
npm install
npm run dev
```

### 项目结构

```
comment-widget/
├── src/
│   ├── App.vue                 # 主应用（包含演示控制面板）
│   ├── components/
│   │   └── CommentWidget.vue   # 评论插件组件
│   ├── main.ts
│   └── style.css
├── package.json
└── README.md
```

### 自定义开发

如果需要集成到主应用：

1. 复制 `CommentWidget.vue` 到你的项目
2. 根据需要传入 props
3. 监听组件事件（如需要）
4. 自定义样式变量

### 数据接口

评论数据结构：

```typescript
interface Comment {
  id: string
  username: string
  userRole?: 'curator' | 'creator'  // 可选的用户角色
  content: string
  time: string
  avatar: string                     // 头像颜色
  isBlocked?: boolean                // 是否被屏蔽
  isExpanded?: boolean               // 被屏蔽时是否展开
  replyTo?: string                   // 回复的用户名
  replies?: Comment[]                // 子回复
}
```

## 浏览器支持

- Chrome (最新)
- Firefox (最新)
- Safari (最新)
- Edge (最新)

## 技术栈

- Vue 3.5
- TypeScript
- Vite
- CSS Variables (CSS 自定义属性)

## License

MIT

