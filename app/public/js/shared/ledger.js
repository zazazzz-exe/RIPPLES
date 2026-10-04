// Browser-side check of the record ledger (same format as src/domain/ledger.js).
// Hashes are recomputed here with Web Crypto, so the server's word is not needed.
const GENESIS_PREV = '0'.repeat(64);

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const blockPayload = (b) => [b.height, b.at, b.kind, b.record_id, b.fingerprint, b.prev_hash].join('|');

// Checks a block's own hash and, when given, its link to the previous block.
export async function verifyBlock(b, prevHash) {
  const hashOk = (await sha256(blockPayload(b))) === b.hash;
  const linkOk = prevHash === undefined ? true : b.prev_hash === prevHash;
  return { hashOk, linkOk, ok: hashOk && linkOk };
}

// blocks in chain order (height 0 first).
export async function verifyChain(blocks) {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.height !== i) return { valid: false, broken_at: i, reason: 'block height out of order' };
    const { hashOk, linkOk } = await verifyBlock(b, i ? blocks[i - 1].hash : GENESIS_PREV);
    if (!linkOk) return { valid: false, broken_at: i, reason: 'link to the previous block is broken' };
    if (!hashOk) return { valid: false, broken_at: i, reason: 'block contents were changed' };
  }
  return { valid: true, height: blocks.length - 1, head_hash: blocks.length ? blocks[blocks.length - 1].hash : null };
}

// Verifies one project: its record hashes to the ledger fingerprint, and its
// latest block hashes correctly and links to the block before it.
export async function verifyRecord(integrity) {
  const fingerprintNow = await sha256(integrity.record);
  const latest = integrity.latest;
  const block = latest ? await verifyBlock(latest, integrity.previous_block ? integrity.previous_block.hash : GENESIS_PREV) : { ok: false };
  return { fingerprintNow, recordOk: !!latest && fingerprintNow === latest.fingerprint, blockOk: block.ok, ok: !!latest && fingerprintNow === latest.fingerprint && block.ok };
}

export const short = (h, a = 6, b = 4) => (h ? `${h.slice(0, a)}…${h.slice(-b)}` : '—');
