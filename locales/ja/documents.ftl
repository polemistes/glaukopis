# Documents that are brought in, each to become a map (ADR 0012), in
# English. See locales/README.md.

documents-choose = 取り込む文書
documents-filter = 文書
documents-filter-all = すべてのファイル
documents-title-map = 文書からマップを作る
documents-title-project = 文書からプロジェクトを作る
documents-reading = { $file }を読み込んでいます…
documents-reading-hint = 長い文書は少し時間がかかります。
documents-no-pandoc = この種類の文書はPandocで読み込みますが、Pandocがインストールされていないか、見つかりません。場所は設定で指定できます。
documents-unread = ファイルを読み込めませんでした。
documents-title = タイトル
documents-title-hint-map = マップの名前で、中心の要素の名前にもなります。
documents-title-hint-project = プロジェクトの名前で、そのマップと、マップの中心の要素の名前にもなります。
# What a project made of a document is called when the document has no title.
documents-untitled = 無題

## What the document holds, under the number of each.

documents-parts = { $count ->
   *[other] 部分
}
documents-words = { $count ->
   *[other] 語
}
documents-notes = { $count ->
   *[other] 注
}
documents-figures = { $count ->
   *[other] 図
}
documents-tables = { $count ->
   *[other] 表
}
documents-equations = { $count ->
   *[other] 数式
}

## How often the document cites works of the library, and works the library does not have.

documents-cited-in-library = ライブラリにある作品が{ $cited }回引用されています。
documents-cited-not-in-library = ライブラリにない作品が{ $missing }回引用されています。
documents-cited-both = ライブラリにある作品が{ $cited }回、ない作品が{ $missing }回引用されています。

## The citations that were found in it (ADR 0015).

documents-found = { $count ->
   *[other] 引用が{ $count }件見つかりました。
}
documents-found-made = { $count ->
   *[other] 引用が{ $count }件見つかりました。すべて文献管理ソフトで作られたものです。
}
documents-found-some-made = 引用が{ $count }件見つかりました。そのうち{ $made }件は文献管理ソフトで作られたものです。
documents-at-once = Zoteroで作られた引用のうち、ライブラリにある作品のものはすぐに引用にする
# Under the choice: what becomes of a note that holds one of them.
documents-at-once-notes = 引用だけからなる注は行内の引用になり、引用スタイルに従って注または行内に組まれます。他の内容もある注は、引用をそのまま持ちます。見つかった引用のパネルで、以降すべてに対して注について選んだことは、ここでも適用されます。
documents-go-through-map = マップを作るときに引用を確認する
documents-go-through-project = プロジェクトを作るときに引用を確認する

## Making the map.

# Over what the one who brings the document in should know of it.
documents-to-know = 確認事項
documents-making = マップを作っています…
documents-make-map = マップを作る
documents-make-project = プロジェクトを作る
documents-map-failed = マップを作れませんでした。
