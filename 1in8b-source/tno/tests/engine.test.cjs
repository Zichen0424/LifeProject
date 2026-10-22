'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const directory = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(directory, 'engine.js'), 'utf8');
const runtime = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(directory, 'data.js'), 'utf8'), runtime, { filename: 'data.js' });
vm.runInContext(source, runtime, { filename: 'engine.js' });
const data = runtime.TNO_DATA, engine = runtime.TNO_ENGINE;
const clone = value => JSON.parse(JSON.stringify(value));
const statNames = ['health', 'money', 'education', 'family', 'risk'];
const regionIds = Array.from(data.regions, region => region.id);
const assets = ['savings', 'bonds', 'industry'];
const monthKey = state => `${state.year}-${String(state.month).padStart(2, '0')}`;

function isolatedEngine(overrides = {}) {
  const context = vm.createContext({ console, TNO_DATA: { ...clone(data), ...overrides } });
  vm.runInContext(source, context, { filename: 'engine.js' });
  return context.TNO_ENGINE;
}
function availableChoices(simulation, state) {
  const event = simulation.event(state);
  assert.ok(event, `missing event at ${monthKey(state)}`);
  return event.choices.map((choice, index) => ({ choice, index })).filter(({ index }) => simulation.choiceStatus(state, index).available);
}
function safeChoice(options) {
  const score = ({ choice }) => (choice.effects?.health || 0) * 8 + (choice.effects?.family || 0) * 2 + (choice.effects?.money || 0) - (choice.effects?.risk || 0) * 3;
  return options.slice().sort((a, b) => score(b) - score(a))[0].index;
}
function readNotices(state, simulation = engine) { while (simulation.notice(state)) simulation.dismiss(state); return state; }
function resolveMonth(state, simulation = engine, strategy = safeChoice) {
  let decisions = 0;
  while ((state.pending || simulation.notice(state)) && state.status === 'active') {
    if (simulation.notice(state)) { simulation.dismiss(state); continue; }
    assert.ok(decisions++ < 2, `too many events in ${monthKey(state)}`);
    const options = availableChoices(simulation, state);
    assert.ok(options.length, 'every event needs an available fallback');
    simulation.choose(state, strategy(options, state, decisions));
  }
}
function assertSound(state, simulation = engine) {
  assert.equal(simulation.validate(state), true, `invalid state at ${monthKey(state)}: ${JSON.stringify(state)}`);
  assert.equal(state.age, state.year - 1944);
  assert.equal(state.elapsedMonths, (state.year - 1962) * 12 + state.month - 1);
  for (const stat of statNames) {
    assert.ok(Number.isFinite(state.stats[stat]) && state.stats[stat] >= 0, `${stat} must be finite and nonnegative`);
    if (stat !== 'money') assert.ok(state.stats[stat] <= 100);
  }
  if (state.pending) assert.equal(simulation.eligible(simulation.event(state), state), true);
  for (const entry of state.history) assert.ok(entry.month >= 1 && entry.month <= 12);
}
function finish(state, { simulation = engine, strategy = safeChoice, care = false } = {}) {
  const months = [], shown = new Set();
  for (let step = 0; state.status === 'active'; step++) {
    assert.ok(step < 121, 'ten years must finish within 120 month advances');
    assertSound(state, simulation);
    months.push(monthKey(state));
    resolveMonth(state, simulation, (options, current) => {
      assert.ok(!shown.has(current.pending), `event repeated: ${current.pending}`);
      shown.add(current.pending);
      return strategy(options, current, step);
    });
    if (care && state.status === 'active') {
      for (let slot = 0; slot < 2; slot++) {
        const action = state.stats.money < 20 && state.stats.health >= 25 ? 'work' : state.stats.health < 90 ? 'rest' : 'family';
        if (simulation.actionStatus(state, action).available) simulation.act(state, action);
      }
    }
    simulation.advance(state);
  }
  assertSound(state, simulation);
  assert.equal(state.pending, null);
  assert.ok(state.year === 1972 || state.stats.health === 0, 'only death ends a life early');
  return months;
}
function legacyState() {
  const state = clone(engine.create({ region: 'us', seed: 'legacy-fixture' }));
  Object.assign(state, { version: 1, year: 1965, age: 21, flags: [], seen: [], pending: 'g01', status: 'active', ending: null });
  state.stats.money = 47;
  state.history = [
    { year: 1962, age: 18, type: 'system', title: '旧档案开启', text: '旧年度制的人生档案。' },
    { year: 1965, age: 21, type: 'life', title: '1965年的日常', text: '已经走过三年。' }
  ];
  state.world.flags = []; state.world.news = [];
  for (const key of ['month', 'elapsedMonths', 'finance', 'flagDates', 'phase']) delete state[key];
  return state;
}

