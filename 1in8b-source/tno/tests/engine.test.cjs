'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Load the same ordinary scripts used by index.html, without a DOM or server.
const runtime = vm.createContext({ console });
for (const file of ['data.js', 'engine.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), runtime, { filename: file });
}
const data = runtime.TNO_DATA;
const engine = runtime.TNO_ENGINE;
const clone = value => JSON.parse(JSON.stringify(value));
const statNames = ['health', 'money', 'education', 'family', 'risk'];
const personalById = new Map(data.events.map(event => [event.id, event]));
const regionIds = data.regions.map(region => region.id);

function isolatedEngine(worldEvents) {
  const fixture = clone(data);
  fixture.worldEvents = worldEvents;
  const isolated = vm.createContext({ console, TNO_DATA: fixture });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'engine.js'), 'utf8'), isolated, { filename: 'engine.js' });
  return isolated.TNO_ENGINE;
}

function assertSound(state) {
  assert.equal(engine.validate(state), true, `invalid state at ${state.year}: ${JSON.stringify(state)}`);
  assert.equal(state.age, state.year - 1944);
  assert.ok(state.year >= 1962 && state.year <= 1972);
  for (const name of statNames) {
    assert.ok(Number.isFinite(state.stats[name]), `${name} must be finite`);
    assert.ok(state.stats[name] >= 0 && state.stats[name] <= 100, `${name} out of range`);
  }
  if (state.pending) {
    assert.ok(personalById.has(state.pending), `unknown pending event ${state.pending}`);
    assert.equal(state.status, 'active');
  }
}

function finish(state, strategy = () => 0) {
  let turns = 0;
  const shown = new Set();
  while (state.status === 'active') {
    assertSound(state);
    assert.ok(turns < 100, 'a ten-year life must finish in fewer than 100 actions');
    if (state.pending) {
      assert.ok(!shown.has(state.pending), `personal event repeated: ${state.pending}`);
      shown.add(state.pending);
      const event = personalById.get(state.pending);
      assert.equal(engine.eligible(event, state), true, `ineligible pending event ${event.id}`);
      engine.choose(state, strategy(event, state, turns));
    } else {
      engine.advance(state);
    }
    turns++;
  }
  assertSound(state);
  assert.equal(state.pending, null);
  assert.ok(state.year === 1972 || state.stats.health === 0, 'early ending requires death');
  return state;
}

function clearPending(state) {
  if (state.pending) engine.choose(state, 0);
  return state;
}

test('content contains eight regions and the full 120 distinct Chinese events', () => {
  assert.equal(data.regions.length, 8);
  assert.equal(new Set(regionIds).size, 8);
  assert.equal(data.events.length, 104);
  assert.equal(data.events.filter(event => event.category === 'general').length, 40);
  assert.equal(data.worldEvents.length, 16);
  const all = [...data.events, ...data.worldEvents];
  assert.equal(new Set(all.map(event => event.id)).size, 120);
  for (const region of data.regions) {
    assert.equal(data.events.filter(event => event.category === 'regional' && event.region === region.id).length, 8, region.name);
    assert.ok(region.weight > 0);
    assert.match(region.name, /[\u3400-\u9fff]/);
  }
  for (const event of all) {
    assert.ok(event.id && event.title && event.text, `missing content in ${event.id}`);
    assert.match(event.title + event.text, /[\u3400-\u9fff]/);
    assert.ok(event.sourceCategory, `missing provenance category in ${event.id}`);
    if (event.choices) {
      assert.ok(event.choices.length >= 2, `${event.id} must offer a real choice`);
      for (const choice of event.choices) {
        assert.match(choice.label, /[\u3400-\u9fff]/);
        if (choice.move) assert.ok(regionIds.includes(choice.move), `unknown destination in ${event.id}`);
        for (const [stat, value] of Object.entries(choice.effects || {})) {
          assert.ok(statNames.includes(stat), `unknown stat ${stat}`);
          assert.ok(Number.isFinite(value));
        }
      }
    }
    if (event.route) {
      assert.ok(data.routes[event.route.key].some(route => route.id === event.route.id), `unknown route in ${event.id}`);
    }
  }
});

