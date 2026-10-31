# Glaukopis の用語（日本語）

`locales/GLOSSARY.md` に挙げられたアプリケーション独自の語に対する日本語の選択。
どの語も、すべてのファイルで同じように使う。`locales/GLOSSARY.md` と英語の
ファイルが食い違うところでは、英語のファイルが正しい（GLOSSARY.md のほうが
古い）。

## 2026-10-24 の変更（Changed on 2026-10-24）

0.2.4 以降、英語は大きく変わった。古い選択のうち、今の英語に合わなくなった
ものを次のように改めた。既存の訳でこれらの語を使っているところは、新しい語に
直す。

- **format — 書式** をやめた。英語のインターフェースはページの見た目を
  **layout** と呼ぶ（ファイルとコードでは今も format）。→ **レイアウト**。
  「書式」はもう使わない（Rust の中核のメッセージでも同じ：
  「書式「{ $id }」」→「レイアウト「{ $id }」」）。英語の format は今は
  ファイル形式（Word、PDF）だけで、→ **形式**、**ファイル形式**。
  以前の注「APA 7、Chicago は書式」は誤り：APA や Chicago は
  **スタイルガイド**で、その名のレイアウトと引用スタイルがある。
- **found citations — 見つかった引用** をやめた。英語は 2026-10-12 から
  **loose citations** → **未照合の引用**（取り込んだテキストで引用と
  わかったが、まだライブラリの文献と照らし合わせて結び付けていないもの）。
  照合する、照合されて引用になる（made into citations → 引用にする）。
  「照会」（lookup）とは別の語なので混ぜない。
- **pane — ペイン（分割の片側）** をやめた。分割の片側は今は **side** →
  **側（がわ）**。**ペイン** は組版ペイン（typesetting pane）と文書ペイン
  （document pane）のこと。
- **the panel at the side — サイドパネル** をやめた。文献、画像、コメント、
  未照合の引用、履歴、変更の確認は一つのペインを分け合う：**文書ペイン**。
- **document settings** は英語で **Document properties** になった →
  **文書のプロパティ**（新しい項目）。
- **look — 見た目** はそのまま。今は見た目の欄（Look、文書の見た目をすべて
  一か所で決めるところ）の名でもあり、設定の「Default look」（既定の
  レイアウトを選ぶ）も「既定の見た目」とする。
- **bring in — 取り込む** はそのまま。ただし英語は今、多くの所で
  **Import** と言う（Import the text as a map、Import a file、
  Import Bib(La)TeX…）。英語が import と言うところは **インポート**、
  bring in と言うところは **取り込む**。
- **picture** は英語で **image** になった。日本語は前から **画像** なので
  変わらない。**pointer** は英語で **Cross-reference** になった。
  **相互参照** のまま。
- **fold / unfold**：以前の「開く — 展開する」は unfold のこと。
  **unfold — 展開する** と書き改めた（語は変わらない）。

## 文体と表記

- **メッセージ・説明・ヒント**は丁寧体（です・ます）。書き手に呼びかけるのは
  必要なときだけで、「あなた」は使わない（your library → 「ライブラリ」、
  your notes → 「自分のメモ」、Your own → 「独自の…」）。
- **ボタン・メニュー項目・タブ・見出し**は、日本語のソフトウェアの慣例に従って
  名詞形または動詞の辞書形：「開く」「保存」「削除」「名前を変更」「取り消す」。
  続きのある項目（ダイアログを開くもの）は末尾に「…」。
- **約物**：全角の句読点「、」「。」、かぎ括弧「…」（内側は『…』）、
  省略記号「…」、全角の「？」「！」「：」は文中でのみ控えめに使う。
  英語の “…” は「…」に。区切りの「 · 」は英語のまま残す。
- **和欧間のスペース**：入れない。日本語と英字・数字・変数のあいだは詰める
  （「PDFを開く」「{ $count }件」「「{ $name }」を削除」）。
- **パーセント**：半角の %、数字との間にスペースを入れない（「73%」
  「{ $percent }%」）。英語の `{ $percent } %` のスペースは取る。
- **外来語**は日本語のソフトウェアが書くとおりのカタカナで、長音は付ける
  （フォルダー、サーバー、ユーザー、ヘッダー、フッター。ライブラリは慣用で
  長音なし）。
