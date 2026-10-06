# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = 图片“{ $name }”不在这台计算机上，已从文档中略去。
core-export-astray = { $count ->
   *[other] 文本中有 { $count } 处交叉引用指向文档中没有的内容，已显示为 [?]。
}
core-export-latex-font = 没有安装 { $font }。文档改用 LaTeX 自带的字体 Latin Modern 排印。
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = 文档中有 { $count } 段文本没有发送过来，也没有保存。
# Shown after "not found: ".
core-export-preview-document = 预览的文档
core-export-reading-pdf = 读取生成的 PDF
core-export-reading-made = 读取生成的文档

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = 无法读取模板文档：{ $error }
core-export-pattern-lacks = 模板文档中没有 { $name }
core-export-pattern-reading = 读取模板文档
core-export-pattern-writing = 写入模板文档

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = 公式没有写完就结束了。
# The command is as it was written: \frac.
core-export-formula-unknown = 无法识别 { $command }。
core-export-formula-unexpected = { $what } 不应出现在这里。
core-export-formula-unreadable = 无法读取此公式。
core-export-formula-too-long = 公式太长。

## Reference styles.

core-export-style-bad-id = “{ $id }”不能作为引用样式的 ID
core-export-not-a-style = 这不是一个引用样式：{ $error }。
core-export-not-a-style-begin = 这不是一个引用样式：它不以 <style> 开头。
core-export-dependent-style = 此样式只是指向另一个样式，并沿用其写法。请改按名称获取那个样式。
core-export-style-unreadable = 无法重新读取此样式。
core-export-style-needs-name = 引用样式需要一个名称。
core-export-style-own-only = 只能删除你自己的引用样式。
# Shown after "not found: ".
core-export-the-reference-style = 引用样式“{ $id }”
core-export-any-reference-style = 任何引用样式
core-export-the-style = 样式“{ $id }”

## Document formats.

core-export-format-bad-id = “{ $id }”不能作为格式的 ID
core-export-format-needs-name = 格式需要一个名称。
core-export-format-own-only = 只能删除你自己的格式。
core-export-not-a-length = “{ $length }”不是一个长度
# Shown after "not found: ".
core-export-the-format = 格式“{ $id }”
