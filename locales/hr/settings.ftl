# The settings.

settings-title = Postavke
settings-error-system = Nešto o aplikaciji nije bilo moguće pročitati
settings-error-read = Postavke nije bilo moguće pročitati
settings-error-save = Postavke nije bilo moguće spremiti

## Appearance

settings-appearance = Izgled
settings-theme = Boje
settings-theme-system = Kao sustav
settings-theme-light = Svijetle
settings-theme-dark = Tamne
# A theme of pastel colours, warm and soft.
settings-theme-mellow = Blage
settings-theme-own = Vlastite
settings-own = Vlastite boje
settings-own-hint = Četiri boje, iz kojih slijede ostale: papir, tinta, naglasak koji označava odabrano i pritisnuto, i drugi glas koji označava veze i komentare. Je li shema svijetla ili tamna, slijedi iz papira.
settings-own-paper = Papir
settings-own-ink = Tinta
settings-own-accent = Naglasak
settings-own-gold = Drugi glas
settings-own-begin = Počni od
# The contrast of the ink and of the accent on the paper, as WCAG counts it; 4.5 and 3 are what reads well.
settings-own-weak = Teško se čita: tinta stoji prema papiru { $ink } : 1, a naglasak { $accent } : 1; dobro se čita od 4,5 i 3 naviše.
settings-text-size = Veličina vašeg teksta
settings-text-size-hint = U mapama i tekstnom prikazu. Izvezeno slijedi format dokumenta.
settings-interface-size = Veličina sučelja
settings-interface-size-hint = Sve u prozoru, i pisanje. Samo za vaš tekst, veličina dolje.
# A line of text in the size chosen, which shows the face of the letters; a
# line of Homer's Greek follows it.
settings-sample = Srdžbu mi, boginjo, pjevaj Ahileja Pelejevića

## New documents

settings-new-documents = Novi dokumenti
settings-new-documents-hint = Čime mapa počinje. Svakoj se mapi može dati drugo, u pretpregledu.
settings-reference-style = Citatni stil
settings-document-format = Format dokumenta

## You

settings-you = Vi
settings-name = Ime
settings-name-hint = Prikazuje se onima s kojima dijelite projekte. Inače se ne koristi.
settings-contact = Adresa za bibliografske servise
settings-contact-hint = Servisi poput Crossrefa spremnije odgovaraju onima koji kažu kako ih se može dobiti. Ako upišete adresu, šalje im se uz svaki dohvat, i nikome drugome. Ostavite prazno da se ništa ne šalje.
settings-contact-problem = To ne izgleda kao adresa.

## Programs: Pandoc and Typst

settings-programs = Programi
settings-programs-about = Glaukopis izrađuje dokumente Pandocom, koji se pronalazi sam ako je instaliran na uobičajen način. Stranice pretpregleda i PDF-a slaže Typst, koji je dio Glaukopisa.
settings-pandoc-need = Potreban za pretpregled i za svaki izvoz.
settings-looking = Traženje…
# "need" is what the program is needed for: settings-pandoc-need.
settings-program-missing = Nije pronađen. { $need } Instalirajte ga upraviteljem paketa svojega sustava, ili dolje recite gdje je.
settings-program-old = Stariji nego što Glaukopis treba: { $least } ili noviji.
# The field for the path to a program, and the title of the dialog that chooses it.
settings-program-where = Gdje je { $program }
settings-program-found-by-itself = Pronađen sam od sebe
settings-no-latex = LaTeX nije pronađen. Nije potreban: LaTeX izvor može se izvesti i bez njega, a PDF se izrađuje Typstom.
settings-look-again = Potraži ponovno
settings-error-programs = Programe nije bilo moguće potražiti

## About

settings-about = O programu
settings-licence = Slobodan softver pod licencijom GNU General Public License, inačica 3 ili novija. Dolazi bez jamstva.
settings-owl = Sovu je nacrtao Robert Emil Berge, prema fotografiji atenske tetradrahme tvrtke Classical Numismatic Group, Inc. (http://www.cngcoins.com). Crtež je pod licencijom Creative Commons Imenovanje-Dijeli pod istim uvjetima 3.0 Unported.
settings-data = Gdje se sve čuva
# "file" is the name of the file of the library, shown as code.
settings-data-hint = Vaše su reference u { $file }, koju može pročitati svaki alat za BibLaTeX. Da sačuvate kopiju svojega rada, kopirajte ovaj direktorij.
settings-lookup = Gdje se reference dohvaćaju
settings-lookup-about = DOI-ji na doi.org, u Crossrefu i DataCiteu; knjige u katalozima K10plus, norveških akademskih knjižnica, Deutsche Nationalbibliothek i Kongresne knjižnice; preprinti na arXivu; medicinska literatura u PubMedu. Šalje im se samo ono što upišete u dohvat.

## Language

settings-language = Jezik
settings-language-interface = Sučelje
settings-language-interface-hint = Riječi aplikacije. Vaši su tekstovi na jeziku svojih mapa.
settings-language-system = Kao sustav ({ $language })
settings-language-texts = Jezik novih tekstova
settings-language-texts-hint = Na kojem se jeziku piše nova mapa, što određuje riječi koje njezin dokument tiska i rječnik prema kojem se provjerava pravopis. Svakoj se mapi može dati drugi pod Jezici… u njezinu izborniku, a projektu vlastiti jezik za njegove nove mape.
