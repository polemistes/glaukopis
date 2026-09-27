-- Where the notes stand.
--
-- The format says whether notes stand at the foot of the page or at the end
-- of the text; a single note may be set to stand at the other place. Notes
-- at the end, those made by the reference style among them, become a mark in
-- the text and are gathered under a heading at the end, before the
-- bibliography. Notes at the foot of the page are left to the format that
-- is written.
--
-- The notes that stand where the format has them are numbered. Those that
-- were set against it are lettered, so that the two are told apart: for the
-- notes at the foot of the page that is done by the format that is written
-- (see the core), for the notes at the end it is done here.
--
-- Run after citeproc.

local notes = {}
local title = 'Notes'
local at_end = false

local function read_meta(meta)
  if meta['gk-notes-title'] then
    title = pandoc.utils.stringify(meta['gk-notes-title'])
  end
  if meta['gk-notes-kind'] then
    at_end = pandoc.utils.stringify(meta['gk-notes-kind']) == 'endnotes'
  end
  return nil
end

-- a, b, … z, aa, ab, …
local function letters(n)
  local out = ''
  while n > 0 do
    local r = (n - 1) % 26
    out = string.char(97 + r) .. out
    n = (n - 1 - r) / 26
  end
  return out
end

local function mark(n)
  if at_end then
    return tostring(n)
  end
  return letters(n)
end

local function take(note)
  notes[#notes + 1] = note.content
  return pandoc.Superscript({ pandoc.Str(mark(#notes)) })
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
      first.content:insert(1, pandoc.Str(mark(i) .. '.'))
    else
      table.insert(blocks, 1, pandoc.Para({ pandoc.Str(mark(i) .. '.') }))
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

-- From the top down, so that a note that has been set to a place is met in
-- what holds it, before it is met as a note.
local function placed(span)
  local note = span.content[1]
  if not note or note.t ~= 'Note' then
    return nil
  end
  if span.classes:includes('gk-note-end') then
    if at_end then
      return take(note), false
    end
    return take(note), false
  elseif span.classes:includes('gk-note-foot') then
    return note, false
  end
  return nil
end

local function unplaced(note)
  if at_end then
    return take(note), false
  end
  return nil
end

return {
  { Meta = read_meta },
  { traverse = 'topdown', Span = placed, Note = unplaced },
  { Pandoc = place_notes },
}
