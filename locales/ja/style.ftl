# 引用スタイル：その種類、さらにスタイルを探す画面、スタイルエディター、
# そしてエディターがスタイルの部分を言い表す語。

## 引用スタイルの種類。スタイルはこれでまとめられる。

style-kind-note = 注方式
style-kind-author-date = 著者年方式
style-kind-numeric = 番号方式
style-kind-label = ラベル方式
style-kind-author = 著者方式
style-kind-other = その他

## 学術誌や出版社の引用スタイルを探す画面。

style-browser = 引用スタイル
style-browser-subtitle = 学術誌や出版社のスタイル一万種以上を、名前で探せます
style-browser-placeholder = 学術誌、出版社、またはスタイルの名前
style-browser-search = スタイルを検索
# すでに取得したスタイルの横に出る。
style-browser-here = 取得済み
style-browser-fetch = 取得
style-browser-none-found = 名前にこの語を含むスタイルはありません。
style-browser-about = スタイルはCitation Style Languageプロジェクトのリポジトリから取得し、独自のスタイルと一緒に保管します。手元のスタイルは、スタイルエディターで出版社の要望に合わせて変えられます。
style-browser-import = ファイルをインポート…
style-browser-import-title = 引用スタイルをインポート
style-browser-fetch-failed = スタイルを取得できませんでした。
style-browser-file-unread = ファイルを読み込めませんでした。

## スタイルエディター。

style-editor = 引用スタイル
style-name = スタイルの名前
# 独自のスタイルに最初に付く名前。もとにしたスタイルの名前から作る。
style-name-changed = { $name }（変更版）
style-depth = どこまで変えるか
style-depth-options = よくある変更
style-depth-parts = 部分ごと
style-depth-source = ソース
style-scope = 変える対象
style-scope-citations = 引用
style-scope-notes = 注
style-scope-bibliography = 参考文献
style-bundled = Glaukopisに付属するスタイルはそのまま残ります。変更は独自のスタイルとして保存されます。
style-delete = このスタイルを削除
style-save-own = 独自のスタイルとして保存
style-saved = 「{ $name }」を独自のスタイルに保存しました
style-read-failed = スタイルを読み込めませんでした。
style-save-failed = スタイルを保存できませんでした。
style-delete-failed = スタイルを削除できませんでした。
style-delete-title = スタイル「{ $name }」を削除しますか？
style-delete-message = このスタイルを使っているマップは、代わりに別のスタイルを使います。
style-delete-confirm = スタイルを削除
style-leave-title = 保存せずに閉じますか？
style-leave-message = スタイルに加えた変更は失われます。
style-leave-confirm = 閉じる
style-leave-cancel = 編集を続ける

## よくある変更：名前。

style-names = 名前
# 数を書き込む欄が二つある文：「et al.」を使い始める著者の数と、
# その前に何人を挙げるか。
style-et-al = 著者が{ $min }人以上なら、最初の{ $first }人と「et al.」を記す
style-et-al-min = et al.を使い始める著者の数
style-et-al-first = et al.の前に挙げる著者の数
style-et-al-empty = 空欄なら全員を挙げます
# 前のものと同じ。以前に引用した文献について。
style-et-al-again = 再び引用するときは、{ $min }人以上なら最初の{ $first }人を記す
style-et-al-again-min = 後の引用でet al.を使い始める著者の数
style-et-al-again-first = 後の引用で挙げる著者の数
style-et-al-again-empty = 空欄なら初回と同じ
style-before-last-name = 最後の名前の前
# スタイルがそこに印刷する語。文書の言語で。
style-and-word = 語（and、と など）
style-and-nothing = なし
style-as-the-style-has-it = スタイルのとおり
style-comma-before-last = その前のコンマ
style-comma-contextual = 名前が三つ以上のとき：A, B, and C
style-comma-always = 常に：A, and B
style-comma-never = 付けない：A, B and C
style-comma-after-inverted = 姓を先にした名前の後
style-given-names = 名（ファーストネーム）
style-given-full = 省略しない：John Miles
style-given-spaced = イニシャル：J. M.
style-given-close = イニシャル、詰める：J.M.
style-given-bare = ピリオドなしのイニシャル：JM
style-given-bare-spaced = ピリオドなしのイニシャル：J M
style-family-first = 姓を先に
style-family-first-none = しない：John Foley
style-family-first-first = 最初の著者だけ：Foley, John, and Robert Fowler
style-family-first-all = 全員：Foley, John, and Fowler, Robert
style-sort-separator = 姓と名の間
style-sort-separator-hint = 姓が先に来るとき

