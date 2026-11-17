# 他のプログラムからノートブックに取り込むノートについて、中核が言うこと。
# locales/README.md を参照。

## 読み込むものを調べる。

# $name is the folder or the file chosen.
core-notes-nothing-found = 「{ $name }」には、Glaukopisが読み込めるノートがありません。Markdownやテキストのファイル（.md、.markdown、.txt）、Evernoteの書き出し（.enex）、Google Keepのノート（.json）、OneNoteのセクション（.one）のいずれもありません。
# $message says why Pandoc cannot be used.
core-notes-without-pandoc = Markdownで書かれたノートはPandocが読み込みますが、今は読み込めません：{ $message }
core-notes-evernote-links = Evernoteの書き出しには、リンクがどのノートにつながっているかが含まれていません。そのようなリンクの語句は残りますが、ノート間のリンクは残りません。
# $count is how many pages hold handwriting or drawings.
core-notes-onenote-ink = { $count ->
   *[other] 手書きまたは描画を含むページが{ $count }ページあり、読み込まれません。
}

## 読み込み。

core-notes-stopped = ノートの読み込みを中止しました。
# $name is the note's name, or its file; $message says what went wrong.
core-notes-unreadable = ノート「{ $name }」を読み込めませんでした：{ $message }
# $note is the note's name; $name the picture or file; $why one of the reasons below, or another.
core-notes-picture-left-out = ノート「{ $note }」では、「{ $name }」を除外しました：{ $why }。
core-notes-file-unreadable = ファイルを読み込めませんでした
core-notes-picture-outside = 読み込むフォルダーの外にあり、取り込まれるのはそのフォルダーとその下のファイルだけです
core-notes-picture-not-found = 読み込んだ内容の中に見つかりませんでした
core-notes-too-large = 「{ $file }」はGlaukopisが読み込める大きさを超えているため、除外しました。
core-notes-evernote-unreadable = 「{ $file }」をEvernoteの書き出しとして読み込めませんでした：{ $message }
# $file is a file of OneNote, or a page of one; $message says what went wrong.
core-notes-onenote-unreadable = 「{ $file }」をOneNoteのファイルとして読み込めませんでした：{ $message }
core-notes-onenote-broke = 「{ $file }」をOneNoteのファイルとして読み込めませんでした：読み込みが途中で止まりました。
core-notes-onenote-not-started = OneNoteのファイルを読み込めませんでした。読み込みのためのプロセスを開始できなかったためです：{ $message }
# $why is one of the two reasons below, or another.
core-notes-onenote-given-up = OneNoteのファイルの読み込みを断念しました：{ $why }
core-notes-onenote-time = 時間がかかりすぎました
core-notes-onenote-memory = 許されるメモリを超えました
core-notes-onenote-not-stored = OneNoteがファイルに保存していませんでした
core-notes-encrypted = { $count ->
   *[other] { $count }件のノートに、Evernoteが暗号化して保持しているテキストが含まれています。そのテキストは除外しました。
}
