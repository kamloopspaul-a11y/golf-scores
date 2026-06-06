#!/usr/bin/env python3
"""
validate-courses.py — schema guard for courses.json

Run this before every commit that touches courses.json (especially SI/index
data entry). It separates two concerns:

  1. SCHEMA ERRORS (blocking) — a hole object uses the wrong key name, e.g.
     "stroke_index" instead of "index". These mean the data is invisible to
     the app even though it looks present in the file. Commit is blocked.

  2. COMPLETENESS NOTES (informational) — a hole has the right key but no SI
     value yet (null/blank). This is expected for courses still waiting on
     scorecards and does NOT block a commit.

Why this exists:
On 2026-06-04, Sun Peaks and Talking Rock were given SI data using the key
"stroke_index" instead of "index". The app (index.html, courses.html,
apps-script.gs) reads/writes the field as "index" everywhere — so that data
was silently invisible to the app despite being present in the file. Fixed
2026-06-06; this script exists so it can't happen again unnoticed.

Usage:
    python3 validate-courses.py
    python3 validate-courses.py path/to/other-courses.json

Exit code 0 = no schema errors (safe to commit, even if SI is incomplete).
Exit code 1 = schema error(s) found — DO NOT COMMIT until fixed.
"""

import json
import sys

EXPECTED_HOLE_KEYS = {"par", "yardage", "index"}
# Any of these keys appearing on a hole is a hard schema error — the app
# will not read them. Maps bad-key -> correct-key for the message.
BANNED_ALIASES = {
    "stroke_index": "index",
    "strokeIndex": "index",
    "si": "index",
    "yards": "yardage",
}


def validate(path):
    with open(path) as f:
        data = json.load(f)

    schema_errors = []
    missing_si = {}   # course name -> count of holes with no SI yet
    courses_checked = 0
    holes_checked = 0

    for key, course in data.items():
        if key == "_meta" or not isinstance(course, dict):
            continue
        name = course.get("course_name", f"id {key}")
        courses_checked += 1

        tees = course.get("tees", {})
        for gender in ("male", "female"):
            for tee in tees.get(gender, []):
                tname = tee.get("tee_name", "?")
                holes = tee.get("holes", [])
                for i, h in enumerate(holes, start=1):
                    holes_checked += 1
                    if not isinstance(h, dict):
                        schema_errors.append(f"  [{name} / {tname} / hole {i}] not an object: {h!r}")
                        continue

                    # Hard error: banned alias key present anywhere on the hole
                    for bad, good in BANNED_ALIASES.items():
                        if bad in h:
                            schema_errors.append(
                                f"  [{name} / {tname} / hole {i}] uses '{bad}' (value {h[bad]!r}) "
                                f"— must be '{good}'. The app will not read this."
                            )

                    # Hard error: any key that isn't expected and isn't a banned alias
                    # we already reported above (avoid double-reporting aliases as 'unexpected')
                    unexpected = set(h.keys()) - EXPECTED_HOLE_KEYS - set(BANNED_ALIASES.keys())
                    if unexpected:
                        schema_errors.append(
                            f"  [{name} / {tname} / hole {i}] unrecognized key(s): {sorted(unexpected)}"
                        )

                    # Hard error: 'par' or 'yardage' missing (structural — index can be legitimately empty)
                    for ek in ("par", "yardage"):
                        if ek not in h and not any(bad in h and good == ek for bad, good in BANNED_ALIASES.items()):
                            schema_errors.append(
                                f"  [{name} / {tname} / hole {i}] missing required key: '{ek}'"
                            )

                    # Informational only: index absent, null, blank, or zero (SI not entered yet)
                    if h.get("index") in (None, "", 0):
                        missing_si[name] = missing_si.get(name, 0) + 1

    print(f"Checked {courses_checked} courses, {holes_checked} hole entries.\n")

    if schema_errors:
        print(f"SCHEMA ERRORS — {len(schema_errors)} (blocking, do not commit):\n")
        for p in schema_errors:
            print(p)
        print()

    if missing_si:
        print("SI not yet entered (informational — expected for courses awaiting scorecards):")
        for name, count in sorted(missing_si.items()):
            print(f"  {name}: {count} holes without SI")
        print()

    if schema_errors:
        print("Result: FAIL — fix schema errors above before committing courses.json.")
        return 1

    print("Result: PASS — schema is correct. (SI completeness notes above are informational only.)")
    return 0


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "courses.json"
    sys.exit(validate(path))
