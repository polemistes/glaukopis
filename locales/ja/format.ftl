# Document formats: their kinds, and the editor of a format.

## The kinds of document format, as the formats are grouped by them.

format-kind-own = 独自の書式
format-kind-general = 一般
format-kind-style-guide = スタイルガイド
format-kind-publisher = 出版社
format-kind-journal = 学術誌
format-kind-fiction = 小説
format-kind-stage = 舞台・映像
format-kind-poetry = 詩

## The format editor.

format-name = 書式の名前
# The name a format of one's own is first given, made from that of the format it is made from.
format-name-changed = { $name }（変更）
format-saved = 「{ $name }」を独自の書式に保存しました
format-save-failed = 書式を保存できませんでした。
format-delete-failed = 書式を削除できませんでした。
format-delete-title = 書式「{ $name }」を削除しますか？
format-delete-message = この書式を使っているマップは、代わりに一般的な原稿の書式を使います。
format-delete-confirm = 書式を削除

## The parts of a format, as they are chosen at the left.

## Words that stand in several parts.

format-size = サイズ
format-bold = 太字
format-italic = 斜体
format-letters = 文字
format-alignment = 揃え
format-line-spacing = 行間
format-as-the-text = 本文と同じ
# Beside a size of 0, in the place of its unit.
format-as-the-text-zero = 本文と同じ
format-align-left = 左
format-align-center = 中央
format-align-right = 右
format-align-justified = 両端揃え
format-align-ragged = 左揃え（右は不揃い）
format-case-none = 書いたとおり
format-case-upper = 大文字
format-case-smallcaps = スモールキャピタル
format-spacing-single = 1行
format-spacing-one-and-a-half = 1.5行
format-spacing-double = 2行
format-stands-left = 左
format-stands-center = 中央
format-stands-right = 右

## The page.

format-page-custom = その他のサイズ
format-page-width = 幅
format-page-height = 高さ
format-margins = 余白
format-margin-top = 上
format-margin-bottom = 下
format-margin-left = 左
format-margin-right = 右
format-lengths-hint = 長さは単位を付けて書きます：2.5cm、1in、25mm、12pt。
format-line-numbers = 行番号を振る

## Type and spacing, and paragraphs.

format-typeface = 書体
format-hyphenate = 行末で語を分割する
format-indent-first = 見出しの直後も
format-space-between = 段落間のスペース
format-italics = 斜体の組み方
format-italics-italic = 斜体で
format-italics-underline = タイプ原稿のように下線で

## Headings.

format-numbered = 番号を振る
format-level = レベル{ $number }
# What a level of headings is, in short, beside its number: "14 pt, bold, centred".
format-level-size = { $size } pt
format-level-bold = 太字
format-level-italic = 斜体
format-level-capitals = 大文字
format-level-small-caps = スモールキャピタル
format-level-centred = 中央
format-level-right = 右
format-level-run-in = 本文に続ける
format-level-indent = 段落と同じく字下げ
format-level-new-page-said = 改ページ
format-space-before = 前のスペース
format-space-after = 後のスペース
format-level-add = 深いレベルを追加
format-level-remove = 最も深いレベルを外す

## The title and the abstract.

format-title-placement = タイトルの位置
format-title-top = 最初のページの上部
format-title-own-page = 独立したページ
format-title-authors = 著者
format-title-affiliations = 所属
format-title-date = 日付
format-title-abstract = 要旨とキーワード
format-title-abstract-label = 要旨の見出し
format-title-keywords-label = キーワードの前の語

## Quotations, notes and the bibliography.

format-quote-from-words = この語数から
format-quote-from-lines = またはこの行数から
format-notes-kind = 注の位置
format-notes-footnotes = ページの下
format-notes-endnotes = テキストの末尾
format-notes-title = 注の見出し
format-bibliography-title = 見出し
format-bibliography-new-page = 改ページして始める
format-bibliography-hanging-indent = ぶら下げインデント
format-bibliography-entry-spacing = 項目間のスペース

## The kinds of paragraph and of words: how each differs from the kind it
## is based on. The rows are those of the dialog for a kind of one's own
## too; what is not said is as the base has it.

format-kind-based-on = { $base }が基
format-as-the-base = 基と同じ
# In an empty field for a size, in the place of its number.
format-as-the-base-blank = 基と同じ
format-yes = はい
format-no = いいえ
format-underline = 下線
format-equal-width = 等幅の文字
format-equal-width-hint = コードのように
format-indent-left = 左の字下げ
format-indent-right = 右の字下げ
format-first-line = 一行目
format-first-line-hint = 他の行よりどれだけ下げて始めるか
format-keep-with-next = 次の段落と離さない
format-keep-with-next-hint = ページの下に一つだけ取り残さない
format-new-page = 改ページする
format-break-text = 区切りに置くもの
format-break-text-hint = 指定がなければ * * *、原稿では #
# What a look says, in short, on the line of its kind: "10 pt, italic, centred".
format-look-not-bold = 太字なし
format-look-not-italic = 斜体なし
format-look-underlined = 下線
format-look-not-underlined = 下線なし
format-look-as-written = 書いたとおり
format-look-left = 左
format-look-justified = 両端揃え
format-look-indent-left = 左に{ $length }字下げ
format-look-indent-right = 右に{ $length }字下げ
format-look-first-line = 一行目{ $length }
format-look-space-before = 前に{ $length }
format-look-space-after = 後に{ $length }
format-look-line-spacing = 行間{ $spacing }
format-look-equal-width = 等幅の文字
format-look-not-equal-width = 等幅でない文字
format-look-kept = 次の段落と離さない
format-look-not-kept = 次の段落と離してよい
format-look-no-new-page = 改ページなし
format-look-text = 区切りに「{ $text }」

## Figures and tables, which are told alike. The kind is figure or table: where
## English has the same words for both, another language may not (the caption
## of a figure and of a table can have different names).

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
# What stands between the number and the caption; called is the word and number, "Figure 1".
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
format-captioned-in-text = テキスト内
format-captioned-at-end = 末尾にまとめる
format-captioned-end-title = { $kind ->
    [figure] 図の上の見出し
   *[table] 表の上の見出し
}
# What is left in the text where a figure or table gathered at the end belongs.
format-captioned-placeholder = テキストに残す行
format-captioned-placeholder-missing = 語と番号の入る{"{}"}を含めてください
format-table-rules = 罫線
format-table-rules-horizontal = 上、下、見出しの下
format-table-rules-grid = すべてのセルの周り
format-table-rules-none = なし
format-table-header-bold = 見出しを太字に
format-equations = 数式
format-equations-stand = 数式の配置
format-equations-before = 番号の前
format-equations-after = 番号の後

## Page numbers and the running head.

format-page-numbers = ページ番号
format-page-numbers-show = ページ番号を振る

## About the format: where its requirements are from.

format-description = 説明
format-source = 規定の出典
# The date the source was read on.
format-source-read = { $date }に参照。
format-source-high = 値は出典どおりです。
format-source-medium = 出典は一部しか、または以前の版しか参照できませんでした。大事なところは確認してください。
format-source-low = ほとんど確認できませんでした。値は出発点として扱ってください。
