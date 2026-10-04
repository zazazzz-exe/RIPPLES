// The only "sender" in the app. Nothing leaves the process: messages are
// recorded in state, and every address must be on the test domain (S2).

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

function createOutbox({ store, config }) {
  const testAddress = (label) => `${slug(label)}@${config.testEmailDomain}`;

  function send({ to, subject, body, kind, draft_id = null, city_id = null }) {
    const recipients = Array.isArray(to) ? to : [to];
    for (const r of recipients) {
      if (!r.endsWith(`@${config.testEmailDomain}`)) throw new Error(`Refusing to send to non-test address: ${r}`);
    }
    return store.update((s) => {
      const msg = {
        id: `out-${String(s.outbox.length + 1).padStart(4, '0')}`,
        to: recipients, subject, body, kind, draft_id, city_id,
        sent_on: config.today, recorded_at: new Date().toISOString(), test_only: true,
      };
      s.outbox.push(msg);
      return msg;
    });
  }

  return { send, testAddress, list: () => [...store.get().outbox].reverse() };
}

module.exports = { createOutbox, slug };
