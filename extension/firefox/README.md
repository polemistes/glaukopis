# Glaukopis Notebook, the plugin for Firefox

The plugin adds what turns up while reading on the web to the notebook of
Glaukopis, with where it came from: the page's address and title, and when.
It adds one of four things:

- **The page**: its readable text, as Mozilla's Readability finds it (the
  whole text where it finds no article). The button in the bar where nothing
  is selected, *Add the page to the notebook* in the menu of the right
  button, or Alt+Shift+N.
- **What is selected**, with its links. The button in the bar, *Add the
  selection to the notebook*, or Alt+Shift+N where something is selected.
- **An image**: *Add the image to the notebook* on an image. It is read from
  the page as it is shown, or cut out of a picture of the tab where the page
  does not let it be read. Nothing is fetched.
- **A part of the page as a picture**: *Add a part of the page as a
  picture…*, then a rectangle marked with the pointer (Esc gives it up).

It hands the thing to a small helper that Firefox starts: Glaukopis itself,
in another role, which writes it into the notebook's inbox. Glaukopis takes
it in when it runs or the next time it starts. No port is opened, and
nothing leaves the computer. The plugin says only a sign on its button: a
tick when the thing was handed over, an exclamation mark when not, with the
reason as the button's title.

## What it asks for, and why

- `activeTab`: to read the tab in view when the button, the menu or the key
  is used, and only then. No other site is asked for.
- `scripting`: to read the page, the selection or the image in that tab, and
  to mark a part of it.
- `contextMenus`: the four items in the menu of the right button.
- `nativeMessaging`: to hand what was taken to Glaukopis on the same
  computer. Firefox says of it at installing that the plugin exchanges
  messages with programs other than Firefox.

It declares, as Mozilla asks, the data it hands to that program: the
address of the page (`browsingActivity`) and what is on it
(`websiteContent`).

## Trying it without a signature

First, in Glaukopis: *Settings › Firefox › Set up*, which tells Firefox of
the helper for this user.

Then either, in Firefox, `about:debugging` › *This Firefox* › *Load
Temporary Add-on…* and choose `manifest.json` in this folder; or, from this
folder, `npx web-ext run` (Firefox with a profile of its own, the plugin
loaded). A plugin loaded so runs until Firefox closes.

## Signing it

A plugin that stays installed is signed by Mozilla, which costs nothing and
needs an account at addons.mozilla.org, with its keys (the issuer and the
secret, under *Developer Hub › Manage API Keys*):

```
npx web-ext sign --channel=unlisted --api-key=<issuer> --api-secret=<secret>
```

Signed as *unlisted*, it is not shown on addons.mozilla.org; the signed
`.xpi` that comes back, in `web-ext-artifacts/`, is offered as a file, and
installed in Firefox by opening it. Raise `version` in `manifest.json` for
each new signing.

Version 1.0.0 is signed. The signed file is kept in `packaging/firefox/`,
whose README says where it goes at a release and what Mozilla's check said
of it. `web-ext-artifacts/` and `.amo-upload-uuid`, which the signing leaves
here, are not kept in git.

## Its parts

- `manifest.json`; `background.js`, the event page; `page.js`, what is done
  in the page; `reckon.js`, what is reckoned without a browser (tested by
  Glaukopis's tests, `src/lib/notebook/plugin.test.ts`, which take their
  types from `page.d.ts` and `reckon.d.ts`; Firefox does not read those).
- `_locales/`: its words, in English and Norwegian Bokmål.
- `icons/`: the owl, Glaukopis's own icon.
- `vendor/readability/`: Mozilla's Readability, as it is, with its licence.
