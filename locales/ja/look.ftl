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
# その下の行。見た目の欄の末尾のレイアウトへ移る。変更の数が後に続く。
look-layout-line = レイアウト：{ $layout }

# 欄の上端のレイアウトの名前の後に：「原稿 · 2件の変更」。
look-changes = { $count ->
   *[other] { $count }件の変更
  }
# 文書がレイアウトと違う設定にしている項目の下に。
look-changed-here = ここで変更
# この要素より上の要素で行った変更。章に対する本のように。
look-changed-in = 「{ $name }」で変更
look-take-again = 「{ $layout }」の設定に戻す

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

look-keep = これらの変更を独自のレイアウトとして保存…
look-keep-save = 保存
# レイアウトが書き手の独自のものであるとき。
look-put-into = これらの変更を「{ $name }」に反映
look-delete-layout = この独自のレイアウトを削除…

## 文書種別の部分。見た目の一部分：プログラムが自分で作る部分と、
## 自分の置き場所を与えられた要素の種類を、印刷される順に一つのリストで示し、
## 要件も示す。ここで変えたものは、文書が何であるかに対する文書自身の
## 変更として保存される。

look-contents-kinds-missing = まだありません
look-contents-kinds-make = 作る
# 文書に一つだけ置く種類の、二つ目の要素に。
look-contents-kinds-doubled = 最初のものだけを使います
look-contents-limit-words = 本文の語数の上限
look-contents-limit-abstract-words = 要旨の語数の上限
look-contents-limit-keywords = キーワードの数の上限
# 上限が何を数えるか。文書種別が言うとおりに。
look-contents-requirements-note = 上限の数え方：{ $note }

# 選ばれても受け継がれてもいないレイアウト、スタイル、テンプレート：設定のものを名前で。
look-usual = 既定（{ $name }）
# レイアウトやスタイルの最初の選択肢：テンプレートがもたらすものを名前で。
look-as-template = テンプレートのとおり（{ $name }）
# この要素より上の要素が選んでいるときの最初の選択肢：その要素と、選んだもの。
look-from-with = 「{ $name }」から（{ $what }）
look-style = 引用スタイル
look-style-change = この引用スタイルを変更…

# タイトルページのスイッチ。最初のページの部分のいちばん初めに。
look-front-title-page = タイトルページ

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
look-section-type-parts = 文書種別の部分
look-section-the-layout = レイアウト
look-choose-layout = レイアウトを選択
look-layout-modifications = レイアウトへの変更
look-at-quotations-warning = 文中の引用
look-at-paragraph-kinds = 段落の種類
look-at-words-kinds = 語句の種類
look-type-requirements = 文書種別の要件

## 設定、ズーム、種類のキー、第4段階：種類のキー。Ctrl+Alt と数字で、文書種別が与えるもの。
look-kind-key = キー
look-kind-key-none = なし
# ほかの種類がもっている数字：ここで選ぶと、その種類はキーをもたなくなる。
look-kind-key-taken = { $keys }（現在は{ $kind }）
