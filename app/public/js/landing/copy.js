// All landing page text in one place. Neutral, civic language (safeguard S3):
// no project is accused of anything, and the page never offers reassurance in
// place of official warnings (S1). A test checks this file and every component.

export const HERO = {
  eyebrow: 'Climate defense map · Philippines',
  title: ['See where projects stand.', 'See where progress happens.'],
  lede: 'Ripples helps citizens explore public infrastructure and climate-resilience projects across the Philippines: what was promised, how far it has come, and what the evidence on the ground shows.',
  primary: 'Explore the map',
  secondary: 'Learn more',
};

export const SCENE_BEATS = [
  { at: 0.06, text: 'Every typhoon season tests the defenses a city has built.' },
  { at: 0.36, text: 'Some are finished. Some are late. Some need repair.' },
  { at: 0.64, text: 'Ripples puts each promise on the map, city by city.', dark: true },
];

export const MAP = {
  title: 'Explore the projects',
  lede: 'Select a city to see its climate-defense commitments, then open any project for its progress, timeline and evidence.',
  hint: 'Click a city · Arrow keys move between projects · Esc goes back',
};

export const COMPARE = {
  eyebrow: 'See the difference',
  title: 'What was promised, next to what was observed.',
  lede: 'A record says what should be there. Evidence shows what is. Ripples puts the planned design from the city plan beside what citizens, satellites and site visits report, so anyone can see the gap.',
  cases: [
    { project: 'mal-wall', photo: 'river-channel-works', label: 'River wall repair' },
    { project: 'ilo-floodway', photo: 'flood-river-manila', label: 'Floodway desilting' },
    { project: 'mal-sensor', photo: 'flood-forecasting-station', label: 'Flood early-warning sensors' },
  ],
  note: 'Photos are representative and do not show the sample project. Observation text comes from the sample evidence record.',
};

export const PROBLEM = [
  {
    photo: 'haiyan-tacloban',
    eyebrow: 'The problem',
    title: 'Climate risk is rising faster than defenses are finished.',
    body: 'The Philippines faces about 20 tropical cyclones a year, along with floods, storm surge and extreme heat. Under the Climate Change Act, every local government prepares a climate plan that lists the dikes, drains, seawalls, mangroves and warning systems it will build.',
    facts: [
      { value: '~20', text: 'tropical cyclones enter the Philippine Area of Responsibility in a typical year', source: { name: 'PAGASA', url: 'https://www.pagasa.dost.gov.ph' } },
      { value: 'RA 9729', text: 'requires every LGU to prepare a Local Climate Change Action Plan (LCCAP)' },
    ],
  },
  {
    photo: 'road-construction',
    eyebrow: 'Why it matters',
    title: 'Promises are hard to follow from the ground.',
    body: 'Commitments sit in long plans and budget documents spread across many offices. Some projects are funded and reported but delayed, unfinished, or hard to verify on site, which public discussion sometimes calls "ghost projects". Finished defenses can also stop working without maintenance. Usually, a flood is what reveals the gap.',
    factsFromData: true,
    right: true,
  },
];

export const STEPS = [
  { num: '01', title: 'Discover', text: 'Explore climate-defense and infrastructure projects across the Philippines on one map, city by city.' },
  { num: '02', title: 'Investigate', text: 'Open any project to see its purpose, budget, responsible office, timeline and the evidence collected so far.' },
  { num: '03', title: 'Verify', text: 'Compare the reported status with citizen photo reports, satellite checks and site updates. Reports stay unverified until they are corroborated.' },
  { num: '04', title: 'Understand', text: 'See each project\'s status and progress in context: how it affects a city\'s climate risk this season, and what interim measures are in place.' },
];

export const FEATURES = [
  { icon: 'chain', title: 'Tamper-evident records (blockchain)', text: 'Every project record is fingerprinted with SHA-256 and chained in a ledger, so a past status, deadline or piece of evidence can’t be quietly edited. Anyone can verify a record in their own browser. Used for record keeping only: no currency, wallets or payments.', href: '/ledger', highlight: true },
  { icon: 'map', title: 'Interactive Philippine map', text: 'Explore projects geographically, from the whole archipelago down to a single site.', href: '#map' },
  { icon: 'progress', title: 'Project progress tracking', text: 'Follow the reported status and physical progress of each commitment over time.', href: '#status' },
  { icon: 'camera', title: 'Visual evidence', text: 'See photos, satellite checks and site updates tied to a project\'s location.', href: '#evidence' },
  { icon: 'timeline', title: 'Project timeline', text: 'Understand when a project was planned, started, last updated and due.', href: '#map' },
  { icon: 'risk', title: 'Climate risk context', text: 'See how unfinished or unmaintained defenses raise a city\'s real risk during each hazard season.', href: '/map' },
  { icon: 'dashboard', title: 'Transparency dashboard', text: 'Promises kept, open gaps and follow-up replies by city and agency, in one scorecard.', href: '/ops' },
  { icon: 'network', title: 'Connected project network', text: 'Follow the route between cities and see how projects relate across regions.', href: '/map' },
];

