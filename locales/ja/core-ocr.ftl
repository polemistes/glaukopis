# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = 画像

## When text cannot be read.

ocr-stopped = 読み取りを中止しました。
ocr-no-language = Tesseractには言語「{ $language }」のデータがありません。
ocr-no-languages = Tesseractにはどの言語のデータもありません。ArchならTesseract-data-jpnのように、いずれかの言語のデータをインストールしてください。
ocr-not-pdf = 「{ $file }」はPDFではありません。
ocr-no-pages = 「{ $file }」にはページがありません。
ocr-locked = 「{ $file }」はパスワードで保護されていて、ページを描画できません。
ocr-unreadable = 「{ $file }」をPDFとして読み込めませんでした。壊れているかもしれません。
ocr-page-not-drawn = { $page }ページを描画できませんでした。
ocr-picture-unreadable = 画像を読み込めませんでした：{ $message }
ocr-drawing = 描画（SVG）には、文字を読み取れる画像が含まれていません。

## Making a PDF searchable.

ocr-searchable-locked = このPDFは保護されているため、検索可能にできません。テキストをマップとしてプロジェクトに取り込むことはできます。
ocr-searchable-unreadable = PDFを検索可能にできませんでした：{ $message }
ocr-not-whole = 作成したものを完全に読み戻せなかったため、保存しませんでした。

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
   *[other] { $count }ページを画像から読み取りました。
}
ocr-remark-text = { $count ->
   *[other] { $count }ページにはテキストがあり、ファイルにあるとおりに使います。
}
ocr-remark-no-tesseract = { $count ->
   *[other] { $count }ページにはテキストがなく、空のままにします。画像の文字を読み取るTesseractがインストールされていません。
}
ocr-remark-not-read = テキストのないページを読み取れませんでした：{ $message }
ocr-remark-failed = { $page }ページを読み取れませんでした：{ $message }
ocr-remark-more-failed = { $count ->
   *[other] さらに{ $count }ページを読み取れませんでした。
}
ocr-remark-empty = テキストは見つかりませんでした。
