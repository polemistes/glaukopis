# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = 格式
editor-writing = 写作
editor-italic = 斜体
editor-bold = 粗体
editor-small-capitals = 小型大写字母
editor-superscript = 上标
editor-subscript = 下标
editor-struck = 删除线
editor-quotation = 引文
editor-block-quotation = 独立引文
editor-list = 列表
editor-text = 正文
editor-text-hint = 普通段落
editor-quotation-hint = 与正文分开排印
editor-list-hint = 每项前有一个符号
editor-numbered-list = 编号列表
editor-numbered-list-hint = 每项前有一个编号
editor-verse = 韵文
editor-verse-hint = 诗歌或戏剧的诗行，每行保持为一行
editor-speaker = 说话人
editor-speaker-hint = 谁在说话，单独成行
editor-direction = 舞台说明
editor-direction-hint = 所做的动作，用斜体
editor-line-numbers = 行号
editor-line-numbers-hint = 为这段韵文编行号：从第几行起，每隔几行标一次
editor-line-numbers-from = 行号起始于
editor-line-numbers-none = 留空则不编号
editor-line-numbers-every = 每隔几行标号
editor-line-numbers-number = 请输入一个整数。
editor-kinds-text = 正文
editor-kinds-quotation = 引文
editor-kinds-verse = 韵文
editor-kinds-script = 剧本
editor-kinds-more = 更多
editor-kinds-words = 词语
editor-attribution = 出处
editor-attribution-hint = 引文之下靠右，注明是谁的话
editor-epigraph = 题词
editor-epigraph-hint = 位于一部分开头的引文
editor-headword = 词目
editor-headword-hint = 词汇表所解释的词
editor-gloss = 释义
editor-gloss-hint = 词目的意思
editor-code = 代码
editor-code-hint = 逐字保留，用等宽字体
editor-break = 分隔
editor-break-hint = 两部分之间的停顿，用格式规定的符号表示
editor-draft = 草稿备注
editor-draft-hint = 只给你自己看：不会进入任何文档
editor-foreign = 外文词
editor-foreign-hint = 另一种语言的词，拼写检查会随之切换
editor-title-of-work = 作品名
editor-title-of-work-hint = 书、剧本、画作的名称
editor-term = 术语
editor-term-hint = 首次使用处的术语
editor-mention = 提及
editor-mention-hint = 作为词来谈论的词，加引号
editor-highlight = 高亮
editor-highlight-hint = 只为屏幕上醒目：不会进入任何文档
editor-underline = 下划线
editor-code-words = 行内代码
editor-code-words-hint = 行内的等宽字体
editor-scene = 场景标题
editor-scene-hint = 内景 房子 – 夜
editor-action = 动作
editor-action-hint = 看到的和发生的
editor-character = 角色
editor-character-hint = 谁在说话，位于对白之上
editor-dialogue = 对白
editor-dialogue-hint = 所说的话
editor-parenthetical = 括号说明
editor-parenthetical-hint = 怎么说，放在括号里
editor-transition = 转场
editor-transition-hint = 切至：，靠右
editor-comment = 批注
editor-comment-hint = 对所选内容的批注
editor-comment-element-hint = 对此元素的批注；选中词语可对其批注
editor-parallel = 两种文本并排
editor-parallel-hint = 原文及其译文，各自成为独立的文本
editor-paragraph-kind = 段落类型
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = 段落类型：{ $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = 更多…
editor-kinds-in-hand = 常用类型
editor-kinds-own = 自定义
editor-kinds-make = 新建类型…
editor-kinds-change-own = 修改自定义类型…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = 按“{ $format }”的规定排印
editor-kinds-change-format = 修改格式…
editor-kinds-change-format-hint = 此文档中每种类型如何排印
editor-words = 词语
editor-words-hint = 下划线、上标、代码；外文词、作品名、术语
editor-words-make = 新建词语类型…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = 导图的语言
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = 普通词语
editor-own-kind-new = 自定义类型
editor-own-kind-change = 修改类型
editor-own-kind-name = 名称
editor-own-kind-name-placeholder = 书信、电报、祷文…
editor-own-kind-words-placeholder = 船名、拉丁文、关键词…
editor-own-kind-name-taken = 已有同名的类型。
editor-own-kind-based-on = 基于
editor-own-kind-based-on-hint = 下面未加说明的，都与此类型相同
editor-own-kind-look = 不同之处
editor-own-kind-create = 创建
editor-own-kind-delete-title = 删除类型“{ $name }”？
editor-own-kind-delete-message = { $count ->
    [0] 没有文本属于此类型。
   *[other] { $count } 个元素中属于此类型的内容保持不变，在文档中作为正文排印。
}

## Citing, notes, and what is put into the text.

editor-cite = 引用
editor-cite-here = 在此引用著作
editor-cite-at-cursor = 在光标处引用著作
editor-note = 注释
editor-note-selection = 把所选内容变为注释
editor-note-hint = 注释，位于页脚或文末
editor-insert = 插入
editor-insert-hint = 图片、表格、数学公式、交叉引用
editor-new-element = 新建元素
editor-new-element-hint = 在此元素之后或之下新建元素
editor-new-after = 在此元素之后新建元素
editor-new-under = 在此元素之下新建元素
editor-new-split = 在此拆分
editor-new-split-hint = 光标之后的内容成为一个新元素
editor-spelling-on = 书写时检查拼写 · 单击停止
editor-spelling-off = 不检查拼写 · 单击开始检查
editor-picture-file = 来自文件的图片…
editor-picture-file-hint = 一幅插图，连同对它的说明
editor-picture-store = 来自图库的图片…
editor-picture-store-hint = 你已有的图片显示在侧边
editor-equation = 公式块
editor-equation-hint = 单独成行的数学公式
editor-table = 表格…
editor-table-hint = 指定行数和列数
editor-table-file = 来自文件的表格…
editor-table-file-hint = CSV，或 LibreOffice、Excel 的工作表
editor-formula = 公式
editor-formula-hint = 行内的数学公式
editor-pointer = 交叉引用…
editor-pointer-hint = 指向插图、表格、公式或某一部分：“见图 2”
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = 图片

## More.

editor-found = 识别出的引文…
editor-found-count = 有 { $count } 处待处理并转为引文
editor-found-none = 以及此导图中看起来像引文的文字

## Choosing a work to cite.

editor-picker = 选择文献
editor-picker-placeholder = 引用：作者、标题、年份
editor-picker-search = 搜索文献
editor-picker-results = 文献
editor-picker-in-project = 本项目中
editor-picker-recent = 最近添加
editor-picker-empty = 你的文献库是空的。
editor-picker-no-match = 文献库中没有包含这些词的文献。
editor-picker-type = 输入文字以搜索文献库。
editor-picker-new = 新建文献…
editor-picker-import = 导入…

## A citation, and each work in it.

editor-citation = 引文
editor-citation-add = 添加著作
editor-citation-add-purpose = 向引文中添加著作
editor-citation-in-text = 作者在正文中：Nagy (1979)
editor-citation-remove = 移除引文
editor-citation-split = 把文字与引文分开
editor-citation-split-hint = 前后的文字变为正文，每部著作各自成为一处只含页码的引文
editor-citation-not-in-library = 此文献不在你的文献库中。
editor-citation-edit-reference = 编辑文献
editor-citation-before = 前缀
editor-citation-before-placeholder = 见、参见
editor-citation-after = 后缀
editor-citation-after-placeholder = 及多处
editor-citation-locator-kind = 定位类型
editor-citation-suppress-author = 作者已在我的句中提到：只给出年份
editor-citation-remove-work = 移除此著作
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = [未找到文献]
# Stands in the text in place of a citation of no work.
editor-citation-empty = （引文）

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

editor-locator-page = 页
editor-locator-chapter = 章
editor-locator-section = 节
editor-locator-paragraph = 段
editor-locator-line = 行
editor-locator-verse = 诗句
editor-locator-book = 册
editor-locator-volume = 卷
editor-locator-part = 部分
editor-locator-column = 栏
editor-locator-folio = 对开页
editor-locator-figure = 图
editor-locator-note = 注
editor-locator-number = 编号
editor-locator-sub-verbo = 词条

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = 注释 { $number }
editor-note-place = 注释的位置
editor-note-place-format = 按格式规定的位置
editor-note-place-foot = 页脚
editor-note-place-end = 文末
editor-note-placeholder = 注释的内容
