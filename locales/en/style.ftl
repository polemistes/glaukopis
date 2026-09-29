# Reference styles: their kinds, the search for more, and the style editor,
# with the words it tells the parts of a style by.

## The kinds of reference style, as the styles are grouped by them.

style-kind-note = Notes
style-kind-author-date = Author and date
style-kind-numeric = Numbers
style-kind-label = Labels
style-kind-author = Author
style-kind-other = Other

## The search for reference styles of journals and publishers.

style-browser = Reference styles
style-browser-subtitle = More than ten thousand styles of journals and publishers, by name
style-browser-placeholder = The name of a journal, a publisher or a style
style-browser-search = Search styles
# Beside a style that has been fetched already.
style-browser-here = Here
style-browser-fetch = Fetch
style-browser-none-found = No style has these words in its name.
style-browser-about = Styles are fetched from the repository of the Citation Style Language project and kept with your own. Those you have can be changed to a publisher’s wishes in the style editor.
style-browser-import = Import a file…
style-browser-import-title = Import a reference style
style-browser-fetch-failed = The style could not be fetched.
style-browser-file-unread = The file could not be read.

## The style editor.

style-editor = Reference style
style-name = Name of the style
# The name a style of one's own is first given, made from that of the style it is made from.
style-name-changed = { $name }, changed
style-depth = How deep to go
style-depth-options = Common changes
style-depth-parts = Part by part
style-depth-source = Source
style-scope = What to change
style-scope-citations = Citations
style-scope-notes = Notes
style-scope-bibliography = Bibliography
style-bundled = Styles that come with Glaukopis stay as they are. Your changes are saved as a style of your own.
style-delete = Delete this style
style-save-own = Save as my own
style-saved = “{ $name }” is saved among your own styles
style-read-failed = The style could not be read.
style-save-failed = The style could not be saved.
style-delete-failed = The style could not be deleted.
style-delete-title = Delete the style “{ $name }”?
style-delete-message = Maps that use it will use another style instead.
style-delete-confirm = Delete style
style-leave-title = Leave without saving?
style-leave-message = The changes you have made to the style will be lost.
style-leave-confirm = Leave
style-leave-cancel = Go on editing

## Common changes: names.

style-names = Names
# A sentence with two fields in it, where numbers are written: the least number of
# authors for which "et al." is used, and how many are named before it.
style-et-al = With { $min } authors or more, give the first { $first } and “et al.”
style-et-al-min = Number of authors from which et al. is used
style-et-al-first = Number of authors given before et al.
style-et-al-empty = Left empty, all are named
# As the one before, for a work that has been cited before.
style-et-al-again = When cited again, with { $min } or more give the first { $first }
style-et-al-again-min = Number of authors from which et al. is used in later citations
style-et-al-again-first = Number of authors given in later citations
style-et-al-again-empty = Left empty, as the first time
style-before-last-name = Before the last name
# The word the style prints there, in the language of the document.
style-and-word = and
style-and-nothing = Nothing
style-as-the-style-has-it = As the style has it
style-comma-before-last = A comma before it
style-comma-contextual = With three names or more: A, B, and C
style-comma-always = Always: A, and B
style-comma-never = Never: A, B and C
style-comma-after-inverted = After a name that is turned round
style-given-names = Given names
style-given-full = In full: John Miles
style-given-spaced = Initials: J. M.
style-given-close = Initials, close: J.M.
style-given-bare = Initials without stops: JM
style-given-bare-spaced = Initials without stops: J M
style-family-first = Family name first
style-family-first-none = For no one: John Foley
style-family-first-first = For the first author: Foley, John, and Robert Fowler
style-family-first-all = For all: Foley, John, and Fowler, Robert
style-sort-separator = Between family and given name
style-sort-separator-hint = When the family name comes first

## Common changes: the citation, or the note, and the entries of the bibliography.

style-the-citation = The citation
style-the-note = The note
style-begins-with = Begins with
style-ends-with = Ends with
style-between-works = Between works cited together
style-collapse = Works of one author cited together
style-collapse-none = Each in full
style-collapse-year = The name once: Nagy 1979, 1996
style-collapse-year-suffix = And the year once: Nagy 1979a, b
style-collapse-year-suffix-ranged = With ranges: Nagy 1979a–c
style-collapse-citation-number = Numbers as ranges: [1–3]
style-disambiguate = When two works would be cited alike
style-disambiguate-year-suffix = Add a letter to the year
style-disambiguate-names = Name more authors
style-disambiguate-given-names = Add given names or initials
style-near-note = A note counts as near within
style-near-note-hint = Notes; for styles that shorten what was cited nearby
style-entries = The entries
style-entry-ends-with = Each ends with
style-author-repeated = For an author repeated
style-author-repeated-hint = In place of the name, in the entries after the first
style-hanging-indent = Hanging indent
style-hanging-indent-hint = The document format decides how deep
style-second-field = Numbers or labels stand
style-second-field-line = In the line
style-second-field-column = In a column of their own
style-second-field-margin = In the margin
style-second-field-hint = For styles that number their entries

