#!/bin/bash
# Copy fresh data files to both dist/pages/data and web/public/data
set -e

mkdir -p dist/pages/data
mkdir -p web/public/data

cp data/army_units_object.json dist/pages/data/army_units_object.json
cp data/tactical_cards_object.json dist/pages/data/tactical_cards_object.json
cp data/army_units_object.json web/public/data/army_units_object.json
cp data/tactical_cards_object.json web/public/data/tactical_cards_object.json
