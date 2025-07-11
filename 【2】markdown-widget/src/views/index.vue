<template>
  <div
    class="markdown-wrapper"
    :style="{ '--fontSize': fontSize,backgroundColor: themeColor }"
    v-html="content"
    v-highlight
    oncontextmenu="return false"
    v-if="
      exhibitInfo?.articleInfo?.articleType === 2
        ? exhibitInfo?.collectionInfo?.articleInfo?.articleProperty?.mime?.includes('text/markdown' )
        : exhibitInfo?.versionInfo?.exhibitProperty?.mime?.includes( 'text/markdown')"
  ></div>

  <div id="content" class="txt-wrapper" :style="{ '--fontSize': fontSize, backgroundColor: themeColor }" v-else>{{ content }}</div>
</template>

<script lang="ts">
import showdown from "showdown";
import { reactive, toRefs } from "vue";
import { ExhibitInfo, ExhibitVersionInfo, freelogApp, widgetApi } from "freelog-runtime";
import { readerThemeList } from "@/common/constants";

export default {
  name: "markdown-widget",

  setup() {
    showdown.setOption("tables", true);
    showdown.setOption("tasklists", true);
    showdown.setOption("simplifiedAutoLink", true);
    showdown.setOption("openLinksInNewWindow", true);
    showdown.setOption("backslashEscapesHTMLTags", true);
    showdown.setOption("emoji", true);
    showdown.setOption("splitAdjacentBlockquotes", true);
    showdown.setOption("strikethrough", true);
    showdown.setOption("simpleLineBreaks", true);

    const safeParseJSON=(value:string)=> {
        try {
            return JSON.parse(value);
        } catch (e) {
            return null;
        }
    };

    let widgetConfig = widgetApi.getData();
    const theme = safeParseJSON(localStorage.getItem("theme") as string);
    const data = reactive({
      exhibitInfo: null as ExhibitInfo | null,
      content: "",
      fontSize: 16,
      themeColor: theme?.bookColor || readerThemeList[0].bookColor
    });

    /** 初始化数据 */
    const initData = async () => {
      data.exhibitInfo = widgetConfig.exhibitInfo;
      data.fontSize = widgetConfig.fontSize;
      getContent();
    };

    /** 获取并解析内容 */
    const getContent = async () => {
      let html = "";

      if (!widgetConfig.content || !widgetConfig.exhibitInfo) return;

      const { exhibitProperty, dependencyTree } = widgetConfig.exhibitInfo.versionInfo as ExhibitVersionInfo;
      
      if ((typeof exhibitProperty?.mime === "string" && exhibitProperty?.mime?.includes("text/markdown")) || (widgetConfig?.exhibitInfo?.collectionInfo?.articleInfo?.articleProperty?.mime?.includes('text/markdown' ))) {
        // markdown 文件，以 markdown 解析
        html = md2Html(widgetConfig.content);
      } else {
        html = widgetConfig.content;
      }

      const deps = dependencyTree.filter((_: any, index: number) => index !== 0);
      let promiseArr = [] as Promise<any>[];
      
      deps.forEach((dep) => {
        const isMediaResource =
          dep.resourceType.includes("图片") || dep.resourceType.includes("视频") || dep.resourceType.includes("音频");
        const depContent = (freelogApp as any).getExhibitDepFileStream(widgetConfig.exhibitInfo.exhibitId, {
          nid: dep.nid,
          returnUrl: isMediaResource,
        });
        
        promiseArr.push(depContent);
      });
      
      await Promise.all(promiseArr).then((res) => {
        res.forEach((dep, index) => {
          if (dep.data) {
            // 进一步判断是否为文本文件
            if (!dep.headers["content-type"].startsWith("text")) return;

            // 返回数据是对象，切有data属性，说明该依赖未非媒体资源
            const reg = new RegExp(`{{freelog://${deps[index].articleName}}}`, "g");
            const data = md2Html(dep.data);
            html = html.replace(reg, data);
          } else {
            // 媒体资源
            let regStr = `src=['"]freelog://${deps[index].articleName}['"]`;
            // 将资源名称中的括号()添加\
            regStr = regStr.replace(/\(/g, "\\(").replace(/\)/g, "\\)");
            const reg = new RegExp(regStr, "g");
            html = html.replace(reg, `src="${dep}"`);
          }
        });
      });

      // 隐藏视频与音频的下载按钮
      html = html.replace(/<img/g, "<p><img");
      html = html.replace(/<video/g, '<p><video controlslist="nodownload"');
      html = html.replace(/<audio/g, '<p><audio controlslist="nodownload"');

      data.content = html;
    };

    /** md 转 html */
    const md2Html = (markdown: string) => {
      const converter = new showdown.Converter();
      let result = converter.makeHtml(markdown);

      // 将删除线 <del> 改为 <s>
      result = result.replace(/<del>/gi, "<s>").replace(/<\/del>/gi, "</s>");

      // 将引用 <blockquote> 内容转换时自动添加的 <p> 去掉
      result = result
        .replace(/<blockquote>\s*<p>/gi, "<blockquote>")
        .replace(/<\/p>\s*<\/blockquote>/gi, "</blockquote>");

      // 将代码块最后自动添加的换行去掉
      result = result.replace(/\s*<\/code>/gi, "</code>");

      return result;
    };

    // 监听父->子的数据
    widgetApi.addDataListener((props: any) => {
      if (props.fontSize) {
        data.fontSize = props.fontSize;
      }

      if (props.themeColor) {
        data.themeColor = props.themeColor.bookColor;
      }

      if (props.content) {
        widgetConfig = widgetApi.getData();
        getContent();
      }
    });

    initData();

    return {
      ...toRefs(data),
    };
  },
};
</script>

