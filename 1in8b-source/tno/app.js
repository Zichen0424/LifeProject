/* 中文 TNO 界面。无网络请求，兼容 file:// 和静态服务器。 */
(() => {
  'use strict';
  const D = globalThis.TNO_DATA, E = globalThis.TNO_ENGINE, S = globalThis.TNO_SCENE;
  const main = document.getElementById('main');
  if (!D || !E || !S) { main.innerHTML = '<div class="empty-panel">游戏文件未完整加载。请确认 tno 目录与本页面一起保存，然后重新打开。</div>'; return; }
  const KEY = 'tno.everyday.v3';
  const labels = {health:'健康',money:'可用资金',education:'教育',family:'家庭关系',risk:'政治风险'};
  const names = {us:'美国',de:'德国',jp:'日本',cn:'中国',gd:'广东',tomsk:'托木斯克',omsk:'鄂木斯克',irkutsk:'伊尔库茨克'};
  const views = {life:'人生档案',world:'世界简报',archive:'历次人生',about:'设定与资料'};
  let state = null, records = [], view = 'life', registration = true, inspected = null, selected = 'random', seed = freshSeed(), timer = null, playing = false, storyDeferred = false, storageOkay = true;
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => Number(value || 0).toLocaleString('zh-CN', {maximumFractionDigits:2});
  const signed = value => `${value>0?'+':''}${number(value)}`;
  const date = s => `${s.year} 年 ${String(s.month || 1).padStart(2,'0')} 月`;
  const sameArchive = (a, b) => !!a && !!b && a.id === b.id && JSON.stringify(a) === JSON.stringify(b);
  const region = id => D.regions.find(r => r.id === id);
  function freshSeed() { const a = new Uint32Array(1); if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(a); else a[0] = Date.now() ^ Math.floor(Math.random()*4294967295); return '1962-' + a[0].toString(36).toUpperCase(); }
  function notice(text) { const n = document.getElementById('notice'); n.textContent = text; n.hidden = !text; }
  function storageFailure() { storageOkay = false; document.getElementById('save-status').textContent = '临时会话 · 无法写入存档'; notice('浏览器存储不可用或空间已满。你仍可游玩，但本次更改可能无法保留；请在关闭页面前导出档案备份。'); }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        const oldRaw = localStorage.getItem('tno.everyday.v2') || localStorage.getItem('tno.everyday.v1'); if (!oldRaw) return;
        const old = JSON.parse(oldRaw); if (!old || ![1,2].includes(old.version) || !Array.isArray(old.records)) return;
        const convert = value => { try { const next = E.migrate(value); return next && E.validate(next) ? next : null; } catch (_) { return null; } };
        state = old.current ? convert(old.current) : null;
        records = old.records.map(convert).filter(s => s && s.status === 'ended');
        if (state || records.length) { persist(); if(storageOkay)notice('旧档案已升级为生活纪事并另存至 v3，原 v1 / v2 存档仍保留。已有选择和投资继续生效。'); }
        else notice('检测到旧档案，但无法安全转换。原始存档仍保留，可以建立新的生活档案。');
        return;
      }
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== 3 || !Array.isArray(saved.records)) throw new Error('format');
      let invalid = false;
      if (saved.current && E.validate(saved.current)) state = saved.current; else if (saved.current) invalid = true;
      records = saved.records.filter(s => { const ok = E.validate(s) && s.status === 'ended'; if (!ok) invalid = true; return ok; });
      if (invalid) notice('检测到不兼容或损坏的档案，已跳过异常记录。原存储将在下一次有效保存时更新。');
    } catch (_) { notice('无法读取原有档案。你可以重新开始；损坏的记录不会作为游戏状态载入。'); }
  }
  function persist() {
    if (state?.status === 'ended') {
      const existing = records.findIndex(r => sameArchive(r, state));
      const copy = JSON.parse(JSON.stringify(state));
      if (existing < 0) records.unshift(copy); else records[existing] = copy;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify({version:3,current:state,records}));
      if (!storageOkay) { storageOkay = true; notice('存储已恢复，当前档案已保存。'); }
      document.getElementById('save-status').textContent = '档案已保存至此设备';
    } catch (_) { storageFailure(); }
  }
  function pauseClock() { if (timer) clearTimeout(timer); timer = null; }
  function stop() { pauseClock(); playing = false; }
  function routeName(key, id) { return D.routes[key]?.find(r => r.id === id)?.name || '尚未揭晓'; }
  function pageHead(kicker, title, text, extra='') { return `<div class="page-head"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${text}</p></div>${extra || '<div class="folio">民间人生档案<b>第 1962 / 001 号</b></div>'}</div>`; }
  function globe() { return `<svg class="orb" viewBox="0 0 420 420" aria-hidden="true"><defs><radialGradient id="glow"><stop stop-color="#829465" stop-opacity=".1"/><stop offset="1" stop-color="#829465" stop-opacity="0"/></radialGradient><clipPath id="sphere"><circle cx="210" cy="210" r="149"/></clipPath></defs><circle cx="210" cy="210" r="199" fill="url(#glow)" stroke="#768962" stroke-width=".6" stroke-dasharray="2 8"/><circle cx="210" cy="210" r="177" fill="none" stroke="#718561" stroke-width=".6"/><g fill="none" stroke="#8b9c74" stroke-width=".7"><circle cx="210" cy="210" r="149"/><ellipse cx="210" cy="210" rx="65" ry="149"/><ellipse cx="210" cy="210" rx="120" ry="149"/><g clip-path="url(#sphere)"><ellipse cx="210" cy="145" rx="149" ry="38"/><ellipse cx="210" cy="210" rx="149" ry="47"/><ellipse cx="210" cy="275" rx="149" ry="38"/><path d="M61 210h298M210 61v298"/></g><ellipse cx="210" cy="210" rx="202" ry="64" transform="rotate(-27 210 210)" stroke="#c0aa74"/><path d="M210 3v34M210 383v34M3 210h34M383 210h34"/></g><g fill="#c8b983"><circle cx="126" cy="141" r="4"/><circle cx="301" cy="185" r="4"/><circle cx="174" cy="302" r="3"/><circle cx="329" cy="91" r="3"/></g><g fill="none" stroke="#b2c08a" opacity=".5"><circle cx="126" cy="141" r="12"/><circle cx="301" cy="185" r="12"/><path d="m126 141 175 44-127 117Z" stroke-dasharray="3 5"/></g></svg>`; }
  function landing() {
    return pageHead('命运，从这里开始','世界的另一面，是你的一生。','1962 年。旧的战争已经结束，新的秩序仍在吞噬普通人的生活。') +
    (state ? `<div class="continue-strip"><div>你还有一份档案：${esc(state.person.name)}<small>${date(state)} · ${esc(names[state.person.region])} · ${state.status==='ended'?'已归档':'等待你的下一次选择'}</small></div><button class="secondary" data-action="continue">${state.status==='ended'?'查看结局':'继续这一生'} →</button></div>` : '') +
    `<div class="landing-grid"><section class="hero"><div class="hero-kicker">一段未被写进史书的人生</div><h2>芸芸众生，<br>你是其中之一。</h2><p class="subline">没有注定的英雄，也没有必然的明天。<br>在时代的裂隙里，留下自己的名字。</p>${globe()}<div class="hero-bottom"><p>三极冷战之下，<br>一封家书也有它的重量。</p><div class="number">1962<small>故事开始的年份</small></div></div><span class="cross">＋</span></section>
    <section class="register" aria-label="建立人生档案"><div class="panel-title">建立你的档案<small>出生于 1944 年</small></div><div class="field-label">起始地区<span>选择出身，或交给命运</span></div><div class="region-grid" role="group" aria-label="起始地区"><button class="region-btn random ${selected==='random'?'selected':''}" data-region="random" aria-pressed="${selected==='random'}">随机出身<span>↗</span></button>${D.regions.map(r=>`<button class="region-btn ${selected===r.id?'selected':''}" data-region="${r.id}" aria-pressed="${selected===r.id}">${names[r.id]}</button>`).join('')}</div><p class="region-description" id="region-description">${selected==='random'?'八个地区，八种生活。随机权重为游戏设定，不代表真实人口比例。':esc(region(selected).description)}</p><label class="field-label" for="seed">命运编号<span>同编号与地区可重现相同开局</span></label><div class="seed-row"><input id="seed" maxlength="64" value="${esc(seed)}" spellcheck="false" aria-label="命运编号"><button data-action="seed">换一个</button></div><button class="primary" data-action="start">开启这一生<span class="arrow">→</span></button><p class="register-foot">18 岁启程 · 120 个月 · 遇见另一种生活</p></section></div>
    <div class="facts-row"><div class="fact"><span class="fact-symbol">08</span><div><h3>不同出身，同样真实的渴望</h3><p>家庭、教育与阶层塑造你的起点</p></div></div><div class="fact"><span class="fact-symbol">10</span><div><h3>十年，足以改变一个人</h3><p>从 1962 年走向 1972 年</p></div></div><div class="fact"><span class="fact-symbol">∞</span><div><h3>大时代里的小选择</h3><p>世界走向随机，人生由你回应</p></div></div></div><div class="lower-caption"><span><b>档案说明</b>　背景参考 TNO，人物与生活事件为原创。</span><button class="action-link" data-view="about">了解这个世界 ↗</button></div>`;
  }
  function effects(choice) {
    const text = Object.entries(choice.effects || {}).filter(([k,v])=>labels[k]&&v).map(([k,v])=>`${labels[k]} ${signed(v)}${k==='money'?' 资金点':''}`);
    if(choice.job) text.push(`职业：${choice.job}`);
    if(choice.move) text.push(`迁往${names[choice.move]}`);
    return text.join(' · ') || '留下这段经历';
  }
  function identity(s, info) { return `<aside class="identity"><div class="profile-top"><div class="portrait" aria-hidden="true">${esc(s.person.name.slice(0,1))}</div><div><div class="person-name">${esc(s.person.name)}</div><div class="profile-sub">生于 1944 年 · ${s.age} 岁</div></div></div><dl class="data-list">${[['现居',names[s.person.region]],['出身',names[s.person.origin]],['职业',s.person.job],['阶层',s.person.className],['家庭',s.person.familyBackground],['环境',s.person.environment]].map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><div class="stats">${Object.entries(labels).map(([k,v])=>{ const description=info.stats[k]||{};return `<div class="stat ${k}"><div class="stat-line"><span>${v}</span><b>${number(s.stats[k])}${k==='money'?' 资金点':' / 100'}</b></div>${k==='money'?'':`<div class="stat-track" role="meter" aria-label="${v}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.stats[k]}"><div class="stat-fill" style="width:${s.stats[k]}%"></div></div>`}<div class="stat-grade">${esc(description.label)}</div><p class="stat-description">${esc(description.description)}</p></div>`;}).join('')}</div><button class="secondary" data-action="childhood">查阅童年档案 ↗</button><p class="identity-foot">命运编号：${esc(s.seed)}<br>资金点是虚构的相对购买力；其余量表为 0—100。</p></aside>`; }
  function log(entries) { const types = {world:'世界电报',life:'人生纪事',choice:'你的选择',system:'档案记录',finance:'月度账本',action:'月度行动',investment:'投资记录',incident:'生活遭遇'}; return `<div class="timeline">${entries.slice().reverse().map(h=>`<article class="log-entry ${h.type==='world'?'world':''}"><div class="log-meta">${h.year} 年${h.month?` ${String(h.month).padStart(2,'0')} 月`:''}${h.age!=null?' / '+h.age+' 岁':''}　·　${types[h.type]||'人生纪事'}</div><h3>${esc(h.title)}</h3><p>${esc(h.text)}</p></article>`).join('')}</div>`; }
  function ending(s) { const result = E.summary(s); return `<section class="end-card"><div class="eyebrow">${s.ending.reason==='death'?'人生终章':'十年档案 · 已封存'}</div><h2>${esc(result.title)}</h2><p>${esc(result.text)}</p><div class="end-grid"><div><h3>职业与生活</h3><p>${esc(result.career)}</p></div><div><h3>家人与牵挂</h3><p>${esc(result.family)}</p></div></div><p>${esc(result.outlook)}</p><p class="muted" style="margin-top:12px;font-size:10px">后续展望为原创叙事；模拟到此结束。</p><div class="end-buttons"><button class="primary" data-action="new">再遇见另一个自己 →</button><button class="secondary" data-action="export">导出人生档案</button></div></section>`; }
  function conditions(choice) {
    const terms = Object.entries(choice.requiresStats || {}).filter(([k])=>labels[k]).map(([k,v])=>`${labels[k]} ≥ ${number(v)}`);
    terms.push(...Object.entries(choice.maxStats || {}).filter(([k])=>labels[k]).map(([k,v])=>`${labels[k]} ≤ ${number(v)}`));
    if (choice.requiresFlags?.length) terms.push('需具备相关经历');
    if (choice.excludesFlags?.length) terms.push('此前的相关选择可能关闭此路');
    return terms.join(' · ');
  }
  function eventCard(s, event, readonly) {
    return `<section class="event-card" aria-labelledby="story-title"><div class="event-label"><span>${event.category==='regional'?'地区抉择':'人生抉择'} / ${date(s)}</span><span>你可以怎样回应</span></div><h2 id="story-title" tabindex="-1">${esc(event.title)}</h2><p class="event-text">${esc(event.text)}</p><div class="choices">${event.choices.map((c,i)=>{ const status=E.choiceStatus(s,i); const required=conditions(c); return `<button class="choice" data-choice="${i}" ${readonly||!status.available?'disabled':''} ${!status.available?`title="${esc(status.reason)}"`:''}><span class="choice-index">${String(i+1).padStart(2,'0')}</span><span class="choice-body"><span>${esc(c.label)}</span><span class="choice-effect">${esc(effects(c))}</span>${required?`<span class="choice-condition">条件：${esc(required)}</span>`:''}${c.consequence?`<span class="choice-consequence">后续：${esc(c.consequence)}</span>`:''}${!status.available?`<span class="choice-blocked">暂不可选 · ${esc(status.reason)}</span>`:''}</span><span class="choice-arrow">↗</span></button>`;}).join('')}</div></section>`;
  }
  function finances(s, info) {
    const report=s.finance.lastReport;
    const changes=report?Object.entries(report.changes || {}).filter(([k,v])=>labels[k]&&v).map(([k,v])=>`<span>${labels[k]} <b>${signed(v)}</b></span>`).join(''):'';
    return `<section class="finance-panel" aria-labelledby="finance-title"><div class="panel-heading"><h2 id="finance-title">生活账本</h2><span>资金点 · 虚构购买力</span></div><div class="account-grid"><div><small>可用资金</small><b>${number(s.stats.money)}</b></div><div><small>投资市值</small><b>${number(info.invested)}</b></div><div><small>总资产</small><b>${number(info.netWorth)}</b></div></div><div class="budget-row"><span>预计月收入 <b>+${number(info.income)}</b></span><span>预计生活开支 <b>−${number(info.expenses)}</b></span><span>预计生活结余 <b>${signed(info.balance)}</b></span></div>${info.modifiers.length?`<ul class="modifier-list">${info.modifiers.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}<details class="month-report" ${report?'open':''}><summary>${report?`${date(report)} · 月结`:'月结说明'}${report?`<span>可用资金 ${signed(report.delta)}</span>`:''}</summary>${report?`<div class="report-lines"><span>收入 +${number(report.income)}</span><span>生活开支 −${number(report.expenses)}</span><span>投资现金收益 ${signed(report.investment)}</span><span>持仓市值变化 ${signed(report.marketChange)}</span></div>${changes?`<div class="report-changes">${changes}</div>`:''}${(report.notes||[]).map(t=>`<p>${esc(t)}</p>`).join('')}`:'<p>进入下个月时结算收入、生活开支与投资。选择和行动带来的即时变化会写入人生记录。</p>'}</details></section>`;
  }
  function monthlyActions(s, info, readonly) {
    return `<section class="actions-panel" aria-labelledby="actions-title"><div class="panel-heading"><h2 id="actions-title">安排这个月</h2><span>${readonly?'档案已封存':`剩余 ${info.actionsRemaining} / 2 次行动`}</span></div><p class="panel-explainer">每月可安排两次行动，买卖投资也各占一次。事件选择不占行动；未用次数不结转。</p><div class="monthly-actions">${['work','study','rest','family','caution'].map(id=>{const a=E.actionStatus(s,id);return `<button class="month-action" data-life-action="${id}" ${readonly||!a.available?'disabled':''} title="${esc(!a.available?a.reason:a.description)}"><span class="action-top"><b>${esc(a.label)}</b><small>${a.cost?`${number(a.cost)} 资金点`:'无需资金'}</small></span><span class="action-description">${esc(a.description)}</span>${!readonly&&!a.available?`<span class="choice-blocked">${esc(a.reason)}</span>`:''}</button>`;}).join('')}</div></section>`;
  }
  function investments(s, info, readonly) {
    return `<section class="investments-panel" aria-labelledby="investment-title"><div class="panel-heading"><h2 id="investment-title">投资与储蓄</h2><span>每笔交易使用 1 次行动</span></div><p class="panel-explainer">买入后，资金转为持仓；卖出按当月价格收回资金。报价与收益随月份和局势变化。</p><div class="investment-list">${info.assets.map(asset=>{const buy=E.tradeStatus(s,asset.id,'buy',1),sell=E.tradeStatus(s,asset.id,'sell',1);return `<article class="investment-card"><div class="investment-top"><h3>${esc(asset.name)}</h3><span class="risk-label">${esc(asset.risk)}风险</span></div><p>${esc(asset.description)}</p><dl class="asset-data"><div><dt>每份价格</dt><dd>${number(asset.price)}</dd></div><div><dt>持有份数</dt><dd>${number(asset.owned)}</dd></div><div><dt>持仓市值</dt><dd>${number(asset.value)}</dd></div></dl><div class="trade-buttons"><button class="secondary" data-trade="${esc(asset.id)}" data-side="buy" ${readonly||!buy.available?'disabled':''} title="${esc(readonly?'档案已封存':buy.reason||`使用 ${number(asset.price)} 资金点买入一份`)}" aria-label="买入一份${esc(asset.name)}">买入 1 份</button><button class="secondary" data-trade="${esc(asset.id)}" data-side="sell" ${readonly||!sell.available?'disabled':''} title="${esc(readonly?'档案已封存':sell.reason||`卖出一份获得 ${number(asset.price)} 资金点`)}" aria-label="卖出一份${esc(asset.name)}">卖出 1 份</button></div>${!readonly&&(!buy.available||!sell.available)?`<div class="trade-reasons">${!buy.available?`<span>买入：${esc(buy.reason)}</span>`:''}${!sell.available?`<span>卖出：${esc(sell.reason)}</span>`:''}</div>`:''}</article>`;}).join('')}</div></section>`;
  }
  function life(s, readonly=false) {
    const info=E.inspect(s), locked=readonly||s.status==='ended', unread=E.notice(s), latest=s.world.news.at(-1);
    const stats=Object.entries(labels).map(([k,label])=>`<span><small>${label}</small><b>${number(s.stats[k])}${k==='money'?'':'<i>/100</i>'}</b></span>`).join('');
    return pageHead('芸芸众生 · 生活纪事','日子还在继续',`${esc(names[s.person.region])} · ${esc(s.person.name)} · ${esc(s.person.job)}`, `<button class="secondary" data-action="${readonly?'back-archive':'new'}">${readonly?'返回档案室':'另一个人生'}</button>`) +
    `<div class="life-stage"><div class="year-banner"><div class="year-big">${s.year}<span class="month-big"> / ${String(s.month).padStart(2,'0')} 月</span><small>${s.age} 岁 · ${s.status==='ended'?'档案已封存':`已度过 ${s.elapsedMonths} / 120 个月`}</small></div>${!locked?`<div class="year-actions"><button class="secondary" data-action="auto" ${s.pending?'disabled':''}>${playing?'暂停时间':'让时间流逝'}</button><button class="primary" data-action="advance" ${s.pending||unread?'disabled':''}>下个月 →</button></div>`:''}</div>${S.render(s)}<div class="scene-stats">${stats}</div>
    ${latest?`<div class="news-wire"><span class="wire-label">世界电报</span><span>${esc(latest.title)}</span><button class="action-link" data-action="replay-news">重读通报 ↗</button></div>`:'<div class="news-wire"><span class="wire-label">收音机</span><span>远处的电台还在播送，你的生活也在继续。</span></div>'}
    ${!locked&&s.pending?'<div class="pending-strip"><span>有一件事，想听听你的决定。</span><button class="secondary" data-action="open-story">回到这个决定 →</button></div>':!locked?`<p class="month-breath">${unread?'有一则新的见闻等待阅读。':'这个月可以安排自己的生活，也可以让时间继续。'}</p>`:''}</div>
    ${s.status==='ended'?ending(s):''}
    <div class="dashboard"><details class="identity-fold"><summary>人物与数值详情 <span>${esc(s.person.name)} · ${s.age} 岁</span></summary>${identity(s,info)}</details><div class="life-main"><details class="daily-plans" open><summary>安排生活 <span>本月剩余 ${info.actionsRemaining} 次行动</span></summary>${monthlyActions(s,info,locked)}</details><details class="daily-plans"><summary>收支与投资 <span>可用 ${number(s.stats.money)} · 总资产 ${number(info.netWorth)}</span></summary>${finances(s,info)}${investments(s,info,locked)}</details><div class="log-head">生命的痕迹<span>${s.history.length} 条记录 · 最近在前</span></div>${log(s.history)}</div></div>`;
  }
  function world() {
    const s=state;
    const bloc = {us:'自由国家组织',de:'统一协定',jp:'大东亚共荣圈',ru:'俄罗斯诸政权'};
    const baseline = {us:'美国在战败阴影与国内改革的争论中，维持自由国家组织的影响。',de:'德国支配欧洲的大片地区，继承问题与社会矛盾使秩序承受压力。',jp:'日本主导东亚的共荣圈，产业扩张与殖民秩序塑造着无数人的生活。',ru:'旧苏联崩溃后，分裂的俄罗斯仍在寻找统一的道路。'};
    return pageHead('时代的噪声','世界简报',s?`${date(s)} · 远方的新闻，迟早会来到你的门前。`:'1962 年 01 月 · 在选择人生之前，先看看这个世界。') +
    `<div class="brief-grid">${Object.entries(bloc).map(([k,v])=>{ const revealed=s&&s.world.news.some(n=>{ const ev=D.worldEvents.find(e=>e.id===n.id);return ev?.route?.key===k; }); const r=s&&D.routes[k].find(x=>x.id===s.world.routes[k]); return `<section class="brief"><div class="route-label">${v}</div><h2>${k==='ru'?'破碎的俄罗斯':names[k]}</h2><p>${revealed?esc(r.description):baseline[k]}</p><div class="brief-foot">${revealed?'已显现的走向：'+esc(r.name):'历史尚未写定 · 路线将在事件发生时显现'}</div></section>`; }).join('')}</div><section class="news-section"><div class="log-head">已收到的电报<span>背景与路线经过叙事压缩</span></div>${s?.world.news.length?log(s.world.news.map(n=>({...n,type:'world'}))):'<div class="empty-panel">尚无新的电报。开启人生，新闻会随月份进入档案。</div>'}</section>`;
  }
  function archive() { return pageHead('把名字留在这里','历次人生',`${records.length} 份封存档案 · 每次抵达结局，人生都会自动保存。`,records.length?'<button class="secondary danger" data-action="clear">删除全部记录</button>':'') + (records.length?records.map((s,i)=>`<article class="archive-card"><div class="archive-year">${s.year}<small>${String(s.month).padStart(2,'0')} 月 · ${s.age} 岁</small></div><div><h2>${esc(s.person.name)}</h2><p>${esc(names[s.person.region])} · ${esc(s.person.job)} · ${esc(s.ending.title)}</p></div><div class="archive-actions"><button class="secondary" data-record="${i}">查阅档案</button><button class="secondary danger" data-delete="${i}" aria-label="删除${esc(s.person.name)}的档案">删除</button></div></article>`).join(''):'<div class="empty-panel">这里还没有封存的人生。<br>走过十年，或抵达人生的终点，你的故事就会留在这里。</div>'); }
  function about() { return pageHead('关于这份档案','设定与资料','在虚构的年代里，认真书写普通人的生活。') + `<article class="article"><h2>这是怎样的游戏？</h2><p>你生于 1944 年，在 1962 年以 18 岁青年身份进入故事。从 1962 年 1 月开始，逐月经历生活与世界变化，在 120 个月里走过教育、工作、家庭与时代变化，于 1972 年 1 月结算；若健康降至零，人生会提前结束。每月可安排两次行动，在加班、进修、休养、家人与谨慎行事之间分配精力，也能把行动用于储蓄和投资。世界重大消息和普通个人遭遇以独立弹窗通报，阅读即可继续；随机出现的重要决定需要回应，也可以先查看生活、安排资金后再决定。</p><h2>数值怎样改变生活？</h2><p>可用资金以“资金点”表示虚构的相对购买力，没有 100 点上限；生活开支、课程、事件和投资都会实际消耗资金。健康、教育、家庭关系与政治风险为 0—100 量表，会改变收入、日常成本、可选行动及事件条件。档案左侧会显示每项数值的当前等级和具体作用，生活账本展示预计收支与上次月结。选项下方标出即时变化、条件与后续线索。</p><h2>投资怎样进行？</h2><p>可买卖储蓄、债券与产业份额。每次交易一份，使用一次月度行动；投资按当月价格计算市值。报价与现金收益会随月份和世界局势变化，卖出才把持仓换回可用资金。总资产为可用资金与投资市值之和。</p><h2>世界不是由一个人决定的</h2><p>美国、德国、日本各有两条政策方向，俄罗斯有三类统一走向。每局在开局时确定世界路线，使用相同命运编号、相同地区和相同选择，可以重现经历。普通人的选择改变个人生活，不直接左右国家领导人与战争结局。</p><h2>资料边界与创作说明</h2><p>背景参考《钢铁雄心4》模组 The New Order。Wiki 的国家背景、旧版玩法和重做预告并不总属于同一版本。本作采用明确标注的中文改编连续性：1962 年地区背景为基底，政策路线和日期经过压缩，人物、家庭及生活事件为原创；不声称完整复现任一官方版本。日本政策分支尤其是依据派系背景创作的情景，不是官方可选路线说明。</p><p style="margin-top:12px">资料核对日期：2026 年 10 月 21 日。部分页面直接访问受限，参考其公开搜索索引。各条资料的使用范围与路线对应见<a href="tno/SOURCES.md" target="_blank" rel="noopener">完整资料清单</a>。</p><h2>存档属于你</h2><p>游戏完全在浏览器内运行，不发送数据，不依赖原站服务。档案保存在本设备、本浏览器的独立存储中，不与原版记录混用。清除浏览器数据或更换地址会使档案不可见。可在结局导出档案；临时会话中也可使用下方按钮备份。</p><button class="secondary" style="margin-top:15px" data-action="export-all">导出全部档案备份</button><h2>参考资料</h2><ul class="source-list">${D.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a><small>${esc(s.note)}</small></li>`).join('')}</ul><h2>作品与原始存档</h2><p>本作是非官方同人人生模拟网页，与 TNO 团队、Paradox 及原网站无隶属关系。沿用“随机出身—人生推进—选择事件—人生总结”的设计基底，本版模拟引擎、界面及中文生活事件独立实现。原网站公开前端保留于 original.html 与 assets 目录供溯源，其授权不因存档而改变。原站品牌、在线接口与现代统计不用于本版游戏。</p></article>`; }
  function render() {
    document.querySelectorAll('.nav-item').forEach(n=>{const active=n.dataset.view===view;n.classList.toggle('active',active); if(active)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');});
    document.getElementById('view-label').textContent=views[view];
    main.innerHTML=view==='world'?world():view==='archive'?archive():view==='about'?about():inspected?life(inspected,true):registration||!state?landing():life(state);
    main.classList.remove('fade-in'); void main.offsetWidth; main.classList.add('fade-in');
    syncStory();scheduleClock();
  }
  function navigate(v) { stop();document.getElementById('modal').close();view=v;inspected=null;render();main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'}); }
  function modal(title, body, confirmLabel, callback) {
    stop(); const dialog=document.getElementById('modal');
    document.getElementById('modal-content').innerHTML=`<h2 id="modal-title">${esc(title)}</h2>${body}<div class="dialog-actions">${confirmLabel?'<button class="secondary" id="modal-cancel">取消</button>':''}<button class="${confirmLabel?'primary':'secondary'}" id="modal-confirm">${confirmLabel||'返回档案'}</button></div>`;
    document.getElementById('modal-cancel')?.addEventListener('click',()=>dialog.close());
    document.getElementById('modal-confirm').addEventListener('click',()=>{dialog.close();if(callback)callback();});
    dialog.showModal();
  }
  function start() {
    seed = (document.getElementById('seed')?.value || '').trim() || freshSeed();
    const run=()=>{stop();storyDeferred=false;notice('');state=E.create({region:selected,seed});inspected=null;registration=false;persist();render();window.scrollTo({top:0,behavior:'instant'});};
    if(state?.status==='active') modal('重新开始这一生？','<p>当前未完成的人生将被替换，已封存的人生仍会保留。</p>','建立新档案',run);else run();
  }
  function scheduleClock() {
    if(!playing||timer||document.hidden||!state||state.status!=='active'||state.pending||E.notice(state)||view!=='life'||registration||inspected)return;
    timer=setTimeout(()=>{timer=null;advance(true);},1600);
  }
  function advance(automatic=false) {
    if(!state||state.pending||E.notice(state)||state.status!=='active')return;
    if(!automatic)stop();
    notice('');storyDeferred=false;E.advance(state);
    if(state.pending||state.status==='ended')stop();
    persist();render();
  }
  function auto() {
    if(playing){stop();render();return;}
    if(!state||state.pending||state.status==='ended')return;
    playing=true;render();
  }
  function syncStory() {
    const dialog=document.getElementById('story-modal');
    if(!state||registration||view!=='life'||inspected||document.getElementById('modal').open){dialog.close();return;}
    const item=E.notice(state), pending=E.event(state);
    if(item){
      pauseClock();
      dialog.className=`story-dialog ${item.type==='world'?'world-bulletin':'personal-bulletin'}`;
      const impact=Object.entries(item.changes).filter(([k,v])=>labels[k]&&v).map(([k,v])=>`<span>${labels[k]} ${signed(v)}</span>`).join('');
      document.getElementById('story-content').innerHTML=`<div class="bulletin-masthead"><span>${item.type==='world'?'世界重大事件':'生活中的一件事'}</span><span>${date(item)}</span></div><div class="bulletin-symbol" aria-hidden="true">${item.type==='world'?'◉':'✦'}</div><p class="bulletin-kicker">${item.type==='world'?'来自广播与报纸的消息':'你身边发生的事'}</p><h2 id="story-title">${esc(item.title)}</h2><p class="bulletin-text">${esc(item.text)}</p><div class="bulletin-impact">${impact||'<span>这段见闻已记入人生档案</span>'}</div><div class="bulletin-footer"><span>${item.type==='world'?'时代改变着生活。':'有些日子，只需要被记住。'}</span><button class="primary" data-action="ack-story">${state.inbox.length>1?'下一则消息 →':playing?'继续时间 →':'继续生活 →'}</button></div>`;
    }else if(pending&&!storyDeferred){
      dialog.className='story-dialog decision-bulletin';
      document.getElementById('story-content').innerHTML=eventCard(state,pending,false)+'<div class="decision-footer"><span>只有此处需要你的决定；事件选择不消耗行动。</span><button class="action-link" data-action="defer-story">先看看自己的生活</button></div>';
    }else{dialog.close();return;}
    if(!dialog.open)dialog.showModal();
  }
  function dismissStory() {
    if(!state||!E.notice(state))return;
    E.dismiss(state);storyDeferred=false;persist();render();
  }
  function deferStory() { stop();storyDeferred=true;document.getElementById('story-modal').close();render(); }
  function showPlace(place) {
    const s=inspected||state;if(!s)return;
    const m=S.model(s), locked=!!inspected||s.status==='ended';
    const actionButtons=ids=>locked?'':`<div class="place-actions">${ids.map(id=>{const a=E.actionStatus(s,id);return `<button class="secondary" data-life-action="${id}" ${a.available?'':'disabled'}>${esc(a.label)}${a.cost?` · ${a.cost} 资金点`:''}</button>`;}).join('')}</div>`;
    if(place==='home')modal('回到家里',`<p>${esc(s.person.environment)}。${m.home==='worn'?'屋子有些破旧，但这里仍是一天结束时可以回来歇脚的地方。':m.home==='improved'?'住处修整过了，窗边也多了一点生活的余地。':'熟悉的杯子放在桌上，窗外传来街坊走动的声音。'}${s.stats.family>=65?'家人愿意分担日常，饭桌边也有人等你。':'最近各自忙碌，可以找些时间陪陪重要的人。'}</p>${actionButtons(['rest','family'])}`);
    if(place==='work')modal(s.person.job+'的一天',`<p>你目前以${esc(s.person.job)}的身份生活。${s.stats.education>=60?'熟练的知识已经为你带来额外收入。':'工作和学习都需要慢慢积累。'}${s.stats.health<30?'身体正在拖慢脚步，休养也许比再接一班更迫切。':'明天仍要照常出门，今天的时间可以由你安排。'}</p>${actionButtons(['work','study'])}`);
    if(place==='street'){
      const recent=s.history.slice().reverse().find(h=>h.type==='incident');
      modal('街坊近况',`<p>${recent?esc(recent.text):'有人买菜，有人赶车，街角的小摊正在收起遮阳布。还没有新的见闻传到你这里。'}</p>${actionButtons(['family','caution'])}`);
    }
    if(place==='radio'){
      const latest=s.world.news.at(-1);
      modal(latest?latest.title:'街头的收音机',`<p>${latest?esc(latest.text):'广播夹着沙沙的杂音，电台正在播送天气和音乐。等到重大消息抵达时，你会收到一份单独的通报。'}</p><button class="secondary" data-view="world">查阅世界简报 ↗</button>`);
    }
  }
  function download(value, filename) { const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000); }
  function changeSummary(before, after) { return Object.entries(labels).filter(([key])=>Math.abs(after[key]-before[key])>0.001).map(([key,label])=>`${label} ${signed(after[key]-before[key])}${key==='money'?' 资金点':''}`).join(' · ') || '经历已写入档案'; }
  document.addEventListener('click',event=>{
    const b=event.target.closest('button,a.brand');if(!b||b.disabled)return;
    if(b.matches('a.brand')){event.preventDefault();stop();view='life';registration=true;inspected=null;render();return;}
    if(b.dataset.view){navigate(b.dataset.view);return;}
    if(b.dataset.scenePlace){showPlace(b.dataset.scenePlace);return;}
    if(b.dataset.region){selected=b.dataset.region;seed=document.getElementById('seed').value;render();return;}
    if(b.dataset.choice!==undefined){stop();if(!state||!state.pending||inspected||state.status!=='active')return;document.getElementById('story-modal').close();storyDeferred=false;const index=Number(b.dataset.choice),status=E.choiceStatus(state,index);if(!status.available){notice(status.reason);return;}const before={...state.stats};E.choose(state,index);persist();render();if(storageOkay)notice(`选择已记录：${changeSummary(before,state.stats)}。${state.pending?'还有一个决定等待回应。':''}`);return;}
    if(b.dataset.lifeAction){stop();document.getElementById('modal').close();if(!state||inspected||state.status!=='active')return;const status=E.actionStatus(state,b.dataset.lifeAction);if(!status.available){notice(status.reason);return;}const before={...state.stats};E.act(state,b.dataset.lifeAction);persist();render();if(storageOkay)notice(`${status.label}：${changeSummary(before,state.stats)}。`);return;}
    if(b.dataset.trade){stop();if(!state||inspected||state.status!=='active')return;const side=b.dataset.side,status=E.tradeStatus(state,b.dataset.trade,side,1);if(!status.available){notice(status.reason);return;}const asset=E.inspect(state).assets.find(a=>a.id===b.dataset.trade);E.trade(state,b.dataset.trade,side,1);persist();render();if(storageOkay)notice(`${side==='buy'?'已买入':'已卖出'} 1 份${asset.name}，成交价 ${number(asset.price)} 资金点；本月剩余 ${E.inspect(state).actionsRemaining} 次行动。`);return;}
    if(b.dataset.record!==undefined){inspected=records[Number(b.dataset.record)];view='life';render();window.scrollTo({top:0,behavior:'instant'});return;}
    if(b.dataset.delete!==undefined){const target=records[Number(b.dataset.delete)];modal('删除这份档案？',`<p>将删除 ${esc(target.person.name)} 的人生记录，此操作无法撤销。</p>`,'删除档案',()=>{records=records.filter(r=>r!==target);if(sameArchive(state,target)){state=null;registration=true;}persist();render();});return;}
    const action=b.dataset.action;
    if(action==='ack-story'){dismissStory();return;}
    if(action==='defer-story'){deferStory();return;}
    if(action==='open-story'){storyDeferred=false;syncStory();return;}
    if(action==='replay-news'){showPlace('radio');return;}
    if(action==='seed'){seed=freshSeed();document.getElementById('seed').value=seed;}
    if(action==='start')start();
    if(action==='continue'){registration=false;navigate('life');}
    if(action==='new'){stop();registration=true;inspected=null;selected='random';seed=freshSeed();navigate('life');}
    if(action==='advance'){stop();advance();}
    if(action==='auto')auto();
    if(action==='back-archive')navigate('archive');
    if(action==='childhood'){const s=inspected||state;modal('童年档案 · 1944—1962',`<p>${esc(s.person.name)} 出生于${esc(names[s.person.origin])}。</p><ul class="dialog-list">${s.person.childhood.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><p>十八岁那年，你带着这些记忆走向了外面的世界。</p>`);}
    if(action==='export'){const s=inspected||state;if(s)download({version:3,state:s,summary:E.summary(s)},`人生档案-${s.year}-${String(s.month).padStart(2,'0')}-${s.person.name}.json`);}
    if(action==='export-all')download({version:3,current:state,records},'芸芸众生-月度档案备份.json');
    if(action==='clear')modal('删除全部封存记录？','<p>全部已封存的人生将被删除，正在进行的人生仍会保留。此操作无法撤销。</p>','删除全部记录',()=>{records=[];if(state?.status==='ended'){state=null;registration=true;}persist();render();});
  });
  document.getElementById('soundless-help').addEventListener('click',()=>navigate('about'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(!registration&&view==='life')render();}});
  window.addEventListener('pagehide',stop);
  document.getElementById('story-modal').addEventListener('cancel',event=>{event.preventDefault();if(state&&E.notice(state))dismissStory();else deferStory();});
  load();render();
})();
