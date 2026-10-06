# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = text lipit
core-import-files = { $count ->
    [one] un fișier
    [few] { $count } fișiere
   *[other] { $count } de fișiere
}

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = Fișierul „{ $name }” nu a fost găsit.
core-import-empty-entry = Rândul { $line }: intrarea „{ $key }” este goală și a fost lăsată afară.
# Where in a file a reference that has no key was found.
core-import-origin-line = rândul { $line }
core-import-origin-key-line = { $key }, rândul { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = „{ $title }”
core-import-merge-gone = { $reference }: intrarea cu care trebuia unită nu mai este acolo

## PDF files.

core-import-not-a-pdf = { $name } nu este un PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = Datele sunt de la { $service }.
core-import-number-unknown = În fișier s-a găsit un număr, dar bazele de date nu știu nimic despre el; datele sunt din fișierul însuși și ar trebui verificate.
core-import-databases-failed = Bazele de date nu au putut fi întrebate ({ $error }); datele sunt din fișierul însuși și ar trebui verificate.

## Zotero.

core-import-zotero-my-library = Biblioteca mea
core-import-zotero-group = Grupul { $id }
core-import-zotero-the-library = biblioteca { $id } din Zotero
core-import-zotero-own-library = biblioteca proprie a utilizatorului din Zotero
core-import-zotero-the-collection = colecția { $key } din Zotero
core-import-zotero-unknown-base = Fișierul „{ $name }” nu a fost găsit. Zotero trimite la el dintr-un dosar ales de el, care nu este cunoscut aici.
core-import-zotero-empty-item = Articolul { $key } din Zotero este gol și a fost lăsat afară.
core-import-zotero-alone = { $count ->
    [one] { $count } fișier sau notă stă în Zotero sub nicio referință și a fost lăsat afară.
    [few] { $count } fișiere și note stau în Zotero sub nicio referință și au fost lăsate afară.
   *[other] { $count } de fișiere și note stau în Zotero sub nicio referință și au fost lăsate afară.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero îl numește pe { $name } ca { $role }, pentru care BibLaTeX nu are câmp. Numele a fost lăsat afară.
core-import-zotero-left-out = Câmpul „{ $field }” din Zotero nu are corespondent în BibLaTeX și a fost lăsat afară: { $value }

## Zotero's database.

core-import-zotero-no-database = o bază de date Zotero ({ $file }) în { $path }
core-import-zotero-copying = la copierea { $path } într-un dosar temporar
core-import-zotero-empty = fișierul este gol
core-import-zotero-disturbed = Zotero scria în baza lui de date în timp ce era citită. Dacă lipsește ceva, închideți Zotero și importați din nou.
core-import-zotero-backup-read = Baza de date a lui Zotero nu s-a putut citi ({ $error }). S-a citit în schimb copia ei de siguranță, { $backup }: ce s-a schimbat în Zotero de când a fost făcută copia lipsește.
core-import-zotero-not-a-database = { $path } nu este o bază de date a lui Zotero.
core-import-zotero-unreadable = Baza de date Zotero are o formă care nu se poate citi aici: { $what }. Dacă a fost scrisă de o versiune veche de Zotero, deschiderea ei o dată într-una curentă o aduce la zi.
core-import-zotero-unreadable-version = Baza de date Zotero are o formă care nu se poate citi aici (versiunea { $version } a bazei de date Zotero): { $what }. Dacă a fost scrisă de o versiune veche de Zotero, deschiderea ei o dată într-una curentă o aduce la zi.
core-import-zotero-no-table = tabelul „{ $table }” lipsește
core-import-zotero-no-column = tabelul „{ $table }” nu are coloana „{ $column }”
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = Baza de date Zotero nu are tabelul „{ $table }” în forma cunoscută aici: { $consequence }.
core-import-zotero-no-bin = articolele din coșul lui Zotero nu se pot deosebi de celelalte
core-import-zotero-no-collections = colecțiile nu au fost citite
core-import-zotero-no-attachments = fișierele atașate nu au fost citite
core-import-zotero-no-notes = notele nu au fost citite
core-import-zotero-no-keywords = cuvintele-cheie nu au fost citite
core-import-zotero-no-group-names = numele bibliotecilor de grup nu sunt cunoscute

## PDF files, as they are read for a reference.

core-import-pdf-empty = Fișierul „{ $name }” este gol.
core-import-pdf-not-a-pdf = Fișierul „{ $name }” nu este un PDF.
core-import-pdf-unreadable = Fișierul nu s-a putut citi: este stricat, apărat de o parolă sau prea mare.
core-import-pdf-scan = Fișierul nu are strat de text: este o scanare.
core-import-pdf-from-file = Datele sunt din fișierul însuși, nu dintr-un catalog, și ar trebui verificate.
core-import-pdf-from-metadata = În fișier nu s-a găsit niciun DOI sau ISBN; datele sunt din metadatele fișierului și ar trebui verificate.
core-import-pdf-unknown = În fișier nu s-a găsit niciun DOI sau ISBN, iar metadatele lui nu spun ce este: datele trebuie completate.

## Tables, from files of text and of sheets.

core-import-table-too-large = Fișierul are { $size } MB. Un tabel se citește dintr-un fișier de cel mult { $most } MB.
core-import-table-kinds = Tabelele se citesc din CSV și din alte texte cu valorile despărțite prin virgule, puncte și virgule sau tabulatori, și din foile de calcul LibreOffice (.ods) și Excel (.xlsx, .xls).
core-import-table-empty = Nu este nimic în fișier.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = Rândurile tabelului: { $rows }. Un tabel dintr-un text poate avea cel mult { $most }: nu este o foaie de calcul.
core-import-table-columns = Coloanele tabelului: { $columns }. Un tabel dintr-un text poate avea cel mult { $most }: nu este o foaie de calcul.
core-import-table-more-than = mai mult de { $count }

## Documents brought in, to become maps.

core-import-document-stopped = Citirea a fost oprită.
core-import-pdfs-stopped = Aflarea a ceea ce sunt fișierele a fost oprită. Nu s-a adăugat nimic.
core-import-document-kind = „{ $file }” nu este de un fel care se poate aduce ca document. Se pot aduce Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst și text simplu.
core-import-document-too-large = „{ $file }” are peste 50 MB, mai mult decât se poate aduce ca document.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = „{ $file }” nu s-a putut citi ca { $kind }. Poate fi stricat sau de alt fel decât spune numele lui. Pandoc, care îl citește, a spus: { $message }
core-import-document-pandoc-unreadable = ce a făcut Pandoc din „{ $file }” nu s-a putut citi: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Fără titlu
core-import-document-plain-text = text simplu
core-import-document-notebook = caiet Jupyter

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] S-a găsit { $count } citare care nu este încă legată de o referință din biblioteca dumneavoastră, făcută de un program care ține referințe. Stă ca textul în care a fost scrisă și poate fi parcursă când se face harta, și mai târziu.
       *[none] S-a găsit { $count } citare care nu este încă legată de o referință din biblioteca dumneavoastră. Stă ca textul în care a fost scrisă și poate fi parcursă când se face harta, și mai târziu.
    }
    [few] { $made ->
        [all] S-au găsit { $count } citări care nu sunt încă legate de referințe din biblioteca dumneavoastră, toate făcute de un program care ține referințe. Stau ca textul în care au fost scrise și pot fi parcurse când se face harta, și mai târziu.
        [some] S-au găsit { $count } citări care nu sunt încă legate de referințe din biblioteca dumneavoastră, { $some } dintre ele făcute de un program care ține referințe. Stau ca textul în care au fost scrise și pot fi parcurse când se face harta, și mai târziu.
       *[none] S-au găsit { $count } citări care nu sunt încă legate de referințe din biblioteca dumneavoastră. Stau ca textul în care au fost scrise și pot fi parcurse când se face harta, și mai târziu.
    }
   *[other] { $made ->
        [all] S-au găsit { $count } de citări care nu sunt încă legate de referințe din biblioteca dumneavoastră, toate făcute de un program care ține referințe. Stau ca textul în care au fost scrise și pot fi parcurse când se face harta, și mai târziu.
        [some] S-au găsit { $count } de citări care nu sunt încă legate de referințe din biblioteca dumneavoastră, { $some } dintre ele făcute de un program care ține referințe. Stau ca textul în care au fost scrise și pot fi parcurse când se face harta, și mai târziu.
       *[none] S-au găsit { $count } de citări care nu sunt încă legate de referințe din biblioteca dumneavoastră. Stau ca textul în care au fost scrise și pot fi parcurse când se face harta, și mai târziu.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } citare făcută de EndNote este adusă ca textul pe care îl arată și nu este printre cele găsite: ce spune EndNote despre lucrări nu s-a putut citi.
    [few] { $count } citări făcute de EndNote sunt aduse ca textul pe care îl arată și nu sunt printre cele găsite: ce spune EndNote despre lucrări nu s-a putut citi.
   *[other] { $count } de citări făcute de EndNote sunt aduse ca textul pe care îl arată și nu sunt printre cele găsite: ce spune EndNote despre lucrări nu s-a putut citi.
}
core-import-document-bookmarks = { $count ->
    [one] Documentul ține { $count } citare într-un semn de carte, iar ce citează nu s-a putut citi: este text așa cum stă. Zotero le ține altfel acolo unde preferințele lui pentru document spun așa.
    [few] Documentul ține { $count } citări în semne de carte, iar ce citează nu s-a putut citi: sunt text așa cum stau. Zotero le ține altfel acolo unde preferințele lui pentru document spun așa.
   *[other] Documentul ține { $count } de citări în semne de carte, iar ce citează nu s-a putut citi: sunt text așa cum stau. Zotero le ține altfel acolo unde preferințele lui pentru document spun așa.
}
core-import-document-bibliography = Documentul are o listă a lucrărilor citate, sub „{ $heading }”. Este adusă ca text, ca și restul. Harta își face o bibliografie a ei din ce se citează în ea.
core-import-document-bibliography-made = Documentul are o listă a lucrărilor citate, făcută de programul care îi ține referințele. Este adusă ca text, ca și restul. Harta își face o bibliografie a ei din ce se citează în ea.
core-import-document-tracked = Documentul are modificări urmărite. Textul este adus așa cum stă când toate sunt primite.
core-import-document-comments = Documentul are comentarii pe margine, care sunt lăsate afară.
core-import-document-heading-notes = { $count ->
    [one] O notă la un titlu stă la începutul textului de sub el: un titlu nu poate avea notă.
    [few] { $count } note la titluri stau la începutul textului de sub ele: un titlu nu poate avea notă.
   *[other] { $count } de note la titluri stau la începutul textului de sub ele: un titlu nu poate avea notă.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } legendă începea cu un cuvânt și un număr, precum „{ $first }”. Este lăsat afară: harta își numerotează singură figurile și tabelele. Acolo unde textul numește una dintre ele după număr, acela este text așa cum a fost scris și nu urmează numerele hărții.
    [few] { $count } legende începeau cu un cuvânt și un număr, precum „{ $first }”. Sunt lăsate afară: harta își numerotează singură figurile și tabelele. Acolo unde textul numește una dintre ele după număr, acela este text așa cum a fost scris și nu urmează numerele hărții.
   *[other] { $count } de legende începeau cu un cuvânt și un număr, precum „{ $first }”. Sunt lăsate afară: harta își numerotează singură figurile și tabelele. Acolo unde textul numește una dintre ele după număr, acela este text așa cum a fost scris și nu urmează numerele hărții.
}
core-import-document-label-example = Figura 1:
core-import-document-caption-notes = { $count ->
    [one] O notă din ce se spune despre o figură sau un tabel stă acolo între paranteze.
    [few] { $count } note din ce se spune despre figuri sau tabele stau acolo între paranteze.
   *[other] { $count } de note din ce se spune despre figuri sau tabele stau acolo între paranteze.
}
core-import-document-headings = { $count ->
    [one] { $count } titlu dintr-un citat, o listă sau un tabel este adus ca paragraf aldin.
    [few] { $count } titluri dintr-un citat, o listă sau un tabel sunt aduse ca paragrafe aldine.
   *[other] { $count } de titluri dintr-un citat, o listă sau un tabel sunt aduse ca paragrafe aldine.
}
core-import-document-code = { $count ->
    [one] { $count } bloc de cod este adus ca paragrafe simple, câte un rând în fiecare.
    [few] { $count } blocuri de cod sunt aduse ca paragrafe simple, câte un rând în fiecare.
   *[other] { $count } de blocuri de cod sunt aduse ca paragrafe simple, câte un rând în fiecare.
}
core-import-document-definitions = { $count ->
    [one] { $count } listă de termeni cu înțelesul lor este adusă ca paragrafe, cu termenii aldini.
    [few] { $count } liste de termeni cu înțelesul lor sunt aduse ca paragrafe, cu termenii aldini.
   *[other] { $count } de liste de termeni cu înțelesul lor sunt aduse ca paragrafe, cu termenii aldini.
}
core-import-document-rules = { $count ->
    [one] { $count } linie de-a latul paginii este lăsată afară.
    [few] { $count } linii de-a latul paginii sunt lăsate afară.
   *[other] { $count } de linii de-a latul paginii sunt lăsate afară.
}
core-import-document-raw = { $count ->
    [one] { $count } bucată scrisă în HTML sau TeX numai pentru un singur fel de document este lăsată afară.
    [few] { $count } bucăți scrise în HTML sau TeX numai pentru un singur fel de document sunt lăsate afară.
   *[other] { $count } de bucăți scrise în HTML sau TeX numai pentru un singur fel de document sunt lăsate afară.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } imagine pe care o ține fișierul nu este în textul citit și este lăsată afară. Poate sta în antetul sau în subsolul paginilor, ori într-un desen.
    [few] { $count } imagini pe care le ține fișierul nu sunt în textul citit și sunt lăsate afară. Pot sta în antetul sau în subsolul paginilor, ori într-un desen.
   *[other] { $count } de imagini pe care le ține fișierul nu sunt în textul citit și sunt lăsate afară. Pot sta în antetul sau în subsolul paginilor, ori într-un desen.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = Imaginea „{ $name }” este lăsată afară: { $why }.
core-import-document-picture-kind = este de un fel care nu se citește ({ $kind })
core-import-document-picture-not-read = nu este o imagine de un fel care se citește
core-import-document-picture-unreadable = nu s-a putut citi
core-import-document-picture-network = este în rețea, și de acolo nu se ia nimic
core-import-document-picture-not-taken-out = nu s-a putut scoate din fișier
core-import-document-picture-outside = nu este în fișier, ci altundeva pe acest calculator, și de acolo nu se ia
core-import-document-picture-not-found = fișierul nu a fost găsit acolo unde spune documentul că este
core-import-document-picture-too-large = are peste 50 MB
core-import-document-picture-file-unreadable = fișierul nu s-a putut citi