test('dated opportunities cover 120 months alongside non-choice incident content', () => {
  assert.equal(data.regions.length, 8); assert.equal(new Set(regionIds).size, 8);
  const monthly = data.events.filter(event => event.category === 'monthly');
  assert.equal(monthly.length, 120);
  const expected = Array.from({ length: 120 }, (_, i) => `${1962 + Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, '0')}`);
  assert.deepEqual(Array.from(monthly, monthKey).sort(), expected.sort());
  for (const event of monthly) assert.ok(event.choices.some(choice =>
    (choice.effects?.money || 0) >= 0 && !Object.keys(choice.requiresStats || {}).length &&
    !Object.keys(choice.maxStats || {}).length && !(choice.requiresFlags || []).length && !(choice.excludesFlags || []).length
  ), `${event.id} needs an affordable unconditional path`);
  const all = [...data.events, ...data.worldEvents];
  assert.equal(new Set(all.map(event => event.id)).size, all.length);
  for (const event of data.worldEvents) assert.ok(Number.isInteger(event.month) && event.month >= 1 && event.month <= 12, `${event.id} needs a scheduled month`);
  for (const event of all) {
    assert.ok(event.id && event.title && event.text && event.sourceCategory, `incomplete event ${event.id}`);
    assert.match(event.title + event.text, /[\u3400-\u9fff]/);
    if (event.choices) {
      assert.ok(event.choices.length >= 2, `${event.id} needs a real choice`);
      for (const choice of event.choices) {
        assert.match(choice.label, /[\u3400-\u9fff]/);
        if (choice.move) assert.ok(regionIds.includes(choice.move));
        for (const [stat, value] of Object.entries(choice.effects || {})) {
          assert.ok(statNames.includes(stat), `unknown stat in ${event.id}`); assert.ok(Number.isFinite(value));
        }
      }
    }
    if (event.route) assert.ok(data.routes[event.route.key].some(route => route.id === event.route.id));
    if (event.month !== undefined) assert.ok(Number.isInteger(event.month) && event.month >= 1 && event.month <= 12);
  }
});

test('event and choice prerequisites refer to flags that playable content produces', () => {
  const all = [...data.events, ...data.worldEvents];
  const produced = new Set(all.flatMap(event => [...(event.addFlags || []), ...(event.choices || []).flatMap(choice => choice.addFlags || [])]));
  for (const event of all) for (const condition of [event, ...(event.choices || [])]) {
    for (const flag of [...(condition.requires || []), ...(condition.requiresFlags || [])]) assert.ok(produced.has(flag), `${event.id} requires unreachable ${flag}`);
  }
});

