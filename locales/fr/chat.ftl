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
