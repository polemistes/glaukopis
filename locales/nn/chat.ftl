# The chat of a shared project (record 0092): a tab of the document pane.

chat-title = Samtale
chat-between = Mellom kartet og samtalen
chat-none = Ingen meldingar enno
chat-none-detail = Det som blir skrive her, ser alle som deler prosjektet, og det blir teke vare på med prosjektet. Det er aldri ein del av teksten.
chat-write = Skriv ei melding
chat-send = Send
chat-someone = Nokon
# Under the messages, where the project is not shared now: nothing can be written.
chat-not-shared = Prosjektet er ikkje delt no.
chat-message-menu = Melding
chat-deleted = Meldinga vart sletta
chat-delete-all = Slett samtalen
chat-delete-all-title = Slette samtalen?
chat-delete-all-message = Alle meldingane i samtalen i dette prosjektet blir sletta. Det kan ikkje angrast.
# A message of another that arrived: their name and its first words.
chat-said = { $name }: { $words }
chat-arrived = { $count ->
    [one] Ei ny melding i { $project }
   *[other] { $count } nye meldingar i { $project }
}
chat-show = Vis

# A message answered, set, reacted to, read and changed (record 0107).
chat-answer = Svar
chat-react = Reager
# In the right-click menu of a message: opens the choosing of an emoji.
chat-react-choose = Reager …
chat-edit = Endre
# After the words of a message its writer changed.
chat-edited = endra
# Over the field, while an answer is written: $name wrote the message answered.
chat-answering = Svar til { $name }
chat-editing = Endrar ei melding
# In the place of a message that was deleted, over its answers.
chat-gone = Ei melding som vart sletta
# $names: those who have read a message, as a list.
chat-read-by = Lesen av { $names }
# The button over the foot of the list that leads to new messages not yet seen.
chat-new = { $count ->
    [one] 1 ny melding
   *[other] { $count } nye meldingar
}
# The button under the field that opens the emojis.
chat-emoji = Emoji
# The tooltip of words quoted at the top of a message: $name wrote the message they are from.
chat-quote-from = Frå { $name }
