# Glaukopisのクレジット：その土台となり、一緒に配布されるものと、その
# ライセンス。設定の「Glaukopisについて」のボタンが開くウィンドウに出る。
# プロジェクトの名前とライセンスは訳さない。それらは
# src/lib/settings/credits.ts にある。

credits-button = クレジットとライセンス…
credits-title = クレジットとライセンス
credits-own-licence = GlaukopisはGNU General Public Licenseバージョン3またはそれ以降（GPL-3.0-or-later）のもとで配布されるフリーソフトウェアです。以下のプロジェクトの成果を、それぞれのライセンスに従って使って作られています。
# プロジェクトの作者の前に来る。そのライセンスが作者の名を挙げるよう求めるとき。
credits-by = 作者：{ $who }
# 名前がリンクのとき、それが何を表すか：「{ $url }を開きます」。
credits-open = { $url }を開きます

## グループ

credits-group-built-on = 土台となるもの
credits-group-copied = 取り入れたコード
credits-group-fonts = フォント
credits-group-data = スタイル、辞書、その他のデータ
credits-group-programs = 連携するプログラム（インストールされている場合）
credits-group-icons = アイコン
credits-group-owl = フクロウ
credits-group-lookup = 文献の照会先
credits-lookup-about = DOIはdoi.org、Crossref、DataCiteで、書籍はK10plus、ノルウェーの大学図書館、ドイツ国立図書館（Deutsche Nationalbibliothek）、米国議会図書館（Library of Congress）の目録で、プレプリントはarXivで、医学文献はPubMedで照会します。送られるのは、照会に入力したものだけです。

## それぞれがGlaukopisにとって何であるか