test('eight regions reach 120 months with incidents, decisions and ordinary days', () => {
  for (const region of regionIds) {
    const state = engine.create({ region, seed: `monthly-completion-${region}` });
    assert.equal(state.version, 3); assert.equal(monthKey(state), '1962-01'); assert.equal(state.person.origin, region);
    let primaryDecisions = 0;
    const months = finish(state, { care: true, strategy(options, current) {
      if (engine.event(current).category === 'monthly') primaryDecisions++;
      return safeChoice(options);
    } });
    assert.equal(state.ending.reason, 'period', `safe path died in ${region} at ${monthKey(state)}`);
    assert.equal(months.length, 120, region); assert.equal(new Set(months).size, 120);
    assert.ok(primaryDecisions < 60, `${region} must not face a dated choice every month`);
    assert.ok(state.history.some(entry => entry.type === 'incident'), 'ordinary events must actually happen');
    assert.ok(state.history.filter(entry => entry.type === 'choice').length < 90, 'choices must be occasional');
    assert.equal(months[0], '1962-01'); assert.equal(months.at(-1), '1971-12');
    assert.equal(monthKey(state), '1972-01'); assert.equal(state.elapsedMonths, 120); assert.equal(state.age, 28);
    const result = engine.summary(state);
    for (const key of ['title', 'text', 'career', 'family', 'outlook', 'reason']) assert.ok(typeof result[key] === 'string' && result[key]);
  }
});

test('December rolls to January and age changes only at the new year', () => {
  const state = engine.create({ region: 'us', seed: 'calendar' });
  while (state.year === 1962 && state.month < 12) { resolveMonth(state); engine.advance(state); assert.equal(state.age, 18); }
  assert.equal(monthKey(state), '1962-12'); resolveMonth(state); engine.advance(state);
  assert.equal(monthKey(state), '1963-01'); assert.equal(state.age, 19); assert.equal(state.elapsedMonths, 12);
});

test('the same seed and available choices reproduce a complete life exactly', () => {
  for (const region of [...regionIds, 'random']) {
    const first = engine.create({ region, seed: '同一份月度档案' }), second = engine.create({ region, seed: '同一份月度档案' });
    const strategy = (options, state, turn) => options[(turn + state.month) % options.length].index;
    finish(first, { strategy }); finish(second, { strategy }); assert.deepEqual(clone(first), clone(second));
  }
});

test('JSON saves preserve pending decisions, holdings, actions and RNG', () => {
  const original = engine.create({ region: 'us', seed: 'monthly-json-resume' });
  original.stats.money = 250; engine.trade(original, 'industry', 'buy', 2); engine.act(original, 'study');
  const resumed = clone(original); assert.equal(engine.validate(resumed), true);
  finish(original, { care: true }); finish(resumed, { care: true }); assert.deepEqual(clone(original), clone(resumed));
});

test('unresolved decisions block time and invalid indices leave state untouched', () => {
  const state = readNotices(engine.create({ region: 'us', seed: 'choice-guard' }));
  state.pending = 'g01'; state.phase = 'extra'; const before = clone(state);
  engine.advance(state); assert.deepEqual(clone(state), before);
  for (const index of [-1, engine.event(state).choices.length, NaN, 0.5, '0', null]) {
    assert.throws(() => engine.choose(state, index), { name: 'RangeError' }); assert.deepEqual(clone(state), before);
  }
});

test('eligibility enforces months, age, profession, world routes and flags', () => {
  const state = engine.create({ region: 'us', seed: 'eligibility' });
  const event = { id: 'eligibility-probe', category: 'general', title: '条件测试', text: '测试', choices: [] };
  assert.equal(engine.eligible(event, state), true);
  for (const extra of [{ region: 'de' }, { minAge: 19 }, { maxAge: 17 }, { minYear: 1963 }, { maxYear: 1961 }, { month: 2 }, { minYear: 1962, minMonth: 2 }, { jobs: ['不存在的职业'] }, { route: { key: 'us', id: 'impossible' } }, { requires: ['test-flag'] }, { requiresStats: { education: 101 } }]) {
    assert.equal(engine.eligible({ ...event, ...extra }, state), false, JSON.stringify(extra));
  }
  assert.equal(engine.eligible({ ...event, month: 1, jobs: [state.person.job] }, state), true);
  state.flags.push('test-flag'); state.flagDates['test-flag'] = -1;
  assert.equal(engine.eligible({ ...event, requires: ['test-flag'] }, state), true);
  assert.equal(engine.eligible({ ...event, excludes: ['test-flag'] }, state), false);
  state.world.flags.push('test-world-flag'); assert.equal(engine.eligible({ ...event, requires: ['test-world-flag'] }, state), true);
  state.seen.push(event.id); assert.equal(engine.eligible(event, state), false);
});

