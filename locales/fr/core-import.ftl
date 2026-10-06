# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = texte collé
core-import-files = { $count ->
    [one] { $count } fichier
    [many] { $count } fichiers
   *[other] { $count } fichiers
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Le fichier « { $name } » n’a pas été trouvé.
core-import-empty-entry = Ligne { $line } : l’entrée « { $key } » est vide et a été laissée de côté.
# Where in a file a reference that has no key was found.
core-import-origin-line = ligne { $line }
core-import-origin-key-line = { $key }, ligne { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = « { $title } »
core-import-merge-gone = { $reference } : l’entrée avec laquelle fusionner n’est plus là

## PDF files.

core-import-not-a-pdf = { $name } n’est pas un PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Les informations viennent de { $service }.
core-import-number-unknown = Un numéro a été trouvé dans le fichier, mais les bases de données n’en savent rien ; les informations viennent du fichier lui-même et sont à vérifier.
core-import-databases-failed = Les bases de données n’ont pas pu être interrogées ({ $error }) ; les informations viennent du fichier lui-même et sont à vérifier.

## Zotero.

core-import-zotero-my-library = Ma bibliothèque
core-import-zotero-group = Groupe { $id }
core-import-zotero-the-library = la bibliothèque { $id } dans Zotero
core-import-zotero-own-library = la bibliothèque personnelle de l’utilisateur dans Zotero
core-import-zotero-the-collection = la collection { $key } dans Zotero
core-import-zotero-unknown-base = Le fichier « { $name } » n’a pas été trouvé. Zotero y renvoie depuis un dossier de son choix, qui n’est pas connu ici.
core-import-zotero-empty-item = L’entrée { $key } de Zotero est vide et a été laissée de côté.
core-import-zotero-alone = { $count ->
    [one] { $count } fichier ou note n’est rattaché à aucune référence dans Zotero, et a été laissé de côté.
    [many] { $count } fichiers et notes ne sont rattachés à aucune référence dans Zotero, et ont été laissés de côté.
   *[other] { $count } fichiers et notes ne sont rattachés à aucune référence dans Zotero, et ont été laissés de côté.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero donne { $name } comme { $role }, ce pour quoi BibLaTeX n’a pas de champ. Le nom a été laissé de côté.
core-import-zotero-left-out = Le champ « { $field } » de Zotero n’a pas d’équivalent dans BibLaTeX et a été laissé de côté : { $value }

## Zotero's database.

core-import-zotero-no-database = une base de données Zotero ({ $file }) dans { $path }
core-import-zotero-copying = copie de { $path } vers un dossier temporaire
core-import-zotero-empty = le fichier est vide
core-import-zotero-disturbed = Zotero écrivait dans sa base de données pendant qu’elle était lue. S’il manque quelque chose, fermez Zotero et importez de nouveau.
core-import-zotero-backup-read = La base de données de Zotero n’a pas pu être lue ({ $error }). Sa sauvegarde, { $backup }, a été lue à la place : ce qui a changé dans Zotero depuis cette sauvegarde manque.
core-import-zotero-not-a-database = { $path } n’est pas une base de données de Zotero.
core-import-zotero-unreadable = La base de données de Zotero a une forme qui ne peut pas être lue ici : { $what }. Si elle a été écrite par une ancienne version de Zotero, l’ouvrir une fois dans une version actuelle la met à jour.
core-import-zotero-unreadable-version = La base de données de Zotero a une forme qui ne peut pas être lue ici (version { $version } de la base de données de Zotero) : { $what }. Si elle a été écrite par une ancienne version de Zotero, l’ouvrir une fois dans une version actuelle la met à jour.
core-import-zotero-no-table = la table « { $table } » manque
core-import-zotero-no-column = la table « { $table } » n’a pas de colonne « { $column } »
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = La base de données de Zotero n’a pas de table « { $table } » de la forme connue ici : { $consequence }.
core-import-zotero-no-bin = les entrées de la corbeille de Zotero ne peuvent pas être distinguées des autres
core-import-zotero-no-collections = les collections n’ont pas été lues
core-import-zotero-no-attachments = les fichiers joints n’ont pas été lus
core-import-zotero-no-notes = les notes n’ont pas été lues
core-import-zotero-no-keywords = les mots-clés n’ont pas été lus
core-import-zotero-no-group-names = les noms des bibliothèques de groupe ne sont pas connus

## PDF files, as they are read for a reference.

core-import-pdf-empty = Le fichier « { $name } » est vide.
core-import-pdf-not-a-pdf = Le fichier « { $name } » n’est pas un PDF.
core-import-pdf-unreadable = Le fichier n’a pas pu être lu : il est abîmé, protégé par un mot de passe, ou trop gros.
core-import-pdf-scan = Le fichier n’a pas de couche de texte : c’est une numérisation.
core-import-pdf-from-file = Les informations viennent du fichier lui-même, non d’un catalogue, et sont à vérifier.
core-import-pdf-from-metadata = Aucun DOI ni ISBN n’a été trouvé dans le fichier ; les informations viennent des métadonnées du fichier et sont à vérifier.
core-import-pdf-unknown = Aucun DOI ni ISBN n’a été trouvé dans le fichier, et ses métadonnées ne disent pas ce qu’il est : les informations sont à remplir.

## Tables, from files of text and of sheets.

core-import-table-too-large = Le fichier fait { $size } Mo. Un tableau est lu dans un fichier de { $most } Mo au plus.
core-import-table-kinds = Les tableaux sont lus dans les fichiers CSV et autres textes dont les valeurs sont séparées par des virgules, des points-virgules ou des tabulations, et dans les feuilles de LibreOffice (.ods) et d’Excel (.xlsx, .xls).
core-import-table-empty = Il n’y a rien dans le fichier.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = Le tableau a { $rows } lignes. Un tableau dans un texte peut en avoir { $most } au plus : ce n’est pas une feuille de calcul.
core-import-table-columns = Le tableau a { $columns } colonnes. Un tableau dans un texte peut en avoir { $most } au plus : ce n’est pas une feuille de calcul.
core-import-table-more-than = plus de { $count }

## Documents brought in, to become maps.

core-import-document-stopped = La lecture a été arrêtée.
core-import-pdfs-stopped = L’identification des fichiers a été arrêtée. Rien n’a été ajouté.
core-import-document-kind = « { $file } » n’est pas d’un type qui puisse être importé comme document. Le sont Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst et le texte brut.
core-import-document-too-large = « { $file } » fait plus de 50 Mo, ce qui est plus que ce qui peut être importé comme document.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = « { $file } » n’a pas pu être lu comme { $kind }. Il est peut-être abîmé, ou d’un autre type que son nom ne le dit. Pandoc, qui le lit, a dit : { $message }
core-import-document-pandoc-unreadable = ce que Pandoc a fait de « { $file } » n’a pas pu être lu : { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Sans titre
core-import-document-plain-text = texte brut
core-import-document-notebook = carnet Jupyter

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] { $count } citation a été trouvée qui n’est pas encore liée à une référence de votre bibliothèque ; elle a été faite par un logiciel de gestion bibliographique. Elle reste le texte tel qu’il a été écrit, et peut être passée en revue quand la carte est faite, et plus tard.
       *[none] { $count } citation a été trouvée qui n’est pas encore liée à une référence de votre bibliothèque. Elle reste le texte tel qu’il a été écrit, et peut être passée en revue quand la carte est faite, et plus tard.
    }
    [many] { $made ->
        [all] { $count } citations ont été trouvées qui ne sont pas encore liées à des références de votre bibliothèque, toutes faites par un logiciel de gestion bibliographique. Elles restent le texte tel qu’il a été écrit, et peuvent être passées en revue quand la carte est faite, et plus tard.
        [some] { $count } citations ont été trouvées qui ne sont pas encore liées à des références de votre bibliothèque, dont { $some } faites par un logiciel de gestion bibliographique. Elles restent le texte tel qu’il a été écrit, et peuvent être passées en revue quand la carte est faite, et plus tard.
       *[none] { $count } citations ont été trouvées qui ne sont pas encore liées à des références de votre bibliothèque. Elles restent le texte tel qu’il a été écrit, et peuvent être passées en revue quand la carte est faite, et plus tard.
    }
   *[other] { $made ->
        [all] { $count } citations ont été trouvées qui ne sont pas encore liées à des références de votre bibliothèque, toutes faites par un logiciel de gestion bibliographique. Elles restent le texte tel qu’il a été écrit, et peuvent être passées en revue quand la carte est faite, et plus tard.
        [some] { $count } citations ont été trouvées qui ne sont pas encore liées à des références de votre bibliothèque, dont { $some } faites par un logiciel de gestion bibliographique. Elles restent le texte tel qu’il a été écrit, et peuvent être passées en revue quand la carte est faite, et plus tard.
       *[none] { $count } citations ont été trouvées qui ne sont pas encore liées à des références de votre bibliothèque. Elles restent le texte tel qu’il a été écrit, et peuvent être passées en revue quand la carte est faite, et plus tard.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } citation faite par EndNote est importée comme le texte qu’elle montre, et n’est pas parmi celles qui ont été trouvées : ce qu’EndNote dit des œuvres n’a pas pu être lu.
    [many] { $count } citations faites par EndNote sont importées comme le texte qu’elles montrent, et ne sont pas parmi celles qui ont été trouvées : ce qu’EndNote dit des œuvres n’a pas pu être lu.
   *[other] { $count } citations faites par EndNote sont importées comme le texte qu’elles montrent, et ne sont pas parmi celles qui ont été trouvées : ce qu’EndNote dit des œuvres n’a pas pu être lu.
}
core-import-document-bookmarks = { $count ->
    [one] Le document garde { $count } citation dans un signet, et ce qu’elle cite n’a pas pu être lu : c’est du texte tel quel. C’est ainsi que Zotero les garde quand les préférences du document le demandent.
    [many] Le document garde { $count } citations dans des signets, et ce qu’elles citent n’a pas pu être lu : c’est du texte tel quel. C’est ainsi que Zotero les garde quand les préférences du document le demandent.
   *[other] Le document garde { $count } citations dans des signets, et ce qu’elles citent n’a pas pu être lu : c’est du texte tel quel. C’est ainsi que Zotero les garde quand les préférences du document le demandent.
}
core-import-document-bibliography = Le document a une liste de ce qu’il cite, sous « { $heading } ». Elle est importée comme du texte, comme le reste. La carte fait sa propre bibliographie de ce qui y est cité.
core-import-document-bibliography-made = Le document a une liste de ce qu’il cite, faite par le logiciel qui gère ses références. Elle est importée comme du texte, comme le reste. La carte fait sa propre bibliographie de ce qui y est cité.
core-import-document-tracked = Le document a des modifications suivies. Le texte est importé tel qu’il est une fois toutes acceptées.
core-import-document-comments = Le document a des commentaires en marge, qui sont laissés de côté.
core-import-document-heading-notes = { $count ->
    [one] Une note sur un titre se trouve au début du texte qui le suit : un titre ne peut pas porter de note.
    [many] { $count } notes sur des titres se trouvent au début du texte qui les suit : un titre ne peut pas porter de note.
   *[other] { $count } notes sur des titres se trouvent au début du texte qui les suit : un titre ne peut pas porter de note.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } légende commençait par un mot et un numéro, comme « { $first } ». Ils sont laissés de côté : la carte numérote elle-même ses figures et ses tableaux. Là où le texte en nomme un par son numéro, c’est du texte tel qu’il a été écrit, qui ne suit pas la numérotation de la carte.
    [many] { $count } légendes commençaient par un mot et un numéro, comme « { $first } ». Ils sont laissés de côté : la carte numérote elle-même ses figures et ses tableaux. Là où le texte en nomme un par son numéro, c’est du texte tel qu’il a été écrit, qui ne suit pas la numérotation de la carte.
   *[other] { $count } légendes commençaient par un mot et un numéro, comme « { $first } ». Ils sont laissés de côté : la carte numérote elle-même ses figures et ses tableaux. Là où le texte en nomme un par son numéro, c’est du texte tel qu’il a été écrit, qui ne suit pas la numérotation de la carte.
}
core-import-document-label-example = Figure 1 :
core-import-document-caption-notes = { $count ->
    [one] Une note dans ce qui est dit d’une figure ou d’un tableau y est mise entre crochets.
    [many] { $count } notes dans ce qui est dit de figures ou de tableaux y sont mises entre crochets.
   *[other] { $count } notes dans ce qui est dit de figures ou de tableaux y sont mises entre crochets.
}
core-import-document-headings = { $count ->
    [one] { $count } titre dans une citation, une liste ou un tableau est importé comme un paragraphe en gras.
    [many] { $count } titres dans une citation, une liste ou un tableau sont importés comme des paragraphes en gras.
   *[other] { $count } titres dans une citation, une liste ou un tableau sont importés comme des paragraphes en gras.
}
core-import-document-code = { $count ->
    [one] { $count } bloc de code est importé comme des paragraphes ordinaires, une ligne par paragraphe.
    [many] { $count } blocs de code sont importés comme des paragraphes ordinaires, une ligne par paragraphe.
   *[other] { $count } blocs de code sont importés comme des paragraphes ordinaires, une ligne par paragraphe.
}
core-import-document-definitions = { $count ->
    [one] { $count } liste de termes avec leur sens est importée comme des paragraphes, les termes en gras.
    [many] { $count } listes de termes avec leur sens sont importées comme des paragraphes, les termes en gras.
   *[other] { $count } listes de termes avec leur sens sont importées comme des paragraphes, les termes en gras.
}
core-import-document-rules = { $count ->
    [one] { $count } trait en travers de la page est laissé de côté.
    [many] { $count } traits en travers de la page sont laissés de côté.
   *[other] { $count } traits en travers de la page sont laissés de côté.
}
core-import-document-raw = { $count ->
    [one] { $count } morceau écrit en HTML ou en TeX pour un seul type de document est laissé de côté.
    [many] { $count } morceaux écrits en HTML ou en TeX pour un seul type de document sont laissés de côté.
   *[other] { $count } morceaux écrits en HTML ou en TeX pour un seul type de document sont laissés de côté.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } image que le fichier contient n’est pas dans le texte qui a été lu, et est laissée de côté. Elle se trouve peut-être dans l’en-tête ou le pied des pages, ou dans un dessin.
    [many] { $count } images que le fichier contient ne sont pas dans le texte qui a été lu, et sont laissées de côté. Elles se trouvent peut-être dans l’en-tête ou le pied des pages, ou dans un dessin.
   *[other] { $count } images que le fichier contient ne sont pas dans le texte qui a été lu, et sont laissées de côté. Elles se trouvent peut-être dans l’en-tête ou le pied des pages, ou dans un dessin.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = L’image « { $name } » est laissée de côté : { $why }.
core-import-document-picture-kind = elle est d’un type qui n’est pas lu ({ $kind })
core-import-document-picture-not-read = ce n’est pas une image d’un type qui est lu
core-import-document-picture-unreadable = elle n’a pas pu être lue
core-import-document-picture-network = elle est sur le réseau, et rien n’est pris de là
core-import-document-picture-not-taken-out = elle n’a pas pu être extraite du fichier
core-import-document-picture-outside = elle n’est pas dans le fichier, mais ailleurs sur cet ordinateur, et n’est pas prise de là
core-import-document-picture-not-found = le fichier n’a pas été trouvé là où le document dit qu’il est
core-import-document-picture-too-large = elle fait plus de 50 Mo
core-import-document-picture-file-unreadable = le fichier n’a pas pu être lu
