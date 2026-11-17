# The chat of a shared project (record 0092): a tab of the document pane.

chat-title = Discussion
chat-between = Entre la carte et la discussion
chat-none = Pas encore de messages
chat-none-detail = Ce qui est écrit ici est vu par tous ceux qui partagent le projet, et gardé avec lui. Cela ne fait jamais partie du texte.
chat-write = Écrivez un message
chat-send = Envoyer
chat-someone = Quelqu’un
# Under the messages, where the project is not shared now: nothing can be written.
chat-not-shared = Le projet n’est pas partagé en ce moment.
chat-message-menu = Message
chat-deleted = Le message a été supprimé
chat-delete-all = Supprimer la conversation
chat-delete-all-title = Supprimer la conversation ?
chat-delete-all-message = Tous les messages de la discussion de ce projet sont supprimés. Cela ne peut pas être annulé.
# A message of another that arrived: their name and its first words.
chat-said = { $name } : { $words }
chat-arrived = { $count ->
    [one] Un nouveau message dans { $project }
    [many] { $count } nouveaux messages dans { $project }
   *[other] { $count } nouveaux messages dans { $project }
}
chat-show = Afficher

# A message answered, set, reacted to, read and changed (record 0107).
chat-answer = Répondre
chat-react = Réagir
# In the right-click menu of a message: opens the choosing of an emoji.
chat-react-choose = Réagir…
chat-edit = Modifier
# After the words of a message its writer changed.
chat-edited = modifié
# Over the field, while an answer is written: $name wrote the message answered.
chat-answering = Réponse à { $name }
chat-editing = Modification d’un message
# In the place of a message that was deleted, over its answers.
chat-gone = Un message qui a été supprimé
# $names: those who have read a message, as a list.
chat-read-by = Lu par { $names }
# The button over the foot of the list that leads to new messages not yet seen.
chat-new = { $count ->
    [one] 1 nouveau message
    [many] { $count } nouveaux messages
   *[other] { $count } nouveaux messages
}
# The button under the field that opens the emojis.
chat-emoji = Émojis
# The tooltip of words quoted at the top of a message: $name wrote the message they are from.
chat-quote-from = Message de { $name }