- **キー**：Ctrl、Shift、Alt、Enter、Esc、Tab、Space、Backspace、Delete、
  Home、End、PageUp、PageDown。本文では「Enterキー」のように書いてもよい。
- **複数形**：日本語は other のみ。`[one]` の行は除き、`*[other]` を残す。
  `[0]` などの数の指定は、言い方がよくなるときは残す。
- **助数詞**：要素・ファイル・フォルダー・キーワード・フォント → 個；
  文献・引用・コメント・変更・指摘・メッセージ・プロジェクト・招待 → 件；
  画像 → 枚；ページ → ページ；語 → 語；行 → 行；人 → 人；回数 → 回。
- **「…できませんでした」**：英語の “X could not be …” は「Xを…できません
  でした」。“Delete “X”?” は「「X」を削除しますか？」。
- **ペインの境の線**（Between the X and the Y）は「XとYの境」。

## 作業

- **project** — プロジェクト（要素の一本のツリー。いちばん上の要素が
  プロジェクトの名をもつ）
- **the tree** — ツリー；**branch** — 枝（「この枝を整理」）
- **at the top** — いちばん上、最上位（プロジェクトの最上位、最上位の要素）
- **map** — マップ（マインドマップ。ある要素と、その下の要素を描いたもの）
- **element** — 要素；**sub-elements** — 下位要素（その要素の下にあるもの
  すべて）；**child element** — 子要素；**sibling element** — 同じ階層の
  要素（「子要素を追加」「同じ階層に要素を追加」）
- **Delete with sub-elements** — 下位要素ごと削除；
  **Delete and promote sub-elements** — 削除して下位要素を一段上げる
- **the element in view** — 表示中の要素；**the text in view** —
  表示中のテキスト
- **enter**（要素に入る：その要素が表示中の要素になる）— 中に入る
  （メニュー「中に入る」「隣で中に入る」）。**open** とは別（open は
  「開く」）。**Up to “X”** — 「X」へ上がる；**up** — 上へ
- **clone** — クローン（別の場所に、自分の名前だけをもって立ち、原本の
  テキストと下位要素を印刷する要素）。**Clone of “X”** — 「X」のクローン；
  **Clone other element…** — 別の要素のクローンにする…；
  **No longer a clone** — クローンをやめる；**the original** — 原本
  （コピーの原本も同じ「原本」）
- **copy** — コピー；**cut** — 切り取り；**paste** — 貼り付け；
  **Duplicate…**（プロジェクトや文献を複製）— 複製…
- **the centre** — 中心
- **the diagram** — ダイアグラム（「図」は figure に取っておく）
- **the text** — テキスト；"text mode" — テキスト表示。段落の種類の
  **Text** は「本文」（ビューの「テキスト」と区別する）
- **passage** — 箇所（「選択した箇所」）
- **kind** — 種類（要素の種類、段落の種類、語句の種類。三つとも同じ語）。
  **type** は「種別」で、種類とは別（文献の種別、文書種別）
- **association** — 関連付け、関連付ける；**label**（関連付けの、行の、
  文中番号の）— ラベル
- **outline** — アウトライン；**heading** — 見出し；**level**（見出しの）—
  レベル；**name**（要素の）— 名前
- **status** — 状態：**Idea** アイデア、**Draft** 下書き、**Done** 完了
- **left out**（文書から）— 除外する（「文書から除外」）
- **document** — 文書
- **the manuscript** — 原稿
- **the preview** — プレビュー
- **export** — 書き出す、書き出し
- **bring in** — 取り込む、取り込み（文書を取り込むとマップになる）。
  英語が **import** と言うもの（Zotero からの文献、.bib、言語パッケージ、
  PDFのテキストをマップとして）は「インポート」。
- **take in**（ファイルをライブラリの保管場所に）— 収める（取り込むとは別）
- **make**（マップ、プロジェクト、文献を）— 作る；（文書、プレビューを）—
  作成する

## ウィンドウ：一覧、側、パス、ペイン

- **the list**（左の、すべてのプロジェクトとフォルダーの一本のツリー）—
  一覧；**the list of projects** — プロジェクト一覧。段落の種類の **list**
  は「リスト」で、別の語。
- **the start screen** — スタート画面（プロジェクトを開いていないときの画面）
- **the rail** — ナビゲーションバー（プロジェクト、ライブラリ、画像、設定）；
  **the house** in the rail — ホーム
