"""Import project reference photos: the team's photos from helloo/ plus
Wikimedia Commons photos listed in data/commons_photos.json.

helloo/ holds 192 image files but only 20 distinct photos (the same photo is
saved under many names, often with conflicting source labels). This script
works from the 20 distinct photos in helloo/assets/real-photos, finds each
photo's source in sources.json (or, by identical file content, in the
flood-control manifest), and attaches it to the projects it actually shows.

Decided with the team: all photos that show what their name says are used,
each credited and labelled as a reference photo. News and private-company
photos carry a note that permission is needed before a public release.
Excluded: dagupan_pantal_river (a street scene, not flood works) and three
unsourced photos whose content doesn't match their name (evacuation center,
telemetry gauge, retention basin). Each team photo is
used for ONE project only (the first listed); the
other projects get a distinct Wikimedia Commons photo (free licenses, credited,
checked by eye) where one was found. Projects still without a photo then share
a photo of the same type (TYPE_POOLS). Other manifest entries are kept as
link-only source references.

Writes app/public/img/projects/* and data/project_media.json.
Usage (needs Pillow: pip install pillow):
  python app/scripts/import_helloo_photos.py [--commons-dir DIR]
--commons-dir is the folder holding the downloaded Commons images (paths in
commons_photos.json "local" are relative to it). Without it, the already
resized Commons images in app/public/img/projects are reused.
"""
import csv
import hashlib
import json
import os
import sys
from PIL import Image, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ASSETS = os.path.join(ROOT, 'helloo', 'assets')
REAL = os.path.join(ASSETS, 'real-photos')
MANIFEST = os.path.join(ASSETS, 'flood-control-project-photos', 'manifest.json')
UPLOADS = os.path.join(ASSETS, 'flood-control-project-photos', 'uploads')
OUT = os.path.join(ROOT, 'app', 'public', 'img', 'projects')
MEDIA = os.path.join(ROOT, 'data', 'project_media.json')
COMMONS = os.path.join(ROOT, 'data', 'commons_photos.json')
PROJECTS_CSV = os.path.join(ROOT, 'data', 'projects.csv')

# Project type -> photos (already imported above) shared by projects that have none.
TYPE_POOLS = {
    'Dike': ['legazpi-albay-dike.jpg', 'davao-talomo-protective-wall.jpg', 'davao-dike-reinforcement.jpg',
             'davao-riverbank-sheet-piling.jpg', 'cdo-river-boulevard-dike.jpg', 'marikina-manggahan-floodway.jpg',
             'commons-man-pasig-wall.jpg'],
    'Drainage': ['drainage-box-culvert-construction.jpg', 'iloilo-creek-bank-works.jpg', 'iloilo-floodway-channel.jpg',
                 'commons-man-binondo-estero.jpg', 'commons-man-paco-estero.jpg'],
    'Pump': ['malabon-pumping-station.jpg', 'malabon-valenzuela-pump.jpg', 'commons-man-vitas-pump.jpg',
             'commons-man-aviles-pump.jpg'],
    'Seawall': ['tacloban-coastal-defense.jpg', 'tacloban-storm-surge-barrier.jpg', 'commons-man-baseco-seawall.jpg',
                'commons-man-roxas-outfall.jpg'],
    'Mangrove': ['mangrove-buffer-forest.jpg'],
    'Greening': ['iloilo-esplanade-river.jpg', 'commons-man-paco-estero.jpg'],
    'Warning': ['commons-man-sensors.jpg'],
    'Evac': ['commons-man-evac.jpg'],
}

GOV = 'Philippine government work'
NEWS = 'Used as a reference with credit; get the owner\'s permission before a public release'

