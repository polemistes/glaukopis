# 取り込む文書。それぞれ表示中の要素の下で、要素のツリーになる
# （ADR 0012、0037）。locales/README.md を参照。

documents-choose = 取り込む文書
documents-filter = 文書
documents-filter-all = すべてのファイル
documents-title-element = 表示中の要素に文書を取り込む
documents-title-project = 文書からプロジェクトを作る
documents-reading = { $file }を読み込んでいます…
documents-reading-hint = 長い文書は少し時間がかかります。
documents-no-pandoc = この種類の文書はPandocで読み込みますが、Pandocがインストールされていないか、見つかりません。場所は設定で指定できます。
documents-unread = ファイルを読み込めませんでした。
documents-title = タイトル
documents-title-hint-element = 文書のいちばん上の要素の名前です。表示中の要素の下に置かれます。
documents-title-hint-project = プロジェクトの名前で、その中の文書のいちばん上の要素の名前にもなります。
# 文書にタイトルがないとき、文書から作ったプロジェクトの呼び名。
documents-untitled = 無題

## 文書の中身。それぞれの数の下に示す。

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

## 文書が、ライブラリにある作品と、ライブラリにない作品を何回引用しているか。

documents-cited-in-library = ライブラリにある作品が{ $cited }回引用されています。
documents-cited-not-in-library = ライブラリにない作品が{ $missing }回引用されています。
documents-cited-both = ライブラリにある作品が{ $cited }回、ない作品が{ $missing }回引用されています。

## 文書の中で見つけた引用（ADR 0015）。

documents-found = { $count ->
   *[other] 引用が{ $count }件見つかりました。
}
documents-found-made = { $count ->
   *[other] 引用が{ $count }件見つかりました。すべて文献管理ソフトで作られたものです。
}
documents-found-some-made = 引用が{ $count }件見つかりました。そのうち{ $made }件は文献管理ソフトで作られたものです。
documents-at-once = Zoteroで作られた引用のうち、ライブラリにある作品のものはすぐに引用にする
# 選択肢の下：そうした引用を含む注がどうなるか。
documents-at-once-notes = 引用だけからなる注は本文中の引用になり、引用スタイルに従って注または本文中に組まれます。ほかの内容もある注は、引用をそのまま持ちます。未照合の引用のパネルで、以降すべてに対して注について選んだことは、ここでも適用されます。
documents-go-through-element = 文書を取り込むときに引用を順に確認する
documents-go-through-project = プロジェクトを作るときに引用を順に確認する

## 要素を作る。

# 文書を取り込む人が、その文書について知っておくべきことの上に。
documents-to-know = 確認事項
documents-making = 文書を取り込んでいます…
documents-make-element = 取り込む
documents-make-project = プロジェクトを作る
documents-failed = 文書を取り込めませんでした。

## 要素が文書として受け継ぐもの

# 要素が自分では決めず、上にある名前の要素から受け継ぐ設定の下に。
documents-inherited-from = { $name }から継承
