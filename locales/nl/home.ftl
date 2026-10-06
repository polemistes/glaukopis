# The projects: the list of them, and what is done with them.

home-title = Projecten
home-join = Deelnemen aan een gedeeld project
home-from-document = Een project uit een document…
home-new = Nieuw project

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = Wat wordt getoond
home-recent = Laatst gebruikt
home-all = Alle projecten
# Under the cards, when there are more projects than they show.
home-show-all = Alle { $count } projecten tonen
# The button that opens the menu of the page.
home-page-menu = Meer
home-search = Een project zoeken
home-search-none = Geen project heeft die naam.
home-list-none = Er zijn geen projecten.

## Folders of projects

home-new-folder = Nieuwe map
home-folder-new-inside = Nieuwe map hierin…
home-folder-rename-title = Map hernoemen
home-folder-name-placeholder = Wat de map bevat
home-folder-name-missing = Geef de map een naam.
home-folder-projects = { $count ->
    [one] { $count } project
   *[other] { $count } projecten
}
home-menu-move = Naar map verplaatsen
home-menu-out = Uit de mappen
home-folder-delete-title = De map ‘{ $name }’ wissen?
home-folder-delete-message = De mappen en projecten erin blijven bewaard: ze schuiven op naar waar de map stond.
home-folder-delete-confirm = Map wissen
home-folder-failed = Dat kon niet met de map
home-moved-to = ‘{ $name }’ is verplaatst naar { $folder }
home-moved-out = ‘{ $name }’ staat nu in geen enkele map
home-move-failed = Het project kon niet worden verplaatst

## A map of the projects

home-map-menu = Een mindmap van de projecten…
home-map-title = Een mindmap van de projecten
home-map-about = Een nieuw project, met één mindmap: de mappen als elementen, en onder elke map de projecten erin.
home-map-name-default = Projecten
home-map-what = Wat de mindmap bevat
home-map-names = Alleen de namen
home-map-names-hint = Een element voor elk project, met zijn beschrijving als tekst.
home-map-everything = Met alles erin
home-map-everything-hint = Onder elk project zijn mindmaps, en onder elke mindmap al haar elementen, met hun namen en teksten.
home-map-note = De verwijzingen houden hun referenties. Een kruisverwijzing naar een figuur of een deel wijst in het nieuwe project nergens naar, en opmerkingen blijven achter.
home-map-reading = ‘{ $name }’ wordt gelezen…
home-map-working = De mindmap wordt gemaakt…
home-map-make = De mindmap maken
home-map-failed = De mindmap van de projecten kon niet worden gemaakt

## When there are none yet

home-welcome = Welkom bij Glaukopis
home-welcome-text = Een project bevat het werk aan één boek of artikel: de mindmaps van je ideeën, de teksten die je erin schrijft, en de referenties waarop ze steunen.
home-begin = Een project beginnen

## A project in the list

# Under the names of the first four maps.
home-more-maps = en nog { $count }
home-maps = { $count ->
    [one] { $count } mindmap
   *[other] { $count } mindmaps
}
home-elements = { $count ->
    [one] { $count } element
   *[other] { $count } elementen
}
home-words = { $count ->
    [one] { $count } woord
   *[other] { $count } woorden
}
home-references = { $count ->
    [one] { $count } referentie
   *[other] { $count } referenties
}
home-not-begun = Nog niet begonnen
home-shared = Gedeeld
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Gewijzigd { $ago }
# The button that opens the menu of a project.
home-more-for = Meer voor { $name }
home-deleted-projects = { $count ->
    [one] { $count } gewist project
   *[other] { $count } gewiste projecten
}

## The menu of a project

home-menu-rename = Hernoemen…
home-menu-duplicate = Dupliceren…
home-menu-history = Eerdere versies…

## Naming a project

home-rename-title = Project hernoemen
home-duplicate-title = Project dupliceren
home-name = Naam
home-name-placeholder = De werktitel van het boek of artikel
home-name-missing = Geef het project een naam.
home-create = Aanmaken
home-duplicate = Dupliceren
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, kopie
home-failed = Dat is niet gelukt.

## Deleting a project

home-delete-title = ‘{ $name }’ wissen?
home-delete-message = Het project wordt naar de prullenbak van Glaukopis verplaatst, waaruit het kan worden teruggehaald. Je referenties blijven onaangeroerd.
home-delete-owner = Het project wordt naar de prullenbak van Glaukopis verplaatst, waaruit het kan worden teruggehaald. Het blijft op de server en bij degenen met wie je het deelt; om het van de server te halen, open je het en stop je eerst met delen.
home-delete-member = Het project wordt naar de prullenbak van Glaukopis verplaatst, waaruit het kan worden teruggehaald. De anderen houden het hunne.
home-delete-confirm = Project wissen
home-deleted = ‘{ $name }’ is naar de prullenbak verplaatst
home-delete-failed = Het project kon niet worden gewist

## The trash

home-trash-title = Gewiste projecten
home-trash-none = Er zijn er geen.
home-deleted-ago = Gewist { $ago }
home-restore = Terughalen
home-restored = ‘{ $name }’ staat weer tussen de projecten
home-restore-failed = Het project kon niet worden teruggehaald
home-purge = Voorgoed verwijderen
home-purge-title = ‘{ $name }’ voorgoed verwijderen?
home-purge-message = Wat het project bevat, kan hierna niet meer worden teruggehaald. Je referenties blijven onaangeroerd.
home-purge-failed = Het project kon niet worden verwijderd

## Earlier versions of a project

home-history-title = Eerdere versies
home-history-about = Van ‘{ $name }’. Een versie wordt geopend als een eigen project; dit project blijft zoals het is.
home-history-none = Er is er nog geen bewaard. Een versie wordt zo nu en dan bewaard terwijl je werkt: dicht op elkaar voor wat recent is, schaarser voor wat oud is.
home-history-open = Een kopie openen
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, per { $day }
home-history-unread = De eerdere versies konden niet worden gelezen
home-history-open-failed = Die versie kon niet worden geopend
