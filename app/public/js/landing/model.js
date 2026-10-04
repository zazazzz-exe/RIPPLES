// Landing page view model. Pure functions only (tested in Node): the public
// status taxonomy, impact numbers, project ordering and the map projection.
// Input is the explorer model from js/explore/adapter.js (toCities).

export const STATUSES = Object.freeze([
  { key: 'planned', label: 'Planned', shape: 'ring', desc: 'Committed in the city plan. Work has not started and the deadline is still ahead.' },
  { key: 'ongoing', label: 'Ongoing', shape: 'half', desc: 'Work is under way and on schedule according to the latest update.' },
  { key: 'completed', label: 'Completed', shape: 'disc', desc: 'Finished, and the latest maintenance check found it working.' },
  { key: 'delayed', label: 'Delayed', shape: 'clock', desc: 'Started, but past its deadline. Interim measures are listed for affected areas.' },
  { key: 'incomplete', label: 'Incomplete', shape: 'gap', desc: 'The deadline has passed and no work has been recorded on site.' },
  { key: 'verify', label: 'Requires verification', shape: 'diamond', desc: 'Reported as completed, but evidence shows it needs maintenance, or a citizen report is under review.' },
]);
export const STATUS = Object.fromEntries(STATUSES.map((s) => [s.key, s]));

// Maps the record (status, gap, maintenance, evidence) to the public taxonomy.
export function statusOf(p) {
  const flagged = (p.evidence || []).some((e) => Array.isArray(e[5]) && e[5].length > 0);
  if (p.status === 'Completed') return p.maint === 'Needs maintenance' || flagged ? 'verify' : 'completed';
  if (flagged) return 'verify';
  if (p.status === 'Delayed') return 'delayed';
  if (p.status === 'Not started') return p.gap ? 'incomplete' : 'planned';
  return 'ongoing';
}

// Every project in route order (city by city, then project by project).
export function orderedProjects(cities) {
  return cities.flatMap((c, ci) => c.projects.map((p, pi) => ({ ...p, status_key: statusOf(p), city: c, ci, pi })));
}

export function statusCounts(cities) {
  const counts = Object.fromEntries(STATUSES.map((s) => [s.key, 0]));
  for (const p of orderedProjects(cities)) counts[p.status_key] += 1;
  return counts;
}

export function impactStats(cities) {
  const projects = orderedProjects(cities);
  const counts = statusCounts(cities);
  return {
    projects: projects.length,
    cities: cities.length,
    island_groups: new Set(cities.map((c) => c.region)).size,
    evidence: projects.reduce((n, p) => n + p.evidence.length, 0),
    open_gaps: projects.filter((p) => p.gap).length,
    needs_attention: counts.delayed + counts.incomplete + counts.verify,
    overdue: projects.filter((p) => p.gap === 'Overdue').length,
    maintenance: projects.filter((p) => p.gap === 'Needs maintenance').length,
  };
}

// Equirectangular projection scaled by cos(latitude), the same idea as the 3D
// explorer, onto an SVG canvas that frames the Philippines.
export const MAP_BOUNDS = Object.freeze({ west: 116.6, east: 127.0, south: 4.4, north: 21.3 });
export function createProjection({ width = 1000, bounds = MAP_BOUNDS } = {}) {
  const lat0 = (bounds.north + bounds.south) / 2;
  const kx = Math.cos((lat0 * Math.PI) / 180);
  const scale = width / ((bounds.east - bounds.west) * kx);
  const height = Math.round((bounds.north - bounds.south) * scale);
  const project = (lon, lat) => [(lon - bounds.west) * kx * scale, (bounds.north - lat) * scale];
  return { width, height, scale, project };
}

// GeoJSON-like polygons ([[ [lon,lat], ... ], holes...]) to one SVG path.
// Points closer than `minStep` px are dropped to keep the path light.
export function geoPath(polys, project, minStep = 0.6) {
  let d = '';
  for (const poly of polys) {
    for (const ring of poly) {
      let last = null;
      let part = '';
      for (const [lon, lat] of ring) {
        const [x, y] = project(lon, lat);
        if (last && Math.hypot(x - last[0], y - last[1]) < minStep) continue;
        part += `${part ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
        last = [x, y];
      }
      if (part) d += `${part}Z`;
    }
  }
  return d;
}

// Project pins sit around their city; offsets are spread like the explorer's.
export const SPREAD = 3.2;
export const pinLonLat = (city, p, spread = SPREAD) => [city.lon + p.dx * spread, city.lat + p.dy * spread];
