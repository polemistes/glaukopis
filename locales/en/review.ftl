# Reviewing changes afterwards (ADR 0022): the panel of changes beside the
# text, in English. See locales/README.md.

review-title = Changes
# The button over the text that opens the panel.
review-open = Review changes
review-since-last = Since you last reviewed
review-since-beginning = Since the history began
review-since-session = Since { $who } began, { $when }
review-since-named = Since “{ $name }”
# When the moment compared with was, under what it is.
review-since-when = From { $when }
review-choose-since = Review from another moment
review-own = Your own changes too
review-unit = Review by
review-by-sentence = Sentence
review-by-paragraph = Paragraph
review-left = { $count ->
    [one] One change left
   *[other] { $count } changes left
}
review-position = { $index } of { $count }
review-working = Working out the changes…
review-failed = The changes could not be worked out.
review-nothing = Nothing left to review
review-nothing-text = Every change the others have made since then has been accepted.
review-list = The changes of this map

## What a change is.

review-kind-changed = Changed
review-kind-added = New text
review-kind-removed = Deleted text
review-kind-moved = Moved
review-kind-object = { $what ->
    [figure] Figure
    [table] Table
    [equation] Equation
    [citation] Citation
    [math] Formula
    [footnote] Note
    [crossref] Cross-reference
   *[other] Something that is not text
}
review-kind-put-in = { $what } put in
review-kind-taken-out = { $what } taken out
review-kind-altered = { $what } changed
review-element-added = Element added
review-element-removed = Element deleted
review-element-moved = Element moved
review-element-heading = Printed as a heading
review-element-no-heading = No longer printed as a heading
review-element-excluded = Left out of the document
review-element-included = Put back into the document
review-element-other = Element changed
# Where a change is: the name of the element.
review-in = In “{ $element }”
review-moved-from = From “{ $element }”
review-untitled = Untitled
review-gone-element = An element that is no longer there
review-was = As it was
review-is = As it is
review-nothing-there = Nothing
review-someone = Someone
review-now-under = Now under “{ $element }”
review-was-under = Was under “{ $element }”

## What is done with a change.

review-accept = Accept
review-reject = Reject
review-later = Later
review-previous = The one before
review-reject-cannot = What was deleted of the map, or a figure taken out, is brought back from the history.
review-versions = Its history
review-versions-count = { $count ->
    [one] One version
   *[other] { $count } versions
}
review-versions-reading = Reading its history…
review-versions-none = Nothing happened between the two ends.
review-version-by = { $who }, { $when }
review-accept-up-to = Accept up to here
review-use-version = Use this version

## Without the history.

review-no-history = The history of this project is not kept
review-no-history-text = Changes are reviewed from the history of the project, which tells who changed what, and when. It is kept from the moment it is turned on.
review-turn-on = Keep the history
review-turn-on-elsewhere = It is turned on with the history of the project.
