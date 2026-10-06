# What the core says of text read from PDFs and pictures, in English.
# See locales/README.md.

## What a file is.

ocr-kind-pdf = PDF
ocr-kind-picture = 图片

## When text cannot be read.

ocr-stopped = 识别已停止。
ocr-no-language = Tesseract 没有语言“{ $language }”的数据。
ocr-no-languages = Tesseract 没有任何语言的数据。请安装一种语言的数据，例如 Arch 上的 tesseract-data-eng。
ocr-not-pdf = “{ $file }”不是 PDF。
ocr-no-pages = “{ $file }”没有页面。
ocr-locked = “{ $file }”受密码保护，无法渲染其页面。
ocr-unreadable = 无法把“{ $file }”作为 PDF 读取。它可能已损坏。
ocr-page-not-drawn = 无法渲染第 { $page } 页。
ocr-picture-unreadable = 无法读取图片：{ $message }
ocr-drawing = 矢量图（SVG）中没有可供识别文字的图像。

## Making a PDF searchable.

ocr-searchable-locked = 此 PDF 受保护，无法使其可搜索。但仍可以把其中的文字作为导图引入项目。
ocr-searchable-unreadable = 无法使此 PDF 可搜索：{ $message }
ocr-not-whole = 生成的文件重新读取时不完整，没有保留。

## What the one who reads a PDF should know, before the map is made.

ocr-remark-read = { $count ->
   *[other] { $count } 页是从页面图像中识别出来的。
}
ocr-remark-text = { $count ->
   *[other] { $count } 页本身有文字，按文件中的原样采用。
}
ocr-remark-no-tesseract = { $count ->
   *[other] { $count } 页没有文字，保持空白：没有安装识别图像中文字的 Tesseract。
}
ocr-remark-not-read = 无法识别没有文字的页面：{ $message }
ocr-remark-failed = 无法识别第 { $page } 页：{ $message }
ocr-remark-more-failed = { $count ->
   *[other] 另有 { $count } 页无法识别。
}
ocr-remark-empty = 没有找到文字。
