-- Gives the bibliography and the notes gathered at the end the paragraph
-- styles that the pattern document defines for them, and the styles of
-- figures the names that Writer knows them by. Run after citeproc, and
-- after notes.lua.

local function style_blocks(blocks, name)
  local out = {}
  for _, block in ipairs(blocks) do
    if block.t == 'Div' then
      -- The entries of a bibliography are blocks within the block.
      block.content = style_blocks(block.content, name)
      out[#out + 1] = block
    elseif block.t == 'Para' or block.t == 'Plain' then
      out[#out + 1] = pandoc.Div({ block }, pandoc.Attr('', {}, { ['custom-style'] = name }))
    else
      out[#out + 1] = block
    end
  end
  return out
end

-- A style is named in a document of Writer without spaces.
local function writer_name(name)
  -- The one that Pandoc has of its own, as the pattern document writes it.
  if name == 'First Paragraph' then
    return 'First_20_paragraph'
  end
  return (name:gsub(' ', '_20_'))
end

-- The style of a run of words (a kind of words, a speaker, a stage
-- direction), named as Writer names it.
function Span(el)
  local style = el.attributes['custom-style']
  if style and style:find(' ') and FORMAT:match('odt') then
    el.attributes['custom-style'] = writer_name(style)
    return el
  end
  return nil
end

function Div(el)
  local style = el.attributes['custom-style']
  if style and style:find(' ') and FORMAT:match('odt') then
    el.attributes['custom-style'] = writer_name(style)
    return el
  end
  if el.identifier == 'refs' and FORMAT:match('odt') then
    el.content = style_blocks(el.content, 'Bibliography')
    return el
  end
  if el.identifier == 'gk-notes' and (FORMAT:match('odt') or FORMAT:match('docx')) then
    el.content = style_blocks(el.content, 'Endnotes')
    return el
  end
  return nil
end