test('choice locks explain and enforce missing money, education and flags', () => {
  const event = { id: 'locked-choice', category: 'general', title: '门槛测试', text: '需要准备。', sourceCategory: '测试', choices: [
    { label: '支付费用', effects: { money: -20 } }, { label: '凭学历申请', requiresStats: { education: 70 }, effects: {} },
    { label: '凭证书申请', requiresFlags: ['certificate'], effects: {} },
    { label: '通过风险审核', maxStats: { risk: 40 }, effects: {} }, { label: '暂时等待', effects: {} }
  ] };
  const simulation = isolatedEngine({ events: [...clone(data.events), event] }), state = simulation.create({ region: 'us', seed: 'locked' });
  readNotices(state, simulation); readNotices(state); state.pending = event.id; state.phase = 'extra'; state.stats.money = 0; state.stats.education = 10; state.stats.risk = 80; state.flags = [];
  for (const index of [0, 1, 2, 3]) {
    const status = simulation.choiceStatus(state, index), before = clone(state);
    assert.equal(status.available, false); assert.ok(status.reason);
    assert.throws(() => simulation.choose(state, index)); assert.deepEqual(clone(state), before);
  }
  assert.equal(simulation.choiceStatus(state, 4).available, true);
  state.stats.money = 20; state.stats.education = 70; state.stats.risk = 40; state.flags.push('certificate');
  for (const index of [0, 1, 2, 3]) assert.equal(simulation.choiceStatus(state, index).available, true);
});

test('choosing a migration changes future local opportunities and preserves the birthplace', () => {
  const event = data.events.find(event => event.choices?.some(choice => choice.move && !choice.requiresFlags?.length));
  assert.ok(event, 'content needs a playable migration');
  const index = event.choices.findIndex(choice => choice.move && !choice.requiresFlags?.length);
  const destination = event.choices[index].move, origin = event.region || regionIds.find(region => region !== destination);
  const state = engine.create({ region: origin, seed: 'migration-choice' });
  readNotices(state); state.pending = event.id; state.phase = 'extra'; state.stats = { health: 90, money: 200, education: 100, family: 80, risk: 0 };
  assert.equal(engine.choiceStatus(state, index).available, true); engine.choose(state, index);
  assert.equal(state.person.origin, origin); assert.equal(state.person.region, destination);
  assert.equal(engine.eligible({ id: 'new-local', region: destination }, state), true);
  if (origin !== destination) assert.equal(engine.eligible({ id: 'old-local', region: origin }, state), false);
});

test('spending actions and investment cannot strand the pending event without a choice', () => {
  const state = engine.create({ region: 'us', seed: 'pending-budget-guard' });
  readNotices(state); state.pending = 'g07'; state.phase = 'extra'; state.stats.money = 8;
  state.flags = ['correspondent']; state.flagDates = { correspondent: -1 };
  assert.equal(engine.validate(state), true);
  assert.equal(engine.tradeStatus(state, 'savings', 'buy', 1).available, false);
  assert.equal(engine.actionStatus(state, 'rest').available, false);
  const before = clone(state);
  assert.throws(() => engine.trade(state, 'savings', 'buy', 1));
  assert.deepEqual(clone(state), before);
  assert.equal(engine.actionStatus(state, 'study').available, true);
  engine.act(state, 'study'); assert.equal(state.stats.money, 4);
  assert.equal(engine.actionStatus(state, 'caution').available, false);
  assert.ok(availableChoices(engine, state).length > 0);
});