test('all eight regions support creation, choices, annual progression and an ending', () => {
  for (const region of regionIds) {
    const state = engine.create({ region, seed: `region-completion-${region}` });
    assert.equal(state.year, 1962);
    assert.equal(state.age, 18);
    assert.equal(state.person.region, region);
    assert.equal(state.person.origin, region);
    finish(state);
    const report = engine.summary(state);
    for (const key of ['title', 'text', 'career', 'family', 'outlook', 'reason']) {
      assert.ok(typeof report[key] === 'string' && report[key].length > 0, `missing summary ${key}`);
    }
    assert.ok(Array.isArray(report.world));
  }
});

test('event prerequisites refer to flags that the game can actually produce', () => {
  const producedFlags = new Set();
  for (const event of [...data.events, ...data.worldEvents]) {
    for (const flag of event.addFlags || []) producedFlags.add(flag);
    for (const choice of event.choices || []) {
      for (const flag of choice.addFlags || []) producedFlags.add(flag);
    }
  }
  for (const event of [...data.events, ...data.worldEvents]) {
    for (const flag of event.requires || []) {
      assert.ok(producedFlags.has(flag), `${event.id} requires an unreachable flag: ${flag}`);
    }
    if (event.minYear !== undefined) assert.ok(event.minYear <= 1971, `${event.id} opens after personal simulation ends`);
    if (event.maxYear !== undefined) assert.ok(event.maxYear >= 1962, `${event.id} expires before simulation starts`);
    if (event.minAge !== undefined) assert.ok(event.minAge <= 27, `${event.id} requires an age unavailable to personal events`);
    if (event.maxAge !== undefined) assert.ok(event.maxAge >= 18, `${event.id} expires before adulthood`);
  }
});

test('the same seed and choices reproduce a complete life exactly', () => {
  for (const region of [...regionIds, 'random']) {
    const first = engine.create({ region, seed: '同一份档案：1962' });
    const second = engine.create({ region, seed: '同一份档案：1962' });
    assert.deepEqual(clone(first), clone(second));
    const strategy = (event, state, turn) => turn % event.choices.length;
    finish(first, strategy);
    finish(second, strategy);
    assert.deepEqual(clone(first), clone(second));
  }
});

test('JSON save and resume preserves random state, pending choices and outcomes', () => {
  for (const region of regionIds) {
    const original = engine.create({ region, seed: `resume-${region}` });
    for (let turn = 0; turn < 7 && original.status === 'active'; turn++) {
      if (original.pending) engine.choose(original, 0);
      else engine.advance(original);
    }
    const resumed = clone(original);
    assert.equal(engine.validate(resumed), true);
    const strategy = (event, state) => state.year % event.choices.length;
    finish(original, strategy);
    finish(resumed, strategy);
    assert.deepEqual(clone(original), clone(resumed));
  }
});

test('an unresolved choice cannot be skipped and invalid choices do not corrupt state', () => {
  const state = engine.create({ region: regionIds[0], seed: 'choice-guard' });
  assert.ok(state.pending);
  const before = clone(state);
  engine.advance(state);
  assert.deepEqual(clone(state), before);
  const event = personalById.get(state.pending);
  for (const index of [-1, event.choices.length, NaN, 0.5, '0', null]) {
    assert.throws(() => engine.choose(state, index), { name: 'RangeError' });
    assert.deepEqual(clone(state), before);
  }
});

