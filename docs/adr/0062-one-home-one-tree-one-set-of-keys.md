# 0062 — One home, one tree, one set of keys

Date: 2026-10-22. Status: accepted by the owner on 2026-10-22 in outline, from an assessment of how the interface handles the hierarchy of the owl, the folders, the projects and the elements; the keys revised the same day, after the owner set aside following Org mode strictly; to be built from `docs/plans/one-home-one-tree-one-set-of-keys.md`. Amends 0031 (folders of projects), 0033 (the pane of projects), 0037 (the owl map and side by side), 0050 (the owl map behaves as a tree) and 0051 (the map of the projects as one map). The key scheme of 2026-10-12, in the brief, is superseded where this record differs from it.

## Context

The owner, after using the application: still not happy with how the hierarchy of the owl, the folders, the projects and the elements works; could not move a project into another; knew that two projects can stand side by side but could not remember how, nor find it by looking. They asked for an assessment with three measures, simplicity, what is intuitive and obvious, and things making sense, and for suggestions to choose from.

What the assessment found, from the code, the records and the screenshots of the end-to-end scripts:

- **Two homes.** The home page (cards and list) and the map of all projects both stand above every project, and the ways between them cross. The house in the rail and Ctrl+1 open the page; the arrow at the left of a project's bar, labelled *All projects*, opens the page; the owl button one row below, with the same label, opens the map; the map's bar has an arrow back to the page, as if the page were above the map, while the page's list has the owl at its top, as if the map were above the page. The map's bar shows a view chooser with one choice.
- **The same things shown three times, with different menus.** The page's list, the list at the left and the map show the same folders and projects, but a project's menu differs by place: *Open beside* only in the list at the left; *Show its map here* and *Open the project here* only on the map; a folder has *Open the folder as a map* in the lists and a corner on the map. The copy called *A map of the projects…* is a fourth picture of the same things.
- **The seam at the project is hidden, so it surprises.** A project is drawn as the top element of its own map and its elements move on the top map as in their own, so the picture says one tree from the owl to the paragraph; but the rules change at the project without the picture saying so. Elements go under anything; a project goes only into a folder; a refused drop does nothing. Folders and projects both look like containers, yet only folders take projects.
- **Words.** *All projects* names four things; *map* names the view of an element, the map of all projects and the copy; *Side by side*, *Open beside* and *Two side by side* circle one thing; *Open the folder as a map*, *Open the project here* and *Show its map here* are three ways of saying enter.
- **The list at the left is off by default**, yet it is the only door to a project beside.
- **Several keys for one thing.** A new element after: Enter and Ctrl+Enter in the diagram, Ctrl+Enter in the text. A new element under: Tab and Ctrl+Shift+Enter in the diagram, Ctrl+Shift+Enter in the text. On the map of all projects Enter and Ctrl+Enter make a project, Tab and Ctrl+Shift+Enter a folder. Folding is Space in the diagram and on the map, Ctrl+Alt+U in the text. Tab in the name of an element in the text makes it deeper, as Alt+Right does. Ctrl+Enter is also a line break in the editors. The list at the left has keys of its own kind: Enter and Space open or toggle a row, Left and Right fold.

The owner chose five of the suggestions, left moving a project into another aside, and added a sixth: one way of going through and shaping the tree from the keys, because several ways of doing the same thing confuse. A first draft took Org mode's keys whole; the owner set that aside, since Org's logic is that of a linear text with one cursor and not the diagram's, and asked instead for a scheme in which each thing has one key, with Org's Alt+Enter for a new element, the same in the text and the diagram where it makes sense, and with a rule of their own: Alt+Enter at the start of a paragraph makes the paragraph the name of a new element at the same level, with the text below inside it. One key for each thing is the principle, not a rule: what makes sense wins.

## Decision

### One home: the map of all projects