test('a follow-up can appear only in later months and only after the enabling decision', () => {
  const first = clone(data.events.find(event => event.id === 'm196201'));
  first.choices = [{label:'开启后续',effects:{},addFlags:['test_followup']},{label:'不再追问',effects:{}}];
  const followup = { id:'test-followup',category:'followup',title:'回信',text:'时间留下痕迹。',requires:['test_followup'],choices:[{label:'继续',effects:{},addFlags:['followup_complete']},{label:'搁置',effects:{}}] };
  const simulation=isolatedEngine({events:[first,followup],worldEvents:[],incidents:[]});
  const state=simulation.create({region:'us',seed:'delayed-branch'});state.pending=first.id;state.phase='extra';
  const declined=clone(state);simulation.choose(state,0);simulation.choose(declined,1);
  assert.equal(state.pending,null);assert.equal(state.flagDates.test_followup,0);
  for(let i=0;i<12&&!state.pending;i++)simulation.advance(state);
  assert.equal(state.pending,followup.id);assert.ok(state.elapsedMonths>0);
  simulation.choose(state,0);assert.ok(state.flags.includes('followup_complete'));
  for(let i=0;i<12;i++){simulation.advance(declined);assert.notEqual(declined.pending,followup.id);}
});

test('each monthly action benefits its statistic, consumes time and resets next month', () => {
  for (const [action, stat, direction] of [['work', 'money', 1], ['study', 'education', 1], ['rest', 'health', 1], ['family', 'family', 1], ['caution', 'risk', -1]]) {
    const state = engine.create({ region: 'us', seed: `action-${action}` }); state.stats = { health: 55, money: 200, education: 45, family: 45, risk: 45 };
    const before = state.stats[stat]; assert.equal(engine.actionStatus(state, action).available, true, action);
    engine.act(state, action); assert.ok((state.stats[stat] - before) * direction > 0, action); assert.equal(engine.inspect(state).actionsRemaining, 1);
    engine.act(state, action); assert.equal(engine.inspect(state).actionsRemaining, 0); assert.equal(engine.actionStatus(state, action).available, false);
    const after = clone(state); assert.throws(() => engine.act(state, action)); assert.deepEqual(clone(state), after);
    resolveMonth(state); engine.advance(state); assert.equal(engine.inspect(state).actionsRemaining, 2);
  }
});

test('buying and selling transfer cash into holdings without creating wealth', () => {
  for (const asset of assets) {
    const state = engine.create({ region: 'us', seed: `trade-${asset}` }); state.stats.money = 200;
    const worth = engine.inspect(state).netWorth; assert.equal(engine.tradeStatus(state, asset, 'buy', 2).available, true);
    engine.trade(state, asset, 'buy', 2); assert.equal(state.finance.holdings[asset], 2); assert.equal(state.stats.money, 200 - state.finance.prices[asset] * 2); assert.equal(engine.inspect(state).netWorth, worth);
    engine.trade(state, asset, 'sell', 2); assert.equal(state.finance.holdings[asset], 0); assert.equal(state.stats.money, 200); assert.equal(engine.inspect(state).netWorth, worth);
  }
});

test('trade guards reject unaffordable purchases, absent holdings and invalid quantities', () => {
  const state = engine.create({ region: 'us', seed: 'trade-guards' }); state.stats.money = 0;
  const cases = [['savings', 'buy', 1], ['bonds', 'sell', 1], ['unknown', 'buy', 1], ['savings', 'hold', 1], ...[0, -1, 0.5, Infinity, '1', null].map(quantity => ['savings', 'buy', quantity])];
  for (const [asset, side, quantity] of cases) {
    const before = clone(state), status = engine.tradeStatus(state, asset, side, quantity);
    assert.equal(status.available, false, JSON.stringify([asset, side, quantity])); assert.ok(status.reason);
    assert.throws(() => engine.trade(state, asset, side, quantity)); assert.deepEqual(clone(state), before);
  }
});

