# The settings.

settings-title = Settings
settings-error-system = Something about the application could not be read
settings-error-read = The settings could not be read
settings-error-save = The settings could not be saved

## Appearance

settings-appearance = Appearance
settings-theme = Light or dark
settings-theme-system = As the system
settings-theme-light = Light
settings-theme-dark = Dark
settings-text-size = Size of your text
settings-text-size-hint = In the maps and the text view. What is exported follows the document format.
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
settings-sample = Sing, goddess, the wrath of Achilles, son of Peleus

## New documents

settings-new-documents = New documents
settings-new-documents-hint = What a map begins with. Each map can be given another, in the preview.
settings-reference-style = Reference style
settings-document-format = Document format

## You

settings-you = You
settings-name = Name
settings-name-hint = Shown to those you share projects with. Not used otherwise.
settings-contact = Address for bibliographic services
settings-contact-hint = Services such as Crossref answer more readily to those who say how they can be reached. If you enter an address, it is sent to them with each lookup, and to no one else. Leave it empty to send none.
settings-contact-problem = That does not look like an address.

## Programs: Pandoc and Typst

settings-programs = Programs
settings-programs-about = Glaukopis makes documents with Pandoc, and pages to preview and print with Typst. They are found by themselves where they are installed in the usual way.
settings-pandoc-need = Needed for the preview and for every export.
settings-typst-need = Needed for the preview of pages, and for PDF.
settings-looking = Looking…
# "need" is what the program is needed for: settings-pandoc-need or settings-typst-need.
settings-program-missing = Not found. { $need } Install it with the package manager of your system, or say below where it is.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Where { $program } is
settings-program-found-by-itself = Found by itself
settings-no-latex = No LaTeX was found. It is not needed: LaTeX source can be exported without it, and PDF is made with Typst.
settings-look-again = Look again
settings-error-programs = The programs could not be looked for

## About

settings-about = About
settings-licence = Free software under the GNU General Public License, version 3 or later. It comes without warranty.
settings-owl = The owl is drawn by Robert Emil Berge, after a photograph of an Athenian tetradrachm by Classical Numismatic Group, Inc. (http://www.cngcoins.com). The drawing is under the Creative Commons Attribution-Share Alike 3.0 Unported licence.
settings-data = Where everything is kept
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Your references are in { $file }, which any BibLaTeX tool can read. To keep a copy of your work, copy this folder.
settings-lookup = Where references are looked up
settings-lookup-about = DOIs at doi.org, Crossref and DataCite; books in the catalogues K10plus, of the Norwegian academic libraries, of the Deutsche Nationalbibliothek and of the Library of Congress; preprints at arXiv; medical literature at PubMed. Only what you type into the lookup is sent to them.

## Language

settings-language = Language
settings-language-interface = The interface
settings-language-interface-hint = The words of the application. Your texts are in the language of their maps.
settings-language-system = As the system ({ $language })
settings-language-texts = Language of new texts
settings-language-texts-hint = What a new map is written in, which decides the words its document prints and the dictionary its spelling is checked by. Each map can be given another, in the details of its document.