## よくある変更：引用または注、そして参考文献の項目。

style-the-citation = 引用
style-the-note = 注
style-begins-with = 始まり
style-ends-with = 終わり
style-between-works = 一緒に引用する文献の間
style-collapse = 同じ著者の文献を一緒に引用するとき
style-collapse-none = それぞれ省略せずに
style-collapse-year = 名前を一度だけ：Nagy 1979, 1996
style-collapse-year-suffix = 年も一度だけ：Nagy 1979a, b
style-collapse-year-suffix-ranged = 範囲にする：Nagy 1979a–c
style-collapse-citation-number = 番号を範囲にする：[1–3]
style-disambiguate = 二つの文献が同じ形で引用されるとき
style-disambiguate-year-suffix = 年に文字を付ける
style-disambiguate-names = 著者をさらに挙げる
style-disambiguate-given-names = 名またはイニシャルを加える
style-near-note = 近くの注とみなす範囲
style-near-note-hint = 注の数。近くで引用したものを短くするスタイル用
style-entries = 項目
style-entry-ends-with = 各項目の終わり
style-author-repeated = 同じ著者が続くとき
style-author-repeated-hint = 2番目以降の項目で、名前の代わりに
style-hanging-indent = ぶら下げインデント
style-hanging-indent-hint = 深さはレイアウトが決めます
style-second-field = 番号やラベルの位置
style-second-field-line = 行の中
style-second-field-column = 独立した列
style-second-field-margin = 余白
style-second-field-hint = 項目に番号を振るスタイル用

## よくある変更：スタイル全体。

style-throughout = スタイル全体
style-page-ranges = ページの範囲
style-page-ranges-as-entered = 入力どおり
style-page-ranges-expanded = 省略しない：321–328
style-page-ranges-minimal = 最短：321–8
style-page-ranges-minimal-two = 少なくとも2桁：321–28
style-page-ranges-chicago = Chicago Manualのとおり
style-particles = 姓の前の「van」「de」「von」
style-particles-never = 姓に付けたまま、v、dの位置に並べる
style-particles-sort-only = 姓に付けたまま、並べ替えには使わない
style-particles-display-and-sort = 名の後に置く：Gogh, Vincent van
style-hyphen = イニシャルの間のハイフン
style-hyphen-hint = J.P. SartreではなくJ.-P. Sartre
style-locale = スタイルの語の言語
style-locale-document = 文書の言語
style-locale-hint = 「ed.」「in」「accessed」、月の名前

## 部分ごと。

# scope は citation（引用）か bibliography（参考文献）。
style-parts-of = { $scope ->
    [citation] 引用の部分
   *[bibliography] 参考文献の部分
}
style-parts-none = { $scope ->
    [citation] このスタイルには引用がありません。
   *[bibliography] このスタイルには参考文献がありません。
}
style-parts-hint = 左で部分を選ぶと、その印刷のされ方を変えられます。前後に何を置くか、字体、大文字の使い方などです。部分を開くと、何からできているかがわかります。
style-part-unfold = 開く
style-part-fold = 閉じる
style-part-up = 上へ移動
style-part-down = 下へ移動
style-part-add-after = 後に追加
style-part-take-away = 取り除く
style-part-add-within = 中に追加
# マクロの一部：スタイルの中で、いくつかの場所で使われる部分。
style-part-shared = これは「{ $macro }」の一部で、{ $count }か所で使われています。ここでの変更は、そのすべてに表れます。
style-add-words = 独自の語句
style-add-words-hint = 「in」「accessed」、句読点など
# 部分が印刷できる、文献のフィールドの上に出る。
style-add-from-reference = 文献から
style-part-words = 語句
style-part-before = 前に置くもの
style-part-before-hint = その部分自体が印刷されるときだけ印刷されます
style-part-after = 後に置くもの
style-part-between = 中の部分の間
style-slant = 傾き
style-slant-upright = 標準
style-slant-italic = 斜体
style-weight = 太さ
style-weight-regular = 標準
style-weight-bold = 太字
style-letters = 文字
style-letters-as-written = 書かれたとおり
style-letters-small-caps = スモールキャピタル
style-case = 大文字・小文字
style-case-as-entered = 入力どおり
style-case-title = タイトルケース（Title Case）
style-case-sentence = センテンスケース（Sentence case）
style-case-capitalize-first = 最初の文字を大文字に
style-case-capitalize-all = 各語の最初を大文字に（Every Word）
style-case-uppercase = すべて大文字（CAPITALS）
style-case-lowercase = すべて小文字（small letters）
style-height = 高さ
style-height-baseline = 行の上
style-height-raised = 上付き
style-height-lowered = 下付き
style-quotes = 引用符で囲む
style-strip-periods = ピリオドを取る
style-strip-periods-hint = 略語用：「ed.」を「ed」に
style-text-form = 形
style-text-form-long = 省略しない
style-text-form-short = 短い形（文献にあれば）
style-term-form = 語の形
style-term-form-long = 省略しない：editor、page
style-term-form-short = 略語：ed.、p.
style-term-form-verb = 動詞形：edited by
style-term-form-verb-short = 動詞形の略語：ed. by
style-term-form-symbol = 記号：§
style-date-parts = 日付の示し方
style-date-parts-year = 年だけ
style-date-parts-year-month = 年と月
style-date-parts-full = 省略しない

