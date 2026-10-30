# A file of the library shown in a side of the window: its pages, its bar, and what can go wrong.

viewer-file = File
# The page in view, of how many: "Page 3 of 271".
viewer-page-of = Page { $page } of { $count }
# The number the page has in print, where it differs from its count: shown after the count, small.
viewer-printed = ({ $label })
viewer-go-to-page = Go to page
viewer-zoom = Zoom
viewer-fit-width = As wide as the view
viewer-zoom-percent = { $percent }%
viewer-not-drawn = This page could not be drawn: { $why }
viewer-not-found = The file is no longer in the library.
viewer-locked = The file asks for a password, and cannot be shown.
viewer-not-shown = This kind of file cannot be shown here: open it in another program.
viewer-loading = Opening the file…
# The zoom of an image, fitted: all of it seen, however small that makes it.
viewer-fit-image = The whole image in the view
# The field in which a zoom is written, in percent.
viewer-zoom-field = Zoom, in percent
viewer-zoom-choose = Choose a zoom
viewer-tree-files = Files
viewer-tree-empty = Nothing here yet

# A simple image editor (docs/plans/a-simple-image-editor.md): the button in the bar, the row under it, and what it says.
viewer-edit = Edit
viewer-edit-turn-left = Turn left
viewer-edit-turn-right = Turn right
viewer-edit-flip-sideways = Flip sideways
viewer-edit-flip-over = Flip upside down
viewer-edit-crop = Crop
viewer-edit-brightness = Brightness
viewer-edit-contrast = Contrast
viewer-edit-saturation = Saturation
# How much of a colour the image has, 100 being as it is.
viewer-edit-percent = { $percent } %
# Puts one slider back at 100 %.
viewer-edit-as-it-was = As it was
viewer-edit-start-again = Start again
viewer-edit-keep = Keep as a new file
# The size the crop cuts to, of the size of the whole: "Cut to 800 × 600 of 1600 × 1200".
viewer-edit-cut-to = Cut to { $width } × { $height } of { $fullWidth } × { $fullHeight }
viewer-edit-leave-title = Leave without keeping?
viewer-edit-leave-message = What was changed is lost.
viewer-edit-leave = Leave
viewer-edit-kept = Kept as { $name }
viewer-edit-not-kept = The edited image could not be kept
viewer-edit-not-opened = The image could not be opened for editing
viewer-edit-too-large-title = Too large to be edited
viewer-edit-too-large-message = The image is larger than { $most } MB, which is the most an image may be. A smaller copy can be made and edited instead.
viewer-edit-make-smaller = Make a smaller copy

# Sources in tabs, bookmarks in a file (docs/plans/sources-in-tabs-bookmarks-and-the-scrolling-of-pages.md).
viewer-tabs = Tabs
viewer-tab-add = Add a file…
viewer-tab-add-title = Add files to the tabs
viewer-tab-menu = The tab's menu
viewer-tab-close = Close the tab
viewer-tab-close-others = Close the other tabs
viewer-tab-again = Open again in a new tab
viewer-tab-in-library = Show in the library
viewer-tab-gone = No longer in the library
viewer-tabs-none = No files here yet
# The tooltip of the project's name in the cell of a file side.
viewer-sources-of = The tabs of { $name }
viewer-places = Bookmarks and contents
viewer-bookmark-here = Mark this place
viewer-bookmarks = Bookmarks
viewer-bookmarks-none = No bookmarks yet
# The default name of a bookmark, and the small page said beside one.
viewer-bookmark-page = Page { $label }
viewer-bookmark-name = The bookmark's name
viewer-bookmark-rename = Rename
viewer-bookmark-remove = Remove
viewer-bookmark-not-kept = The bookmarks could not be kept
viewer-contents = Contents
viewer-contents-none = The file has no table of contents of its own

# The tabs opened, files by their references, a file read in the library (docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md).
viewer-back-to-files = Back to the files
