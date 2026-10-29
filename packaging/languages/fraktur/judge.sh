#!/usr/bin/env bash
# Makes the traineddata of each run named and measures it, beside the
# chosen model, on the three sets the README's tables use: the held-out
# Norwegian lines (as raw lines, --psm 13), the owner's lines and the
# held-out pages of pvorb (--psm 7). Numbers only.
#
#   EXPERIMENT=train-nor judge.sh RUN...
set -euo pipefail
HERE=$(dirname "$0")
ROOT=$(git -C "$HERE" rev-parse --show-toplevel)
BUILD=$ROOT/packaging/build/fraktur
for run in "$@"; do
    [ -s "$BUILD/models/$run/dan_latf.traineddata" ] || "$HERE/make-model.sh" finish "$run" >/dev/null 2>&1
done
for model in chosen "$@"; do
    if [ "$model" = chosen ]; then dir=$BUILD; else dir=$BUILD/models/$model; fi
    echo "== $model"
    python3 -I "$HERE/measure.py" --psm 13 --tessdata "$dir" --lang dan_latf "$BUILD/lines/heldout-nor" | tail -n +2
    python3 -I "$HERE/measure.py" --tessdata "$dir" --lang dan_latf "$BUILD/eval/owner" "$BUILD/lines/heldout" | tail -n +2
done