credits-what-tauri = アプリケーションの枠組み。ウィンドウと、インターフェースとそれ以外の部分をつなぐ仕組み。
credits-what-tauri-plugins = ファイルやフォルダーを選ぶウィンドウと、ファイルやアドレスをほかのプログラムで開く機能。
credits-what-webkitgtk = Linuxでインターフェースを表示するWebエンジン。Glaukopisではなく、システムの一部です。
credits-what-gtk = Linuxでウィンドウとページに何が起きたかを、ログのために知らせます。
credits-what-svelte = インターフェースはこれで書かれています。
credits-what-prosemirror = テキストのエディター。
credits-what-yjs = プロジェクトを保持し、変更を元に戻したり、変更したそばからほかの人と共有したりできるようにします。
credits-what-y-prosemirror = テキストのエディターを、プロジェクトが保持するものとつなぎます。
credits-what-y-protocols = 共有プロジェクトへの変更を、サーバーとやり取りする仕組み。
credits-what-lib0 = Yjsを作っている小さな道具。インターフェースがサーバーに送るものを書くのにも使います。
credits-what-yrs = Glaukopisに付属するサーバーで、共有プロジェクトを保持します。
credits-what-fractional-indexing = 何人かが同時に動かしても、要素と種類の順序を保ちます。
credits-what-fluent-js = インターフェースの文言を、すべての言語で。
credits-what-fluent-rs = 中核の文言を、すべての言語で。独自の文言の確認も。
credits-what-pluralrules = 各言語で、数に合う語の形を決めます。
credits-what-unic-langid = 言語の名前を読み取ります。
credits-what-sys-locale = システムの言語を調べます。
credits-what-typst = プレビューのページを組み、PDFファイルを作成します。
credits-what-comemo = Typstが計算した結果を覚えておき、ページをすばやく組み直せるようにします。
credits-what-hayro = PDFファイルのページを描画します。テキストを読み取るためと、表示するため。
credits-what-lopdf = PDFファイルを読み書きします。PDFがもつテキストのためと、スキャン画像に重ねるテキストのため。
credits-what-flate2 = PDFファイルが圧縮してもっているものを、上限までだけ展開します。小さなファイルがメモリーを使い果たさないように。
credits-what-pdf-text-part = PDFファイルのフォントと文字の対応表を読み取ります。Glaukopisに取り入れたpdf-extractのコードのため。
credits-what-image = 画像を読み書きします。
credits-what-rusqlite = Zoteroのデータベースを読み、その文献をインポートします。
credits-what-sqlite = Zoteroが文献を保存しているデータベース。rusqliteを通して読みます。WindowsとmacOSでは組み込み、Linuxではシステムのもの。
credits-what-roxmltree = XMLを読みます：引用スタイル、Word文書、目録から送られてくるもの。
credits-what-zip = Wordファイル、OpenDocumentファイル、ファイルとしてのプロジェクト、言語パッケージを読み書きします。
credits-what-calamine = 表計算ファイルを読みます。表を取り込むため。
credits-what-encoding-rs = 古いファイルが使う文字コードのテキストを読みます。
credits-what-spellbook = Hunspellの辞書でスペルをチェックします。
credits-what-icu = 各文字が何であるかを知り、語を見つけるのに使います。
credits-what-unicode-normalization = 発音区別符号の付いた文字を一つの形にそろえ、検索や比較ができるようにします。
credits-what-strsim = 二つの名前やタイトルがどれだけ似ているか。重複を見つけるため。
credits-what-ureq = 文献を照会するサービスや、言語パッケージのサーバーと通信します。
credits-what-sha2 = ファイルを中身で見分けます。
credits-what-base64 = 画像やファイルをテキストとして運びます。
credits-what-serde = GlaukopisのデータをJSONとして読み書きします。
credits-what-uuid = 保存するすべてのものに、固有の名前を付けます。
credits-what-time = 日付と時刻。
credits-what-tempfile = 隣に置いたファイルを通して、ファイルを安全に書き込みます。
credits-what-tracing = アプリケーションの動作のログ。
credits-what-thiserror = Glaukopisに付属するサーバーのエラー。
credits-what-tokio = プロジェクトの共有のため、Glaukopisに付属するサーバーを動かします。
credits-what-axum = Glaukopisに付属するサーバーに接続してくる相手に応答します。
credits-what-futures = サーバーが受け取るものと送るものを、届くそばから扱います。
credits-what-clap = Glaukopisに付属するサーバーが、どのような指定で起動されたかを読み取ります。
credits-what-getrandom = Glaukopisに付属するサーバーのトークンと招待コードを作ります。
credits-what-libc = LinuxとmacOSで、別プロセスで行うPDFの読み取りを、時間とメモリーの上限の中に収めます。
credits-what-windows-sys = Windowsで、別プロセスで行うPDFの読み取りを、時間とメモリーの上限の中に収めます。
credits-what-pdf-extract = PDFファイルのテキストを読み取ります。pdf-textとしてGlaukopisに取り入れ、グリフの名前がわかるように変更しました。
credits-what-wrap-it = Typstが組むページで、テキストを隣にあるものの周りに回り込ませます。短くしてGlaukopisに付属。
credits-what-literata = インターフェース内のテキストのフォント。
credits-what-inter = インターフェースのフォント。
credits-what-stix = インターフェース内の数式のフォント。
credits-what-typst-font = Typstに付属するフォントで、文書のページ用。WindowsとmacOSのインストーラーに含まれ、Linuxではシステムのもの。
credits-what-foxit = PDFの標準14フォントの代わりになるフォント。PDFファイルを描画するときと、PDFの画像を組むときに使います。
credits-what-csl-styles = Glaukopisに付属する引用スタイルと、リポジトリから取得するスタイル。
credits-what-csl-locales = 各言語での引用の語：「ページ」「章」など。
credits-what-ordboka = Glaukopisに付属する、ノルウェー語（ブークモールとニーノシュク）の辞書の語。
credits-what-ordbank = ノルウェー語の辞書の語の活用形。
credits-what-spell-norwegian = ノルウェー語の辞書の規則。
credits-what-spelling-en-us = アメリカ英語の辞書。言語パッケージのサーバーから。
credits-what-spelling-en-gb = イギリス英語の辞書。言語パッケージのサーバーから。
credits-what-spelling-sv = スウェーデン語の辞書。言語パッケージのサーバーから。
credits-what-spelling-da = デンマーク語の辞書。言語パッケージのサーバーから。
credits-what-spelling-de = ドイツ語の辞書。言語パッケージのサーバーから。
credits-what-spelling-fr = フランス語の辞書。言語パッケージのサーバーから。
credits-what-spelling-it = イタリア語の辞書。言語パッケージのサーバーから。
credits-what-tessdata = Tesseractが各言語を読み取るためのデータ。言語パッケージのサーバーから。
credits-what-pandoc = Wordなどの形式の文書を取り込み、Word、OpenDocument、LaTeX、HTML、EPUBの文書を作成します。
credits-what-tesseract = スキャンや画像のテキストを読み取ります。
credits-what-poppler = ほかの方法では描画できないPDFファイルのページを、テキストを読み取るために描画します。
credits-what-latex = 文書から作ったLaTeXを、LuaLaTeX、XeLaTeX、pdfLaTeXでPDFファイルにします。
credits-what-lucide = インターフェースのアイコン。
credits-what-feather = Lucideのアイコンの一部は、Featherのアイコンをもとに描かれています。
credits-name-owl = Glaukopisのフクロウ
credits-what-owl = Glaukopisのマークとアイコン：アテナのフクロウ。アテナイのテトラドラクマ銀貨の写真をもとに、Robert Emil Bergeが描いたもの。この絵を使う人は、描いた人として彼の名を、もとにしたものの出典としてClassical Numismatic Group, Inc.（http://www.cngcoins.com）を挙げてください。
credits-what-owl-photo = フクロウのもとになった写真：紀元前454–404年のアテナイのテトラドラクマ銀貨。Classical Numismatic Group, Inc.（http://www.cngcoins.com）による。
