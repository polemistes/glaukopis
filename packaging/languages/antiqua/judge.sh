#!/usr/bin/env bash
# Makes models of a run of the Norwegian model of roman type (its last
# checkpoint and, with --steps, the best checkpoints near those iteration
# counts) and measures each beside the stock model: the held-out lines
# (as raw lines), the modern yardstick as lines and as whole pages, and the
# whole pages of the held-out books summed. Numbers only.
#
#   EXPERIMENT=tight judge.sh RUN [--steps 10000,20000,30000]
set -euo pipefail
HERE=$(dirname "$0")
ROOT=$(git -C "$HERE" rev-parse --show-toplevel)
BUILD=$ROOT/packaging/build/antiqua
TRAIN=$BUILD/$EXPERIMENT
DATA=${DATA:-$HOME/glaukopis-antiqua}
run=$1; steps=${3:-}
models=(stock)
mk() {  # checkpoint file, model name
    mkdir -p "$BUILD/models/$2"
    [ -s "$BUILD/models/$2/nor.traineddata" ] || lstmtraining --stop_training --continue_from "$1" \
        --traineddata "$TRAIN/proto/nor/nor.traineddata" --model_output "$BUILD/models/$2/nor.traineddata" >/dev/null 2>&1
    models+=("$2")
}
mk "$TRAIN/$run/nor_checkpoint" "$run"
for s in ${steps//,/ }; do
    c=$(ls "$TRAIN/$run"/nor_*_*_*.checkpoint | awk -F_ -v s="$s" '{n=$NF; sub(/\.checkpoint/,"",n); d=n-s; if (d<0) d=-d; print d, $0}' | sort -n | head -1 | cut -d' ' -f2)
    mk "$c" "$run-$s"
done
for m in "${models[@]}"; do
    if [ "$m" = stock ]; then d=$ROOT/packaging/build/languages/tessdata_best; else d=$BUILD/models/$m; fi
    held=$(python3 -I "$ROOT/packaging/languages/fraktur/measure.py" --roman --psm 13 --tessdata "$d" --lang nor "$DATA/lines/heldout2" | tail -1 | awk '{print $4}')
    modl=$(python3 -I "$ROOT/packaging/languages/fraktur/measure.py" --roman --psm 13 --tessdata "$d" --lang nor "$DATA/lines/modern" | tail -1 | awk '{print $4}')
    modp=$(python3 -I "$HERE/measure-pages.py" --tessdata "$d" --lang nor "$DATA/lines/modern" "$DATA/modern/boyson/pages" | awk '{print $6}')
    tot=0; err=0
    for b in $(python3 -I -c "import json,sys; print(' '.join(json.load(open(sys.argv[1]))))" "$DATA/books/heldout.json"); do
        [ "$b" = 162-den-17de-mai ] && continue
        r=$(python3 -I "$HERE/measure-pages.py" --tessdata "$d" --lang nor --book "${b%%-*}." "$DATA/lines/heldout2" "$DATA/books/$b")
        c=$(echo "$r" | awk '{print $4}'); e=$(echo "$r" | awk '{print $6}')
        tot=$((tot + c)); err=$(python3 -c "print($err + $c * $e / 100)")
    done
    hp=$(python3 -c "print(f'{100 * $err / max(1, $tot):.2f}')")
    printf "%-14s held-out lines %5s  held-out pages %5s  modern lines %5s  modern pages %5s\n" "$m" "$held" "$hp" "$modl" "$modp"
done