test('investments pay income and market prices update when a month passes', () => {
  const state = engine.create({ region: 'us', seed: 'monthly-investments' }); state.stats.money = 1000;
  for (const asset of ['savings', 'bonds']) engine.trade(state, asset, 'buy', 5);
  const control = clone(state); control.finance.holdings = { savings: 0, bonds: 0, industry: 0 };
  const initialPrices = clone(state.finance.prices); resolveMonth(state); resolveMonth(control); engine.advance(state); engine.advance(control);
  assert.deepEqual(clone(state.finance.holdings), { savings: 5, bonds: 5, industry: 0 });
  assert.ok(state.stats.money > control.stats.money, 'deposits and bonds must pay income'); assert.notDeepEqual(clone(state.finance.prices), initialPrices);
  assert.ok(engine.inspect(state).invested > 0); assert.ok(engine.inspect(state).netWorth > state.stats.money);
});

test('money can exceed 100 while the other statistics stay bounded', () => {
  const state = engine.create({ region: 'us', seed: 'uncapped-cash' }); state.stats.money = 1000; assert.equal(engine.validate(state), true);
  engine.act(state, 'work'); assert.ok(state.stats.money > 1000); state.stats.health = 99; engine.act(state, 'rest');
  assert.equal(state.stats.health, 100); assert.equal(engine.validate(state), true);
});

test('education, health, family and risk change the monthly budget in useful directions', () => {
  const state = engine.create({ region: 'us', seed: 'stat-budget' });
  state.stats = { health: 60, money: 50, education: 20, family: 50, risk: 20 };
  const base = engine.inspect(state);
  const changed = (stat, value) => { const copy = clone(state); copy.stats[stat] = value; return engine.inspect(copy); };
  assert.ok(changed('education', 70).income > base.income, 'education must improve earning power');
  assert.ok(changed('health', 20).income < base.income, 'poor health must affect work');
  assert.ok(changed('health', 20).expenses > base.expenses, 'poor health must add a cost');
  assert.ok(changed('family', 80).expenses < base.expenses, 'close family must provide practical support');
  assert.ok(changed('family', 20).expenses > base.expenses, 'estrangement must carry a cost');
  assert.ok(changed('risk', 80).balance < base.balance, 'high risk must affect livelihood');
  for (const stat of statNames) assert.ok(base.stats[stat].label && base.stats[stat].description);
  resolveMonth(state);
  const budget = engine.inspect(state);
  engine.advance(state);
  assert.equal(state.finance.lastReport.income, budget.income);
  assert.equal(state.finance.lastReport.expenses, budget.expenses);
  assert.ok(state.finance.lastReport.changes);
});

test('world events wait for their month and local effects only reach affected residents', () => {
  const worldEvents = [
    { id: 'test-local-crisis', year: 1962, month: 2, title: '局部危机', text: '一个地区受到冲击。', regions: ['us'], effects: { money: -15, risk: 10 } },
    { id: 'test-global-news', year: 1962, month: 2, title: '国际消息', text: '所有地区都能收到消息。', effects: { education: 4 } }
  ];
  const simulation = isolatedEngine({ worldEvents, events:[], incidents:[] }), affected = simulation.create({ region: 'us', seed: 'world-month' }), unaffected = clone(affected);
  unaffected.person.region = 'de';
  for (const state of [affected, unaffected]) {
    resolveMonth(state, simulation); state.stats = { health: 80, money: 100, education: 50, family: 50, risk: 30 }; state.rng = 123456;
    assert.equal(state.world.news.length, 0); simulation.advance(state); assert.equal(monthKey(state), '1962-02');
  }
  const clean = isolatedEngine({ worldEvents: [worldEvents[1]], events:[], incidents:[] }), control = clean.create({ region: 'us', seed: 'world-month' });
  resolveMonth(control, clean); control.stats = { health: 80, money: 100, education: 50, family: 50, risk: 30 }; control.rng = 123456; clean.advance(control);
  assert.equal(control.stats.money - affected.stats.money, 15); assert.equal(affected.stats.risk - control.stats.risk, 10);
  assert.equal(unaffected.stats.money, control.stats.money); assert.equal(unaffected.stats.risk, control.stats.risk);
  assert.deepEqual(clone(affected.world.news), clone(unaffected.world.news)); assert.equal(affected.world.news.length, 2); assert.ok(affected.world.news.every(news => news.month === 2));
});

