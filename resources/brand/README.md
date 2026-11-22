# The owl

`owl.pdf` is the mark of Glaukopis: the owl of Athena, drawn by Robert Emil
Berge after a photograph of an Athenian tetradrachm of 454–404 BC (SNG
Copenhagen 39), in its second version (2026-11-22). `owl.png` is the
drawing set at 216 dots to the inch; `owl-icon.png` is a square cut out of
it around the owl's head, which is the icon of the application and the mark
where the mark is small.

> Classical Numismatic Group, Inc. http://www.cngcoins.com
> <https://commons.wikimedia.org/wiki/File:SNGCop_039.jpg>

The photograph is under the Creative Commons Attribution-Share Alike 3.0
Unported licence, among others, which asks that what is made after it has
the same licence. So the drawing has it: `owl.pdf`, and everything made of
it, `owl.png` and `owl-icon.png`, which is `glaukopis.png` here, the icons in `src-tauri/icons/` and the
marks `src/lib/shell/owl.png` and `owl-small.png`, and the icons of the plugin for
Firefox in `extension/firefox/icons/`, are under

**Creative Commons Attribution-Share Alike 3.0 Unported**
(<https://creativecommons.org/licenses/by-sa/3.0/>), the text of which is in
`LICENSE` beside this file.

Who uses the drawing names Robert Emil Berge as the one who drew it, and
Classical Numismatic Group, Inc. (http://www.cngcoins.com) as the source of
what it was drawn after, and says what was changed.

## What was done to it

`owl.png` is the drawing set from `owl.pdf` at 216 dots to the inch, and
`owl-icon.png` a square cut out of that around the head; nothing else is
done to them. The files made of them are made by `scripts/icons.sh`, which
cuts each to what is drawn in it, sets it in the middle of a square and makes
it smaller. For the marks within the application the white ground is taken
away, so that the lines can have the colour of the text. Nothing is drawn by
the script, and nothing in this directory is made by a machine that draws.

## The rest of the application

Everything else in Glaukopis is under the GNU General Public License,
version 3 or later; see `LICENSE` at the top of the tree. The drawing stands
beside the program and is not part of its code.
