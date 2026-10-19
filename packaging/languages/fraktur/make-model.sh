#!/usr/bin/env bash
# Makes dan_latf, deu_latf taught æ ø å Æ Ø Å, in the way tesstrain
# fine-tunes a start model with new letters. The README says what is
# needed first (the clones under packaging/build/fraktur/clones, the lines
# under packaging/build/fraktur/lines made by lines_from_boxes.py).
#
#   make-model.sh prepare                 the unicharset, the proto model,
#                                         the lstmf files and the lists
#   make-model.sh train RUN ITERATIONS [LEARNING_RATE] [FROM_CHECKPOINT]
#                                         one training run; long, run it with
#                                         nohup and wait for it to end
#   make-model.sh finish RUN              the traineddata of a run's best
#                                         checkpoint, under models/RUN/
#   make-model.sh choose RUN              copies that traineddata to where
#                                         make-language-packages.py takes it
#
# Everything is written under packaging/build/fraktur/ (not in git).
set -euo pipefail

ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
BUILD=$ROOT/packaging/build/fraktur
BEST=$ROOT/packaging/build/languages/tessdata_best
LINES=$BUILD/lines
TRAIN=$BUILD/train
MODELS=$BUILD/models
NAME=dan_latf
START=deu_latf
SETS="dan german"
JOBS=$(nproc)

prepare() {
    mkdir -p "$MODELS/$START" "$TRAIN"
    # The start model's LSTM and unicharset, taken apart.
    combine_tessdata -u "$BEST/$START.traineddata" "$MODELS/$START/$START."
    # The unicharset of the training lines, merged into the start model's.
    find $(for s in $SETS; do echo "$LINES/$s"; done) -name '*.gt.txt' -print0 \
        | sort -z | xargs -0 cat > "$TRAIN/all-gt.txt"
    unicharset_extractor --output_unicharset "$TRAIN/my.unicharset" --norm_mode 2 "$TRAIN/all-gt.txt"
    merge_unicharsets "$MODELS/$START/$START.lstm-unicharset" "$TRAIN/my.unicharset" "$TRAIN/unicharset"
    # The proto model: a traineddata with the widened unicharset and no
    # word lists (the start model's are German).
    combine_lang_model --input_unicharset "$TRAIN/unicharset" --script_dir "$BUILD/clones" \
        --output_dir "$MODELS" --lang "$NAME"
    # A WordStr box beside every line image, from its text and size, as
    # tesstrain makes it; then an lstmf beside it.
    find $(for s in $SETS; do echo "$LINES/$s"; done) -name '*.png' -print0 | sort -z \
        | xargs -0 python3 -I -c '
import sys
from PIL import Image
for f in sys.argv[1:]:
    b = f[:-4]
    w, h = Image.open(f).size
    text = open(b + ".gt.txt", encoding="utf-8").read().strip()
    with open(b + ".box", "w", encoding="utf-8") as out:
        out.write(f"WordStr 0 0 {w} {h} 0 #{text}\n\t 0 0 {w} {h} 0\n")
'
    find $(for s in $SETS; do echo "$LINES/$s"; done) -name '*.png' -print0 \
        | xargs -0 -P "$JOBS" -I{} sh -c 'f="{}"; b="${f%.png}"; [ -s "$b.lstmf" ] || tesseract "$f" "$b" --psm 7 lstm.train >/dev/null 2>&1 || echo "failed: $f"'
    # Nine lines in ten to train on, one to evaluate on, shuffled the same every time.
    find $(for s in $SETS; do echo "$LINES/$s"; done) -name '*.lstmf' | sort | shuf --random-source=<(yes) > "$TRAIN/all.lstmf.txt"
    local n; n=$(wc -l < "$TRAIN/all.lstmf.txt")
    local e=$((n / 10))
    head -n "$e" "$TRAIN/all.lstmf.txt" > "$TRAIN/list.eval"
    tail -n +"$((e + 1))" "$TRAIN/all.lstmf.txt" > "$TRAIN/list.train"
    echo "lines: $n, train: $(wc -l < "$TRAIN/list.train"), eval: $e"
    echo "unicharset: $(head -1 "$TRAIN/unicharset") entries (start model: $(head -1 "$MODELS/$START/$START.lstm-unicharset"))"
}

train() {
    local run=$1 iterations=$2 rate=${3:-0.0001} from=${4:-}
    mkdir -p "$TRAIN/$run"
    local continue_from="$MODELS/$START/$START.lstm" old=(--old_traineddata "$BEST/$START.traineddata")
    if [ -n "$from" ]; then
        continue_from=$from
        old=()
    fi
    lstmtraining --debug_interval 0 \
        --traineddata "$MODELS/$NAME/$NAME.traineddata" \
        "${old[@]}" \
        --continue_from "$continue_from" \
        --learning_rate "$rate" \
        --model_output "$TRAIN/$run/$NAME" \
        --train_listfile "$TRAIN/list.train" \
        --eval_listfile "$TRAIN/list.eval" \
        --max_iterations "$iterations" \
        --target_error_rate 0.01
}

finish() {
    local run=$1
    mkdir -p "$MODELS/$run"
    lstmtraining --stop_training \
        --continue_from "$TRAIN/$run/${NAME}_checkpoint" \
        --traineddata "$MODELS/$NAME/$NAME.traineddata" \
        --model_output "$MODELS/$run/$NAME.traineddata"
    echo "$MODELS/$run/$NAME.traineddata"
}

choose() {
    cp "$MODELS/$1/$NAME.traineddata" "$BUILD/$NAME.traineddata"
    echo "$BUILD/$NAME.traineddata"
}

case "${1:-}" in
    prepare) prepare ;;
    train) train "$2" "$3" "${4:-}" "${5:-}" ;;
    finish) finish "$2" ;;
    choose) choose "$2" ;;
    *) sed -n '2,18p' "$0"; exit 1 ;;
esac
