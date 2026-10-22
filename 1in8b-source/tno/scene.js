/* Original code-drawn pixel street. Visual randomness never consumes the life RNG. */
(function(root) {
  'use strict';
  var palettes = {
    us: {sky:'#9eaeb0',wall:'#ab967a',roof:'#654e46',accent:'#718682',name:'高架铁路旁'},
    de: {sky:'#9ba5ab',wall:'#9b8e78',roof:'#5d554e',accent:'#808d7b',name:'汉堡港的街区'},
    jp: {sky:'#adb7b2',wall:'#b4a28c',roof:'#4b5c59',accent:'#ae7456',name:'大阪电车街'},
    cn: {sky:'#a3b9ad',wall:'#c1b899',roof:'#52645c',accent:'#a77e59',name:'南京的旧巷'},
    gd: {sky:'#a4b7ae',wall:'#d0bd9c',roof:'#536c65',accent:'#b17863',name:'珠江边的骑楼'},
    tomsk: {sky:'#a7b4b7',wall:'#ad967d',roof:'#655e52',accent:'#748b7d',name:'大学旁的街道'},
    omsk: {sky:'#8f9b9e',wall:'#9a8a75',roof:'#57574f',accent:'#9a805d',name:'配给站外的路'},
    irkutsk: {sky:'#a0b1b6',wall:'#b39a7d',roof:'#58646a',accent:'#648b8d',name:'铁路宿舍附近'}
  };
  var esc = function(v){return String(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  function model(s) {
    var russian = ['tomsk','omsk','irkutsk'].indexOf(s.person.region)!==-1;
    var winter = s.month===12||s.month<=2;
    var late = s.month%4===0;
    var work = /学生|教师/.test(s.person.job)?'school':/职员|文书/.test(s.person.job)?'office':/护理/.test(s.person.job)?'clinic':'factory';
    return {palette:palettes[s.person.region],region:s.person.region,place:palettes[s.person.region].name,
      snow:winter&&(russian||s.person.region==='de'||s.person.region==='us'),
      rain:!winter&&[4,6,9].indexOf(s.month)!==-1,night:late,
      home:s.stats.money>=90||s.flags.indexOf('home_renewed')!==-1?'improved':s.stats.money<20?'worn':'modest',
      family:s.stats.family>=55?1+(s.flags.indexOf('partner')!==-1?1:0):0,child:s.flags.indexOf('child')!==-1,
      tired:s.stats.health<30,checkpoint:s.stats.risk>=70,work:work,
      activity:s.status==='ended'?'这一页生活，留在了档案里。':s.stats.health<30?'今天走慢一点，身体需要休息。':s.finance.actionsUsed?'忙过了一阵，街道又恢复寻常。':'街上照常有人来往，日子慢慢向前。'};
  }
  function render(s) {
    var m=model(s),p=m.palette,out=[],n=m.night;
    function rect(x,y,w,h,c,extra){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'" '+(extra||'')+'/>';}
    function windowAt(x,y,w,h){return rect(x-1,y-1,w+2,h+2,'#4b5350')+rect(x,y,w,h,n?'#e2ba79':'#b9cfbd')+rect(x+w/2,y,1,h,'#686c5c')+rect(x,y+h/2,w,1,'#686c5c');}
    function sprite(x,y,coat,small,hero){
      var rows=['..hhh..','.hhhhh.','..ssss.','..sds..','...ss..','..cccc.','.cccccc','.cclcc.','..llll.','..l.ll.','..l.ll.','.bb.bb.'];
      var colors={h:'#393d37',s:'#c3a178',d:'#413e34',c:coat,l:'#3e514c',b:'#292f2a'};
      var scale=small?1:1.5,html='<g class="pixel-person '+(hero?'pixel-you':'')+'" style="--bob:'+(hero?'-1px':'0px')+'" transform="translate('+x+' '+y+')">';
      rows.forEach(function(row,iy){row.split('').forEach(function(c,ix){if(colors[c])html+=rect(ix*scale,iy*scale,scale,scale,colors[c]);});});
      return html+'</g>';
    }
    out.push(rect(0,0,320,130,n?'#344b50':p.sky));
    if(n){out.push(rect(266,10,7,7,'#ddd8ae'),rect(269,9,5,7,'#344b50'));[[30,12],[141,9],[222,18],[295,30],[173,26]].forEach(function(v){out.push(rect(v[0],v[1],1,1,'#d0d6b8'));});}
    else out.push(rect(264,12,10,10,'#e5d4a1'),rect(262,14,14,6,'#e5d4a1'));
    out.push('<g class="pixel-cloud">'+rect(24,18,24,4,n?'#54686a':'#c7d1c2')+rect(29,14,15,4,n?'#54686a':'#c7d1c2')+rect(99,25,18,3,n?'#54686a':'#c7d1c2')+'</g>');
    // Distant skylines and railway / industrial silhouettes vary by birthplace.
    for(var i=0;i<13;i++){
      var h=11+(i*7+s.person.origin.length*3)%22,x=i*27-8;
      out.push(rect(x,70-h,22,h,n?'#3b5252':'#82958e'));
      for(var wy=74-h;wy<66;wy+=7)out.push(rect(x+5,wy,2,3,n?'#b5a67c':'#a6b9ab'));
    }
    if(m.region==='us'||m.region==='irkutsk')out.push(rect(0,56,320,3,'#596e65'),rect(0,60,320,2,'#596e65'),rect(10,61,3,20,'#596e65'),rect(142,61,3,19,'#596e65'),rect(306,61,3,20,'#596e65'));
    out.push(rect(0,80,320,22,m.snow?'#d7ddd0':'#89937c'),rect(0,101,320,5,'#b5b09a'),rect(0,106,320,24,'#586b65'),rect(0,106,320,2,'#384e49'));
    for(i=6;i<320;i+=28)out.push(rect(i,119,13,1,'#abb39b'));
    // Home: the broken plaster, extra room and shutters follow the actual state.
    out.push(rect(16,54,72,45,p.wall),rect(13,50,78,5,p.roof),rect(20,45,64,5,p.roof),rect(28,41,49,4,p.roof),rect(25,32,7,12,p.roof));
    out.push('<g class="pixel-smoke">'+rect(26,24,5,4,n?'#75807a':'#c9cebc')+rect(28,18,4,3,n?'#657570':'#b8c3b3')+'</g>');
    out.push(rect(16,77,72,22,m.home==='improved'?'#a09170':'#8c836c'),windowAt(24,61,16,11),windowAt(63,61,16,11),rect(46,73,13,26,'#576152'),rect(48,76,9,12,'#788775'),rect(55,88,1,1,'#d5be88'),rect(43,97,19,3,'#c6bca0'));
    if(m.home==='worn')out.push(rect(20,83,5,2,'#746e5c'),rect(24,85,2,4,'#746e5c'),rect(75,90,7,2,'#746e5c'),rect(76,92,2,4,'#746e5c'));
    if(m.home==='improved')out.push(rect(11,69,8,29,'#a99b7d'),rect(86,69,8,29,'#a99b7d'),rect(22,76,19,2,p.accent),rect(64,76,17,2,p.accent));
    out.push(rect(25,94,7,4,'#7d614d'),rect(27,88,3,6,'#5b795a'),rect(24,90,7,2,'#6a895e'));
    // Workplace is not always a factory: study, office and care careers change it.
    var wx=220;
    out.push(rect(wx,51,76,47,p.wall),rect(wx-2,47,80,4,p.roof),rect(wx,88,76,10,'#7d8070'));
    if(m.work==='factory'){
      out.push(rect(278,24,8,26,p.roof),rect(276,22,12,3,p.roof),'<g class="pixel-smoke">'+rect(278,15,8,4,'#8e9d91')+rect(275,10,7,3,'#aab5a4')+'</g>');
      out.push(rect(231,78,22,20,'#52635c'),rect(234,80,16,18,'#77877b'));
    } else {
      out.push(rect(249,78,16,20,'#52635c'),rect(252,80,10,18,'#788b78'));
      if(m.work==='clinic')out.push(rect(252,38,5,12,'#d0c9a5'),rect(248,42,13,4,'#d0c9a5'));
      if(m.work==='school')out.push(rect(245,39,9,5,'#e5d7ac'),rect(255,39,9,5,'#d0c49b'),rect(254,39,1,6,'#6b7765'));
    }
    [230,252,274].forEach(function(x){out.push(windowAt(x,59,12,11));});
    out.push(rect(229,74,55,3,p.accent));
    // A tiny street stall and a public radio give the scene readable landmarks.
    out.push(rect(153,76,42,4,'#b9a27f'),rect(153,80,3,20,'#746c53'),rect(192,80,3,20,'#746c53'),rect(151,72,46,4,p.accent),rect(156,87,37,12,'#9f9272'),rect(160,81,8,6,'#c9b784'),rect(173,80,6,7,'#819b70'),rect(182,82,7,5,'#be9369'));
    out.push(rect(120,85,17,12,'#665d49'),rect(122,87,8,7,'#b9ab83'),rect(124,88,1,5,'#766a50'),rect(127,88,1,5,'#766a50'),rect(133,89,2,2,'#d2c99c'),rect(126,80,1,5,'#44564e'),rect(121,99,15,2,'#465a50'));
    // Tree, light pole, laundry and a worn bench anchor the foreground.
    out.push(rect(100,63,3,38,'#625c49'),rect(92,56,19,12,m.snow?'#c9d0bf':'#667e62'),rect(96,51,12,6,m.snow?'#d8ddce':'#718b68'));
    out.push(rect(205,58,2,45,'#52645a'),rect(200,56,12,2,'#52645a'),rect(201,58,8,6,n?'#e8cb85':'#b8c7a7'),rect(201,64,8,1,'#536459'));
    out.push(rect(108,98,29,2,'#8a7b5d'),rect(112,100,2,4,'#44584d'),rect(132,100,2,4,'#44584d'));
    if(m.home!=='worn')out.push(rect(22,79,20,1,'#5e6859'),rect(26,79,5,7,'#d1ccaf'),rect(34,79,5,6,'#85998c'));
    if(['tomsk','omsk','irkutsk'].indexOf(m.region)!==-1){
      for(var beam=58;beam<98;beam+=7)out.push(rect(16,beam,7,1,'#8d765e'),rect(78,beam,10,1,'#8d765e'));
      out.push(rect(19,73,4,23,'#76624f'),rect(81,73,4,23,'#76624f'));
    }
    if(m.region==='gd')out.push(rect(17,78,5,21,'#d6c3a0'),rect(40,78,4,21,'#d6c3a0'),rect(62,78,4,21,'#d6c3a0'),rect(84,78,4,21,'#d6c3a0'),rect(19,77,68,3,'#c7b490'),rect(67,53,17,4,n?'#d6a175':'#a88a61'));
    if(m.region==='jp')out.push(rect(20,78,23,3,'#9b6f57'),rect(23,81,17,5,'#b8c5ae'),rect(88,58,4,25,'#bcaa89'),rect(89,61,2,3,'#716e59'),rect(89,67,2,3,'#716e59'));
    if(m.region==='cn')for(var tile=18;tile<90;tile+=6)out.push(rect(tile,49,4,1,'#80927a'));
    if(m.region==='de')[[18,58],[82,80],[23,91],[75,86]].forEach(function(brick){out.push(rect(brick[0],brick[1],4,1,'#8b7560'));});
    if(m.region==='us')out.push(rect(234,34,2,13,'#52665b'),rect(251,34,2,13,'#52665b'),rect(230,29,27,5,'#66766b'),rect(233,25,21,4,'#66766b'));
    var meX=m.tired?110:141;
    out.push('<g class="pixel-walk">'+sprite(meX,m.tired?82:83,p.accent,false,true)+'</g>');
    for(i=0;i<m.family;i++)out.push(sprite(68-i*11,83,i?'#a29b73':'#8a7664',false,false));
    if(m.child)out.push(sprite(87,89,'#b09a69',true,false));
    out.push(sprite(178,82,'#7b8b79',false,false),sprite(269,83,'#9a866e',false,false));
    out.push('<g class="pixel-marker">'+rect(meX+4,76,3,2,'#ead397')+rect(meX+5,78,1,2,'#ead397')+'</g>');
    if(m.checkpoint)out.push(rect(302,88,3,16,'#594f42'),rect(288,91,28,3,'#b4a16c'),rect(292,91,4,3,'#66594a'),rect(303,91,4,3,'#66594a'),sprite(300,76,'#667468',false,false));
    if(m.snow){out.push(rect(13,49,78,2,'#e1e1cd'),rect(218,46,80,2,'#e1e1cd'));for(i=0;i<24;i++)out.push(rect((i*43+11)%320,(i*17+8)%100,1,2,'#dbe1d1','class="pixel-flake"'));}
    if(m.rain)for(i=0;i<30;i++)out.push(rect((i*37+9)%320,(i*19)%105,1,3,n?'#879b94':'#c0cfc0','class="pixel-rain"'));
    if(n)out.push(rect(0,0,320,130,'#243e3b','opacity=".12"'));
    var weather=m.snow?'落雪':m.rain?'细雨':n?'入夜':'晴间多云';
    return '<section class="pixel-stage" aria-label="像素生活场景"><div class="scene-heading"><span><i></i>生活正在发生</span><span>'+esc(m.place)+' · '+weather+'</span></div><div class="pixel-viewport"><svg viewBox="0 0 320 130" role="img" aria-labelledby="scene-title scene-description" shape-rendering="crispEdges"><title id="scene-title">'+esc(s.person.name)+'的街区</title><desc id="scene-description">'+esc(m.place+'。'+s.person.job+'，'+(m.home==='worn'?'斑驳的住处':m.home==='improved'?'修整过的家':'普通的住处')+'。'+m.activity)+'</desc>'+out.join('')+'</svg><div class="scene-places"><button data-scene-place="home" style="left:3%;top:32%;width:28%;height:46%" aria-label="回家看看"><span>回家</span></button><button data-scene-place="radio" style="left:34%;top:55%;width:12%;height:24%" aria-label="听街头广播"><span>广播</span></button><button data-scene-place="street" style="left:47%;top:50%;width:18%;height:28%" aria-label="看看街坊近况"><span>街坊</span></button><button data-scene-place="work" style="left:67%;top:32%;width:28%;height:46%" aria-label="去工作场所看看"><span>'+({school:'学校',clinic:'诊所',office:'办公室',factory:'工场'}[m.work])+'</span></button></div></div><div class="scene-caption"><span><b class="you-dot"></b>'+esc(s.person.name)+' · '+esc(s.person.job)+'</span><span>'+esc(m.activity)+'</span></div></section>';
  }
  root.TNO_SCENE={render:render,model:model};
  if(typeof module==='object'&&module.exports)module.exports=root.TNO_SCENE;
})(typeof globalThis!=='undefined'?globalThis:this);
