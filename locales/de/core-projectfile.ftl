# What the core says of project files (ADR 0036), in English.
# See locales/README.md.

core-projectfile-not-one = Das ist keine Projektdatei von Glaukopis.
# $format is a number: the form of the file, which this version does not know.
core-projectfile-later = Diese Projektdatei wurde von einer neueren Version von Glaukopis geschrieben (Form { $format }). Bringen Sie Glaukopis auf den neuesten Stand, um sie zu öffnen.
core-projectfile-no-document = Die Projektdatei enthält kein Projekt.
core-projectfile-unreadable = Die Projektdatei kann nicht gelesen werden: { $error }
core-projectfile-unwritable = Die Projektdatei konnte nicht geschrieben werden: { $error }
# $name is the name of a part of the file.
core-projectfile-too-large = Ein Teil der Projektdatei ist zu groß: { $name }
# What the file says of its pictures could not be read; $cause is what was wrong.
core-projectfile-pictures-unreadable = Was die Projektdatei über ihre Bilder sagt, konnte nicht gelesen werden; sie kommen daher ohne ihre Namen, Beschriftungen und Beschreibungen: { $cause }

## What was being done when the system said no, shown before what it said.

core-projectfile-reading = Lesen der Projektdatei