## Common changes: throughout the style.

style-throughout = Throughout
style-page-ranges = Ranges of pages
style-page-ranges-as-entered = As entered
style-page-ranges-expanded = In full: 321–328
style-page-ranges-minimal = Shortest: 321–8
style-page-ranges-minimal-two = Two digits at least: 321–28
style-page-ranges-chicago = As the Chicago Manual has it
style-particles = “van”, “de”, “von” before a family name
style-particles-never = Stay with it, and sort under v, d
style-particles-sort-only = Stay with it, but are not sorted by
style-particles-display-and-sort = Go after the given name: Gogh, Vincent van
style-hyphen = A hyphen between initials
style-hyphen-hint = J.-P. Sartre, not J.P. Sartre
style-locale = The words of the style are in
style-locale-document = The language of the document
style-locale-hint = “ed.”, “in”, “accessed”, the months

## Part by part.

# The scope is citation or bibliography.
style-parts-of = { $scope ->
    [citation] Parts of the citation
   *[bibliography] Parts of the bibliography
}
style-parts-none = { $scope ->
    [citation] This style has no citation.
   *[bibliography] This style has no bibliography.
}
style-parts-hint = Choose a part on the left to change how it is printed: what stands before and after it, its type, its capitals. Parts are opened to show what they are made of.
style-part-unfold = Open
style-part-fold = Close
style-part-up = Move up
style-part-down = Move down
style-part-add-after = Add after it
style-part-take-away = Take away
style-part-add-within = Add within it
# A part of a macro: a part of the style that is used in several places.
style-part-shared = This belongs to “{ $macro }”, which is used in { $count } places. A change here shows in all of them.
style-add-words = Words of my own
style-add-words-hint = Such as “in”, “accessed”, or punctuation
# Over the fields of a reference that a part can print.
style-add-from-reference = From the reference
style-part-words = The words
style-part-before = Before it
style-part-before-hint = Printed only when the part itself is
style-part-after = After it
style-part-between = Between its parts
style-slant = Slant
style-slant-upright = Upright
style-slant-italic = Italic
style-weight = Weight
style-weight-regular = Regular
style-weight-bold = Bold
style-letters = Letters
style-letters-as-written = As written
style-letters-small-caps = Small capitals
style-case = Capitals
style-case-as-entered = As entered
style-case-title = Title Case
style-case-sentence = Sentence case
style-case-capitalize-first = First letter a capital
style-case-capitalize-all = Every Word A Capital
style-case-uppercase = CAPITALS
style-case-lowercase = small letters
style-height = Height
style-height-baseline = On the line
style-height-raised = Raised
style-height-lowered = Lowered
style-quotes = In quotation marks
style-strip-periods = Without full stops
style-strip-periods-hint = For abbreviations: “ed” for “ed.”
style-text-form = Form
style-text-form-long = In full
style-text-form-short = Short, where the reference has one
style-term-form = Form of the word
style-term-form-long = In full: editor, page
style-term-form-short = Short: ed., p.
style-term-form-verb = As a verb: edited by
style-term-form-verb-short = As a verb, short: ed. by
style-term-form-symbol = As a sign: §
style-date-parts = The date is given
style-date-parts-year = As the year only
style-date-parts-year-month = As year and month
style-date-parts-full = In full

## The source of the style, and the sample it is tried on.

style-source = Source of the style
style-source-try = Try it
style-source-unread = The source could not be read.
style-sample-unusable = The style cannot be used as it is
style-sample-failed = The style could not be tried.
style-sample-in-text = In the text
style-sample-in-notes = In the notes
style-sample-in-bibliography = In the bibliography
style-sample-cited = A work cited
style-sample-same-page = The same, at a page
style-sample-another = Another, with a word before it
style-sample-first-again = The first again, at a chapter
style-sample-together = Two works together
style-sample-in-sentence = With the author in the sentence
style-sample-examples = Shown on examples: your library is empty.
style-sample-library = Shown on works from your library.

## The source of a style, where it cannot be read as one.