test('eligibility enforces region, age, year, profession, route and prerequisite flags', () => {
  const state = engine.create({ region: regionIds[0], seed: 'eligibility' });
  state.pending = null;
  const event = { id: 'eligibility-probe', category: 'general', title: '条件测试', text: '测试', choices: [] };
  assert.equal(engine.eligible(event, state), true);
  assert.equal(engine.eligible({ ...event, region: regionIds[1] }, state), false);
  assert.equal(engine.eligible({ ...event, minAge: 19 }, state), false);
  assert.equal(engine.eligible({ ...event, maxAge: 17 }, state), false);
  assert.equal(engine.eligible({ ...event, minYear: 1963 }, state), false);
  assert.equal(engine.eligible({ ...event, maxYear: 1961 }, state), false);
  assert.equal(engine.eligible({ ...event, jobs: ['不存在的职业'] }, state), false);
  assert.equal(engine.eligible({ ...event, jobs: [state.person.job] }, state), true);
  assert.equal(engine.eligible({ ...event, route: { key: 'us', id: 'impossible-route' } }, state), false);
  assert.equal(engine.eligible({ ...event, route: { key: 'us', id: state.world.routes.us } }, state), true);
  assert.equal(engine.eligible({ ...event, requires: ['test-personal-flag'] }, state), false);
  state.flags.push('test-personal-flag');
  assert.equal(engine.eligible({ ...event, requires: ['test-personal-flag'] }, state), true);
  assert.equal(engine.eligible({ ...event, excludes: ['test-personal-flag'] }, state), false);
  state.world.flags.push('test-world-flag');
  assert.equal(engine.eligible({ ...event, requires: ['test-world-flag'] }, state), true);
  assert.equal(engine.eligible({ ...event, excludes: ['test-world-flag'] }, state), false);
  state.seen.push(event.id);
  assert.equal(engine.eligible(event, state), false);
});

test('migration changes local event eligibility while preserving the birth region', () => {
  const migratory = data.events.find(event => event.choices.some(choice => choice.move && choice.move !== event.region));
  assert.ok(migratory, 'at least one playable choice must allow migration');
  const index = migratory.choices.findIndex(choice => choice.move && choice.move !== migratory.region);
  const target = migratory.choices[index].move;
  const origin = migratory.region || regionIds.find(region => region !== target);
  const state = engine.create({ region: origin, seed: 'migration' });
  state.pending = migratory.id;
  state.stats.health = 80;
  engine.choose(state, index);
  assert.equal(state.person.origin, origin);
  assert.equal(state.person.region, target);
  const base = { id: 'migration-probe', category: 'regional', choices: [] };
  assert.equal(engine.eligible({ ...base, region: origin }, state), false);
  assert.equal(engine.eligible({ ...base, region: target }, state), true);
});

test('zero health from a choice ends life immediately and an ended life cannot resume', () => {
  const fatalEvent = data.events.find(event => event.choices.some(choice => (choice.effects?.health || 0) < 0));
  assert.ok(fatalEvent);
  const index = fatalEvent.choices.findIndex(choice => (choice.effects?.health || 0) < 0);
  const state = engine.create({ region: fatalEvent.region || regionIds[0], seed: 'choice-death' });
  state.pending = fatalEvent.id;
  state.stats.health = 1;
  const year = state.year;
  engine.choose(state, index);
  assert.equal(state.stats.health, 0);
  assert.equal(state.status, 'ended');
  assert.equal(state.pending, null);
  assert.equal(state.year, year);
  const dead = clone(state);
  engine.advance(state);
  engine.choose(state, 0);
  assert.deepEqual(clone(state), dead);
});

test('existing zero health cannot be revived by annual drift', () => {
  const state = clearPending(engine.create({ region: regionIds[0], seed: 'annual-death' }));
  state.stats.health = 0;
  engine.advance(state);
  assert.equal(state.status, 'ended');
  assert.equal(state.stats.health, 0);
  assert.equal(state.pending, null);
});