- **side** — 側（がわ）。ウィンドウの片側で、それぞれ自分のプロジェクトを
  もつ。**this side** この側、**the other side** もう一方の側、
  **the side you are in / the active side** 作業中の側。
  **Close this side** — この側を閉じる；**Switch sides** — 左右を入れ替える
- **beside** — 隣（**Open beside** 隣に開く、**Show beside** 隣に表示、
  **Enter beside** 隣で中に入る）
- **Split view** — 分割表示；短く **Split** — 分割；
  **One at a time** — 一つだけ表示
- **the path**（側の上端の、フォルダー › プロジェクト › 要素）— パス
  （Finder の「パスバー」と同じ）；**Where you are** — 現在の位置；
  **crumb**（パスの一つ）— パスの項目；**More of the path** — パスの続き
- **the bar**（各側のアイコンの列）— ツールバー
- **pane** — ペイン；**the typesetting pane** — 組版ペイン；
  **Typesetting**（ボタン、ペインの名）— 組版；**Hide the typesetting** —
  組版を隠す
- **the document pane** — 文書ペイン；**Document**（ボタン）— 文書
- **zoom** — ズーム；**Fit the width** — 幅に合わせる
- **the palette** — コマンドパレット
- **the writing tools** — 執筆ツール
- **fold**, **fold away** — 折りたたむ；**unfold** — 展開する
  （**Unfold all** すべて展開、**Fold all sub-elements** 下位要素を
  すべて折りたたむ）
- **settings** — 設定；**your details** — ユーザー情報
- **data directory** — データフォルダー
- **trash** — ごみ箱；**Bring back** — 復元；**Remove for good** —
  完全に削除
- **the cursor** — カーソル；**grip**（見出しの横のつまみ）— つまみ
- **the owl** — フクロウ；**the owl map / the map of the projects** —
  プロジェクトのマップ
- **folder** — フォルダー；**things**（フォルダーとプロジェクト）— 項目
- **Earlier versions** — 以前のバージョン；**version**（履歴の）—
  バージョン（書誌の edition は「版」）；**moment** — 時点；
  **as it was { $when }** / **as of { $day }** — 「{ $when }時点」
- **press**（ボタンも、キーも）— 押す；**click** — クリック
- **project file** — プロジェクトファイル

## 文書：種別、テンプレート、レイアウト、見た目

- **document type** — 文書種別（何を書くか：テンプレートの、使う人に見える名。
  「既定の文書種別」「文書種別の要件」）
- **template** — テンプレート（文書種別の中身：部分とその順、手元に出す
  種類、レイアウトと引用スタイル、要件、作るファイル）。**Your own** —
  独自のテンプレート
- **what you are writing** — 何を書くか；選択画面の題「何を書きますか？」；
  **the chooser** — 文書種別の選択
- **layout** — レイアウト（ページの見た目：余白、フォント、見出し、注、
  種類の見た目。「原稿」はレイアウトの一つ）。**layout of my own** —
  独自のレイアウト
- **format**（ファイル）— 形式、ファイル形式。「書式」は使わない。
- **look** — 見た目（種類が文書でどう組まれるか。レイアウトに属する）；
  **Look**（組版ペインの欄）— 見た目；**Hide the look** — 見た目を隠す；
  **Default look** — 既定の見た目
- **look chip** — 見た目ラベル（組版のページの行の脇に出て、その行が何かを
  言い、押すと見た目の欄をそこで開く小さな札）。ページの上では単に
  「ラベル」。**Display look chips in the preview window** —
  プレビューに見た目ラベルを表示する
- **These changes hold for** — この変更の適用範囲；**Changed here** —
  ここで変更；**Modifications to the layout** — レイアウトへの変更
- **citation style / reference style** — 引用スタイル、略してスタイル
  （引用と参考文献の書き方のみ。見た目には使わない）
- **style guides** — スタイルガイド
- **your usual / Default**（設定で選んだもの）— 既定（「既定（{ $name }）」）；
  **None** — なし
- **Document properties** — 文書のプロパティ；**details** — 詳細；
  **affiliation** — 所属；**identifiers** — 識別子；**keywords** —
  キーワード；**checklist** — チェックリスト
- **requirements** — 要件；**anonymous** — 匿名（**Anonymize the front
  page** 最初のページを匿名にする）
