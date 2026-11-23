## 文書の見た目を一か所で：組版ペインの欄で、ページの見え方を決めるものを
## すべてここで設定する。ここで変えたものは、レイアウトに対する文書自身の
## 変更として保存される。

look-title = 見た目
look-between = ページと文書の見た目の境
look-whole = 見た目を決めるもの

look-scope = この変更の適用範囲
# 文書全体。その要素の名前で。
look-scope-document = 文書全体：{ $name }
# 文書の下の一つの要素だけ。その名前で。
look-scope-only = { $name }のみ

# Under a setting the document sets otherwise than its type.
look-changed-here = この文書で変更
# この要素より上の要素で行った変更。章に対する本のように。
look-changed-in = 「{ $name }」で変更
# Takes a change away.
look-reset = リセット

look-search = 設定を検索：フォント、余白、ページ番号…
look-search-nothing = この語を含む設定はありません。
look-sections = 見た目の各部

look-section-page = ページ
look-section-type = 文字
look-section-paragraphs = 段落
look-section-headings = 見出し
look-section-notes = 注と引用
look-section-figures = 図と表
look-section-front = 最初のページ

look-kinds-in-use = この文書で使用
look-heading-levels = 見出しのレベル
# 見た目の最初の行。たいていの書き手が手を伸ばすもの。どれも下のそれぞれの部分にもある。
look-first-type-size = 文字サイズ
look-first-page-size = ページサイズ
look-first-headings-numbered = 見出しに番号を振る
look-at-citations = 引用
look-at-bibliography = 参考文献


## 文書種別の部分。見た目の一部分：プログラムが自分で作る部分と、
## 自分の置き場所を与えられた要素の種類を、印刷される順に一つのリストで示し、
## 要件も示す。ここで変えたものは、文書が何であるかに対する文書自身の
## 変更として保存される。

look-parts-add = 追加
# Under the parts the type suggests: a menu of the other kinds there are.
look-parts-another = 別の部分…
# Beside a part, while a document type of the writer's own is edited: takes it out of the parts the type suggests.
look-parts-take-out = 「{ $name }」から外す
# 文書に一つだけ置く種類の、二つ目の要素に。
look-contents-kinds-doubled = 最初のものだけを使います
look-contents-limit-words = 本文の語数の上限
look-contents-limit-abstract-words = 要旨の語数の上限
look-contents-limit-keywords = キーワードの数の上限
# 上限が何を数えるか。文書種別が言うとおりに。
look-contents-requirements-note = 上限の数え方：{ $note }

# The look or the reference style a document has where its type brings none: the one from the settings, by its name.
look-your-default = { $name }（既定）
# The first choice of a look or a reference style: what the document type brings, by its name, and the type by its name.
look-from-type = { $name }（「{ $type }」から）
# The first choice where an element over this one has chosen: what it chose, and the element.
look-from-with = { $what }（「{ $name }」から）
look-style = 引用スタイル
look-style-change = この引用スタイルを変更…


# 選べるフォントのまとまり。
look-fonts-document = この文書で使用
look-fonts-project = このプロジェクトのほかの所で使用
look-fonts-all = すべてのフォント

## 側、ペイン、ツールバー、第2段階：組版ペイン、文書ペイン、文書のプロパティ。

# 文書のプロパティを、文書が何であるかのところで開く。
look-document-type = 文書種別…
look-hide = 見た目を隠す

## 言葉を減らす、第3段階：見た目の部分と見出しをわかりやすい言葉で。

look-section-line-numbers = 行番号
look-section-type-parts = 部分
look-at-quotations-warning = 文中の引用
look-at-paragraph-kinds = 段落の種類
look-at-words-kinds = 語句の種類
look-type-requirements = 文書種別の要件

## 設定、ズーム、種類のキー、第4段階：種類のキー。Ctrl+Alt と数字で、文書種別が与えるもの。
look-kind-key = キー
look-kind-key-none = なし
# ほかの種類がもっている数字：ここで選ぶと、その種類はキーをもたなくなる。
look-kind-key-taken = { $keys }（現在は{ $kind }）

## One form (the plan of 2026-11-22, stage 2): the top of Look says what the
## document sets otherwise than its type, and the last part is the document type.

# How many changes the document has over its type, at the top of Look.
look-changes-here = { $count ->
   *[other] この文書で{ $count }件の変更
  }
# Puts what the document sets otherwise into its type, a type of the writer's own, by its name.
look-save-to = 「{ $name }」に保存
# Makes a document type of the writer's own of the type in use and what the document sets otherwise.
look-save-as = 文書種別として保存…
look-save = 保存
look-type-name = 文書種別の名前
# While a type of the writer's own is edited in Look: every change goes into it.
look-editing = 文書種別「{ $name }」を編集中
look-done = 完了
look-section-document-type = 文書種別
# Where the look of the document is taken from: the type, the writer's default, or another document type's look.
look-taken-from = 見た目の取得元
# Over the list of what the document sets otherwise than its type.
look-changed-list = この文書で変更

# What a document type of the writer's own is beside its look and its parts, under Document type in Look.
look-type-field-name = 名前
look-type-description = 説明
look-type-passage-kinds = 最初に示す段落と語句の種類
look-type-exported-as = 書き出し形式
look-type-delete = この文書種別を削除…
