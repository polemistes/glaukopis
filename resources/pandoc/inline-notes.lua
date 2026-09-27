-- For the sample of a reference style: a note is shown where it is made, as
-- text marked as a note, so that what a citation looks like can be seen
-- beside what it is a citation of. Run after citeproc.

function Note(note)
  local inlines = pandoc.utils.blocks_to_inlines(note.content)
  return pandoc.Span(inlines, pandoc.Attr('', { 'gk-note' }))
end
