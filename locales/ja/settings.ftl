# 設定。

settings-title = 設定
settings-error-system = アプリケーションについての情報の一部を読み込めませんでした
settings-error-read = 設定を読み込めませんでした
settings-error-save = 設定を保存できませんでした
settings-error-fonts = このコンピューターのフォントを一覧にできませんでした
settings-error-templates = テンプレートを一覧にできませんでした
# 壊れた設定ファイルは名前を変えて、もとの場所の隣に残した。$path は今それがある場所。
settings-set-aside = 設定を読み込めなかったため、{ $path }に退避しました。既定の設定を使います
settings-set-aside-person = 設定を読み込めなかったため、{ $path }に退避しました。既定の設定を使います。プロジェクトの履歴では、このコンピューターは新しい人として扱われます

## 外観

settings-appearance = 外観
settings-theme = 配色
settings-theme-system = システムに合わせる
settings-theme-light = ライト
settings-theme-dark = ダーク
# パステルカラーの配色。温かくやわらかい。
settings-theme-mellow = やわらか
settings-theme-own = 独自
settings-own = 独自の配色
settings-own-paper = 紙
settings-own-ink = インク
settings-own-accent = アクセント
settings-own-gold = 第二の色
settings-own-begin = もとにする配色
# 紙に対するインクとアクセントのコントラスト比。WCAG の数え方で。4.5 と 3 が読みやすい値。
settings-own-weak = 読みにくい配色です。紙に対するコントラスト比は、インクが{ $ink }対1、アクセントが{ $accent }対1です。それぞれ4.5以上、3以上なら読みやすくなります。
settings-text-size = テキストエディターの文字の大きさ
settings-editor-font = エディターのフォント
settings-editor-font-default = インターフェースと同じ（Literata）
# マップのテキストが、各要素の深さをどう示すか。画面上だけのこと。
# テキストエディターが、各要素の深さをどう示すか。画面上だけのこと。
settings-text-depth = 文書の構造
settings-text-depth-numbers = 番号
settings-text-depth-dots = 点
settings-text-depth-indent = 字下げと線
# 見出しが印字する番号を、テキストビューとダイアグラムで名前の前に表示するかどうか。アウトラインには常に表示される。
settings-heading-numbers = 見出しの番号（文書に印字されるとおり）
settings-heading-numbers-shown = 表示
settings-heading-numbers-hidden = 非表示
settings-interface-size = インターフェースの大きさ
# 選んだ大きさのテキストの一行。字の形を見せる。そのあとにホメロスの
# ギリシア語の一行が続く。
# その言語のアルファベットの文字をすべて含む文（パングラム）。選んだ大きさと
# フォントで組む。よいパングラムが知られていないときは、アルファベット。
# 日本語では、かなをすべて一度ずつ使ういろは歌。
settings-sample = いろはにほへと　ちりぬるを　わかよたれそ　つねならむ　うゐのおくやま　けふこえて　あさきゆめみし　ゑひもせす
# 文書の構造の見本の三つのレベル。見本の文は三つ目の下に来る。
settings-sample-heading = 見出し
settings-sample-subheading = 小見出し
settings-sample-third = 3番目のレベル

## 新しい文書

settings-new-documents = 新しい文書

## ユーザー

settings-you = ユーザー情報
settings-first-name = 名
settings-last-name = 姓
settings-organization = 組織
settings-position = 肩書き・役職
settings-address = 住所
settings-phone = 電話番号
settings-email = メールアドレス
settings-orcid = ORCID
settings-orcid-problem = ORCID iDは4桁の数字を4組並べたものです：0000-0002-1825-0097。
settings-contact-problem = アドレスとして正しくないようです。

## プログラム：PandocとTypst

settings-programs = プログラム
settings-pandoc-need = プレビューとすべての書き出しに必要です。
settings-looking = 探しています…
# need はそのプログラムが何に必要か：settings-pandoc-need。
settings-program-missing = 見つかりません。{ $need }システムのパッケージマネージャーでインストールするか、下で場所を指定してください。
settings-program-old = Glaukopisに必要なものより古いバージョンです。{ $least }以降が必要です。
# プログラムの場所を入れる欄と、それを選ぶダイアログの題。
settings-program-where = { $program }の場所
settings-program-found-by-itself = 自動で検出
settings-no-latex = LaTeXは見つかりませんでした。なくてもかまいません。LaTeXのソースはLaTeXなしで書き出せ、PDFはTypstで作成します。
settings-look-again = もう一度探す
settings-error-programs = プログラムを探せませんでした

## このアプリについて

settings-about = Glaukopisについて
settings-licence = GNU General Public Licenseバージョン3またはそれ以降のもとで配布されるフリーソフトウェアです。無保証です。
settings-data = データの保存場所

## 言語

settings-language = 言語
settings-language-interface = インターフェース
settings-language-system = システムに合わせる（{ $language }）
settings-language-texts = 新しいテキストの言語
# インターフェースに選んだ言語の文言を読み込めなかった。インターフェースはそれまでの言語のまま。
settings-language-error-load = { $language }の文言を読み込めませんでした

## 実行のログ。

settings-logs = ログ

## プレビューの行が何であるか：ページの端のラベルがそれを示すかどうか。

settings-page-chips-on = オン
settings-page-chips-off = オフ

## わかりやすい言葉での設定、第1段階：新しいプロジェクトと文書の既定、見た目ラベル。

# 新しいプロジェクトをダイアグラムで開くかテキストで開くか。選択肢は二つの表示の名前。
settings-default-view = 新しいプロジェクトの既定の表示
settings-default-type = 既定の文書種別
settings-default-look = 既定の見た目
settings-default-style = 既定の引用スタイル
# 三つの既定のそれぞれの最初の選択肢：なし。新しい文書は無地の種別になり、その種別の見た目とスタイルに従う。
settings-default-none = なし（文書種別のとおり）
# プレビューの行を押したとき、それが何かを言い、そこで見た目の欄を開くラベルをページの端に出すかどうか。
settings-look-chips = プレビューに見た目ラベルを表示する
