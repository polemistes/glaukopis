# 中核が、インポートするスペルチェックとOCRの言語について言うこと
# （ADR 0032）。locales/README.md を見よ。

# $message はそのどこが悪かったか。
core-packages-manifest = パッケージのマニフェストを読み込めません：{ $message }
# $file はファイルの名前。$message はそのどこが悪かったか。
core-packages-not-zip = 「{ $file }」をzipファイルとして読み込めません：{ $message }
core-packages-too-large = 「{ $file }」は言語パッケージとしては大きすぎます。
core-packages-nothing = 選んだものの中に、スペルチェックの辞書（.affと.dicのファイル）もTesseractのデータ（.traineddataファイル）もありません。
# $name はパッケージがファイルに付けるはずの名前。
core-packages-bad-name = 「{ $name }」は言語の名前にできません。名前は英字、数字、_、-からなり、nb_NOやnorのように言語で始まります。
core-packages-empty = 「{ $file }」は空です。
# $url はアドレス。$message は何がうまくいかなかったか。
core-packages-fetch-failed = { $url }を取得できませんでした：{ $message }
core-packages-fetch-status = { $url }を取得できませんでした。サーバーの応答は{ $status }でした。
# $server はサーバーのアドレス、またはフォルダー。
core-packages-index = { $server }が提供するものを読み込めません：{ $message }
core-packages-checksum = 「{ $file }」は、サーバーが示したものと一致しません。何もインポートしていません。あとでもう一度試してください。