## スタイルのソースと、試しに使う見本。

style-source = スタイルのソース
style-source-try = 試す
style-source-unread = ソースを読み込めませんでした。
style-sample-unusable = このスタイルはこのままでは使えません
style-sample-failed = スタイルを試せませんでした。
style-sample-in-text = 本文中
style-sample-in-notes = 注の中
style-sample-in-bibliography = 参考文献
style-sample-cited = 引用した文献
style-sample-same-page = 同じ文献、ページを指定
style-sample-another = 別の文献、前に語を付けて
style-sample-first-again = 最初の文献をもう一度、章を指定
style-sample-together = 二つの文献を一緒に
style-sample-in-sentence = 著者名を文中に出して
style-sample-examples = 例で示しています。ライブラリが空です。
style-sample-library = ライブラリの文献で示しています。

## スタイルのソースが、スタイルとして読めないとき。

style-source-not-xml = ソースが正しい形のXMLではありません。
style-source-not-style = これはスタイルではありません。<style>で始まっていません。
style-source-dependent = このスタイルには<citation>がありません。別のスタイルの名を挙げているだけなので、変えられません。

## スタイルの部分。スタイルエディターが言葉で言い表すとおり。

style-part-layout = 全体
style-part-text = テキスト
# スタイルの言語の語を印刷する部分。term は CSL でのその語の名前。
style-part-term = 「{ $term }」を表す語
# スタイルに書き込まれた語句を印刷する部分。
style-part-value = 語句「{ $value }」
style-part-name = 名前の書き方
# name は CSL のとおり family（姓）か given（名）。
style-part-name-part = { $name ->
    [family] 姓
    [given] 名
   *[other] 名前の{ $name }
}
style-part-et-al = 「et al.」
# variables は下の語の一つ以上：「ページ」。
style-part-label = { $variables }の前の語（「p.」「版」）
style-part-role = 役割を表す語（「編」「訳」）
style-part-substitute = その名前がないとき、代わりに
# name は CSL のとおり day、month、year、または part。
style-part-date-part = { $name ->
    [day] 日
    [month] 月
    [year] 年
   *[other] { $name }
}
style-part-group = ひとまとめ
style-part-choose = 次のいずれか
# condition は下の語からできている。
style-part-if = { $condition }場合
style-part-else-if = そうでなく、{ $condition }場合
style-part-else = それ以外の場合
# スタイルがもつ名前。スタイルの部分（マクロ）の名前か、知らない変数の名前。
style-quoted = 「{ $text }」

## ほかの語をつなぐ語：「著者、なければ編者」「書籍または章」。
## 一つ目は、コンマでつないだいくつかの語のこともある。日本語では、名詞にも
## 条件の文にもつながる「または」「かつ」を使う。

style-or = { $first }または{ $last }
style-and = { $first }かつ{ $last }
style-or-else = { $first }、なければ{ $last }

## スタイルの部分が印刷される条件：「文献が書籍である場合」。
## どれも style-part-if の「場合」の前に来るので、文の終わりの形にする。

