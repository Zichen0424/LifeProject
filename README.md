# 新秩序：芸芸众生

基于“80亿分之1”的人生模拟设计，制作的中文 TNO 同人网页游戏。1962 年以 18 岁青年身份开局，在随机世界路线中经历至 1972 年；健康降为零会提前结算。无需后端、账号或联网资源。

## 运行

直接用现代浏览器打开 [`1in8b-source/index.html`](1in8b-source/index.html)，或在仓库根目录执行：

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

浏览器访问 <http://127.0.0.1:8765/1in8b-source/index.html>。同一浏览器在不同地址（包括 file://、localhost 与 127.0.0.1）下的存档相互独立。

## 游戏

- 八个起始地区：美国、德国、日本、中国、广东、托木斯克、鄂木斯克、伊尔库茨克；可以指定或随机出身。
- 人物拥有家庭、阶层、居住环境、教育、童年记忆与职业。健康、经济状况、教育、家庭关系及政治风险均为 0—100 游戏参数，政治风险越低越好。
- 选择事件后可推进下一年；自动推进遇到选择即暂停，切换页面或切到后台也会暂停。
- 美国、德国、日本各两类路线，俄罗斯三类统一走向；世界路线由开局种子决定，个人选择不直接决定国家路线。
- 40 条通用事件、64 条地区事件、16 条世界事件；具有时间、身份、路线及前置条件。
- 1972 年生成人生阶段总结；结局和历次记录在浏览器本地保存。支持查看、删除和导出 JSON 档案。

## 文件与开发

- `1in8b-source/index.html`：本版中文入口，依次载入普通脚本，无需模块服务或构建工具。
- `1in8b-source/tno/data.js`：地区、路线与中文事件；`SOURCES.md` 记录资料基准与改编边界。
- `1in8b-source/tno/engine.js`：确定性随机、年度推进、事件条件、效果、结局和状态校验。也可通过 CommonJS 载入用于测试。
- `1in8b-source/tno/app.js`、`style.css`、`emblem.svg`：界面、本地存储和本地视觉资源。
- `1in8b-source/tno/tests/engine.test.cjs`：无依赖的 Node.js 行为测试。

运行测试（Node.js 18 或更新版本）：

```powershell
node --test 1in8b-source/tno/tests/engine.test.cjs
```

对外数据接口为 `TNO_DATA`，引擎接口为 `TNO_ENGINE.create / advance / choose / eligible / summary / validate`。引擎仅使用状态中的随机数生成器，JSON 往返保存后可继续相同的世界线。存档命名空间为 `tno.everyday.v1`，格式为 `{ version: 1, current, records }`。升级格式必须显式迁移版本，不能读取或覆盖原站存储键。

新增事件请使用唯一编号和合法地区/路线引用；生活事件需具有选项，世界事件需具有年份与来源说明。新增条件或效果时同步扩展引擎与行为测试。

## 资料与来源

背景参考 [The New Order Wiki](https://tno.wiki.gg/)，核对日期为 2026-10-21。Wiki 存在旧版玩法、当前背景和重做预告混杂；本作使用在[资料清单](1in8b-source/tno/SOURCES.md)中声明的中文改编连续性，不声称完整复现某个官方版本。人物与生活事件为原创，概率及属性为游戏设计参数。

原网站的 `original.html`、`assets/`、`capture.json`、`preview.jpg` 保留用于来源追溯。`capture.json` 描述原始抓取，不是当前 TNO 入口的文件校验。保存公开前端不代表获得其开源授权；本项目未擅自给上游内容添加许可证。本版无原站 API、支付或云端功能，与 TNO 团队、Paradox 和原站均无隶属关系。
