# ある言語の文言をプロジェクトにしたもの。Glaukopisの中で読み通して直し、
# Fluentファイルとして書き戻す（ADR 0034）。言語の設定と、そのような
# プロジェクトの上に出る。locales/README.md を参照。

words-title = Glaukopisの文言の翻訳プロジェクトを作る
words-hint = Glaukopisのユーザーインターフェースの翻訳者向けです。ユーザーも、これを使って、自分のGlaukopisで好きな言語のインターフェースの文言を変えられます。
words-language = 言語
words-make = プロジェクトを作る
words-making = 作成中…
words-make-failed = 文言のプロジェクトを作れませんでした
# $language は言語の名前：「ノルウェー語（ブークモール）」。
words-project-name = 文言：{ $language }
words-not-a-project = このプロジェクトにはGlaukopisの文言がありません。
words-bar = { $language }のGlaukopisの文言です。英語の下の文言を変更してください。変更したものはFluentファイルとして書き戻されます。
words-write = Fluentファイルとして書き出す…
words-writing = 書き出し中…
words-write-choose = その言語のFluentファイルのフォルダー
words-write-failed = 文言を書き出せませんでした
# $count はメッセージの数、$files はファイルの数。
words-written = { $count ->
    [0] 何も変更されていないため、何も書き出しませんでした。
   *[other] { $count }件のメッセージを{ $files }個のファイルに書き出しました。
}
words-result-title = 書き出した文言
words-conflicts = プロジェクトを作った後にファイルで変更されていたため、ファイルのままにしたもの
words-refused = 書き出さなかったもの（プロジェクトで直してください）
# $detail は詳しいこと：もっている変数ともつべき変数、欠けている複数形。
words-refused-fluent = 正しいFluentではありません：{ $detail }
words-refused-variables = 変数が英語のものと違います：{ $detail }
words-refused-reference = 英語にない{ $detail }を参照しています
words-refused-plurals = 複数形がその言語のものと違います：{ $detail }
words-refused-missing = 英語にそのメッセージがないか、メッセージの本文が書かれていません
words-refused-file = 書き出すと、ファイル{ $detail }が読めなくなります

# 変更した文言を、Glaukopisの新しいバージョンを待たずにすぐ使う
# （ADR 0035）：データフォルダーに書き込まれ、Glaukopisに付属の文言の上に
# 重ねられる。
words-use = 今すぐ使う
words-using = 適用中…
words-use-hint = 変更したものを、Glaukopisに付属の文言の代わりに、新しいバージョンを待たずにすぐ使います。Fluentファイルはこれでは書き出されません。
words-use-failed = 文言を適用できませんでした
# $count はメッセージの数。
words-used = { $count ->
    [0] 何も変更されていないため、何も適用しませんでした。
   *[other] { $count }件のメッセージを適用しました。
}
words-used-title = 適用した文言
words-used-refused = 適用しなかったもの（プロジェクトで直してください）
# $languages は言語の名前：「英語、ノルウェー語（ブークモール）」。
words-own-in-use = { $languages }では、Glaukopisに付属の文言の代わりに、変更した文言を使っています。
words-own-remove = 取り除く
words-own-remove-title = 変更した文言を取り除きますか？
words-own-remove-message = { $languages }で使っている変更した文言を取り除き、Glaukopisに付属の文言に戻します。文言のプロジェクトは残ります。
words-own-removed = Glaukopisに付属の文言に戻りました。
words-own-remove-failed = 変更した文言を取り除けませんでした
