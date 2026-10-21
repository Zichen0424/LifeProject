# 中文 TNO 人生模拟入口

`index.html` 现为《新秩序：芸芸众生》中文游戏。双击即可打开；也可从仓库根目录运行：

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

访问 <http://127.0.0.1:8765/1in8b-source/index.html>。本版样式、图标、数据及脚本全部本地载入；无需后端或远程字体。浏览器存储不可用时可以继续游玩并导出档案，但刷新后可能无法恢复。

完整玩法、开发接口与测试命令见[仓库说明](../README.md)，资料来源与世界路线取舍见 [tno/SOURCES.md](tno/SOURCES.md)。

## 保留的原始前端存档

- `original.html`：原网站返回的未改写 HTML，部分绝对路径依赖原站环境。
- `assets/zh-hans.21693a37a9.js`：原始主脚本，包含原版数据与逻辑，本版游戏不加载。
- `assets/fonts.css`：原始字体声明，本版游戏不加载。
- `capture.json`：2026-10-21 抓取时的来源与校验信息；其中旧 index.html 校验不适用于当前改编版。
- `preview.jpg`：原版截图，用于比较设计基底。

原来源：<https://1in8b.life/zh-hans/>；抓取页面显示 v0.7.94。原版公开代码的授权边界维持不变，不包含其后端、私有数据或付费服务。本版不调用这些在线接口。
