# Templates: what a document of a kind consists of (ADR 0038). Their groups,
# the parts a document is made of, the kinds of file, and the editor of a
# template.

## The groups of templates, as the chooser lists them.

template-group-own = Your own
template-group-plain = To begin with
template-group-article = Articles and papers
template-group-book = Books and theses
template-group-fiction = Fiction
template-group-stage = Stage and screen
template-group-poetry = Poetry
template-group-other = Other
template-group-journal = Journals
template-group-publisher = Publishers
template-group-style-guide = Style guides

## Where a kind of element stands in the document.


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
# A template of the writer's own made from another, before it is named: by the other's name.
template-name-own = { $name }, my own
template-sections = Parts of the template
template-delete = Delete this template
template-save-own = Save as my own
template-saved = “{ $name }” is saved among your own document types
template-read-failed = The document type could not be read.
template-save-failed = The document type could not be saved.
template-delete-failed = The document type could not be deleted.
template-keep-failed = The document type could not be kept in the project. On another computer, and in a file of the project, the document will have the default document type instead.
template-delete-title = Delete the document type “{ $name }”?
template-delete-message = Elements that use it will use the document type it was made from instead.
template-delete-confirm = Delete document type
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

## The layout and the reference style it brings.

template-layout = Layout
template-style = Reference style
# The layout or style the writer has chosen in the settings.
template-usual = Your usual, from the settings

## The contents: the order of the document.

# An item of the contents that places every element of a kind.
template-contents-kind = Every { $name }
template-contents-add-part = A part…
template-contents-add-kind = A kind of element…
template-contents-up = Up
template-contents-down = Down

## The kinds in hand.

template-kinds-in-contents = In the contents

## The requirements.

template-requirement-words = Words of text
template-requirement-abstract-words = Words of abstract
template-requirement-keywords = Keywords
template-requirement-note = What the limits count
# Beside a number of 0, in the place of its unit.
template-no-limit = no limit

## The files the template makes.

template-output-document = The document
template-output-cover = The cover

## The names of the document types that come with Glaukopis, as the chooser of what you are writing
## and the button over the preview give them; journals, publishers and style guides keep their own.

template-called-plain = Plain document
template-called-paper = Paper
template-called-article = Journal article
template-called-report = Report
template-called-book = Academic book
template-called-thesis = Thesis
template-called-novel = Novel
template-called-novel-manuscript = Novel manuscript
template-called-short-story = Short story
template-called-story-collection = Collection of stories
template-called-poems = Poems
template-called-play = Play
template-called-screenplay = Screenplay
template-called-letter = Letter
template-called-blog-post = Blog post
template-called-news-article = News article

## Fewer words, stage 3: the requirement of anonymity, in Look and in the editor of a document type.

template-requirement-anonymity = Anonymous

## Stage 4 of the settings, the zoom and the keys of the kinds: the kinds Ctrl+Alt and a digit gives.
template-kind-keys = Keys

## What is said in words of a document type that comes with Glaukopis, over
## what it brings: only where its name does not say what it is.

template-described-plain = Generic text.