<style lang="scss" scoped>
::v-deep.markdown-wrapper {
  width: 100%;
  font-size: calc(var(--fontSize) * 1px);
  color: #222;
  user-select: none;
  transition: all 0.2s linear;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: #222;
    line-height: 1.25;
    margin-top: 50px;
    margin-bottom: 20px;
    font-weight: bold;
    transition: all 0.2s linear;
  }

  h1 {
    font-size: calc(var(--fontSize) / 16 * 36 * 1px);
    margin-top: 0;
  }

  h2 {
    font-size: calc(var(--fontSize) / 16 * 32 * 1px);
  }

  h3 {
    font-size: calc(var(--fontSize) / 16 * 28 * 1px);
  }

  h4 {
    font-size: calc(var(--fontSize) / 16 * 22 * 1px);
  }

  h5 {
    font-size: calc(var(--fontSize) / 16 * 16 * 1px);
  }

  h6 {
    font-size: calc(var(--fontSize) / 16 * 13.6 * 1px);
    color: #6a737d;
  }

  hr {
    height: 4px;
    padding: 0;
    margin: 50px 0;
    background-color: #e1e4e8;
    border: 0;
  }

  p {
    white-space: pre-wrap;
    font-weight: normal;
    margin-top: 0;
    margin-bottom: 16px;
    font-size: calc(var(--fontSize) * 1px);
    line-height: calc((var(--fontSize) + 14) * 1px);
    transition: all 0.2s linear;
  }

  strong {
    font-weight: bold;
  }

  em {
    font-style: italic;
  }

  blockquote {
    color: #6a737d;
    border-left: 3px solid #dfe2e5;
    background-color: #fafafa;
    padding: 4px 0 4px 16px;
    margin-bottom: 10px;

    p {
      margin: 4px 0;
    }
  }

  ol,
  ul {
    padding-left: 32px;
    padding-bottom: 16px;
    line-height: 1.7;
  }

  ol {
    list-style-type: decimal;
  }

  ul {
    list-style-type: disc;
  }

  pre {
    padding: 16px;
    overflow-x: auto;
    font-size: calc(var(--fontSize) / 16 * 14 * 1px);
    line-height: 1.45;
    background-color: #323232;
    border-radius: 3px;
    font-family: sans-serif;
    letter-spacing: 0.6px;
    transition: all 0.2s linear;

    & + pre {
      margin-top: 30px;
    }

    ::-webkit-scrollbar {
      height: 8px;
      border-radius: 8px;
      background-color: rgba(0, 0, 0, 0.2);
    }

    ::-webkit-scrollbar-thumb {
      height: 8px;
      border-radius: 8px;
      background-color: rgba(255, 255, 255, 0.3);

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }

    code {
      background-color: transparent;
      color: #fff;
      padding: 0;
    }
  }

  code {
    padding: 2px 8px;
    color: rgba(0, 0, 0, 0.8);
    background-color: #f7f7f9;
    border-radius: 3px;
  }

  a {
    color: #3eaf7c;
    font-weight: 500;
    text-decoration: none;
    display: inline-block;
  }

  img,
  video,
  audio {
    max-width: 100%;
    margin-left: 50%;
    transform: translateX(-50%);
  }

  video {
    width: 100%;
  }

  table {
    display: block;
    word-break: initial;
    width: 100%;
    overflow: auto;
    margin-bottom: 30px;

    tbody tr:nth-child(2n) {
      background-color: #f6f8fa;
    }

    tr {
      background-color: #fff;
      border-top: 1px solid #c6cbd1;

      th,
      td {
        padding: 10px 13px;
        border: 1px solid #dfe2e5;
      }

      th {
        font-weight: bold;
      }
    }
  }
}

.txt-wrapper {
  white-space: pre-wrap;
  font-size: calc(var(--fontSize) * 1px);
  line-height: calc((var(--fontSize) + 14) * 1px);
  transition: all 0.2s linear;
}
</style>
