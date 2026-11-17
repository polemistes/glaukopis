# The chat of a shared project (record 0092): a tab of the document pane.

chat-title = Chat
chat-between = Mellem kortet og chatten
chat-none = Ingen beskeder endnu
chat-none-detail = Det, der skrives her, ses af alle, der deler projektet, og gemmes med det. Det er aldrig en del af teksten.
chat-write = Skriv en besked
chat-send = Send
chat-someone = Nogen
# Under the messages, where the project is not shared now: nothing can be written.
chat-not-shared = Projektet er ikke delt nu.
chat-message-menu = Besked
chat-deleted = Beskeden blev slettet
chat-delete-all = Slet samtalen
chat-delete-all-title = Slet samtalen?
chat-delete-all-message = Alle beskeder i dette projekts chat slettes. Det kan ikke fortrydes.
# A message of another that arrived: their name and its first words.
chat-said = { $name }: { $words }
chat-arrived = { $count ->
    [one] En ny besked i { $project }
   *[other] { $count } nye beskeder i { $project }
}
chat-show = Vis

# A message answered, set, reacted to, read and changed (record 0107).
chat-answer = Svar
chat-react = Reager
# In the right-click menu of a message: opens the choosing of an emoji.
chat-react-choose = Reager…
chat-edit = Ændr
# After the words of a message its writer changed.
chat-edited = ændret
# Over the field, while an answer is written: $name wrote the message answered.
chat-answering = Svar til { $name }
chat-editing = Ændrer en besked
# In the place of a message that was deleted, over its answers.
chat-gone = En besked, der blev slettet
# $names: those who have read a message, as a list.
chat-read-by = Læst af { $names }
# The button over the foot of the list that leads to new messages not yet seen.
chat-new = { $count ->
    [one] 1 ny besked
   *[other] { $count } nye beskeder
}
# The button under the field that opens the emojis.
chat-emoji = Emojis
# The tooltip of words quoted at the top of a message: $name wrote the message they are from.
chat-quote-from = Fra { $name }