style-if-type = 文献が{ $types }である
style-if-has = { $variables }がある
style-if-lacks = { $variables }がない
style-if-numeric = { $variables }が数値である
style-if-uncertain = { $variables }が不確かである
# 場所とは、ページ、章、詩行などのこと。style-locator を見よ。
style-if-locator = 参照位置が{ $locators }である
style-if-disambiguate = そうしないと別の文献と取り違えられる
style-if-always = 常に当てはまる
style-if-none-holds = 「{ $conditions }」のいずれにも当たらない
# 引用が指す場所の種類。CSL の名前で：page、chapter、verse、sub-verbo など。
# 英語は名前をそのまま残すが、日本語では訳す。
style-locator = { $name ->
    [act] 幕
    [appendix] 付録
    [article-locator] 条
    [book] 書
    [canon] カノン
    [chapter] 章
    [column] 段
    [elocation] 電子的な位置
    [equation] 式
    [figure] 図
    [folio] 丁
    [issue] 号
    [line] 行
    [note] 注
    [opus] 作品番号
    [page] ページ
    [paragraph] 段落
    [part] 部
    [rule] 規則
    [scene] 場
    [section] 節
    [sub-verbo] 見出し語
    [supplement] 補遺
    [table] 表
    [timestamp] 時刻
    [title-locator] タイトル
    [verse] 詩行
    [volume] 巻
   *[other] { $name }
}

## 引用が印刷される条件。ほかの引用の中のどこにあるかによる。

style-position-first = 初めて引用される
style-position-subsequent = 以前に引用されている
style-position-ibid = 直前の引用と同じである
style-position-ibid-with-locator = 直前の引用と同じで、参照位置が異なる
style-position-near-note = 近くの注で引用されている

## 部分の組み方：「斜体, 引用符で囲む, 「, 」の前」。

style-form-italic = 斜体
style-form-bold = 太字
style-form-small-caps = スモールキャピタル
style-form-underlined = 下線
style-form-quoted = 引用符で囲む
# 文字の大小。CSL の名前で。words はその名前のダッシュを空白にしたもの。
style-form-case = { $case ->
    [lowercase] すべて小文字
    [uppercase] すべて大文字
    [capitalize-first] 最初の文字を大文字
    [capitalize-all] 各語の最初を大文字
    [sentence] センテンスケース
    [title] タイトルケース
   *[other] { $words }
}
style-form-raised = 上付き
style-form-lowered = 下付き
# 部分はこの語句の後に来る。
style-form-after = 「{ $text }」の後
# 部分はこの語句の前に来る。
style-form-before = 「{ $text }」の前
style-form-between = 間に「{ $text }」

## 文献が属する作品の種類。CSL の名前で。

style-type-book = 書籍
style-type-chapter = 書籍の章
style-type-article-journal = 学術誌の論文
style-type-article-magazine = 雑誌の記事
style-type-article-newspaper = 新聞記事
style-type-article = 論文・記事
style-type-thesis = 学位論文
style-type-report = 報告書
style-type-webpage = ウェブページ
style-type-paper-conference = 会議論文
style-type-entry-encyclopedia = 百科事典の項目
style-type-entry-dictionary = 辞書の項目
style-type-entry = 項目
style-type-review = 批評
style-type-review-book = 書評
style-type-manuscript = 手稿
style-type-personal_communication = 書簡などの私信
style-type-legal_case = 判決
style-type-legislation = 法令
style-type-bill = 法案
style-type-patent = 特許
style-type-dataset = データセット
style-type-software = ソフトウェア
style-type-motion_picture = 映画
style-type-broadcast = 放送
style-type-song = 録音
style-type-speech = 講演
style-type-interview = インタビュー
style-type-graphic = 画像
style-type-map = 地図
style-type-pamphlet = パンフレット
style-type-post-weblog = ブログ記事
style-type-post = 投稿
style-type-classic = 古典
style-type-collection = コレクション
style-type-document = 文書
style-type-standard = 規格
style-type-treaty = 条約
style-type-periodical = 定期刊行物
style-type-musical_score = 楽譜
style-type-figure = 図
style-type-event = イベント
style-type-performance = 上演
style-type-regulation = 規則
style-type-hearing = 公聴会

## 文献がもつもの。CSL の名前で。冠詞付きの形と、冠詞なしの形（.bare）。
## .bare は文献のフィールドとして名指すときの形。日本語では二つは同じ。

style-variable-title = タイトル
    .bare = タイトル
style-variable-title-short = 短縮タイトル
    .bare = 短縮タイトル
style-variable-container-title = 雑誌名または書籍のタイトル
    .bare = 雑誌名または書籍のタイトル
style-variable-container-title-short = 雑誌名の略記
    .bare = 雑誌名の略記
style-variable-collection-title = シリーズ
    .bare = シリーズ