- The map of all projects is the home. `#/` is the map at the owl; `#/owl/<folder>` the map at a folder, as today. The house in the rail and Ctrl+1 come here: from a project, to the folder the project is in, with the project selected and in view; from elsewhere, to the owl. The page of projects with its cards and its list goes, and with it the back arrow at the left of a project's bar, the back arrow of the map's bar and the map's view chooser of one choice. The owl at the left of the bar over a project's map, Alt+Shift+Up at the project's top, and the house are the ways up.
- The map has one bar, as high as the header of the list at the left: the button of the list, where one is (the owl, or the folders down to the one in view), a plus and a menu. **The plus** makes a new project; its menu has *New project*, *New folder*, and then *Join a shared project…*, *A project from a document…*, *Open a project file…* and *Open an Org file…*. **The menu** has *Deleted projects…* with their count, *A project of all the projects…* (the copy of 0031, with its new name), *Place everything by itself* and *Show all of it*. The ground's menu has *New project here*, *New folder here*, *Place everything by itself* and *Show all of it*, as today.
- With no project at all, the map shows what the page showed: the owl, *Welcome to Glaukopis*, the line under it, and the buttons that begin, join and open a project.
- A document dropped on the map's ground becomes a project of its own, named after it, in the folder in view, as one dropped on the page did.
- **Last used** is a form of the list at the left, not a page: a toggle at the head of the list shows the folders, or the twelve projects last worked on, newest first, each with when it was changed. The form is remembered in the arrangement as the page's form was.
- The settings window opens over the map as it opens over any view; the old place `#/settings` opens it over the map.

### Folders are regions

- A folder on the map is drawn as a region: a rounded box with a faint fill and a hairline, its name at its upper inner edge in the folder's small letters, the fold sign before the name as today. Everything in the folder stands inside the box: its folders as boxes within it, its projects as the top elements of their maps, with their trees opening outwards from the owl as today. The box is the bounding box of the folder's name and of everything shown under it, with a padding, so that it grows when a map is unfolded inside it and when a project is placed by hand within it. Folded, the box is the name and the count alone.
- Lines go from the owl, or from the folder at the centre, to each project in no folder and to the edge of each region; no line is drawn from a folder to what is inside it, since the box says it. Within a region the lines from a project to its trees are as they are.
- A folder entered, at the centre, is drawn as today: its name with the corner that goes up, and what is in it laid out to both sides, with no box around the whole.
- A drop anywhere inside a region that is not on an element goes into the folder, and the region is marked as the diagram marks a target; a drop on the owl goes out of all folders. A project no longer takes a project or a folder dropped on it: it is refused, and the pointer says so. Elements dropped on a project's top element, or on an element of its opened map, go under it or are carried, as today.
- The ring of the selection goes around the region. Dragging a region's name drags the folder with all in it, as today. Positions by hand, kept in `folders.json`, are unchanged: a thing placed within a folder keeps its place from the folder.

### One menu for a project, one for a folder, one word for going in: Enter

- **Going in is called Enter everywhere**: entering an element in the diagram and the text (*Enter* replaces *Open as a map*), entering a folder on the map and in the list (replaces *Open the folder as a map*), opening a project at its top or at an element of its map (replaces *Open the project*, *Open the project here*, *Open*). The corners in the diagram, the text and the map say *Enter* and *Up to “…”*. Showing a project's map on the top map is *Unfold* and *Fold*, as the folding of an element.
- **The menu of a project**, the same on the map and in the list at the left, in this order: *Enter*; *Enter beside*, while another project is open and this is not it; *Unfold* or *Fold*, where the place shows the map; then *Rename*, *Duplicate*, *History…*, *Save as a file…*, *Save as Org…*; then *Move to folder ▸* and *Out of folders*; then *Delete*. Each item that has a key shows it. The project that is open is not entered, renamed or deleted from the list, as today.
- **The menu of a folder**: *Enter*; *Unfold* or *Fold*; then *New project here*, *New folder here*, *Rename*; then *Move to folder ▸*, *Out of folders*; then *Delete the folder*.
- **The menu of an element of a project's map** shown on the top map, or under a closed project in the list: *Enter*; *Enter beside*, in the list while another project is open; *Unfold* or *Fold*.
- *All projects* names the map alone: its centre, the owl row at the top of the list, and the owl button in the bar of a project. *Map* names the view of an element and the map of all projects; the copy is *A project of all the projects…*.

