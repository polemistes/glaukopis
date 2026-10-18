# What the core says of project files (ADR 0036), in English.
# See locales/README.md.

core-projectfile-not-one = This is not a project file of Glaukopis.
# $format is a number: the form of the file, which this version does not know.
core-projectfile-later = This project file was written by a later version of Glaukopis (form { $format }). Update Glaukopis to open it.
core-projectfile-no-document = The project file holds no project.
core-projectfile-unreadable = The project file cannot be read: { $error }
core-projectfile-unwritable = The project file could not be written: { $error }
# $name is the name of a part of the file.
core-projectfile-too-large = A part of the project file is too large: { $name }
# What the file says of its pictures could not be read; $cause is what was wrong.
core-projectfile-pictures-unreadable = What the project file says of its pictures could not be read, so they come without their names, captions and descriptions: { $cause }

## What was being done when the system said no, shown before what it said.

core-projectfile-reading = reading the project file