- **remark**（プレビュー、チェックリストの）— 指摘；**warning** — 警告
- **contributor** — 著者等（文書の人。著者・編者・訳者をまとめていう）；
  **role** — 役割：**Author** 著者、**Editor** 編者、**Translator** 訳者
  （編者は版を編む人。出版社の「編集者」ではない）。
  「{ $number }人目の名前」のように数える。
- **Edited by …**、**Translated by …**、**Edited and translated by …**
  （タイトルページに印刷される行）— 日本の本の扉のとおり名前の後に：
  「{"{}"} 編」「{"{}"} 訳」「{"{}"} 編訳」。名前と名前のあいだ
  （document-and）は「・」がよい（プログラムは前後に半角スペースを入れる）。
- **part**（文書の構成部分）— 部分。置かれる所：**front matter** —
  前付け；**back matter** — 後付け；**the cover** — 表紙。
  個々の部分：**abstract** 要旨；**dedication** 献辞；**epigraph**
  エピグラフ；**copyright page** 著作権ページ；**foreword** 序文；
  **preface** まえがき；**cast** 登場人物；**setting** 舞台；
  **standfirst** リード；**acknowledgements** 謝辞；**appendix** 付録；
  **afterword** あとがき；**glossary** 用語集；**about the author**
  著者紹介；**signature** 署名；**blurb** 内容紹介
- **title page** — タイトルページ；**half title** — 前扉；
  **front page**（見た目の欄の部分、ラベル）— 最初のページ
- **running head** — 柱（ページの上に繰り返し出る見出し）；
  **header** / **footer** — ヘッダー / フッター（その中の左・中央・右の
  位置）；**page number** — ページ番号
- **the text**（生成される部分の本文）— 本文；**Table of contents** —
  目次；**List of figures / tables** — 図一覧 / 表一覧；**Notes** — 注；
  **Bibliography** — 参考文献
- **Key**（段落の種類の、Ctrl+Alt+数字）— キー

## 段落と行

- **kind of paragraph / Paragraph kind** — 段落の種類；
  **kind of words / Words kind** — 語句の種類
- **run**（同じ種類の段落が並んだもの）— まとまり（「ここから新しいまとまり」
  「前のまとまりとつなげる」）；**bracket**（まとまりの左端の線）— 括弧線
- **numbered stretch** — 番号付きの範囲（行番号を振る範囲）；
  **stretch** 一般 — 範囲
- **line numbers** — 行番号；**Number from** — 開始番号；
  **Show a number every** — 番号を表示する間隔
- **Line numbering from here** — ここからの行番号（窓の題。メニューは
  「ここからの行番号…」）
- **Numbering of this line** — この行の番号（メニューは「この行の番号…」）
- **Count the lines of** — 数える行；**Every kind** — すべての種類
- **Counted** — 数に入れる（その行を数えるか）
- **Its number is shown** — 番号の表示：**As the others are** ほかの行と
  同じ、**Always** 常に表示、**Never** 表示しない
- **annotation**（行の、余白の）— 注記（「右余白の注記」「左余白の注記」）；
  **Annotations on the** — 注記の位置；**Other side from the numbers** —
  番号と反対側
- **Begins where the line before ended** — 前の行の終わりから始める
  （二人の話者が分け合う詩行の後半）
- **indent** — 字下げ；**Indent first line** — 1行目の字下げ；
  **Indentation step**（Tabキー一回分の長さ）— 字下げ1段の幅；
  **one step in / out** — 一段下げる / 一段戻す；**hanging indent** —
  ぶら下げインデント
- **Space between paragraphs** — 段落の間隔
- **inline quotation**（引用符で囲んだ文中の引用）— 文中の引用；
  **quotation**（段落の種類）— 引用文；**block quotation** — ブロック引用
- **verse** — 韻文；**speaker** — 話者；**stage direction** — ト書き
- 以前からの段落の種類：**break** 区切り；**draft note** 下書きメモ；
  **headword** / **gloss** 見出し語 / 語釈；**attribution** 出典表示；
  **script** 台本；**scene heading** シーン見出し；**character** 役名；
  **dialogue** 台詞；**parenthetical** 演技指示；**transition** 場面転換
- **Insert**（メニュー）— 挿入；**Cite** — 引用する
- **line break within a paragraph** — 段落内改行；**page break** —
  改ページ；**column break** — 段区切り
- **the marks of whitespace**（¶、↵、改行しない空白の輪）— 編集記号
  （「文字飾り」とは別）
