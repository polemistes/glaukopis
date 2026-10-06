# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = 画像「{ $name }」はこのコンピューターにないため、文書から除かれます。
core-export-astray = { $count ->
   *[other] テキスト中の相互参照{ $count }件が、文書にないものを指しています。[?]として組まれます。
}
core-export-latex-font = { $font }がインストールされていません。文書はLaTeXに備わっているフォント、Latin Modernで組まれます。
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = 文書のテキスト{ $count }件が送られておらず、保持もされていません。
# Shown after "not found: ".
core-export-preview-document = プレビューの文書
core-export-reading-pdf = 作成したPDFの読み込み
core-export-reading-made = 作成した文書の読み込み

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = ひな形文書を読み込めませんでした：{ $error }
core-export-pattern-lacks = ひな形文書に{ $name }がありません
core-export-pattern-reading = ひな形文書の読み込み
core-export-pattern-writing = ひな形文書の書き込み

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = 数式が完結する前に終わっています。
# The command is as it was written: \frac.
core-export-formula-unknown = { $command }は不明です。
core-export-formula-unexpected = この位置に{ $what }は置けません。
core-export-formula-unreadable = 数式を読み取れませんでした。
core-export-formula-too-long = 数式が長すぎます。

## Reference styles.

core-export-style-bad-id = 「{ $id }」はスタイルのIDにできません
core-export-not-a-style = これはスタイルではありません：{ $error }。
core-export-not-a-style-begin = これはスタイルではありません。<style>で始まっていません。
core-export-dependent-style = このスタイルは別のスタイルの名前を挙げ、その形式を借りているだけです。そのスタイルを名前で取得してください。
core-export-style-unreadable = スタイルを読み戻せませんでした。
core-export-style-needs-name = スタイルには名前が必要です。
core-export-style-own-only = 削除できるのは自分で作ったスタイルだけです。
# Shown after "not found: ".
core-export-the-reference-style = 引用スタイル「{ $id }」
core-export-any-reference-style = 引用スタイル
core-export-the-style = スタイル「{ $id }」

## Document formats.

core-export-format-bad-id = 「{ $id }」は書式のIDにできません
core-export-format-needs-name = 書式には名前が必要です。
core-export-format-own-only = 削除できるのは自分で作った書式だけです。
core-export-not-a-length = 「{ $length }」は長さではありません
# Shown after "not found: ".
core-export-the-format = 書式「{ $id }」
