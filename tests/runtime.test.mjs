import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { build, root, validateSettings, firebasePattern, revenuecatPattern } from '../tools/build.mjs';
import { audit } from '../tools/audit.mjs';

const firebase = 'https://firebaseremoteconfig.googleapis.com/v1/projects/locket-4252a/namespaces/firebase:fetch';
const revenuecat = 'https://api.revenuecat.com/v1/subscribers/test-user';
const settings = JSON.parse(await readFile(path.join(root, 'settings.json'), 'utf8'));
await build();
const programs = Object.fromEntries(await Promise.all(['remote-config', 'revenuecat'].map(async name => [name, new vm.Script(await readFile(path.join(root, `scripts/${name}.js`), 'utf8'))])));

function run(name, { url = name === 'remote-config' ? firebase : revenuecat, headers = { 'User-Agent': 'Locket/2.72.1' }, body, status = 200, responseHeaders = {} } = {}) {
  const calls = [], logs = [];
  const context = {
    $request: { url, headers },
    $done: value => calls.push(JSON.parse(JSON.stringify(value))),
    console: { log: value => logs.push(String(value)) }
  };
  if (body !== undefined) context.$response = { status, headers: responseHeaders, body: typeof body === 'string' ? body : JSON.stringify(body) };
  programs[name].runInNewContext(context, { timeout: 1000 });
  assert.equal(calls.length, 1);
  const output = calls[0];
  return { output, logs, body: output.body && JSON.parse(output.body) };
}

test('video target is generated from settings and preserves unrelated camera options', () => {
  const result = run('remote-config', { body: { entries: {
    camera: '{"gold_max_duration":5,"quality_mbps":2.5}',
    camera_roll: '{"max_duration":5,"trimmer":{"goldMaxDuration":5}}',
    video_max_duration_sec: '5', unrelated: 'keep'
  }, templateVersion: 'keep-version' } });
  assert.equal(JSON.parse(result.body.entries.camera).gold_max_duration, settings.videoSeconds);
  assert.equal(JSON.parse(result.body.entries.camera).quality_mbps, 2.5);
  assert.equal(JSON.parse(result.body.entries.camera_roll).trimmer.goldMaxDuration, settings.videoSeconds);
  assert.equal(result.body.entries.video_max_duration_sec, String(settings.videoSeconds));
  assert.equal(result.body.entries.unrelated, 'keep');
  assert.equal(result.body.templateVersion, 'keep-version');
});

test('v4 enables existing audio flags without changing audio session controls or duration rules', () => {
  const result = run('remote-config', { body: { entries: {
    camera: JSON.stringify({ gold_max_duration: 5, audio_enabled: false, microphone_enabled: 'false', future: 'keep' }),
    camera_roll: JSON.stringify({ video_sound_enabled: false, audio_enabled: false, max_duration: 5 }),
    video_audio_enabled: 'false',
    camera_roll_video_sound_enabled: 'false',
    audio_session_deactivation_enabled: 'false'
  } } });
  const camera = JSON.parse(result.body.entries.camera);
  const cameraRoll = JSON.parse(result.body.entries.camera_roll);
  assert.equal(camera.audio_enabled, true);
  assert.equal(camera.microphone_enabled, 'true');
  assert.equal(camera.gold_max_duration, settings.videoSeconds);
  assert.equal(camera.future, 'keep');
  assert.equal(cameraRoll.video_sound_enabled, true);
  assert.equal(cameraRoll.audio_enabled, true);
  assert.equal(result.body.entries.video_audio_enabled, 'true');
  assert.equal(result.body.entries.camera_roll_video_sound_enabled, 'true');
  assert.equal(result.body.entries.audio_session_deactivation_enabled, 'false');
  assert.ok(result.logs.some(line => line.includes('v4 audio input:') && line.includes('disabled:2')));
  assert.ok(result.logs.some(line => line.includes('v4 audio output:') && line.includes('enabled:2,disabled:0')));
});

test('v4 reports absent audio settings without fabricating them', () => {
  const result = run('remote-config', { body: { entries: { camera: '{"gold_max_duration":5}' } } });
  assert.equal('audio_enabled' in JSON.parse(result.body.entries.camera), false);
  assert.equal('video_audio_enabled' in result.body.entries, false);
  assert.ok(result.logs.some(line => line.includes('v4 audio input:') && line.includes('present:0,enabled:0,disabled:0')));
});

