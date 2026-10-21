# LifeProject

人生模拟网页游戏的开发工作区，当前包含从 [1in8b.life 简体中文页面](https://1in8b.life/zh-hans/) 保存的公开前端源码，作为后续功能修改和世界观改编的起点。

## 当前内容

- [`1in8b-source/index.html`](1in8b-source/index.html)：内嵌主脚本和样式的本地单文件版本。
- [`1in8b-source/original.html`](1in8b-source/original.html)：原网站返回的 HTML。
- [`1in8b-source/assets/`](1in8b-source/assets/)：原始 JavaScript 和字体样式。
- [`1in8b-source/README.md`](1in8b-source/README.md)：来源、运行方法、依赖和验证记录。
- [`1in8b-source/capture.json`](1in8b-source/capture.json)：文件来源及校验值。

## 本地运行

在仓库根目录执行：

```sh
python -m http.server 8765 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8765/1in8b-source/index.html>。

也可以直接用浏览器打开 `1in8b-source/index.html`。字体和部分资源仍需要联网；原站的社区、追思馆、支付等在线功能依赖其后端，本仓库不包含这些后端。

## 开发方向

- 游戏逻辑在浏览器运行，记录保存在玩家浏览器本地。
- 后续逐步整理代码、增加事件和功能，并适配静态站点部署。
- 单文件 HTML 已内嵌脚本，修改独立的 `assets` 文件不会自动更新其中的代码。

## 来源

当前前端存档抓取于 2026-10-21，上游页面显示版本为 v0.7.94。本项目与原网站无关联；保存公开源码不代表获得其开源授权，本仓库未为上游内容另行添加许可证。
