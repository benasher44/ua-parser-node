#!/usr/bin/env python3
"""Refresh vendor/regexes.json from upstream uap-core.

Fetches regexes.yaml, drops the device_parsers section (unused by this
package's API), and writes a compact JSON conversion that src/lib.rs
includes at build time. Requires pyyaml: python3 -m pip install pyyaml
"""
import json, pathlib, re, sys, urllib.request

UPSTREAM = 'https://raw.githubusercontent.com/ua-parser/uap-core/master/regexes.yaml'
OUT = pathlib.Path(__file__).resolve().parent.parent / 'vendor/regexes.json'

import yaml

src = urllib.request.urlopen(UPSTREAM, timeout=30).read().decode()
data = yaml.safe_load(src)

# trim: this package exposes browser + OS only
trimmed = {
    'user_agent_parsers': data.get('user_agent_parsers', []),
    'os_parsers': data.get('os_parsers', []),
    'device_parsers': [],  # dropped on purpose
}
OUT.write_text(json.dumps(trimmed, separators=(',', ':')) + '\n')

n_ua = len(trimmed['user_agent_parsers'])
n_os = len(trimmed['os_parsers'])
print(f'{OUT.name}: {n_ua} browser + {n_os} os rules, {OUT.stat().st_size // 1024}KB')
