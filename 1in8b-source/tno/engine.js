(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TNO_ENGINE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var VERSION = 1;
  var START_YEAR = 1962;
  var END_YEAR = 1972;
  var BIRTH_YEAR = 1944;
  var STAT_KEYS = ['health', 'money', 'education', 'family', 'risk'];
  var ROUTE_KEYS = ['us', 'de', 'jp', 'ru'];
  var INITIAL_JOBS = ['学生', '工人', '职员', '学徒', '临时工'];
  var BACKGROUNDS = [
    { family: '工人家庭', className: '靠工资生活的普通家庭', money: -4, education: 0 },
    { family: '小职员家庭', className: '略有积蓄的普通家庭', money: 5, education: 5 },
    { family: '农户家庭', className: '依靠土地与零工的家庭', money: -7, education: -4 },
    { family: '手工业者家庭', className: '收入时有起落的家庭', money: 2, education: 0 },
    { family: '教师家庭', className: '收入有限的知识家庭', money: 0, education: 9 },
    { family: '失业者家庭', className: '需要相互接济的家庭', money: -10, education: -3 }
  ];

  function data() {
    var source = root.TNO_DATA;
    if (!source || !Array.isArray(source.regions) || !source.routes ||
        !Array.isArray(source.events) || !Array.isArray(source.worldEvents)) {
      throw new Error('人生档案资料未载入，请确认 data.js 在 engine.js 之前载入。');
    }
    return source;
  }

  function hash(value) {
    var result = 2166136261;
    for (var i = 0; i < value.length; i += 1) {
      result ^= value.charCodeAt(i);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0) || 2654435769;
  }

  // All simulated randomness passes through this persisted xorshift32 state.
  function random(state) {
    var value = state.rng >>> 0;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    state.rng = value >>> 0;
    return state.rng / 4294967296;
  }

  function integer(state, minimum, maximum) {
    return minimum + Math.floor(random(state) * (maximum - minimum + 1));
  }

  function pick(state, items) {
    return items[Math.floor(random(state) * items.length)];
  }

  function regionById(id) {
    return data().regions.find(function (region) { return region.id === id; });
  }

  function eventById(id) {
    return data().events.find(function (event) { return event.id === id; });
  }

  function regionName(id) {
    var region = regionById(id);
    return region ? region.name : id;
  }

  function addUnique(list, additions) {
    (additions || []).forEach(function (item) {
      if (list.indexOf(item) === -1) list.push(item);
    });
  }

  function clamp(value) {
    return Math.max(0, Math.min(100, value));
  }

  function effects(state, changes) {
    STAT_KEYS.forEach(function (key) {
      if (changes && Number.isFinite(changes[key])) {
        state.stats[key] = clamp(state.stats[key] + changes[key]);
      }
    });
  }

  function record(state, type, title, text) {
    state.history.push({ year: state.year, age: state.age, type: type, title: title, text: text });
  }

  function routeMatches(event, state) {
    return !event.route || state.world.routes[event.route.key] === event.route.id;
  }

  function eligible(event, state) {
    if (!event || !state || !state.person || !state.world || !Array.isArray(state.seen)) return false;
    if (state.seen.indexOf(event.id) !== -1) return false;
    if (event.region && event.region !== state.person.region) return false;
    if (event.year !== undefined && event.year !== state.year) return false;
    if (event.minAge !== undefined && state.age < event.minAge) return false;
    if (event.maxAge !== undefined && state.age > event.maxAge) return false;
    if (event.minYear !== undefined && state.year < event.minYear) return false;
    if (event.maxYear !== undefined && state.year > event.maxYear) return false;
    if (event.jobs && event.jobs.indexOf(state.person.job) === -1) return false;
    if (!routeMatches(event, state)) return false;
    var flags = (state.flags || []).concat(state.world.flags || []);
    if (event.requires && !event.requires.every(function (flag) { return flags.indexOf(flag) !== -1; })) return false;
    if (event.excludes && event.excludes.some(function (flag) { return flags.indexOf(flag) !== -1; })) return false;
    return true;
  }

  function applyWorldEvents(state) {
    var events = data().worldEvents;
    for (var i = 0; i < events.length; i += 1) {
      var event = events[i];
      if (!eligible(event, state)) continue;
      state.seen.push(event.id);
      state.world.news.push({ id: event.id, year: state.year, title: event.title, text: event.text });
      addUnique(state.world.flags, event.addFlags);
      record(state, 'world', event.title, event.text);
      // The news is global, while costs and benefits apply only where specified.
      if (!event.regions || event.regions.indexOf(state.person.region) !== -1) effects(state, event.effects);
      if (state.stats.health <= 0) break;
    }
  }

  function drawPersonalEvent(state) {
    var available = data().events.filter(function (event) { return eligible(event, state); });
    if (!available.length) {
      record(state, 'life', '没有留下特别记录的一年', '工作、家务和短暂的休息填满了日历。平常的日子，也值得被记住。');
      state.pending = null;
      return;
    }
    var followups = available.filter(function (event) { return event.requires && event.requires.length; });
    var regional = available.filter(function (event) { return event.category === 'regional'; });
    var general = available.filter(function (event) { return event.category !== 'regional'; });
    var pool;
    if (followups.length && random(state) < 0.75) {
      pool = followups;
    } else if (regional.length && (!general.length || random(state) < 0.6)) {
      pool = regional;
    } else {
      pool = general.length ? general : available;
    }
    state.pending = pick(state, pool).id;
  }

  function finish(state, reason) {
    if (state.status === 'ended') return state;
    state.pending = null;
    state.status = 'ended';
    var title = reason === 'death' ? '人生档案终止' : '十年之后，档案归柜';
    var text = reason === 'death'
      ? state.person.name + '于' + state.year + '年离世，终年' + state.age + '岁。已经发生的生活仍留在这份档案中。'
      : '1972年，' + state.person.name + '已经28岁。十年的档案在此合拢，尚未到来的日子留待想象。';
    state.ending = { reason: reason, title: title, text: text };
    record(state, 'system', title, text);
    return state;
  }

  function weightedRegion(state, regions) {
    var total = regions.reduce(function (sum, region) { return sum + Math.max(0, region.weight || 1); }, 0);
    var target = random(state) * total;
    for (var i = 0; i < regions.length; i += 1) {
      target -= Math.max(0, regions[i].weight || 1);
      if (target < 0) return regions[i];
    }
    return regions[regions.length - 1];
  }

  function create(options) {
    options = options || {};
    var source = data();
    var seed = String(options.seed === undefined || options.seed === '' ? '1962' : options.seed).slice(0, 160);
    var state = {
      version: VERSION, seed: seed, rng: hash(seed), id: '', year: START_YEAR, age: 18,
      person: {}, stats: {}, world: { routes: {}, flags: [], news: [] },
      flags: [], seen: [], history: [], pending: null, status: 'active', ending: null
    };
    var requested = options.region || 'random';
    var region = requested === 'random' ? weightedRegion(state, source.regions) : regionById(requested);
    if (!region) throw new RangeError('该地区尚未收录在首版档案中。');
    state.id = 'tno-' + hash(seed + '|' + region.id).toString(16).padStart(8, '0') + '-' + region.id;
    ROUTE_KEYS.forEach(function (key) {
      if (!source.routes[key] || !source.routes[key].length) throw new Error('世界路线资料不完整：' + key);
      state.world.routes[key] = pick(state, source.routes[key]).id;
    });
    var background = pick(state, BACKGROUNDS);
    var memories = (region.childhood || []).slice();
    var childhood = [];
    while (memories.length && childhood.length < 2) {
      childhood.push(memories.splice(integer(state, 0, memories.length - 1), 1)[0]);
    }
    if (!childhood.length) childhood.push('家人讲述过战争的往事；你记得的更多是饭桌与放学后的街道。');
    state.person = {
      name: pick(state, region.names), origin: region.id, region: region.id,
      familyBackground: background.family, className: background.className,
      environment: region.city + '的' + pick(state, ['旧街区', '工人住宅区', '近郊街区', '拥挤公寓']),
      childhood: childhood, job: pick(state, INITIAL_JOBS)
    };
    STAT_KEYS.forEach(function (key) {
      var baseline = Number.isFinite(region.base[key]) ? region.base[key] : 50;
      state.stats[key] = clamp(baseline + integer(state, -7, 7));
    });
    effects(state, { money: background.money, education: background.education });
    record(state, 'system', '档案开启 · 1962', state.person.name + '，18岁，来自' + region.name + '。' +
      state.person.familyBackground + '，住在' + state.person.environment + '。' + childhood.join(''));
    applyWorldEvents(state);
    if (state.stats.health <= 0) return finish(state, 'death');
    drawPersonalEvent(state);
    return state;
  }

  function annualLife(state) {
    var job = state.person.job;
    var student = job.indexOf('学生') !== -1 || job.indexOf('学徒') !== -1;
    var insecure = job.indexOf('临时') !== -1 || job.indexOf('失业') !== -1 || job.indexOf('待业') !== -1;
    var changes = {
      health: -integer(state, 0, 3), money: integer(state, 1, 5) - integer(state, 2, 5),
      family: integer(state, -2, 2), risk: -1
    };
    if (student) { changes.education = 3; changes.money -= 2; }
    else if (!insecure) changes.money += 3;
    if (state.stats.money < 10) changes.health -= 3;
    effects(state, changes);
    record(state, 'life', state.year + '年的日常',
      '你又长了一岁，仍以' + job + '的身份生活在' + regionName(state.person.region) + '。' +
      (student ? '学习占去许多时间，也不断消耗着家里的积蓄。' : insecure ? '收入尚不稳定，每一笔开支都需要斟酌。' : '薪酬与日常开销在账本上留下了新的记录。'));
    if (state.stats.risk >= 70 && random(state) < 0.18) {
      effects(state, { health: -integer(state, 4, 9), money: -5 });
      record(state, 'life', '一次盘查之后', '你的名字已引起注意。盘查中的推搡与随后几天的失眠损害了健康，缺勤也减少了收入。');
    }
  }

  function advance(state) {
    if (state.status === 'ended') return state;
    if (state.stats.health <= 0) return finish(state, 'death');
    if (state.pending) return state;
    if (state.year >= END_YEAR) return finish(state, 'period');
    state.year += 1;
    state.age = state.year - BIRTH_YEAR;
    annualLife(state);
    if (state.stats.health <= 0) return finish(state, 'death');
    applyWorldEvents(state);
    if (state.stats.health <= 0) return finish(state, 'death');
    if (state.year >= END_YEAR) return finish(state, 'period');
    drawPersonalEvent(state);
    return state;
  }

  function choose(state, index) {
    if (state.status === 'ended') return state;
    if (state.stats.health <= 0) return finish(state, 'death');
    if (!state.pending) return state;
    var event = eventById(state.pending);
    if (!event || !Number.isInteger(index) || index < 0 || index >= event.choices.length) {
      throw new RangeError('请选择档案中有效的选项。');
    }
    var choice = event.choices[index];
    if (choice.move && !regionById(choice.move)) throw new RangeError('迁移目的地尚未收录。');
    state.pending = null;
    addUnique(state.seen, [event.id]);
    effects(state, choice.effects);
    addUnique(state.flags, choice.addFlags);
    if (choice.removeFlags) state.flags = state.flags.filter(function (flag) { return choice.removeFlags.indexOf(flag) === -1; });
    if (choice.job) state.person.job = choice.job;
    var text = choice.text || event.text;
    if (choice.move && choice.move !== state.person.region) {
      var previous = state.person.region;
      state.person.region = choice.move;
      state.person.environment = regionById(choice.move).city + '的临时住处';
      text += ' 你从' + regionName(previous) + '迁往' + regionName(choice.move) + '，往后的日常将受当地局势影响。';
    }
    record(state, 'choice', event.title + ' · ' + choice.label, text);
    if (state.stats.health <= 0) finish(state, 'death');
    return state;
  }

  function summary(state) {
    var family = state.stats.family >= 70 ? '你与家人保持着紧密联系，在艰难时仍有人可以依靠。'
      : state.stats.family >= 35 ? '你与家人的关系有亲近也有疏离，日常照料仍在延续。'
        : '生活的压力与相互错过，让你和家人之间留下了距离。';
    var financial = state.stats.money >= 70 ? '手头有了一些积蓄' : state.stats.money >= 30 ? '仍需为日常收支打算' : '时常需要为生活费用发愁';
    var career = '档案中的最后职业是' + state.person.job + '，' + financial + '。';
    var death = state.ending && state.ending.reason === 'death';
    var outlook = death ? '原创尾声：亲近的人或许会收起你的旧物，在多年以后重新讲起那些寻常日子。'
      : state.stats.health < 30 ? '原创展望：往后的日子里，你或许会先寻找稳定的住处与休养的机会。未来并未在这份档案中被预先写定。'
        : state.stats.education >= 65 ? '原创展望：已经学会的知识也许会带来新的工作与去处。你能否把这些可能变成生活，仍是档案之外的故事。'
          : '原创展望：你或许会继续工作、照料家人，也可能再次启程。未来并未在这份档案中被预先写定。';
    return {
      title: state.ending ? state.ending.title : '仍在书写的人生',
      text: state.ending ? state.ending.text : state.person.name + '的档案写到了' + state.year + '年，现年' + state.age + '岁。',
      career: career, family: family, outlook: outlook,
      world: state.world.news.map(function (item) { return { id: item.id, year: item.year, title: item.title, text: item.text }; }),
      reason: state.ending ? state.ending.reason : null
    };
  }

  function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function isText(value, maximum) { return typeof value === 'string' && value.length > 0 && value.length <= maximum; }
  function stringList(value, maximum) {
    return Array.isArray(value) && value.length <= maximum &&
      value.every(function (item) { return isText(item, 160); }) && new Set(value).size === value.length;
  }

  // Treat loaded JSON as untrusted: a bad save must never reach the renderer or RNG.
  function validate(state) {
    try {
      var source = data();
      if (!isObject(state) || state.version !== VERSION || !isText(state.seed, 160)) return false;
      if (!Number.isInteger(state.rng) || state.rng <= 0 || state.rng > 4294967295) return false;
      if (!Number.isInteger(state.year) || state.year < START_YEAR || state.year > END_YEAR || state.age !== state.year - BIRTH_YEAR) return false;
      if (state.status !== 'active' && state.status !== 'ended') return false;
      var person = state.person;
      if (!isObject(person) || !regionById(person.origin) || !regionById(person.region)) return false;
      if (state.id !== 'tno-' + hash(state.seed + '|' + person.origin).toString(16).padStart(8, '0') + '-' + person.origin) return false;
      if (!['name', 'familyBackground', 'className', 'environment', 'job'].every(function (key) { return isText(person[key], 500); })) return false;
      if (!Array.isArray(person.childhood) || !person.childhood.length || person.childhood.length > 10 ||
          !person.childhood.every(function (item) { return isText(item, 2000); })) return false;
      if (!isObject(state.stats) || !STAT_KEYS.every(function (key) {
        return Number.isFinite(state.stats[key]) && state.stats[key] >= 0 && state.stats[key] <= 100;
      })) return false;
      if (!isObject(state.world) || !isObject(state.world.routes) || !ROUTE_KEYS.every(function (key) {
        return source.routes[key].some(function (route) { return route.id === state.world.routes[key]; });
      })) return false;
      if (!stringList(state.flags, 512) || !stringList(state.world.flags, 512)) return false;
      var allEvents = source.events.concat(source.worldEvents);
      if (!stringList(state.seen, allEvents.length) || !state.seen.every(function (id) {
        return allEvents.some(function (event) { return event.id === id; });
      })) return false;
      if (!Array.isArray(state.world.news) || state.world.news.length > source.worldEvents.length) return false;
      var newsIds = [];
      if (!state.world.news.every(function (news) {
        if (!isObject(news) || !isText(news.title, 500) || !isText(news.text, 10000)) return false;
        var event = source.worldEvents.find(function (item) { return item.id === news.id; });
        if (!event || event.year !== news.year || news.year > state.year || news.year < START_YEAR || !routeMatches(event, state)) return false;
        if (newsIds.indexOf(news.id) !== -1 || state.seen.indexOf(news.id) === -1) return false;
        newsIds.push(news.id);
        return true;
      })) return false;
      if (!Array.isArray(state.history) || !state.history.length || state.history.length > 1000) return false;
      var previousYear = START_YEAR;
      if (!state.history.every(function (entry) {
        if (!isObject(entry) || !Number.isInteger(entry.year) || entry.year < previousYear || entry.year > state.year ||
            entry.age !== entry.year - BIRTH_YEAR || ['life', 'world', 'choice', 'system'].indexOf(entry.type) === -1 ||
            !isText(entry.title, 1000) || !isText(entry.text, 20000)) return false;
        previousYear = entry.year;
        return true;
      })) return false;
      if (state.pending !== null) {
        var pending = eventById(state.pending);
        if (!pending || !eligible(pending, state) || state.status !== 'active') return false;
      }
      if (state.status === 'active') {
        if (state.ending !== null || state.year >= END_YEAR || state.stats.health <= 0) return false;
      } else {
        if (state.pending !== null || !isObject(state.ending) || !isText(state.ending.title, 1000) || !isText(state.ending.text, 20000)) return false;
        if (state.ending.reason === 'death') { if (state.stats.health > 0) return false; }
        else if (state.ending.reason === 'period') { if (state.year !== END_YEAR || state.stats.health <= 0) return false; }
        else return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  return {
    VERSION: VERSION, START_YEAR: START_YEAR, END_YEAR: END_YEAR,
    create: create, advance: advance, choose: choose, summary: summary,
    eligible: eligible, validate: validate
  };
});
