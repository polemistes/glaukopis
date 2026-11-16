# The chat of a shared project (record 0092): a tab of the document pane.

chat-title = Chat
chat-between = Between the map and the chat
chat-none = No messages yet
chat-none-detail = What is written here is seen by everyone who shares the project, and kept with it. It is never part of the text.
chat-write = Write a message
chat-send = Send
chat-someone = Someone
# Under the messages, where the project is not shared now: nothing can be written.
chat-not-shared = The project is not shared now.
chat-message-menu = Message
chat-deleted = The message was deleted
chat-delete-all = Delete the conversation
chat-delete-all-title = Delete the conversation?
chat-delete-all-message = Every message of this project’s chat is deleted. This cannot be undone.
# A message of another that arrived: their name and its first words.
chat-said = { $name }: { $words }
chat-arrived = { $count ->
    [one] A new message in { $project }
   *[other] { $count } new messages in { $project }
}
chat-show = Show

# A message answered, set, reacted to, read and changed (record 0107).
chat-answer = Answer
chat-react = React
# In the right-click menu of a message: opens the choosing of an emoji.
chat-react-choose = React…
chat-edit = Change
# After the words of a message its writer changed.
chat-edited = changed
# Over the field, while an answer is written: $name wrote the message answered.
chat-answering = Answer to { $name }
chat-editing = Changing a message
# In the place of a message that was deleted, over its answers.
chat-gone = A message that was deleted
# $names: those who have read a message, as a list.
chat-read-by = Read by { $names }
# The button over the foot of the list that leads to new messages not yet seen.
chat-new = { $count ->
    [one] 1 new message
   *[other] { $count } new messages
}
# The button under the field that opens the emojis.
chat-emoji = Emojis
# The tooltip of words quoted at the top of a message: $name wrote the message they are from.
chat-quote-from = From { $name }
