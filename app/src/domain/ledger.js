// Record ledger: a blockchain-style SHA-256 hash chain that keeps project
// records tamper-evident. Each block holds one record's fingerprint and the
// hash of the block before it, so changing any past record or block breaks
// every hash after it. Used only for record integrity: no currency, wallets
// or payments. The browser re-checks the same hashes (public/js/shared/ledger.js).
const crypto = require('node:crypto');

const sha256 = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');
const GENESIS_PREV = '0'.repeat(64);

// Canonical JSON (sorted keys, no spaces): the same record always gives the same fingerprint.
function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v ?? null);
}

// The exact text hashed for a block.
const blockPayload = (b) => [b.height, b.at, b.kind, b.record_id, b.fingerprint, b.prev_hash].join('|');

function makeBlock(prev, { at, kind, record_id: recordId, fingerprint, event }) {
  const b = { height: prev ? prev.height + 1 : 0, at, kind, record_id: recordId, fingerprint, prev_hash: prev ? prev.hash : GENESIS_PREV };
  b.hash = sha256(blockPayload(b));
  return { ...b, event };
}

function verifyChain(blocks) {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.height !== i) return { valid: false, broken_at: i, reason: 'block height out of order' };
    if (b.prev_hash !== (i ? blocks[i - 1].hash : GENESIS_PREV)) return { valid: false, broken_at: i, reason: 'link to the previous block is broken' };
    if (sha256(blockPayload(b)) !== b.hash) return { valid: false, broken_at: i, reason: 'block contents were changed' };
  }
  return { valid: true, height: blocks.length - 1, head_hash: blocks.length ? blocks[blocks.length - 1].hash : null };
}

module.exports = { sha256, canonical, blockPayload, makeBlock, verifyChain, GENESIS_PREV };
