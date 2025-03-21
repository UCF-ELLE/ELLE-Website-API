'''
resize.py

Resizes the images
to the smallest image
crops from top left point
'''

from PIL import Image
from os import listdir
from os.path import isfile, join
import sys

# Get all image files in current folder
img_files = [f for f in listdir(sys.path[0]) if isfile(join(sys.path[0], f))]
img_files.remove('resize.py')

# Get smallest image size in pixels
width, height = Image.open(img_files[0]).size
for image in img_files:
    im = Image.open(image)
    
    im_width, im_height = im.size
    if im_width < width and im_height < height:
        width = im_width
        height = im_height

# Crop images to smallest image size
# Save with the same name to cropped_images foler
for image in img_files:
    im = Image.open(image)
    new_im = im.crop((0, 0, width, height))
    #new_im.show()
    new_im_path = join("cropped_images", image)
    new_im.save(join(sys.path[0], new_im_path))