### Side by side is a menu

- The *Side by side* button in a project's header opens a menu: **This element, as diagram and text**, which is what the button did; **Another element…**, which opens the chooser of elements of this project, with a field that finds one by its name, and shows the element chosen in the second side; **Another project…**, which opens a chooser with the list of projects, folders and all, with the field that finds one, and under a project its trees, and shows the project chosen, at its top or at the element chosen, in the second side; and, while two sides are shown, **One at a time**, which closes the second. The button is lit while two sides are shown. The menu has the key Ctrl+Shift+S.
- *Enter beside* in the menu of a project or of one of its elements, wherever that menu is shown while a project is open, does what *Another project…* does for that project.
- What 0037 says of two projects side by side holds: both bars begin with the project's name and badge, the line between them is doubled, a drop across it says what it will do.

### One key for each act, through the tree

The tree is shown in four places: the diagram, the text, the map of all projects and the list at the left. Each act has one key, the same in every place where the act exists, and an act that exists in one place only has its key there. Org mode gives the shape where it fits, Alt+Enter for a new element and Alt with the arrows for moving, and nothing more. Every other key for the same act goes, but for two habits of every system that harm nothing.

| Key | Does, wherever the tree is shown |
| --- | --- |
| **Alt+Enter** | A new element after the one selected, named in place; in the text, a heading at the cursor, as below. On the map of all projects and in the list: a new project beside the one selected or in the folder selected, or at the top. With nothing selected in the diagram: under the element in view. |
| **Alt+Shift+Enter** | A new element under the one selected, the first; in the text, a heading at the cursor, under the element the cursor is in. On the map of all projects and in the list: a new folder, in the folder selected or beside the thing selected. |
| **Alt+Up**, **Alt+Down** | Moves the element among those beside it, with all under it; in the text the cursor stays. Folders and projects stand by their names and do not move; elements of a project's map shown on the top map or in the list move as in their own map. |
| **Alt+Right**, **Alt+Left** | Deeper and less deep. In the diagram and on the map, as the arrow points on the screen: away from the centre is deeper. In the text and in the list, Right is deeper. On the map and in the list a folder or a project goes into the folder before it, or out of the one it is in. |
| **Alt+Shift+Down** | Enters: the element selected or the cursor's becomes the one in view; a folder comes to the centre; a project opens at its top or at the element selected, in the diagram. |
| **Alt+Shift+Up** | Up: to the element over the one in view; from a project's top, to the map at its folder with the project selected; from a folder, to what holds it. |
| **Enter** | Opens, as a double click does. In the diagram: the text box of the element selected. On the map of all projects: the project opens at the project or at the element selected, in its text; a folder, which has no text, is entered. In the list: what a click on the row does. In a text: a new paragraph, as today. |
| **Tab** | Folds what is under the element, the folder or the project's map, or unfolds it. In the text, with the cursor in a name; in a list item of a text, one level in, as today. |
| **Shift+Tab** | Where anything under the element in view is folded, unfolds all of it; else folds everything at the first level. On the map of all projects: every folder and every project's map. In a list item of a text: one level out. |
| **F2**, a letter | Rename what is selected; a letter begins a new name. In the text, F2 puts the cursor in the name of the element it is in, the name selected. |
| **Delete** | Delete what is selected, after the question the place asks. In a text, a letter; the element goes from its menu. |
| **The arrows** | From one to the next: in the diagram and on the map by direction, in the list up and down the rows, Left to the row it stands under and Right to the first row under it. With Shift, more are selected where the place selects several. In a text, the cursor. |
| **Shift+F10** | The menu of what is selected. |
| **Ctrl+A** | Select all, where the place selects several. |

