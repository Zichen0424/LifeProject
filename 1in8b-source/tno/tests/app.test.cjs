'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const directory = path.join(__dirname, '..');
const scripts = Object.fromEntries(['data.js', 'engine.js', 'scene.js', 'app.js'].map(file => [file, fs.readFileSync(path.join(directory, file), 'utf8')]));
const KEY = 'tno.everyday.v3', OLD_KEY = 'tno.everyday.v1';

// This checks controller wiring and persistence. Actual layout is checked in a browser.
function browserFixture(initial = {}) {
  const storage = new Map(Object.entries(initial)), nodes = new Map(), listeners = new Map(), timers = new Map();
  let timerId = 0, writable = true;
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {
      innerHTML: '', textContent: '', hidden: false, value: id === 'seed' ? 'ui-smoke' : '', offsetWidth: 100,
      classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, removeAttribute() {},
      handlers: {}, addEventListener(type, callback) { (this.handlers[type] ||= []).push(callback); }, focus() {}, open:false, close() {this.open=false;}, showModal() {this.open=true;}
    });
    return nodes.get(id);
  }
  const document = {
    hidden: false, getElementById: node, querySelectorAll: () => [],
    addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(callback); }
  };
  const context = vm.createContext({
    console, document, window: { addEventListener() {}, scrollTo() {} },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem(key, value) { if (!writable) throw new Error('Storage quota exceeded'); storage.set(key, value); } },
    crypto: { getRandomValues(array) { array[0] = 123456; return array; } },
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; }, clearTimeout: id => timers.delete(id)
  });
  for (const file of ['data.js', 'engine.js', 'scene.js']) vm.runInContext(scripts[file], context, { filename: file });
  return {
    storage, nodes, context, timers,
    setWritable(value) { writable = value; },
    tick() { const next=timers.entries().next().value;if(!next)return false;timers.delete(next[0]);next[1]();return true; },
    confirm() { for (const callback of node('modal-confirm').handlers.click.splice(0)) callback(); },
    boot() { vm.runInContext(scripts['app.js'], context, { filename: 'app.js' }); },
    current() { return JSON.parse(storage.get(KEY)).current; },
    click(dataset) {
      const button = { dataset, disabled: false, matches: () => false, closest() { return this; } };
      for (const callback of listeners.get('click') || []) callback({ target: button, preventDefault() {} });
    },
    settle() {
      let count = 0;
      while (this.current().pending || this.current().inbox.length) {
        if(this.current().inbox.length){this.click({action:'ack-story'});continue;}
        assert.ok(count++ < 2);
        const state = this.current(), event = context.TNO_ENGINE.event(state);
        const index = event.choices.findIndex((choice, i) => context.TNO_ENGINE.choiceStatus(state, i).available);
        assert.ok(index >= 0); this.click({ choice: String(index) });
      }
    }
  };
}

function legacyState(fixture) {
  const state = JSON.parse(JSON.stringify(fixture.context.TNO_ENGINE.create({ region: 'us', seed: 'old-browser-save' })));
  state.version = 1; state.pending = 'g01'; state.flags = []; state.seen = []; state.world.news = []; state.world.flags = [];
  state.history = [{ year: 1962, age: 18, type: 'system', title: '旧档案', text: '保留原始档案。' }];
  state.stats.money = 40;
  for (const key of ['month', 'elapsedMonths', 'finance', 'flagDates', 'phase']) delete state[key];
  return state;
}

test('UI starts a monthly save and connects choices, actions, investments and advance', () => {
  const fixture = browserFixture(); fixture.boot(); fixture.click({ region: 'us' }); fixture.click({ action: 'start' });
  const initial = fixture.current();
  assert.equal(initial.version, 3); assert.equal(initial.year, 1962); assert.equal(initial.month, 1);
  assert.match(fixture.nodes.get('main').innerHTML, /data-life-action=/);
  assert.match(fixture.nodes.get('main').innerHTML, /data-trade=/);
  assert.match(fixture.nodes.get('main').innerHTML, /01月|1 月|1月|01 月/);
  fixture.settle();
  fixture.click({ trade: 'savings', side: 'buy' });
  const invested = fixture.current(); assert.equal(invested.finance.holdings.savings, 1);
  assert.equal(invested.stats.money, initial.stats.money - initial.finance.prices.savings);
  fixture.click({ lifeAction: 'work' }); assert.equal(fixture.current().finance.actionsUsed, 2);
  fixture.settle(); fixture.click({ action: 'advance' });
  assert.equal(fixture.current().month, 2); assert.equal(fixture.current().finance.actionsUsed, 0);
  assert.equal(fixture.storage.has(OLD_KEY), false);
});

