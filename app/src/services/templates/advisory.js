// Four-audience guidance templates (D4a). Deterministic: the same advisory
// and city always produce the same text. Wording never calls a place "safe".

const join = (list) => (list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} or ${list[list.length - 1]}`);

function centersLine(centers) {
  if (!centers.length) return 'the evacuation center your barangay designates';
  return join(centers.map((c) => `${c.name} (${c.capacity_persons.toLocaleString('en-US')})`));
}

// Guidance by type and hazard points (0–3). {ev} is replaced with evacuation centers.
const GUIDANCE = {
  Typhoon: {
    households: {
      3: 'Typhoon-force winds are possible within 18 hours. If you live in a coastal, riverside or low-lying area, go to {ev} now or follow your barangay\'s pre-emptive evacuation order. Bring your go-bag, IDs and medicines.',
      2: 'Gale- to storm-force winds are expected within 24 hours. Secure roofs, charge phones and store three days of water. Be ready to move to {ev} when your barangay calls it.',
      1: 'Strong winds are expected within 36 hours. Prepare your go-bag and check your route to {ev}.',
    },
    schools: {
      3: 'Suggested: no in-person classes at any level. Schools used as evacuation centers should open now. Follow DepEd and LGU suspension announcements.',
      2: 'Suggested: suspend in-person classes for all levels and shift to modular learning. Follow DepEd and LGU announcements.',
      1: 'Suggested: suspend kindergarten in-person classes and prepare modules for a possible wider suspension. Follow DepEd and LGU announcements.',
    },
    farmers: {
      3: 'Harvest what you can now. Move livestock and equipment to higher ground. Fisherfolk: do not go to sea.',
      2: 'Harvest mature crops, secure seedlings and clear field drains. Fisherfolk stay in port.',
      1: 'Clear drains and secure nursery seedlings. Small boats stay in port.',
    },
  },
  Rain: {
    households: {
      3: 'Serious flooding is expected. Residents of flood-prone and riverside areas should move to {ev} now or when your barangay gives the go-signal.',
      2: 'Flooding is threatening. Move valuables to higher floors, prepare a go-bag and be ready to go to {ev}.',
      1: 'Flooding is possible in low-lying streets. Monitor updates every 3 hours and know your route to {ev}.',
    },
    schools: {
      3: 'Suggested: suspend in-person classes in affected barangays. Follow DepEd and LGU announcements.',
      2: 'Suggested: suspend afternoon classes in flood-prone barangays. Follow DepEd and LGU announcements.',
      1: 'No change to schedules is suggested. Watch for LGU announcements.',
    },
    farmers: {
      3: 'Move livestock to higher ground and secure equipment. Do not cross flooded fields or rivers.',
      2: 'Move livestock to higher ground and delay planting in low fields.',
      1: 'Hold off on fertilizer application until the rain eases and clear field drains.',
    },
  },
  Flood: {
    households: {
      3: 'Flooding is happening or imminent. Residents of affected zones should go to {ev} now and follow barangay evacuation orders.',
      2: 'River levels are above normal. Move vehicles, appliances and valuables to higher floors and keep a go-bag ready. Riverside residents should be ready to go to {ev}.',
      1: 'River levels are being watched. Keep a go-bag ready and know your route to {ev}.',
    },
    schools: {
      3: 'Suggested: suspend in-person classes in affected barangays. Follow DepEd and LGU announcements.',
      2: 'Suggested: prepare to dismiss early in riverside barangays and avoid ground-floor rooms near the river. Follow DepEd and LGU announcements.',
      1: 'No change to schedules is suggested. Watch for LGU announcements.',
    },
    farmers: {
      3: 'Move livestock and stock to higher ground. Do not cross flooded rivers.',
      2: 'Secure sluice gates and nets, clear field and pond drains, and move harvestable stock out of low-lying ponds.',
      1: 'Clear field drains and fishpond outlets.',
    },
  },
  Heat: {
    households: {
      3: 'Heat stroke is likely with continued exposure. Stay indoors or in shade from 10 AM to 4 PM, drink water often and check on older neighbors and young children. Know where the nearest cooling spot is.',
      2: 'Heat cramps and exhaustion are likely. Limit time outdoors from 11 AM to 3 PM, drink water often and check on older neighbors.',
      1: 'Drink water often and limit time outdoors from 11 AM to 3 PM. Check on older neighbors.',
      0: 'Drink water during midday and watch for signs of fatigue.',
    },
    schools: {
      3: 'Suggested: shift to modular learning or shortened morning schedules. Follow DepEd and LGU announcements.',
      2: 'Suggested: cancel outdoor activities and shorten afternoon sessions. Follow DepEd and LGU announcements.',
      1: 'Suggested: move PE and outdoor activities to early morning.',
      0: 'No change to schedules is suggested.',
    },
    farmers: {
      3: 'Avoid field work from 10 AM to 4 PM. Give livestock shade and water.',
      2: 'Work early or late in the day and irrigate in the early morning.',
      1: 'Irrigate early or late in the day.',
      0: 'Water crops early in the day.',
    },
  },
  Thunderstorm: {
    households: { 1: 'Heavy rain for 1–2 hours is possible. Avoid crossing flooded streets and stay indoors during lightning.' },
    schools: { 1: 'Suggested: delay dismissal until the storm passes.' },
    farmers: { 1: 'Avoid open fields during lightning and check drainage in paddies.' },
  },
  Coastal: {
    households: { 1: 'Coastal flooding or rough seas are expected. Raise appliances, secure boats and loose roofing, and know your route to {ev}.' },
    schools: { 1: 'Suggested: end afternoon classes early in affected coastal barangays.' },
    farmers: { 1: 'Fishpond operators should close sluice gates. Fisherfolk should not go out to sea in small boats.' },
  },
  Drought: {
    households: {
      2: 'Water supply may be reduced. Store water, fix leaks and follow your water district\'s schedule.',
      1: 'Conserve water and store enough for three days.',
    },
    schools: {
      2: 'Suggested: check water supply for toilets and drinking stations. Follow DepEd and LGU announcements.',
      1: 'No change to schedules is suggested.',
    },
    farmers: {
      2: 'Prioritize water for seedlings and livestock, and ask your agriculture office about drought-tolerant varieties.',
      1: 'Irrigate early in the day and mulch to keep soil moisture.',
    },
  },
};

function pick(table, points) {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  const k = keys.filter((x) => x <= Math.max(points, keys[0])).pop();
  return table[k];
}

function barangaySection(openGaps) {
  if (!openGaps.length) {
    return 'No open gaps are on record for this city. Confirm evacuation centers are open, staffed and stocked.';
  }
  const lines = openGaps.map((g) => `${g.project} (${g.gap.toLowerCase()}): ${g.interim_measure || 'assign watchers and pre-position sandbags.'}`);
  return `Open gaps that matter now: ${lines.join(' ')} Prioritize pre-emptive evacuation of households these gaps leave exposed.`;
}

function advisorySections({ type, points, centers, openGaps }) {
  const g = GUIDANCE[type];
  const ev = centersLine(centers);
  return {
    households: pick(g.households, points).replace('{ev}', ev),
    schools: pick(g.schools, points),
    farmers: pick(g.farmers, points),
    barangay_officials: barangaySection(openGaps),
  };
}

module.exports = { advisorySections, centersLine };
