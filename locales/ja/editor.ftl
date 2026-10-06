# The editor of texts: the tools for writing, citations and notes.
# See locales/README.md.

## The marks and the kinds of paragraph, in the bar over a selection and in
## the tools over the text.

editor-format = 書式
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
editor-quotation-hint = 本文から離して組む
editor-list-hint = 各項目の前に記号を付ける
editor-numbered-list = 番号付きリスト
editor-numbered-list-hint = 各項目の前に番号を付ける
editor-verse = 韻文
editor-verse-hint = 詩や劇の行。一行ずつそのまま保つ
editor-speaker = 話者
editor-speaker-hint = 話す人。一行で独立させる
editor-direction = ト書き
editor-direction-hint = 動作の指示。斜体で組む
editor-line-numbers = 行番号
editor-line-numbers-hint = この韻文の行に番号を振る：開始の行と間隔
editor-line-numbers-from = 行番号の開始
editor-line-numbers-none = 番号を振らないときは空欄に
editor-line-numbers-every = 番号を表示する間隔
editor-line-numbers-number = 整数を入力してください。
editor-kinds-text = 本文
editor-kinds-quotation = 引用文
editor-kinds-verse = 韻文
editor-kinds-script = 台本
editor-kinds-more = その他
editor-kinds-words = 語句
editor-attribution = 出典表示
editor-attribution-hint = 誰の言葉か。引用文の下、右寄せ
editor-epigraph = エピグラフ
editor-epigraph-hint = 部の冒頭に置く引用
editor-headword = 見出し語
editor-headword-hint = 用語集で説明する語
editor-gloss = 語釈
editor-gloss-hint = 見出し語の意味
editor-code = コード
editor-code-hint = 一字一字そのまま、等幅の文字で
editor-break = 区切り
editor-break-hint = 部分と部分のあいだの間。書式が定める記号で示す
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
editor-code-words-hint = 行の中で等幅の文字にする
editor-scene = シーン見出し
editor-scene-hint = 屋内　家　夜
editor-action = ト書き（アクション）
editor-action-hint = 見えること、起こること
editor-character = 役名
editor-character-hint = 台詞の上に置く、話す人
editor-dialogue = 台詞
editor-dialogue-hint = 話される言葉
editor-parenthetical = 演技指示
editor-parenthetical-hint = 話し方。括弧で囲む
editor-transition = 場面転換
editor-transition-hint = 「カット：」など。右寄せ
editor-comment = コメント
editor-comment-hint = 選択した箇所へのコメント
editor-comment-element-hint = この要素へのコメント。語句を選択すると、その語句にコメントできます
editor-parallel = 二つのテキストを並べる
editor-parallel-hint = 原文と訳文。それぞれ独立したテキスト
editor-paragraph-kind = 段落の種類
# Said of the button that shows the kind of paragraph the cursor is in.
editor-paragraph-kind-now = 段落の種類：{ $kind }

## The kind menu: the kinds in hand, the whole catalogue under "More…", and
## the format that sets them at its foot. The words menu, with the kinds of
## words. And a kind of the writer's own, in its dialog.

editor-kinds-menu-more = その他…
editor-kinds-in-hand = よく使う種類
editor-kinds-own = 独自の種類
editor-kinds-make = 種類を作る…
editor-kinds-change-own = 独自の種類を変更…
# Over the item that opens the format editor: the format sets how each kind looks.
editor-kinds-set-by = 「{ $format }」の設定どおり
editor-kinds-change-format = 書式を変更…
editor-kinds-change-format-hint = この文書で各種類をどう組むか
editor-words = 語句
editor-words-hint = 下線、上付き、コード、外国語、作品名、用語
editor-words-make = 語句の種類を作る…
# Beside the language of the map, first among the languages foreign words may be in.
editor-foreign-of-map = マップの言語
# What a kind of words is based on when it is based on no kind in particular.
editor-plain-words = 普通の語句
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

## Citing, notes, and what is put into the text.

editor-cite = 引用
editor-cite-here = ここで作品を引用
editor-cite-at-cursor = カーソルの位置で作品を引用
editor-note = 注
editor-note-selection = 選択範囲を注にする
editor-note-hint = 脚注または文末注
editor-insert = 挿入
editor-insert-hint = 画像、表、数式、相互参照
editor-new-element = 新しい要素
editor-new-element-hint = この要素の後、または下に新しい要素を追加
editor-new-after = この要素の後に新しい要素
editor-new-under = この要素の下に新しい要素
editor-new-split = ここで分割
editor-new-split-hint = カーソルより後が新しい要素になります
editor-spelling-on = 入力中にスペルチェックしています · 押すと止めます
editor-spelling-off = スペルチェックしていません · 押すとチェックします
editor-picture-file = ファイルから画像…
editor-picture-file-hint = 説明付きの図
editor-picture-store = 画像庫から画像…
editor-picture-store-hint = 手持ちの画像をサイドに表示します
editor-equation = 別行立ての数式
editor-equation-hint = 独立した行に置く数式
editor-table = 表…
editor-table-hint = 行数と列数を指定して
editor-table-file = ファイルから表…
editor-table-file-hint = CSV、またはLibreOfficeやExcelのシート
editor-formula = 数式
editor-formula-hint = 行内の数式
editor-pointer = 相互参照…
editor-pointer-hint = 図、表、数式、部分を指す：「図2を参照」
# What a picture that was pasted without a name of its own is called in the store of pictures.
editor-pasted-picture = 画像

## More.

editor-found = 見つかった引用…
editor-found-count = 確認して引用にするもの{ $count }件
editor-found-none = このマップで引用らしく見えるテキストも

## Choosing a work to cite.

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

## A citation, and each work in it.

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
# Stands in the text in place of a citation of a work that is in neither the library nor the project.
editor-citation-missing = ［文献が見つかりません］
# Stands in the text in place of a citation of no work.
editor-citation-empty = （引用）

## The kinds of place in a work a citation can point to, as the menu of a
## citation names them.

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

## A note, in the panel it is written in.

# The number is that of the note, or a letter for a note that stands in a place of its own.
editor-note-numbered = 注{ $number }
editor-note-place = 注の位置
editor-note-place-format = 書式が定める位置
editor-note-place-foot = ページの下
editor-note-place-end = テキストの末尾
editor-note-placeholder = 注の本文