# file key -> (title shown, rights, {project_id: what it is a reference for})
PHOTOS = {
    'malabon_pumping_station': ('Estero de Sunog Apog Pumping Station, Metro Manila', GOV,
                                {'mal-pump': 'Metro Manila pump-station reference', 'mal-navotas-drain': 'Metro Manila drainage and pump reference', 'mal-drain': 'Metro Manila drainage and pump reference', 'mal-wall': 'Metro Manila flood-control works reference'}),
    'marikina_manggahan_floodway': ('Manggahan Floodway, Pasig-Marikina river system', 'Public domain (Wikimedia Commons)',
                                    {'mar-dredge': 'Marikina River corridor reference', 'mar-wall': 'Marikina River corridor reference', 'mar-nangka-basin': 'Marikina River system reference'}),
    'legazpi_albay_dike': ('Concrete river dike, Albay', GOV,
                           {'leg-seawall': 'Albay flood-control wall reference'}),
    'legazpi_yawa_mayon': ('Yawa River channel works below Mayon Volcano', GOV,
                           {'leg-lahar': 'Yawa River lahar-channel reference', 'leg-yawa-sabo': 'Yawa River works reference'}),
    'davao_talomo_protective_wall': ('Protective river wall along the Talomo River, Davao City', GOV,
                                     {'dav-matina': 'Davao river-wall reference', 'dav-talomo-basin': 'Talomo River works reference'}),
    'davao_dike_reinforcement': ('Gabion dike reinforcement works, Davao', NEWS, {'dav-floodwall': 'Davao dike works reference'}),
    'davao_riverbank_sheet_piling': ('Riverbank sheet-piling works, Davao', NEWS, {'dav-floodwall': 'Davao riverbank works reference'}),
    'cdo_river_boulevard_dike': ('Cagayan de Oro River and River Boulevard dike', NEWS,
                                 {'cdo-dike': 'CDO River dike reference', 'cdo-puntod-drain': 'CDO River works reference', 'cdo-reloc': 'CDO River works reference'}),
    'iloilo_floodway_channel': ('Floodway channel works, Iloilo City', NEWS, {'ilo-floodway': 'Iloilo floodway reference'}),
    'iloilo_creek_bank_works': ('Creek bank works, Iloilo City', NEWS,
                                {'ilo-basin': 'Iloilo creek works reference', 'ilo-molo-gate': 'Iloilo outfall and creek works reference'}),
    'iloilo_esplanade_river': ('Iloilo River Esplanade', NEWS, {'ilo-esplanade': 'Iloilo River Esplanade reference'}),
    'malabon_valenzuela_pump': ('Valenzuela pumping station outfall, Metro Manila', NEWS,
                                {'ilo-pump': 'Pumping station reference', 'dag-tidegate': 'Pumping station and tide gate reference', 'tac-outfall': 'Pump-assisted outfall reference'}),
    'tacloban_coastal_defense': ('Coastal embankment and road, Tacloban City', NEWS, {'tac-embank': 'Tacloban coastal embankment reference'}),
    'tacloban_storm_surge_barrier': ('Storm-surge barrier sheet-pile works, Tacloban City', NEWS, {'tac-embank': 'Tacloban storm-surge barrier reference'}),
    'mangrove_buffer_forest': ('Mangrove roots in a coastal buffer forest', 'original source not listed',
                               {'dag-mangrove': 'Mangrove buffer reference', 'tac-buffer': 'Mangrove buffer reference', 'leg-mangrove': 'Mangrove buffer reference'}),
    'drainage_box_culvert_construction': ('Concrete drainage works', 'original source not listed',
                                          {'tac-drain': 'Drainage construction reference'}),
}


def md5(path):
    with open(path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()


def find_file(key):
    for ext in ('.jpg', '.webp', '.jpeg', '.png'):
        p = os.path.join(REAL, key + ext)
        if os.path.exists(p):
            return p
    raise FileNotFoundError(key)


def save_versions(src, name, sizes=((('', 1600, 80), ('-sm', 800, 75)))):
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    out = {}
    for suffix, width, quality in sizes:
        v = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS) if im.width > width else im.copy()
        fname = f'{name}{suffix}.jpg'
        v.save(os.path.join(OUT, fname), 'JPEG', quality=quality, optimize=True, progressive=True)
        out[suffix or 'large'] = (fname, v.size)
    return out


def existing_versions(name):
    out = {}
    for suffix in ('', '-sm'):
        fname = f'{name}{suffix}.jpg'
        with Image.open(os.path.join(OUT, fname)) as im:
            out[suffix or 'large'] = (fname, im.size)
    return out


