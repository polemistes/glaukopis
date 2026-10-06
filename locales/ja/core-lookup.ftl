# What the core says of looking references up in the databases of others,
# in English. See locales/README.md.

## What was typed to be looked up.

core-lookup-not-a-doi = 「{ $doi }」はDOIではありません。
core-lookup-not-arxiv = 「{ $id }」はarXivの識別子ではありません。
core-lookup-not-pubmed = 「{ $id }」はPubMedの番号ではありません。
core-lookup-isbn-length = 「{ $isbn }」はISBNではありません。ISBNは10桁か13桁ですが、これは{ $count }桁です。
core-lookup-isbn-check = 「{ $isbn }」はISBNではありません。最後の桁は他の桁から計算されるものですが、一致しません。打ち間違いはありませんか？
core-lookup-not-isbn = 「{ $isbn }」はISBNではありません。
core-lookup-address = 照会できるのは、DOI、arXivの識別子、PubMedの番号を含むアドレスです。このアドレスには含まれていないので、書名で検索してください。
core-lookup-nothing = 調べるものがありません。

## The services, and what they ask to have said of them.

core-lookup-sikt = ノルウェーの学術図書館（Sikt）
core-lookup-thanks-arxiv = オープンアクセスの相互運用性を利用させてくれたarXivに感謝します。
core-lookup-thanks-sikt = Siktの図書館目録のレコードを含みます。これはノルウェー公共データ・オープンライセンス（NLOD）のもとで公開されています。
# Crossref asked a second time, for the book a chapter is in.
core-lookup-crossref-for-book = Crossref（書籍）

## A service that did not answer as it should. Shown after "network: ".

core-lookup-unreadable = { $service }から読み取れない応答がありました
core-lookup-not-preprints = { $service }からの応答はプレプリントの一覧ではありませんでした
core-lookup-not-articles = { $service }からの応答は論文の一覧ではありませんでした
core-lookup-could-not-answer = { $service }は問い合わせに答えられませんでした：{ $said }
core-lookup-catalogue-could-not-answer = 目録は問い合わせに答えられませんでした：{ $said }
core-lookup-no-reason = 理由は示されていません
core-lookup-catalogue-unreadable = 応答を読み取れませんでした
core-lookup-not-a-catalogue = 応答は目録のものではありませんでした
core-lookup-pubmed-book = { $service }ではこれは書籍またはその一部とされていて、まだ読み取れません
core-lookup-wrong-form = { $host }は求めた形式でレコードを返しません
core-lookup-not-a-record = { $service }：応答は読み取れるレコードではありませんでした。

## What one who takes a record should know of it.

core-lookup-arxiv-published-doi = このプレプリントはその後出版されています。入力したDOIは出版版のものです。出版版を引用するには{ $doi }を照会してください。
core-lookup-arxiv-published = このプレプリントはその後出版されています：{ $journal }。
core-lookup-arxiv-year-only = ここでは年だけが示されています。arXiv:{ $id }を照会すると、プレプリントが投稿された日がわかります。
core-lookup-crossref-in-book = 検索では書籍の編者とISBNは得られません。DOIで照会すれば得られます。
core-lookup-book-unreadable = Crossrefにある書籍の情報を読み取れませんでした。編者が抜けているかもしれません。
core-lookup-book-not-fetched = Crossrefにある書籍の情報を取得できませんでした。編者が抜けているかもしれません。
core-lookup-chapter-author = Crossrefには章の著者が示されていません。書籍の著者を章の著者として入力しました。
core-lookup-group-name = 「{ $name }」は個人名「{ $family }, { $given }」として示されていましたが、団体名として扱いました。
core-lookup-kind-none = レコードに出版物の種類が示されていません。「misc」として入力したので、正しい種別を選んでください。
core-lookup-kind = レコードでは出版物の種類が「{ $kind }」となっています。「misc」として入力したので、正しい種別を選んでください。
core-lookup-publisher-capitals = 出版社名が大文字で「{ $publisher }」となっていたので、「{ $mended }」と書き直しました。
core-lookup-no-creators = レコードに著者も編者も示されていません。
core-lookup-title-capitals = 書名が大文字だったので小文字にしました。固有名詞の頭文字が大文字になっているか確認してください。
core-lookup-name-capitals = 名前「{ $family }」が大文字だったので、「{ $mended }」と書き直しました。
core-lookup-pubmed-translated = PubMedでは書名を英語で「{ $title }」と訳しています。
core-lookup-pubmed-translation = この書名はPubMedによる英訳です。論文の言語での書名は示されていません。
core-lookup-parallel-title = レコードには別の言語での書名もありますが、入力していません：「{ $title }」。
core-lookup-original-script = 書名は目録がラテン文字で書いたとおりに入力しています。元の文字では「{ $title }」です。
core-lookup-unplaced-name = レコードは{ $name }を挙げていますが、役割が示されていません。この名前は入力していません。
core-lookup-thesis = この書籍は学位論文でもあります：{ $said }。
core-lookup-ebook = 電子書籍のレコードです。出版地・出版社・年は電子版のものです。
core-lookup-sound = 録音資料です。
core-lookup-audio-book = オーディオブックのレコードです。
core-lookup-not-text = このレコードはテキストのものではありません。可能な形で入力したので、正しい種別を選んでください。
core-lookup-other-form = 求めたISBNは、この書籍の別の形態のものです。このレコードが記述するもののISBNは{ $isbn }です。
core-lookup-other-isbn = レコードには求めたISBNがありません。記述されているもののISBNは{ $isbn }です。
# Where the record has no ISBN of its own: "The ISBN of what it describes is none."
core-lookup-isbn-none = なし
core-lookup-another-edition = 同じISBNの別の版です（{ $which }）。
# Which edition, in the brackets of the message above.
core-lookup-edition-year = 第{ $edition }版、{ $year }年
core-lookup-without-year = 刊年なし
