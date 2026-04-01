#!/bin/bash
# Deploy 5e Transformations to live Foundry modules directory
# Usage: bash deploy.sh

SRC="R:/Foundry/Modules/5e_Transformations"
DEST="R:/Foundry/Data/modules/5e-transformations"

mkdir -p "$DEST"

cp "$SRC/module.json" "$DEST/"
cp -r "$SRC/scripts" "$DEST/"
cp -r "$SRC/styles" "$DEST/"
cp -r "$SRC/templates" "$DEST/"
cp -r "$SRC/lang" "$DEST/"
[ -d "$SRC/assets" ] && cp -r "$SRC/assets" "$DEST/"
[ -d "$SRC/packs" ] && cp -r "$SRC/packs" "$DEST/"

echo "Deployed 5e-transformations to $DEST"
echo "Refresh your browser (F5) to pick up changes."
