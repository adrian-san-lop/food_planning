"""Extract selected records from the public USDA archives; never edit catalogs.

python scripts/collect-nutrition-sources.py --refresh
Matching is an explicit reviewed plan, not a numeric nearest-neighbour search.
No API key, third-party data or branded substitutions are used.
"""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import urllib.request
import zipfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/audits/catalog-quality/results/source-data'
URL = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip'
FOUNDATION = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_json_2026-04-30.zip'
NUTRIENTS = {'1008': 'kcal', '1003': 'protein_g', '1005': 'carbohydrates_g', '1004': 'fat_g', '1079': 'fiber_g'}


def collect(sr_blob, foundation_blob):
    plan = json.loads((OUT / 'source-plan.json').read_text(encoding='utf8'))
    archive = zipfile.ZipFile(io.BytesIO(sr_blob))
    names = {n.rsplit('/', 1)[-1]: n for n in archive.namelist()}
    def rows(name):
        return csv.DictReader(io.TextIOWrapper(archive.open(names[name]), encoding='utf-8-sig'))
    ids = {str(p['fdc_id']) for p in plan.values() if p.get('type') == 'SR Legacy'}
    ids.update(str(fid) for p in plan.values() for fid in p.get('alternative_fdc_ids', []))
    records = {f['fdc_id']: {**f, 'nutrients': {}, 'basis': 'per_100g', 'type': 'SR Legacy'}
               for f in rows('food.csv') if f['fdc_id'] in ids}
    for f in rows('sr_legacy_food.csv'):
        if f['fdc_id'] in records:
            records[f['fdc_id']]['ndb_number'] = f['NDB_number']
    for n in rows('food_nutrient.csv'):
        if n['fdc_id'] in records and n['nutrient_id'] in NUTRIENTS:
            records[n['fdc_id']]['nutrients'][NUTRIENTS[n['nutrient_id']]] = {
                'amount': float(n['amount']), 'unit': 'kcal' if n['nutrient_id'] == '1008' else 'g',
                'nutrient_id': int(n['nutrient_id']), 'derivation_id': n['derivation_id'],
                'data_points': n['data_points'], 'food_nutrient_id': n['id']}
    archive = zipfile.ZipFile(io.BytesIO(foundation_blob))
    foundation = json.loads(archive.read(archive.namelist()[0]))['FoundationFoods']
    fids = {p['fdc_id'] for p in plan.values() if p.get('type') == 'Foundation'}
    for f in foundation:
        if not f or f['fdcId'] not in fids:
            continue
        r = {'fdc_id': str(f['fdcId']), 'description': f['description'], 'type': 'Foundation',
             'basis': 'per_100g', 'publication_date': f['publicationDate'], 'nutrients': {}}
        for n in f['foodNutrients']:
            nid = str(n['nutrient']['id'])
            key = NUTRIENTS.get(nid)
            # Specific Atwater energy retained for Foundation when 1008 is absent.
            if nid == '2048':
                key = 'kcal'
            if key:
                r['nutrients'][key] = {'amount': n.get('amount'), 'unit': n['nutrient']['unitName'],
                                     'nutrient_id': int(nid), 'food_nutrient_id': n['id']}
        records[r['fdc_id']] = r
    for r in records.values():
        r['url'] = f"https://fdc.nal.usda.gov/food-details/{r['fdc_id']}/nutrients"
        r['archive_url'] = URL if r['type'] == 'SR Legacy' else FOUNDATION
        r['access_method'] = 'Official downloadable archive read directly; web detail page not used as evidence'
        assert all(k in r['nutrients'] for k in ['kcal', 'protein_g', 'carbohydrates_g', 'fat_g']), r
    assert ids | {str(fid) for fid in fids} == set(records), 'Missing or unexpected source record'
    return {'accessed_at': datetime.now(timezone.utc).isoformat(), 'license': 'USDA public domain / CC0',
            'carbohydrate_method': 'USDA carbohydrate by difference; not harmonized with EU available carbohydrate',
            'archives': [{'url': u, 'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b)}
                         for u, b in [(URL, sr_blob), (FOUNDATION, foundation_blob)]],
            'records': records}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true', help='Download official archives and replace the evidence snapshot only')
    args = parser.parse_args()
    if not args.refresh:
        parser.exit(message='Use --refresh to download. Catalog files are never modified.\n')
    blobs = [urllib.request.urlopen(u, timeout=90).read() for u in [URL, FOUNDATION]]
    result = collect(*blobs)
    (OUT / 'usda-records.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(f"Extracted {len(result['records'])} primary records; catalogs unchanged.")
