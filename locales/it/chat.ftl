# The chat of a shared project (record 0092): a tab of the document pane.

chat-title = Chat
chat-between = Tra la mappa e la chat
chat-none = Ancora nessun messaggio
chat-none-detail = Ciò che si scrive qui lo vedono tutti quelli che condividono il progetto, e resta con il progetto. Non fa mai parte del testo.
chat-write = Scrivi un messaggio
chat-send = Invia
chat-someone = Qualcuno
# Under the messages, where the project is not shared now: nothing can be written.
chat-not-shared = Il progetto ora non è condiviso.
chat-message-menu = Messaggio
chat-deleted = Il messaggio è stato eliminato
chat-delete-all = Elimina la conversazione
chat-delete-all-title = Eliminare la conversazione?
chat-delete-all-message = Tutti i messaggi della chat di questo progetto vengono eliminati. Non si potrà annullare.
# A message of another that arrived: their name and its first words.
chat-said = { $name }: { $words }
chat-arrived = { $count ->
    [one] Un nuovo messaggio in { $project }
    [many] { $count } nuovi messaggi in { $project }
   *[other] { $count } nuovi messaggi in { $project }
}
chat-show = Mostra

# A message answered, set, reacted to, read and changed (record 0107).
chat-answer = Rispondi
chat-react = Reagisci
# In the right-click menu of a message: opens the choosing of an emoji.
chat-react-choose = Reagisci…
chat-edit = Modifica
# After the words of a message its writer changed.
chat-edited = modificato
# Over the field, while an answer is written: $name wrote the message answered.
chat-answering = Risposta a { $name }
chat-editing = Modifica di un messaggio
# In the place of a message that was deleted, over its answers.
chat-gone = Un messaggio che è stato eliminato
# $names: those who have read a message, as a list.
chat-read-by = Letto da { $names }
# The button over the foot of the list that leads to new messages not yet seen.
chat-new = { $count ->
    [one] 1 nuovo messaggio
    [many] { $count } nuovi messaggi
   *[other] { $count } nuovi messaggi
}
# The button under the field that opens the emojis.
chat-emoji = Emoji
# The tooltip of words quoted at the top of a message: $name wrote the message they are from.
chat-quote-from = Da { $name }