test('death stops processing immediately and ended lives cannot resume', () => {
  const simulation = isolatedEngine({ worldEvents: [
    { id: 'fatal', year: 1962, month: 2, title: '致命事故', text: '事故导致人生终止。', effects: { health: -100 } },
    { id: 'recovery', year: 1962, month: 2, title: '后续援助', text: '援助抵达时已太迟。', effects: { health: 100 } }
  ] }), state = simulation.create({ region: 'us', seed: 'world-death' });
  resolveMonth(state, simulation); simulation.advance(state); assert.equal(state.status, 'ended'); assert.equal(state.stats.health, 0); assert.equal(state.world.news.length, 1);
  const ended = clone(state); simulation.advance(state); simulation.choose(state, 0);
  assert.equal(simulation.actionStatus(state, 'rest').available, false); assert.equal(simulation.tradeStatus(state, 'savings', 'buy', 1).available, false); assert.deepEqual(clone(state), ended);
});

test('120 random lives use available choices and unique route-compatible news', () => {
  const observed = Object.fromEntries(Object.keys(data.routes).map(key => [key, new Set()])), births = new Set();
  for (let seed = 0; seed < 120; seed++) {
    const state = engine.create({ region: 'random', seed: `batch-${seed}` }); births.add(state.person.origin);
    for (const key of Object.keys(observed)) observed[key].add(state.world.routes[key]);
    finish(state, { strategy: (options, current, turn) => options[(seed + turn + current.month) % options.length].index });
    const ids = state.world.news.map(news => news.id); assert.equal(new Set(ids).size, ids.length);
    for (const news of state.world.news) {
      const event = data.worldEvents.find(event => event.id === news.id); assert.ok(event);
      assert.ok((news.year - 1962) * 12 + news.month - 1 <= state.elapsedMonths);
      if (event.route) assert.equal(state.world.routes[event.route.key], event.route.id);
    }
  }
  assert.deepEqual([...births].sort(), [...regionIds].sort());
  for (const key of Object.keys(observed)) assert.deepEqual([...observed[key]].sort(), Array.from(data.routes[key], route => route.id).sort());
});

test('v1 migration is explicit, immutable and resumes in the correct January', () => {
  const old = legacyState();
  const news = data.worldEvents.find(event => event.id === 'w01');
  old.world.news.push({ id: news.id, year: news.year, title: news.title, text: news.text }); old.seen.push(news.id);
  old.history.splice(1, 0, { year: news.year, age: news.year - 1944, type: 'world', title: news.title, text: news.text });
  const before = clone(old); assert.equal(engine.validate(old), false);
  const state = engine.migrate(old); assert.ok(state); assert.deepEqual(old, before); assert.equal(engine.validate(state), true);
  assert.equal(state.version, 3); assert.equal(monthKey(state), '1965-01'); assert.equal(state.elapsedMonths, 36); assert.equal(state.pending, 'g01');
  assert.ok(state.history.every(entry => entry.month === 1)); assert.deepEqual(clone(state.finance.holdings), { savings: 0, bonds: 0, industry: 0 });
  assert.equal(state.world.news[0].month, 1); assert.equal(state.world.news[0].legacy, true);
  resolveMonth(state); engine.advance(state); assert.equal(monthKey(state), '1965-02'); assert.equal(engine.validate(state), true);
});

