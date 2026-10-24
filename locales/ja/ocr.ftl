# TesseractがPDFと画像から読み取るテキスト：取り込む文書のダイアログ、
# 文献のファイル、画像庫、設定で。locales/README.md を参照。

## 読み取り

ocr-filter = PDFと画像
ocr-no-tesseract = 画像の中のテキストを読み取るTesseractが、インストールされていないか、見つかりませんでした。システムのパッケージマネージャーで、読む言語のデータとともにインストールするか（Archではtesseractとtesseract-data-eng、tesseract-data-norなど）、設定でその場所を指定してください。
ocr-failed = テキストを読み取れませんでした。
ocr-looking = { $file }を調べています…
ocr-about-picture = テキストは画像から読み取ります。
# PDFのページが、うまく読み取るにはdpiの低すぎる画像であるところ。
ocr-low-resolution = ページは{ $dpi } dpiの画像です。何を選んでも、文字をうまく読み取るには解像度が足りません。
ocr-low-resolution-text = 読み取り直しても、PDFがもつテキストよりよくはなりません。

ocr-trying = { $page }ページを読み取っています…
ocr-tried-nothing = { $label }ページからはテキストを読み取れませんでした。
ocr-tried-blocks = { $count ->
    [1] テキストブロックを表示
   *[other] { $count }個のテキストブロックを表示
}
ocr-tried-blocks-hint = Tesseractが見つけたテキストブロックで、読み取る順に番号を付けています。二つの段を一つと取ったり、注を本文に取り込んだりすると、順が誤って読まれます。別のレイアウトで分けられることがあります。

ocr-read = テキストを読み取る
ocr-read-pages = { $count }ページを読み取る
ocr-read-text-pages = テキストのあるページを使う
ocr-take-text = テキストを使う
ocr-reading = { $file }を読み取っています…
ocr-reading-pages = { $total }ページ中{ $done }ページを読み取りました
ocr-reading-hint = 1ページに数秒かかります。「キャンセル」で読み取りを中止します。

## テキストの読み取り方：読み取りがうまくいかないときに試すこと

ocr-how-dpi = 解像度（dpi）
ocr-how-layout = ページのレイアウト
ocr-how-layout-auto = Tesseractの判断に任せる
ocr-how-layout-column = 1段組み
ocr-how-layout-block = 一つのテキストブロック
ocr-how-layout-sparse = まばらなテキスト
ocr-how-contrast = 白黒
ocr-how-hint = 読み取りがうまくいかないときに試すこと：小さな活字には高い解像度、段が入り混じるときは1段組み、段落が一つだけなら一つのテキストブロック、薄い印刷やむらのある印刷には白黒。

## テキストの言語

ocr-languages = テキストの言語
ocr-languages-hint = 可能性の高いものから順に。一つ増やすごとに読み取りは遅くなり、よくなるとは限りません。
ocr-language-add = 言語を追加…
ocr-language-remove = { $language }を外す
# 言語ではなく文字体系：「ラテン文字」。
ocr-language-script = { $script }文字
ocr-language-fraktur = { $language }（フラクトゥール）
ocr-language-old = { $language }（古語）
ocr-language-vertical = { $language }（縦書き）

## 検索可能にしたライブラリのPDF

ocr-searchable-button = 検索可能にする…
ocr-searchable-title = PDFを検索可能にする
ocr-searchable-damaged = 変更のためにPDFを分解できませんでした。壊れているかもしれません。テキストをマップとしてプロジェクトに取り込むことはできます。
ocr-searchable-make = 検索可能にする
ocr-searchable-done = PDFを検索可能にしました：{ $count }ページを読み取りました
ocr-searchable-failed = { $count }ページを読み取れませんでした。
ocr-searchable-poorly = { $count }ページの読み取りが不十分でした：{ $pages }。別の言語で、または亀の子文字ならフラクトゥール・モデルで、ページを試してください。

## ライブラリのPDFを、要素のツリーとしてプロジェクトに読み込む