def main():
    commons_dir = sys.argv[sys.argv.index('--commons-dir') + 1] if '--commons-dir' in sys.argv else None
    with open(os.path.join(REAL, 'sources.json'), encoding='utf-8') as f:
        sources = {x['key']: x for x in json.load(f)}
    with open(MANIFEST, encoding='utf-8') as f:
        manifest = json.load(f)
    # Manifest entries indexed by the content of their file, to source unlisted photos.
    by_hash = {}
    for x in manifest:
        p = os.path.join(UPLOADS, x['suggested_file'])
        if os.path.exists(p):
            by_hash.setdefault(md5(p), []).append(x)

    os.makedirs(OUT, exist_ok=True)
    written = set()

    projects = {}
    used_pages = set()
    for key, (title, rights, targets) in PHOTOS.items():
        src = find_file(key)
        if key in sources:
            source, page = sources[key]['source'], sources[key]['sourceUrl']
        elif md5(src) in by_hash:
            m = by_hash[md5(src)][0]
            source, page = m['source'], m['source_page']
        else:
            source, page = 'Team photo folder', None
        used_pages.add(page)
        name = key.replace('_', '-')
        v = save_versions(src, name)
        (large, (w, h)), (small, _) = v['large'], v['-sm']
        base = {'file': large, 'small': small, 'width': w, 'height': h, 'title': title,
                'source': source, 'source_url': page, 'license_note': rights}
        written.update((large, small))
        pid, match = next(iter(targets.items()))  # one project per photo: no duplicates
        projects.setdefault(pid, {'photos': [], 'references': []})['photos'].append({**base, 'match': match})

    # Wikimedia Commons photos: one distinct file per project.
    commons = json.load(open(COMMONS, encoding='utf-8'))['photos'] if os.path.exists(COMMONS) else []
    seen = set()
    for c in commons:
        assert c['file'] not in seen, f"Commons file used twice: {c['file']}"
        seen.add(c['file'])
        entry = projects.setdefault(c['project_id'], {'photos': [], 'references': []})
        if entry['photos']:
            continue  # a team photo already covers this project
        name = 'commons-' + c['project_id']
        if commons_dir:
            v = save_versions(os.path.join(commons_dir, c['local']), name, (('', 1280, 78), ('-sm', 640, 72)))
        else:
            v = existing_versions(name)
        (large, (w, h)), (small, _) = v['large'], v['-sm']
        written.update((large, small))
        entry['photos'].append({'file': large, 'small': small, 'width': w, 'height': h, 'title': c['title'],
                                'source': f"Wikimedia Commons · {c['author']}", 'source_url': c['file_page'],
                                'license_note': c['license'], 'license_url': c.get('license_url'), 'match': c['match']})

    # Every project still without a photo gets a shared photo of the same type
    # (decided with the team: duplicates are fine so no project shows a blank).
    by_file = {ph['file']: ph for e in projects.values() for ph in e['photos']}
    pools = {t: [by_file[f] for f in files if f in by_file] for t, files in TYPE_POOLS.items()}
    turn = {}
    with open(PROJECTS_CSV, encoding='utf-8') as f:
        for row in csv.DictReader(f):
            entry = projects.setdefault(row['project_id'], {'photos': [], 'references': []})
            pool = pools.get(row['type'])
            if entry['photos'] or not pool:
                continue
            i = turn.get(row['type'], 0)
            turn[row['type']] = i + 1
            ph = pool[i % len(pool)]
            entry['photos'].append({**ph, 'match': f"{row['type']} reference (shared photo)"})

    # Remove images no longer referenced.
    for old in os.listdir(OUT):
        if old not in written:
            os.remove(os.path.join(OUT, old))

    # Remaining project-specific manifest entries become link-only references.
    for x in manifest:
        pid = x['project_id']
        if '-flood-' in pid:  # city-level filler entries reuse unrelated images
            continue
        entry = projects.setdefault(pid, {'photos': [], 'references': []})
        page = x.get('source_page') or x.get('image_url')
        if page in used_pages or any(r['url'] == page for r in entry['references']):
            continue
        entry['references'].append({'title': x['title'], 'source': x['source'], 'url': page})

    media = {
        'note': 'Reference photos are illustrative, not verified evidence for the sample projects. Team-folder credits are as listed there (news and company photos need the owner\'s permission before a public release); Wikimedia Commons photos are used under the listed free licenses.',
        'projects': {k: v for k, v in sorted(projects.items()) if v['photos'] or v['references']},
    }
    with open(MEDIA, 'w', encoding='utf-8') as f:
        json.dump(media, f, indent=1, ensure_ascii=False)
    links = sum(len(p['photos']) for p in projects.values())
    refs = sum(len(p['references']) for p in projects.values())
    print(f'{len(PHOTOS)} team photos, {len(seen)} Commons photos, {links} project photo links, {refs} source references, {len(media["projects"])} projects')


if __name__ == '__main__':
    main()
