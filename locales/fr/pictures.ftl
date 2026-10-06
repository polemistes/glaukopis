# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Images
pictures-all = Toutes les images
pictures-picture = Image
pictures-search-placeholder = Rechercher dans les images
pictures-clear-search = Effacer la recherche
pictures-count = { $count ->
    [one] { $count } image
    [many] { $count } images
   *[other] { $count } images
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } sur { $count ->
    [one] { $count } image
    [many] { $count } images
   *[other] { $count } images
}
pictures-add = Ajouter des images…
pictures-empty = La réserve est vide
pictures-empty-text = Les images que vous ajoutez ici peuvent servir dans tous vos projets, et une image mise dans un texte est gardée ici. Ajoutez-en, ou déposez-les sur cette fenêtre.
pictures-nothing-found = Rien trouvé
pictures-nothing-found-text = Aucune image ne contient tous ces mots.
# What a picture that has no name is called.
pictures-unnamed = Une image
pictures-with-notes = Avec des notes

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Ajouter des images
pictures-files = Images
pictures-taken-in = { $count ->
    [one] « { $name } » est dans la réserve
    [many] { $count } images sont dans la réserve
   *[other] { $count } images sont dans la réserve
}
pictures-remove-title = Retirer « { $name } » de la réserve ?
pictures-remove-unused = Aucun projet n’utilise l’image. Ce qui en est dit ici, et vos notes dessus, sont retirés avec elle.
pictures-remove-used = { $count ->
    [one] { $count } projet utilise l’image. Ses figures resteront sans l’image. Ce qui en est dit ici, et vos notes dessus, sont retirés avec elle.
    [many] { $count } projets utilisent l’image. Leurs figures resteront sans l’image. Ce qui en est dit ici, et vos notes dessus, sont retirés avec elle.
   *[other] { $count } projets utilisent l’image. Leurs figures resteront sans l’image. Ce qui en est dit ici, et vos notes dessus, sont retirés avec elle.
}
pictures-no-backend = Le cœur de l’application ne répond pas.

## One picture

pictures-name = Nom
pictures-name-placeholder = Comment l’image s’appelle
pictures-caption = Légende
pictures-caption-placeholder = Ce qui est dit de l’image
pictures-caption-hint = Les figures faites avec l’image commencent par ces mots. Ce qui est dit d’une figure peut y être changé sans changer ceci.
pictures-italic = Italique
pictures-small-caps = Petites capitales
# What the picture shows, in words, for those who do not see it.
pictures-alt = Montre
pictures-alt-placeholder = En mots, pour qui ne peut pas la voir
pictures-absent = L’image n’est pas sur cet ordinateur. Elle est utilisée dans le projet, et s’affichera quand elle sera arrivée de la personne qui l’y a mise.
pictures-notes = Notes
pictures-note-project = Dans ce projet
pictures-note-project-placeholder = Ce que vous en pensez, pour ce travail
pictures-note-project-hint = Ce qui est écrit ici est chez tous ceux qui ont le projet.
pictures-note-for-all = Garder pour tous les projets
pictures-note-write-for-all = Écrire pour tous les projets
pictures-note-all = Dans tous les projets
pictures-note-all-placeholder = Ce que vous en pensez, où que vous l’utilisiez
pictures-note-all-hint = Gardé avec l’image dans la réserve, sur cet ordinateur.
pictures-note-placeholder = Ce que vous en pensez. Pour vous-même : cela ne fait partie d’aucun document.
pictures-note-label = Vos notes sur cette image
pictures-file = Le fichier
pictures-kind = Type
pictures-kind-svg = SVG, un dessin
pictures-dimensions-label = Largeur et hauteur
pictures-dimensions = { $width } × { $height } points
pictures-size = Taille
# When the picture was taken into the store.
pictures-added = Ajoutée
pictures-used-in = Utilisée dans
pictures-this-project = Ce projet
# A map that has no name.
pictures-untitled = Sans titre
pictures-unused = Aucun projet n’utilise l’image.
pictures-remove = Retirer de la réserve