- **hard space** — 改行しない空白

## 文献と引用

- **the library** — ライブラリ
- **reference** — 文献
- **collection** — コレクション
- **attachment** — 添付ファイル
- **note** — メモ（ライブラリの文献、画像、コメントに書くもの）。脚注・後注は
  「注」
- **citation** — 引用（本文中で文献を挙げたもの。「(Berge 2026, 12)」になるもの）
- **quotation**（段落の種類）— 引用文
- **locator** — 参照位置（ページ、章、節、行）
- **lookup** — 照会する、照会（DOI、ISBN、検索で書誌情報を調べる）
- **loose citations** — 未照合の引用（上の「2026-10-24 の変更」を見よ）；
  **Make it a citation** — 引用にする；**Leave it as text** —
  テキストのままにする
- **citation key** — 引用キー；**tag**（文献を名指すタグ）— タグ
- **source**（BibLaTeX、CSL の原文）— ソース；（レイアウトの要件の）— 出典
- **duplicate** — 重複
- **the files of the library** — ライブラリのファイル；**the library's
  store** — ライブラリの保管場所；**assign**（ファイルを文献に）—
  割り当てる；**unassigned** — 未割り当て；**go through / the
  going-through** — 順に確認する、順の確認

## 語句と文字飾り

- **foreign words** — 外国語
- **title of a work** — 作品名
- **term** — 用語
- **mention** — 言及（語そのものとして語られる語）
- **highlight** — ハイライト（画面上のみ。印刷されない）
- **marks** — 文字飾り（斜体、太字、スモールキャピタル、下線、上付き、下付き、
  取り消し線、コード）。メニュー **Marks** も「文字飾り」
- **selected** — 選択した、選択範囲
- **language tag** — 言語タグ（「grc」「de-CH」）

## 画像・図・表・数式

- **image**（もとの picture）— 画像
- **the store** — 画像庫（すべてのプロジェクトで共有。ナビゲーションバーの
  三つ目は「画像」）
- **figure** — 図
- **caption** — キャプション
- **cross-reference**（もとの pointer）— 相互参照
- **inline number**（もとの reference mark：3:16、327a、1094a1）— 文中番号
- **table** — 表
- **formula** — 数式；**equation** — 別行立ての数式
- **placing** — 配置

## 時間・コメント・履歴

- **timeline** — タイムライン；**lane** — レーン；**axis** — 軸；
  **chronology** — 年表
- **when** — 時期（要素がもつ時点または期間）
- **Time stamp…**（要素のメニュー）— 時期を記す…；窓の題 **Time stamp** —
  時期；**a time stamp** — 記された時期（「時期が記されたものはまだ
  ありません」）
- **comment** — コメント；**thread** — スレッド；**settle / resolve** — 解決する
- **history** — 履歴
- **changes** / **review** — 変更、変更の確認；**accept** — 承諾；
  **reject** — 却下
- **sharing** — 共有；**working together** — 共同作業；**join** — 参加する；
  **member** — メンバー；**collaborator** — 共同作業者；**owner** —
  所有者；**invitation** — 招待；**invitation code** — 招待コード；
  **leave** — 退出する

## 読み取りと確認

- **spelling** — スペルチェック；**dictionary** — 辞書；**own words** — 登録語
- **reading text** / **OCR** — 文字認識（OCR）；**read**（テキストを）—
  読み取る；**a reading** — 読み取り；**made searchable** — 検索可能にする
- **language package** — 言語パッケージ（インポートする）
- **search** — 検索；**replace** — 置換；**found** — 検索結果、見つかったもの
- PDFの読み取りの窓：
  - **summary**（窓が開いたときの）— 概要（「概要に戻る」。要旨 abstract
    とは別）
  - **the pages** — ページ；**the strip**（小さく描いたページの列）—
    ページの列；**the workbench** — 作業台
  - **stretch**（同じ設定で読むページ）— ページ範囲
  - **What the pages take** — 各ページのテキストの取り方；ページは
    「PDFのテキストを使う」か「Tesseractで読み取る」
  - **try**（ページを）— 試す（「{ $page }ページを試す」）；**trial** —
    試行；**Tried with** — 試した設定
  - **confidence** — 信頼度：**Low** 低、**Good** 良、**High** 高
    （「信頼度：低（73%）」）
  - **unsure words** — 不確かな語（「251語中89語が不確か」）
  - **read poorly** — 読み取りが不十分
  - **dots to the inch** — dpi（「300 dpi」）
  - **styles of text**（PDFで見つかったもの）— 文字様式。「スタイル」単独は
    引用スタイルなので使わない；**the body** — 本文
