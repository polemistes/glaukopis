-- Tables for LaTeX.
--
-- Pandoc writes a table for LaTeX as a `longtable`, which may go over
-- several pages and stands in the middle of the page. That is what a table
-- is here when it stands by itself, with where it stands set by the
-- lengths `longtable` has for that. Beside other things, or with the text
-- flowing around it, a table must be a `tabular`, which `longtable` cannot
-- be made to be: there what Pandoc wrote is rewritten.
--
-- The tables that are meant are those within a block of the class
-- `gk-tabular`, which says of the table what is to be known: see
-- `crates/core/src/document/placing.rs`. Run after citeproc.

local function size_of(attributes)
  local size = tonumber(attributes.size) or 0
  local spacing = tonumber(attributes.spacing) or 0
  local out = ''
  if size > 0 then
    local lead = size * 1.2 * (spacing > 0 and spacing or 1)
    out = string.format('\\fontsize{%g}{%g}\\selectfont', size, lead)
  elseif spacing > 0 then
    out = string.format('\\setstretch{%g}', spacing)
  end
  return out
end

-- The lines of the table, where they are not those of a book.
local function ruled(tex, rules)
  if rules == 'none' then
    tex = tex:gsub('\\toprule\\noalign{}', '')
    tex = tex:gsub('\\midrule\\noalign{}', '')
    tex = tex:gsub('\\bottomrule\\noalign{}', '')
  elseif rules == 'grid' then
    tex = tex:gsub('\\toprule\\noalign{}', '\\hline')
    tex = tex:gsub('\\midrule\\noalign{}', '')
    tex = tex:gsub('\\bottomrule\\noalign{}', '')
    -- A line under every row, and one beside every column.
    tex = tex:gsub('\\\\\n', '\\\\ \\hline\n')
    tex = tex:gsub('(\\begin{longtable}%[%]){@{}(.-)@{}}\n', function(open, columns)
      local out = {}
      local depth = 0
      local piece = ''
      -- A column is a letter, or what stands before one with it.
      for c in columns:gmatch('.') do
        piece = piece .. c
        if c == '{' then
          depth = depth + 1
        elseif c == '}' then
          depth = depth - 1
        end
        if depth == 0 and (c == 'l' or c == 'c' or c == 'r' or (c == '}' and piece:match('p{'))) then
          if piece:match('^%s*>{') and not piece:match('p{') then
            -- What stands before the column goes on with it.
          else
            out[#out + 1] = piece
            piece = ''
          end
        end
      end
      return open .. '{|' .. table.concat(out, '|') .. '|}\n'
    end)
  end
  return tex
end

-- A table that stands in something: not one that may go over pages.
local function fixed(tex)
  tex = tex:gsub('^%s*{\\def\\LTcaptype{none}[^\n]*\n', '')
  tex = tex:gsub('\n}%s*$', '\n')
  tex = tex:gsub('\\begin{longtable}%[%]', '\\begin{tabular}')
  tex = tex:gsub('\\end{longtable}', '\\end{tabular}')
  tex = tex:gsub('\\endhead\n', '')
  tex = tex:gsub('\\endfirsthead\n', '')
  -- The line under the table is written before what the table holds.
  local foot = tex:match('(\\bottomrule\\noalign{})\n\\endlastfoot\n')
  if foot then
    tex = tex:gsub('\\bottomrule\\noalign{}\n\\endlastfoot\n', '', 1)
    tex = tex:gsub('\\end{tabular}', function()
      return '\\bottomrule\\noalign{}\n\\end{tabular}'
    end, 1)
  else
    tex = tex:gsub('\\endlastfoot\n', '')
  end
  return tex
end

function Div(el)
  if not FORMAT:match('latex') or not el.classes:includes('gk-tabular') then
    return nil
  end
  local out = pandoc.List()
  for _, block in ipairs(el.content) do
    if block.t == 'Table' then
      local tex = pandoc.write(pandoc.Pandoc({ block }), 'latex')
      local a = el.attributes
      local open = '{' .. size_of(a)
      if a.kind == 'fixed' then
        -- Within something, a table that has lines around every cell has the lines of a book.
        tex = ruled(fixed(tex), a.rules == 'grid' and 'horizontal' or a.rules)
      else
        tex = ruled(tex, a.rules)
        local left, right = '\\fill', '\\fill'
        if a.stand == 'left' then
          left = '0pt'
        elseif a.stand == 'right' then
          right = '0pt'
        end
        open = open .. string.format('\\setlength\\LTleft{%s}\\setlength\\LTright{%s}', left, right)
        open = open .. '\\setlength\\LTpre{0.5\\baselineskip}\\setlength\\LTpost{0.5\\baselineskip}'
      end
      out:insert(pandoc.RawBlock('latex', open .. '\n' .. tex .. '}'))
    else
      out:insert(block)
    end
  end
  return out
end
