#!/usr/bin/env python3
"""
Create test images for IOPaint testing
"""

from PIL import Image, ImageDraw
import os

def create_test_images():
    # Create a simple test image (100x100 white with a black circle)
    img = Image.new('RGB', (100, 100), 'white')
    draw = ImageDraw.Draw(img)
    draw.ellipse([25, 25, 75, 75], fill='black')
    img.save('test_image.png')
    
    # Create a mask (100x100 white with a black circle in the center)
    mask = Image.new('RGB', (100, 100), 'white')
    draw = ImageDraw.Draw(mask)
    draw.ellipse([40, 40, 60, 60], fill='black')
    mask.save('test_mask.png')
    
    print("✅ Created test_image.png and test_mask.png")

if __name__ == "__main__":
    create_test_images()
