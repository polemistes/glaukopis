# 文書とプレビューの作成、引用スタイル、文書のレイアウトについて、
# 中核が言うこと。locales/README.md を参照。

## 文書を作成する。

core-export-picture-missing = 画像「{ $name }」はこのコンピューターにないため、文書から除かれます。
# 画像庫にあって、文書を作成する場所に置けなかった画像：$error は最初のものが置けなかった理由。
core-export-files-not-placed = { $count ->
    [1] 画像のファイルを文書を作成する場所に置けなかったため、その画像は文書から除かれます：{ $error }
   *[other] 画像{ $count }枚のファイルを文書を作成する場所に置けなかったため、それらの画像は文書から除かれます：{ $error }
}
core-export-cover-left-out = 表紙の画像を本を作成する場所に置けなかったため、本には表紙がありません：{ $error }
core-export-astray = { $count ->
   *[other] テキスト中の相互参照{ $count }件が、文書にないものを指しています。[?]として組まれます。
}
core-export-latex-font = { $font }がインストールされていません。文書はLaTeXに備わっているフォント、Latin Modernで組まれます。
# インターフェースが送り直さず、保持もされなかったプレビューのテキスト：インターフェースはそれをすべて送る。
core-export-lacking = 文書のテキスト{ $count }件が送られておらず、保持もされていません。
# 「見つかりません：」の後に示す。
core-export-preview-document = プレビューの文書
core-export-reading-pdf = 作成したPDFの読み込み
core-export-reading-made = 作成した文書の読み込み

## ひな形文書。WordとOpenDocumentはこれからスタイルを取る。

core-export-pattern-unreadable = ひな形文書を読み込めませんでした：{ $error }
core-export-pattern-lacks = ひな形文書に{ $name }がありません
core-export-pattern-reading = ひな形文書の読み込み
core-export-pattern-writing = ひな形文書の書き込み

## 数式。書いているところに示すもの。

core-export-formula-incomplete = 数式が完結する前に終わっています。
# コマンドは書かれたとおり：\frac。
core-export-formula-unknown = { $command }は不明です。
core-export-formula-unexpected = この位置に{ $what }は置けません。
core-export-formula-unreadable = 数式を読み取れませんでした。
core-export-formula-too-long = 数式が長すぎます。

## 引用スタイル。

core-export-style-bad-id = 「{ $id }」はスタイルのIDにできません
core-export-not-a-style = これはスタイルではありません：{ $error }。
core-export-not-a-style-begin = これはスタイルではありません。<style>で始まっていません。
core-export-dependent-style = このスタイルは別のスタイルの名前を挙げ、その書き方を借りているだけです。そのスタイルを名前で取得してください。
core-export-style-unreadable = スタイルを読み戻せませんでした。
core-export-style-needs-name = スタイルには名前が必要です。
core-export-style-own-only = 削除できるのは独自のスタイルだけです。
# 「見つかりません：」の後に示す。
core-export-the-reference-style = 引用スタイル「{ $id }」
core-export-any-reference-style = 引用スタイル
core-export-the-style = スタイル「{ $id }」

## 文書のレイアウト。

core-export-format-bad-id = 「{ $id }」はレイアウトのIDにできません
core-export-format-needs-name = レイアウトには名前が必要です。
core-export-format-own-only = 削除できるのは独自のレイアウトだけです。
core-export-not-a-length = 「{ $length }」は長さではありません
# 「見つかりません：」の後に示す。
core-export-the-format = レイアウト「{ $id }」

## テンプレート。

core-export-template-bad-id = 「{ $id }」はテンプレートのIDにできません
core-export-template-needs-name = テンプレートには名前が必要です。
core-export-template-own-only = 削除できるのは独自のテンプレートだけです。
core-export-the-template = テンプレート「{ $id }」
core-export-output-not-yet = テンプレートの出力「{ $id }」はまだ作成できません。作成できるのは文書だけです。
core-export-output-unknown = テンプレートに出力「{ $id }」はありません。

## わかりやすい言葉での設定、第5段階：LaTeXのハイフネーション。

core-export-latex-no-hyphenation = LaTeXには{ $language }のハイフネーションのパターンがありません。TeX Liveのその言語のパッケージをインストールするまで（Archでは、ほとんどのヨーロッパ言語はtexlive-langeuropean）、語は英語と同じように分割されます。
