# テキストのエディター：執筆、引用、注のための道具。
# locales/README.md を参照。

## 文字飾りと段落の種類。選択範囲の上のバーと、テキストの上の道具にある。

editor-writing = 執筆
editor-italic = 斜体
editor-bold = 太字
editor-small-capitals = スモールキャピタル
editor-superscript = 上付き
editor-subscript = 下付き
editor-struck = 取り消し線
editor-quotation = 引用文
editor-block-quotation = ブロック引用
editor-list = リスト
editor-text = 本文
editor-text-hint = 普通の段落
editor-quotation-hint = 他人の言葉。本文から離して組む
editor-list-hint = リストの項目。字下げするとリストの中のリストになる
editor-numbered-list = 番号付きリスト
editor-numbered-list-hint = 番号を振るリストの項目。字下げするとリストの中のリストになる
editor-verse = 韻文
editor-verse-hint = 詩、劇、書き起こしの行。一行のまま保つ
editor-speaker = 話者
editor-speaker-hint = 話す人。独立した行に、または行の中の語句として
editor-direction = ト書き
editor-direction-hint = 舞台でなされること。独立した行に、または行の中の語句として
editor-line-numbers-from = 開始番号
editor-line-numbers-every = 番号を表示する間隔
editor-line-numbers-number = 整数を入力してください。
editor-line-number = 番号またはラベル
editor-line-number-placeholder = ほかの行と同じく数える
editor-line-number-held = 数に入っていますが、文書には表示されません。押すと独自の番号を付けられます。
# 範囲の行の番号の振り方：ADR 0041 を参照。
editor-numbering = 番号付け
editor-numbering-none = 番号なし
editor-numbering-counted = 最初に指定した番号から数える
editor-numbering-given = 指定した番号だけ
editor-line-numbers-every-layout = レイアウトどおり：{ $every }行ごと
editor-line-numbers-side = 番号の位置
editor-side-layout = レイアウトどおり（{ $side }）
editor-side-left = 左
editor-side-right = 右
# テキストの余白の番号の上に出る。押すと、その番号の入力欄が開く。
editor-line-number-press = この行の番号：押すと変更できます

## 同じ種類の段落が並んだもの（まとまり）の左にある括弧線。種類の名前が付き、
## そのメニューで、これらの段落について決めることを決める。
# まとまりの行に番号が振られているとき、種類の名前の後に付く：「韻文 · 番号付き」。
editor-bracket-numbered = 番号付き
editor-run-label-hint = { $kind } · 押すと、これらの段落のメニューを開きます
editor-run-select = これらの段落を選択
editor-run-to-text = 本文にする
editor-run-begin = ここから新しいまとまり
editor-run-join = 前のまとまりとつなげる
editor-kinds-text = 本文
editor-kinds-quotation = 引用文
editor-kinds-verse = 韻文
editor-kinds-script = 台本
editor-kinds-list = リスト
editor-kinds-more = その他
editor-kinds-words = 語句
editor-attribution = 出典表示
editor-attribution-hint = 引用文が誰の言葉か
editor-epigraph = エピグラフ
editor-epigraph-hint = 部の冒頭に置く引用
editor-headword = 見出し語
editor-headword-hint = 用語集で説明する語
editor-gloss = 語釈
editor-gloss-hint = 見出し語の意味
editor-code = コード
editor-code-hint = コード、または一字一字そのまま保つものの行
editor-break = 区切り
editor-break-hint = 部分と部分のあいだの間。レイアウトが定める記号で示す
editor-draft = 下書きメモ
editor-draft-hint = 自分用。どの文書にも入りません
editor-foreign = 外国語
editor-foreign-hint = 別の言語の語句。スペルチェックもその言語に従う
editor-title-of-work = 作品名
editor-title-of-work-hint = 書籍、戯曲、絵画などのタイトル
editor-term = 用語
editor-term-hint = 初めて使われる箇所の用語
editor-mention = 言及
editor-mention-hint = 語そのものとして語られる語。引用符で囲む
editor-highlight = ハイライト
editor-highlight-hint = 画面上で目立たせるだけ。どの文書にも入りません
editor-underline = 下線
editor-code-words = 行内コード
editor-scene = シーン見出し
editor-scene-hint = シーンの場所と時：屋内 家 – 夜
editor-action = ト書き（アクション）
editor-action-hint = 見えること、なされること
editor-character = 役名
editor-character-hint = 続く台詞を話す人
editor-dialogue = 台詞
editor-dialogue-hint = 話される言葉
editor-parenthetical = 演技指示
editor-parenthetical-hint = 台詞の言い方
editor-transition = 場面転換
editor-transition-hint = 次のシーンへの移り方：「カット：」
editor-comment = コメント
editor-parallel = 二つのテキストを並べる
editor-page-break = 改ページ
editor-column-break = 段区切り
editor-paragraph-kind = 段落の種類
# カーソルのある段落の種類を示すボタンについて言う。
editor-paragraph-kind-now = 段落の種類：{ $kind }

