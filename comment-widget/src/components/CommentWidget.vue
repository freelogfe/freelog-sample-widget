<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  theme?: 'light' | 'dark'
  mode?: 'drawer' | 'vertical'
  isLoggedIn?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  mode: 'vertical',
  isLoggedIn: false
})

interface Comment {
  id: string
  username: string
  userRole?: 'curator' | 'creator'
  content: string
  time: string
  avatar: string
  likes: number
  isLiked?: boolean
  isBlocked?: boolean
  isExpanded?: boolean
  replyTo?: string
  replies?: Comment[]
  totalReplies?: number
  showAllReplies?: boolean
  currentReplyPage?: number
  showReplyInput?: boolean
}

const drawerVisible = ref(false)
const commentInput = ref('')
const replyingTo = ref<Comment | null>(null)
const comments = ref<Comment[]>([
  {
    id: '1',
    username: '用户001',
    content: '写得很好，非常不错！',
    time: '2025-12-13 07:36',
    avatar: '#73D57E',
    likes: 12,
    totalReplies: 22,
    showAllReplies: false,
    currentReplyPage: 1,
    replies: [
      {
        id: '1-1',
        username: '胡子大叔',
        userRole: 'curator',
        content: '感谢认可！！！',
        time: '2025-12-13 07:36',
        avatar: '#FA7F7F',
        likes: 8
      },
      {
        id: '1-2',
        username: '用户001',
        replyTo: '胡子大叔',
        content: '期待推出更多优秀作品',
        time: '2025-12-13 07:36',
        avatar: '#73D57E',
        likes: 3
      },
      {
        id: '1-3',
        username: 'Kyungil Yang',
        userRole: 'creator',
        replyTo: '用户001',
        content: '作者是我哦哈哈，谢谢认可，我会努力的',
        time: '2025-12-13 07:36',
        avatar: '#B957FF',
        likes: 15
      },
      {
        id: '1-4',
        username: '小李',
        content: '确实不错！',
        time: '2025-12-13 07:40',
        avatar: '#FF6B6B',
        likes: 2
      },
      {
        id: '1-5',
        username: '王老师',
        content: '很有启发性',
        time: '2025-12-13 07:45',
        avatar: '#4ECDC4',
        likes: 1
      },
      {
        id: '1-6',
        username: '张同学',
        content: '学到了很多',
        time: '2025-12-13 07:50',
        avatar: '#95E1D3',
        likes: 0
      },
      {
        id: '1-7',
        username: '设计小白',
        content: '请问能分享一下设计思路吗？',
        time: '2025-12-13 08:00',
        avatar: '#F38181',
        likes: 5
      },
      {
        id: '1-8',
        username: '产品经理',
        content: '这个创意可以借鉴到我们项目中',
        time: '2025-12-13 08:10',
        avatar: '#AA96DA',
        likes: 3
      },
      {
        id: '1-9',
        username: '前端开发',
        content: '技术实现上有难度吗？',
        time: '2025-12-13 08:15',
        avatar: '#FCBAD3',
        likes: 2
      },
      {
        id: '1-10',
        username: '测试工程师',
        content: '细节处理得很到位',
        time: '2025-12-13 08:20',
        avatar: '#FFFFD2',
        likes: 1
      },
      {
        id: '1-11',
        username: '运营小伙伴',
        content: '用户体验做得很好',
        time: '2025-12-13 08:25',
        avatar: '#A8D8EA',
        likes: 4
      },
      {
        id: '1-12',
        username: '路人甲',
        content: '赞一个！',
        time: '2025-12-13 08:30',
        avatar: '#FF6348',
        likes: 0
      },
      {
        id: '1-13',
        username: '设计爱好者',
        content: '配色很和谐',
        time: '2025-12-13 08:35',
        avatar: '#5F27CD',
        likes: 2
      },
      {
        id: '1-14',
        username: '新手小白',
        content: '想学习这种风格',
        time: '2025-12-13 08:40',
        avatar: '#48DBFB',
        likes: 1
      },
      {
        id: '1-15',
        username: '老用户',
        content: '看到你的进步了',
        time: '2025-12-13 08:45',
        avatar: '#FF9FF3',
        likes: 3
      },
      {
        id: '1-16',
        username: '热心网友',
        content: '继续加油！',
        time: '2025-12-13 08:50',
        avatar: '#54A0FF',
        likes: 1
      },
      {
        id: '1-17',
        username: '同行竞争者',
        content: '确实做得不错',
        time: '2025-12-13 08:55',
        avatar: '#00D2D3',
        likes: 0
      },
      {
        id: '1-18',
        username: '资深用户',
        content: '期待下一个作品',
        time: '2025-12-13 09:00',
        avatar: '#1DD1A1',
        likes: 2
      },
      {
        id: '1-19',
        username: '收藏家',
        content: '已经收藏了',
        time: '2025-12-13 09:05',
        avatar: '#FFC312',
        likes: 1
      },
      {
        id: '1-20',
        username: '分享达人',
        content: '分享给朋友们看看',
        time: '2025-12-13 09:10',
        avatar: '#C4E538',
        likes: 3
      },
      {
        id: '1-21',
        username: '点评师',
        content: '整体很完整',
        time: '2025-12-13 09:15',
        avatar: '#EE5A6F',
        likes: 0
      },
      {
        id: '1-22',
        username: '最后一位',
        content: '非常棒的作品！',
        time: '2025-12-13 09:20',
        avatar: '#F368E0',
        likes: 2
      }
    ]
  },
  {
    id: '2',
    username: '用户002',
    content: '一般般',
    time: '2025-12-13 07:36',
    avatar: '#8A2BE2',
    likes: 2
  },
  {
    id: '3',
    username: '用户003',
    content: '顶好！顶好！顶好！顶好！顶好！顶好！顶好！顶好！顶好！顶好！顶好！顶好！顶好！顶好！顶好！顶好！顶好！v顶好',
    time: '2025-12-13 07:36',
    avatar: '#FF6B6B',
    likes: 5
  },
  {
    id: '4',
    username: '用户004',
    content: '该评论已屏蔽',
    time: '2025-12-12 10:00',
    avatar: '#95A5A6',
    isBlocked: true,
    isExpanded: false,
    likes: 0
  },
  {
    id: '5',
    username: '用户005',
    content: '写的太烂，幼儿园水准',
    time: '2025-12-11 11:15',
    avatar: '#95A5A6',
    isBlocked: true,
    isExpanded: true,
    likes: 1
  },
  {
    id: '6',
    username: '小明',
    content: '这个作品太棒了，很有创意！',
    time: '2025-12-13 08:00',
    avatar: '#4ECDC4',
    likes: 18,
    replies: [
      {
        id: '6-1',
        username: 'Kyungil Yang',
        userRole: 'creator',
        replyTo: '小明',
        content: '谢谢支持！',
        time: '2025-12-13 08:05',
        avatar: '#B957FF',
        likes: 5
      }
    ]
  },
  {
    id: '7',
    username: '设计师张三',
    userRole: 'curator',
    content: '从设计角度来看，这个作品的构图和色彩搭配都非常出色，值得学习！',
    time: '2025-12-13 09:15',
    avatar: '#FF6B9D',
    likes: 25
  },
  {
    id: '8',
    username: '路人甲',
    content: '有点意思',
    time: '2025-12-13 09:30',
    avatar: '#FFA07A',
    likes: 3
  },
  {
    id: '9',
    username: '艺术爱好者',
    content: '这种风格我很喜欢，请问后续还会有类似的作品吗？期待期待！',
    time: '2025-12-13 10:00',
    avatar: '#9B59B6',
    likes: 10,
    replies: [
      {
        id: '9-1',
        username: 'Kyungil Yang',
        userRole: 'creator',
        replyTo: '艺术爱好者',
        content: '会的！下周会发布新作品',
        time: '2025-12-13 10:15',
        avatar: '#B957FF',
        likes: 8
      },
      {
        id: '9-2',
        username: '艺术爱好者',
        replyTo: 'Kyungil Yang',
        content: '太好了！已关注，等待更新',
        time: '2025-12-13 10:20',
        avatar: '#9B59B6',
        likes: 2
      }
    ]
  },
  {
    id: '10',
    username: '用户006',
    content: '很不错的作品，继续加油！',
    time: '2025-12-13 11:00',
    avatar: '#3498DB',
    likes: 7
  },
  {
    id: '11',
    username: '摄影师李四',
    content: '光影处理得很好，学到了！',
    time: '2025-12-13 11:30',
    avatar: '#E74C3C',
    likes: 15
  },
  {
    id: '12',
    username: '用户007',
    content: '想问一下这是用什么软件做的？',
    time: '2025-12-13 12:00',
    avatar: '#1ABC9C',
    likes: 4,
    replies: [
      {
        id: '12-1',
        username: 'Kyungil Yang',
        userRole: 'creator',
        replyTo: '用户007',
        content: 'Photoshop + Illustrator',
        time: '2025-12-13 12:10',
        avatar: '#B957FF',
        likes: 6
      }
    ]
  },
  {
    id: '13',
    username: '学生小王',
    content: '作为一个初学者，看到这样的作品很受启发！',
    time: '2025-12-13 13:00',
    avatar: '#F39C12',
    likes: 20
  },
  {
    id: '14',
    username: '用户008',
    content: '细节处理得很到位👍',
    time: '2025-12-13 14:00',
    avatar: '#16A085',
    likes: 9
  },
  {
    id: '15',
    username: '设计爱好者',
    content: '配色方案可以分享一下吗？',
    time: '2025-12-13 15:00',
    avatar: '#8E44AD',
    likes: 11
  },
  {
    id: '16',
    username: '用户009',
    content: '这个创意真的很棒！',
    time: '2025-12-13 16:00',
    avatar: '#27AE60',
    likes: 6
  },
  {
    id: '17',
    username: '老铁',
    content: '双击666',
    time: '2025-12-13 17:00',
    avatar: '#E67E22',
    likes: 30
  },
  {
    id: '18',
    username: '用户010',
    content: '已收藏，慢慢学习',
    time: '2025-12-13 18:00',
    avatar: '#2ECC71',
    likes: 8
  }
])