**A heading at the cursor.** In the text, Alt+Enter makes a new element at the cursor: what follows the cursor in its paragraph becomes the element's name, and the paragraphs below it, to the end of the text of the element the cursor is in, become its text. So at the start of a paragraph the whole paragraph is the name; at the end of a paragraph the name is empty and the paragraphs below go in; in the middle, the tail of the paragraph is the name. In a name, at its end, a new element after it with nothing in it, as today; in the middle, the rest of the name becomes the new name and the text stays where it is. Alt+Shift+Enter does the same with the new element the first under the one the cursor is in. A name holds italics, small capitals, raised and lowered text and nothing else: where what would become the name holds a citation, a note, a picture, a formula, a reference mark or a mark a name cannot hold, it becomes the first paragraph of the new element's text instead, the name stays empty, and a message says why. Where the element the cursor is in has sub-elements, the new element after it is made first among them, so that it stands in the text where the cursor was and the sub-elements stay with their element; the text does this today, and the project at the top, which has nothing beside it, is treated the same.

What goes: Enter and Tab as new, in the diagram and on the map; Ctrl+Enter and Ctrl+Shift+Enter as new, in the diagram, the text and on the map; Ctrl+Enter as a line break in the editors, since Shift+Enter is the line break; Space as fold; Alt+Enter as write the text; Tab and Shift+Tab as deeper and less deep in a name; Ctrl+Alt+U and Ctrl+Alt+Shift+U; Enter, Space, Left and Right as fold in the list. What stays, though it is a second key: Ctrl+Y beside Ctrl+Shift+Z for redo, and F3 in the text beside Enter in the search field. The key sheet shows the set once, under *In the tree*, and says where it holds; what remains of each place's own keys stands under that place as today. The hints at the foot of the text say the new keys.

## Choices made in writing this, which the owner has not been asked about

1. **A new element under has a key of its own, Alt+Shift+Enter**, rather than Org's new heading and a change of level: a child and a sibling are two acts, and the key is the one the text has for it today, with Alt for Ctrl.
2. **Enter opens**: the text box in the diagram, a project in its text from the map. Alt+Shift+Down enters the map. The two are not the same act. On a folder, which has no text, Enter enters, so a folder has two keys for it; and in the list Enter does what a click does, since that is what Enter does in every list.
3. **Alt+Shift+Down and Up stay as the pair that goes in and up**, which the owner chose on 2026-10-12.
4. **Tab folds**, because it works with the cursor in a name of the text as well as in the diagram; Space, nicer in the diagram, is a space in a text and would need a second key beside it.
5. **Shift+Tab is two states, not Org's three**: the fold of an element is one flag, kept in the project and shared.
6. **The new element goes first among the sub-elements** of the element the cursor is in, where it has any. After the whole element would put the heading out of sight below them; taking them along, as Org does, would reparent them in the diagram unasked. This is what the text does today.
7. **The tail of a paragraph becomes the name** when Alt+Enter is pressed in its middle, so that one rule covers the start, the middle and the end of a paragraph. Today the tail goes into the text and the name is empty.
8. **Alt+Shift+Enter makes a folder on the map and in the list**: it is the other new thing there, as the element under is the other new thing in the diagram.
9. **Ctrl+Y and F3 stay** as second keys, since the owner made the one key a principle and not a rule, and both are habits of every system.
10. **The list at the left gets the keys of the tree**, with one row selected at a time and Up and Down between rows, so that it is the fourth place of the one set rather than a list of its own kind.
11. **The Side by side menu has the key Ctrl+Shift+S**, one key for the menu, none for its items.
12. **Last used lives in the list at the left**, as a form of it, since the list is the one list and the map shows no order of time.
13. **A project dropped on a project is refused with a word**, since a project is not a folder and the owner has set aside moving projects into projects.

