# 組版ペインと文書の作成：文書が組まれたとおりのページと、その隣の
# 見た目、そして書き出し。

## 組版ペインの上端。

# 引用スタイルの最後の項目。ほかのスタイルの検索を開く。
preview-style-more = その他のスタイル…
# ページで見ている場所の要素を、テキストに表示する。
preview-go-to-text = テキストのこの場所へ移動
# テキストのカーソルがある要素の始まるところへ、ページを動かす。
preview-show-text = テキストの位置を表示
preview-hide = 組版を隠す
# プログラムの名前は Pandoc、Typst、LaTeX のいずれか。
preview-program-missing = { $program }がインストールされていません
preview-programs-needed = プレビューと書き出しはPandocとTypstで作成します。システムのパッケージマネージャーでインストールするか、設定でその場所を指定してください。
preview-look-again = もう一度探す
preview-looking-failed = プログラムを探せませんでした
preview-reading-failed = スタイル、レイアウト、テンプレートを読み込めませんでした
preview-failed = プレビューを作成できませんでした
preview-failed-message = プレビューを作成できませんでした。
# プレビューのページ。画面を見られない人に伝えるときの言い方。
preview-page = { $number }ページ
# 書き出すファイルの名前。要素に名前がないときに使う。
preview-file-name = 文書

## プレビューの下端：文書の長さと、指摘すること。

preview-pages = { $count ->
   *[other] { $count }ページ
}
preview-words = { $count ->
   *[other] { $count }語
}
# 本文の語数と、テンプレートが認める上限。
preview-words-of = { $limit ->
   *[other] { $count }語（上限{ $limit }語）
}
# 本文とその注を合わせた語数。
preview-words-with-notes = 注を含めて{ $count }語
preview-remarks-count = { $count ->
   *[other] 指摘{ $count }件
}
preview-remarks = 指摘
preview-remarks-font = フォント
preview-font-missing = { $font }がインストールされていません。
# 最初の名前はレイアウトが求めるフォント。これは代わりに使うフォントについて。
preview-font-substitute = 代わりに{ $font }を、このプレビューと作成するPDFで使います。Word、LibreOffice、LaTeX向けに書き出した文書では、フォントはレイアウトの指定どおりの名前で記され、文書を開く人がそのフォントをもっていれば使われます。
preview-remarks-references = 文献
# 太字で示し、次のメッセージが同じ文の中で続く。
preview-works-missing = { $count ->
   *[other] 引用した文献{ $count }件が、
}
preview-works-missing-where = ライブラリにもプロジェクトにも見つかりませんでした。テキストに印を付けてあります。
# Pandoc と Typst が文書の作成中に出したメッセージの上に。
preview-remarks-warnings = 文書の作成中のメッセージ

## 書き出し：文書を作成できるファイルの種類。

preview-export = 書き出し
preview-export-kind = ファイル形式
preview-export-pdf-about = プレビューのとおり
preview-export-pdflatex = PDF（LaTeXで組版）
preview-export-pdflatex-about = 同じ文書をLaTeXで組版します。少し時間がかかります。
preview-export-docx-about = たいていの出版社や学術誌が求める形式
preview-export-odt-about = LibreOffice Writerなど向け
preview-export-latex-about = LuaLaTeXまたはXeLaTeXで組版するためのもの
preview-export-markdown-about = プレーンテキスト。引用はキーのまま
preview-export-html = ウェブページ
preview-export-html-about = ブラウザーで読む一つのファイル
preview-export-epub = 電子書籍
preview-export-epub-about = EPUB。電子書籍リーダーとそのアプリ向けで、文字の組み方は読む側が決めます
preview-export-latex-missing = これにはLaTeXが必要ですが、見つかりませんでした。TeX Liveとしてインストールできます。
preview-export-biblatex = 引用をBibLaTeXのコマンドのまま残す
preview-export-biblatex-hint = 文献は文書の隣の.bibファイルに書き出されます。引用スタイルは、選んだものに最も近いBibLaTeXのスタイルになります。
# ファイルに名前を付ける窓の題。kind は PDF、Word など。
preview-export-as = { $kind }として書き出す
preview-export-run = 書き出す…
preview-export-working = 文書を作成しています…
preview-export-failed = 文書を作成できませんでした。
preview-export-stop = 中止
preview-export-stopped = 作成を中止しました。ファイルは書き込まれていません。
# 作成したファイルの名前の下に：一緒に作成したほかのファイル。
preview-export-also = あわせて{ $file }
preview-export-missing = { $count ->
   *[other] 引用した文献{ $count }件が見つからず、テキストに印を付けてあります。
}
preview-export-show-in-folder = フォルダーに表示
preview-export-open-failed = ファイルを開けませんでした
preview-export-folder-failed = フォルダーを開けませんでした
preview-export-another = 別のファイルを書き出す

## ページの行が何であるか：ページの端に出て、ポインターのある行の名を示し、
## そこで見た目を開くラベルと、下端にあるそのスイッチ。

# ラベルに：その行が何であるか。
preview-what-text = 本文
# 見出し。レベルで：見出し1、見出し2。
preview-what-heading = 見出し{ $level }
preview-what-note = 注
preview-what-bibliography = 参考文献
preview-what-figure = 図
preview-what-table = 表
preview-what-front = 最初のページ
# ラベルが何をするか。画面を見られない人に伝えるときの言い方。what はその行が何であるか：引用文、見出し1。
preview-what-open = 「{ $what }」の見た目…
# プレビューの下端のスイッチ。ラベルを表示していないときと、表示しているとき。
preview-chips = ページの行にラベルを表示
preview-chips-off = 行のラベルを隠す

preview-what-page = ページ
preview-what-header = ヘッダー
preview-what-footer = フッター

## 側、ペイン、ツールバー、第2段階：組版ペイン、文書ペイン、文書のプロパティ。

# 文書をページに組むペイン。隣にその見た目がある。
preview-title = 組版

## 設定をわかりやすい言葉で、第2段階：組版ペインのズーム。

# ズームのボタンと、そのメニューの最初の選択肢：ページをペインの幅に。
preview-zoom-fit = 幅に合わせる
# ズームのボタンと、そのメニューの選択肢：紙の上の大きさに対するページの大きさ。
preview-zoom = { $percent }%
# ズームのボタンが何であるか。画面を見られない人に伝えるときの言い方。
preview-zoom-label = ズーム
