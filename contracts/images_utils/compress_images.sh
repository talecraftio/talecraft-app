#!/usr/bin/env bash

cd images_hashed
IMG_LIST=$(ls *.png)
cd ..
for fn in $IMG_LIST
do
  convert images_hashed/$fn -resize 20% images_compressed/$(echo $fn | sed -e "s/\\.png/\\.webp/")
done
