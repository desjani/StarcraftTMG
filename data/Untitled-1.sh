#!/bin/bash

API_KEY="AIzaSyDHRhS4FIO_1s_2Tn2C77noJRgbs-y_mks"
PROJECT="starcrafttmgbeta"
DATABASE="starcrafttmgbeta"
BASE_URL="https://firestore.googleapis.com/v1/projects/$PROJECT/databases/$DATABASE/documents"

collections=(
  "faction"
  "factions"
  "shared_faction"
  "shared_factions"
  "faction_cards"
  "shared_faction_cards"
  "faction_units"
  "shared_faction_units"
)

for col in "${collections[@]}"; do
  echo "Checking collection: $col"
  url="$BASE_URL/$col?key=$API_KEY"
  http_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$http_status" = "200" ]; then
    echo "  -> $col is PUBLIC and accessible! Saving to $col.json"
    curl -s "$url" > "$col.json"
  else
    echo "  -> $col is not public or does not exist (HTTP $http_status)"
  fi
done