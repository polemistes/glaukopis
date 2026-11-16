#!/usr/bin/env python3
"""Writes the list of emojis the picker offers (src/lib/ui/EmojiPicker.svelte).

    python3 -I scripts/make-emoji-list.py <emoji-test.txt> [<module.ts>]

The file is Unicode's own, https://unicode.org/Public/emoji/latest/emoji-test.txt
(or the file of a named version, https://unicode.org/Public/emoji/<version>/).
It is data that is not trusted: fetch it into a directory of its own, give
this script its path, and run the script with -I, so that nothing in that
directory is loaded as code. The file is not kept in the repository; the
module this writes is, and is not changed by hand: change this script, or
fetch a newer file, and make the list again.

The module is written to src/lib/ui/emoji-list.generated.ts unless another
path is given.

What is taken: the fully qualified emojis of Emoji 14.0 or earlier, which the
fonts of the systems people have hold. What is left out: the group Component
(the skin tones and hair styles that are only parts of others), every emoji
with a skin tone, and the flags of countries and regions (Windows draws none
of them), except the few other flags, which stand last among the symbols.
Unicode's groups are kept, in Unicode's order, as seven of the eight the
picker shows; its Smileys & Emotion is the picker's Smileys, and its People
& Body the picker's People.
"""

import re
import sys
from pathlib import Path

# The newest Emoji version whose emojis are taken.
NEWEST = (14, 0)

# Unicode's groups, by its own names, and what the picker calls them. A group
# that is not here and not in LEFT_OUT stops the script: a new version may
# have a new one, which should be looked at before it is taken or left out.
GROUPS = {
    "Smileys & Emotion": "smileys",
    "People & Body": "people",
    "Animals & Nature": "nature",
    "Food & Drink": "food",
    "Travel & Places": "travel",
    "Activities": "activities",
    "Objects": "objects",
    "Symbols": "symbols",
    # Of the flags only the subgroup `flag` is taken, and stands in the symbols.
    "Flags": "symbols",
}
LEFT_OUT = {"Component"}
# The subgroups of Flags that are not taken: the flags of countries and regions.
FLAGS_LEFT_OUT = {"country-flag", "subdivision-flag"}

SOURCE = "https://unicode.org/Public/emoji/latest/emoji-test.txt"

DATA = re.compile(
    r"^(?P<points>[0-9A-F]{4,6}(?: [0-9A-F]{4,6})*)\s*;\s*(?P<status>[a-z-]+)\s*"
    r"#\s*(?P<emoji>\S+)\s+E(?P<major>\d+)\.(?P<minor>\d+)\s+(?P<name>.+?)\s*$"
)


def fail(message):
    sys.exit(f"make-emoji-list: {message}")


def header(lines, key):
    for line in lines:
        if line.startswith(f"# {key}:"):
            return line.split(":", 1)[1].strip()
    fail(f"the file has no line `# {key}:`")


def skin_tone(points):
    return any(0x1F3FB <= p <= 0x1F3FF for p in points)


def read(path):
    text = Path(path).read_text(encoding="utf-8")
    # Not splitlines(): what Python takes for a line end is more than the file's.
    lines = text.split("\n")
    version = header(lines[:40], "Version")
    date = header(lines[:40], "Date").split(",")[0].split(" ")[0]
    if not re.fullmatch(r"\d+\.\d+", version) or not re.fullmatch(r"\d{4}-\d\d-\d\d", date):
        fail(f"the version {version!r} or the date {date!r} is not as expected")

    taken = {group: [] for group in dict.fromkeys(GROUPS.values())}
    group = subgroup = None
    seen = set()
    for number, line in enumerate(lines, 1):
        line = line.rstrip("\r")
        if line.startswith("# group:"):
            group = line.split(":", 1)[1].strip()
            if group not in GROUPS and group not in LEFT_OUT:
                fail(f"line {number}: a group not known, {group!r}")
            continue
        if line.startswith("# subgroup:"):
            subgroup = line.split(":", 1)[1].strip()
            continue
        if not line or line.startswith("#"):
            continue
        found = DATA.match(line)
        if not found:
            fail(f"line {number}: not as a line of emojis is: {line[:80]!r}")
        if group is None:
            fail(f"line {number}: an emoji before any group")
        if group in LEFT_OUT:
            continue
        if found["status"] != "fully-qualified":
            continue
        if (int(found["major"]), int(found["minor"])) > NEWEST:
            continue
        if group == "Flags" and subgroup in FLAGS_LEFT_OUT:
            continue
        points = [int(p, 16) for p in found["points"].split(" ")]
        if any(p > 0x10FFFF or 0xD800 <= p <= 0xDFFF for p in points):
            fail(f"line {number}: a code point that is no character")
        if skin_tone(points):
            continue
        emoji = "".join(chr(p) for p in points)
        if emoji != found["emoji"]:
            fail(f"line {number}: the emoji and its code points do not agree")
        if "'" in emoji or "\\" in emoji:
            fail(f"line {number}: an emoji that cannot stand in a string as it is")
        name = found["name"]
        # The name stands in a comment: nothing in it may end the line or be unseen.
        if not name.isprintable():
            fail(f"line {number}: a name that is not plain to read")
        if emoji in seen:
            fail(f"line {number}: {emoji} stands twice")
        seen.add(emoji)
        taken[GROUPS[group]].append((emoji, name))
    return version, date, taken


def write(version, date, taken, out):
    ids = list(taken)
    lines = [
        "// The emojis the picker offers, by Unicode's groups, in Unicode's order.",
        "//",
        "// Made by scripts/make-emoji-list.py from Unicode's emoji-test.txt",
        f"// ({SOURCE}),",
        f"// Emoji version {version} of {date}: the fully qualified emojis of Emoji",
        f"// {NEWEST[0]}.{NEWEST[1]} or earlier, without skin tones and without the flags of",
        "// countries and regions. Not changed by hand: change the script, or fetch",
        "// a newer file, and make the list again.",
        "",
        f"export const EMOJI_VERSION = '{version}';",
        "",
        "export const EMOJI_GROUP_IDS = [",
        *[f"  '{i}'," for i in ids],
        "] as const;",
        "",
        "export type EmojiGroupId = (typeof EMOJI_GROUP_IDS)[number];",
        "",
        "/** The emojis of each group, each with the name Unicode gives it, in a comment. */",
        "export const EMOJIS: Record<EmojiGroupId, readonly string[]> = {",
    ]
    for i in ids:
        lines.append(f"  {i}: [")
        lines.extend(f"    '{emoji}', // {name}" for emoji, name in taken[i])
        lines.append("  ],")
    lines.append("};")
    Path(out).write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    if len(sys.argv) not in (2, 3):
        fail("usage: make-emoji-list.py <emoji-test.txt> [<module.ts>]")
    here = Path(__file__).resolve().parent
    out = sys.argv[2] if len(sys.argv) == 3 else here.parent / "src/lib/ui/emoji-list.generated.ts"
    version, date, taken = read(sys.argv[1])
    for i, emojis in taken.items():
        if not emojis:
            fail(f"the group {i} holds nothing")
    write(version, date, taken, out)
    for i, emojis in taken.items():
        print(f"{i:11} {len(emojis):5}")
    print(f"{'in all':11} {sum(len(e) for e in taken.values()):5}  (Emoji version {version}, {date})")


if __name__ == "__main__":
    main()
