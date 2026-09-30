# Citations that were found in a text written elsewhere, and the window in
# which they are gone through (ADR 0015), in English. See locales/README.md.

## The window.

found-title = Citations that were found
# The map whose citations are gone through, and how many are left.
found-subtitle = { $count ->
    [one] { $map } · { $count } citation to go through
   *[other] { $map } · { $count } citations to go through
}
found-taken = What is taken for citations
found-taken-always = What a program made, and tags
found-taken-years = Parentheses with a year in them
found-taken-named = Notes that name a work of the library
found-taken-notes = Every note
found-asking = Asking the library…
found-make-certain = { $count ->
    [one] Make a citation of the one that is certain
   *[other] Make citations of the { $count } that are certain
}
found-made = { $count ->
    [one] One citation was made
   *[other] { $count } citations were made
}
found-made-undo = Ctrl+Z takes them back, as one step.
found-library-failed = The library could not be asked.
found-nothing = Nothing to go through
found-nothing-looked = No citation that was found is left in this map, and nothing in it looks like one.
found-nothing-looked-more = No citation that was found is left in this map, and nothing in it looks like one. More can be taken for citations, above.
found-nothing-not-looked = No citation that was found is left in this map. Text that only looks like a citation is looked for when you say above what is to be taken for one: parentheses with a year in them, or notes.
found-list-label = What there is to go through
found-untitled = Untitled
found-in-a-note = In a note
# The element of the map a citation stands in.
found-in = In “{ $element }”
found-in-note-of = In a note of “{ $element }”
# Set small and high after the words a note stands after.
found-note-mark = note
found-position = { $index } of { $count }
found-later = Later
found-leave = Leave it as text
found-make = Make it a citation

## How sure the library is of what it proposes.

found-sure-certain = The library has it for certain
found-sure-likely = The library has what is likely it
found-sure-possible = The library has what may be it
found-sure-none = A work of it has no reference yet

## By what a citation was found.

found-by-zotero = Made by Zotero
found-by-mendeley = Made by Mendeley, or a program that writes as it does
found-by-key = A tag that names a reference
found-by-form = Taken for a citation by how it looks

## The citation that is to be made.

found-the-citation = The citation
found-no-works = It names no work. Add one, or leave it as the text it is.
found-add-work = Add a work
found-author-in-text = Author in the text: Nagy (1979)
found-pick-work = The work that is cited: author, title, year
found-pick-add = Add a work to the citation
found-too-little = The file says too little of this work to make a reference of it
found-reference-failed = The reference could not be made

## A citation that stands in a note.

found-in-note = It stands in a note
found-note-becomes = The note becomes a citation
# What the note says besides its works, which becomes the words before them, after them, or both.
found-note-around = What else the note says goes before and after its works{ $has ->
        [before] : “{ $before }” before
        [after] : “{ $after }” after
       *[both] : “{ $before }” before, “{ $after }” after
    }. The style of the references sets it in the line or in a note.
found-note-style = The style of the references sets it in the line or in a note.
found-citation-in-note = The citation stands in the note
    .hint = The note stays a note, with what else it says.
found-for-all = So for all that follow
found-note-not = It does not stand in a note.
# What else the note holds, by the name of what it is in the text.
found-note-holds = The note holds { $what ->
        [math] a formula
        [crossref] a cross-reference
        [citation] a citation
        [hard_break] a second line
       *[other] something that is no text
    }, which the words before and after a work cannot hold.
found-note-another = The note holds another citation that was found, which would be lost in the words after this one.

## Why what was asked could not be done.

found-trouble-gone = It is no longer in the text.
found-trouble-changed = The text has changed here since it was proposed, and was looked at again.
found-trouble-cannot = A citation cannot be made of it here.

## One work of a citation, as the text says it is.

# Those who made it: “Nagy and Lord”, “Nagy et al.”
found-people-two = { $first } and { $second }
found-people-more = { $first } et al.
found-work-a-work = A work
found-work-looking = { $work } is looked for in your library…
found-work-no-tag = { $work } is a tag that no reference of your library has.
found-work-not-found = { $work } was not found in your library.
found-work-chosen = Chosen by you
found-work-certain = Certain
found-work-likely = Likely
found-work-possible = Possible
# What the text says the work is.
found-work-for = for “{ $work }”
found-work-others = Other references it may be
found-work-or = Or
found-work-may-be = It may be
found-work-another = Another…
found-work-find = Find it…
found-work-add = Add it to the library
