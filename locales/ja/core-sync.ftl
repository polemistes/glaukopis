# What the core says of synchronization between the writer's devices, in English.
# See locales/README.md.

## What is on disk.

# Bytes that should be a change to a document and cannot be read as one. The
# reason is the library's, in English.
core-sync-not-a-change = 文書への変更を読み取れません：{ $why }

## The server.

core-sync-old-server = { $host }のサーバーはこのバージョンのGlaukopisより古く、同期できません。サーバーを更新する必要があります。
core-sync-refused = サーバーはこのデバイスをもう受け付けません。同期するデバイスから外されたか、同期するものがサーバーにもう残っていません。
# Said on a device whose version of Glaukopis is older than the form of something that is synchronized: the synchronization has stopped on it, as a whole, until Glaukopis is updated there. The words are the owner's.
core-sync-update-needed = 同期するには更新が必要です。

## Turning it on, and the devices.

core-sync-not-on = このデバイスは同期されていません。
core-sync-already = このデバイスはすでに同期されています。
core-sync-needs-name = このデバイスに名前を付けてください。
core-sync-remove-self = このデバイスを外すには、ここで同期をやめてください。

## What could not be synchronized. The reason is a sentence of its own.

core-sync-problem-project = 「{ $name }」を同期できませんでした。{ $why }
core-sync-problem-notebook = ノートブックを同期できませんでした。{ $why }
core-sync-problem-library = ライブラリを同期できませんでした。{ $why }
# A file of the library, by the name it has there.
core-sync-file-too-large = 「{ $name }」はサーバーが受け付ける大きさ（{ $most }MBまで）を超えているため、ほかのデバイスにありません。
# The server has no room for more files: how many files on this device were not sent for that, those of the notes apart (core-sync-server-full-notes). Said for as long as it is so.
core-sync-server-full = { $count ->
   *[other] サーバーがいっぱいです。{ $count }個のファイルがほかのデバイスにありません。
}
# The same of the files that notes hold, pictures above all, said before the others.
core-sync-server-full-notes = { $count ->
   *[other] サーバーがいっぱいです。ノートの{ $count }個のファイルがほかのデバイスにありません。
}
core-sync-file-not-sent = 「{ $name }」をサーバーに送れませんでした。{ $why }
core-sync-file-not-fetched = 「{ $name }」をサーバーから取得できませんでした。{ $why }
core-sync-file-not-as-named = サーバーが渡したものは、求めたファイルではありません。途中で、または保存されている場所で壊れました。
# The name of a project that came from another device and says no name of its own.
core-sync-unnamed = 名前なし