test('v4 keeps unsupported audio values and does not log their contents', () => {
  const result = run('remote-config', { body: { entries: {
    camera: JSON.stringify({ gold_max_duration: 5, audio_enabled: { private: 'private-data' }, sound_enabled: null }),
    microphone_enabled: 'private-mode'
  } } });
  assert.deepEqual(JSON.parse(result.body.entries.camera).audio_enabled, { private: 'private-data' });
  assert.equal(JSON.parse(result.body.entries.camera).sound_enabled, null);
  assert.equal(result.body.entries.microphone_enabled, 'private-mode');
  assert.equal(result.logs.join('\n').includes('private-'), false);
});

test('missing UI controls are supplied without inventing a filter catalog', () => {
  const result = run('remote-config', { body: { entries: { camera: '{"gold_max_duration":30}' } } });
  const config = JSON.parse(result.body.entries.camera_filter_config);
  assert.equal(config.showFilterButton, true);
  assert.equal(config.sheetEnabled, true);
  assert.equal('remoteFilters' in config, false);
  assert.equal('celebrity_filter_config' in result.body.entries, false);
  assert.ok(result.logs.some(line => line.includes('input schema: camera_filter_config=missing-or-invalid')));
});

test('catalog and identity survive edits, and diagnostics contain no image URL, prompt or ID', () => {
  const privateFilter = { id: 'private-id', imageUrl: 'https://private.invalid/photo', prompt: 'private-prompt' };
  const result = run('remote-config', { body: { entries: {
    camera_filter_config: JSON.stringify({ filters: [privateFilter], showFilterButton: false }),
    celebrity_filter_config: JSON.stringify({ celebrityUid: 'private-person', cameraFilterConfig: { filters: [privateFilter] } })
  } } });
  assert.deepEqual(JSON.parse(result.body.entries.camera_filter_config).filters, [privateFilter]);
  assert.equal(JSON.parse(result.body.entries.celebrity_filter_config).celebrityUid, 'private-person');
  assert.ok(result.logs.some(line => line.includes('filters:1')));
  assert.equal(result.logs.join('\n').includes('private'), false);
});

test('empty and malformed Remote Config responses are never replaced', () => {
  for (const body of ['bad-json', '', 'null', '[]', {}, { entries: {} }, { entries: { unrelated: 'keep' } }]) {
    assert.deepEqual(run('remote-config', { body }).output, {});
  }
  const result = run('remote-config', { body: { entries: { camera: '{"gold_max_duration":5}', camera_filter_config: '{bad', feature_gates: '[]' } } });
  assert.equal(result.body.entries.camera_filter_config, '{bad');
  assert.equal(result.body.entries.feature_gates, '[]');
});

test('HTTP errors and cache responses retain their real status and body', () => {
  for (const name of ['revenuecat', 'remote-config']) {
    for (const status of [304, 400, 401, 403, 429, 500, 'HTTP/1.1 403 Forbidden']) {
      assert.deepEqual(run(name, { status, body: { subscriber: {}, entries: { camera: '{}' }, error: 'real-error' } }).output, {});
    }
  }
});

test('other apps, unrelated routes and look-alike hosts remain untouched', () => {
  const cases = [
    ['remote-config', firebase.replace('locket-4252a', 'other-project')],
    ['remote-config', firebase.replace('.googleapis.com/', '.googleapis.com.invalid/')],
    ['remote-config', 'https://api.locketcamera.com/generateFilteredImage'],
    ['revenuecat', revenuecat.replace('api.revenuecat.com/', 'api.revenuecat.com.invalid/')],
    ['revenuecat', revenuecat + '/extra']
  ];
  for (const [name, url] of cases) assert.deepEqual(run(name, { url, body: { subscriber: {}, entries: { camera: '{}' } } }).output, {});
  assert.deepEqual(run('revenuecat', { headers: { 'User-Agent': 'OtherApp/1' }, body: { subscriber: {} } }).output, {});
  assert.deepEqual(run('revenuecat', { headers: {}, body: { subscriber: {} } }).output, {});
});