test('resolved v1 lives resume without inventing a compulsory decision', () => {
  const old=legacyState();old.pending=null;
  const before=clone(old),state=engine.migrate(old);
  assert.ok(state);assert.deepEqual(old,before);assert.equal(engine.validate(state),true);
  assert.equal(monthKey(state),'1965-01');assert.equal(state.phase,'done');assert.equal(state.pending,null);
});

test('v2 migration retains money, portfolio, pending choice and random state', () => {
  const old=engine.create({region:'gd',seed:'monthly-backup'});readNotices(old);
  old.stats.money=200;engine.trade(old,'bonds','buy',2);old.version=2;
  delete old.inbox;delete old.incidentDates;
  const before=clone(old),state=engine.migrate(old);
  assert.ok(state);assert.deepEqual(clone(old),before);assert.deepEqual(clone(state.finance),clone(old.finance));
  assert.equal(state.rng,old.rng);assert.equal(state.pending,old.pending);assert.equal(engine.validate(state),true);
});

test('non-choice events apply once, require only acknowledgement and survive JSON saves', () => {
  const s=engine.create({region:'cn',seed:'personal-popup'});
  assert.equal(s.pending,null);assert.equal(engine.notice(s).type,'personal');assert.equal(engine.notice(s).choices,undefined);
  const before=clone(s);engine.advance(s);assert.deepEqual(clone(s),before);
  const resumed=clone(s),stats=clone(s.stats),rng=s.rng;
  engine.dismiss(s);engine.dismiss(resumed);engine.dismiss(s);
  assert.deepEqual(clone(s.stats),stats);assert.equal(s.rng,rng);assert.deepEqual(clone(s),clone(resumed));
  assert.equal(s.inbox.length,0);engine.advance(s);assert.equal(s.elapsedMonths,1);
});

test('world announcements arrive before personal news and acknowledging never reapplies effects', () => {
  const simulation=isolatedEngine({worldEvents:[{id:'arrival',year:1962,month:1,title:'世界新闻',text:'广播抵达。',effects:{money:-5}}]});
  const s=simulation.create({region:'us',seed:'world-queue'});
  assert.equal(simulation.notice(s).type,'world');assert.equal(s.inbox[1].type,'personal');
  const stats=clone(s.stats);simulation.dismiss(s);simulation.dismiss(s);
  assert.deepEqual(clone(s.stats),stats);assert.equal(s.world.news.length,1);assert.equal(simulation.validate(s),true);
});

test('validation rejects malformed calendars, holdings, finances and future records', () => {
  const valid = engine.create({ region: 'us', seed: 'validation' }); assert.equal(engine.validate(clone(valid)), true);
  for (const invalid of [null, undefined, {}, [], { version: 1 }]) assert.equal(engine.validate(invalid), false);
  const corruptions = [
    state => { state.inbox = null; }, state => { state.incidentDates = []; }, state => { state.inbox[0].eventId = 'unknown'; }, state => { state.year = 2050; }, state => { state.month = 0; }, state => { state.month = 13; }, state => { state.elapsedMonths = 1; }, state => { state.age = -1; },
    state => { state.stats.health = NaN; }, state => { state.stats.money = -1; }, state => { state.stats.family = 101; }, state => { state.person.region = 'unknown'; },
    state => { state.world.routes.us = 'unknown'; }, state => { state.pending = 'unknown'; }, state => { state.status = 'unknown'; }, state => { state.seen = null; },
    state => { state.finance.holdings.savings = -1; }, state => { state.finance.holdings.bonds = 0.5; }, state => { state.finance.prices.industry = Infinity; },
    state => { state.finance.prices.savings = 0; }, state => { state.finance.actionsUsed = 3; }, state => { state.history[0].month = 12; }
  ];
  for (const corrupt of corruptions) { const invalid = clone(valid); corrupt(invalid); assert.equal(engine.validate(invalid), false, `corruption accepted: ${corrupt}`); }
});
