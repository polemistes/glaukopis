# Figures, formulas and equations in the text, and the cross-references to
# them. See locales/README.md.

## A figure, and the panel of what can be said of it.

figures-figure = 插图
figures-width = 宽度
figures-width-third = 三分之一
figures-width-half = 一半
figures-width-three-quarters = 四分之三
figures-width-whole = 全宽
figures-width-of-row = 占它在这一排中所得的空间。
figures-width-of-text = 占文档中文本宽度。
figures-shows = 内容
figures-shows-placeholder = 用文字描述，供看不到图的人阅读
figures-numbered = 编号，如“图 1”
figures-keep-caption = 把题注与图片一起保存
figures-keep-caption-hint = 以后用这张图片做的插图，就以这里的说明开头
figures-take-caption = 使用图片自带的说明
figures-take-caption-hint = 用图片保存的说明替换这里现有的说明
figures-another-picture = 换一张图片…
figures-remove = 移除插图
figures-caption-kept = 已与图片一起保存
figures-caption-kept-detail = 用它做的插图以这些文字开头。
# The title of the window in which a picture is chosen among the files of the computer.
figures-choose-picture = 选择图片
# What the files that can be chosen there are called.
figures-picture-files = 图片

## The store of pictures, as the text reads it.

figures-pictures-unread = 无法读取图片
figures-picture-not-taken = 无法添加图片
figures-picture-not-kept = 无法保存对图片的说明
figures-picture-not-removed = 无法移除图片

## Where a figure, a table or an equation stands.

figures-stands = 位置
figures-stands-in-row = 与其他并排
figures-stands-alone = 重新单独放置
# Said of the choices of where it stands; the kind is figure, table or equation.
figures-stands-where = { $kind ->
        [figure] 插图
        [table] 表格
       *[equation] 公式
    }的位置
figures-side-format = 按格式
figures-side-left = 左
figures-side-middle = 中
figures-side-right = 右
# What the format of the document says of where things of a kind stand. The
# flow is none for equations, and for what stands in the middle.
figures-usual = 格式把{ $kind ->
        [figure] 插图
        [table] 表格
       *[equation] 公式
    }放在{ $side ->
        [left] 左侧
        [right] 右侧
       *[center] 中间
    }{ $flow ->
        [around] ，文字环绕其周围
        [apart] ，与文字分开
       *[none] {""}
    }。
figures-text = 文字
figures-flows-where = 文字是否环绕{ $kind ->
        [figure] 插图
        [table] 表格
       *[equation] 公式
    }
figures-flow-format = 按格式
figures-flow-around = 文字环绕
figures-flow-apart = 单独成行
figures-flow-at-side = 放在一侧的内容，文字会环绕它。
figures-beside = 与前一个并排

## A formula in the line, and an equation on a line of its own.

figures-formula = 公式
figures-equation = 公式块
figures-equation-numbered = 编号
figures-formula-field = 公式，用 TeX 记法
figures-formula-empty = 所写的内容会在这里按最终效果显示。
figures-formula-hint = 按 TeX 的写法输入。完成后按 Enter，按 Esc 恢复原样。
figures-equation-hint = 按 TeX 的写法输入。完成后按 Enter，按 Shift+Enter 换行，按 Esc 恢复原样。
figures-formula-unread = 无法读取此公式。
# Shown in the text where a formula has nothing written in it yet.
figures-formula-blank = 公式
figures-equation-blank = 公式块

## What can be put into a formula by pressing.

figures-sign-raised = 上标
figures-sign-lowered = 下标
figures-sign-fraction = 分数
figures-sign-root = 根号
figures-sign-sum = 求和
figures-sign-integral = 积分
figures-sign-brackets = 自动伸缩的括号
figures-sign-alpha = alpha
figures-sign-beta = beta
figures-sign-gamma = gamma
figures-sign-lambda = lambda
figures-sign-pi = pi
figures-sign-sigma = sigma
figures-sign-less-or-equal = 小于等于
figures-sign-greater-or-equal = 大于等于
figures-sign-not-equal = 不等于
figures-sign-nearly-equal = 约等于
figures-sign-times = 乘
figures-sign-plus-or-minus = 正负
figures-sign-arrow = 箭头
figures-sign-infinity = 无穷
figures-sign-words = 公式中的文字

## Cross-references to a figure, a table, an equation or a part.

figures-points-by = 显示为
figures-form-full = 名称和编号
figures-form-number = 只显示编号
figures-form-equation = 公式旁所标的编号
figures-form-its-number = 其编号
figures-form-its-name = 其名称
figures-go-to = 转到引用的对象
figures-pointed-gone = 引用的对象已不在文档中
figures-point-elsewhere = 改为引用其他对象…

## Choosing what a cross-reference refers to.

figures-targets = 选择引用的对象
figures-targets-placeholder = 引用插图、表格、公式或某一部分
figures-targets-search = 搜索可引用的对象
figures-targets-results = 可引用的对象
figures-targets-figures = 插图
figures-targets-tables = 表格
figures-targets-equations = 公式
figures-targets-parts = 文档的各部分
figures-targets-figure-unsaid = 一幅没有说明的插图
figures-targets-table-unsaid = 一个没有说明的表格
figures-targets-no-match = 文档中没有与这些词相符的内容。
figures-targets-none = 还没有可引用的对象：没有插图、表格、带编号的公式，也没有带名称的部分。
figures-targets-hint = 交叉引用会跟随所引用的对象：其编号，以及格式对它的称呼。

## Shown by the stylesheet, where the page has no element for the words.

figures-picture-absent = 图片不在这台计算机上
figures-caption-placeholder = 对图片的说明
