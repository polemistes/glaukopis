# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = The picture “{ $name }” is not on this computer, and is left out of the document.
core-export-astray = { $count ->
    [one] Words in the text point to something that is not in the document. They are set as [?].
   *[other] Words in the text point, in { $count } places, to what is not in the document. They are set as [?].
}
core-export-latex-font = { $font } is not installed. The document is set in Latin Modern, the font that LaTeX has of its own.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count } texts of the document were not sent, and are not kept.
# Shown after "not found: ".
core-export-preview-document = the document of the preview
core-export-reading-pdf = reading the PDF that was made
core-export-reading-made = reading the document that was made

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = the pattern document could not be read: { $error }
core-export-pattern-lacks = the pattern document has no { $name }
core-export-pattern-reading = reading the pattern document
core-export-pattern-writing = writing the pattern document

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = The formula ends before it is complete.
# The command is as it was written: \frac.
core-export-formula-unknown = { $command } is not known.
core-export-formula-unexpected = { $what } was not expected where it stands.
core-export-formula-unreadable = The formula could not be read.
core-export-formula-too-long = The formula is too long.

## Reference styles.

core-export-style-bad-id = “{ $id }” cannot be the id of a style
core-export-not-a-style = This is not a style: { $error }.
core-export-not-a-style-begin = This is not a style: it does not begin with <style>.
core-export-dependent-style = This style only names another style, which it takes its form from. Fetch it by its name instead.
core-export-style-unreadable = The style could not be read back.
core-export-style-needs-name = A style needs a name.
core-export-style-own-only = Only your own styles can be deleted.
# Shown after "not found: ".
core-export-the-reference-style = the reference style “{ $id }”
core-export-any-reference-style = any reference style
core-export-the-style = the style “{ $id }”

## Document formats.

core-export-format-bad-id = “{ $id }” cannot be the id of a format
core-export-format-needs-name = A format needs a name.
core-export-format-own-only = Only your own formats can be deleted.
core-export-not-a-length = “{ $length }” is not a length
# Shown after "not found: ".
core-export-the-format = the format “{ $id }”