ocr-map-button = テキストをマップとしてインポート…
ocr-map-title = テキストをマップとしてインポート
ocr-map-into = インポート先のプロジェクト
ocr-map-new-project = 新しいプロジェクト（同じ名前で）
ocr-map-make = インポート
ocr-map-making = インポートしています…
ocr-map-failed = 要素を作れませんでした。

## 画像庫の画像のテキスト

ocr-picture-read = 画像内のテキストを読み取る…
ocr-picture-title = 画像内のテキスト
ocr-picture-empty = 画像にテキストは見つかりませんでした。
ocr-picture-copy = コピー
ocr-picture-copied = テキストをコピーしました
ocr-picture-copy-failed = テキストをコピーできませんでした
ocr-picture-map = 要素にする

## 設定のTesseract

ocr-settings-looking = 探しています…
ocr-settings-missing = 見つかりません。スキャンや画像からテキストを読み取るのに必要です。システムのパッケージマネージャーで、読む言語のデータとともにtesseractをインストールするか（Archでは英語はtesseract-data-eng、ノルウェー語はtesseract-data-nor、古代ギリシア語はtesseract-data-grc、…）、下でその場所を指定してください。
ocr-settings-by-itself = 自動で見つかりました
ocr-settings-where = Tesseractの場所
ocr-settings-look-failed = Tesseractを探せませんでした
ocr-settings-title = 文字認識（OCR）
ocr-settings-has-none = どの言語のデータもありません。下でインポートするか、tesseract-data-engのように、システムのパッケージマネージャーでインストールしてください。
ocr-settings-first = OCRの既定の言語
ocr-settings-how = OCRの既定の設定
ocr-settings-languages = OCRの言語
ocr-settings-languages-hint = GlaukopisはOCRにTesseractを使います。ここでインポートした言語ファイルは、システムにインストールされているものの代わりに使われます。
ocr-source-system = システム
ocr-source-imported = インポート済み
ocr-settings-not-found = Tesseractが見つかりませんでした。下の「プログラム」でその場所を指定してください。

## PDFがもつテキストがどうなるか（PDFを読むどのダイアログでも同じ）。

ocr-text-title = PDFがもつテキスト

## PDFがもつテキストについてわかること、それでできること（ADR 0044）。

ocr-text-scheme-greek-names = ギリシア語は{ $fonts }のグリフ名として保存されていて、ギリシア文字にできます。
ocr-text-scheme-expert-names = { $fonts }のスモールキャピタルとオールドスタイル数字は名前で保存されていて、もとの文字と数字にできます。
ocr-text-scheme-beta-code = ギリシア語がBeta Codeで書かれていて、ギリシア文字にできます。
ocr-text-page = { $label }ページ
ocr-text-page-none = このページにテキストはありません。ページの画像から読み取ります。
ocr-text-rest-failed = これより後のページを読み取れませんでした。
ocr-searchable-make-readable = 読めるようにする
ocr-searchable-readable-done = PDFのテキストが読めるようになりました：{ $count }個のフォントに文字を対応付けました

## ページの形と、形の似た文字をもつ文字体系（ADR 0045）。

ocr-shape = ページの形を保つ
ocr-shape-hint = 見出し、改行を保った行、余白の番号を保ち、柱は除きます。オフにすると、ページはただの段落になります。
# 形を保って読んだPDFがどのようにマップになるか：文書自身のツリーか、ページごとの要素か。
ocr-structure = 要素
ocr-structure-headings = 見出しごと
ocr-page-marks = 各ページの始まりに印を付ける
ocr-page-marks-hint = ページが始まったところに、そのページ番号の文中番号を置きます。
# 読み取ったPDFから何を作るか。読み取りの後で尋ねる：同じ読み取りから作り直す。
ocr-made-title = 作るもの
ocr-made-headings = { $count ->
    [0] 見出しは見つかりませんでした
   *[other] 見出しごと（{ $count }個）
}
ocr-made-pages = ページごと（{ $count }ページ）
ocr-made-failed = 要素を作り直せませんでした
# 見出しで読んだPDFをマップにする前に示すアウトライン。
ocr-outline-title = 作られるもの
ocr-outline-all = { $count }個すべて表示

