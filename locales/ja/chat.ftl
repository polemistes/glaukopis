# The chat of a shared project (record 0092): a tab of the document pane.

chat-title = チャット
chat-between = マップとチャットの境
chat-none = メッセージはまだありません
chat-none-detail = ここに書いたものは、プロジェクトを共有しているすべての人に見え、プロジェクトと一緒に保存されます。本文の一部になることはありません。
chat-write = メッセージを入力
chat-send = 送信
chat-someone = 誰か
# Under the messages, where the project is not shared now: nothing can be written.
chat-not-shared = このプロジェクトは今は共有されていません。
chat-message-menu = メッセージ
chat-deleted = メッセージは削除されました
chat-delete-all = 会話を削除
chat-delete-all-title = 会話を削除しますか？
chat-delete-all-message = このプロジェクトのチャットのメッセージがすべて削除されます。この操作は元に戻せません。
# A message of another that arrived: their name and its first words.
chat-said = { $name }：{ $words }
chat-arrived = { $count ->
    [1] 「{ $project }」に新しいメッセージがあります
   *[other] 「{ $project }」に新しいメッセージが{ $count }件あります
}
chat-show = 表示

# A message answered, set, reacted to, read and changed (record 0107).
chat-answer = 返信
chat-react = リアクション
# In the right-click menu of a message: opens the choosing of an emoji.
chat-react-choose = リアクション…
chat-edit = 編集
# After the words of a message its writer changed.
chat-edited = 編集済み
# Over the field, while an answer is written: $name wrote the message answered.
chat-answering = { $name }への返信
chat-editing = メッセージを編集中
# In the place of a message that was deleted, over its answers.
chat-gone = 削除されたメッセージ
# $names: those who have read a message, as a list.
chat-read-by = 既読：{ $names }
# The button over the foot of the list that leads to new messages not yet seen.
chat-new = { $count ->
    [1] 新しいメッセージ1件
   *[other] 新しいメッセージ{ $count }件
}
# The button under the field that opens the emojis.
chat-emoji = 絵文字
# The tooltip of words quoted at the top of a message: $name wrote the message they are from.
chat-quote-from = { $name }より
