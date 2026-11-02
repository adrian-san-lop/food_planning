"""Rebuild current CSVs from preserved L2 rows and the reviewed L3 evidence.

Offline, deterministic, never changes canonical catalogs or historical CSVs.
Run after: node scripts/catalog-audit.mjs --write
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/audits/catalog-quality/results'
DATA = OUT / 'source-data'
def read(path):
    return json.loads(path.read_text(encoding='utf8'))
def load_rows(name):
    with (DATA / ('l2-' + name)).open(encoding='utf-8-sig', newline='') as handle:
        reader = csv.DictReader(handle)
        return reader.fieldnames, list(reader)
def write_rows(name, headers, rows):
    with (OUT / name).open('w', encoding='utf8', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)

foods = read(ROOT / 'data/foods.json')['foods']
recipes = read(ROOT / 'data/recipes.json')['recipes']
plan = read(DATA / 'source-plan.json')
sources = read(DATA / 'usda-records.json')
changes = read(DATA / 'catalog-changes.json')
impact = read(OUT / 'recipe-impact.json')
by_food = {f['id']: f for f in foods}
by_recipe = {r['id']: r for r in recipes}
macros = ['kcal', 'protein_g', 'carbohydrates_g', 'fat_g']
food_changes = {c['food_id']: c for c in changes['foods']}
recipe_changes = {c['recipe_id']: c for c in changes['recipes']}
headers, rows = load_rows('foods-audit.csv')
manufacturer = {
    'freshMozzarella': ('Galbani Mozzarella Fresca Bola 100g y 125g', 'Galbani Fresca Bola', 'https://galbani.es/quesos-galbani/galbani-mozzarella-fresca-bola-100g-y-125g/', [220, 17, 2, 16]),
    'gulas': ('La Gula del Norte Natural', 'Natural, refrigerado', 'https://laguladelnorte.es/producto/natural/', [163, 9.5, 7.8, 10]),
}
comparable = set()
for row in rows:
    fid = row['food_id']; food = by_food[fid]; p = plan[fid]
    original_reason = row['reason']
    for key in macros: row['current_' + key] = food['nutrition'][key]
    row['source_text'] = food['nutritionSource']
    row['name'] = food['name']
    if fid in food_changes:
        row['source_class'] = 'USDA'
    record = sources['records'].get(str(p['fdc_id']))
    if record:
        row.update(reference_name=record['description'], reference_id='FDC ' + record['fdc_id'] + (' / NDB ' + record['ndb_number'] if record.get('ndb_number') else ''),
                   reference_url=record['archive_url'], accessed_at='2026-10-19', reference_form=record['description'], reference_basis=p.get('catalog_basis', 'per_100g'),
                   match_quality='not_comparable' if p['comparison'] == 'not_comparable' else 'close')
        for key in macros:
            value = record['nutrients'][key]['amount'] * p.get('reference_factor', 1)
            row['reference_' + key] = round(value, p['round_decimals']) if 'round_decimals' in p else value
    elif fid in manufacturer:
        title, identifier, url, values = manufacturer[fid]
        row.update(reference_name=title, reference_id=identifier, reference_url=url, accessed_at='2026-10-19', reference_form='packaged', reference_basis='per_100g', match_quality='close')
        for key, value in zip(macros, values): row['reference_' + key] = value
        p = {**p, 'note': p['note'] + ' Derechos reservados; extracción puntual para contraste, reutilización masiva no aclarada.'}
    # Preserve correctly documented L1 manufacturer evidence when no new record exists.
    if row['match_quality'] in ['close', 'exact']:
        comparable.add(fid)
        difference = float(row['current_kcal']) - float(row['reference_kcal'])
        row['delta_kcal_absolute'] = round(abs(difference), 6)
        row['delta_kcal_percent'] = round(abs(difference) / float(row['reference_kcal']) * 100, 6) if float(row['reference_kcal']) else ''
        row.update(review_status='verified_keep' if fid in food_changes else 'verified_candidate_change', evidence_status='CONFIRMADO' if fid in food_changes else 'CANDIDATO', proposed_action='none' if fid in food_changes else 'investigate')
    else:
        row['delta_kcal_absolute'] = ''; row['delta_kcal_percent'] = ''
        row['review_status'] = 'not_comparable' if row['match_quality'] == 'not_comparable' else 'pending_source'
    contributions = []
    for recipe in recipes:
        total = next(i['after']['kcal'] for i in impact if i['recipe_id'] == recipe['id'])
        for ingredient in recipe['ingredients']:
            if ingredient['foodId'] != fid: continue
            factor = ingredient['amount'] / recipe['baseServings']
            if food['nutrition']['basis'] != 'per_unit':
                factor *= food.get('approximateEdibleWeight_g_per_unit', 1) if ingredient['unit'] == 'ud' else 1
                factor /= 100
            contributions.append((factor * food['nutrition']['kcal'], total))
    all_energy = sum(r['after']['kcal'] for r in impact)
    row['recipe_energy_share_percent'] = round(sum(c[0] for c in contributions) / all_energy * 100, 6)
    detail = p['note']
    if fid in food_changes:
        change = food_changes[fid]
        detail += ' | ' + ('CORREGIDO: ' if change['before'] != change['after'] else 'TRAZABILIDAD MEJORADA, cifras conservadas: ') + json.dumps({'before': change['before'], 'after': change['after']}, ensure_ascii=False)
    if record and p['comparison'] != 'not_comparable':
        detail += ' | Diferencias actuales menos referencia (método original de hidratos puede no ser homogéneo): ' + json.dumps({k: round(float(row['current_' + k]) - float(row['reference_' + k]), 6) for k in macros})
    row['reason'] = original_reason + ' | L3/L4 2026-10-19: ' + detail + ' | Histórico previo inalterado: source-data/l2-foods-audit.csv. close no certifica identidad del producto comprado.'
write_rows('foods-audit.csv', headers, rows)

headers, recipe_rows = load_rows('recipes-audit.csv')
for row in recipe_rows:
    rid = row['recipe_id']; recipe = by_recipe[rid]
    row['name'] = recipe['name']
    row['description_present'] = str(bool(recipe.get('description'))).lower()
    totals = next(r for r in impact if r['recipe_id'] == rid)
    for key in macros: row['base_' + key] = round(totals['after'][key], 6)
    unknown = set(); energy = 0
    for item in recipe['ingredients']:
        fid = item['foodId']; food = by_food[fid]
        if fid in comparable: continue
        unknown.add(fid)
        factor = item['amount'] / recipe['baseServings']
        if food['nutrition']['basis'] != 'per_unit':
            factor *= food.get('approximateEdibleWeight_g_per_unit', 1) if item['unit'] == 'ud' else 1
            factor /= 100
        energy += factor * food['nutrition']['kcal']
    row['unverified_food_ids'] = ';'.join(sorted(unknown))
    row['estimated_energy_from_unverified_foods_percent'] = round(energy / totals['after']['kcal'] * 100, 6) if totals['after']['kcal'] else 0
    if rid in recipe_changes:
        row.update(steps_ingredient_consistency='Instrucciones, alternativa o descripción aclaradas L3/L4; cantidades intactas', culinary_review_status='reviewed_ok', evidence_status='CONFIRMADO', proposed_action='none')
    row['reason'] += ' | L3/L4: recálculo tras correcciones nutricionales; delta por ración=' + json.dumps(totals['delta']) + '. Revisión documental, sin ejecución de cocina. Histórico L2 en source-data/l2-recipes-audit.csv.'
write_rows('recipes-audit.csv', headers, recipe_rows)
stats = {'food_count': len(rows), 'recipe_count': len(recipe_rows), 'primary_records': len(sources['records']),
         'comparable_foods': len(comparable), 'not_comparable': sum(r['match_quality'] == 'not_comparable' for r in rows),
         'pending_source': sum(r['review_status'] == 'pending_source' for r in rows),
         'nutrition_changed': sum(c['before'] != c['after'] for c in changes['foods']),
         'source_text_improved': len(food_changes), 'recipe_text_improved': len(recipe_changes),
         'recipes_nutrition_changed': sum(any(abs(r['delta'][k]) > 1e-9 for k in macros) for r in impact),
         'recipes_with_uncompared_energy': sum(float(r['estimated_energy_from_unverified_foods_percent']) > 0 for r in recipe_rows)}
(OUT / 'automation-status.json').write_text(json.dumps(stats, indent=2) + '\n', encoding='utf8')
print(json.dumps(stats))