style-variable-collection-number = シリーズ内の番号
    .bare = シリーズ内の番号
style-variable-original-title = 原題
    .bare = 原題
style-variable-reviewed-title = 書評対象の作品のタイトル
    .bare = 書評対象の作品のタイトル
style-variable-author = 著者
    .bare = 著者
style-variable-editor = 編者
    .bare = 編者
style-variable-translator = 訳者
    .bare = 訳者
style-variable-container-author = 書籍の著者
    .bare = 書籍の著者
style-variable-collection-editor = シリーズの編者
    .bare = シリーズの編者
style-variable-editorial-director = 編集責任者
    .bare = 編集責任者
style-variable-original-author = 原著者
    .bare = 原著者
style-variable-reviewed-author = 書評対象の作品の著者
    .bare = 書評対象の作品の著者
style-variable-interviewer = インタビュアー
    .bare = インタビュアー
style-variable-recipient = 受取人
    .bare = 受取人
style-variable-director = 監督
    .bare = 監督
style-variable-composer = 作曲者
    .bare = 作曲者
style-variable-illustrator = 挿絵画家
    .bare = 挿絵画家
style-variable-issued = 日付
    .bare = 日付
style-variable-accessed = 閲覧日
    .bare = 閲覧日
style-variable-original-date = 原著の日付
    .bare = 原著の日付
style-variable-event-date = イベントの日付
    .bare = イベントの日付
style-variable-submitted = 投稿日
    .bare = 投稿日
style-variable-volume = 巻
    .bare = 巻
style-variable-number-of-volumes = 巻数
    .bare = 巻数
style-variable-issue = 号
    .bare = 号
style-variable-edition = 版
    .bare = 版
style-variable-page = ページ
    .bare = ページ
style-variable-page-first = 最初のページ
    .bare = 最初のページ
style-variable-number-of-pages = 総ページ数
    .bare = 総ページ数
style-variable-number = 番号
    .bare = 番号
style-variable-chapter = 章
    .bare = 章
style-variable-chapter-number = 章の番号
    .bare = 章の番号
style-variable-publisher = 出版社
    .bare = 出版社
style-variable-publisher-place = 出版地
    .bare = 出版地
style-variable-original-publisher = 原著の出版社
    .bare = 原著の出版社
style-variable-original-publisher-place = 原著の出版地
    .bare = 原著の出版地
style-variable-locator = 参照位置
    .bare = 参照位置
style-variable-citation-number = 引用番号
    .bare = 引用番号
style-variable-citation-label = 引用ラベル
    .bare = 引用ラベル
style-variable-year-suffix = 年の後の文字
    .bare = 年の後の文字
style-variable-first-reference-note-number = 最初に引用した注の番号
    .bare = 最初に引用した注の番号
style-variable-DOI = DOI
    .bare = DOI
style-variable-URL = アドレス
    .bare = アドレス
style-variable-ISBN = ISBN
    .bare = ISBN
style-variable-ISSN = ISSN
    .bare = ISSN
style-variable-PMID = PMID
    .bare = PMID
style-variable-genre = 作品の種類
    .bare = 作品の種類
style-variable-medium = 媒体
    .bare = 媒体
style-variable-note = 注記
    .bare = 注記
style-variable-annote = 注解
    .bare = 注解
style-variable-abstract = 要旨
    .bare = 要旨
style-variable-archive = 文書館
    .bare = 文書館
style-variable-archive_location = 文書館内の所在
    .bare = 文書館内の所在
style-variable-archive-place = 文書館の所在地
    .bare = 文書館の所在地
style-variable-authority = 発行機関・裁判所
    .bare = 発行機関・裁判所
style-variable-call-number = 請求記号
    .bare = 請求記号
style-variable-event = イベント
    .bare = イベント
style-variable-event-place = イベントの開催地
    .bare = イベントの開催地
style-variable-event-title = イベント名
    .bare = イベント名
style-variable-section = 節
    .bare = 節
style-variable-source = 情報源
    .bare = 情報源
style-variable-status = 出版の状況
    .bare = 出版の状況
style-variable-version = バージョン
    .bare = バージョン
style-variable-language = 言語
    .bare = 言語
style-variable-dimensions = 寸法
    .bare = 寸法
style-variable-scale = 縮尺
    .bare = 縮尺
style-variable-references = 関連資料
    .bare = 関連資料
style-variable-keyword = キーワード
    .bare = キーワード
style-variable-jurisdiction = 管轄
    .bare = 管轄