# 本文のほかに繰り返し出る文字様式。読み取りの後に示し、それぞれが何かを書き手が言う。
ocr-styles-title = 見つかった文字様式
ocr-styles-about = { $count ->
    [1] 本文のほかに、一つの文字様式が繰り返し出ます。それが何かを指定するか、テキストのままにしてください。
   *[other] 本文のほかに、{ $count }個の文字様式が繰り返し出ます。それぞれが何かを指定するか、テキストのままにしてください。
}
# 見つかった文字様式の出る頻度：「9ページで12回」。
ocr-styles-often = { $pages }ページで{ $count }回
ocr-styles-kind = 何であるか
ocr-styles-own = 独自の種類…
ocr-styles-own-name = 種類の名前
ocr-styles-own-hint = 文書を取り込むときに作られます。見た目を与えるまで、独自の見た目はありません。
# 独自の種類の名前の最初の案：文字様式の見た目を言葉にしたもの。「{ $look }のテキスト」「字下げ 小さめ 斜体のテキスト」、改行を保った行なら「改行を保った行 { $look }」「改行を保った行」。$look の語はプログラムが半角スペースでつなぐ。改行を保った行では $kept が yes で、見た目の語をそれに合わせて変える言語のためのもの。
ocr-style-guess = { $kept ->
    [yes] 改行を保った行 { $look }
   *[other] { $look }のテキスト
}
ocr-style-indented = { $kept ->
   *[other] 字下げ
}
ocr-style-smaller = { $kept ->
   *[other] 小さめ
}
ocr-style-larger = { $kept ->
   *[other] 大きめ
}
ocr-style-bold = { $kept ->
   *[other] 太字
}
ocr-style-italic = { $kept ->
   *[other] 斜体
}
# 本文とフォントだけが違う文字様式。
ocr-style-family = { $family }のテキスト
ocr-style-other = その他のテキスト
# 選んだ言語の中の文字体系。下の警告に入る形で：「ギリシア文字をラテン文字といっしょに読み取ります」。
ocr-script = { $script ->
    [Greek] ギリシア文字
    [Cyrillic] キリル文字
   *[Latin] ラテン文字
}
# $alike：形の似た文字を対にして、一つ目の文字体系のものを先に：「ϲ c, ο o, ν v」。
ocr-languages-scripts-alike = { $a }を{ $b }といっしょに読み取ります。両者で形の似た文字（{ $alike }）はよく取り違えられ、語全体が誤って読まれます。一つの文字体系だけを読むなら、ほかを外してください。


## 小さく描いた、ページを選ぶためのPDFのページの列。

ocr-strip = ページ
ocr-strip-page = { $number }ページ
# 描画できなかったページ。理由はそれ以上言わない。
ocr-strip-page-failed = 描画できません
# $from と $to：まとめて描画するはずだったページの最初と最後（1から数える）。
ocr-strip-failed = { $from }–{ $to }ページを描画できませんでした。

# 作業台のペイン：表示中のページの画像、そのページについてPDFがもつテキスト、
# ページの試行でTesseractが読み取ったもの、そしてその隣の読み取りの設定の列。
# ペインの題と、テキストのないページでのその行は、上の ocr-text-page、
# ocr-text-title、ocr-text-page-none。画像の上に描くブロックは ocr-tried-blocks。

