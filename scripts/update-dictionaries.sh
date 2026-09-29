#!/usr/bin/env bash
# Fetches the dictionaries that come with the application from LibreOffice's
# repository of dictionaries, with their licences: see
# resources/dictionaries/README.md.
#
#     scripts/update-dictionaries.sh
#
# English (American and British) and Norwegian (Bokmål and Nynorsk) are taken
# as they are. The extra lists of Norwegian words are the lists of version 2.2
# of the same dictionaries, as they were before version 3.0 took their place,
# made UTF-8 from ISO 8859-1 as the rest are. Needs curl and iconv.

set -euo pipefail
cd "$(dirname "$0")/.."

repository=https://raw.githubusercontent.com/LibreOffice/dictionaries
# The last change of the Norwegian dictionaries at version 2.2 (2018).
norwegian_2_2=5b81821a17bf104942b364ad7e13ab4cd8f5ec50
dir=resources/dictionaries

mkdir -p "$dir/extra"
for file in en_US.aff en_US.dic en_GB.aff en_GB.dic README_en_US.txt README_en_GB.txt license.txt; do
  curl -sSfL -o "$dir/$file" "$repository/master/en/$file"
done
for file in nb_NO.aff nb_NO.dic nn_NO.aff nn_NO.dic COPYING README_NO.txt; do
  curl -sSfL -o "$dir/$file" "$repository/master/no/$file"
done
for name in nb_NO nn_NO; do
  curl -sSfL "$repository/$norwegian_2_2/no/$name.dic" | iconv -f ISO-8859-1 -t UTF-8 > "$dir/extra/$name.dic"
done
curl -sSfL -o "$dir/LGPL-2.1.txt" https://www.gnu.org/licenses/old-licenses/lgpl-2.1.txt
echo "The dictionaries are in $dir."
