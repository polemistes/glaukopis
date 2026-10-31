# The settings.

settings-title = Settings
settings-error-system = Something about the application could not be read
settings-error-read = The settings could not be read
settings-error-save = The settings could not be saved
settings-error-fonts = The fonts of this computer could not be listed
settings-error-templates = The templates could not be listed
# A damaged file of settings was renamed and left beside where it was; $path is where it is now.
settings-set-aside = The settings could not be read, and are set aside as { $path }; the defaults are used
settings-set-aside-person = The settings could not be read, and are set aside as { $path }; the defaults are used, and this computer is a new person in the history of projects

## Appearance

settings-appearance = Appearance
settings-theme = Colours
settings-theme-system = As the system
settings-theme-light = Light
settings-theme-dark = Dark
# A theme of pastel colours, warm and soft.
settings-theme-mellow = Mellow
settings-theme-own = Your own
settings-own = Your own colours
settings-own-paper = Paper
settings-own-ink = Ink
settings-own-accent = Accent
settings-own-gold = Second voice
settings-own-begin = Begin from
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Hard to read: the ink stands at { $ink } to 1 on the paper and the accent at { $accent } to 1; 4.5 and 3 or more read well.
settings-text-size = Size of your text in the text editor
settings-editor-font = Editor font
settings-editor-font-default = As the interface (Literata)
# How the text of a map shows how deep each element stands: on the screen only.
# How the text editor shows how deep each element stands: on the screen only.
settings-text-depth = Document structure
settings-text-depth-numbers = Numbers
settings-text-depth-dots = Dots
settings-text-depth-indent = Set in, with lines
# Whether the number a heading will print stands before its name in the text view and the diagram: the outline has it always.
settings-heading-numbers = Numbers of the headings, as the document prints them
settings-heading-numbers-shown = Shown
settings-heading-numbers-hidden = Hidden
settings-interface-size = Size of the interface
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
# A sentence with every letter of the language's alphabet (a pangram), set in
# the size and the font chosen; where no good pangram is known, the alphabet.
settings-sample = Pack my box with five dozen liquor jugs.
# The three levels of the sample of the document structure, the sample sentence under the third.
settings-sample-heading = Heading
settings-sample-subheading = Subheading
settings-sample-third = A third level

## New documents

settings-new-documents = New documents

## You

settings-you = Your details
settings-first-name = First name
settings-last-name = Last name
settings-organization = Organization
settings-position = Title/Position
settings-address = Address
settings-phone = Phone
settings-email = Email
settings-orcid = ORCID
settings-orcid-problem = An ORCID iD is four groups of four digits: 0000-0002-1825-0097.
settings-contact-problem = That does not look like an address.

## Programs: Pandoc and Typst

settings-programs = Programs
settings-pandoc-need = Needed for the preview and for every export.
settings-looking = Looking…
# "need" is what the program is needed for: settings-pandoc-need.
settings-program-missing = Not found. { $need } Install it with the package manager of your system, or say below where it is.
settings-program-old = Older than Glaukopis needs: { $least } or newer.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Where { $program } is
settings-program-found-by-itself = Found by itself
settings-no-latex = No LaTeX was found. It is not needed: LaTeX source can be exported without it, and PDF is made with Typst.
settings-look-again = Look again
settings-error-programs = The programs could not be looked for

## About

settings-about = About
settings-licence = Free software under the GNU General Public License, version 3 or later. It comes without warranty.
settings-data = Where everything is kept

## Language

settings-language = Language
settings-language-interface = The interface
settings-language-system = As the system ({ $language })
settings-language-texts = Language of new texts
# The words of the language chosen for the interface could not be read; it stays in the one it was in.
settings-language-error-load = The words of { $language } could not be loaded

## The log of the runs.

settings-logs = The log

## What a line of the preview is: whether a chip at the edge of a page names it.

settings-page-chips-on = On
settings-page-chips-off = Off

## The settings in plain words, stage 1: the defaults of new projects and documents, and the look chips.

# Whether a new project opens in its diagram or in its text; the choices are the names of the two views.
settings-default-view = Default view for new projects
settings-default-type = Default document type
settings-default-look = Default look
settings-default-style = Default citation style
# The first choice of each of the three defaults: none, so that a new document is of the plain type, and the type's look and style hold.
settings-default-none = None, as the document type has it
# Whether a line of the preview, pressed, shows a chip at the edge of the page that says what it is and opens Look at it.
settings-look-chips = Display look chips in the preview window