test('world news is global but regional effects only change residents of affected regions', () => {
  const simulation = isolatedEngine([
    { id: 'test-local-crisis', year: 1963, title: '局部危机', text: '一个地区受到冲击。', regions: [regionIds[0]], effects: { money: -15, risk: 10 } },
    { id: 'test-global-news', year: 1963, title: '国际消息', text: '所有地区都能收到消息。', effects: { education: 4 } }
  ]);
  const affected = simulation.create({ region: regionIds[0], seed: 'local-world-effects' });
  const unaffected = simulation.create({ region: regionIds[1], seed: 'local-world-effects' });
  for (const [index, state] of [affected, unaffected].entries()) {
    simulation.choose(state, 0);
    state.pending = null;
    state.person.region = regionIds[index];
    state.person.job = '工人';
    for (const stat of statNames) state.stats[stat] = 50;
    state.rng = 123456;
    simulation.advance(state);
    assert.equal(simulation.validate(state), true);
  }
  assert.equal(unaffected.stats.money - affected.stats.money, 15);
  assert.equal(affected.stats.risk - unaffected.stats.risk, 10);
  assert.equal(affected.stats.education, unaffected.stats.education);
  assert.deepEqual(clone(affected.world.news), clone(unaffected.world.news));
  assert.equal(affected.world.news.length, 2);
});

test('fatal world events stop processing before a later event can revive the character', () => {
  const simulation = isolatedEngine([
    { id: 'test-fatal-world', year: 1963, title: '致命事故', text: '事故导致人生终止。', effects: { health: -100 } },
    { id: 'test-later-recovery', year: 1963, title: '后续援助', text: '援助抵达时已太迟。', effects: { health: 100 } }
  ]);
  const state = simulation.create({ region: regionIds[0], seed: 'world-death' });
  simulation.choose(state, 0);
  state.stats.health = 100;
  simulation.advance(state);
  assert.equal(state.status, 'ended');
  assert.equal(state.stats.health, 0);
  assert.equal(state.world.news.length, 1);
  assert.equal(state.world.news[0].id, 'test-fatal-world');
  assert.equal(simulation.validate(state), true);
});

test('240 random seeds finish safely and reach every declared route and birth region', () => {
  const observed = Object.fromEntries(Object.keys(data.routes).map(key => [key, new Set()]));
  const births = new Set();
  const worldById = new Map(data.worldEvents.map(event => [event.id, event]));
  const observedWorld = new Set();
  for (let seed = 0; seed < 240; seed++) {
    const state = engine.create({ region: 'random', seed: `batch-${seed}` });
    births.add(state.person.origin);
    for (const key of Object.keys(observed)) observed[key].add(state.world.routes[key]);
    finish(state, (event, current, turn) => (seed + turn) % event.choices.length);
    const newsIds = state.world.news.map(news => news.eventId || news.id);
    assert.equal(new Set(newsIds).size, newsIds.length, 'world news must not repeat');
    for (const id of newsIds) {
      assert.ok(worldById.has(id), `unknown world news ${id}`);
      observedWorld.add(id);
      const event = worldById.get(id);
      assert.ok(event.year <= state.year, `future world event ${id}`);
      if (event.route) assert.equal(state.world.routes[event.route.key], event.route.id, `incompatible world route ${id}`);
    }
  }
  assert.deepEqual([...births].sort(), [...regionIds].sort());
  for (const key of Object.keys(observed)) {
    assert.deepEqual([...observed[key]].sort(), Array.from(data.routes[key], route => route.id).sort(), `${key} routes must all be reachable`);
  }
  assert.equal(observedWorld.size, data.worldEvents.length, 'every world event must be reachable');
});

test('validation rejects corrupted saves and accepts a normal JSON round trip', () => {
  const valid = engine.create({ region: regionIds[0], seed: 'validation' });
  assert.equal(engine.validate(clone(valid)), true);
  for (const invalid of [null, undefined, {}, [], { version: 'old' }]) {
    assert.equal(engine.validate(invalid), false);
  }
  const corruptions = [
    state => { state.year = 2050; },
    state => { state.age = -1; },
    state => { state.stats.health = NaN; },
    state => { state.stats.money = 101; },
    state => { state.stats.family = -1; },
    state => { state.person.region = 'unknown-region'; },
    state => { state.world.routes.us = 'unknown-route'; },
    state => { state.pending = 'unknown-event'; },
    state => { state.status = 'unknown-status'; },
    state => { state.seen = null; }
  ];
  for (const corrupt of corruptions) {
    const invalid = clone(valid);
    corrupt(invalid);
    assert.equal(engine.validate(invalid), false, `corruption accepted: ${corrupt}`);
  }
});