// 更多菜单相关
const showMoreMenu = ref<string | null>(null)
const moreMenuPosition = ref({ x: 0, y: 0 })

// 举报弹窗相关
const showReportDialog = ref(false)
const reportReason = ref<string>('')
const reportDetail = ref('')
const reportSuccess = ref(false)

// 底部悬浮输入框
const showFloatingInput = ref(false)
const inputContainerRef = ref<HTMLElement | null>(null)
const commentListRef = ref<HTMLElement | null>(null)
const drawerInputRef = ref<HTMLElement | null>(null)
const drawerListRef = ref<HTMLElement | null>(null)
const drawerBodyRef = ref<HTMLElement | null>(null)

const toggleDrawer = () => {
  drawerVisible.value = !drawerVisible.value
  
  // 抽屉打开后检查是否需要显示悬浮输入框
  if (drawerVisible.value) {
    setTimeout(handleDrawerScroll, 100)
  } else {
    showFloatingInput.value = false
  }
}

const handleLogin = () => {
  alert('登录功能')
}

const handlePublish = () => {
  if (!commentInput.value.trim()) return
  
  if (replyingTo.value) {
    alert(`回复 @${replyingTo.value.username}: ${commentInput.value}`)
    // 清除所有回复输入框显示状态
    comments.value.forEach(comment => {
      comment.showReplyInput = false
      if (comment.replies) {
        comment.replies.forEach(reply => {
          reply.showReplyInput = false
        })
      }
    })
    replyingTo.value = null
  } else {
    alert(`发布评论: ${commentInput.value}`)
  }
  
  commentInput.value = ''
}

