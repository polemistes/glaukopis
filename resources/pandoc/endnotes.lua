-- Notes at the end.
--
-- Every note, those made by the reference style among them, becomes a number
-- in the text, and the notes are gathered under a heading at the end of the
-- text, before the bibliography. Used when the format asks for endnotes.
-- Run after citeproc.

local notes = {}
local title = 'Notes'

local function read_title(meta)
  if meta['gk-notes-title'] then
    title = pandoc.utils.stringify(meta['gk-notes-title'])
  end
  return nil
end

local function take_note(note)
  notes[#notes + 1] = note.content
  return pandoc.Superscript({ pandoc.Str(tostring(#notes)) })
end

local function place_notes(doc)
  if #notes == 0 then
    return nil
  end
  local body = {}
  for i, blocks in ipairs(notes) do
    local first = blocks[1]
    if first and (first.t == 'Para' or first.t == 'Plain') then
      first.content:insert(1, pandoc.Space())
      first.content:insert(1, pandoc.Str(tostring(i) .. '.'))
    else
      table.insert(blocks, 1, pandoc.Para({ pandoc.Str(tostring(i) .. '.') }))
    end
    for _, block in ipairs(blocks) do
      body[#body + 1] = block
    end
  end

  local at = #doc.blocks + 1
  for i, block in ipairs(doc.blocks) do
    if (block.t == 'Header' and block.identifier == 'bibliography')
      or (block.t == 'Div' and block.identifier == 'refs') then
      at = i
      break
    end
  end
  local heading = pandoc.Header(1, { pandoc.Str(title) }, pandoc.Attr('notes', { 'unnumbered' }))
  local list = pandoc.Div(body, pandoc.Attr('gk-notes'))
  doc.blocks:insert(at, list)
  doc.blocks:insert(at, heading)
  return doc
end

return {
  { Meta = read_title },
  { Note = take_note },
  { Pandoc = place_notes },
}
