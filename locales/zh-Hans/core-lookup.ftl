# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = “{ $doi }”不是 DOI。
core-lookup-not-arxiv = “{ $id }”不是 arXiv 标识符。
core-lookup-not-pubmed = “{ $id }”不是 PubMed 编号。
core-lookup-isbn-length = “{ $isbn }”不是 ISBN：ISBN 有 10 位或 13 位数字，而这里有 { $count } 位。
core-lookup-isbn-check = “{ $isbn }”不是 ISBN：它的最后一位由其他各位算出，但与之不符。是不是有一位输错了？
core-lookup-not-isbn = “{ $isbn }”不是 ISBN。
core-lookup-address = 网址中含有 DOI、arXiv 标识符或 PubMed 编号时才能查询。这个网址没有：请改为搜索标题。
core-lookup-nothing = 没有要查找的内容。

## The services, and what they ask to have said of them.

core-lookup-sikt = 挪威学术图书馆（Sikt）
core-lookup-thanks-arxiv = 感谢 arXiv 提供开放获取的互操作接口。
core-lookup-thanks-sikt = 包含来自 Sikt 图书馆目录的记录，依据挪威政府公开数据许可（NLOD）提供。
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref（图书）

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service } 返回了无法读取的内容
core-lookup-not-preprints = { $service } 返回的不是预印本列表
core-lookup-not-articles = { $service } 返回的不是文章列表
core-lookup-could-not-answer = { $service } 无法回答此查询：{ $said }
core-lookup-catalogue-could-not-answer = 书目无法回答此查询：{ $said }
core-lookup-no-reason = 未说明原因
core-lookup-catalogue-unreadable = 无法读取返回的内容
core-lookup-not-a-catalogue = 返回的内容不是书目的回答
core-lookup-pubmed-book = { $service } 把它记录为图书或图书的一部分，目前还无法从中读取
core-lookup-wrong-form = { $host } 没有以所要求的形式提供记录
core-lookup-not-a-record = { $service }：返回的不是可读取的记录。

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = 此预印本后来已正式发表。填入的 DOI 是正式发表版本的：若要引用正式版本，请查询 { $doi }。
core-lookup-arxiv-published = 此预印本后来已正式发表：{ $journal }。
core-lookup-arxiv-year-only = 这里只给出了年份。查询 arXiv:{ $id } 可以得到预印本提交的日期。
core-lookup-crossref-in-book = 搜索不会给出图书的编者和 ISBN，查询 DOI 才会。
core-lookup-book-unreadable = 无法读取 Crossref 中关于该图书的信息：编者可能缺失。
core-lookup-book-not-fetched = 无法获取 Crossref 中关于该图书的信息：编者可能缺失。
core-lookup-chapter-author = Crossref 没有给出这一章的作者。已把图书的作者填为本章作者。
core-lookup-group-name = “{ $name }”原以个人姓名“{ $family }, { $given }”给出，现已作为团体名称处理。
core-lookup-kind-none = 记录中没有注明出版物类型。已填为“misc”：请选择正确的类型。
core-lookup-kind = 记录把出版物类型称为“{ $kind }”。已填为“misc”：请选择正确的类型。
core-lookup-publisher-capitals = 出版者原为全大写“{ $publisher }”，已改写为“{ $mended }”。
core-lookup-no-creators = 记录中没有作者或编者。
core-lookup-title-capitals = 标题原为全大写，已改为小写：请检查专有名词的首字母是否大写。
core-lookup-name-capitals = 姓名“{ $family }”原为全大写，已改写为“{ $mended }”。
core-lookup-pubmed-translated = PubMed 把标题译为英文“{ $title }”。
core-lookup-pubmed-translation = 此标题是 PubMed 的英文译名。文章原语言的标题没有给出。
core-lookup-parallel-title = 记录还给出了另一种语言的标题，但没有填入：“{ $title }”。
core-lookup-original-script = 标题按书目的拉丁字母转写填入。其原文书写为“{ $title }”。
core-lookup-unplaced-name = 记录中提到了 { $name }，却没有说明其身份。此姓名没有填入。
core-lookup-thesis = 此书同时也是学位论文：{ $said }。
core-lookup-ebook = 电子书记录：出版地、出版者和年份均为电子版的信息。
core-lookup-sound = 录音资料。
core-lookup-audio-book = 有声书记录。
core-lookup-not-text = 此记录不是文本。已尽量填入：请选择正确的类型。
core-lookup-other-form = 所查询的 ISBN 属于该书的另一种形式。此记录所描述的版本的 ISBN 是 { $isbn }。
core-lookup-other-isbn = 此记录中没有所查询的 ISBN。它所描述的版本的 ISBN 是 { $isbn }。
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = 无
core-lookup-another-edition = 同一 ISBN 的另一版本（{ $which }）。
# Which edition, in the brackets of the message above.
core-lookup-edition-year = 第 { $edition } 版，{ $year }
core-lookup-without-year = 无年份
