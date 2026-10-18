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
settings-own-hint = Four colours, from which the rest follow: the paper, the ink, the accent that marks what is chosen and pressed, and the second voice that marks associations and comments. Whether the scheme is light or dark follows from the paper.
settings-own-paper = Paper
settings-own-ink = Ink
settings-own-accent = Accent
settings-own-gold = Second voice
settings-own-begin = Begin from
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Hard to read: the ink stands at { $ink } to 1 on the paper and the accent at { $accent } to 1; 4.5 and 3 or more read well.
settings-text-size = Size of your text in the text editor
settings-text-size-hint = Relative to the interface. The font sizes of the document preview and export are not affected by this.
settings-editor-font = Editor font
settings-editor-font-hint = Select the font for your text in the editor.
settings-editor-font-default = As the interface (Literata)
# How the text of a map shows how deep each element stands: on the screen only.
# How the text editor shows how deep each element stands: on the screen only.
settings-text-depth = Document structure
settings-text-depth-hint = How the text editor displays the document structure of your text.
settings-text-depth-numbers = Numbers
settings-text-depth-dots = Dots
settings-text-depth-indent = Set in, with lines
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
# Whether a new project opens in its diagram or in its text; the choices are the names of the two views.
settings-new-project-view = New projects open in
settings-new-project-view-hint = The view a project opens in when it has just been made.
settings-template = Template
settings-document-format = Layout
settings-reference-style = Reference style

## You

settings-you = Your details
settings-you-about = Your name is what the history of a project and those you share it with call you. A new project has you as its author, with your organization, email and ORCID; that is changed in the project's document settings. Title, address and phone are kept for documents that will ask for them; nothing uses them yet. Glaukopis sends none of this anywhere by itself: what stands in a project's document settings goes with the project when you share or export it.
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
settings-programs-about = Glaukopis makes documents with Pandoc, which is found by itself where it is installed in the usual way. The pages of the preview and of a PDF are set by Typst, which is part of Glaukopis.
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
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Your references are in { $file }, which any BibLaTeX tool can read. To keep a copy of your work, copy this folder.

## Language

settings-language = Language
settings-language-interface = The interface
settings-language-system = As the system ({ $language })
settings-language-texts = Language of new texts
# The words of the language chosen for the interface could not be read; it stays in the one it was in.
settings-language-error-load = The words of { $language } could not be loaded

## The log of the runs.

settings-logs = The log
settings-logs-hint = What Glaukopis tells of itself in each run, of the last { $count } runs: what it did, what went wrong, and what became of its window. Of use when something has gone wrong and no one saw why.
