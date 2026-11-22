# The plugin for Firefox, signed

`glaukopis-notebook-<version>.xpi` in this folder is the plugin of
`extension/firefox/` as Mozilla signed it: the file that is offered with
Glaukopis's packages, and installed in Firefox by opening it. It is not in
git, as no package is; it can be fetched again from the account at
addons.mozilla.org that signed it (*Manage My Submissions*), where every
signed version stays.

**1.0.0** was signed on 2026-11-16, as *unlisted*: signed by Mozilla, and
not shown in its collection of add-ons. It is the plugin exactly as the
source had it that day.

**1.0.1** was signed on 2026-11-16 and is not offered: it added a key for
a part of the page as a picture, Alt+Shift+P, which Firefox has for its own
menu of profiles, and a command without a key for the page whole.

**1.0.2** was signed on 2026-11-17 and is the plugin that is offered, from
the release of Glaukopis 0.2.13 on: the same, with keys of Ctrl+Alt, since
Firefox takes Alt+Shift and a letter for the letters of its own menus:
Ctrl+Alt+N for the selection or the page, and Ctrl+Alt+P for a part of the
page.

**1.0.3** is the same with the second version of the owl for its icon
(2026-11-22); it is to be signed, and offered from then on.

## At a release

The file goes into the release's folder with the packages
(`packaging/web/README.md`), is named in `SHA256SUMS`, and has a part of its
own on the page of packages. It is of use from the first version of
Glaukopis that has the notebook.

## A new version of the plugin

When anything under `extension/firefox/` changes that the plugin is made of:
raise `version` in its `manifest.json` (Mozilla signs each version once),
sign it as `extension/firefox/README.md` says, and put the file that comes
back here under its name. The keys are the owner's, and are never written
into this repository or into a command that is kept.

## What Mozilla's check says of it

No faults, and four warnings, each looked at on 2026-11-16 and left as it is:

- *Manifest key not supported by the specified minimum Firefox for Android
  version.* The lowest Firefox the plugin asks for is 140; on Android the
  declaration of what a plugin handles is known from 142. The plugin is for
  Firefox on a computer: it hands what it takes to Glaukopis on the same
  machine. Asking for 142 would quiet the warning and shut out Firefox 140
  on computers.
- *Unsafe assignment to innerHTML*, in `page.js`: the readable text of a
  page is put into a `<template>` to read its words. What a template holds
  is inert: nothing in it is run or loaded.
- *Unsafe assignment to innerHTML*, twice in `vendor/readability/`:
  Mozilla's own Readability, kept as it is published.
