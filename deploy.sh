#!/bin/bash
# Deploy GMAnt's Wild Shape to live Foundry modules directory
# Usage: bash deploy.sh

SRC="R:/Foundry/Modules/GMAnt_Wild_Shape"
DEST="R:/Foundry/Data/modules/gmants-wild-shape"

mkdir -p "$DEST"

cp "$SRC/module.json" "$DEST/"
cp -r "$SRC/scripts" "$DEST/"
cp -r "$SRC/styles" "$DEST/"
cp -r "$SRC/templates" "$DEST/"
cp -r "$SRC/lang" "$DEST/"
[ -d "$SRC/assets" ] && cp -r "$SRC/assets" "$DEST/"
[ -d "$SRC/packs" ] && cp -r "$SRC/packs" "$DEST/"

echo "Deployed gmants-wild-shape to $DEST"

# Push to the NAS-hosted live Foundry v14 server (no-op if NAS is unreachable).
bash "R:/Foundry/Modules/nas-sync.sh" "gmants-wild-shape"

echo "Refresh your browser (F5) to pick up changes."