- **Fraktur** — フラクトゥール；**Gothic type**（ドイツや北欧の古い印刷の
  字体）— 亀の子文字。**「ゴシック」は使わない**（日本語のゴシック体は
  サンセリフのこと）。「Fraktur (Gothic type), German」→
  「フラクトゥール（亀の子文字）、ドイツ語」；**the Fraktur model** —
  フラクトゥール・モデル

## 2026-10-31 の追加：側に表示したファイル、タブ、ブックマーク、画像の編集、マインドマップ、印刷

- **a file in a view / the viewer** — 側に表示したファイル。ウィンドウの
  片側（側）はマップの代わりにライブラリのファイル（PDF、画像）を表示できる。
  インターフェースに「ビューアー」という語は出さず、「ファイル」「ファイルの
  表示」と言う。**the view**（ズームで言う、ファイルを表示している側）—
  表示（**As wide as the view** 幅に合わせる；**The whole image in the
  view** 画像全体を表示）。**Show the file** — ファイルを表示；
  **Open in another program** — 別のプログラムで開く；**locked**（パスワード
  を求めるファイル）— パスワードを求める
- **drawn**（ページが）— 描く（「このページを描けませんでした」「印刷のために
  { $count }ページを描いています…」）。「描画」はSVGのこと（下）に取っておく
- **Page { $page } of { $count }** — 「{ $count }ページ中{ $page }ページ」；
  印刷上のページ番号（**printed**）はその後に全角括弧で「（xiv）」；
  **Go to page** — ページへ移動
- **zoom** — ズーム（既出）；**Zoom, in percent** — ズーム（%）；
  **Choose a zoom** — ズームを選ぶ。百分率は「{ $percent }%」（スペースなし）
- **tab** — タブ；**the tabs of a project** — プロジェクトのタブ
  （**The tabs of { $name }** 「{ $name }のタブ」；**The project's tabs**
  プロジェクトのタブ；**Add to a project's tabs…** プロジェクトのタブに追加…；
  **Add files to the tabs** タブにファイルを追加）；**The tab's menu** —
  タブのメニュー；**Close the tab** — タブを閉じる；**Close the other
  tabs** — ほかのタブを閉じる；**Open again in a new tab** — 新しいタブで
  もう一度開く；**Show in the library** — ライブラリで表示；**No longer
  in the library** — もうライブラリにありません
- **bookmark** — ブックマーク；**Mark this place** — この場所をブックマーク
  （キーの名も同じ）；**Bookmarks and contents** — ブックマークと目次；
  **the contents**（ファイル自身の目次）— 目次（文書の「目次」と同じ語）；
  **The bookmark's name** — ブックマークの名前；既定の名前 **Page 12** —
  「12ページ」
- **Files of the library**（ファイルのバーのメニュー）— ライブラリのファイル；
  **Find a file** — ファイルを探す；**Back to the files** — ファイルの一覧に戻る
- **the image editor** — 画像の編集；**Edit** — 編集；**Turn left / Turn
  right** — 左に回転 / 右に回転；**Flip sideways** — 左右反転；**Flip
  upside down** — 上下反転；**Crop** — 切り抜き（「切り取り」は cut なので
  使わない）；**Cut to w × h of W × H** — 「W × Hのうちw × hに切り抜く」
  （× の前後の半角スペースは英語のまま）；**Brightness** — 明るさ；
  **Contrast** — コントラスト；**Saturation** — 彩度；**As it was**
  （一つのスライダーを100%に）— 元の値に戻す（「元に戻す」Undo と区別）；
  **Start again** — 最初からやり直す；**Keep as a new file** — 新しい
  ファイルとして保存；**Kept as { $name }** — 「{ $name }として保存しました」；
  **Leave without keeping?** — 保存せずに終了しますか？；**Leave** — 終了
- **version**（図の画像の、原本とそこから作ったコピー）— バージョン（図の
  メニューの **Versions** も「バージョン」）；**a copy made smaller** —
  縮小したコピー；**Make a smaller copy** — 縮小したコピーを作る
