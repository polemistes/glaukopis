# The chat of a shared project (record 0092): a tab of the document pane.

chat-title = Chat
chat-between = Zwischen Karte und Chat
chat-none = Noch keine Nachrichten
chat-none-detail = Was hier geschrieben wird, sehen alle, die das Projekt teilen, und es bleibt beim Projekt. Es wird nie Teil des Textes.
chat-write = Schreiben Sie eine Nachricht
chat-send = Senden
chat-someone = Jemand
# Under the messages, where the project is not shared now: nothing can be written.
chat-not-shared = Das Projekt ist gerade nicht geteilt.
chat-message-menu = Nachricht
chat-deleted = Die Nachricht wurde gelöscht
chat-delete-all = Die Unterhaltung löschen
chat-delete-all-title = Die Unterhaltung löschen?
chat-delete-all-message = Alle Nachrichten im Chat dieses Projekts werden gelöscht. Das kann nicht rückgängig gemacht werden.
# A message of another that arrived: their name and its first words.
chat-said = { $name }: { $words }
chat-arrived = { $count ->
    [one] Eine neue Nachricht in { $project }
   *[other] { $count } neue Nachrichten in { $project }
}
chat-show = Zeigen

# A message answered, set, reacted to, read and changed (record 0107).
chat-answer = Antworten
chat-react = Reagieren
# In the right-click menu of a message: opens the choosing of an emoji.
chat-react-choose = Reagieren…
chat-edit = Ändern
# After the words of a message its writer changed.
chat-edited = geändert
# Over the field, while an answer is written: $name wrote the message answered.
chat-answering = Antwort an { $name }
chat-editing = Eine Nachricht ändern
# In the place of a message that was deleted, over its answers.
chat-gone = Eine gelöschte Nachricht
# $names: those who have read a message, as a list.
chat-read-by = Gelesen von { $names }
# The button over the foot of the list that leads to new messages not yet seen.
chat-new = { $count ->
    [one] 1 neue Nachricht
   *[other] { $count } neue Nachrichten
}
# The button under the field that opens the emojis.
chat-emoji = Emojis
# The tooltip of words quoted at the top of a message: $name wrote the message they are from.
chat-quote-from = Von { $name }
