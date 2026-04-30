import copyIcon from '../assets/share-icons/copy.svg'
import downloadIcon from '../assets/share-icons/download.svg'
import qqZoneIcon from '../assets/share-icons/qqZone.png'
import qqIcon from '../assets/share-icons/qq.png'
import weiboIcon from '../assets/share-icons/weibo.png'
import wechatIcon from '../assets/share-icons/wechat.png'
import doubanIcon from '../assets/share-icons/douban.png'

export interface ShareBtnItem {
  id: string
  name: string
  alias?: string
  icon: string
}

/** PC 端分享按钮 */
export const shareBtns: ShareBtnItem[] = [
  { id: 'copy', name: '复制链接', icon: copyIcon},
  { id: 'qqZone', name: 'QQ空间', icon: qqZoneIcon,  },
  { id: 'qq', name: 'QQ好友', alias: 'QQ',  icon: qqIcon,  },
  { id: 'weibo', name: '新浪微博', icon: weiboIcon,  },
  { id: 'wechat', name: '微信好友',alias: '微信', icon: wechatIcon,  },
  { id: 'douban', name: '豆瓣', icon: doubanIcon,  },
]

/** 移动端分享选项 */
export const shareBtnsMobile: ShareBtnItem[] = [
  { id: 'download', name: '下载名片', icon: downloadIcon, },
  { id: 'copy', name: '复制链接', icon: copyIcon, },
  { id: 'qqZone', name: 'QQ空间', icon: qqZoneIcon },
  { id: 'qq', name: 'QQ好友', alias: 'QQ', icon: qqIcon},
  { id: 'weibo', name: '新浪微博', icon: weiboIcon },
  { id: 'wechat', name: '微信好友', alias: '微信', icon: wechatIcon},
  { id: 'douban', name: '豆瓣', icon: doubanIcon},
]