test('RevenueCat compatibility preserves other subscriptions without fabricated transactions', () => {
  const result = run('revenuecat', { body: { subscriber: { subscriptions: { purchased: { keep: true } }, entitlements: { other: { keep: true } } } } });
  assert.equal(result.body.subscriber.entitlements.Gold.product_identifier, 'com.ohoang7.premium.yearly');
  assert.deepEqual(result.body.subscriber.subscriptions.purchased, { keep: true });
  assert.deepEqual(result.body.subscriber.entitlements.other, { keep: true });
  assert.equal('store_transaction_id' in result.body.subscriber.subscriptions['com.ohoang7.premium.yearly'], false);
});

test('existing active Gold and malformed RevenueCat payloads remain untouched', () => {
  for (const body of [
    { subscriber: { entitlements: { Gold: { expires_date: null } } } },
    { subscriber: { entitlements: { Gold: { expires_date: '2099-01-01T00:00:00Z' } } } },
    { subscriber: { subscriptions: [] } }, { subscriber: { entitlements: [] } }, {}, 'bad-json'
  ]) assert.deepEqual(run('revenuecat', { body }).output, {});
});

test('request hooks retain credentials and remove only matching cache headers', () => {
  for (const name of ['remote-config', 'revenuecat']) {
    const headers = { 'User-Agent': 'Locket/2', Authorization: 'keep', 'X-Firebase-AppCheck': 'keep', 'IF-NONE-MATCH': 'remove' };
    const output = run(name, { headers }).output;
    assert.equal(output.headers.Authorization, 'keep');
    assert.equal(output.headers['X-Firebase-AppCheck'], 'keep');
    assert.equal('IF-NONE-MATCH' in output.headers, false);
    assert.equal(headers['IF-NONE-MATCH'], 'remove');
  }
});

test('Remote Config transformations are idempotent and normalize stale transport headers', () => {
  const first = run('remote-config', { body: { entries: { camera: '{"gold_max_duration":5}' } }, responseHeaders: { 'CONTENT-LENGTH': '9', ETag: 'old', 'X-Keep': 'yes' } });
  assert.deepEqual(first.output.headers, { 'X-Keep': 'yes' });
  assert.deepEqual(run('remote-config', { body: first.output.body }).output, {});
});

test('generated module uses only owner repository scripts and scopes each hook', async () => {
  const source = await readFile(path.join(root, 'LocketZim.module'), 'utf8');
  const links = [...source.matchAll(/script-path=([^,\s]+)/g)].map(match => match[1]);
  assert.equal(links.length, 4);
  for (const url of links) {
    assert.ok(url.startsWith('https://raw.githubusercontent.com/zim1st/locketzim/main/scripts/'));
    assert.match(path.basename(url), /-[a-f0-9]{12}\.js$/);
    await readFile(path.join(root, 'scripts', path.basename(url)));
  }
  assert.equal(new RegExp(firebasePattern).test(firebase + '?key=example'), true);
  assert.equal(new RegExp(revenuecatPattern).test(revenuecat + '?example=1'), true);
  assert.equal(/ca-p12|ca-passphrase/.test(source), false);
  assert.equal(/api\.locketcamera\.com|workers\.dev/.test(source), false);
});

test('a changed video setting produces a fresh script URL and retains the previous file', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'locketzim-cache-'));
  try {
    const first = await build(temporary, { ...settings, videoSeconds: 30 });
    const firstSource = await readFile(path.join(temporary, 'scripts', first.entrypoints['remote-config']), 'utf8');
    const second = await build(temporary, { ...settings, videoSeconds: 60 });
    assert.notEqual(first.entrypoints['remote-config'], second.entrypoints['remote-config']);
    assert.equal(first.entrypoints.revenuecat, second.entrypoints.revenuecat);
    assert.equal(await readFile(path.join(temporary, 'scripts', first.entrypoints['remote-config']), 'utf8'), firstSource);
    const module = await readFile(path.join(temporary, 'LocketZim.module'), 'utf8');
    assert.ok(module.includes(second.entrypoints['remote-config']));
    assert.equal(module.includes(first.entrypoints['remote-config']), false);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test('build is reproducible and rejects invalid settings', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'locketzim-build-'));
  try {
    const first = await build(temporary);
    const second = await build(temporary);
    assert.deepEqual(first, second);
    const current = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
    assert.deepEqual(first, current);
    assert.throws(() => validateSettings({ ...settings, videoSeconds: -1 }));
    assert.throws(() => validateSettings({ ...settings, github: { ...settings.github, ref: '../unsafe' } }));
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test('publication audit checks runtime dependencies and private files', async () => {
  assert.match(await audit(), /Audit passed/);
});