ocr-settings-heading = Tesseractの読み取り方
# 読み取りの設定の下のボタン：表示中のページをその設定で読み取る。
ocr-settings-try = { $page }ページを試す
# 試行の設定を一行で言うとき、言語を選んでいないところ：Tesseractはそのとき英語を読む。
ocr-settings-said-no-language = 英語（言語を選んでいないため）
# 試行の設定を一行で言うとき、ページを白黒にしてから読み取ったところ。
ocr-settings-said-contrast = 白黒
# ページの画像をどの大きさで示すか：ペインにページ全体、実寸、その2倍。
ocr-picture-size = 画像の大きさ
ocr-picture-fit = 全体表示
ocr-picture-actual = 100%
ocr-picture-double = 200%
# 表示中のページの画像の代替テキスト。
ocr-picture-alt = { $label }ページ
ocr-pane-translated = フォントの示すとおりに変換
ocr-pane-sound = テキストとして読める
ocr-pane-poor = テキストとして読めません：どの文字かを示さないフォントの文字か、読み取りが不十分です
ocr-pane-tesseract = Tesseractが読み取ったもの
ocr-pane-try-hint = 「{ $page }ページを試す」を押すと、隣の設定でこのページを読み取ります。
# 試したページについてTesseractがどれだけ確かだったか、一行で：「40ページ： 信頼度：低（73%） · 251語中89語が不確か」。低は80未満、良は89まで、高は90から。
ocr-tried-page = { $label }ページ：
ocr-confidence-low = 信頼度：低（{ $confidence }%）
ocr-confidence-good = 信頼度：良（{ $confidence }%）
ocr-confidence-high = 信頼度：高（{ $confidence }%）
ocr-tried-unsure = { $unsure ->
    [0] 不確かな語なし
   *[other] { $words }語中{ $unsure }語が不確か
}
ocr-tried-low-hint = 80%未満：別の言語、亀の子文字ならフラクトゥール・モデル、または別のレイアウトを試してください。
# Tesseractが確かでなかった語のツールチップ。
ocr-pane-unsure-word = 信頼度{ $confidence }%で読み取り
# 設定の上の行の後に添える。選んだページの読み方がまちまちなところ：変更はそのすべてに適用される。
ocr-settings-scope-differ = （読み方はページによって異なる）
# ページの試行の一覧の上。それぞれ、読み取ったときの設定で示す。
ocr-trials = 試した設定
ocr-trial-confidence = { $confidence }%
ocr-trial-nothing = 読み取れたものなし
ocr-trial-use = この設定を使う

# 作業台のページ

# ページの列の上の行は、各ページが何を得るかを言う：PDFがもつテキストか、Tesseractが読み取るものか。
ocr-pages-said-pdf = { $pages ->
    [1] ページはPDFがもつテキストを使います。
   *[other] { $pages }ページすべてで、PDFがもつテキストを使います。
}
ocr-pages-said-read = { $pages ->
    [1] ページはTesseractで読み取ります。
   *[other] { $pages }ページすべてをTesseractで読み取ります。
}
ocr-pages-said-both = { $pdf }ページはPDFがもつテキストを使い、{ $read }ページはTesseractで読み取ります。
# Tesseractがインストールされておらず、読み取るページがあるところ。
ocr-pages-said-unreadable = { $pages ->
    [1] ページを読み取れません：Tesseractがインストールされていません。
   *[other] { $pages }ページのどれも読み取れません：Tesseractがインストールされていません。
}
ocr-pages-said-both-unreadable = { $pdf }ページはPDFがもつテキストを使います。{ $read }ページはTesseractがないと読み取れません。
ocr-pages-said-picture = テキストは画像から読み取ります。
ocr-pages-said-picture-unreadable = Tesseractがないと、画像のテキストは読み取れません。
# 隣の操作が何に適用されるか：すべてのページか、選んだページか（$pages：「39–120ページ」、ocr-pages-selection の言い方で）。
ocr-pages-scope-all = { $pages ->
    [1] 対象：このページ
   *[other] 対象：{ $pages }ページすべて
}
ocr-pages-scope = 対象：{ $pages }
# 選んだページを文中で言う形：「280ページ」「3–5, 9ページ」。
ocr-pages-selection = { $count ->
   *[other] { $pages }ページ
}
ocr-pages-all = すべてのページ
ocr-pages-pdf = PDFのテキスト
ocr-pages-pdf-hint = これらのページはPDFがもつテキストを使います。テキストのないページは、それでも読み取ります。
ocr-pages-read = Tesseractで読み取る
ocr-pages-read-hint = これらのページは、どんなテキストがあっても、ページの画像から読み取り直します。
ocr-pages-decide = テキストの質で決める
ocr-pages-decide-hint = ページごとに：テキストとして読めるテキストは使い、読めないテキストと、テキストのないページは読み取ります。

