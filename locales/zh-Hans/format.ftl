# Document formats: their kinds, and the editor of a format.

## The kinds of document format, as the formats are grouped by them.

format-kind-own = 自定义
format-kind-general = 通用
format-kind-style-guide = 写作规范
format-kind-publisher = 出版社
format-kind-journal = 期刊
format-kind-fiction = 小说
format-kind-stage = 戏剧与影视
format-kind-poetry = 诗歌

## The format editor.

format-name = 格式名称
# The name a format of one's own is first given, made from that of the format it is made from.
format-name-changed = { $name }（已修改）
format-saved = “{ $name }”已保存到你的自定义格式中
format-save-failed = 无法保存此格式。
format-delete-failed = 无法删除此格式。
format-delete-title = 删除格式“{ $name }”？
format-delete-message = 使用它的导图将改用通用文稿格式。
format-delete-confirm = 删除格式

## The parts of a format, as they are chosen at the left.

## Words that stand in several parts.

format-size = 字号
format-bold = 粗体
format-italic = 斜体
format-letters = 字母
format-alignment = 对齐
format-line-spacing = 行距
format-as-the-text = 同正文
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = 同正文
# Beside a number of 0, in the place of its unit.
format-not-said = 未规定
format-align-left = 左对齐
format-align-center = 居中
format-align-right = 右对齐
format-align-justified = 两端对齐
format-align-ragged = 左对齐，右侧不齐
format-case-none = 按原样
format-case-upper = 全部大写
format-case-smallcaps = 小型大写字母
format-spacing-single = 单倍
format-spacing-one-and-a-half = 1.5 倍
format-spacing-double = 双倍
format-stands-left = 靠左
format-stands-center = 居中
format-stands-right = 靠右

## The page.

format-page-custom = 其他尺寸
format-page-width = 宽度
format-page-height = 高度
format-margins = 页边距
format-margin-top = 上
format-margin-bottom = 下
format-margin-left = 左
format-margin-right = 右
format-lengths-hint = 长度要带单位：2.5cm、1in、25mm、12pt。
format-line-numbers = 为各行编号

## Type and spacing, and paragraphs.

format-typeface = 字体
format-hyphenate = 在行末断开单词
format-paragraphs = 段落之间的区分方式
format-paragraphs-indent = 首行缩进
format-paragraphs-spaced = 段间空白
format-indent = 缩进
format-indent-first = 标题之后也缩进
format-space-between = 段间距
format-italics = 斜体的排法
format-italics-italic = 排成斜体
format-italics-underline = 加下划线，如打字机文稿那样

## Headings.

format-numbered = 编号
format-level = 第 { $number } 级
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = 粗体
format-level-italic = 斜体
format-level-capitals = 全部大写
format-level-small-caps = 小型大写字母
format-level-centred = 居中
format-level-right = 靠右
format-level-run-in = 接排正文
format-level-indent = 与段落一样缩进
format-level-new-page-said = 另起一页
format-space-before = 段前间距
format-space-after = 段后间距
format-level-add = 增加一级
format-level-remove = 移除最深一级

## The title and the abstract.

format-title-placement = 题名的位置
format-title-top = 第一页顶部
format-title-own-page = 单独一页
format-title-authors = 作者
format-title-affiliations = 作者单位
format-title-date = 日期
format-title-abstract = 摘要与关键词
format-title-abstract-label = 摘要的标题
format-title-keywords-label = 关键词前的引导词

## Quotations, notes and the bibliography.

