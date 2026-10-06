# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = 粘贴的文本
core-import-files = { $count } 个文件

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = 找不到文件“{ $name }”。
core-import-empty-entry = 第 { $line } 行：条目“{ $key }”是空的，已略去。
# Where in a file a reference that has no key was found.
core-import-origin-line = 第 { $line } 行
core-import-origin-key-line = { $key }，第 { $line } 行

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = “{ $title }”
core-import-merge-gone = { $reference }：要合并的条目已经不在了

## PDF files.

core-import-not-a-pdf = { $name } 不是 PDF。
# The service is a name: Crossref, DataCite.
core-import-details-from = 详细信息来自 { $service }。
core-import-number-unknown = 文件中找到了一个编号，但数据库中没有它的任何信息；详细信息取自文件本身，请核对。
core-import-databases-failed = 无法查询数据库（{ $error }）；详细信息取自文件本身，请核对。

## Zotero.

core-import-zotero-my-library = 我的文库
core-import-zotero-group = 群组 { $id }
core-import-zotero-the-library = Zotero 中的文库 { $id }
core-import-zotero-own-library = Zotero 中用户自己的文库
core-import-zotero-the-collection = Zotero 中的分类 { $key }
core-import-zotero-unknown-base = 找不到文件“{ $name }”。Zotero 从它自己选定的一个文件夹链接到这个文件，而这里不知道是哪个文件夹。
core-import-zotero-empty-item = Zotero 中的条目 { $key } 是空的，已略去。
core-import-zotero-alone = { $count ->
   *[other] Zotero 中有 { $count } 个文件和笔记不属于任何文献，已略去。
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero 把 { $name } 列为 { $role }，而 BibLaTeX 没有对应的字段。此姓名已略去。
core-import-zotero-left-out = Zotero 的字段“{ $field }”在 BibLaTeX 中没有对应，已略去：{ $value }

## Zotero's database.

core-import-zotero-no-database = { $path } 中的 Zotero 数据库（{ $file }）
core-import-zotero-copying = 把 { $path } 复制到临时文件夹
core-import-zotero-empty = 文件是空的
core-import-zotero-disturbed = 读取时 Zotero 正在写入它的数据库。如果有缺失，请关闭 Zotero 后重新导入。
core-import-zotero-backup-read = 无法读取 Zotero 的数据库（{ $error }），改为读取了它的备份 { $backup }：备份之后在 Zotero 中所做的更改都没有包括在内。
core-import-zotero-not-a-database = { $path } 不是 Zotero 的数据库。
core-import-zotero-unreadable = 这个 Zotero 数据库的结构在这里无法读取：{ $what }。如果它是旧版 Zotero 写的，用新版 Zotero 打开一次即可更新。
core-import-zotero-unreadable-version = 这个 Zotero 数据库的结构在这里无法读取（Zotero 数据库版本 { $version }）：{ $what }。如果它是旧版 Zotero 写的，用新版 Zotero 打开一次即可更新。
core-import-zotero-no-table = 缺少表“{ $table }”
core-import-zotero-no-column = 表“{ $table }”中没有列“{ $column }”
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = 这个 Zotero 数据库中没有这里所知结构的表“{ $table }”：{ $consequence }。
core-import-zotero-no-bin = 无法把 Zotero 回收站中的条目与其他条目区分开
core-import-zotero-no-collections = 没有读取分类
core-import-zotero-no-attachments = 没有读取附件
core-import-zotero-no-notes = 没有读取笔记
core-import-zotero-no-keywords = 没有读取关键词
core-import-zotero-no-group-names = 群组文库的名称不详

## PDF files, as they are read for a reference.

core-import-pdf-empty = 文件“{ $name }”是空的。
core-import-pdf-not-a-pdf = 文件“{ $name }”不是 PDF。
core-import-pdf-unreadable = 无法读取此文件：它已损坏、受密码保护，或者太大。
core-import-pdf-scan = 此文件没有文字层：它是扫描件。
core-import-pdf-from-file = 详细信息取自文件本身，而非书目，请核对。
core-import-pdf-from-metadata = 文件中没有找到 DOI 或 ISBN；详细信息取自文件自身的元数据，请核对。
core-import-pdf-unknown = 文件中没有找到 DOI 或 ISBN，其元数据也没有说明它是什么：详细信息需要手动填写。

## Tables, from files of text and of sheets.

core-import-table-too-large = 文件大小为 { $size } MB。表格只能从不超过 { $most } MB 的文件中读取。
core-import-table-kinds = 表格可以从 CSV 以及用逗号、分号或制表符分隔各值的其他文本中读取，也可以从 LibreOffice（.ods）和 Excel（.xlsx、.xls）的工作表中读取。
core-import-table-empty = 文件中什么也没有。
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = 此表格有 { $rows } 行。文本中的表格最多只能有 { $most } 行：它不是电子表格。
core-import-table-columns = 此表格有 { $columns } 列。文本中的表格最多只能有 { $most } 列：它不是电子表格。
core-import-table-more-than = 超过 { $count }

## Documents brought in, to become maps.

core-import-document-stopped = 读取已停止。
core-import-pdfs-stopped = 辨认文件的过程已停止。没有添加任何内容。
core-import-document-kind = “{ $file }”不是可以作为文档引入的类型。可以引入的有 Word（DOCX）、OpenDocument（ODT）、Markdown、HTML、LaTeX、RTF、EPUB、Org、reStructuredText、Typst 和纯文本。
core-import-document-too-large = “{ $file }”超过 50 MB，太大，无法作为文档引入。
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = 无法把“{ $file }”作为 { $kind } 读取。它可能已损坏，或者实际类型与文件名不符。读取它的 Pandoc 报告：{ $message }
core-import-document-pandoc-unreadable = 无法读取 Pandoc 由“{ $file }”生成的内容：{ $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = 无标题
core-import-document-plain-text = 纯文本
core-import-document-notebook = Jupyter 笔记本

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
   *[other] { $made ->
        [all] 找到 { $count } 处尚未与你文献库中的文献关联的引文，全部由文献管理软件生成。它们保持原来写成的文字，可以在生成导图时逐一处理，也可以以后再处理。
        [some] 找到 { $count } 处尚未与你文献库中的文献关联的引文，其中 { $some } 处由文献管理软件生成。它们保持原来写成的文字，可以在生成导图时逐一处理，也可以以后再处理。
       *[none] 找到 { $count } 处尚未与你文献库中的文献关联的引文。它们保持原来写成的文字，可以在生成导图时逐一处理，也可以以后再处理。
    }
}
core-import-document-endnote = { $count ->
   *[other] 有 { $count } 处由 EndNote 生成的引文按其显示的文字引入，不在识别出的引文之列：无法读取 EndNote 对这些著作的记录。
}
core-import-document-bookmarks = { $count ->
   *[other] 文档把 { $count } 处引文保存在书签中，无法读取它们所引用的内容：它们按原样作为文字保留。Zotero 会根据其文档首选项改用其他方式保存引文。
}
core-import-document-bibliography = 文档在“{ $heading }”下有一份引用列表。它和其余部分一样作为文字引入。导图会根据其中的引用自行生成参考文献。
core-import-document-bibliography-made = 文档有一份由其文献管理软件生成的引用列表。它和其余部分一样作为文字引入。导图会根据其中的引用自行生成参考文献。
core-import-document-tracked = 文档中有修订记录。引入的文本是接受全部修订后的样子。
core-import-document-comments = 文档的页边有批注，已略去。
core-import-document-heading-notes = { $count ->
   *[other] 有 { $count } 条标题上的注释放在了该标题下文本的开头：标题不能带注释。
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
   *[other] 有 { $count } 条题注以一个词和一个编号开头，例如“{ $first }”。这部分已略去：导图会自行为插图和表格编号。文本中按编号提到它们之处保持原来写成的文字，不随导图的编号变化。
}
core-import-document-label-example = 图 1：
core-import-document-caption-notes = { $count ->
   *[other] 插图或表格说明中的 { $count } 条注释以方括号的形式留在原处。
}
core-import-document-headings = { $count ->
   *[other] 引文、列表或表格中的 { $count } 个标题作为粗体段落引入。
}
core-import-document-code = { $count ->
   *[other] { $count } 个代码块作为普通段落引入，每行一段。
}
core-import-document-definitions = { $count ->
   *[other] { $count } 个术语释义列表作为段落引入，术语为粗体。
}
core-import-document-rules = { $count ->
   *[other] { $count } 条横跨页面的线已略去。
}
core-import-document-raw = { $count ->
   *[other] { $count } 段只为某一种文档而用 HTML 或 TeX 写成的内容已略去。
}
core-import-document-pictures-wanting = { $count ->
   *[other] 文件中有 { $count } 张图片不在读出的文本中，已略去。它们可能位于页眉、页脚或绘图中。
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = 图片“{ $name }”已略去：{ $why }。
core-import-document-picture-kind = 它属于不读取的类型（{ $kind }）
core-import-document-picture-not-read = 它不是可读取类型的图片
core-import-document-picture-unreadable = 无法读取它
core-import-document-picture-network = 它在网络上，而这里不从网络获取任何内容
core-import-document-picture-not-taken-out = 无法从文件中取出它
core-import-document-picture-outside = 它不在文件中，而在这台计算机的其他位置，不从那里获取
core-import-document-picture-not-found = 在文档所说的位置找不到该文件
core-import-document-picture-too-large = 它超过 50 MB
core-import-document-picture-file-unreadable = 无法读取该文件
