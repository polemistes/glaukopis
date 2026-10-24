# レイアウト（ファイルとコードでは format と呼ぶ）：その種類と、文書の見た目で各種類の見た目を決める行。

## 文書のレイアウトの種類。レイアウトはこれでまとめて示される。

format-kind-own = 独自のレイアウト
format-kind-general = 一般
format-kind-style-guide = スタイルガイド
format-kind-publisher = 出版社
format-kind-journal = 学術誌
format-kind-fiction = 小説
format-kind-stage = 舞台・映像
format-kind-poetry = 詩

## 書き手の独自のレイアウト。文書の変更を保存したもの。

format-name = レイアウトの名前
# 独自のレイアウトに最初に付く名前。もとにしたレイアウトの名前から作る。
format-name-changed = { $name }（変更）
format-saved = 「{ $name }」を独自のレイアウトに保存しました
format-save-failed = レイアウトを保存できませんでした。
format-delete-failed = レイアウトを削除できませんでした。
format-delete-title = レイアウト「{ $name }」を削除しますか？
format-delete-message = このレイアウトを使っている要素は、代わりに一般的な原稿のレイアウトを使います。
format-delete-confirm = レイアウトを削除

## いくつかの部分に出る語。

format-size = サイズ
format-bold = 太字
format-italic = 斜体
format-letters = 大文字・小文字
format-alignment = 揃え
format-line-spacing = 行間
format-as-the-text = 本文と同じ
# サイズが 0 のとき、単位の位置に出る。
format-as-the-text-zero = 本文と同じ
format-align-left = 左
format-align-center = 中央
format-align-right = 右
format-align-justified = 両端揃え
format-align-ragged = 左揃え（右は不揃い）
format-case-none = 書いたとおり
format-case-upper = すべて大文字
format-case-smallcaps = スモールキャピタル
format-spacing-single = 1行
format-spacing-one-and-a-half = 1.5行
format-spacing-double = 2行
format-stands-left = 左
format-stands-center = 中央
format-stands-right = 右

## ページ。

format-page-custom = その他のサイズ
format-page-width = 幅
format-page-height = 高さ
format-margins = 余白
format-margin-top = 上
format-margin-bottom = 下
format-margin-left = 左
format-margin-right = 右
format-columns-heading = 段組み
format-columns = 段数
format-column-gap = 段の間隔
format-lengths-hint = 長さは単位を付けて書きます：2.5cm、1in、25mm、12pt。
## 番号は、それが番号を振るものに属する（ADR 0041）：番号を振った行は、
## その行が別に指定しない限りレイアウトのとおりに表示される。ページの行は
## レイアウトだけが決める。
format-verse-every = 番号を表示する間隔
format-verse-side = 番号の位置
format-side-left = 左
format-side-right = 右
format-numbers-page = ページの行
format-line-numbers = 行番号を振る

## 文字と行間、段落。

format-typeface = フォント
format-hyphenate = 行末で語を分割する
format-indent-first = 見出しの直後も
format-space-between = 段落の間隔
format-italics = 斜体の組み方
format-italics-italic = 斜体で
format-italics-underline = タイプ原稿のように下線で
format-refmarks = 文中番号の組み方
format-refmarks-raised = 行の中に小さく上付きで
format-refmarks-margin = その行の脇の余白に

## 見出し。

format-numbered = 番号を振る
format-level = レベル{ $number }
# 見出しのレベルの概要。番号の横に出る：「14pt、太字、中央」。
format-level-size = { $size }pt
format-level-bold = 太字
format-level-italic = 斜体
format-level-capitals = すべて大文字
format-level-small-caps = スモールキャピタル
format-level-centred = 中央
format-level-right = 右
format-level-run-in = 本文に続ける
format-level-indent = 段落と同じく字下げ
format-level-begins-text = 本文中
format-level-begins-page = 新しいページから
format-level-begins-right-page = 右ページから
format-level-right-page-said = 右ページから
format-level-numbering = 番号付け
format-level-numbering-as-above = 上のレベルと同じ
format-level-numbering-none = なし
format-level-numbering-arabic = 1, 2, 3
format-level-numbering-alpha = A, B, C
format-level-numbering-alpha-lower = a, b, c
format-level-numbering-roman = I, II, III
format-level-numbering-roman-lower = i, ii, iii
# レベルの番号の振り方。見た目の概要の中で：「番号はI, II, III」。
format-level-numbered-as = 番号は{ $style }
format-level-not-numbered = 番号なし
format-level-new-page-said = 新しいページから
format-space-before = 前の間隔
format-space-after = 後の間隔
format-level-add = 深いレベルを追加
format-level-remove = 最も深いレベルを外す