# 列の中のページの隅の印。そのページが何を得るかを言う。
ocr-strip-source-pdf = PDF
ocr-strip-source-read = 読取
ocr-strip-source-pdf-hint = PDFがもつテキストを使います。
ocr-strip-source-read-hint = Tesseractで読み取ります。
ocr-strip-poor = このページのテキストは、テキストとして読めません。
# 同じように読むページ範囲の上の帯：言語、300でないときの解像度、指定したときのレイアウト、白黒。
ocr-strip-band-none = 英語（言語を選んでいないとき）
ocr-strip-band-dpi = { $dpi } dpi
# 白黒を短く。
ocr-strip-band-contrast = 白黒
ocr-strip-band-hint = { $count ->
    [1] { $from }ページ：{ $said }
   *[other] { $from }–{ $to }ページ：{ $said }
}

# 読み取りの概要、ダイアログが開いたとき：ファイルが何かを、部分に分けて言う。部分はプログラムが「, 」でつなぎ、最後に「.」を置く。
ocr-summary-pages = { $pages }ページ
ocr-summary-scanned = { $dpi } dpiでスキャン
ocr-summary-no-text = { $pages ->
    [1] テキストなし
   *[other] どのページにもテキストなし
}
ocr-summary-text-all = { $pages ->
    [1] テキストあり
   *[other] すべてのページにテキストあり
}
ocr-summary-text-some = うち{ $with }ページにテキストあり
ocr-summary-poor = そのうち{ $poor }ページはテキストとして読めない
ocr-summary-poor-all = ただしテキストとして読めない
# すべてのページが何を使うかの選択の上。
ocr-summary-whole = 各ページのテキストの取り方
ocr-summary-mixed = ページごとに選ばれています。ここで選ぶと、またすべてのページに適用されます。
# 読み取りの設定の下。Tesseractで読み取るページがないところ。
ocr-summary-idle = Tesseractで読み取るページに適用されます。今はそのようなページはありません。
ocr-summary-pages-open = ページを見て試す…
ocr-summary-picture-open = 試す…
ocr-summary-back = 概要に戻る

## わかりやすい言葉での設定、第1段階：学習に使った言語で名付けたフラクトゥール・モデル。

# テキストの言語のうち、Tesseractのフラクトゥール・モデル：読み取る字体で名付け、次に学習に使った言語で。
ocr-language-fraktur-german = フラクトゥール（亀の子文字）、ドイツ語
# Glaukopis独自のフラクトゥール・モデル：Tesseractのものに、ノルウェーの本でæ、ø、åを教えたもの。デンマーク語も読める。
ocr-language-fraktur-norwegian = フラクトゥール（亀の子文字）、ノルウェー語とデンマーク語
# テキストの言語の下。亀の子文字のモデルがインストールされていて、ノルウェー語もデンマーク語も選ばれていないところ。
ocr-languages-fraktur-hint = 亀の子文字で組まれた本（1900年ごろより前のノルウェー、デンマーク、スウェーデン、ドイツの本に多い）は、言語にかかわらず「フラクトゥール（亀の子文字）、ドイツ語」で読み取ります。最初に、または単独で選んでください。このモデルはæ、ø、åを認識できません。ノルウェー語とデンマーク語の本は、これらを認識できる「フラクトゥール（亀の子文字）、ノルウェー語とデンマーク語」で読み取ります。
# 同じもの。ノルウェー語またはデンマーク語が選ばれているところ。
ocr-languages-fraktur-hint-dan = 亀の子文字で組まれたノルウェー語とデンマーク語の本（1900年ごろより前には多かった）は、ほかにどの言語を選んでいても「フラクトゥール（亀の子文字）、ノルウェー語とデンマーク語」で読み取ります。最初に、または単独で選んでください。このモデルはæ、ø、åを認識できますが、ドイツ語のモデルはできません。