test('loading v1 explicitly migrates into v3 and preserves the complete original key', () => {
  const fixture = browserFixture(), old = legacyState(fixture);
  const backup = JSON.stringify({ version: 1, current: old, records: [] }); fixture.storage.set(OLD_KEY, backup);
  fixture.boot();
  assert.equal(fixture.storage.get(OLD_KEY), backup);
  assert.equal(fixture.current().version, 3); assert.equal(fixture.current().month, 1);
  assert.equal(fixture.context.TNO_ENGINE.validate(fixture.current()), true);
  assert.match(fixture.nodes.get('notice').textContent, /迁移|升级|月度|生活纪事/);
  fixture.click({ action: 'continue' }); fixture.click({ lifeAction: 'work' });
  assert.equal(fixture.storage.get(OLD_KEY), backup, 'new progress must never overwrite the annual backup');
});

test('an existing v3 save takes precedence over an older v1 backup', () => {
  const fixture = browserFixture();
  const current = fixture.context.TNO_ENGINE.create({ region: 'jp', seed: 'current-v2' });
  const old = JSON.stringify({ version: 1, current: legacyState(fixture), records: [] });
  fixture.storage.set(KEY, JSON.stringify({ version: 3, current, records: [] })); fixture.storage.set(OLD_KEY, old);
  fixture.boot(); fixture.click({ action: 'continue' }); fixture.click({ lifeAction: 'work' });
  assert.equal(fixture.current().seed, 'current-v2'); assert.equal(fixture.current().person.origin, 'jp');
  assert.equal(fixture.storage.get(OLD_KEY), old);
});

test('completed v1 records migrate even when there is no current life', () => {
  const fixture = browserFixture(), ended = legacyState(fixture);
  ended.year = 1972; ended.age = 28; ended.pending = null; ended.status = 'ended';
  ended.ending = { reason: 'period', title: '旧档案归柜', text: '年度制十年已经结束。' };
  const backup = JSON.stringify({ version: 1, current: null, records: [ended] }); fixture.storage.set(OLD_KEY, backup);
  fixture.boot();
  const saved = JSON.parse(fixture.storage.get(KEY));
  assert.equal(saved.current, null); assert.equal(saved.records.length, 1);
  assert.equal(saved.records[0].version, 3); assert.equal(saved.records[0].elapsedMonths, 120);
  assert.equal(fixture.context.TNO_ENGINE.validate(saved.records[0]), true); assert.equal(fixture.storage.get(OLD_KEY), backup);
  fixture.click({ view: 'archive' }); assert.match(fixture.nodes.get('main').innerHTML, /旧档案归柜/);
});

test('corrupted saved JSON is reported while a fresh game can still be created', () => {
  const fixture = browserFixture({ [KEY]: '{broken JSON' }); fixture.boot();
  assert.ok(fixture.nodes.get('notice').textContent);
  fixture.click({ action: 'start' }); assert.equal(fixture.current().version, 3);
  assert.equal(fixture.context.TNO_ENGINE.validate(fixture.current()), true);
});

test('action success never hides a failed save and saving can recover later', () => {
  const fixture = browserFixture(); fixture.boot(); fixture.click({ region: 'us' }); fixture.click({ action: 'start' });
  fixture.setWritable(false); fixture.click({ lifeAction: 'work' });
  assert.match(fixture.nodes.get('notice').textContent, /存储|备份/);
  assert.match(fixture.nodes.get('save-status').textContent, /无法写入|临时/);
  assert.equal(fixture.current().finance.actionsUsed, 0, 'the prior persisted snapshot must remain intact');
  fixture.setWritable(true); fixture.click({ lifeAction: 'caution' });
  assert.equal(fixture.current().finance.actionsUsed, 2, 'both in-memory actions must survive storage recovery');
  assert.match(fixture.nodes.get('save-status').textContent, /已保存/);
});

