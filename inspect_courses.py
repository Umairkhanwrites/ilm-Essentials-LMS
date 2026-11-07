with open('src/data/mockData.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re

for cid in ['crs_found_01', 'crs_found_02', 'crs_found_03', 'crs_found_04', 'crs_found_05', 'crs_found_06']:
    matches = [m.start() for m in re.finditer(f'"{cid}"', text)]
    print(f"\n{cid} has {len(matches)} occurrences:")
    for idx in matches:
        line_no = text[:idx].count('\n') + 1
        print(f"  Line {line_no}: {text[idx:idx+80]}")
