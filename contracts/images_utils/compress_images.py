from pathlib import Path

from wand.image import Image

for file in Path('./images_hashed').iterdir():
    if file.name.endswith('.png'):
        with Image(filename=f'images_hashed/{file.name}') as im:
            im.resize(int(im.width * .2), int(im.height * .2))
            with open(f'images_compressed/{file.name.replace(".png", ".webp")}', 'wb') as out:
                im.save(out)
