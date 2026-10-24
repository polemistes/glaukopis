# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first }、{ $second }
core-library-three-names = { $first }、{ $second }、{ $third }
core-library-et-al = { $first }ほか
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
   *[other] { $names }編
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = { $line }行目：{ $message }
core-library-line-sentence = { $line }行目：{ $message }。
core-library-key-changed = キー「{ $from }」を「{ $to }」に変更しました
core-library-no-entry = ここには項目がありません。項目は@とその種別で始まります。例：@book{"{"}key, …{"}"}
core-library-many-entries = ここには項目が{ $count }件あります。一件だけにしてください。

## Changing a reference.

core-library-bad-key = 「{ $key }」は引用キーに使えません。
core-library-key-letters = 引用キーに使えるのは英字、数字と- _ : .だけです。「{ $key }」ではどうでしょう。
core-library-key-taken = 引用キー「{ $key }」はすでに使われています。
core-library-no-type = この文献には出版物の種別がありません。
core-library-not-a-type = 「{ $kind }」は出版物の種別ではありません。
core-library-merge-itself = 項目をそれ自身と統合することはできません。

## What was not found, shown after "not found: ".

core-library-the-reference = 文献
core-library-the-stored-file = 保管場所のファイル{ $path }
core-library-the-file = ファイル{ $path }
core-library-the-collection = コレクション
core-library-the-collection-to-put-in = 入れる先のコレクション
core-library-the-collection-to-move-to = 移動先のコレクション

## Collections.

core-library-collection-needs-name = コレクションには名前が必要です。
core-library-collection-exists = ここにはすでに「{ $name }」という名前のコレクションがあります。
core-library-collection-in-itself = コレクションをそれ自身の中に入れることはできません。

## The files of references.

core-library-not-in-library = 「{ $path }」はライブラリ内のパスではありません
core-library-not-a-file = { $path }はファイルではありません

## The files of the library and their folders.

core-library-the-file-of-library = ライブラリのファイル
core-library-the-folder = フォルダー
core-library-needs-name = 名前が必要です。
core-library-name-too-long = その名前は長すぎます。
core-library-folder-in-itself = フォルダーをそれ自身の中に入れることはできません。
# Why a file was not given to the reference chosen for it, when files are gone through.
core-library-assign-file-gone = ファイルを文献に割り当てられませんでした。そのファイルはもうライブラリのファイルの中にありません。
core-library-assign-reference-gone = 「{ $name }」を文献に割り当てられませんでした。その文献はもうライブラリにありません。
core-library-assign-stored-gone = 「{ $name }」を文献に割り当てられませんでした。ファイルはもう、ライブラリが保管している場所（{ $path }）にありません。
# The record of the files could not be read; it was put aside under another name.
core-library-files-unreadable = ライブラリのファイルの記録を読み取れなかったため、{ $path }として別に取っておきました：{ $message }
# The library file has bytes that are not UTF-8, as an editor that saves in Latin-1 writes them; $aside is the name of the copy kept in the same folder.
core-library-not-utf8 = { $path }には、UTF-8でない文字が含まれています。別のエンコーディングで保存するエディターが書き込むような文字です。これらは�として読み取られ、そのまま書き込まれます。元のままのファイルは、同じフォルダーに{ $aside }として残してあります。