format-quote-indent-left = 左缩进
format-quote-indent-right = 右缩进
format-quote-when = 何时独立成段
format-quote-from-words = 从这么多词起
format-quote-from-lines = 或这么多行起
format-notes-kind = 注释的位置
format-notes-footnotes = 页脚
format-notes-endnotes = 文末
format-notes-title = 注释的标题
format-bibliography-title = 标题
format-bibliography-new-page = 另起一页
format-bibliography-hanging-indent = 悬挂缩进
format-bibliography-entry-spacing = 条目间距

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = 基于{ $base }
format-as-the-base = 同基础类型
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = 同基础类型
format-yes = 是
format-no = 否
format-underline = 下划线
format-equal-width = 等宽字体
format-equal-width-hint = 如代码那样
format-indent-left = 左缩进
format-indent-right = 右缩进
format-first-line = 首行
format-first-line-hint = 比其余各行多缩进多少
format-keep-with-next = 与下段同页
format-keep-with-next-hint = 不单独留在页面底部
format-new-page = 另起一页
format-break-text = 分隔处的内容
format-break-text-hint = 未规定时为 * * *；文稿用 #
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = 非粗体
format-look-not-italic = 非斜体
format-look-underlined = 下划线
format-look-not-underlined = 无下划线
format-look-as-written = 按原样
format-look-left = 左对齐
format-look-justified = 两端对齐
format-look-indent-left = 左缩进 { $length }
format-look-indent-right = 右缩进 { $length }
format-look-first-line = 首行 { $length }
format-look-space-before = 段前 { $length }
format-look-space-after = 段后 { $length }
format-look-line-spacing = 行距 { $spacing }
format-look-equal-width = 等宽字体
format-look-not-equal-width = 非等宽字体
format-look-kept = 与下段同页
format-look-not-kept = 不与下段同页
format-look-no-new-page = 不另起一页
format-look-text = 分隔处为“{ $text }”

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

format-figures = 插图
format-tables = 表格
format-captioned-called = { $kind ->
    [figure] 插图的名称
   *[table] 表格的名称
}
format-captioned-reference = 正文中指引它时
format-captioned-label-bold = 名称和编号用粗体
format-captioned-label-italic = 名称和编号用斜体
format-captioned-between = { $kind ->
    [figure] 编号与图题之间
   *[table] 编号与表题之间
}
# What stands between the number and the caption; called is the word and number, "Figure 1".
format-between-stop = { $kind ->
    [figure] 句点（{ $called }. 图题）
   *[table] 句点（{ $called }. 表题）
}
format-between-colon = { $kind ->
    [figure] 冒号（{ $called }: 图题）
   *[table] 冒号（{ $called }: 表题）
}
format-between-line = { $kind ->
    [figure] 图题单独成行
   *[table] 表题单独成行
}
format-between-other = 其他…
format-captioned-separator = 两者之间的内容
format-captioned-own-line = { $kind ->
    [figure] 然后图题单独成行
   *[table] 然后表题单独成行
}
format-caption = { $kind ->
    [figure] 图题
   *[table] 表题
}
format-caption-stands = { $kind ->
    [figure] 图题的位置
   *[table] 表题的位置
}
format-caption-below = { $kind ->
    [figure] 图片下方
   *[table] 表格下方
}
format-caption-above = { $kind ->
    [figure] 图片上方
   *[table] 表格上方
}
format-captioned-where = { $kind ->
    [figure] 插图的位置
   *[table] 表格的位置
}
format-captioned-stand = { $kind ->
    [figure] 插图放在
   *[table] 表格放在
}
format-captioned-wrap = 文字环绕其周围
format-captioned-placement = 在文档中
format-captioned-in-text = 在正文中
format-captioned-at-end = 集中放在文末
format-captioned-end-title = { $kind ->
    [figure] 插图部分的标题
   *[table] 表格部分的标题
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = 正文中留下的行
format-captioned-placeholder-missing = 必须包含 {"{}"}，即名称和编号所在之处
format-table-rules = 线条
format-table-rules-horizontal = 顶线、底线和标题下的线
format-table-rules-grid = 每个单元格四周
format-table-rules-none = 无
format-table-header-bold = 表头用粗体
format-equations = 公式
format-equations-stand = 公式的位置
format-equations-before = 编号前
format-equations-after = 编号后

## Page numbers and the running head.

format-page-numbers = 页码
format-page-numbers-show = 为页面编号

## About the format: where its requirements are from.

format-description = 说明
format-source = 要求的出处
# The date the source was read on.
format-source-read = 查阅于 { $date }。
format-source-high = 数值与出处一致。
format-source-medium = 出处只能部分查阅，或只能查阅较早的版本：请核对你在意的部分。
format-source-low = 能核实的很少：请把这些数值当作起点。
