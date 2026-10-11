# Documents that are brought in, each to become a tree of elements under
# the element in view (ADR 0012, 0037), in English. See locales/README.md.

documents-choose = A document to bring in
documents-filter = Documents
documents-filter-all = All files
documents-title-element = A document into the element in view
documents-title-project = A project from a document
documents-reading = Reading { $file }…
documents-reading-hint = A long document takes a moment.
documents-no-pandoc = Documents of this kind are read by Pandoc, which is not installed or could not be found. Where it is can be said in the settings.
documents-unread = The file could not be read.
documents-title = Title
documents-title-hint-element = The name of the element at the top of the document, under the element in view.
documents-title-hint-project = The name of the project, and of the element at the top of the document within it.
# What a project made of a document is called when the document has no title.
documents-untitled = Untitled

## What the document holds, under the number of each.

documents-parts = { $count ->
    [one] Part
   *[other] Parts
}
documents-words = { $count ->
    [one] Word
   *[other] Words
}
documents-notes = { $count ->
    [one] Note
   *[other] Notes
}
documents-figures = { $count ->
    [one] Figure
   *[other] Figures
}
documents-tables = { $count ->
    [one] Table
   *[other] Tables
}
documents-equations = { $count ->
    [one] Equation
   *[other] Equations
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = Works of your library are cited { $cited ->
        [1] once
        [2] twice
       *[other] { $cited } times
    }.
documents-cited-not-in-library = Works that are not in your library are cited { $missing ->
        [1] once
        [2] twice
       *[other] { $missing } times
    }.
documents-cited-both = Works of your library are cited { $cited ->
        [1] once
        [2] twice
       *[other] { $cited } times
    }, works that are not in it { $missing ->
        [1] once
        [2] twice
       *[other] { $missing } times
    }.

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
    [one] One citation was found.
   *[other] { $count } citations were found.
}
documents-found-made = { $count ->
    [one] One citation was found, made by a program that keeps references.
   *[other] { $count } citations were found, all made by a program that keeps references.
}
documents-found-some-made = { $count } citations were found, { $made } of them made by a program that keeps references.
documents-at-once = Make citations at once of those made by Zotero of works your library has
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = A note that is nothing but a citation becomes a citation in the line, which the reference style sets in a note or in the line; a note that says more keeps its citation. What you have chosen for notes in the panel of found citations, for all that follow, holds here too.
documents-go-through-element = Go through the citations when the document is brought in
documents-go-through-project = Go through the citations when the project is made

## Making the elements.

# Over what the one who brings the document in should know of it.
documents-to-know = To know
documents-making = Bringing the document in…
documents-make-element = Bring it in
documents-make-project = Make the project
documents-failed = The document could not be brought in.

## What an element inherits as a document

# Under a setting an element does not make, which it takes from the element named, over it.
documents-inherited-from = From { $name }