const handleReply = (comment: Comment, parentComment?: Comment) => {
  // 如果点击的是同一个评论的回复按钮，则取消回复
  if (replyingTo.value && replyingTo.value.id === comment.id) {
    cancelReply()
    return
  }
  
  replyingTo.value = comment
  commentInput.value = ''
  
  // 同时切换：隐藏所有输入框，并显示当前点击的输入框
  // 这样避免了先隐藏再显示造成的闪烁
  
  // 如果是回复楼中楼，输入框显示在该回复的下方
  if (parentComment) {
    const parentCommentObj = comments.value.find(c => c.id === parentComment.id)
    
    // 遍历所有评论，一次性完成切换
    comments.value.forEach(c => {
      if (c.id === parentComment.id && parentCommentObj && parentCommentObj.replies) {
        c.showReplyInput = false
        // 显示目标回复的输入框，隐藏其他回复的输入框
        if (c.replies) {
          c.replies.forEach(r => {
            r.showReplyInput = (r.id === comment.id)
          })
        }
      } else {
        c.showReplyInput = false
        if (c.replies) {
          c.replies.forEach(r => {
            r.showReplyInput = false
          })
        }
      }
    })
  } else {
    // 回复主评论时，直接显示在该评论下方
    comments.value.forEach(c => {
      c.showReplyInput = (c.id === comment.id)
      if (c.replies) {
        c.replies.forEach(r => {
          r.showReplyInput = false
        })
      }
    })
  }
  
  // 延迟聚焦到输入框并滚动到可视区域
  setTimeout(() => {
    const replyInput = document.querySelector('.reply-input-section textarea') as HTMLTextAreaElement
    if (replyInput) {
      replyInput.focus()
      
      // 检查输入框是否在视口内，只有不在时才滚动
      const replySection = replyInput.closest('.reply-input-section') as HTMLElement
      if (replySection) {
        const rect = replySection.getBoundingClientRect()
        const isInViewport = (
          rect.top >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        )
        
        // 只有当输入框不在视口内或部分不可见时才滚动
        if (!isInViewport || rect.top < 100 || rect.bottom > window.innerHeight - 100) {
          replySection.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }
  }, 50)
}

const cancelReply = () => {
  // 清除所有评论和回复的回复输入框显示状态
  comments.value.forEach(comment => {
    comment.showReplyInput = false
    if (comment.replies) {
      comment.replies.forEach(reply => {
        reply.showReplyInput = false
      })
    }
  })
  replyingTo.value = null
  commentInput.value = ''
}

const toggleLike = (comment: Comment) => {
  comment.isLiked = !comment.isLiked
  comment.likes += comment.isLiked ? 1 : -1
}

const toggleMoreMenu = (commentId: string, event: MouseEvent) => {
  event.stopPropagation()
  if (showMoreMenu.value === commentId) {
    showMoreMenu.value = null
  } else {
    showMoreMenu.value = commentId
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    moreMenuPosition.value = {
      x: rect.left,
      y: rect.bottom + 5
    }
  }
}

const closeMoreMenu = () => {
  showMoreMenu.value = null
}

const handleDelete = (comment: Comment) => {
  alert(`删除评论: ${comment.username}`)
  closeMoreMenu()
}

const handleReport = () => {
  showReportDialog.value = true
  closeMoreMenu()
}

const handleBlock = (comment: Comment) => {
  comment.isBlocked = true
  comment.isExpanded = false
  alert(`已屏蔽 ${comment.username} 的评论`)
  closeMoreMenu()
}

const handleUnblock = (comment: Comment) => {
  comment.isBlocked = false
  alert(`已取消屏蔽 ${comment.username} 的评论`)
}

const toggleBlockedComment = (comment: Comment) => {
  comment.isExpanded = !comment.isExpanded
}

const toggleReplies = (comment: Comment) => {
  if (!comment.showAllReplies) {
    // 展开回复列表，初始化为第1页
    comment.showAllReplies = true
    comment.currentReplyPage = 1
  } else {
    // 收起回复列表
    comment.showAllReplies = false
    comment.currentReplyPage = 1
  }
}

const changeReplyPage = (comment: Comment, page: number) => {
  comment.currentReplyPage = page
}

const nextReplyPage = (comment: Comment) => {
  const totalPages = Math.ceil((comment.totalReplies || 0) / 10)
  if (comment.currentReplyPage && comment.currentReplyPage < totalPages) {
    comment.currentReplyPage++
  }
}

const getDisplayedReplies = (comment: Comment) => {
  if (!comment.replies) return []
  
  if (!comment.showAllReplies) {
    // 未展开时只显示前3条
    return comment.replies.slice(0, 3)
  } else {
    // 展开后分页显示，每页10条
    const page = comment.currentReplyPage || 1
    const startIndex = (page - 1) * 10
    const endIndex = startIndex + 10
    return comment.replies.slice(startIndex, endIndex)
  }
}

const getTotalReplyPages = (comment: Comment) => {
  return Math.ceil((comment.totalReplies || 0) / 10)
}

const submitReport = () => {
  if (!reportReason.value || (reportReason.value === 'other' && !reportDetail.value.trim())) {
    alert('请完整填写举报信息')
    return
  }
  
  reportSuccess.value = true
  setTimeout(() => {
    showReportDialog.value = false
    reportSuccess.value = false
    reportReason.value = ''
    reportDetail.value = ''
  }, 2000)
}

const roleColors = {
  curator: '#BEBEBE',
  creator: '#2784FF'
}

const roleNames = {
  curator: '策展人',
  creator: '创作者'
}

// 监听滚动，控制底部悬浮输入框
const handleScroll = () => {
  if (props.mode === 'vertical') {
    // 垂直模式
    if (!inputContainerRef.value || !commentListRef.value) return
    
    // 检查评论列表高度是否大于页面高度
    const listHeight = commentListRef.value.scrollHeight
    const viewportHeight = window.innerHeight
    
    // 只有当评论列表足够长时才显示悬浮输入框
    if (listHeight <= viewportHeight) {
      showFloatingInput.value = false
      return
    }
    
    // 检查顶部输入框是否完全滚出视口（需要整个输入框都消失）
    const rect = inputContainerRef.value.getBoundingClientRect()
    showFloatingInput.value = rect.bottom < 0
  }
}

// 抽屉模式的滚动处理
const handleDrawerScroll = () => {
  if (props.mode === 'drawer' && drawerBodyRef.value) {
    if (!drawerInputRef.value || !drawerListRef.value) return
    
    // 检查抽屉中评论列表高度是否大于抽屉可视区域
    const scrollContainer = drawerBodyRef.value
    const listHeight = drawerListRef.value.scrollHeight
    const containerHeight = scrollContainer.clientHeight - 100 // 减去底部空白
    
    // 只有当评论列表足够长时才显示悬浮输入框
    if (listHeight <= containerHeight) {
      showFloatingInput.value = false
      return
    }
    
    // 获取输入框相对于滚动容器的位置
    const inputRect = drawerInputRef.value.getBoundingClientRect()
    const containerRect = scrollContainer.getBoundingClientRect()
    
    // 检查输入框是否完全滚出可视区域（加上20px缓冲）
    showFloatingInput.value = inputRect.bottom < (containerRect.top + 20)
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', handleScroll)
  window.addEventListener('click', closeMoreMenu)
  
  // 初始检查
  setTimeout(() => {
    handleScroll()
    handleDrawerScroll()
  }, 100)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  window.removeEventListener('click', closeMoreMenu)
})
</script>

<template>
  <div class="comment-widget" :class="[`theme-${theme}`, `mode-${mode}`]">
    <!-- 垂直模式 -->
    <div v-if="mode === 'vertical'" class="vertical-container">
      <div class="comment-content">
        <!-- 未登录提示 -->
        <div v-if="!isLoggedIn" class="login-prompt">
          <span>游客身份，登录后发布评论</span>
          <button class="btn-login" @click="handleLogin">登录</button>
        </div>

        <!-- 评论输入框 (已登录) - 仅用于发布新评论 -->
        <div v-if="isLoggedIn && !replyingTo" ref="inputContainerRef" class="comment-input-section">
          <div class="avatar" :style="{ background: '#FA7F7F' }"></div>
          <div class="input-box">
            <textarea 
              v-model="commentInput" 
              placeholder="写下你的评论..."
            ></textarea>
            <button 
              class="btn-publish" 
              :class="{ disabled: !commentInput.trim() }"
              @click="handlePublish"
            >
              发布
            </button>
          </div>
        </div>

        <!-- 评论列表 -->
        <div ref="commentListRef" class="comment-list">
          <div 
            v-for="comment in comments" 
            :key="comment.id" 
            class="comment-item"
          >
            <div class="comment-main">
              <div class="avatar" :style="{ background: comment.avatar }"></div>
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
                
                <div class="comment-content-text" :class="{ blocked: comment.isBlocked && !comment.isExpanded }">
                  <template v-if="comment.isBlocked && !comment.isExpanded">
                    <span class="blocked-text">该评论已屏蔽</span>
                    <span class="view-link" @click="toggleBlockedComment(comment)">点击查看</span>
                  </template>
                  <template v-else>
                    <span :class="{ 'blocked-content': comment.isBlocked }">{{ comment.content }}</span>
                    <span v-if="comment.isBlocked" class="collapse-link" @click="toggleBlockedComment(comment)">收起</span>
                  </template>
                </div>
                
                <div class="comment-actions">
                  <span class="time">{{ comment.time }}</span>
                  
                  <div class="action-button" @click="toggleLike(comment)">
                    <svg v-if="comment.isLiked" width="14" height="14" viewBox="0 0 14 13.5625" fill="none">
                      <path d="M3.08173 13.5625H0.880556C0.394277 13.5625 8.86355e-09 13.1708 0 12.6875V5.25001C0 4.76676 0.394277 4.37501 0.880556 4.37501H3.08173V13.5625Z" fill="#2784FF"/>
                      <path d="M8.14439 0C8.68668 0 9.18779 0.274301 9.48637 0.775026C9.78031 1.26801 9.85652 1.93814 9.67415 2.72348C9.51039 3.42865 9.29365 3.98291 9.1089 4.37501H13.1195C13.6387 4.37506 14.0451 4.81926 13.996 5.33289L13.9787 5.51405C13.992 5.61481 13.9942 5.71889 13.9829 5.82487L13.6245 9.20824L13.2831 12.7704C13.2401 13.2194 12.8607 13.5624 12.4068 13.5625H3.96229V4.31327C3.97769 4.30752 3.99394 4.30197 4.01057 4.29554C4.18881 4.22656 4.4317 4.11988 4.68903 3.97019C5.21392 3.66484 5.74404 3.21272 5.96885 2.58719C6.24406 1.82141 6.50876 1.19494 6.82313 0.757509C7.15158 0.30055 7.57316 3.61757e-05 8.14439 0Z" fill="#2784FF"/>
                    </svg>
                    <svg v-else width="14" height="14" viewBox="0 0 14 13.657" fill="none">
                      <path d="M8.15016 0C8.69283 0 9.19409 0.276213 9.49289 0.780426C9.78705 1.27685 9.8634 1.95162 9.6809 2.74246C9.51702 3.45256 9.30003 4.01066 9.11515 4.40549H12.6783C13.4629 4.40549 14.0747 5.08512 13.9926 5.86546L13.2971 12.4737C13.2263 13.1463 12.6591 13.657 11.9828 13.657H1.32165C0.614524 13.657 0.0371077 13.1017 0.0017209 12.4034L0 12.3354V5.72714C2.60027e-07 4.99721 0.591722 4.40549 1.32165 4.40549H3.78855C3.79343 4.40393 3.79875 4.40234 3.80425 4.40054C3.85266 4.38472 3.92455 4.36004 4.01334 4.32547C4.19171 4.25601 4.43472 4.14859 4.69224 3.99785C5.2175 3.69038 5.74804 3.23512 5.97301 2.60522C6.24841 1.8341 6.51327 1.20326 6.82787 0.762787C7.15656 0.302614 7.57848 0 8.15016 0ZM1.32165 5.28659C1.07834 5.28659 0.881099 5.48383 0.881098 5.72714V12.3354L0.883465 12.3803C0.905997 12.6025 1.09352 12.7759 1.32165 12.7759H3.41426V5.28659H1.32165ZM8.15016 0.881098C7.9509 0.881098 7.76701 0.964048 7.54505 1.27475C7.30899 1.60524 7.07817 2.13093 6.80291 2.90164C6.47721 3.81358 5.74113 4.4047 5.13752 4.75806C4.83063 4.9377 4.54352 5.06436 4.333 5.14634C4.32024 5.1513 4.30757 5.15567 4.29535 5.16032V12.7759H11.9828C12.2082 12.7759 12.3972 12.6056 12.4208 12.3814L13.1164 5.77317C13.1438 5.51309 12.9398 5.28659 12.6783 5.28659H8.79851C8.52409 5.28659 8.31602 5.12445 8.21082 4.93768C8.10664 4.75265 8.07784 4.50098 8.19856 4.27234L8.26783 4.13617C8.43766 3.79123 8.65804 3.25536 8.82217 2.54413C8.97005 1.90324 8.88119 1.47657 8.73483 1.22958C8.59308 0.990384 8.37845 0.881098 8.15016 0.881098Z" fill="#999999"/>
                    </svg>
                    <span v-if="comment.likes > 0">{{ comment.likes }}</span>
                  </div>
                  
                  <div class="action-button" @click="handleReply(comment)">
                    <svg width="14" height="13" viewBox="0 0 14 12.2544" fill="none">
                      <path d="M13.125 6.12537C13.125 3.28452 10.4461 0.875053 7 0.875053C3.55391 0.875053 0.875 3.28452 0.875 6.12537C0.875 7.03616 1.14573 7.89456 1.62631 8.64521C1.63041 8.65162 1.63171 8.65365 1.64062 8.66743L1.84891 8.98916L1.30075 11.1285L3.8403 10.6299L4.09793 10.7491C4.96007 11.148 5.9478 11.3757 7 11.3757V12.2507C5.8214 12.2507 4.70827 11.9955 3.7305 11.5432L0.109375 12.2544L0.906189 9.14319C0.900562 9.13451 0.894893 9.12585 0.889313 9.11713C0.324561 8.23502 0 7.21422 0 6.12537C0 2.68574 3.19488 0 7 0C10.8051 0 14 2.68574 14 6.12537C14 9.565 10.8051 12.2507 7 12.2507V11.3757C10.4461 11.3757 13.125 8.96622 13.125 6.12537Z" fill="currentColor"/>
                    </svg>
                  </div>
                  
                  <div class="action-button more" @click="toggleMoreMenu(comment.id, $event)">
                    <svg width="14" height="3" viewBox="0 0 14 3">
                      <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor"/>
                      <circle cx="7" cy="1.5" r="1.5" fill="currentColor"/>
                      <circle cx="12.5" cy="1.5" r="1.5" fill="currentColor"/>
                    </svg>
                  </div>
                  
                  <span v-if="comment.isBlocked && comment.isExpanded" class="action" @click="handleUnblock(comment)">取消屏蔽</span>
                </div>
              </div>
            </div>

            <!-- 主评论的回复输入框 -->
            <div v-if="comment.showReplyInput && replyingTo" class="reply-input-section" :data-reply-to="replyingTo.id">
              <div class="avatar small" :style="{ background: '#FA7F7F' }"></div>
              <div class="input-box">
                <textarea 
                  v-model="commentInput" 
                  :placeholder="`回复@${replyingTo.username}：`"
                  @keydown.enter.ctrl="handlePublish"
                ></textarea>
                <button 
                  class="btn-cancel-reply"
                  @click="cancelReply"
                >
                  取消
                </button>
                <button 
                  class="btn-publish" 
                  :class="{ disabled: !commentInput.trim() }"
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
                    <div class="avatar small" :style="{ background: reply.avatar }"></div>
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
                          <svg v-if="reply.isLiked" width="14" height="14" viewBox="0 0 14 13.5625" fill="none">
                            <path d="M3.08173 13.5625H0.880556C0.394277 13.5625 8.86355e-09 13.1708 0 12.6875V5.25001C0 4.76676 0.394277 4.37501 0.880556 4.37501H3.08173V13.5625Z" fill="#2784FF"/>
                            <path d="M8.14439 0C8.68668 0 9.18779 0.274301 9.48637 0.775026C9.78031 1.26801 9.85652 1.93814 9.67415 2.72348C9.51039 3.42865 9.29365 3.98291 9.1089 4.37501H13.1195C13.6387 4.37506 14.0451 4.81926 13.996 5.33289L13.9787 5.51405C13.992 5.61481 13.9942 5.71889 13.9829 5.82487L13.6245 9.20824L13.2831 12.7704C13.2401 13.2194 12.8607 13.5624 12.4068 13.5625H3.96229V4.31327C3.97769 4.30752 3.99394 4.30197 4.01057 4.29554C4.18881 4.22656 4.4317 4.11988 4.68903 3.97019C5.21392 3.66484 5.74404 3.21272 5.96885 2.58719C6.24406 1.82141 6.50876 1.19494 6.82313 0.757509C7.15158 0.30055 7.57316 3.61757e-05 8.14439 0Z" fill="#2784FF"/>
                          </svg>
                          <svg v-else width="14" height="14" viewBox="0 0 14 13.657" fill="none">
                            <path d="M8.15016 0C8.69283 0 9.19409 0.276213 9.49289 0.780426C9.78705 1.27685 9.8634 1.95162 9.6809 2.74246C9.51702 3.45256 9.30003 4.01066 9.11515 4.40549H12.6783C13.4629 4.40549 14.0747 5.08512 13.9926 5.86546L13.2971 12.4737C13.2263 13.1463 12.6591 13.657 11.9828 13.657H1.32165C0.614524 13.657 0.0371077 13.1017 0.0017209 12.4034L0 12.3354V5.72714C2.60027e-07 4.99721 0.591722 4.40549 1.32165 4.40549H3.78855C3.79343 4.40393 3.79875 4.40234 3.80425 4.40054C3.85266 4.38472 3.92455 4.36004 4.01334 4.32547C4.19171 4.25601 4.43472 4.14859 4.69224 3.99785C5.2175 3.69038 5.74804 3.23512 5.97301 2.60522C6.24841 1.8341 6.51327 1.20326 6.82787 0.762787C7.15656 0.302614 7.57848 0 8.15016 0ZM1.32165 5.28659C1.07834 5.28659 0.881099 5.48383 0.881098 5.72714V12.3354L0.883465 12.3803C0.905997 12.6025 1.09352 12.7759 1.32165 12.7759H3.41426V5.28659H1.32165ZM8.15016 0.881098C7.9509 0.881098 7.76701 0.964048 7.54505 1.27475C7.30899 1.60524 7.07817 2.13093 6.80291 2.90164C6.47721 3.81358 5.74113 4.4047 5.13752 4.75806C4.83063 4.9377 4.54352 5.06436 4.333 5.14634C4.32024 5.1513 4.30757 5.15567 4.29535 5.16032V12.7759H11.9828C12.2082 12.7759 12.3972 12.6056 12.4208 12.3814L13.1164 5.77317C13.1438 5.51309 12.9398 5.28659 12.6783 5.28659H8.79851C8.52409 5.28659 8.31602 5.12445 8.21082 4.93768C8.10664 4.75265 8.07784 4.50098 8.19856 4.27234L8.26783 4.13617C8.43766 3.79123 8.65804 3.25536 8.82217 2.54413C8.97005 1.90324 8.88119 1.47657 8.73483 1.22958C8.59308 0.990384 8.37845 0.881098 8.15016 0.881098Z" fill="#999999"/>
                          </svg>
                          <span v-if="reply.likes">{{ reply.likes }}</span>
                        </div>
                        
                        <div class="action-button" @click="handleReply(reply, comment)">
                          <svg width="14" height="13" viewBox="0 0 14 12.2544" fill="none">
                            <path d="M13.125 6.12537C13.125 3.28452 10.4461 0.875053 7 0.875053C3.55391 0.875053 0.875 3.28452 0.875 6.12537C0.875 7.03616 1.14573 7.89456 1.62631 8.64521C1.63041 8.65162 1.63171 8.65365 1.64062 8.66743L1.84891 8.98916L1.30075 11.1285L3.8403 10.6299L4.09793 10.7491C4.96007 11.148 5.9478 11.3757 7 11.3757V12.2507C5.8214 12.2507 4.70827 11.9955 3.7305 11.5432L0.109375 12.2544L0.906189 9.14319C0.900562 9.13451 0.894893 9.12585 0.889313 9.11713C0.324561 8.23502 0 7.21422 0 6.12537C0 2.68574 3.19488 0 7 0C10.8051 0 14 2.68574 14 6.12537C14 9.565 10.8051 12.2507 7 12.2507V11.3757C10.4461 11.3757 13.125 8.96622 13.125 6.12537Z" fill="currentColor"/>
                          </svg>
                        </div>
                        
                        <div class="action-button more" @click="toggleMoreMenu(reply.id, $event)">
                          <svg width="14" height="3" viewBox="0 0 14 3">
                            <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor"/>
                            <circle cx="7" cy="1.5" r="1.5" fill="currentColor"/>
                            <circle cx="12.5" cy="1.5" r="1.5" fill="currentColor"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 回复的回复输入框 -->
                  <div v-if="reply.showReplyInput && replyingTo" class="reply-input-section nested">
                    <div class="avatar small" :style="{ background: '#FA7F7F' }"></div>
                    <div class="input-box">
                      <textarea 
                        v-model="commentInput" 
                        :placeholder="`回复@${replyingTo.username}：`"
                        @keydown.enter.ctrl="handlePublish"
                      ></textarea>
                      <button 
                        class="btn-cancel-reply"
                        @click="cancelReply"
                      >
                        取消
                      </button>
                      <button 
                        class="btn-publish" 
                        :class="{ disabled: !commentInput.trim() }"
                        @click="handlePublish"
                      >
                        发布
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 展开/收起回复 -->
              <div v-if="comment.totalReplies && comment.replies && comment.replies.length > 3" class="replies-toggle">
                <!-- 未展开时显示提示 -->
                <span v-if="!comment.showAllReplies" class="toggle-link" @click="toggleReplies(comment)">
                  共{{ comment.totalReplies }}条回复，点击查看
                </span>
                <!-- 展开后显示分页 -->
                <template v-else>
                  <span class="page-info">共{{ getTotalReplyPages(comment) }}页 {{ comment.totalReplies }}条回复</span>
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
                    v-if="comment.currentReplyPage && comment.currentReplyPage < getTotalReplyPages(comment)" 
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
      </div>
    </div>

    <!-- 底部悬浮输入框 - 仅用于发布新评论 -->
    <Transition name="slide-up">
      <div v-if="isLoggedIn && showFloatingInput && mode === 'vertical' && !replyingTo" class="floating-input">
        <div class="avatar small" :style="{ background: '#FA7F7F' }"></div>
        <div class="input-box">
          <textarea 
            v-model="commentInput" 
            placeholder="写下你的评论..."
          ></textarea>
          <button 
            class="btn-publish" 
            :class="{ disabled: !commentInput.trim() }"
            @click="handlePublish"
          >
            发布
          </button>
        </div>
      </div>
    </Transition>

    <!-- 更多菜单 -->
    <Transition name="fade">
      <div 
        v-if="showMoreMenu" 
        class="more-menu"
        :style="{ left: `${moreMenuPosition.x}px`, top: `${moreMenuPosition.y}px` }"
        @click.stop
      >
        <div class="menu-item" @click="handleDelete(comments.find(c => c.id === showMoreMenu)!)">
          <svg width="15" height="16" viewBox="0 0 60 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 0C43.3137 0 46 2.68629 46 6V7H60V11H53V58C53 61.3137 50.3137 64 47 64H13C9.68629 64 7 61.3137 7 58V11H0V7H14V6C14 2.68629 16.6863 9.66384e-08 20 0H40ZM11 58C11 59.1046 11.8954 60 13 60H47C48.1046 60 49 59.1046 49 58V11H11V58ZM22 49H18V21H22V49ZM32 49H28V21H32V49ZM42 49H38V21H42V49ZM20 4C18.8954 4 18 4.89543 18 6V7H42V6C42 4.89543 41.1046 4 40 4H20Z" fill="currentColor"/>
          </svg>
          <span>删除</span>
        </div>
        <div class="menu-item" @click="handleReport()">
          <svg width="15" height="16" viewBox="0 0 62 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M59.9846 59.4143C61.0892 59.4143 61.9846 60.3097 61.9846 61.4143C61.9844 62.5187 61.089 63.4143 59.9846 63.4143H3.9846C2.88038 63.4141 1.98485 62.5185 1.9846 61.4143C1.9846 60.3099 2.88023 59.4145 3.9846 59.4143H59.9846ZM31.9846 9.41429C43.5826 9.41429 52.9846 18.8163 52.9846 30.4143V55.4143H10.9846V30.4143C10.9846 18.8165 20.3868 9.41453 31.9846 9.41429ZM31.9846 13.4143C22.596 13.4145 14.9846 21.0256 14.9846 30.4143V51.4143H48.9846V30.4143C48.9846 21.0254 41.3734 13.4143 31.9846 13.4143ZM24.7844 19.3147C25.668 18.652 26.9214 18.8307 27.5842 19.7141C28.2468 20.5976 28.0682 21.8511 27.1848 22.5139C23.7921 25.0587 21.9846 28.9025 21.9846 34.4143C21.9844 35.5187 21.089 36.4143 19.9846 36.4143C18.8804 36.4141 17.9848 35.5185 17.9846 34.4143C17.9846 27.9267 20.1779 22.7699 24.7844 19.3147ZM0.0685865 19.3108C0.354481 18.2439 1.45186 17.6108 2.51878 17.8967L6.38206 18.9319C7.4489 19.2177 8.08182 20.3142 7.79613 21.3811C7.51025 22.448 6.4138 23.0819 5.34691 22.7961L1.48363 21.76C0.416693 21.4741 -0.217297 20.3777 0.0685865 19.3108ZM4.74241 3.99925C5.52338 3.21853 6.78954 3.21858 7.57054 3.99925L13.2278 9.65648C14.0087 10.4375 14.0086 11.7036 13.2278 12.4846C12.4467 13.2656 11.1807 13.2656 10.3996 12.4846L4.74241 6.82835C3.96137 6.0473 3.96137 4.7803 4.74241 3.99925ZM20.0178 0.0685865C21.0847 -0.217297 22.1821 0.416693 22.468 1.48363L23.5032 5.34691C23.789 6.41367 23.1557 7.51003 22.0891 7.79613C21.0222 8.08201 19.9248 7.449 19.6389 6.38206L18.6037 2.51878C18.3179 1.4519 18.951 0.354532 20.0178 0.0685865Z" fill="currentColor"/>
          </svg>
          <span>举报</span>
        </div>
        <div class="menu-item" @click="handleBlock(comments.find(c => c.id === showMoreMenu)!)">
          <svg width="16" height="11" viewBox="0 0 64 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 0C44.2216 0 57.3358 6.80938 63.6455 21.1924L64 22L63.6455 22.8076C57.3358 37.1906 44.2216 44 32 44C19.7784 44 6.66416 37.1906 0.354492 22.8076L0 22L0.354492 21.1924C6.66416 6.80938 19.7784 2.04973e-07 32 0ZM32 4C21.4478 4 10.1077 9.7428 4.36035 22C10.1077 34.2572 21.4478 40 32 40C42.5521 40 53.8913 34.2569 59.6387 22C53.8913 9.74306 42.5521 4 32 4ZM32 10C38.589 10 43.9307 15.3726 43.9307 22C43.9307 28.6274 38.589 34 32 34C25.411 34 20.0693 28.6274 20.0693 22C20.0693 15.3726 25.411 10 32 10ZM32 14C27.6073 14 24.0459 17.5817 24.0459 22C24.0459 26.4183 27.6073 30 32 30C36.3927 30 39.9541 26.4183 39.9541 22C39.9541 17.5817 36.3927 14 32 14Z" fill="currentColor"/>
          </svg>
          <span>屏蔽</span>
        </div>
      </div>
    </Transition>


    <!-- 抽屉模式 -->
    <template v-if="mode === 'drawer'">
      <!-- 触发按钮 -->
      <div class="drawer-triggers">
        <button class="float-button share">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 5L13 11M10 8L16 8M7 14L2 14C1.44772 14 1 13.5523 1 13L1 3C1 2.44772 1.44772 2 2 2L7 2M7 2L12 7M7 2L7 7" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
        <button class="float-button comment" @click="toggleDrawer">
          <svg width="16" height="14" viewBox="0 0 16 14" fill="currentColor">
            <path d="M14 0H2C0.9 0 0 0.9 0 2V10C0 11.1 0.9 12 2 12H12L16 16V2C16 0.9 15.1 0 14 0Z"/>
          </svg>
          <span class="badge">{{ comments.length }}</span>
        </button>
      </div>

      <!-- 抽屉内容 -->
      <Transition name="slide-right">
        <div v-if="drawerVisible" class="drawer-overlay" @click="toggleDrawer">
          <div class="drawer-content" @click.stop="closeMoreMenu">
            <div class="drawer-header">
              <h3>评论 ({{ comments.length }})</h3>
              <button class="close-btn" @click="toggleDrawer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
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
              <div v-if="isLoggedIn && !replyingTo" ref="drawerInputRef" class="comment-input-section">
                <div class="avatar" :style="{ background: '#FA7F7F' }"></div>
                <div class="input-box">
                  <textarea 
                    v-model="commentInput" 
                    placeholder="写下你的评论..."
                  ></textarea>
                  <button 
                    class="btn-publish" 
                    :class="{ disabled: !commentInput.trim() }"
                    @click="handlePublish"
                  >
                    发布
                  </button>
                </div>
              </div>

              <!-- 评论列表 -->
              <div ref="drawerListRef" class="comment-list">
                <div 
                  v-for="comment in comments" 
                  :key="comment.id" 
                  class="comment-item"
                >
                  <div class="comment-main">
                    <div class="avatar" :style="{ background: comment.avatar }"></div>
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
                      
                      <div class="comment-content-text" :class="{ blocked: comment.isBlocked && !comment.isExpanded }">
                        <template v-if="comment.isBlocked && !comment.isExpanded">
                          <span class="blocked-text">该评论已屏蔽</span>
                          <span class="view-link" @click="toggleBlockedComment(comment)">点击查看</span>
                        </template>
                        <template v-else>
                          <span :class="{ 'blocked-content': comment.isBlocked }">{{ comment.content }}</span>
                          <span v-if="comment.isBlocked" class="collapse-link" @click="toggleBlockedComment(comment)">收起</span>
                        </template>
                      </div>
                      
                      <div class="comment-actions">
                        <span class="time">{{ comment.time }}</span>
                        
                        <div class="action-button" @click="toggleLike(comment)">
                          <svg v-if="comment.isLiked" width="14" height="14" viewBox="0 0 14 13.5625" fill="none">
                            <path d="M3.08173 13.5625H0.880556C0.394277 13.5625 8.86355e-09 13.1708 0 12.6875V5.25001C0 4.76676 0.394277 4.37501 0.880556 4.37501H3.08173V13.5625Z" fill="#2784FF"/>
                            <path d="M8.14439 0C8.68668 0 9.18779 0.274301 9.48637 0.775026C9.78031 1.26801 9.85652 1.93814 9.67415 2.72348C9.51039 3.42865 9.29365 3.98291 9.1089 4.37501H13.1195C13.6387 4.37506 14.0451 4.81926 13.996 5.33289L13.9787 5.51405C13.992 5.61481 13.9942 5.71889 13.9829 5.82487L13.6245 9.20824L13.2831 12.7704C13.2401 13.2194 12.8607 13.5624 12.4068 13.5625H3.96229V4.31327C3.97769 4.30752 3.99394 4.30197 4.01057 4.29554C4.18881 4.22656 4.4317 4.11988 4.68903 3.97019C5.21392 3.66484 5.74404 3.21272 5.96885 2.58719C6.24406 1.82141 6.50876 1.19494 6.82313 0.757509C7.15158 0.30055 7.57316 3.61757e-05 8.14439 0Z" fill="#2784FF"/>
                          </svg>
                          <svg v-else width="14" height="14" viewBox="0 0 14 13.657" fill="none">
                            <path d="M8.15016 0C8.69283 0 9.19409 0.276213 9.49289 0.780426C9.78705 1.27685 9.8634 1.95162 9.6809 2.74246C9.51702 3.45256 9.30003 4.01066 9.11515 4.40549H12.6783C13.4629 4.40549 14.0747 5.08512 13.9926 5.86546L13.2971 12.4737C13.2263 13.1463 12.6591 13.657 11.9828 13.657H1.32165C0.614524 13.657 0.0371077 13.1017 0.0017209 12.4034L0 12.3354V5.72714C2.60027e-07 4.99721 0.591722 4.40549 1.32165 4.40549H3.78855C3.79343 4.40393 3.79875 4.40234 3.80425 4.40054C3.85266 4.38472 3.92455 4.36004 4.01334 4.32547C4.19171 4.25601 4.43472 4.14859 4.69224 3.99785C5.2175 3.69038 5.74804 3.23512 5.97301 2.60522C6.24841 1.8341 6.51327 1.20326 6.82787 0.762787C7.15656 0.302614 7.57848 0 8.15016 0ZM1.32165 5.28659C1.07834 5.28659 0.881099 5.48383 0.881098 5.72714V12.3354L0.883465 12.3803C0.905997 12.6025 1.09352 12.7759 1.32165 12.7759H3.41426V5.28659H1.32165ZM8.15016 0.881098C7.9509 0.881098 7.76701 0.964048 7.54505 1.27475C7.30899 1.60524 7.07817 2.13093 6.80291 2.90164C6.47721 3.81358 5.74113 4.4047 5.13752 4.75806C4.83063 4.9377 4.54352 5.06436 4.333 5.14634C4.32024 5.1513 4.30757 5.15567 4.29535 5.16032V12.7759H11.9828C12.2082 12.7759 12.3972 12.6056 12.4208 12.3814L13.1164 5.77317C13.1438 5.51309 12.9398 5.28659 12.6783 5.28659H8.79851C8.52409 5.28659 8.31602 5.12445 8.21082 4.93768C8.10664 4.75265 8.07784 4.50098 8.19856 4.27234L8.26783 4.13617C8.43766 3.79123 8.65804 3.25536 8.82217 2.54413C8.97005 1.90324 8.88119 1.47657 8.73483 1.22958C8.59308 0.990384 8.37845 0.881098 8.15016 0.881098Z" fill="#999999"/>
                          </svg>
                          <span v-if="comment.likes > 0">{{ comment.likes }}</span>
                        </div>
                        
                        <div class="action-button" @click="handleReply(comment)">
                    <svg width="14" height="13" viewBox="0 0 14 12.2544" fill="none">
                      <path d="M13.125 6.12537C13.125 3.28452 10.4461 0.875053 7 0.875053C3.55391 0.875053 0.875 3.28452 0.875 6.12537C0.875 7.03616 1.14573 7.89456 1.62631 8.64521C1.63041 8.65162 1.63171 8.65365 1.64062 8.66743L1.84891 8.98916L1.30075 11.1285L3.8403 10.6299L4.09793 10.7491C4.96007 11.148 5.9478 11.3757 7 11.3757V12.2507C5.8214 12.2507 4.70827 11.9955 3.7305 11.5432L0.109375 12.2544L0.906189 9.14319C0.900562 9.13451 0.894893 9.12585 0.889313 9.11713C0.324561 8.23502 0 7.21422 0 6.12537C0 2.68574 3.19488 0 7 0C10.8051 0 14 2.68574 14 6.12537C14 9.565 10.8051 12.2507 7 12.2507V11.3757C10.4461 11.3757 13.125 8.96622 13.125 6.12537Z" fill="currentColor"/>
                    </svg>
                  </div>
                        
                        <div class="action-button more" @click="toggleMoreMenu(comment.id, $event)">
                          <svg width="14" height="3" viewBox="0 0 14 3">
                            <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor"/>
                            <circle cx="7" cy="1.5" r="1.5" fill="currentColor"/>
                            <circle cx="12.5" cy="1.5" r="1.5" fill="currentColor"/>
                          </svg>
                        </div>
                        
                        <span v-if="comment.isBlocked && comment.isExpanded" class="action" @click="handleUnblock(comment)">取消屏蔽</span>
                      </div>
                    </div>
                  </div>

                  <!-- 主评论的回复输入框 -->
                  <div v-if="comment.showReplyInput && replyingTo" class="reply-input-section" :data-reply-to="replyingTo.id">
                    <div class="avatar small" :style="{ background: '#FA7F7F' }"></div>
                    <div class="input-box">
                      <textarea 
                        v-model="commentInput" 
                        :placeholder="`回复@${replyingTo.username}：`"
                        @keydown.enter.ctrl="handlePublish"
                      ></textarea>
                      <button 
                        class="btn-cancel-reply"
                        @click="cancelReply"
                      >
                        取消
                      </button>
                      <button 
                        class="btn-publish" 
                        :class="{ disabled: !commentInput.trim() }"
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
                          <div class="avatar small" :style="{ background: reply.avatar }"></div>
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
                                <svg v-if="reply.isLiked" width="14" height="14" viewBox="0 0 14 13.5625" fill="none">
                                  <path d="M3.08173 13.5625H0.880556C0.394277 13.5625 8.86355e-09 13.1708 0 12.6875V5.25001C0 4.76676 0.394277 4.37501 0.880556 4.37501H3.08173V13.5625Z" fill="#2784FF"/>
                                  <path d="M8.14439 0C8.68668 0 9.18779 0.274301 9.48637 0.775026C9.78031 1.26801 9.85652 1.93814 9.67415 2.72348C9.51039 3.42865 9.29365 3.98291 9.1089 4.37501H13.1195C13.6387 4.37506 14.0451 4.81926 13.996 5.33289L13.9787 5.51405C13.992 5.61481 13.9942 5.71889 13.9829 5.82487L13.6245 9.20824L13.2831 12.7704C13.2401 13.2194 12.8607 13.5624 12.4068 13.5625H3.96229V4.31327C3.97769 4.30752 3.99394 4.30197 4.01057 4.29554C4.18881 4.22656 4.4317 4.11988 4.68903 3.97019C5.21392 3.66484 5.74404 3.21272 5.96885 2.58719C6.24406 1.82141 6.50876 1.19494 6.82313 0.757509C7.15158 0.30055 7.57316 3.61757e-05 8.14439 0Z" fill="#2784FF"/>
                                </svg>
                                <svg v-else width="14" height="14" viewBox="0 0 14 13.657" fill="none">
                                  <path d="M8.15016 0C8.69283 0 9.19409 0.276213 9.49289 0.780426C9.78705 1.27685 9.8634 1.95162 9.6809 2.74246C9.51702 3.45256 9.30003 4.01066 9.11515 4.40549H12.6783C13.4629 4.40549 14.0747 5.08512 13.9926 5.86546L13.2971 12.4737C13.2263 13.1463 12.6591 13.657 11.9828 13.657H1.32165C0.614524 13.657 0.0371077 13.1017 0.0017209 12.4034L0 12.3354V5.72714C2.60027e-07 4.99721 0.591722 4.40549 1.32165 4.40549H3.78855C3.79343 4.40393 3.79875 4.40234 3.80425 4.40054C3.85266 4.38472 3.92455 4.36004 4.01334 4.32547C4.19171 4.25601 4.43472 4.14859 4.69224 3.99785C5.2175 3.69038 5.74804 3.23512 5.97301 2.60522C6.24841 1.8341 6.51327 1.20326 6.82787 0.762787C7.15656 0.302614 7.57848 0 8.15016 0ZM1.32165 5.28659C1.07834 5.28659 0.881099 5.48383 0.881098 5.72714V12.3354L0.883465 12.3803C0.905997 12.6025 1.09352 12.7759 1.32165 12.7759H3.41426V5.28659H1.32165ZM8.15016 0.881098C7.9509 0.881098 7.76701 0.964048 7.54505 1.27475C7.30899 1.60524 7.07817 2.13093 6.80291 2.90164C6.47721 3.81358 5.74113 4.4047 5.13752 4.75806C4.83063 4.9377 4.54352 5.06436 4.333 5.14634C4.32024 5.1513 4.30757 5.15567 4.29535 5.16032V12.7759H11.9828C12.2082 12.7759 12.3972 12.6056 12.4208 12.3814L13.1164 5.77317C13.1438 5.51309 12.9398 5.28659 12.6783 5.28659H8.79851C8.52409 5.28659 8.31602 5.12445 8.21082 4.93768C8.10664 4.75265 8.07784 4.50098 8.19856 4.27234L8.26783 4.13617C8.43766 3.79123 8.65804 3.25536 8.82217 2.54413C8.97005 1.90324 8.88119 1.47657 8.73483 1.22958C8.59308 0.990384 8.37845 0.881098 8.15016 0.881098Z" fill="#999999"/>
                                </svg>
                                <span v-if="reply.likes">{{ reply.likes }}</span>
                              </div>
                              
                              <div class="action-button" @click="handleReply(reply, comment)">
                          <svg width="14" height="13" viewBox="0 0 14 12.2544" fill="none">
                            <path d="M13.125 6.12537C13.125 3.28452 10.4461 0.875053 7 0.875053C3.55391 0.875053 0.875 3.28452 0.875 6.12537C0.875 7.03616 1.14573 7.89456 1.62631 8.64521C1.63041 8.65162 1.63171 8.65365 1.64062 8.66743L1.84891 8.98916L1.30075 11.1285L3.8403 10.6299L4.09793 10.7491C4.96007 11.148 5.9478 11.3757 7 11.3757V12.2507C5.8214 12.2507 4.70827 11.9955 3.7305 11.5432L0.109375 12.2544L0.906189 9.14319C0.900562 9.13451 0.894893 9.12585 0.889313 9.11713C0.324561 8.23502 0 7.21422 0 6.12537C0 2.68574 3.19488 0 7 0C10.8051 0 14 2.68574 14 6.12537C14 9.565 10.8051 12.2507 7 12.2507V11.3757C10.4461 11.3757 13.125 8.96622 13.125 6.12537Z" fill="currentColor"/>
                          </svg>
                        </div>
                              
                              <div class="action-button more" @click="toggleMoreMenu(reply.id, $event)">
                                <svg width="14" height="3" viewBox="0 0 14 3">
                                  <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor"/>
                                  <circle cx="7" cy="1.5" r="1.5" fill="currentColor"/>
                                  <circle cx="12.5" cy="1.5" r="1.5" fill="currentColor"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- 回复的回复输入框 -->
                        <div v-if="reply.showReplyInput && replyingTo" class="reply-input-section nested">
                          <div class="avatar small" :style="{ background: '#FA7F7F' }"></div>
                          <div class="input-box">
                            <textarea 
                              v-model="commentInput" 
                              :placeholder="`回复@${replyingTo.username}：`"
                              @keydown.enter.ctrl="handlePublish"
                            ></textarea>
                            <button 
                              class="btn-cancel-reply"
                              @click="cancelReply"
                            >
                              取消
                            </button>
                            <button 
                              class="btn-publish" 
                              :class="{ disabled: !commentInput.trim() }"
                              @click="handlePublish"
                            >
                              发布
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- 展开/收起回复 -->
                    <div v-if="comment.totalReplies && comment.replies && comment.replies.length > 3" class="replies-toggle">
                      <!-- 未展开时显示提示 -->
                      <span v-if="!comment.showAllReplies" class="toggle-link" @click="toggleReplies(comment)">
                        共{{ comment.totalReplies }}条回复，点击查看
                      </span>
                      <!-- 展开后显示分页 -->
                      <template v-else>
                        <span class="page-info">共{{ getTotalReplyPages(comment) }}页 {{ comment.totalReplies }}条回复</span>
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
                          v-if="comment.currentReplyPage && comment.currentReplyPage < getTotalReplyPages(comment)" 
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
            </div>

            <!-- 抽屉底部悬浮输入框 - 仅用于发布新评论 -->
            <Transition name="drawer-slide-up">
              <div v-if="isLoggedIn && showFloatingInput && !replyingTo" class="drawer-floating-input">
                <div class="avatar small" :style="{ background: '#FA7F7F' }"></div>
                <div class="input-box">
                  <textarea 
                    v-model="commentInput" 
                    placeholder="写下你的评论..."
                  ></textarea>
                  <button 
                    class="btn-publish" 
                    :class="{ disabled: !commentInput.trim() }"
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
                    <button class="btn btn-secondary" @click="showReportDialog = false">取消</button>
                    <button class="btn btn-primary" @click="submitReport">提交</button>
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
                  
                  <p class="hint">请填写举报理由（必填）</p>
                  <textarea 
                    v-model="reportDetail" 
                    class="report-detail"
                    placeholder="请详细描述..."
                  ></textarea>
                </div>

                <!-- 抽屉内的举报成功提示 -->
                <Transition name="fade">
                  <div v-if="reportSuccess" class="drawer-report-success">
                    举报已受理
                  </div>
                </Transition>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </template>

    <!-- 垂直模式的举报弹窗 -->
    <Transition name="fade">
      <div v-if="showReportDialog && mode === 'vertical'" class="report-overlay" @click="showReportDialog = false">
        <div class="report-dialog" @click.stop>
          <div class="report-header">
            <h3>举报</h3>
            <div class="button-group">
              <button class="btn btn-secondary" @click="showReportDialog = false">取消</button>
              <button class="btn btn-primary" @click="submitReport">提交</button>
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
            
            <p class="hint">请填写举报理由（必填）</p>
            <textarea 
              v-model="reportDetail" 
              class="report-detail"
              placeholder="请详细描述..."
            ></textarea>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 垂直模式的举报成功提示 -->
    <Transition name="fade">
      <div v-if="reportSuccess && mode === 'vertical'" class="report-success">
        举报已受理
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.comment-widget {
  font-family: Inter, sans-serif;
}

/* 垂直模式 */
.vertical-container {
  max-width: 920px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* 亮色主题 */
.theme-light {
  --bg-primary: #ffffff;
  --text-primary: #222222;
  --text-secondary: #999999;
  --border-color: #E4E7EB;
  --theme-color: #2784FF;
}

/* 暗黑主题 */
.theme-dark {
  --bg-primary: #222222;
  --text-primary: #ffffff;
  --text-secondary: #999999;
  --border-color: rgba(255, 255, 255, 0.2);
  --theme-color: #2784FF;
}

/* 登录提示 */
.login-prompt {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px 164px;
  background: var(--bg-primary);
  border-radius: 4px;
  margin-bottom: 30px;
}

.login-prompt span {
  font-size: 14px;
  color: var(--text-primary);
}

.btn-login {
  padding: 9px 20px;
  background: var(--theme-color);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-login:hover {
  opacity: 0.8;
}

/* 评论输入框 */
.comment-input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background: var(--bg-primary);
  border-radius: 4px;
  padding: 10px;
}

/* 回复输入框 */
.reply-input-section {
  display: flex;
  gap: 10px;
  padding: 10px;
  margin-top: 10px;
  margin-left: 50px;
  background: var(--bg-primary);
  border-radius: 4px;
}

/* 嵌套回复输入框（回复的回复） */
.reply-input-section.nested {
  margin-left: 0;
  margin-top: 10px;
}

/* 回复输入框动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease-in-out;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid var(--border-color);
}

.avatar.small {
  width: 30px;
  height: 30px;
}

.input-box {
  flex: 1;
  position: relative;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 10px;
  min-height: 60px;
}

.input-box textarea {
  width: 100%;
  height: 40px;
  border: none;
  outline: none;
  resize: none;
  font-family: Inter, sans-serif;
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;
}

.btn-publish,
.btn-cancel-reply {
  position: absolute;
  bottom: 10px;
  padding: 6px 15px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-publish {
  right: 10px;
  background: var(--theme-color);
  color: #fff;
}

.btn-cancel-reply {
  right: 80px;
  background: var(--border-color);
  color: #666;
}

.btn-publish.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-publish:not(.disabled):hover {
  opacity: 0.8;
}

/* 评论列表 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-item {
  background: var(--bg-primary);
  border-radius: 4px;
}

.comment-main {
  display: flex;
  gap: 10px;
  padding: 10px;
}

.comment-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.user-role {
  padding: 0 5px;
  color: #fff;
  font-size: 11px;
  line-height: 1.64;
  border-radius: 4px;
}

.username {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--text-primary);
}

.reply-to {
  font-size: 12px;
  color: var(--text-secondary);
}

.comment-content-text {
  font-size: 14px;
  line-height: 1.43;
  color: var(--text-primary);
  word-break: break-word;
}

.comment-content-text.blocked {
  display: flex;
  gap: 10px;
}

.blocked-text {
  color: var(--text-secondary);
}

.blocked-content {
  opacity: 0.4;
}

.view-link,
.collapse-link,
.toggle-link {
  color: var(--theme-color);
  cursor: pointer;
}

.view-link:hover,
.collapse-link:hover,
.toggle-link:hover {
  text-decoration: underline;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 12px;
  line-height: 1.5;
}

.time {
  color: var(--text-secondary);
}

.action {
  color: var(--text-secondary);
  cursor: pointer;
}

.action:hover {
  color: var(--theme-color);
}

.action-button {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 2px;
}

.action-button:hover {
  color: var(--theme-color);
}

.action-button svg {
  width: 14px;
  height: 14px;
}

.action-button.more svg {
  width: 14px;
  height: 3px;
}

/* 回复区域 */
.replies-section {
  padding: 0 0 0 50px;
}

.replies {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reply-item {
  padding-left: 0;
}

.replies-toggle {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  font-size: 12px;
  color: var(--text-secondary);
}

.toggle-link {
  color: var(--text-secondary);
  cursor: pointer;
}

.toggle-link:hover {
  color: var(--theme-color);
}

.page-info {
  color: var(--text-secondary);
}

.page-link {
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}

.page-link:hover {
  color: var(--theme-color);
}

.page-link.active {
  color: var(--theme-color);
  font-weight: 600;
}

/* 底部悬浮输入框 */
.floating-input {
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translate(-50%, 0);
  max-width: 920px;
  width: calc(100% - 40px);
  display: flex;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(4px);
  box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  z-index: 100;
}

.theme-dark .floating-input {
  background: rgba(34, 34, 34, 0.8);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s, opacity 0.3s;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translate(-50%, 100%);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translate(-50%, 0);
  opacity: 1;
}

/* 更多菜单 */
.more-menu {
  position: fixed;
  width: 110px;
  background: var(--bg-primary);
  border-radius: 4px;
  box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.2);
  padding: 10px 0;
  z-index: 3000;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover {
  background: var(--theme-color);
  color: #fff;
}

.menu-item.primary {
  background: var(--theme-color);
  color: #fff;
}

.menu-item.primary:hover {
  background: var(--theme-color);
  opacity: 0.9;
}

.menu-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--text-primary);
  transition: color 0.2s;
}

.menu-item:hover svg {
  color: #fff;
}

.theme-dark .menu-item:hover {
  background: var(--theme-color);
  color: #fff;
}

/* 举报弹窗（垂直模式和抽屉模式共用） */
.report-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.report-dialog {
  width: 700px;
  max-height: 90vh;
  background: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid var(--border-color);
}

.report-header h3 {
  font-size: 20px;
  font-weight: 400;
  margin: 0;
  color: var(--text-primary);
}

.button-group {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 9px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary {
  background: var(--border-color);
  color: #666;
}

.btn-primary {
  background: var(--theme-color);
  color: #fff;
}

.report-content {
  padding: 30px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.report-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.report-option:hover {
  border-color: var(--theme-color);
}

.report-option.active {
  background: rgba(39, 132, 255, 0.1);
  border-color: var(--theme-color);
}

.radio {
  width: 16px;
  height: 16px;
  border: 1px solid var(--text-primary);
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio.checked {
  border-color: var(--theme-color);
}

.radio-dot {
  width: 10px;
  height: 10px;
  background: var(--theme-color);
  border-radius: 50%;
}

.hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 10px;
}

.hint {
  font-size: 12px;
  line-height: 18px;
  color: var(--text-secondary);
  margin: 10px 0 0;
}

.report-detail {
  width: 100%;
  height: 160px;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: Inter, sans-serif;
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;
  resize: none;
  outline: none;
}

/* 垂直模式的举报成功提示 */
.report-success {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 10px 30px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 20px;
  z-index: 3001;
}

/* 亮色模式 */
.comment-widget.theme-light .report-success {
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
}

/* 暗黑模式 */
.comment-widget.theme-dark .report-success {
  background: rgba(255, 255, 255, 0.4);
  color: #222;
}

/* 抽屉内的举报面板 */
.drawer-report-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 520px;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
}

.drawer-report-panel .report-header {
  padding: 20px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.drawer-report-panel .report-header h3 {
  font-size: 20px;
  line-height: 26px;
  font-weight: 400;
  color: var(--text-primary);
  margin: 0;
}

.drawer-report-panel .button-group {
  display: flex;
  gap: 10px;
}

.drawer-report-panel .btn {
  padding: 9px 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

/* 亮色模式按钮 */
.comment-widget.theme-light .drawer-report-panel .btn-secondary {
  background: #E4E7EB;
  color: #666;
}

.comment-widget.theme-light .drawer-report-panel .btn-secondary:hover {
  background: #d0d3d7;
}

/* 暗黑模式按钮 */
.comment-widget.theme-dark .drawer-report-panel .btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.comment-widget.theme-dark .drawer-report-panel .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.drawer-report-panel .btn-primary {
  background: #2784FF;
  color: #fff;
}

.drawer-report-panel .btn-primary:hover {
  background: #1a73e8;
}

.drawer-report-panel .report-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drawer-report-panel .report-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.drawer-report-panel .report-option:hover {
  border-color: var(--theme-color);
}

.drawer-report-panel .report-option.active {
  background: rgba(39, 132, 255, 0.1);
  border-color: var(--theme-color);
}

.drawer-report-panel .report-option span {
  font-size: 14px;
  line-height: 20px;
  color: var(--text-primary);
}

.drawer-report-panel .radio {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  position: relative;
  transition: all 0.2s;
}

/* 亮色模式单选框 */
.comment-widget.theme-light .drawer-report-panel .radio {
  border: 1px solid #222;
}

.comment-widget.theme-light .drawer-report-panel .radio.checked {
  border-color: var(--theme-color);
}

/* 暗黑模式单选框 */
.comment-widget.theme-dark .drawer-report-panel .radio {
  border: 1px solid #fff;
}

.comment-widget.theme-dark .drawer-report-panel .radio.checked {
  border-color: var(--theme-color);
}

.drawer-report-panel .radio-dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--theme-color);
}

.drawer-report-panel .hint {
  font-size: 12px;
  line-height: 18px;
  color: var(--text-secondary);
  margin: 10px 0 0;
}

.drawer-report-panel .report-detail {
  width: 100%;
  height: 160px;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 20px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.drawer-report-panel .report-detail:focus {
  border-color: var(--theme-color);
}

.drawer-report-panel .report-detail::placeholder {
  color: var(--text-secondary);
}

/* 抽屉内的举报成功提示 */
.drawer-report-success {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 10px 30px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 20px;
  z-index: 101;
  pointer-events: none;
}

/* 亮色模式 */
.comment-widget.theme-light .drawer-report-success {
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
}

/* 暗黑模式 */
.comment-widget.theme-dark .drawer-report-success {
  background: rgba(255, 255, 255, 0.4);
  color: #222;
}


/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 抽屉模式 */
.drawer-triggers {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
}

.float-button {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-dark .float-button {
  color: #fff;
}

.theme-light .float-button {
  color: #000;
  border-color: rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.9);
}

.float-button:hover {
  transform: scale(1.05);
}

.float-button .badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: #ff4757;
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}

/* 抽屉覆盖层 */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
}

/* 抽屉内容 */
.drawer-content {
  position: relative;
  width: 500px;
  max-width: 90vw;
  height: 100vh;
  background: var(--bg-primary);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (max-width: 768px) {
  .drawer-content {
    width: 100vw;
    max-width: 100vw;
  }
}

/* 抽屉头部 */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.drawer-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
}

/* 抽屉主体 */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 100px; /* 为悬浮输入框留出空间 */
  background: var(--bg-primary);
}

.drawer-body .comment-list {
  margin-top: 0;
}

.drawer-body .login-prompt {
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.drawer-body .comment-input-section {
  margin-bottom: 20px;
  padding: 10px;
  background: var(--bg-primary);
  border-radius: 8px;
}

/* 抽屉中的回复输入框 */
.drawer-body .reply-input-section {
  margin-left: 40px;
  margin-top: 10px;
  margin-bottom: 10px;
}

/* 抽屉中的嵌套回复输入框 */
.drawer-body .reply-input-section.nested {
  margin-left: 0;
  margin-top: 10px;
  margin-bottom: 10px;
}

/* 抽屉中的评论项样式优化 */
.drawer-body .comment-item {
  margin-bottom: 10px;
}

/* 抽屉滚动条样式 */
.drawer-body::-webkit-scrollbar {
  width: 6px;
}

.drawer-body::-webkit-scrollbar-track {
  background: transparent;
}

.drawer-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.drawer-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.theme-dark .drawer-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.theme-dark .drawer-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 抽屉悬浮输入框 */
.drawer-floating-input {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  box-shadow: 0px -2px 15px 0px rgba(0, 0, 0, 0.08);
  border-top: 1px solid var(--border-color);
  z-index: 10;
}

.theme-dark .drawer-floating-input {
  background: rgba(34, 34, 34, 0.98);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.drawer-floating-input .input-box {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px 10px;
  min-height: 50px;
  position: relative;
}

.drawer-floating-input .input-box textarea {
  width: 100%;
  height: 34px;
  border: none;
  outline: none;
  resize: none;
  font-family: Inter, sans-serif;
  font-size: 14px;
  color: var(--text-primary);
  background: transparent;
}

.drawer-floating-input .btn-publish,
.drawer-floating-input .btn-cancel-reply {
  position: absolute;
  bottom: 8px;
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.drawer-floating-input .btn-publish {
  right: 10px;
  background: var(--theme-color);
  color: #fff;
}

.drawer-floating-input .btn-cancel-reply {
  right: 70px;
  background: var(--border-color);
  color: #666;
}

.drawer-floating-input .btn-publish.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.drawer-floating-input .btn-publish:not(.disabled):hover {
  opacity: 0.9;
}

/* 抽屉悬浮输入框动画 */
.drawer-slide-up-enter-active,
.drawer-slide-up-leave-active {
  transition: all 0.25s ease-out;
}

.drawer-slide-up-enter-from,
.drawer-slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.drawer-slide-up-enter-to,
.drawer-slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}

/* 抽屉滑入动画 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from .drawer-content,
.slide-right-leave-to .drawer-content {
  transform: translateX(100%);
}

.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
}

.slide-right-enter-to,
.slide-right-leave-from {
  opacity: 1;
}

.slide-right-enter-to .drawer-content,
.slide-right-leave-from .drawer-content {
  transform: translateX(0);
}
</style>