## タイトルと要旨。

format-title-placement = タイトルの位置
format-title-top = 最初のページの上部
format-title-own-page = 独立したページ
format-title-authors = 著者
format-title-affiliations = 所属
format-title-date = 日付
format-title-abstract = 要旨とキーワード
format-title-abstract-label = 要旨の見出し
format-title-keywords-label = キーワードの前の語

## 引用文、注、参考文献。

format-quote-from-words = この語数から
format-quote-from-lines = またはこの行数から
format-notes-kind = 注の位置
format-notes-footnotes = ページの下
format-notes-endnotes = テキストの末尾
format-notes-title = 注の見出し
format-bibliography-title = 見出し
format-bibliography-new-page = 改ページして始める
format-bibliography-hanging-indent = ぶら下げインデント
format-bibliography-entry-spacing = 文献の間隔

## 段落の種類と語句の種類：それぞれが基準にする種類とどこが違うか。
## 独自の種類を作るダイアログの行も同じ。言われていないところは
## 基準のとおり。

format-kind-based-on = { $base }を基準にする
# 種類「本文」について。これは文字と段落の部分が決める。
format-kind-text-note = レイアウトの文字と段落の設定のとおり
# このレイアウトがその種類について何も言わないとき、種類の行の右に出る。
format-kind-as-base = 基準と同じ
format-kind-resolved = 仕上がり：{ $look }
format-kind-resolved-nothing = 仕上がり：周りの本文と同じ
format-kind-resolved-failed = 仕上がりを求められませんでした：{ $reason }
format-as-the-base = 基準と同じ
# 「基準と同じ」に、基準が実際にどうなるかを添えたもの：「基準と同じ（はい）」「基準と同じ（11pt）」。
format-as-the-base-is = 基準と同じ（{ $value }）
# サイズの欄が空のとき、数の位置に出る。
format-as-the-base-blank = 基準と同じ
format-yes = はい
format-no = いいえ
format-underline = 下線
format-equal-width = 等幅の文字
format-equal-width-hint = コードのように
format-indent-left = 左の字下げ
format-indent-right = 右の字下げ
format-first-line = 1行目
format-first-line-hint = ほかの行よりどれだけ下げて始めるか
format-keep-with-next = 次の段落と離さない
format-keep-with-next-hint = ページの下端に単独で残さない
format-new-page = 改ページして始める
format-break-text = 区切りに置くもの
format-break-text-hint = 指定がなければ * * *、原稿では #
# 種類の行に、その見た目を短く示す：「10pt、斜体、中央」。
format-look-not-bold = 太字なし
format-look-not-italic = 斜体なし
format-look-underlined = 下線
format-look-not-underlined = 下線なし
format-look-as-written = 書いたとおり
format-look-left = 左
format-look-justified = 両端揃え
format-look-indent-left = 左に{ $length }字下げ
format-look-indent-right = 右に{ $length }字下げ
format-look-first-line = 1行目{ $length }
format-look-space-before = 前に{ $length }
format-look-space-after = 後に{ $length }
format-look-line-spacing = 行間{ $spacing }
format-look-equal-width = 等幅の文字
format-look-not-equal-width = 等幅でない文字
format-look-kept = 次の段落と離さない
format-look-not-kept = 次の段落と離してよい
format-look-no-new-page = 改ページなし
format-look-text = 区切りに「{ $text }」

## 図と表。同じように扱う。kind は figure か table：英語で両方に同じ語を
## 使うところでも、ほかの言語ではそうとは限らない（図のキャプションと
## 表のキャプションは名前が違うことがある）。

