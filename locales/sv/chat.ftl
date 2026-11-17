# The chat of a shared project (record 0092): a tab of the document pane.

chat-title = Chatt
chat-between = Mellan kartan och chatten
chat-none = Inga meddelanden än
chat-none-detail = Det som skrivs här syns för alla som delar projektet, och sparas med det. Det är aldrig en del av texten.
chat-write = Skriv ett meddelande
chat-send = Skicka
chat-someone = Någon
# Under the messages, where the project is not shared now: nothing can be written.
chat-not-shared = Projektet är inte delat nu.
chat-message-menu = Meddelande
chat-deleted = Meddelandet raderades
chat-delete-all = Radera konversationen
chat-delete-all-title = Radera konversationen?
chat-delete-all-message = Alla meddelanden i det här projektets chatt raderas. Det kan inte ångras.
# A message of another that arrived: their name and its first words.
chat-said = { $name }: { $words }
chat-arrived = { $count ->
    [one] Ett nytt meddelande i { $project }
   *[other] { $count } nya meddelanden i { $project }
}
chat-show = Visa

# A message answered, set, reacted to, read and changed (record 0107).
chat-answer = Svara
chat-react = Reagera
# In the right-click menu of a message: opens the choosing of an emoji.
chat-react-choose = Reagera…
chat-edit = Ändra
# After the words of a message its writer changed.
chat-edited = ändrad
# Over the field, while an answer is written: $name wrote the message answered.
chat-answering = Svar till { $name }
chat-editing = Ändrar ett meddelande
# In the place of a message that was deleted, over its answers.
chat-gone = Ett meddelande som raderades
# $names: those who have read a message, as a list.
chat-read-by = Läst av { $names }
# The button over the foot of the list that leads to new messages not yet seen.
chat-new = { $count ->
    [one] 1 nytt meddelande
   *[other] { $count } nya meddelanden
}
# The button under the field that opens the emojis.
chat-emoji = Emojier
# The tooltip of words quoted at the top of a message: $name wrote the message they are from.
chat-quote-from = Från { $name }
