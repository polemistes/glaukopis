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
