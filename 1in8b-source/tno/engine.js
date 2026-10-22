(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TNO_ENGINE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  var VERSION = 3, START_YEAR = 1962, END_YEAR = 1972, BIRTH_YEAR = 1944;
  var STAT_KEYS = ['health', 'money', 'education', 'family', 'risk'], ROUTE_KEYS = ['us', 'de', 'jp', 'ru'];
  var ASSETS = [
    { id:'savings', name:'互助储蓄', price:5, risk:'低', description:'每份5资金点，价格固定，每月每份付息0.01，可随时赎回。' },
    { id:'bonds', name:'地方建设债券', price:8, risk:'中', description:'每月每份付息0.02，价格小幅波动；卖出时可能亏损。' },
    { id:'industry', name:'工业企业股份', price:10, risk:'高', description:'没有固定分红，价格每月涨跌；银行与燃料危机会造成额外损失。' }
  ];
  var ACTIONS = {
    work:{label:'接一份零工',cost:0,description:'资金 +7、健康 −4、家庭 −1；健康至少25。',effects:{money:7,health:-4,family:-1},requiresStats:{health:25}},
    study:{label:'进修与自学',cost:4,description:'花费4资金点，教育 +4、健康 −0.5；教育达35 / 60后月收入增加。',effects:{money:-4,education:4,health:-0.5}},
    rest:{label:'就医与休养',cost:6,description:'花费6资金点，健康 +8；健康低于30会增加医疗费并减少工资。',effects:{money:-6,health:8}},
    family:{label:'陪伴与互助',cost:2,description:'花费2资金点，家庭 +6、健康 +1；家庭达65可分担月开支。',effects:{money:-2,family:6,health:1}},
    caution:{label:'整理证件与避险',cost:1,description:'花费1资金点，政治风险 −7；风险达70会减少收入并增加盘查概率。',effects:{money:-1,risk:-7}}
  };
  var BACKGROUNDS = [
    {family:'工人家庭',className:'靠工资生活的普通家庭',money:-4,education:0},
    {family:'小职员家庭',className:'略有积蓄的普通家庭',money:5,education:5},
    {family:'农户家庭',className:'依靠土地与零工的家庭',money:-7,education:-4},
    {family:'手工业者家庭',className:'收入时有起落的家庭',money:2,education:0},
    {family:'教师家庭',className:'收入有限的知识家庭',money:0,education:9},
    {family:'失业者家庭',className:'需要相互接济的家庭',money:-10,education:-3}
  ];
  function data() {
    var d = root.TNO_DATA;
    if (!d || !Array.isArray(d.regions) || !d.routes || !Array.isArray(d.events) || !Array.isArray(d.worldEvents)) throw new Error('人生档案资料未载入。');
    return d;
  }
  function hash(v) { var r=2166136261; for(var i=0;i<v.length;i++){r^=v.charCodeAt(i);r=Math.imul(r,16777619);}return(r>>>0)||2654435769; }
  // Every random outcome, including market prices, uses this persisted generator.
  function random(s) { var v=s.rng>>>0;v^=v<<13;v^=v>>>17;v^=v<<5;s.rng=v>>>0;return s.rng/4294967296; }
  function integer(s,a,b){return a+Math.floor(random(s)*(b-a+1));}
  function pick(s,list){return list[Math.floor(random(s)*list.length)];}
  function round(n){return Math.round((n+Number.EPSILON)*100)/100;}
  function regionById(id){return data().regions.find(function(r){return r.id===id;});}
  function eventById(id){return data().events.find(function(e){return e.id===id;});}
  function event(s){return eventById(s.pending)||null;}
  function notice(s){return s.inbox[0]||null;}
  function dismiss(s){if(s.inbox.length)s.inbox.shift();return s;}
  function enqueue(s,type,id,title,text,changes){
    s.inbox.push({id:type+'-'+s.elapsedMonths+'-'+id,type:type,eventId:id,year:s.year,month:s.month,title:title,text:text,changes:changes||{}});
  }
  function regionName(id){var r=regionById(id);return r?r.name:id;}
  function addUnique(list,values){(values||[]).forEach(function(v){if(list.indexOf(v)===-1)list.push(v);});}
  function effects(s,changes){STAT_KEYS.forEach(function(k){if(changes&&Number.isFinite(changes[k]))s.stats[k]=round(Math.max(0,Math.min(k==='money'?1000000000:100,s.stats[k]+changes[k])));});}
  function deltas(a,b){var d={};STAT_KEYS.forEach(function(k){d[k]=round(b[k]-a[k]);});return d;}
  function record(s,type,title,text,changes){var h={year:s.year,month:s.month,age:s.age,type:type,title:title,text:text};if(changes)h.changes=changes;s.history.push(h);}
  function routeMatches(e,s){return !e.route||s.world.routes[e.route.key]===e.route.id;}
  function flags(s){return s.flags.concat(s.world.flags);}
  function eligible(e,s){
    if(!e||!s||!s.person||!s.world||!Array.isArray(s.seen))return false;
    if(s.seen.indexOf(e.id)!==-1&&(!e.repeatAfterMonths||s.elapsedMonths-(s.incidentDates[e.id]===undefined?s.elapsedMonths:s.incidentDates[e.id])<e.repeatAfterMonths))return false;
    if(e.region&&e.region!==s.person.region||e.category==='incident'&&e.regions&&e.regions.indexOf(s.person.region)===-1||e.months&&e.months.indexOf(s.month)===-1)return false;
    if(e.year!==undefined&&e.year!==s.year||e.month!==undefined&&e.month!==s.month)return false;
    if(e.minAge!==undefined&&s.age<e.minAge||e.maxAge!==undefined&&s.age>e.maxAge)return false;
    if(e.minYear!==undefined&&s.year<e.minYear||e.maxYear!==undefined&&s.year>e.maxYear)return false;
    if(e.minMonth!==undefined&&(e.minYear===undefined||s.year===e.minYear)&&s.month<e.minMonth)return false;
    if(e.maxMonth!==undefined&&(e.maxYear===undefined||s.year===e.maxYear)&&s.month>e.maxMonth)return false;
    if(e.jobs&&e.jobs.indexOf(s.person.job)===-1||!routeMatches(e,s))return false;
    var all=flags(s);
    if(e.requires&&!e.requires.every(function(f){return all.indexOf(f)!==-1;}))return false;
    if(e.excludes&&e.excludes.some(function(f){return all.indexOf(f)!==-1;}))return false;
    if(e.requiresStats&&Object.keys(e.requiresStats).some(function(k){return s.stats[k]<e.requiresStats[k];}))return false;
    return true;
  }
  function choiceCheck(s,c){
    if(!c)return{available:false,reason:'选项不存在。'};
    if(s.status!=='active'||s.stats.health<=0)return{available:false,reason:'这份人生已封存。'};
    var labels={health:'健康',money:'资金',education:'教育',family:'家庭关系',risk:'政治风险'},keys=Object.keys(c.requiresStats||{});
    for(var i=0;i<keys.length;i++)if(s.stats[keys[i]]<c.requiresStats[keys[i]])return{available:false,reason:labels[keys[i]]+'需达到 '+c.requiresStats[keys[i]]+'。'};
    keys=Object.keys(c.maxStats||{});
    for(var j=0;j<keys.length;j++)if(s.stats[keys[j]]>c.maxStats[keys[j]])return{available:false,reason:labels[keys[j]]+'需不高于 '+c.maxStats[keys[j]]+'。'};
    if(c.requiresFlags&&!c.requiresFlags.every(function(f){return flags(s).indexOf(f)!==-1;}))return{available:false,reason:'需要先完成相关经历。'};
    if(c.excludesFlags&&c.excludesFlags.some(function(f){return flags(s).indexOf(f)!==-1;}))return{available:false,reason:'此前的选择已关闭这条路径。'};
    if(c.effects&&c.effects.money<0&&s.stats.money< -c.effects.money)return{available:false,reason:'需要 '+ -c.effects.money+' 资金点；可先做零工或赎回投资。'};
    return{available:true,reason:''};
  }
  function choiceStatus(s,index){var e=event(s);return choiceCheck(s,e&&Number.isInteger(index)&&e.choices[index]);}
  function openMonth(s){
    s.finance.actionsUsed=0;s.pending=null;s.phase='done';
    var available=data().events.filter(function(e){return eligible(e,s)&&e.choices.some(function(c){return choiceCheck(s,c).available;})&&(!e.requires||e.requires.every(function(f){return s.flagDates[f]===undefined||s.flagDates[f]<s.elapsedMonths;}));});
    var followups=available.filter(function(e){return e.requires&&e.requires.length;}),pool;
    // A dated story is an opportunity, not a compulsory monthly questionnaire.
    if(followups.length&&random(s)<0.7)pool=followups;
    else if(s.elapsedMonths>0&&random(s)<0.28){
      var dated=available.filter(function(e){return e.category==='monthly';}),regional=available.filter(function(e){return e.category==='regional';});
      pool=dated.length&&random(s)<0.55?dated:regional.length&&random(s)<0.55?regional:available;
    }
    if(pool&&pool.length){s.pending=pick(s,pool).id;s.phase='extra';return;}
    if(s.elapsedMonths===0||random(s)<0.82){
      var incidents=(data().incidents||[]).filter(function(e){return eligible(e,s);});
      if(!incidents.length)return;
      var local=incidents.filter(function(e){return e.region===s.person.region;});
      var e=pick(s,local.length&&random(s)<0.35?local:incidents),before=Object.assign({},s.stats);
      effects(s,e.effects);addUnique(s.seen,[e.id]);s.incidentDates[e.id]=s.elapsedMonths;
      var changes=deltas(before,s.stats);
      record(s,'incident',e.title,e.text,changes);enqueue(s,'personal',e.id,e.title,e.text,changes);
      if(s.stats.health<=0)finish(s,'death');
    }
  }
  function applyWorldEvents(s){
    var list=data().worldEvents;
    for(var i=0;i<list.length;i++){
      var e=list[i];if(!eligible(e,s)||e.month===undefined&&s.month!==1)continue;
      s.seen.push(e.id);s.world.news.push({id:e.id,year:s.year,month:s.month,title:e.title,text:e.text});addUnique(s.world.flags,e.addFlags);
      var before=Object.assign({},s.stats);if(!e.regions||e.regions.indexOf(s.person.region)!==-1)effects(s,e.effects);
      var changes=deltas(before,s.stats);
      record(s,'world',e.title,e.text,changes);enqueue(s,'world',e.id,e.title,e.text,changes);if(s.stats.health<=0)break;
    }
  }
  function finish(s,reason){
    if(s.status==='ended')return s;
    s.pending=null;s.phase='done';s.status='ended';
    var title=reason==='death'?'人生档案终止':'十年之后，档案归柜';
    var text=reason==='death'?s.person.name+'于'+s.year+'年'+s.month+'月离世，终年'+s.age+'岁。已经发生的生活仍留在这份档案中。':'1972年1月，'+s.person.name+'已经28岁。从1962年1月到1971年12月，一百二十个月的生活在此合拢，尚未到来的日子留待想象。';
    s.ending={reason:reason,title:title,text:text};record(s,'system',title,text);return s;
  }
  function initialFinance(){return{holdings:{savings:0,bonds:0,industry:0},prices:{savings:5,bonds:8,industry:10},actionsUsed:0,lastReport:null};}
  function weightedRegion(s,list){var total=list.reduce(function(n,r){return n+Math.max(0,r.weight||1);},0),t=random(s)*total;for(var i=0;i<list.length;i++){t-=Math.max(0,list[i].weight||1);if(t<0)return list[i];}return list[list.length-1];}
  function create(options){
    options=options||{};var d=data(),seed=String(options.seed===undefined||options.seed===''?'1962':options.seed).slice(0,160);
    var s={version:VERSION,seed:seed,rng:hash(seed),id:'',year:START_YEAR,month:1,elapsedMonths:0,age:18,person:{},stats:{},world:{routes:{},flags:[],news:[]},flags:[],flagDates:{},incidentDates:{},inbox:[],seen:[],history:[],pending:null,phase:'done',status:'active',ending:null,finance:initialFinance()};
    var requested=options.region||'random',r=requested==='random'?weightedRegion(s,d.regions):regionById(requested);
    if(!r)throw new RangeError('该地区尚未收录在档案中。');
    s.id='tno-'+hash(seed+'|'+r.id).toString(16).padStart(8,'0')+'-'+r.id;
    ROUTE_KEYS.forEach(function(k){s.world.routes[k]=pick(s,d.routes[k]).id;});
    var b=pick(s,BACKGROUNDS),memories=(r.childhood||[]).slice(),childhood=[];
    while(memories.length&&childhood.length<2)childhood.push(memories.splice(integer(s,0,memories.length-1),1)[0]);
    if(!childhood.length)childhood.push('家人讲述过战争的往事；你记得的更多是饭桌与放学后的街道。');
    s.person={name:pick(s,r.names),origin:r.id,region:r.id,familyBackground:b.family,className:b.className,environment:r.city+'的'+pick(s,['旧街区','工人住宅区','近郊街区','拥挤公寓']),childhood:childhood,job:pick(s,['学生','工人','职员','学徒','临时工'])};
    STAT_KEYS.forEach(function(k){s.stats[k]=Math.max(0,Math.min(100,(Number.isFinite(r.base[k])?r.base[k]:50)+integer(s,-7,7)));});
    effects(s,{money:b.money,education:b.education});
    record(s,'system','档案开启 · 1962年1月',s.person.name+'，18岁，来自'+r.name+'。'+s.person.familyBackground+'，住在'+s.person.environment+'。'+childhood.join(''));
    applyWorldEvents(s);if(s.stats.health<=0)return finish(s,'death');openMonth(s);return s;
  }
  function inspect(s){
    var st=s.stats,job=s.person.job,modifiers=[],income=/技术员/.test(job)?16:/教师|护理员/.test(job)?15:/学生|学徒/.test(job)?9:/临时|失业|待业/.test(job)?10:13,expenses=9;
    modifiers.push(job+'基础月收入 '+income);
    var skill=st.education>=60?3:st.education>=35?1:0;income+=skill;if(skill)modifiers.push('教育技能加薪 +'+skill);
    if(st.health<30){income-=4;expenses+=3;modifiers.push('健康低于30：收入 −4、医疗开支 +3');}
    if(st.family>=65){expenses-=2;modifiers.push('家庭互助：月开支 −2');}
    if(st.family<30){expenses+=1;modifiers.push('家庭疏离：月开支 +1、健康额外 −0.6');}
    if(st.risk>=70){income-=2;expenses+=2;modifiers.push('高风险：收入 −2、手续开支 +2、每月10%概率盘查');}
    if(s.month<=2||s.month===12){expenses+=1;modifiers.push('冬季取暖：月开支 +1');}
    var has=function(id){return s.world.news.some(function(n){return n.id===id;});};
    if(s.person.region==='us'&&(has('w04')||has('w05'))){income+=2;modifiers.push('美国政策传导：收入 +2');}
    if(['jp','cn','gd'].indexOf(s.person.region)!==-1&&has('w06')){income+=1;modifiers.push('技术投资订单：收入 +1');}
    if(['tomsk','omsk','irkutsk'].indexOf(s.person.region)!==-1&&s.world.flags.indexOf('ru_unified')!==-1){if(s.world.flags.indexOf('ru_military')!==-1){expenses+=2;modifiers.push('军事动员：开支 +2');}else{income+=2;modifiers.push('交通整合：收入 +2');}}
    if(has('w15')){expenses+=2;modifiers.push('燃料运输紧张：月开支 +2');}
    var assets=ASSETS.map(function(a){return Object.assign({},a,{price:s.finance.prices[a.id],owned:s.finance.holdings[a.id],value:round(s.finance.prices[a.id]*s.finance.holdings[a.id])});}),invested=round(assets.reduce(function(n,a){return n+a.value;},0));
    return{income:income,expenses:expenses,balance:income-expenses,modifiers:modifiers,assets:assets,invested:invested,netWorth:round(st.money+invested),actionsRemaining:Math.max(0,2-s.finance.actionsUsed),stats:{
      health:{label:st.health>=70?'精力充沛':st.health>=30?'需要照料':'健康告急',description:'每月消耗0.35，家庭达到70时减至0.15。低于30：收入 −4、医疗费 +3；归零结束人生。休养恢复8点。'},
      money:{label:st.money>=expenses*3?'储备充足':st.money>=expenses?'尚可周转':'周转困难',description:'可支付的资金点，无100点上限。收入扣除生活费，投资持仓另计；资金不足的事件选项会锁定。'},
      education:{label:st.education>=60?'熟练技能':st.education>=35?'基础技能':'有待进修',description:'达到35月收入 +1，达到60月收入 +3；部分职业选项另有教育门槛。'},
      family:{label:st.family>=65?'互相扶持':st.family>=30?'仍有牵挂':'联系疏远',description:'达到65月开支 −2；低于30开支 +1、健康额外 −0.6。每月自然疏远0.4，可安排陪伴。'},
      risk:{label:st.risk>=70?'受到注意':st.risk>=35?'谨慎行事':'相对安全',description:'越低越好。达到70月收入 −2、开支 +2，每月10%概率盘查损失3资金和2健康。'}
    }};
  }
  function monthlyLife(s){
    var before=Object.assign({},s.stats),budget=inspect(s),notes=[],f=s.finance,oldValue=budget.invested,investment=round(f.holdings.savings*0.01+f.holdings.bonds*0.02);
    var shock=s.world.news.some(function(n){return n.year===s.year&&n.month===s.month&&(n.id==='w08'||n.id==='w15');});
    f.prices.bonds=round(Math.max(1,Math.min(1000000,f.prices.bonds*(1.002+(random(s)-0.5)*0.035-(shock?0.04:0)))));
    f.prices.industry=round(Math.max(0.5,Math.min(1000000,f.prices.industry*(1.004+(random(s)-0.5)*0.15-(shock?0.18:0)))));
    if(shock)notes.push('危机传入市场，工业股份和建设债券承受额外跌幅。');
    var available=s.stats.money+budget.income+investment;
    effects(s,{money:budget.income-budget.expenses+investment,health:-0.35+(s.stats.family>=70?0.2:0)-(s.stats.family<30?0.6:0),family:-0.4,risk:-0.15});
    if(available<budget.expenses){effects(s,{health:-2});notes.push('本月资金不够支付基本生活费，健康 −2。');}
    if(before.risk>=70&&random(s)<0.1){effects(s,{health:-2,money:-3});notes.push('盘查造成误工：健康 −2、资金 −3。');}
    var changes=deltas(before,s.stats),newValue=round(ASSETS.reduce(function(n,a){return n+f.prices[a.id]*f.holdings[a.id];},0));
    f.lastReport={year:s.year,month:s.month,income:budget.income,expenses:budget.expenses,investment:investment,marketChange:round(newValue-oldValue),delta:changes.money,changes:changes,notes:notes};
    record(s,'life',s.year+'年'+s.month+'月收支结算','收入 '+budget.income+'，生活开支 '+budget.expenses+'，投资付息 '+investment+'，可用资金净变化 '+(changes.money>=0?'+':'')+changes.money+'。'+(newValue!==oldValue?'持仓市值变化 '+(newValue>oldValue?'+':'')+round(newValue-oldValue)+'。':'')+notes.join(''),changes);
  }
  function advance(s){
    if(s.status==='ended')return s;if(s.stats.health<=0)return finish(s,'death');if(s.pending||s.inbox.length)return s;if(s.elapsedMonths>=120)return finish(s,'period');
    monthlyLife(s);if(s.stats.health<=0)return finish(s,'death');
    s.elapsedMonths++;s.year=START_YEAR+Math.floor(s.elapsedMonths/12);s.month=s.elapsedMonths%12+1;s.age=s.year-BIRTH_YEAR;
    applyWorldEvents(s);if(s.stats.health<=0)return finish(s,'death');if(s.elapsedMonths===120)return finish(s,'period');openMonth(s);return s;
  }
  function choose(s,index){
    if(s.status==='ended')return s;if(s.stats.health<=0)return finish(s,'death');if(!s.pending)return s;
    var e=event(s);if(!e||!Number.isInteger(index)||index<0||index>=e.choices.length)throw new RangeError('请选择档案中有效的选项。');
    var check=choiceStatus(s,index);if(!check.available)throw new RangeError(check.reason);
    var c=e.choices[index];if(c.move&&!regionById(c.move))throw new RangeError('迁移目的地尚未收录。');
    if(s.inbox.length)throw new RangeError('请先阅读本月收到的通报。');
    var before=Object.assign({},s.stats);s.pending=null;addUnique(s.seen,[e.id]);effects(s,c.effects);
    (c.addFlags||[]).forEach(function(f){if(s.flags.indexOf(f)===-1)s.flagDates[f]=s.elapsedMonths;});addUnique(s.flags,c.addFlags);
    if(c.removeFlags)s.flags=s.flags.filter(function(f){return c.removeFlags.indexOf(f)===-1;});if(c.job)s.person.job=c.job;
    var text=c.text||e.text;if(c.consequence)text+=' '+c.consequence;
    if(c.move&&c.move!==s.person.region){var previous=s.person.region;s.person.region=c.move;s.person.environment=regionById(c.move).city+'的临时住处';text+=' 你从'+regionName(previous)+'迁往'+regionName(c.move)+'。';}
    record(s,'choice',e.title+' · '+c.label,text,deltas(before,s.stats));if(s.stats.health<=0)return finish(s,'death');
    s.phase='done';return s;
  }
  function preservesChoice(s,changes){
    var e=event(s);if(!e)return true;
    var preview=Object.assign({},s,{stats:Object.assign({},s.stats)});effects(preview,changes);
    return e.choices.some(function(c){return choiceCheck(preview,c).available;});
  }
  function actionStatus(s,id){
    var a=ACTIONS[id];if(!a)return{available:false,reason:'行动不存在。'};
    var r=Object.assign({cost:a.cost,label:a.label,description:a.description},choiceCheck(s,a));
    if(s.finance.actionsUsed>=2){r.available=false;r.reason='本月两次自由行动已用完。';}
    else if(r.available&&!preservesChoice(s,a.effects)){r.available=false;r.reason='需先为当前事件保留可用资金或条件，请先回应事件。';}
    return r;
  }
  function act(s,id){var check=actionStatus(s,id);if(!check.available)throw new RangeError(check.reason);var before=Object.assign({},s.stats);effects(s,ACTIONS[id].effects);s.finance.actionsUsed++;record(s,'action',ACTIONS[id].label,ACTIONS[id].description,deltas(before,s.stats));if(s.stats.health<=0)finish(s,'death');return s;}
  function tradeStatus(s,id,side,quantity){
    if(quantity===undefined)quantity=1;
    if(s.status!=='active'||s.stats.health<=0)return{available:false,reason:'这份人生已封存。'};
    if(!ASSETS.some(function(a){return a.id===id;})||['buy','sell'].indexOf(side)===-1||!Number.isSafeInteger(quantity)||quantity<1||quantity>100000)return{available:false,reason:'请选择有效资产、买卖方向和正整数份数。'};
    if(s.finance.actionsUsed>=2)return{available:false,reason:'本月两次自由行动已用完。'};
    if(side==='buy'&&s.stats.money<round(s.finance.prices[id]*quantity))return{available:false,reason:'可用资金不足，不能借款投资。'};
    if(side==='sell'&&s.finance.holdings[id]<quantity)return{available:false,reason:'持有份数不足。'};
    if(side==='sell'&&s.stats.money+round(s.finance.prices[id]*quantity)>1000000000)return{available:false,reason:'本次赎回超过档案资金容量。'};
    if(side==='buy'&&!preservesChoice(s,{money:-round(s.finance.prices[id]*quantity)}))return{available:false,reason:'需为当前事件保留可用资金，请先回应事件。'};
    return{available:true,reason:''};
  }
  function trade(s,id,side,quantity){
    if(quantity===undefined)quantity=1;var check=tradeStatus(s,id,side,quantity);if(!check.available)throw new RangeError(check.reason);
    var amount=round(s.finance.prices[id]*quantity),before=Object.assign({},s.stats),asset=ASSETS.find(function(a){return a.id===id;});
    s.finance.holdings[id]+=side==='buy'?quantity:-quantity;effects(s,{money:side==='buy'?-amount:amount});s.finance.actionsUsed++;
    record(s,'investment',(side==='buy'?'买入':'赎回')+asset.name,(side==='buy'?'支付':'收到')+amount+' 资金点，成交 '+quantity+' 份。持仓按下一次月结价格估值。',deltas(before,s.stats));return s;
  }
  function summary(s){
    var family=s.stats.family>=65?'你与家人保持着紧密联系，在艰难时仍有人可以依靠。':s.stats.family>=30?'你与家人的关系有亲近也有疏离，日常照料仍在延续。':'生活的压力与相互错过，让你和家人之间留下了距离。';
    var financial=s.stats.money>=70?'手头有了一些积蓄':s.stats.money>=30?'仍需为日常收支打算':'时常需要为生活费用发愁',death=s.ending&&s.ending.reason==='death',a=inspect(s),paths=[];
    [['certificate','技术资格'],['child','养育孩子'],['organizer','街坊互助'],['archive','保存记忆'],
      ['sustainable_shop','维持小店的可持续生计'],['shared_teaching','传递可以共享的教案'],['shared_care','建立彼此分担的照护'],
      ['consented_archive','尊重本人意愿保存记忆'],['home_renewed','整修共同生活的住处'],['tools_passed_on','把手艺与工具留给后来者']
    ].forEach(function(p){if(s.flags.indexOf(p[0])!==-1)paths.push(p[1]);});
    return{title:s.ending?s.ending.title:'仍在书写的人生',text:s.ending?s.ending.text:s.person.name+'的档案写到了'+s.year+'年'+s.month+'月，现年'+s.age+'岁。',
      career:'档案中的最后职业是'+s.person.job+'，'+financial+'。可用资金 '+s.stats.money+'，投资市值 '+a.invested+'，合计 '+a.netWorth+' 资金点。',family:family,
      outlook:(paths.length?'你的选择留下了'+paths.join('、')+'的痕迹。':'')+(death?'原创尾声：亲近的人或许会收起你的旧物，在多年以后重新讲起那些寻常日子。':s.stats.health<30?'原创展望：往后的日子里，你或许会先寻找稳定的住处与休养的机会。':s.stats.education>=60?'原创展望：已经学会的知识也许会带来新的工作与去处。未来仍由你继续选择。':'原创展望：你或许会继续工作、照料家人，也可能再次启程。未来并未在这份档案中被预先写定。'),world:s.world.news.map(function(n){return Object.assign({},n);}),reason:s.ending?s.ending.reason:null};
  }
  function isObject(v){return v!==null&&typeof v==='object'&&!Array.isArray(v);}
  function isText(v,max){return typeof v==='string'&&v.length>0&&v.length<=max;}
  function stringList(v,max){return Array.isArray(v)&&v.length<=max&&v.every(function(x){return isText(x,160);})&&new Set(v).size===v.length;}
  function validChanges(v){return isObject(v)&&Object.keys(v).every(function(k){return STAT_KEYS.indexOf(k)!==-1&&Number.isFinite(v[k])&&Math.abs(v[k])<=1000000000;});}
  function stamp(y,m){return(y-START_YEAR)*12+m-1;}
  // Reject malformed local JSON before it reaches either the renderer or RNG.
  function validate(s){
    try{
      var d=data();if(!isObject(s)||s.version!==VERSION||!isText(s.seed,160)||!Number.isInteger(s.rng)||s.rng<=0||s.rng>4294967295)return false;
      if(!Number.isInteger(s.year)||!Number.isInteger(s.month)||s.month<1||s.month>12||!Number.isInteger(s.elapsedMonths)||s.elapsedMonths<0||s.elapsedMonths>120||s.elapsedMonths!==stamp(s.year,s.month)||s.age!==s.year-BIRTH_YEAR)return false;
      if(['active','ended'].indexOf(s.status)===-1||['primary','extra','done'].indexOf(s.phase)===-1)return false;
      var p=s.person;if(!isObject(p)||!regionById(p.origin)||!regionById(p.region)||s.id!=='tno-'+hash(s.seed+'|'+p.origin).toString(16).padStart(8,'0')+'-'+p.origin)return false;
      if(!['name','familyBackground','className','environment','job'].every(function(k){return isText(p[k],500);})||!Array.isArray(p.childhood)||!p.childhood.length||p.childhood.length>10||!p.childhood.every(function(v){return isText(v,2000);}))return false;
      if(!isObject(s.stats)||!STAT_KEYS.every(function(k){return Number.isFinite(s.stats[k])&&s.stats[k]>=0&&s.stats[k]<=(k==='money'?1000000000:100);}))return false;
      if(!isObject(s.world)||!isObject(s.world.routes)||!ROUTE_KEYS.every(function(k){return d.routes[k].some(function(r){return r.id===s.world.routes[k];});}))return false;
      if(!stringList(s.flags,512)||!stringList(s.world.flags,512)||!isObject(s.flagDates)||Object.keys(s.flagDates).length>512||!Object.keys(s.flagDates).every(function(k){return Number.isInteger(s.flagDates[k])&&s.flagDates[k]>=-1&&s.flagDates[k]<=s.elapsedMonths;})||!s.flags.every(function(f){return Number.isInteger(s.flagDates[f]);}))return false;
      var all=d.events.concat(d.worldEvents,d.incidents||[]);if(!stringList(s.seen,all.length)||!s.seen.every(function(id){return all.some(function(e){return e.id===id;});}))return false;
      if(!isObject(s.incidentDates)||Object.keys(s.incidentDates).length>(d.incidents||[]).length||!Object.keys(s.incidentDates).every(function(id){return (d.incidents||[]).some(function(e){return e.id===id;})&&Number.isInteger(s.incidentDates[id])&&s.incidentDates[id]>=0&&s.incidentDates[id]<=s.elapsedMonths;}))return false;
      if(!Array.isArray(s.inbox)||s.inbox.length>32||new Set(s.inbox.map(function(n){return n&&n.id;})).size!==s.inbox.length||!s.inbox.every(function(n){
        if(!isObject(n)||!isText(n.id,250)||['world','personal'].indexOf(n.type)===-1||!Number.isInteger(n.year)||!Number.isInteger(n.month)||n.month<1||n.month>12||stamp(n.year,n.month)<0||stamp(n.year,n.month)>s.elapsedMonths||!isText(n.title,500)||!isText(n.text,10000)||!validChanges(n.changes))return false;
        return (n.type==='world'?d.worldEvents:(d.incidents||[])).some(function(e){return e.id===n.eventId;})&&s.seen.indexOf(n.eventId)!==-1;
      }))return false;
      if(!Array.isArray(s.world.news)||s.world.news.length>d.worldEvents.length)return false;var newsIds=[];
      if(!s.world.news.every(function(n){
        if(!isObject(n)||!isText(n.title,500)||!isText(n.text,10000)||!Number.isInteger(n.month)||n.month<1||n.month>12||stamp(n.year,n.month)>s.elapsedMonths)return false;
        var e=d.worldEvents.find(function(x){return x.id===n.id;});if(!e||e.year!==n.year||(!n.legacy&&(e.month||1)!==n.month)||!routeMatches(e,s)||newsIds.indexOf(n.id)!==-1||s.seen.indexOf(n.id)===-1)return false;newsIds.push(n.id);return true;
      }))return false;
      if(!Array.isArray(s.history)||!s.history.length||s.history.length>3000)return false;var previous=0;
      if(!s.history.every(function(h){
        if(!isObject(h)||!Number.isInteger(h.year)||!Number.isInteger(h.month)||h.month<1||h.month>12||stamp(h.year,h.month)<previous||stamp(h.year,h.month)>s.elapsedMonths||h.age!==h.year-BIRTH_YEAR||['life','world','choice','system','action','investment','incident'].indexOf(h.type)===-1||!isText(h.title,1000)||!isText(h.text,20000)||h.changes!==undefined&&!validChanges(h.changes))return false;previous=stamp(h.year,h.month);return true;
      }))return false;
      var f=s.finance;if(!isObject(f)||!isObject(f.holdings)||!isObject(f.prices)||!Number.isInteger(f.actionsUsed)||f.actionsUsed<0||f.actionsUsed>2)return false;
      if(!ASSETS.every(function(a){return Number.isSafeInteger(f.holdings[a.id])&&f.holdings[a.id]>=0&&f.holdings[a.id]<=1000000000&&Number.isFinite(f.prices[a.id])&&f.prices[a.id]>0&&f.prices[a.id]<=1000000;})||f.prices.savings!==5)return false;
      if(f.lastReport!==null){var r=f.lastReport;if(!isObject(r)||!Number.isInteger(r.year)||!Number.isInteger(r.month)||r.month<1||r.month>12||stamp(r.year,r.month)<0||stamp(r.year,r.month)>s.elapsedMonths||!['income','expenses','investment','marketChange','delta'].every(function(k){return Number.isFinite(r[k])&&Math.abs(r[k])<=1000000000000000;})||!validChanges(r.changes)||!Array.isArray(r.notes)||r.notes.length>20||!r.notes.every(function(n){return isText(n,1000);}))return false;}
      if(s.pending!==null&&(!event(s)||!eligible(event(s),s)||s.status!=='active'||s.phase==='done'))return false;
      if(s.pending===null&&s.phase!=='done')return false;
      if(s.status==='active'){if(s.ending!==null||s.elapsedMonths>=120||s.stats.health<=0)return false;}
      else{if(s.pending!==null||!isObject(s.ending)||!isText(s.ending.title,1000)||!isText(s.ending.text,20000))return false;if(s.ending.reason==='death'){if(s.stats.health>0)return false;}else if(s.ending.reason==='period'){if(s.elapsedMonths!==120||s.stats.health<=0)return false;}else return false;}
      return true;
    }catch(_){return false;}
  }
  // Migration never modifies its input; callers retain the v1/v2 backup keys.
  function migrate(old){
    try{
      if(!isObject(old)||[1,2].indexOf(old.version)===-1||!Number.isInteger(old.year)||old.year<START_YEAR||old.year>END_YEAR||!isObject(old.world)||!Array.isArray(old.history)||!Array.isArray(old.flags))return null;
      var s=JSON.parse(JSON.stringify(old));s.version=VERSION;s.inbox=[];s.incidentDates={};
      if(old.version===1){
        s.month=1;s.elapsedMonths=(s.year-START_YEAR)*12;s.finance=initialFinance();s.flagDates={};
        s.flags.forEach(function(f){s.flagDates[f]=Math.max(-1,s.elapsedMonths-1);});s.history.forEach(function(h){h.month=1;});s.world.news.forEach(function(n){n.month=1;n.legacy=true;});
      }
      s.phase=s.pending?'extra':'done';
      if(!validate(s))return null;
      record(s,'system','档案升级为生活纪事','原存储作为备份保留。已有经历、职业、选择和投资承接；接下来随机遇见个人事件，重大新闻以通报送达。');return s;
    }catch(_){return null;}
  }
  return{VERSION:VERSION,START_YEAR:START_YEAR,END_YEAR:END_YEAR,create:create,advance:advance,choose:choose,summary:summary,eligible:eligible,validate:validate,event:event,notice:notice,dismiss:dismiss,inspect:inspect,choiceStatus:choiceStatus,actionStatus:actionStatus,act:act,tradeStatus:tradeStatus,trade:trade,migrate:migrate};
});