## 種類のメニュー：カーソルのある所の種類と一緒に書かれる種類、手元の種類、
## 「その他…」の下のすべての種類、そして末尾にそれらを組むレイアウト。
## 語句のメニューと語句の種類。そして独自の種類の、そのダイアログ。

editor-kinds-menu-more = その他…
editor-kinds-mixed = 混在
editor-kinds-own = 独自の種類
editor-kinds-make = 種類を作る…
editor-kinds-change-own = 独自の種類を変更…
# 文書の見た目を、カーソルのある所の種類で開く項目の上に出る。
editor-kinds-set-by = 「{ $format }」の設定どおり
editor-kinds-change-look = 「{ $kind }」の見た目…
editor-words-make = 語句の種類を作る…
# マップの言語の隣、外国語の語句がとりうる言語の最初に出る。
editor-foreign-of-text = テキストの言語
# 語句の種類が、特定の種類を基にしないときに基にするもの。
editor-plain-words = 普通の語句
# 一語から多くの段落までの、ある箇所の言語。それ自体の見た目はもたない。
editor-language = 言語
editor-language-of-text = テキスト自体の言語
editor-language-other = その他の言語…
editor-language-other-title = この箇所の言語
editor-language-tag = 言語タグ
editor-language-no-tag = それは言語タグではありません。タグは「grc」「la」「de-CH」のようなものです。
editor-language-unnamed = システムに名前のない言語です。タグは書かれたとおりに保たれます。
editor-language-suggested = よく引用される言語
editor-language-other-hint = この箇所は、その言語の辞書がインポートされていればその辞書でチェックされ、なければチェックされません。作成する文書は、Word、OpenDocument、Typst、LaTeXにその言語を伝えます。
editor-own-kind-new = 独自の種類
editor-own-kind-change = 種類を変更
editor-own-kind-name = 名前
editor-own-kind-name-placeholder = 書簡、電報、祈り…
editor-own-kind-words-placeholder = 船名、ラテン語、キーワード…
editor-own-kind-name-taken = その名前の種類はすでにあります。
editor-own-kind-based-on = 基にする種類
editor-own-kind-based-on-hint = 以下で指定しないところは、この種類のとおりになります
editor-own-kind-look = 違うところ
editor-own-kind-create = 作成
editor-own-kind-delete-title = 種類「{ $name }」を削除しますか？
editor-own-kind-delete-message = { $count ->
    [0] この種類のテキストはありません。
   *[other] { $count }個の要素にあるこの種類の部分はそのまま残り、文書では本文として組まれます。
}

## 引用、注、そしてテキストに挿入するもの。

editor-cite-here = ここで作品を引用
editor-note = 注
editor-note-selection = 選択範囲を注にする
editor-insert = 挿入
editor-spelling-on = 入力中にスペルチェックしています · 押すと止めます
editor-spelling-off = スペルチェックしていません · 押すとチェックします
editor-equation = 別行立ての数式
editor-table = 表…
editor-table-file = ファイルから表…
editor-formula = 数式
editor-pointer = 相互参照…
editor-refmark-title = 文中番号
editor-refmark-label = ラベル
editor-refmark-placeholder = 3:16、327a、1094a1
editor-refmark-dialog-hint = この番号は語の一部ではありません。スペルチェック、検索、語数の計算では飛ばされます。行の中で上付きにするか、余白に置くかはレイアウトが決めます。
# 名前なしで貼り付けた画像が、画像庫で何と呼ばれるか。
editor-pasted-picture = 画像

## その他。


## 引用する作品を選ぶ。