## Why not otherwise

- *Keep the page as the home and put the map back as its third form*: cheaper, but the map stays a picture one visits rather than the place one works from, against the owner's aim of one big map from the owl down.
- *Let projects nest, as folders do*: the one-big-map wish taken whole, but every view, the printing, the search and the sharing would meet a foreign document inside a tree. Set aside by the owner.
- *Take Org mode's keys whole*: its logic is that of a linear text with one cursor; its trick of Tab changing the level of a fresh heading has no home in a diagram with a selection; and its keys for going about are Emacs chords. Set aside by the owner.
- *Enter as the key that enters, everywhere*: then writing the text of an element from the keys would need a key with no convention behind it, and the pair of 2026-10-12 would lose its down.

## Consequences

- `ProjectsView.svelte` goes; the route `projects` goes; the house and Ctrl+1 come to the map. The empty state of the map takes the welcome and the buttons, so that the scripts that begin at *Welcome to Glaukopis* and *Begin a project* hold.
- `projects_shown` of the core is kept as the form of the list at the left: `recent` is *Last used*, `list` is *Folders*.
- The layout gains a margin per node, so that the regions of sibling folders do not touch; the owl map draws the regions and skips the lines inside them.
- The table of keys gains a place `tree`, in force with the diagram, the text, the map and the list; the entries of the diagram, the text and the map that it replaces go; `writing-break` goes.
- The splitting of a text at the cursor changes: the tail of the paragraph becomes the name, where a name can hold it.
- The guide's sections *A first project*, *Many projects*, *The map of the projects*, *The diagram*, *The text*, *One tree, entered anywhere* and *Keys* are rewritten where they name the keys, the page or the words.
- The scripts that press the old keys are revisited; a script of its own, `e2e/tree-keys.mjs`, presses the one set in all four places.
- The words of the other languages lag, as usual; English and Norwegian Bokmål are done with the build.

## Addendum, 2026-10-23: as built

Built on 2026-10-23 in six stages, two of them by agents in worktrees (the keys of the diagram and the text; the Side by side menu), merged into main. Where the build departs from the plan:

- **The plus of the map's bar begins a project as Begin a project did**: it asks the name and opens the project. A folder made from it is named in place, and Alt+Enter and Alt+Shift+Enter on the map make both in place, as planned. Beginning a project is mostly the wish to write in it.
- **The list's first form is called Folders**, so that *All projects* names the map alone, and it is the default; the core's command answered *recent* where nothing was chosen, and answers *list* now. The list keeps its button for a new folder beside the field.
- **In the list, Alt+Enter, Alt+Shift+Enter and F2 ask by the dialog**, not in a field on the row; the map names in place.
- **Enter in the list does what a click does**, and on a folder that is to enter it on the map, as on the map; a click on a folder still folds it.
- **A folder's name stays at the middle of its region's inner edge**, where the layout puts it, not at its upper edge: there it would leave a gap where the layout keeps room for it.
- **A drop target may say why it refuses** (`refuses` in `ui/drag.svelte.ts`), and nothing around it then takes the drop; the label by the pointer says the reason. A project says that a project goes into a folder, not into a project.
- **In the diagram's name field, Alt+Enter and Alt+Shift+Enter keep the name and make the next element**, as they do in the text.
- **A heading at the cursor leaves a block of parallel text or a table whole**: inside one, the name is empty and the new element's text begins at the block after it. Spaces are trimmed at the ends of the new name.
- **Shift+Tab is known by where Tab is on the keyboard**, since under X it arrives by another name.
- **This element, as diagram and text always gives two sides**; one is closed only by *One at a time*. Unfolding a project's tree in the chooser of a project beside unfolds it in the list too: the two share their folds.
- **The other languages** lose the messages whose meaning changed and show English for them until they are translated anew; English and Norwegian Bokmål are complete.
