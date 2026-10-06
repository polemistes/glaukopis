# What the core says of making documents and previews, of reference styles
# and of document formats, in English. See locales/README.md.

## Making a document.

core-export-picture-missing = Slike »{ $name }« ni na tem računalniku, zato je v dokumentu izpuščena.
core-export-astray = { $count ->
    [one] Sklic v besedilu kaže na nekaj, česar v dokumentu ni. Izpisan je kot [?].
    [two] { $count } sklica v besedilu kažeta na nekaj, česar v dokumentu ni. Izpisana sta kot [?].
    [few] { $count } sklici v besedilu kažejo na nekaj, česar v dokumentu ni. Izpisani so kot [?].
   *[other] { $count } sklicev v besedilu kaže na nekaj, česar v dokumentu ni. Izpisani so kot [?].
}
core-export-latex-font = Pisava { $font } ni nameščena. Dokument je stavljen v pisavi Latin Modern, ki jo ima LaTeX sam.
# Texts of a preview that the interface did not send again, and that were not kept: it sends them all.
core-export-lacking = { $count ->
    [one] { $count } besedilo dokumenta ni bilo poslano in ni shranjeno.
    [two] { $count } besedili dokumenta nista bili poslani in nista shranjeni.
    [few] { $count } besedila dokumenta niso bila poslana in niso shranjena.
   *[other] { $count } besedil dokumenta ni bilo poslanih in niso shranjena.
}
# Shown after "not found: ".
core-export-preview-document = dokument predogleda
core-export-reading-pdf = branje izdelanega PDF-ja
core-export-reading-made = branje izdelanega dokumenta

## The pattern document, from which Word and OpenDocument take their styles.

core-export-pattern-unreadable = predloge ni bilo mogoče prebrati: { $error }
core-export-pattern-lacks = predloga nima { $name }
core-export-pattern-reading = branje predloge
core-export-pattern-writing = pisanje predloge

## Formulas, as they are shown where they are written.

core-export-formula-incomplete = Formula se konča, preden je popolna.
# The command is as it was written: \frac.
core-export-formula-unknown = Ukaz { $command } ni znan.
core-export-formula-unexpected = { $what } ne sodi na to mesto.
core-export-formula-unreadable = Formule ni bilo mogoče prebrati.
core-export-formula-too-long = Formula je predolga.

## Reference styles.

core-export-style-bad-id = »{ $id }« ne more biti ID sloga
core-export-not-a-style = To ni slog: { $error }.
core-export-not-a-style-begin = To ni slog: ne začne se s <style>.
core-export-dependent-style = Ta slog le imenuje drug slog, od katerega jemlje svojo obliko. Namesto tega pridobite tistega po imenu.
core-export-style-unreadable = Sloga ni bilo mogoče prebrati nazaj.
core-export-style-needs-name = Slog potrebuje ime.
core-export-style-own-only = Izbrisati je mogoče le lastne sloge.
# Shown after "not found: ".
core-export-the-reference-style = slog navajanja »{ $id }«
core-export-any-reference-style = kateri koli slog navajanja
core-export-the-style = slog »{ $id }«

## Document formats.

core-export-format-bad-id = »{ $id }« ne more biti ID formata
core-export-format-needs-name = Format potrebuje ime.
core-export-format-own-only = Izbrisati je mogoče le lastne formate.
core-export-not-a-length = »{ $length }« ni dolžina
# Shown after "not found: ".
core-export-the-format = format »{ $id }«
