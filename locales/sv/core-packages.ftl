# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = Paketets innehållsförteckning kan inte läsas: { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = ”{ $file }” kan inte läsas som en zip-fil: { $message }
core-packages-too-large = ”{ $file }” är större än ett språkpaket får vara.
core-packages-nothing = Det finns ingen ordlista för stavning (en .aff- och en .dic-fil) och inga data för Tesseract (en .traineddata-fil) i det som valdes.
# $name is the name a package would give its files.
core-packages-bad-name = ”{ $name }” kan inte vara namnet på ett språk: ett namn består av bokstäver, siffror, _ och -, och börjar med ett språk, som sv_SE eller swe.
core-packages-empty = ”{ $file }” är tom.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = { $url } kunde inte hämtas: { $message }
core-packages-fetch-status = { $url } kunde inte hämtas: servern svarade { $status }.
# $server is the address of the server, or the folder.
core-packages-index = Det som { $server } erbjuder kan inte läsas: { $message }
core-packages-checksum = ”{ $file }” är inte vad servern sa att den skulle vara. Inget importerades; försök igen senare.