format-figures = 図
format-tables = 表
format-captioned-called = { $kind ->
    [figure] 図の呼び名
   *[table] 表の呼び名
}
format-captioned-reference = テキストから指すときの語
format-captioned-label-bold = 語と番号を太字に
format-captioned-label-italic = 語と番号を斜体に
format-captioned-between = { $kind ->
    [figure] 番号とキャプションのあいだ
   *[table] 番号とキャプションのあいだ
}
# 番号とキャプションのあいだに置くもの。called は語と番号（「図1」）。
format-between-stop = { $kind ->
    [figure] ピリオド（{ $called }. キャプション）
   *[table] ピリオド（{ $called }. キャプション）
}
format-between-colon = { $kind ->
    [figure] コロン（{ $called }: キャプション）
   *[table] コロン（{ $called }: キャプション）
}
format-between-line = { $kind ->
    [figure] キャプションを別の行に
   *[table] キャプションを別の行に
}
format-between-other = その他…
format-captioned-separator = あいだに置くもの
format-captioned-own-line = { $kind ->
    [figure] 続けてキャプションを別の行に
   *[table] 続けてキャプションを別の行に
}
format-caption = { $kind ->
    [figure] キャプション
   *[table] キャプション
}
format-caption-stands = { $kind ->
    [figure] キャプションの位置
   *[table] キャプションの位置
}
format-caption-below = { $kind ->
    [figure] 画像の下
   *[table] 表の下
}
format-caption-above = { $kind ->
    [figure] 画像の上
   *[table] 表の上
}
format-captioned-where = { $kind ->
    [figure] 図の位置
   *[table] 表の位置
}
format-captioned-stand = { $kind ->
    [figure] 図の配置
   *[table] 表の配置
}
format-captioned-wrap = 周りにテキストを回り込ませる
format-captioned-placement = 文書での置き場所
format-captioned-in-text = 本文中
format-captioned-at-end = 末尾にまとめる
format-captioned-end-title = { $kind ->
    [figure] 図の上の見出し
   *[table] 表の上の見出し
}
# 末尾にまとめた図や表が本来あるべきところに、テキストに残すもの。
format-captioned-placeholder = テキストに残す行
format-captioned-placeholder-missing = 語と番号の入る{"{}"}を含めてください
format-table-rules = 罫線
format-table-rules-horizontal = 上、下、見出しの下
format-table-rules-grid = すべてのセルの周り
format-table-rules-none = なし
format-table-header-bold = 見出しを太字に
format-equations = 別行立ての数式
format-equations-stand = 数式の位置
format-equations-before = 番号の前
format-equations-after = 番号の後

## ページ番号と柱。

format-page-numbers = ページ番号
format-page-numbers-show = ページ番号を振る
format-page-numbering = 番号の書き方
format-number-arabic = 1, 2, 3
format-number-roman = I, II, III
format-number-roman-lower = i, ii, iii
format-number-letters = A, B, C
format-number-letters-lower = a, b, c
format-page-restart = ここからページ番号を振り直す
format-margin-header = ヘッダー
format-margin-footer = フッター
format-margin-shown = 表示する
format-margin-first-page = 最初のページにも
format-margin-openers = 章や部の始まるページにも
format-margin-alternate = 左右のページで変える
format-margin-right-pages = 右ページ
format-margin-left-pages = 左ページ
format-margin-place-left = 左
format-margin-place-center = 中央
format-margin-place-right = 右
format-margin-add = 追加…
# ヘッダーやフッターの位置に置いた項目について。
format-margin-remove = 「{ $item }」を外す
format-margin-separator = 項目のあいだ
format-margin-text-placeholder = 文言を入力
format-item-page-number = ページ番号
format-item-title = タイトル
format-item-author = 著者
format-item-chapter = 章
format-item-date = 日付
format-item-text = 独自の文言

## レイアウトについて：その要件の出典。

format-description = 説明
format-source = 要件の出典
# 出典を参照した日付。
format-source-read = { $date }に参照。
format-source-high = 値は出典どおりです。
format-source-medium = 出典は一部しか、または以前の版しか参照できませんでした。大事なところは確認してください。
format-source-low = ほとんど確認できませんでした。値は出発点として扱ってください。

## 言葉を減らす、第3段階：見た目の行をわかりやすい言葉で。

format-level-begins-paragraph = 段落の冒頭に置く
format-level-placement = 配置
format-title-include = 含めるもの
format-title-formatting = 体裁
format-title-anonymize = 最初のページを匿名にする
format-table-inside = 表の中

## 言葉を減らす、第4段階：段落の二つの長さと、長い引用の警告。

format-indent-first-line = 1行目の字下げ
format-quote-warn = 長い文中の引用を警告する

## 著者等、第3段階：最初のページの編者と訳者の行、およびその項目。

format-title-roles = 編者と訳者
format-item-editor = 編者
format-item-translator = 訳者

## 行番号、第2段階：行の注記の位置。
format-verse-annotations = 注記の位置
format-verse-annotations-other = 番号と反対側

## 行の始まる位置、第4段階：字下げ1段の幅。
format-indent-step = 字下げ1段の幅
