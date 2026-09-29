# Searching: in the text of a map, in the edit box of an element, and
# through everything. See locales/README.md and docs/adr/0017.

## The bar over a text

search-find = Find
search-replace-with = Replace with
search-replace = Replace
search-replace-all = Replace all
search-previous = The one before
search-next = The next
search-close = Close the search
search-show-replace = Replace as well
search-hide-replace = Find only
# Which of those found is shown: "3 of 17".
search-count = { $current } of { $count }
search-found = { $count ->
    [one] One found
   *[other] { $count } found
}
search-nothing = Nothing found
search-invalid = Not a regular expression
search-replaced = { $count ->
    [0] Nothing replaced
    [one] One replaced
   *[other] { $count } replaced
}

## The options

search-case = Capitals as they are written
search-whole-words = Whole words only
search-accents = Letters with and without accents alike
search-accents-sign = é=e
search-regex = A regular expression
search-selection = Only in the selected text
search-selection-none = Select text first, to search only in it
search-labels = Citations, formulas and words that point as well
search-labels-outside = What stands outside the texts as well

## The search through everything

search-everything = Search
search-everything-title = Search through everything
search-everything-field = Search the projects
search-last-project = The last project
search-all-projects = All projects
search-reading = Reading { $name }…
search-no-projects = There are no projects to search.
search-more = { $count ->
    [one] and one more
   *[other] and { $count } more
}
search-in-project = { $count ->
    [one] One in this project
   *[other] { $count } in this project
}
search-everything-found = { $count ->
    [one] One found
   *[other] { $count } found
} { $projects ->
    [one] in one project
   *[other] in { $projects } projects
}
search-where-details = The details of the document
# An association that has a name, with the elements at its ends: "Part 1 ↔ Part 2".
search-where-association = The association { $ends }
search-where-note = What you think of { $work }
# Said before what was found in a note.
search-in-note = note
search-untitled = Untitled
search-could-not-read = { $name } could not be read.
