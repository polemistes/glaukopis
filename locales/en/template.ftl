# Templates: what a document of a kind consists of (ADR 0038). Their groups,
# the parts a document is made of, the kinds of file, and the editor of a
# template.

## The groups of templates, as the chooser lists them.

template-group-own = Your own
template-group-plain = Plain
template-group-article = Articles and papers
template-group-book = Books and theses
template-group-fiction = Fiction
template-group-stage = Stage and screen
template-group-poetry = Poetry
template-group-other = Other kinds of text
template-group-journal = Journals
template-group-publisher = Publishers
template-group-style-guide = Style guides

## Where a kind of element stands in the document.

template-part-group-front = Front matter
template-part-group-back = Back matter
template-part-group-cover = Cover

## The parts of a document the application makes itself.

template-generated-half-title = Half title
template-generated-title-page = Title page
template-generated-keywords = Keywords
template-generated-contents = Table of contents
template-generated-list-of-figures = List of figures
template-generated-list-of-tables = List of tables
template-generated-body = The text
template-generated-notes = Notes
template-generated-bibliography = Bibliography

## The kinds of file a template makes.

template-target-pdf = PDF
template-target-pdf-latex = PDF, set by LaTeX
template-target-docx = Word
template-target-odt = LibreOffice Writer
template-target-latex = LaTeX
template-target-typst = Typst
template-target-markdown = Markdown
template-target-html = Web page
template-target-epub = E-book

## The template editor.

template-editor = Template
template-name = Name of the template
# The name a template of one's own is first given, made from that of the template it is made from.
template-name-changed = { $name }, changed
# The name a new template is first given.
template-new-name = New template
template-sections = Parts of the template
template-bundled = Templates that come with Glaukopis stay as they are. Your changes are saved as a template of your own.
template-delete = Delete this template
template-save-own = Save as my own
template-saved = “{ $name }” is saved among your own templates
template-read-failed = The template could not be read.
template-save-failed = The template could not be saved.
template-delete-failed = The template could not be deleted.
template-delete-title = Delete the template “{ $name }”?
template-delete-message = Elements that use it will use the template it was made from instead.
template-delete-confirm = Delete template
template-leave-title = Leave without saving?
template-leave-message = The changes you have made to the template will be lost.
template-leave-confirm = Leave
template-leave-cancel = Go on editing

## The parts of the editor, as they are chosen at the left.

template-section-about = About this template
template-section-looks = Layout and reference style
template-section-contents = Contents
template-section-kinds = Kinds of elements
template-section-passage-kinds = Kinds of paragraph and words
template-section-requirements = Requirements
template-section-outputs = Files

## About the template.

template-description = Description
template-group = Group
template-based-on = Based on
template-based-on-none = Nothing in particular
template-source-changed = You have changed this template; the source describes what it was made from.
template-source-none = This template follows no publisher’s requirements in particular.

## The layout and the reference style it brings.

template-layout = Layout
template-layout-hint = How the page looks, for every document of this template
template-style = Reference style
template-style-hint = How citations and the bibliography are written; empty, the layout’s own holds
# The layout or style the writer has chosen in the settings.
template-usual = Your usual, from the settings

## The contents: the order of the document.

template-contents-hint = The order of the document: the parts the application makes itself, and every element of a kind, in the order of the tree. A kind listed before the text is front matter, one listed after it back matter.
# An item of the contents that places every element of a kind.
template-contents-kind = Every { $name }
template-contents-add-part = A part…
template-contents-add-kind = A kind of element…
template-contents-up = Up
template-contents-down = Down

## The kinds in hand.

template-kinds-hint = The kinds of elements the template puts in the hand: they are offered in the menu of kinds. Those in the contents are in hand whether chosen here or not.
template-kinds-in-contents = In the contents
template-passage-kinds-hint = The kinds of paragraph and of words the template puts in the hand: they are offered first in the tools for writing.

## The requirements.

template-requirements-hint = What a document of this template is to meet. The checklist and the preview count against these; nothing is cut.
template-requirement-words = Words of text
template-requirement-abstract-words = Words of abstract
template-requirement-keywords = Keywords
template-requirement-anonymous = Without the names of the authors
template-requirement-anonymous-hint = For review: the checklist says so, and a layout for review leaves them out
template-requirement-note = What the limits count
template-requirement-note-placeholder = Notes included; bibliography not
# Beside a number of 0, in the place of its unit.
template-no-limit = no limit

## The files the template makes.

template-outputs-hint = The kinds of file the document is offered as when it is exported.
template-output-document = The document
template-output-cover = The cover
template-output-cover-note = A cover of its own is made by a later version; what the template says of it is kept as it is.
