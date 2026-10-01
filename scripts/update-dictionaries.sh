#!/usr/bin/env bash
# Fetches the dictionaries that come with the application, with their
# licences: see resources/dictionaries/README.md.
#
#     scripts/update-dictionaries.sh
#
# English (American and British) is taken from LibreOffice's repository of
# dictionaries as it is. Of Norwegian (Bokmål and Nynorsk) only the affix
# files and their licence come from there, the rules of spell-norwegian; the
# word lists are made from the word lists of Bokmålsordboka and
# Nynorskordboka by scripts/make-norwegian-dictionaries.py, which this runs
# last, and are described in resources/dictionaries/README_NO.txt, which is
# written here and not fetched. Needs curl and python3.

set -euo pipefail
cd "$(dirname "$0")/.."

repository=https://raw.githubusercontent.com/LibreOffice/dictionaries
dir=resources/dictionaries

for file in en_US.aff en_US.dic en_GB.aff en_GB.dic README_en_US.txt README_en_GB.txt license.txt; do
  curl -sSfL -o "$dir/$file" "$repository/master/en/$file"
done
for file in nb_NO.aff nn_NO.aff COPYING; do
  curl -sSfL -o "$dir/$file" "$repository/master/no/$file"
done
curl -sSfL -o "$dir/LGPL-2.1.txt" https://www.gnu.org/licenses/old-licenses/lgpl-2.1.txt
# The word lists of Norwegian, fetched anew and made into dictionaries.
python3 scripts/make-norwegian-dictionaries.py --fetch
echo "The dictionaries are in $dir."
