# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = 选择要引入的文档
documents-filter = 文档
documents-filter-all = 所有文件
documents-title-map = 由文档生成导图
documents-title-project = 由文档生成项目
documents-reading = 正在读取 { $file }…
documents-reading-hint = 较长的文档需要一点时间。
documents-no-pandoc = 这类文档由 Pandoc 读取，但 Pandoc 没有安装或者找不到。可以在设置中指定它的位置。
documents-unread = 无法读取此文件。
documents-title = 标题
documents-title-hint-map = 导图的名称，也是其中心元素的名称。
documents-title-hint-project = 项目的名称，也是其导图及导图中心元素的名称。
# What a project made of a document is called when the document has no title.
documents-untitled = 无标题

## What the document holds, under the number of each.

documents-parts = { $count ->
   *[other] 部分
}
documents-words = { $count ->
   *[other] 字词
}
documents-notes = { $count ->
   *[other] 注释
}
documents-figures = { $count ->
   *[other] 插图
}
documents-tables = { $count ->
   *[other] 表格
}
documents-equations = { $count ->
   *[other] 公式
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = 文献库中的著作被引用 { $cited ->
       *[other] { $cited } 次
    }。
documents-cited-not-in-library = 不在文献库中的著作被引用 { $missing ->
       *[other] { $missing } 次
    }。
documents-cited-both = 文献库中的著作被引用 { $cited ->
       *[other] { $cited } 次
    }，不在其中的著作被引用 { $missing ->
       *[other] { $missing } 次
    }。

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
   *[other] 找到 { $count } 处引文。
}
documents-found-made = { $count ->
   *[other] 找到 { $count } 处引文，全部由文献管理软件生成。
}
documents-found-some-made = 找到 { $count } 处引文，其中 { $made } 处由文献管理软件生成。
documents-at-once = 把 Zotero 生成、文献库中已有对应著作的引文立即转为正式引文
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = 只含一处引文的注释会变为行内引文，再由引用样式排为注释或行内引文；内容更多的注释则保留其中的引文。你在“识别出的引文”面板中为后续所有注释所做的选择，在这里同样适用。
documents-go-through-map = 生成导图时逐一处理引文
documents-go-through-project = 生成项目时逐一处理引文

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = 须知
documents-making = 正在生成导图…
documents-make-map = 生成导图
documents-make-project = 生成项目
documents-map-failed = 无法生成导图。