style-source-not-xml = The source is not well-formed XML.
style-source-not-style = This is not a style: it does not begin with <style>.
style-source-dependent = The style has no <citation>: it only names another style, and cannot be changed.

## The parts of a style, as the style editor tells them in words.

style-part-layout = The whole
style-part-text = Text
# A part that prints a word of the style's language: the term is its name in CSL.
style-part-term = The word for “{ $term }”
# A part that prints words written into the style.
style-part-value = The words “{ $value }”
style-part-name = How the names are written
# The name is family or given, as CSL has them.
style-part-name-part = { $name ->
    [family] The family name
    [given] The given name
   *[other] The { $name } name
}
style-part-et-al = “et al.”
# The variables are one or more of those below: "the pages".
style-part-label = The word before { $variables } (“p.”, “ed.”)
style-part-role = The word for the role (“ed.”, “trans.”)
style-part-substitute = When there is no such name, in its place
# The name is day, month or year, as CSL has them, or part.
style-part-date-part = { $name ->
    [day] The day
    [month] The month
    [year] The year
   *[other] The { $name }
}
style-part-group = Together
style-part-choose = One of these
# The condition is made of those below.
style-part-if = If { $condition }
style-part-else-if = Or else, if { $condition }
style-part-else = Otherwise
# A name the style has, of a part of it (a macro) or of a variable it does not know.
style-quoted = “{ $text }”

## Words that join others: "the author, or else the editor", "a book or a chapter".
## The first may be a list of several, joined by commas.

style-or = { $first } or { $last }
style-and = { $first } and { $last }
style-or-else = { $first }, or else { $last }

## When a part of a style is printed: "If the work is a book".

style-if-type = the work is { $types }
style-if-has = it has { $variables }
style-if-lacks = it has no { $variables }
style-if-numeric = { $variables } is a number
style-if-uncertain = { $variables } is uncertain
# The places are pages, chapters, verses and the like; see style-locator.
style-if-locator = the place cited is { $locators }
style-if-disambiguate = it would otherwise be mistaken for another
style-if-always = always
style-if-none-holds = none of this holds: { $conditions }
# A kind of place that a citation points to, as CSL names it: page, chapter, verse,
# sub-verbo, and so on. English leaves the names as they are.
style-locator = a { $name }

## When a citation is printed, by where it stands among the others.

style-position-first = it is cited for the first time
style-position-subsequent = it has been cited before
style-position-ibid = it is the same as the citation before
style-position-ibid-with-locator = it is the same as the citation before, at another place
style-position-near-note = it was cited in a note nearby

## How a part is set: "italic, in quotation marks, before “, ”".

style-form-italic = italic
style-form-bold = bold
style-form-small-caps = small capitals
style-form-underlined = underlined
style-form-quoted = in quotation marks
# How the letters are set, as CSL names it; the words are that name with spaces for its dashes.
style-form-case = { $case ->
    [lowercase] lowercase
    [uppercase] uppercase
    [capitalize-first] capitalize first
    [capitalize-all] capitalize all
    [sentence] sentence
    [title] title
   *[other] { $words }
}
style-form-raised = raised
style-form-lowered = lowered
# The part comes after these words.
style-form-after = after “{ $text }”
# The part comes before these words.
style-form-before = before “{ $text }”
style-form-between = with “{ $text }” between

## The kinds of work a reference is of, as CSL names them.

style-type-book = a book
style-type-chapter = a chapter
style-type-article-journal = an article in a journal
style-type-article-magazine = an article in a magazine
style-type-article-newspaper = an article in a newspaper
style-type-article = an article
style-type-thesis = a thesis
style-type-report = a report
style-type-webpage = a web page
style-type-paper-conference = a conference paper
style-type-entry-encyclopedia = an entry in an encyclopaedia
style-type-entry-dictionary = an entry in a dictionary
style-type-entry = an entry
style-type-review = a review
style-type-review-book = a review of a book
style-type-manuscript = a manuscript
style-type-personal_communication = a letter or other communication
style-type-legal_case = a court decision
style-type-legislation = legislation
style-type-bill = a bill
style-type-patent = a patent
style-type-dataset = a dataset
style-type-software = software
style-type-motion_picture = a film
style-type-broadcast = a broadcast
style-type-song = a recording
style-type-speech = a lecture
style-type-interview = an interview
style-type-graphic = an image
style-type-map = a map
style-type-pamphlet = a pamphlet
style-type-post-weblog = a blog post
style-type-post = a post
style-type-classic = a classical work
style-type-collection = a collection
style-type-document = a document
style-type-standard = a standard
style-type-treaty = a treaty
style-type-periodical = a periodical
style-type-musical_score = a score
style-type-figure = a figure
style-type-event = an event
style-type-performance = a performance
style-type-regulation = a regulation
style-type-hearing = a hearing