export const ABOUT = {
  eyebrow: 'About Ripples',
  title: 'Public projects are public information.',
  body: [
    'Ripples is a civic-technology platform that makes climate-resilience and public infrastructure projects easy to find, follow and understand. It brings each city\'s commitments, their status and the evidence about them into one place, organized on a map.',
    'It was created because the information already exists but is scattered, technical and hard to read. When residents, journalists, barangay officials and local offices can see the same record, problems are noticed earlier, before a storm exposes them.',
    'Ripples does not replace official reporting or warnings. It points to official sources, uses neutral language, and keeps a person in the loop before anything is published or sent.',
  ],
  values: [
    { k: 'T', title: 'Transparency', text: 'Make commitments and their real status visible.' },
    { k: 'A', title: 'Accountability', text: 'Help unmet commitments reach the right office.' },
    { k: 'S', title: 'Sustainability', text: 'Make sure finished defenses keep working.' },
  ],
};

export const IMPACT = {
  eyebrow: 'At a glance',
  title: 'What the sample dataset covers today.',
  lede: 'These figures are counted live from the Ripples sample dataset that powers the map. They show how the platform works and are not official statistics.',
};

export const FAQ = [
  { q: 'How does Ripples keep records from being changed?', a: 'Each project record (its details, status, progress, deadline, maintenance and evidence) is turned into a SHA-256 fingerprint and stored in a blockchain-style ledger, where every block also carries the hash of the block before it. If anyone edits a past record or block, the hashes stop matching and the chain shows where it broke. You can check any record yourself on the Ledger page. The ledger is only for record integrity: there is no cryptocurrency, wallet or payment.' },
  { q: 'What is this platform?', a: 'Ripples is a civic-technology platform for exploring public infrastructure and climate-resilience projects in the Philippines. It shows what each city committed to, how far each project has come, and the evidence collected about it, all on one map.' },
  { q: 'Where does the project information come from?', a: 'In this version, all records are sample data built from the structure of real Local Climate Change Action Plans (LCCAPs). They use real city names to show how the platform works but do not describe the actual status of any project. In production, records would come from published LCCAPs, local budgets and agency updates, each reviewed by a person before publishing.' },
  { q: 'What is a "ghost project"?', a: 'It is a term used in public discussion for a project that is reported or funded but cannot be found, finished or verified on the ground. Ripples does not label any project this way. It shows the record and the evidence side by side, uses neutral terms such as "delayed", "incomplete" and "requires verification", and helps questions reach the responsible office through proper channels.' },
  { q: 'How is project progress represented?', a: 'Each project has a reported physical progress percentage and one of six statuses: planned, ongoing, completed, delayed, incomplete, or requires verification. Statuses follow fixed rules based on the deadline, the reported status and the latest maintenance check, so every status can be explained.' },
  { q: 'Can citizens report a project?', a: 'Yes. Anyone can submit a status update, a dispute or a maintenance problem from a project\'s page. Reports are anonymous: the platform never asks for or stores who you are, and photos are processed in your browser to remove location data.' },
  { q: 'How are project images or evidence verified?', a: 'A citizen report stays "unverified" until at least two other matching reports or a satellite check back it up. Reports with unusual patterns, such as identical wording or a photo that does not match the project type, are sent to a reviewer instead of being accepted automatically.' },
  { q: 'Does the platform replace government reporting?', a: 'No. Ripples complements official reporting by making it easier to read and follow. For warnings and evacuation orders, always follow PAGASA, NDRRMC and your local government.' },
  { q: 'How can I explore projects in my area?', a: 'Open the map, select your city, and browse its projects, or use the project list to see every commitment grouped by city. Each project page links to the full 3D explorer, where you can also see advisories, evacuation centers and community actions.' },
];

export const FINAL = {
  title: ['Explore the projects.', 'Understand the progress.', 'See what is happening on the ground.'],
  cta: 'Explore the map',
};

export const OFFICIAL = [
  { name: 'PAGASA', url: 'https://www.pagasa.dost.gov.ph' },
  { name: 'NDRRMC', url: 'https://ndrrmc.gov.ph' },
  { name: 'HazardHunterPH', url: 'https://hazardhunter.georisk.gov.ph' },
  { name: 'Project NOAH', url: 'https://noah.up.edu.ph' },
];

// Representative photo per project type (never presented as the project itself).
export const TYPE_PHOTO = {
  Dike: 'river-channel-works', Seawall: 'seawall-legazpi', Drainage: 'flood-river-manila', Pump: 'floodgates-metro-manila',
  Mangrove: 'mangroves-boat', Greening: 'mangrove-boardwalk', Evac: 'evacuation-flood-marker', Warning: 'flood-forecasting-station',
};