test('same-seed endings keep distinct branches and deleting one preserves the others', () => {
  const fixture = browserFixture();
  function ending(money) {
    const state = legacyState(fixture);
    Object.assign(state, { year: 1972, age: 28, pending: null, status: 'ended', ending: { reason: 'period', title: '十年归档', text: '同一开局，不同选择。' } });
    state.stats.money = money; return state;
  }
  const backup = JSON.stringify({ version: 1, current: ending(50), records: [ending(40), ending(60)] });
  fixture.storage.set(OLD_KEY, backup); fixture.boot();
  let saved = JSON.parse(fixture.storage.get(KEY));
  assert.equal(saved.records.length, 3, 'migration persistence must append a different ending with the same id');
  assert.equal(new Set(saved.records.map(record => record.id)).size, 1);
  function remove(money) {
    const index = JSON.parse(fixture.storage.get(KEY)).records.findIndex(record => record.stats.money === money);
    assert.ok(index >= 0); fixture.click({ delete: String(index) }); fixture.confirm();
    return JSON.parse(fixture.storage.get(KEY));
  }
  saved = remove(60); assert.equal(saved.records.length, 2, 'persisting an already archived current life must not duplicate it');
  saved = remove(40); assert.equal(saved.records.length, 1); assert.equal(saved.records[0].stats.money, 50); assert.equal(saved.current.stats.money, 50);
  saved = remove(50); assert.equal(saved.records.length, 0); assert.equal(saved.current, null);
  assert.equal(fixture.storage.get(OLD_KEY), backup);
});

test('ordinary popups acknowledge without choices, persist dismissal and resume the running clock', () => {
  const fixture=browserFixture();fixture.boot();fixture.click({action:'start'});
  assert.equal(fixture.current().pending,null);assert.equal(fixture.nodes.get('story-modal').open,true);
  assert.match(fixture.nodes.get('story-content').innerHTML,/生活中的一件事/);
  assert.doesNotMatch(fixture.nodes.get('story-content').innerHTML,/data-choice=/);
  const stats=JSON.stringify(fixture.current().stats);
  fixture.click({action:'auto'});assert.equal(fixture.timers.size,0);
  fixture.click({action:'ack-story'});assert.equal(JSON.stringify(fixture.current().stats),stats);
  assert.equal(fixture.current().inbox.length,0);assert.equal(fixture.nodes.get('story-modal').open,false);
  assert.equal(fixture.timers.size,1);fixture.tick();assert.equal(fixture.current().month,2);
});

test('v2 lives upgrade to a separate v3 key and the monthly backup stays byte-for-byte intact', () => {
  const fixture=browserFixture(),old=fixture.context.TNO_ENGINE.create({region:'jp',seed:'v2-save'});
  old.version=2;delete old.inbox;delete old.incidentDates;
  const backup=JSON.stringify({version:2,current:old,records:[]});fixture.storage.set('tno.everyday.v2',backup);
  fixture.boot();assert.equal(fixture.current().version,3);assert.equal(fixture.storage.get('tno.everyday.v2'),backup);
});

test('the pixel scene is interactive and follows occupation, family, health and housing', () => {
  const fixture=browserFixture();fixture.boot();fixture.click({action:'start'});fixture.settle();
  assert.match(fixture.nodes.get('main').innerHTML,/像素生活场景/);assert.match(fixture.nodes.get('main').innerHTML,/data-scene-place="home"/);
  fixture.click({scenePlace:'home'});assert.equal(fixture.nodes.get('modal').open,true);assert.match(fixture.nodes.get('modal-content').innerHTML,/回到家里/);
  const s=fixture.current(),before=JSON.stringify(s),scene=fixture.context.TNO_SCENE;
  s.person.job='教师';s.stats.health=10;s.stats.money=150;s.stats.family=90;s.flags.push('child');
  const m=scene.model(s);assert.equal(m.work,'school');assert.equal(m.home,'improved');assert.equal(m.tired,true);assert.equal(m.child,true);
  assert.notEqual(scene.render(s),scene.render(JSON.parse(before)));const rng=s.rng;scene.render(s);assert.equal(s.rng,rng);
});
