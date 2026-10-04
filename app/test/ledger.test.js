const test = require('node:test');
const assert = require('node:assert/strict');
const baseConfig = require('../src/config');
const { createServices } = require('../src/services');
const { verifyChain, sha256 } = require('../src/domain/ledger');

const make = () => createServices({ ...baseConfig, approvalMode: 'required' }, { persist: false });

test('record ledger: one genesis block plus one block per project, and the chain verifies', () => {
  const s = make();
  const l = s.ledger.overview({ all: true });
  assert.equal(l.total, 1 + 220);
  assert.equal(l.records_tracked, 220);
  assert.equal(l.chain.valid, true);
  assert.equal(l.blocks.at(-1).kind, 'genesis');
  // Syncing again without changes adds nothing.
  assert.equal(s.ledger.sync().length, 221);
});

test('record ledger: a new citizen report chains a "Record updated" block for that project', () => {
  const s = make();
  const before = s.ledger.integrity('mal-wall');
  assert.equal(before.matches, true);
  assert.equal(before.latest.fingerprint, sha256(before.record));
  s.reportTriage.triage({ project_id: 'mal-wall', report_type: 'status update', text: 'The open section is still sandbagged.', photo_description: 'river wall' });
  const after = s.ledger.integrity('mal-wall');
  assert.equal(after.history.length, 2);
  assert.equal(after.latest.event, 'Record updated');
  assert.equal(after.latest.prev_hash, after.previous_block.hash);
  assert.notEqual(after.fingerprint, before.fingerprint);
  assert.equal(after.matches, true);
  assert.equal(after.chain.valid, true);
});

test('record ledger: editing any past block is detected', () => {
  const s = make();
  const blocks = structuredClone(s.ledger.sync());
  blocks[40].fingerprint = sha256('quietly edited');
  const check = verifyChain(blocks);
  assert.equal(check.valid, false);
  assert.equal(check.broken_at, 40);
  // Re-hashing the edited block still breaks the link to the next one.
  const relinked = structuredClone(s.ledger.sync());
  relinked[40].hash = sha256('forged');
  assert.equal(verifyChain(relinked).valid, false);
});

test('record ledger: approval decisions are chained, and no payment or wallet fields exist', () => {
  const s = make();
  const d = s.followUpLetter.create('mal-wall');
  s.drafts.decide(d.id, 'approve', 'ok');
  const l = s.ledger.overview({ all: true });
  assert.equal(l.counts.decision, 1);
  // Blocks hold only record-integrity fields.
  const keys = new Set(l.blocks.flatMap((b) => Object.keys(b)));
  assert.deepEqual([...keys].sort(), ['at', 'event', 'fingerprint', 'hash', 'height', 'kind', 'label', 'prev_hash', 'record_id']);
});