## What a reference has, as CSL names it: with its article, and without it
## (.bare) as a field of a reference is named.

style-variable-title = the title
    .bare = title
style-variable-title-short = the short title
    .bare = short title
style-variable-container-title = the title of the journal or book
    .bare = title of the journal or book
style-variable-container-title-short = the short title of the journal
    .bare = short title of the journal
style-variable-collection-title = the series
    .bare = series
style-variable-collection-number = the number in the series
    .bare = number in the series
style-variable-original-title = the original title
    .bare = original title
style-variable-reviewed-title = the title of the work reviewed
    .bare = title of the work reviewed
style-variable-author = the author
    .bare = author
style-variable-editor = the editor
    .bare = editor
style-variable-translator = the translator
    .bare = translator
style-variable-container-author = the author of the book
    .bare = author of the book
style-variable-collection-editor = the editor of the series
    .bare = editor of the series
style-variable-editorial-director = the editorial director
    .bare = editorial director
style-variable-original-author = the original author
    .bare = original author
style-variable-reviewed-author = the author of the work reviewed
    .bare = author of the work reviewed
style-variable-interviewer = the interviewer
    .bare = interviewer
style-variable-recipient = the recipient
    .bare = recipient
style-variable-director = the director
    .bare = director
style-variable-composer = the composer
    .bare = composer
style-variable-illustrator = the illustrator
    .bare = illustrator
style-variable-issued = the date
    .bare = date
style-variable-accessed = the date of access
    .bare = date of access
style-variable-original-date = the original date
    .bare = original date
style-variable-event-date = the date of the event
    .bare = date of the event
style-variable-submitted = the date of submission
    .bare = date of submission
style-variable-volume = the volume
    .bare = volume
style-variable-number-of-volumes = the number of volumes
    .bare = number of volumes
style-variable-issue = the issue
    .bare = issue
style-variable-edition = the edition
    .bare = edition
style-variable-page = the pages
    .bare = pages
style-variable-page-first = the first page
    .bare = first page
style-variable-number-of-pages = the number of pages
    .bare = number of pages
style-variable-number = the number
    .bare = number
style-variable-chapter = the chapter
    .bare = chapter
style-variable-chapter-number = the number of the chapter
    .bare = number of the chapter
style-variable-publisher = the publisher
    .bare = publisher
style-variable-publisher-place = the place of publication
    .bare = place of publication
style-variable-original-publisher = the original publisher
    .bare = original publisher
style-variable-original-publisher-place = the original place of publication
    .bare = original place of publication
style-variable-locator = the place cited
    .bare = place cited
style-variable-citation-number = the number of the citation
    .bare = number of the citation
style-variable-citation-label = the label of the citation
    .bare = label of the citation
style-variable-year-suffix = the letter after the year
    .bare = letter after the year
style-variable-first-reference-note-number = the number of the note where it was first cited
    .bare = number of the note where it was first cited
style-variable-DOI = the DOI
    .bare = DOI
style-variable-URL = the address
    .bare = address
style-variable-ISBN = the ISBN
    .bare = ISBN
style-variable-ISSN = the ISSN
    .bare = ISSN
style-variable-PMID = the PMID
    .bare = PMID
style-variable-genre = the kind of work
    .bare = kind of work
style-variable-medium = the medium
    .bare = medium
style-variable-note = the note
    .bare = note
style-variable-annote = the annotation
    .bare = annotation
style-variable-abstract = the abstract
    .bare = abstract
style-variable-archive = the archive
    .bare = archive
style-variable-archive_location = the place in the archive
    .bare = place in the archive
style-variable-archive-place = the place of the archive
    .bare = place of the archive
style-variable-authority = the authority
    .bare = authority
style-variable-call-number = the call number
    .bare = call number
style-variable-event = the event
    .bare = event
style-variable-event-place = the place of the event
    .bare = place of the event
style-variable-event-title = the title of the event
    .bare = title of the event
style-variable-section = the section
    .bare = section
style-variable-source = the source
    .bare = source
style-variable-status = the state of publication
    .bare = state of publication
style-variable-version = the version
    .bare = version
style-variable-language = the language
    .bare = language
style-variable-dimensions = the dimensions
    .bare = dimensions
style-variable-scale = the scale
    .bare = scale
style-variable-references = the references
    .bare = references
style-variable-keyword = the keywords
    .bare = keywords
style-variable-jurisdiction = the jurisdiction
    .bare = jurisdiction
