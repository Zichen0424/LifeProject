(function (root) {
  'use strict';
  // All prose and numbers below are original adaptation content. Source notes live in SOURCES.md.
  const regions = [
    {id:'us',name:'美国',city:'芝加哥',bloc:'自由国家组织',description:'三极冷战中的工业城市。公开辩论与种族隔阂同时存在，远方的战争进入晚间新闻。',weight:18,names:['丹尼尔·米勒','露丝·威廉斯','艾伦·陈','玛丽·约翰逊'],childhood:['你在高架铁路旁长大，父母把旧报纸垫在漏风的窗框里。','街角图书馆让你第一次看到海洋另一边的地名。','家中有人从战争归来，却很少谈起当年的经历。'],base:{health:75,money:46,education:48,family:64,risk:16}},
    {id:'de',name:'德国',city:'汉堡',bloc:'统一协定',description:'帝国的码头与工厂照常运作，权力的阴影落在户籍、课堂与每一封信上。',weight:13,names:['彼得·韦伯','安娜·霍夫曼','卡尔·贝克尔','伊尔莎·施密特'],childhood:['学校教授你整齐划一的答案，祖母却提醒你有些问题只能在家中问。','你熟悉码头汽笛，也见过被警卫带走的劳工队列。','家里留着一只来自旧邻居的茶杯，再没有人提起茶杯主人的名字。'],base:{health:72,money:42,education:45,family:61,risk:39}},
    {id:'jp',name:'日本',city:'大阪',bloc:'大东亚共荣圈',description:'电车与广告牌之间，财阀、官僚与军方争夺未来，普通家庭计算着下一张账单。',weight:15,names:['佐藤春子','高桥健一','田中直美','山本明'],childhood:['父亲把工厂发的铅笔头接长，给你练习写字。','放学路上你常在电器商店的橱窗前听收音机。','母亲教你缝补衣服，也教你在外人面前少谈家里的烦恼。'],base:{health:73,money:43,education:49,family:63,risk:29}},
    {id:'cn',name:'中国',city:'南京',bloc:'大东亚共荣圈',description:'日本势力笼罩下的中国。学校与工厂提供有限的上升机会，尊严与生计常难两全。',weight:25,names:['陈明远','周秋兰','林建平','许文芳'],childhood:['祖父把战前的课本藏进木箱，你在停电的晚上跟着他认字。','家人辗转来到南京，旧居的钥匙仍挂在母亲腰间。','街坊合用一台收音机，大人听新闻，你等着最后几分钟的音乐。'],base:{health:65,money:28,education:35,family:71,risk:37}},
    {id:'gd',name:'广东',city:'广州',bloc:'大东亚共荣圈 · 企业统治',description:'珠江边的企业飞地。中文、粤语与日语在同一条街上交错，繁华背后是漫长的工时。',weight:13,names:['梁秀英','何志明','陈国华','林月娥'],childhood:['你在骑楼底下写作业，楼上的霓虹灯整夜不熄。','母亲进出工厂时总把工牌藏在衣领内，怕弄丢全家的饭碗。','邻居用不同语言争吵，又在台风天一起把木板钉上窗户。'],base:{health:64,money:30,education:32,family:65,risk:44}},
    {id:'tomsk',name:'托木斯克',city:'托木斯克',bloc:'俄罗斯碎片 · 中西伯利亚共和国',description:'沙龙、大学和残破的街道共存。共和国的理想仍需回答面包与取暖的问题。',weight:6,names:['阿列克谢·索科洛夫','妮娜·彼得罗娃','维克托·莫罗佐夫','塔季扬娜·伊万诺娃'],childhood:['流亡教师用碎粉笔为你上课，你记得课堂比屋外暖和。','父亲修过一整冬的炉子，换来几袋面粉和邻居的信任。','一家人挤在旧公寓里，晚饭后轮流朗读唯一完整的诗集。'],base:{health:62,money:24,education:46,family:70,risk:30}},
    {id:'omsk',name:'鄂木斯克',city:'鄂木斯克',bloc:'俄罗斯碎片 · 黑色联盟',description:'城市被动员令与防御工事包围。复仇的宣传把日常生活变成漫长的备战。',weight:5,names:['谢尔盖·沃尔科夫','奥尔加·斯米尔诺娃','米哈伊尔·库兹涅佐夫','叶莲娜·波波娃'],childhood:['你最早的记忆是点名和配给队伍，亲人的名字写在一张旧纸上。','祖母坚持在严冬种一盆花，称它是家里唯一不用接受检阅的东西。','街坊用废木料搭起课堂，窗外常传来操练的口令。'],base:{health:60,money:20,education:30,family:61,risk:56}},
    {id:'irkutsk',name:'伊尔库茨克',city:'伊尔库茨克',bloc:'俄罗斯碎片 · 苏维埃残余',description:'贝加尔湖畔的政权仍保留国家机器。粮票、档案和安全机关深入每个家庭。',weight:5,names:['安德烈·谢苗诺夫','柳德米拉·科兹洛娃','帕维尔·列别杰夫','薇拉·诺维科娃'],childhood:['你在铁路宿舍长大，列车的时刻表比节日更影响一家人的生活。','学校里的地图很大，家人真正能去的地方却很少。','母亲替邻居保管过一箱书，之后再没有等到他们回来取走。'],base:{health:61,money:23,education:39,family:65,risk:49}}
  ];
  const routes = {
    us:[{id:'johnson',name:'约翰逊 · 社会改革',description:'以既有约翰逊路线为原型的改编：扩大公共服务，改革伴随持续争议。'},{id:'bennett',name:'贝内特 · 经济协调',description:'以既有贝内特路线为原型的改编：强调金融与盟友协调，民生改善并不均衡。'}],
    de:[{id:'speer',name:'施佩尔 · 体制改革',description:'继承斗争后推进体制调整；改革不等于自由，专制与殖民压迫仍在。'},{id:'bormann',name:'鲍曼 · 党国控制',description:'继承斗争后加强党对机构的控制，稳定承诺伴随着更多审查。'}],
    jp:[{id:'technocrats',name:'宏池会方向 · 技术官僚',description:'参考池田勇人与宏池会的改革倾向，原创压缩为教育和生产投资路线。'},{id:'bureaucrats',name:'内务官僚方向 · 秩序优先',description:'参考内务系的官僚统治倾向，原创压缩为行政控制与企业协调路线。'}],
    ru:[{id:'republic',name:'共和国统一方向',description:'参考托木斯克的共和国与沙龙制度；统一年份与民生后果为原创压缩。'},{id:'military',name:'黑色联盟统一方向',description:'参考鄂木斯克的军事化统一；生活服从备战，游戏不模拟对德战争。'},{id:'soviet',name:'苏维埃统一方向',description:'参考伊尔库茨克党派路线的国家重建；保留一党制度，统一过程为原创压缩。'}]
  };
  const choice = (label,effects,extra={}) => ({label,effects,...extra});
  const general = (id,title,text,choices,extra={}) => ({id,title,text,category:'general',minAge:18,maxAge:28,sourceCategory:'原创普通人叙事',choices,...extra});
  const regional = (region,id,title,text,choices,extra={}) => ({...general(id,title,text,choices,extra),category:'regional',region});
  const events = [
    general('g01','夜校的空座位','白天的工作结束后，旧校舍里还有一盏灯。老师说，学费可以分期，但时间必须由你自己挤出来。',[choice('报名，慢慢补上基础',{money:-6,education:8,health:-2},{addFlags:['night_school']}),choice('先守住眼前的收入',{money:4,family:2})],{excludes:['night_school']}),
    general('g02','那张薄薄的证书','夜校最后一次考试到了。你把习题纸折得很小，塞进上衣口袋，在工作间隙再看一遍。',[choice('认真应考，争取技术资格',{education:8,money:-3},{addFlags:['certificate'],job:'技术员'}),choice('暂缓考试，先偿付家用',{money:6,family:3,education:1})],{requires:['night_school'],minAge:20}),
    general('g03','车间的新学徒','老师傅问你愿不愿意从清点零件做起。开头的工资不高，但他愿意把自己的工具借给你。',[choice('跟着师傅学手艺',{money:-2,education:6},{job:'学徒',addFlags:['apprentice']}),choice('选择当天结算的零工',{money:6,health:-3},{job:'临时工'})]),
    general('g04','独立完成的修理','师傅不在，一台机器停了下来。同事都望着你。你已经见过这个故障，只是还没独自处理过。',[choice('停机检查后再维修',{education:7,money:5},{job:'技术员',addFlags:['certificate']}),choice('请来更有经验的人',{money:-3,family:2,education:3})],{requires:['apprentice'],jobs:['学徒','工人','技术员']}),
    general('g05','屋顶漏下来的雨','半夜，水滴落到被褥上。家里仅有的铁桶接不住所有漏水，房东说明天才会来。',[choice('买材料和家人一起修补',{money:-6,family:5,health:2}),choice('搬进便宜而拥挤的房间',{money:3,health:-4,family:-2})]),
    general('g06','寄不出去的家书','你把最近的烦心事写了满满两页。到了邮筒前，又想起家人总是担心自己。',[choice('把实情写清楚寄回去',{family:6,risk:1},{addFlags:['correspondent']}),choice('只寄简短的平安信',{family:2,money:1})]),
    general('g07','信封里的旧照片','一封回信辗转来到你手里。照片边角已经磨损，背面却多了几行你熟悉的字迹。',[choice('请假回去团聚',{money:-7,family:9,health:2}),choice('补寄一笔生活费',{money:-4,family:5})],{requires:['correspondent']}),
    general('g08','厂门口的义诊','临时诊室只有两张桌子。你已经咳嗽了几个星期，但今天去看病就会少挣半天工钱。',[choice('排队检查并休息',{money:-5,health:9}),choice('买点药继续上工',{money:3,health:-5})]),
    general('g09','祖母的药钱','家里来信说老人夜里睡不好。药房有货，价钱却比你预想的高了一截。',[choice('把自己的积蓄寄去',{money:-8,family:8}),choice('请亲友分担费用',{family:3,risk:1},{addFlags:['community_helper']})]),
    general('g10','一份不体面的兼职','店主愿意让你在关门后打扫仓库。工时安排在深夜，第二天仍要照常起床。',[choice('做一个月，补上缺口',{money:9,health:-7,family:-2}),choice('拒绝，保住休息时间',{health:4,money:-2})]),
    general('g11','旧书摊','一摞沾灰的书被压在称重的废纸下面。老板只按纸张算钱，其中一本正是你曾经想读的。',[choice('买下，和朋友轮流阅读',{money:-3,education:6,risk:2},{addFlags:['reading_circle']}),choice('只买工作用的手册',{money:-2,education:3})]),
    general('g12','读书会的争论','有人想把读书会变成公开的讨论会，也有人担心陌生人会把大家说过的话记下来。',[choice('只讨论文学，保护成员',{education:4,family:3,risk:-2}),choice('允许谈论现实处境',{education:6,risk:6},{addFlags:['public_voice']})],{requires:['reading_circle']}),
    general('g13','一台二手收音机','修理铺的橱窗里摆着一台旧收音机。旋钮有些松动，但还能听见越过国界的声音。',[choice('买下并自己修理',{money:-5,education:4},{addFlags:['radio']}),choice('继续去邻居家听广播',{family:3,education:1})]),
    general('g14','旋钮另一端','夜深了，你的收音机忽然收到一段陌生广播。它描述的世界与你白天听到的很不一样。',[choice('记下内容，暂不传播',{education:5,risk:3},{addFlags:['archive']}),choice('关掉收音机去睡觉',{health:3,risk:-2})],{requires:['radio']}),
    general('g15','朋友的婚礼','宴席并不丰盛，大家却把最好的衣服都穿来了。朋友让你在合影时站近一点。',[choice('帮忙筹备，留下整晚',{money:-3,family:6}),choice('送上小礼物后回去加班',{money:4,family:1,health:-2})]),
    general('g16','共同生活的提议','有人开始在你的餐桌边留下自己的杯子。你们谈到房租，也第一次认真谈起以后。',[choice('一起生活，分担日常',{family:8,money:-4},{addFlags:['partner']}),choice('坦诚说明自己还没准备好',{family:2,health:2})],{minAge:21,excludes:['partner']}),
    general('g17','两个人的预算本','共同生活带来的第一场争执不是大事，只是一笔没有说清的花销。账本摊在桌上，晚饭已经凉了。',[choice('一起重新安排收支',{family:7,money:3}),choice('各自保留更多自由',{family:-3,money:5})],{requires:['partner']}),
    general('g18','一张托儿登记表','你们谈起是否愿意照顾一个孩子。登记表并不催促回答，房间里的沉默却很郑重。',[choice('准备迎接新的家庭成员',{money:-8,family:9,health:-2},{addFlags:['child']}),choice('暂缓，把精力留给彼此',{money:3,family:4})],{requires:['partner'],excludes:['child'],minAge:24}),
    general('g19','屋里第一次发烧','孩子额头发烫，平时热闹的屋子只剩呼吸声。邻居答应帮你守一会儿，好让你去找医生。',[choice('请假照顾，按时复诊',{money:-6,family:7,health:-2}),choice('与家人轮流值守',{family:4,money:-2,health:-4})],{requires:['child']}),
    general('g20','邻居递来的汤','走廊尽头的老人摔伤了脚。邻居们轮流送饭，轮到你的那天恰好有一份额外的工作。',[choice('送饭并帮忙清理房间',{family:6,money:-2},{addFlags:['community_helper']}),choice('托人送去一些食物',{money:-3,family:2})]),
    general('g21','互助名单','上次帮过的人这次来敲你的门。他们想建立一份互助名单，在谁家遇到困难时凑出一点余地。',[choice('负责登记和联络',{family:6,education:3,risk:2},{addFlags:['organizer']}),choice('愿意出钱，不担任联络人',{money:-4,family:4})],{requires:['community_helper']}),
    general('g22','工资晚到了一周','工资袋没有按时出现。主管说只是结算延误，杂货店老板却不能一直赊账。',[choice('削减开支等工资',{health:-3,family:-2}),choice('向熟人借一笔周转钱',{money:6,family:1},{addFlags:['debt']})]),
    general('g23','还款的日子','借款的期限到了。债主没有催促，只在相遇时多停留了片刻，你知道这笔钱对他也很重要。',[choice('按约还清',{money:-7,family:5},{removeFlags:['debt']}),choice('诚恳商量分期',{money:-3,family:-2})],{requires:['debt']}),
    general('g24','第一次存下一笔钱','这个月所有账单都付清后，还剩一点钱。你数了两遍，才确信没有漏算。',[choice('留作应急储备',{money:4},{addFlags:['savings']}),choice('请家人吃顿像样的饭',{money:-3,family:7,health:2})],{excludes:['debt']}),
    general('g25','修好的自行车','有了储备，你终于可以考虑交通问题。步行上班很累，买车又会花掉一大半积蓄。',[choice('买一辆可靠的二手自行车',{money:-7,health:5}),choice('保留积蓄，继续步行',{money:2,health:-2})],{requires:['savings']}),
    general('g26','防空演习','警报响起时，你正站在路口。人们挤进地下室，有人不停看表，有人把孩子抱得更紧。',[choice('帮助疏散，等所有人进来',{family:4,health:-2,risk:2}),choice('尽快找个安全位置',{health:2,risk:-1})]),
    general('g27','安全检查表','负责人让你在一张已经填好的表上签名。你知道其中一台设备从未真正检查过。',[choice('坚持补做检查',{money:-3,health:5,risk:3},{addFlags:['safety_voice']}),choice('拒绝签名并调换岗位',{money:-4,risk:-1},{job:'临时工'})],{jobs:['工人','技术员','学徒','临时工']}),
    general('g28','慢下来的生产线','有人记得你曾坚持检查设备。这次调整工序时，他们愿意听你说明哪里最容易出错。',[choice('整理建议交给车间',{education:5,money:3,health:3},{job:'技术员'}),choice('私下教会身边的同事',{family:4,health:3})],{requires:['safety_voice']}),
    general('g29','一份文书工作','办公室需要一个能把表格抄清楚的人。职位并不起眼，却能让你避开露天的风雨。',[choice('应聘并学习记账',{money:4,education:4},{job:'职员'}),choice('继续做熟悉的工作',{family:2,health:1})]),
    general('g30','数字不对的账页','你在账上发现一笔重复支出。可能是疏忽，也可能是别人不希望你看见的事情。',[choice('保留副本，走正式核对程序',{education:4,risk:5,money:-2},{addFlags:['archive']}),choice('请主管亲自处理',{risk:-2,money:2})],{jobs:['职员']}),
    general('g31','临时的课堂','老师病了，街坊问你能否帮孩子们补一周课。你并不确定自己的知识够不够，却知道他们没有别人可等。',[choice('准备教案，试着讲清楚',{education:5,family:5,money:-2},{addFlags:['teaching']}),choice('帮忙找一位正式教师',{family:3,money:-1})],{minAge:20}),
    general('g32','留在讲台前','那一周的课堂结束后，孩子们仍拿着作业来找你。学校愿意给你一份助教工作，工资只能慢慢改善。',[choice('接受工作，继续进修',{education:7,money:-3},{job:'教师'}),choice('保留原职，周末辅导',{family:5,education:3,health:-2})],{requires:['teaching'],minAge:21}),
    general('g33','诊室缺少帮手','诊所需要有人清洗器具、登记病人。护士强调，任何医疗操作都必须先受训练。',[choice('报名接受基础护理训练',{education:5,money:-3,health:2},{addFlags:['care_training']}),choice('只做志愿登记',{family:4,education:2})]),
    general('g34','值班室的白灯','培训结束后，你得到在护士监督下工作的机会。夜班很累，但第一次知道自己能让一个陌生人安心。',[choice('接受长期岗位',{education:6,money:4,health:-3},{job:'护理员'}),choice('仅在白天帮忙',{education:3,family:3})],{requires:['care_training']}),
    general('g35','一双新鞋','旧鞋的鞋底终于裂开了。商店里有结实的工作鞋，也有你在橱窗前看过许多次的漂亮款式。',[choice('买耐穿的工作鞋',{money:-4,health:4}),choice('修补旧鞋，把钱留给家用',{money:2,family:3,health:-2})]),
    general('g36','同事突然离开','熟悉的座位空了，没人能说清对方去了哪里。抽屉里还有一封没有寄出的家信。',[choice('设法把信交还亲属',{family:5,risk:5},{addFlags:['correspondent']}),choice('封好物品交给保管处',{risk:-2,family:-1})]),
    general('g37','漫长的寒潮','窗上的水汽结成薄冰，燃料店门前的队伍绕过街角。你手里的钱只够买燃料或补充食品。',[choice('先保住屋里的温度',{money:-5,health:4,family:2}),choice('和邻居合住几晚共享炉火',{money:-2,family:4,health:1})]),
    general('g38','午后的河岸','难得没有加班的星期天，有人邀请你去河边。你已经很久没有单纯为了走路而走路了。',[choice('赴约，把烦恼暂时放下',{health:5,family:4,money:-1}),choice('留在家整理课程笔记',{education:4,health:1})]),
    general('g39','换一份工作的机会','朋友带来一个新职位的消息。收入看起来不错，但你必须从最基础的工作重新开始。',[choice('转到新的车间',{money:7,education:2,family:-2},{job:'工人'}),choice('保留现在的生活节奏',{health:3,family:3})],{minAge:23}),
    general('g40','给未来的自己','你翻出十八岁时写下的愿望。其中一些已经实现，一些如今读来陌生，还有几条你仍不愿划掉。',[choice('写下这些年真实的经历',{education:3,family:4},{addFlags:['archive']}),choice('约重要的人一起吃饭',{money:-3,family:7,health:2})],{minAge:26}),

    regional('us','us01','公交车上的空位','一次跨城探亲途中，你看到乘客因为肤色受到刁难。车厢里有人低头，也有人开始抗议。',[choice('陪受刁难的人一起投诉',{family:4,risk:6},{addFlags:['public_voice']}),choice('下车后帮忙寻找安全的去处',{money:-2,family:4})]),
    regional('us','us02','社区学院的公告','招生公告贴在杂货店门外。晚上开课的课程适合工薪家庭，只是仍要挪出书本费。',[choice('申请入学并做课后兼职',{money:-5,education:8,health:-2},{addFlags:['night_school']}),choice('先借来课程目录自学',{education:3,money:-1})],{excludes:['night_school']}),
    regional('us','us03','征集登记信','一封有关服役登记与体检的通知到了家里。晚饭桌上的讨论比广播里的口号复杂得多。',[choice('按规定登记并咨询合法缓征',{risk:-3,money:-2,education:2}),choice('登记后选择后勤训练机会',{money:4,health:-5,family:-3},{job:'后勤员'})],{minAge:18,maxAge:23}),
    regional('us','us04','工会大厅的折椅','工友在大厅摆好一排折椅，准备讨论工资谈判。门外有人拍照，屋里仍有人举手发言。',[choice('帮忙整理诉求',{family:5,risk:4,money:-1},{addFlags:['organizer']}),choice('交会费并听完会议',{money:-2,education:2})],{jobs:['工人','技术员','临时工','学徒']}),
    regional('us','us05','新开张的服务窗口','社会改革带来的项目终于在街区落地。工作人员把复杂的表格摊开，队伍里的人都希望没有填错。',[choice('申请培训名额',{education:7,money:2}),choice('帮助邻居填写申请',{family:6,education:2},{addFlags:['community_helper']})],{minYear:1965,route:{key:'us',id:'johnson'}}),
    regional('us','us06','出口订单','新一轮贸易协调带来了海外订单。工厂招人，管理层却没有承诺订单减少后还能留下多少岗位。',[choice('参加新设备培训',{education:5,money:5,health:-2},{job:'工人'}),choice('继续原来的岗位',{money:2,family:2})],{minYear:1965,route:{key:'us',id:'bennett'}}),
    regional('us','us07','街区的听证会','一项道路工程会拆掉熟悉的商店。居民被允许陈述意见，能不能改变决定还无人知晓。',[choice('带着邻居的签名去发言',{family:6,risk:2,education:2},{addFlags:['public_voice']}),choice('协助搬迁受影响的老人',{money:-3,family:5})],{minAge:22}),
    regional('us','us08','回家的军人','同学带着一只旧行李箱回到街区。大家忙着问远方发生了什么，他却只想知道那家面包店还在不在。',[choice('陪他办理工作申请',{family:5,money:-2}),choice('请他吃饭，不催促他讲述',{money:-3,family:4,health:2})],{minYear:1966}),

    regional('de','de01','车站的临时路障','继承问题让城里的气氛变得紧张。车站增加了路障，你的通勤证上盖满了新章。',[choice('提早出门，带齐证明',{health:-2,risk:-4}),choice('请假陪家人留在家中',{money:-5,family:5,risk:-2})],{maxYear:1964}),
    regional('de','de02','大学旁的小传单','一张传单被塞进你借来的书里，作者没有署名。它问的只是为什么年轻人找不到体面的工作。',[choice('读完后谨慎保存',{education:5,risk:7},{addFlags:['archive']}),choice('把书归还，不再传递',{risk:-3,education:1})],{maxYear:1968}),
    regional('de','de03','隔着铁网的午餐','午休时，你看见被看守的劳工也在吃饭。他们的饭盒比你的浅，排队却更长。',[choice('设法留下额外的面包',{money:-3,family:3,risk:7}),choice('把所见匿名记在日记里',{education:3,risk:3},{addFlags:['archive']})],{maxYear:1966}),
    regional('de','de04','新的技术培训','改革派上台后，一些企业开始改组培训制度。宣传把它说成新时代，你仍要先交课程费。',[choice('参加培训，争取调岗',{education:8,money:-4},{addFlags:['certificate'],job:'技术员'}),choice('先观察合同再决定',{education:2,risk:-2})],{minYear:1965,route:{key:'de',id:'speer'}}),
    regional('de','de05','重新填写的档案','工作单位要求重新核验家庭经历。表格的空白处比去年多，主管提醒你不要写得太随意。',[choice('核对材料后如实填写',{money:-2,risk:-4}),choice('请可信的老职员协助',{money:-3,family:2,risk:-2})],{minYear:1965,route:{key:'de',id:'bormann'}}),
    regional('de','de06','广播里的爵士乐','朋友在很小的音量下播放一段录音。那种节奏与你从小在广播里听到的完全不同。',[choice('留下来听，借一份乐谱',{education:4,family:3,risk:3}),choice('在门口聊一会儿就回家',{family:2,risk:-1})]),
    regional('de','de07','码头的一封远信','货轮水手带来一封远亲的来信。信封上印着你只能在地图上找到的国名，里面却全是熟悉的家常。',[choice('请水手带回平安信',{money:-2,family:6,risk:3},{addFlags:['correspondent']}),choice('先保存地址，等待合适渠道',{family:2,risk:1})]),
    regional('de','de08','空白姓名的纪念页','整理旧楼时，你找到一册缺了几页的住户名册。许多迁出日期完全相同，却没有下一处地址。',[choice('保存副本，拒绝替遗忘作证',{education:4,risk:7},{addFlags:['archive']}),choice('把原件交给可信的保管人',{family:3,risk:3})],{minAge:22}),

    regional('jp','jp01','最后一班电车','加班结束时，站台上的人已经很少。主管说公司需要每个人多出一份力，你想起家里的晚饭。',[choice('接受加班补贴',{money:7,health:-6,family:-3}),choice('向主管说明家庭安排',{money:-2,family:5,risk:2})]),
    regional('jp','jp02','商店里的新电器','新式电器被摆在最显眼的位置，店员说分期付款不会太费力。你算了算自己的工资，发现并不轻松。',[choice('先学维修，不急着购买',{education:5,money:2},{addFlags:['apprentice']}),choice('为家里买一台二手设备',{money:-5,family:5})]),
    regional('jp','jp03','被取消的社团活动','学生朋友告诉你，原定的公开讨论突然取消了。教室仍亮着灯，门口多了两个不认识的人。',[choice('在私人场合继续交流',{education:4,risk:5},{addFlags:['reading_circle']}),choice('帮朋友收拾会场',{family:3,risk:-1})]),
    regional('jp','jp04','厂里的技术讲习','技术官僚推动的新项目需要受过训练的工人。你被问到是否愿意花几个月学习测量和图纸。',[choice('报名参加，争取技术岗位',{education:8,money:-3},{job:'技术员',addFlags:['certificate']}),choice('先做设备登记工作',{money:3,education:3},{job:'职员'})],{minYear:1965,route:{key:'jp',id:'technocrats'}}),
    regional('jp','jp05','街道联络册','行政部门要求每栋楼指定一位联络人，按时递交住户与工作情况。邻居都希望避免麻烦。',[choice('只提交规定的公开信息',{risk:-3,education:2}),choice('帮助老人核对材料',{family:5,risk:2},{addFlags:['community_helper']})],{minYear:1965,route:{key:'jp',id:'bureaucrats'}}),
    regional('jp','jp06','来自广东的合同','公司需要一位愿意赴广东工作的助手。工资高于现在，合同写着住宿安排，却没有写清所有加班。',[choice('接受派驻，前往广州',{money:6,family:-6,risk:5},{move:'gd',job:'职员',addFlags:['migrant']}),choice('留在大阪照顾家人',{family:5,money:-1})],{minAge:22,jobs:['职员','技术员','工人']}),
    regional('jp','jp07','病房外的长椅','一位来自殖民地的同事在窗口遭到冷遇。你听懂了他要说的话，也看见了工作人员的不耐烦。',[choice('陪同解释病情并办理手续',{family:5,risk:4,money:-2}),choice('请熟悉流程的护士帮忙',{money:-2,family:3})]),
    regional('jp','jp08','小工厂的继承人','老师傅准备退休，他没有让孩子接下这间小店。大公司的订单越来越苛刻，但街坊仍需要人修理日用品。',[choice('租下半间店做维修',{money:-8,education:4},{job:'修理工',addFlags:['small_business']}),choice('推荐合适的人并继续帮工',{money:3,family:4})],{minAge:24,requires:['apprentice']}),

    regional('cn','cn01','补印的课本','学校拿到了一批新课本，纸张很薄，许多孩子却舍不得折角。老师问你愿不愿意帮忙分发。',[choice('参加夜间辅导',{education:5,family:4},{addFlags:['teaching']}),choice('帮忙运送课本换取报酬',{money:4,health:-2})]),
    regional('cn','cn02','工厂门外的招工牌','新招工牌写着需要识字的年轻人。名单旁边站着翻译与督工，报名的人从天没亮就在排队。',[choice('应聘，争取学习机器操作',{money:5,education:4,health:-3},{job:'工人'}),choice('留在原处补习基础',{education:4,money:-2})]),
    regional('cn','cn03','两种语言的账本','商号需要有人在中文单据和日文货号之间核对。掌柜承诺愿意教，却提醒你不能让账出现差错。',[choice('跟着学习，做账房助手',{education:6,money:3},{job:'职员'}),choice('只做仓库清点',{money:4,health:-2})]),
    regional('cn','cn04','南下的介绍信','远亲寄来广东一家工厂的介绍信。信里说机会不少，也说宿舍很挤，绝不能相信包办一切的中间人。',[choice('核实合同后南下',{money:-5,family:-4,risk:4},{move:'gd',job:'工人',addFlags:['migrant']}),choice('留在南京寻找机会',{education:2,family:4})],{minAge:20}),
    regional('cn','cn05','老屋里的木箱','修屋时，祖父让你取出藏了许久的木箱。里面是旧地图、信件和几张你叫不出名字的合影。',[choice('逐件记录，听完他的回忆',{education:5,family:6,risk:2},{addFlags:['archive']}),choice('重新收好，先把屋顶修完',{money:-3,family:4,health:2})]),
    regional('cn','cn06','桥边的检查站','去另一处工地要经过检查站。领班催促你早点赶到，守卫却让所有人重新排队核验。',[choice('耐心提交完整证明',{money:-2,risk:-3}),choice('请领班出面说明工期',{money:-3,family:1,risk:2})]),
    regional('cn','cn07','技术班的名额','厂里分到几个技术班名额。名单还没有敲定，同事劝你拿出最近几个月的工作记录。',[choice('提交记录并参加选拔',{education:7,money:-3},{job:'技术员',addFlags:['certificate']}),choice('把机会让给急需晋升的同事',{family:6,money:1})],{minYear:1967,jobs:['工人','学徒','技术员']}),
    regional('cn','cn08','沿江的互助船','汛期让沿江几户人家暂时无处可住。码头师傅组织人把物资搬上小船，没有人讨论该是谁的功劳。',[choice('参加搬运并帮助安置',{health:-3,family:7,risk:2},{addFlags:['community_helper']}),choice('把家中余下的米送过去',{money:-4,family:4})]),

    regional('gd','gd01','工牌背面的编号','你的名字被写进工厂册页，工牌上的编号比姓名更醒目。有人说，别丢了它，生病也要带着。',[choice('熟悉规程，争取稳定岗位',{money:5,health:-3},{job:'工人'}),choice('先做短工，保留选择',{money:3,risk:2},{job:'临时工'})]),
    regional('gd','gd02','楼顶的语言课','下班后，有人在宿舍楼顶教日语，也有人教对方说粤语。词语从工资、米饭和回家开始。',[choice('每天参加，相互教习',{education:7,family:4,health:-2},{addFlags:['language_bridge']}),choice('偶尔来听，先保证休息',{education:2,health:3})]),
    regional('gd','gd03','翻译窗口','主管发现你能在工人和办公室之间传话。升职意味着工资增加，也意味着每句话都可能改变别人的处境。',[choice('做翻译，认真核对双方意思',{money:5,education:4,risk:3},{job:'翻译'}),choice('继续留在熟悉的岗位',{family:4,risk:-2})],{requires:['language_bridge']}),
    regional('gd','gd04','新品展示前夜','展厅的灯光漂亮得像另一个世界。后台的工人还在赶最后一批货，盒子上的品牌远比他们的名字响亮。',[choice('加班完成，领一笔补贴',{money:8,health:-6,family:-2}),choice('要求轮班，守住休息时间',{money:1,health:3,risk:3},{addFlags:['safety_voice']})]),
    regional('gd','gd05','骑楼下的雨季','暴雨把巷子变成浅河。邻居们抢着搬走缝纫机和煤炉，楼上空着的办公室仍锁着门。',[choice('协助搬运，照顾落单的人',{family:7,health:-3},{addFlags:['community_helper']}),choice('先抢救自家的生活用品',{money:3,family:3,health:-2})]),
    regional('gd','gd06','中介许诺的通行证','一个中介说，只要先付钱就能替你办回南京的手续。朋友却找到了可以自行核实的正式渠道。',[choice('走正式渠道，返回南京',{money:-6,family:4,risk:-2},{move:'cn',job:'临时工',addFlags:['migrant']}),choice('暂时留下，拒绝中介',{money:2,risk:-3})],{minAge:21}),
    regional('gd','gd07','厂医开出的休息条','厂医承认你的症状需要休息，领班却皱着眉看假条。生产指标不会因为一个人的身体而减少。',[choice('保留假条并申请病休',{health:9,money:-6,risk:2}),choice('协商调到轻体力岗位',{health:3,money:-2},{job:'职员'})]),
    regional('gd','gd08','商店橱窗里的家','杂志广告把广州叫作人人都能成功的地方。你替邻居修好一盏灯时，突然觉得真正的家更接近这一刻。',[choice('和邻居合办小修理摊',{money:-6,education:4,family:5},{job:'修理工',addFlags:['small_business']}),choice('保留固定工作，周末义务修理',{family:6,health:-2})],{minAge:24}),

    regional('tomsk','tomsk01','沙龙外的旁听席','讲堂里的人争论共和国的未来。你听懂了大半，却还不知道这些争论什么时候能改变宿舍的炉子。',[choice('留下来提一个生活问题',{education:5,risk:2},{addFlags:['public_voice']}),choice('和同伴商量先修好炉子',{money:-3,family:5,health:3})],{maxYear:1968,excludes:['ru_unified']}),
    regional('tomsk','tomsk02','印刷机的墨迹','小印刷所急需帮工。油墨染黑手指，稿纸里既有诗，也有要求政府兑现承诺的文章。',[choice('学习排字和校对',{money:3,education:5},{job:'排字工'}),choice('只做送货和装订',{money:4,health:-2})],{maxYear:1968,excludes:['ru_unified']}),
    regional('tomsk','tomsk03','大学图书馆的炉火','图书馆允许市民在傍晚进来取暖。管理员说，借书不收费，只要记得还回来。',[choice('借一本基础科学读物',{education:6,health:2},{addFlags:['night_school']}),choice('帮管理员整理损坏的书',{education:3,family:4})]),
    regional('tomsk','tomsk04','远村的教师缺额','偏远村庄缺一个能教孩子读写的人。来信附着一幅歪歪扭扭的地图，学校的位置画了一颗星。',[choice('接受临时教学任务',{education:6,family:-3,money:2},{job:'教师',addFlags:['teaching']}),choice('留在城里筹集课本',{money:-3,family:5})],{maxYear:1968,excludes:['ru_unified'],minAge:20}),
    regional('tomsk','tomsk05','排练厅的晚餐','一场演出结束后，演员把剩下的面包分给帮忙搬道具的人。有人问你下周是否还愿意来。',[choice('继续做志愿帮手',{family:6,education:3,money:-1}),choice('接下有报酬的舞台修缮',{money:5,health:-2})]),
    regional('tomsk','tomsk06','穿过雪原的车队','一支获准通行的商队准备前往伊尔库茨克。车上还有一个位置，但目的地的生活同样不容易。',[choice('带上介绍材料随车东行',{money:-5,health:-3,family:-4},{move:'irkutsk',job:'临时工',addFlags:['migrant']}),choice('留下帮助修复车库',{money:3,education:2})],{maxYear:1968,excludes:['ru_unified'],minAge:21}),
    regional('tomsk','tomsk07','工人的请愿书','沙龙代表愿意接见工人，但要求先写一份有条理的材料。工友们把工资袋和账单交给了识字的人。',[choice('帮助整理材料并参加接见',{family:5,education:3,risk:3},{addFlags:['organizer']}),choice('提供自己的账单作证',{family:3,risk:1})],{maxYear:1968,excludes:['ru_unified']}),
    regional('tomsk','tomsk08','重开的铁路售票窗','停用多年的售票窗重新开放。有人打算远行，有人只想确认曾经断掉的联系还能接上。',[choice('寻找失散亲人的地址',{money:-3,family:6},{addFlags:['correspondent']}),choice('应聘车站的登记工作',{money:4,education:3},{job:'职员'})],{minYear:1969,requires:['ru_unified']}),

    regional('omsk','omsk01','清晨的集合哨','天还没亮，街区就响起集合哨。名单上的每个人都要参加工事劳动，家里的炉子尚未生火。',[choice('按时到场，完成后早些回家',{money:2,health:-5,risk:-3}),choice('申请转做物资登记',{money:-2,education:2,risk:2},{job:'后勤员'})],{maxYear:1968,excludes:['ru_unified']}),
    regional('omsk','omsk02','配给站的缺口','配给记录少了一页，排在后面的人可能领不到粮食。站里的职员开始重新计算，队伍越来越急。',[choice('帮忙核对，争取不漏一户',{education:3,family:5,risk:2}),choice('把自己的一部分留给邻居',{money:-4,family:6,health:-2})],{maxYear:1968,excludes:['ru_unified']}),
    regional('omsk','omsk03','地下室里的花盆','祖母把窗台上的花移到地下室。她说，即使所有空间都被征用，也该有一样东西只为活着而生长。',[choice('做一盏小灯照顾花苗',{money:-3,family:6,health:2}),choice('陪她坐一会儿听旧事',{family:5,education:2})]),
    regional('omsk','omsk04','军需仓库的招聘','仓库需要人登记工具与棉衣。职位能换来稳定口粮，但每一项损耗都必须作出解释。',[choice('接下登记工作',{money:5,education:3,risk:3},{job:'后勤员'}),choice('继续民间修缮工作',{money:2,health:-2})],{maxYear:1968,excludes:['ru_unified']}),
    regional('omsk','omsk05','没有说完的旧战事','一位老兵讲起失去家人的那一天。旁人试图把他的故事变成口号，他却只重复着一个人的名字。',[choice('记住那个人的名字',{family:5,education:3},{addFlags:['archive']}),choice('送他回家，帮忙生火',{money:-2,family:4,health:2})]),
    regional('omsk','omsk06','去托木斯克的货单','获得通行许可的运输队需要一名会清点货物的帮手。离开的代价很高，但这可能是开始新生活的机会。',[choice('随队离开，在托木斯克落脚',{money:-7,family:-5,risk:-4},{move:'tomsk',job:'临时工',addFlags:['migrant']}),choice('留下，把岗位介绍给亲友',{family:5,money:1})],{maxYear:1968,excludes:['ru_unified'],minAge:21}),
    regional('omsk','omsk07','加长的训练表','备战机构要求各单位增加训练。你能选择后勤课程，却不能假装通知没有送到。',[choice('学习急救与后勤课程',{education:4,health:-3,risk:-2},{addFlags:['care_training']}),choice('按原计划完成体能训练',{health:-5,money:3,risk:-3})],{minYear:1969,route:{key:'ru',id:'military'},requires:['ru_unified']}),
    regional('omsk','omsk08','旧工事的清理日','那些用来防御邻城的旧障碍终于被拆除。木料和铁件被分别堆放，工人讨论着能拿它们修多少间屋子。',[choice('把可用材料交给街坊修房',{family:6,health:-2}),choice('登记材料，申请维修岗位',{money:4,education:3},{job:'工人'})],{minYear:1969,route:{key:'ru',id:'republic'},requires:['ru_unified']}),

    regional('irkutsk','irkutsk01','档案室的排队日','每个窗口都要不同的证明。你抱着一叠纸从早上等到下午，担心下一次盖章又会把你送回原处。',[choice('仔细核对并补齐材料',{money:-3,risk:-4,education:2}),choice('请熟悉流程的邻居陪同',{money:-2,family:3,risk:-2})],{maxYear:1968,excludes:['ru_unified']}),
    regional('irkutsk','irkutsk02','铁路宿舍的停暖','供暖管道出了故障，维修队迟迟未到。宿舍里的人把毯子集中给老人和孩子。',[choice('协助修理，先恢复公共房间',{health:-3,education:4,family:5},{addFlags:['apprentice']}),choice('借来炉子安排临时取暖',{money:-4,family:5,health:2})]),
    regional('irkutsk','irkutsk03','厂内会议的发言单','会议将讨论生产与粮食分配。有人劝你说点实际的困难，也有人提醒你发言会被记录。',[choice('用具体数字说明困难',{education:3,risk:5},{addFlags:['public_voice']}),choice('会后单独递交建议',{family:2,risk:2})],{maxYear:1968,excludes:['ru_unified']}),
    regional('irkutsk','irkutsk04','贝加尔湖的来信','远方亲属托人捎来消息，说旅程比想象中曲折。信里的湖面很平静，边角却有被水浸过的痕迹。',[choice('设法回信并寄去生活费',{money:-4,family:6},{addFlags:['correspondent']}),choice('保存地址，等待邮路恢复',{family:2,education:1})]),
    regional('irkutsk','irkutsk05','旧机关的新章程','国家重建带来了新的工作程序。旧表格与新表格摞在一起，大家都想知道哪一份才算数。',[choice('学习新程序，帮助同事适应',{education:5,money:3},{job:'职员'}),choice('专注原岗位，避免卷入争论',{risk:-3,family:2})],{minYear:1969,route:{key:'ru',id:'soviet'},requires:['ru_unified']}),
    regional('irkutsk','irkutsk06','合作社的修理台','合作社想留出一个角落维修锅炉和工具。工具不齐，但至少可以把每一笔材料公开记在黑板上。',[choice('加入维修小组',{money:4,education:5,health:-2},{job:'修理工'}),choice('帮忙做账和登记',{money:2,education:3},{job:'职员'})],{minAge:22}),
    regional('irkutsk','irkutsk07','向西的工作调函','一封经过核验的调函允许你去托木斯克工作。家人替你缝好行李包，也把分别的话咽了回去。',[choice('接受安排，乘车西行',{money:-5,family:-4,education:3},{move:'tomsk',job:'工人',addFlags:['migrant']}),choice('申请留下照顾家庭',{money:-2,family:6})],{maxYear:1968,excludes:['ru_unified'],minAge:21}),
    regional('irkutsk','irkutsk08','名单上重新出现的人','一个曾经突然离开的邻居回来了。大家不知道该问什么，只默默在长桌旁多摆了一把椅子。',[choice('帮他找住处与工作',{money:-4,family:7,risk:2},{addFlags:['community_helper']}),choice('送去食物，尊重他的沉默',{money:-2,family:4})],{minAge:23})
  ];

  const world = (id,year,title,text,effects,extra={}) => ({id,year,title,text,effects,sourceCategory:'路线改编',...extra});
  const russianRegions=['tomsk','omsk','irkutsk'];
  const worldEvents = [
    world('w01',1963,'德国：继承危机','希特勒去世，权力继承进入公开斗争。汉堡的机关暂停部分业务，各地等待新的命令。本改编采用继承斗争叙事，不接入旧版德国内战。',{money:-3,risk:6},{regions:['de'],addFlags:['de_succession'],sourceCategory:'设定背景改编'}),
    world('w02',1964,'德国：改革派接掌权力','施佩尔阵营在继承斗争中胜出。调整体制的许诺传入车间，但压迫没有随着一张新肖像自动消失。',{education:2,money:2,risk:-2},{route:{key:'de',id:'speer'},requires:['de_succession'],regions:['de']}),
    world('w03',1964,'德国：党务体系扩张','鲍曼阵营掌握了继承斗争的主动。党对工作单位与行政机构的控制继续加深，居民需要适应更多核验。',{money:1,risk:7},{route:{key:'de',id:'bormann'},requires:['de_succession'],regions:['de']}),
    world('w04',1965,'美国：社会改革议程','约翰逊方向的政府开始推动社会项目。新的培训与服务窗口逐渐出现，资金、权利与地方阻力仍在拉扯。',{education:3,health:2,money:1},{route:{key:'us',id:'johnson'},regions:['us']}),
    world('w05',1965,'美国：经济协调议程','贝内特方向的政府强调货币、贸易与盟友协调。企业接到新订单，不同街区感受到的收益却相差很远。',{money:4,education:1},{route:{key:'us',id:'bennett'},regions:['us']}),
    world('w06',1965,'日本：技术官僚的投资方案','本局的宏池会方向取得主导。投资向训练与设备倾斜，帝国的等级关系依然存在，改革的收益首先落到最有资源的人手里。',{education:3,money:2,risk:1},{route:{key:'jp',id:'technocrats'},regions:['jp','cn','gd']}),
    world('w07',1965,'日本：秩序优先的行政方案','本局的内务官僚方向取得主导。企业与行政机构加强协调，更多审查进入日常，稳定被反复许诺。',{money:2,risk:5},{route:{key:'jp',id:'bureaucrats'},regions:['jp','cn','gd']}),
    world('w08',1963,'共荣圈：银行危机的回声','以安田危机为背景的金融震荡传到工厂和商店。广东的企业重新争夺资产与席位，普通家庭首先感受到工资延迟。',{money:-5,risk:3},{regions:['jp','gd'],sourceCategory:'设定背景改编'}),
    world('w09',1966,'世界：远方的战争进入广播','三极竞争让许多地方的冲突获得了外部支援。消息被不同广播解释成不同的故事，家庭却都担心收到征集或伤亡通知。',{risk:2,family:-1},{sourceCategory:'原创世界新闻'}),
    world('w10',1967,'中国：车间与课堂之间','本改编中的地方技术培训扩展到更多工厂。新的课桌并不能消除受制于人的处境，却为部分年轻人提供了学习手艺的机会。',{education:3,money:1},{regions:['cn'],addFlags:['cn_training'],sourceCategory:'原创世界新闻'}),
    world('w11',1968,'俄罗斯：连通的代价','统一战争与区域整合逐渐改变邮路、运输和征集制度。铁路开始接续，许多家庭仍不知道下一封信会从哪里来。',{money:-3,health:-2,risk:4},{regions:russianRegions,sourceCategory:'设定背景改编'}),
    world('w12',1969,'俄罗斯：共和国方向完成整合','本局采用托木斯克式共和国整合的压缩结局。三处出生地区归入同一国家框架，旧关卡逐步撤除，参与公共事务的空间有所扩大。',{risk:-7,education:3,family:2},{route:{key:'ru',id:'republic'},regions:russianRegions,addFlags:['ru_unified','ru_republic']}),
    world('w13',1969,'俄罗斯：军事化方向完成整合','本局采用黑色联盟整合的压缩结局。三处出生地区被纳入统一动员，生产与生活越来越服从备战。所谓大审判停留在威胁中，本作不模拟其发动。',{risk:10,health:-3,money:-2},{route:{key:'ru',id:'military'},regions:russianRegions,addFlags:['ru_unified','ru_military']}),
    world('w14',1969,'俄罗斯：苏维埃方向完成整合','本局采用伊尔库茨克党派国家重建的压缩结局。三处出生地区的机构重新编组，保障和行政控制一并扩大，国家仍保留一党制度。',{money:2,education:2,risk:3},{route:{key:'ru',id:'soviet'},regions:russianRegions,addFlags:['ru_unified','ru_soviet']}),
    world('w15',1971,'世界：运输与燃料的账单','本改编中的能源和运输紧张传导到民用市场。商店调价，家庭重新计算取暖与出行的费用；这不是对某一版本石油危机日期的复刻。',{money:-5,health:-1},{sourceCategory:'原创世界新闻'}),
    world('w16',1972,'世界：十年之后','报纸还在谈论下一场危机和下一个计划。对普通人而言，十年留下的是一份履历、几封家信，以及仍要继续过下去的日子。',{family:2},{sourceCategory:'原创世界新闻'})
  ];
  const sources = [
    {title:'三极冷战',url:'https://tno.wiki.gg/wiki/Cold_War',note:'核查：2026-10-21。三极势力及代理冲突背景。'},
    {title:'美国与既有国策路线',url:'https://tno.wiki.gg/wiki/United_States_of_America_national_focus_tree',note:'核查：2026-10-21。约翰逊、贝内特路线原型；本作不复刻完整总统更替。'},
    {title:'德国继承斗争',url:'https://tno.wiki.gg/wiki/Adolf_Hitler',note:'核查：2026-10-21。含未来更新内容；采用1963继承斗争，不混入旧版内战。'},
    {title:'德国党内派系',url:'https://tno.wiki.gg/wiki/National_Socialist_German_Workers%27_Party',note:'核查：2026-10-21。鲍曼控制派与改革派方向；具体民生效果为原创。'},
    {title:'日本大政翼赞会派系',url:'https://tno.wiki.gg/wiki/Imperial_Rule_Assistance_Association',note:'核查：2026-10-21。含未来内容；宏池会与内务系用于原创方向，不声称可游玩的完整首相路线。'},
    {title:'日本与共荣圈',url:'https://tno.wiki.gg/wiki/Empire_of_Japan',note:'核查：2026-10-21。含未来内容；仅取帝国、财阀与共荣圈背景。'},
    {title:'广东企业社会',url:'https://tno.wiki.gg/wiki/State_of_Guangdong',note:'核查：2026-10-21。企业、阶层、安田危机与产品竞争背景。'},
    {title:'托木斯克',url:'https://tno.wiki.gg/wiki/Tomsk',note:'核查：2026-10-21。共和国、沙龙与教育背景。'},
    {title:'鄂木斯克',url:'https://tno.wiki.gg/wiki/Siberian_Black_League',note:'核查：2026-10-21。黑色联盟与军事化背景。'},
    {title:'伊尔库茨克党派路线',url:'https://tno.wiki.gg/wiki/Sergey_Bessonov',note:'核查：2026-10-21。伊尔库茨克党派与国家派的区别；统一年份为原创压缩。'},
    {title:'俄罗斯分裂背景',url:'https://tno.wiki.gg/wiki/Russia',note:'核查：2026-10-21。分裂与区域政权背景；本作只表现三处人生起点。'}
  ];
  const data = {version:'1.0.0',regions,routes,events,worldEvents,sources};
  root.TNO_DATA = data;
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
})(typeof globalThis !== 'undefined' ? globalThis : window);
