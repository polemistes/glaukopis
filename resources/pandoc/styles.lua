-- Gives the bibliography and the notes gathered at the end the paragraph
-- styles that the pattern document defines for them. Run after citeproc, and
-- after endnotes.lua.

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

function Div(el)
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
