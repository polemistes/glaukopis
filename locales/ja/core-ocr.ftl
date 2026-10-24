# PDFと画像から読み取るテキストについて、中核が言うこと。
# locales/README.md を参照。

## ファイルが何か。

ocr-kind-pdf = PDF
ocr-no-headings = 見出しが見つかりませんでした。ページを要素にします。
ocr-kind-picture = 画像

## テキストを読み取れないとき。

ocr-stopped = 読み取りを中止しました。
ocr-no-language = Tesseractには言語「{ $language }」のデータがありません。
ocr-no-languages = Tesseractにはどの言語のデータもありません。「設定」›「プログラム」でインポートするか、Archのtesseract-data-engのように、システムのパッケージマネージャーでインストールしてください。
ocr-not-pdf = 「{ $file }」はPDFではありません。
ocr-no-pages = 「{ $file }」にはページがありません。
ocr-locked = 「{ $file }」はパスワードで保護されていて、ページを描画できません。
ocr-unreadable = 「{ $file }」をPDFとして読み込めませんでした。壊れているかもしれません。
ocr-page-not-drawn = { $page }ページを描画できませんでした。
ocr-no-such-page = PDFに{ $page }ページはありません。全{ $pages }ページです。
ocr-reading-gone = 読み取りはもう保持されていません。ファイルをもう一度読み取ってください。
ocr-picture-unreadable = 画像を読み込めませんでした：{ $message }
ocr-not-made = Tesseractは{ $path }を作成しませんでした。
ocr-not-made-said = Tesseractは{ $path }を作成しませんでした。Tesseractのメッセージ：{ $message }
ocr-drawing = 描画（SVG）には、文字を読み取れる画像が含まれていません。
ocr-child-time = 「{ $file }」の読み取りが許される時間を超えたため、中止しました。ファイルが壊れているか、読み取れない作り方をされているのかもしれません。
ocr-child-memory = 「{ $file }」の読み取りが許されるメモリを超えたため、中止しました。ファイルが壊れているか、読み取れない作り方をされているのかもしれません。
ocr-child-failed = 「{ $file }」を読み取れませんでした：{ $message }
ocr-child-not-started = 「{ $file }」を読み取れませんでした。読み取りのためのプロセスを開始できませんでした：{ $message }

## PDFを検索可能にする。

ocr-searchable-locked = このPDFは保護されているため、検索可能にできません。テキストをマップとしてプロジェクトに取り込むことはできます。
ocr-searchable-unreadable = PDFを検索可能にできませんでした：{ $message }
ocr-not-whole = 作成したものを完全に読み戻せなかったため、保存しませんでした。

## PDFを読み取る人が、マップを作る前に知っておくべきこと。

ocr-remark-failed = { $page }ページを読み取れませんでした：{ $message }
ocr-remark-more-failed = { $count ->
   *[other] さらに{ $count }ページを読み取れませんでした。
}
ocr-remark-empty = テキストは見つかりませんでした。
ocr-remark-poorly = { $count ->
    [1] 1ページの読み取りが不十分でした：{ $pages }。別の言語、亀の子文字ならフラクトゥール・モデル、または別のレイアウトのほうがよく読み取れるかもしれません。読み取り直す前に試してください。
   *[other] { $count }ページの読み取りが不十分でした：{ $pages }。別の言語、亀の子文字ならフラクトゥール・モデル、または別のレイアウトのほうがよく読み取れるかもしれません。すべてを読み取り直す前に、1ページ試してください。
}

## PDFの読み取りの結果（ADR 0044）。

ocr-remark-counts = Tesseractで読み取ったのは{ $read }ページ、PDF自体のテキストを使ったのは{ $taken }ページ、読み取れなかったのは{ $failed }ページです。
# 読み取れなかったページの代わりに、要素の中に置かれる。
ocr-page-failed-line = ［このページを読み取れませんでした：{ $message }］
ocr-why-no-tesseract = 画像の中のテキストを読み取るTesseractが、インストールされていません。

## わかりやすい言葉での設定、第1段階：学習に使った言語で名付けたフラクトゥール・モデル。

# 読み取りが不十分だったページの下。読み取った言語がかつて亀の子文字で組まれていて、ノルウェー語もデンマーク語も読み取らなかったところ。
ocr-remark-fraktur = 亀の子文字で組まれた本（1900年ごろより前のノルウェー、デンマーク、スウェーデン、ドイツの本に多い）は、言語にかかわらず「フラクトゥール（亀の子文字）、ドイツ語」で読み取ります。最初に、または単独で選んでください。このモデルはæ、ø、åを認識できず、e、o、aとして読み取ります。
# 同じもの。ノルウェー語またはデンマーク語を読み取ったところ：Glaukopisのサーバーにある、æ、ø、åを認識できるフラクトゥール・モデル。
ocr-remark-fraktur-dan = 亀の子文字で組まれたノルウェー語とデンマーク語の本（1900年ごろより前には多かった）は、「フラクトゥール（亀の子文字）、ノルウェー語とデンマーク語」で読み取ります。Glaukopisのサーバーからインポートし、ほかにどの言語を選んでいても、最初に、または単独で選んでください。このモデルはæ、ø、åを認識できますが、ドイツ語のモデルはできません。