- **edited / smaller**（ファイル名に入る語。括弧はプログラムが付ける）—
  編集済み / 縮小（「plate (編集済み).jpg」「plate (縮小).jpg」）
- **a drawing**（SVG、ピクセルのない画像）— 描画（SVG）（core-ocr と同じ）；
  **SVG, a drawing** — SVG（描画）
- **thumbnails** — サムネイル；**List**（ファイルの表示）— 一覧；
  **Small / Medium / Large** — 小 / 中 / 大；**Include subfolders** —
  サブフォルダーも含める；**By kind** — 種類順；**View**（ファイルの頭の
  ボタン）— 表示
- **Used in**（ファイルがどこで図になっているか）— 使用先（**A figure in
  { $project }** 「{ $project }の図」；**Not used yet** まだ使われていません）
- **Pixels** — ピクセル（「{ $width } × { $height }」）；**What it shows,
  in words**（見られない人のための言葉）— 内容を言葉で
- **Made from**（コピーの元になったファイルの名前の前に）— 作成元；
  **Copies made from it** — このファイルから作ったコピー；**Read**
  （ファイルをライブラリの中で読む）— 読む（文字認識の「読み取る」とは別）
- ファイルの列 **People / Year / Title / Publisher** — 著者等 / 年 /
  タイトル / 出版社；**tr. { $names }**（著者の後の訳者。日本の書誌の
  とおり名前の後に）— 「{ $names }訳」（スペースなし）；**Name by the
  reference** — 文献に基づいて名前を付ける
- **mind map** — マインドマップ；Freeplane、FreeMind、XMind、OPML は
  そのまま；**left out**（マインドマップとプロジェクトのあいだで置き場所の
  ないもの）— 除外する（文書の「除外」と同じ語）。それらのプログラムの
  もの：**cloud** — クラウド（Freeplane）；**summary** — サマリー；
  **boundary** — 囲み（XMind）；**hyperlink** — ウェブページやファイルへの
  リンク；**icon / marker** — アイコン / マーカー；**attribute** — 属性
  （Freeplane）；**label** — ラベル（XMind）；**association** — 関連付け
  （Glaukopis の語）；**topic** — トピック；**pictures in texts** —
  テキスト内の画像
- **Save the diagram as SVG… / as an image…** — ダイアグラムをSVGとして
  保存… / 画像として保存…；**PNG image** — PNG画像；大きさは
  「{ $width } × { $height }ピクセル」
- **printing** — 印刷；**Print…** — 印刷…；**Print**（キー）— 印刷；
  **Pages to print** — 印刷するページ；**The one page** — この1ページ；
  **All n pages** — 全{ $count }ページ；**From [3] to [10]**（二つの欄の
  まわりの語。日本語では「ページ [3] ～ [10]」）— 「ページ」と「～」；
  **Preparing / Drawing n pages for printing…** — 印刷のために
  { $count }ページを準備しています… / 描いています…
- 見た目の二つの長さ：**Numbers from the text** — 番号と本文の間隔；
  **Annotations from the text** — 注記と本文の間隔（センチメートル）

## Glaukopisの文言

- **the words / strings**（インターフェースの）— 文言；**a message**
  （Fluentファイルの）— メッセージ；**credits** — クレジット

## よく出るボタン

- **Apply** — 適用；**Cancel** — キャンセル；**Save** — 保存；
  **Delete** — 削除；**Rename** — 名前を変更；**Open** — 開く；
  **Close** — 閉じる；**Add** — 追加（「…を追加」）；**Remove** — 外す
  （削除 Delete とは別。コレクション、文献、引用から外す）；**Done** — 完了；
  **Undo** — 元に戻す；**Redo** — やり直す；**Show** — 表示；
  **Choose…** — 選択…；**Try again** — もう一度試す；**Create** — 作成；
  **Keep**（変更を）— 保存；**Stop** — 中止；**Continue** — 続ける；
  **Back** — 戻る；**Copy** — コピー；**Import** — インポート；
  **Export…** — 書き出す…；**Later** — あとで

## 訳さない名前

`locales/GLOSSARY.md` の末尾のとおり。Glaukopis、Pandoc、Typst、Tesseract、
Hunspell、LaTeX、LuaLaTeX、BibLaTeX、Zotero、CSL、Markdown、Org、
ファイル形式名、フォント名、引用スタイル名、DOI、ISBN、ISSN、ORCID、arXiv、URL。