editor-picker = 文献を選ぶ
editor-picker-placeholder = 引用：著者、タイトル、年
editor-picker-search = 文献を検索
editor-picker-results = 文献
editor-picker-in-project = このプロジェクト内
editor-picker-recent = 最近追加したもの
editor-picker-empty = ライブラリは空です。
editor-picker-no-match = ライブラリにこの語を含むものはありません。
editor-picker-type = 入力してライブラリを検索します。
editor-picker-new = 新しい文献…
editor-picker-import = インポート…

## 引用と、その中の各作品。

editor-citation = 引用
editor-citation-add = 作品を追加
editor-citation-add-purpose = 引用に作品を追加
editor-citation-in-text = 本文中に著者名：Nagy (1979)
editor-citation-remove = 引用を外す
editor-citation-split = 語句を引用から切り離す
editor-citation-split-hint = 前後の語句は行のテキストになり、各作品はページだけを持つ独立した引用になります
editor-citation-not-in-library = この文献はライブラリにありません。
editor-citation-edit-reference = 文献を編集
editor-citation-before = 前置き
editor-citation-before-placeholder = 参照、cf.
editor-citation-after = 後置き
editor-citation-after-placeholder = ほか随所
editor-citation-locator-kind = 参照位置の種類
editor-citation-suppress-author = 著者名は文中に書いてある：年だけを示す
editor-citation-remove-work = この作品を外す
# 引用を置けない所に文献がドロップされ、カーソルもそういう所にないとき。
editor-citation-no-place = そこには引用を置けません
# プロジェクトは引用するすべての文献のコピーを保つ。この文献はライブラリから読めなかった。
editor-reference-not-kept = 文献をプロジェクトに保存できませんでした
# ライブラリにもプロジェクトにもない作品の引用の代わりに、テキストに出る。
editor-citation-missing = ［文献が見つかりません］
# 作品のない引用の代わりに、テキストに出る。
editor-citation-empty = （引用）

## 引用が指せる、作品の中の場所の種類。引用のメニューでの名前。

editor-locator-page = ページ
editor-locator-chapter = 章
editor-locator-section = 節
editor-locator-paragraph = 段落
editor-locator-line = 行
editor-locator-verse = 詩行
editor-locator-book = 巻（書）
editor-locator-volume = 巻
editor-locator-part = 部
editor-locator-column = 段
editor-locator-folio = 葉
editor-locator-figure = 図
editor-locator-note = 注
editor-locator-number = 番号
editor-locator-sub-verbo = 項目（s.v.）

## 注を書くパネルの中の注。

# 番号は注の番号。独自の場所に置かれる注では文字になる。
editor-note-numbered = 注{ $number }
editor-note-place = 注の位置
editor-note-place-format = レイアウトが定める位置
editor-note-place-foot = ページの下
editor-note-place-end = テキストの末尾
editor-note-placeholder = 注の本文

## 側・ペイン・バーの第3段階（エージェント「bars」）
editor-words-kind = 語句の種類
editor-words-kind-now = 語句の種類：{ $kind }
editor-marks = 文字飾り
editor-marks-shown = 編集記号
editor-image = 画像
editor-inline-number = 文中番号…

## 二つの窓での行番号と、注記の側（著者等と行の第2段階）
# 窓の題。それを開く、テキストの右クリックメニューの項目。
editor-numbering-from-here = ここからの行番号
editor-numbering-from-here-item = ここからの行番号…
editor-numbering-of-line = この行の番号
editor-numbering-of-line-item = この行の番号…
# まとまりの括弧線のメニューにある。
editor-run-numbering = 行番号…
# 数える行：すべての種類、または段落の一つの種類。
editor-numbering-only = 数える行
editor-numbering-every-kind = すべての種類
editor-line-counted = 数に入れる
editor-line-shown = 番号の表示
editor-line-shown-others = ほかの行と同じ
editor-line-shown-always = 常に表示
editor-line-shown-never = 表示しない
# 注記が置かれる余白で名付ける。
editor-line-annotation-right = 右余白の注記
editor-line-annotation-left = 左余白の注記
editor-line-annotation-placeholder = 韻律、別の版の番号

## 行の始まる位置と、字下げの段（著者等と行の第4段階）
# テキストの右クリックメニューにあり、カーソルのある行がそうなっている間はチェックが付く。
editor-line-continues = 前の行の終わりから始める
