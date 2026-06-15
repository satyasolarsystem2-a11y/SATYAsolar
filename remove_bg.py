import sys
from PIL import Image
import os

def remove_white_bg(img_path, out_path):
    print(f"Processing {img_path} to {out_path}")
    try:
        img = Image.open(img_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # If pixel is near-white
            if item[0] > 220 and item[1] > 220 and item[2] > 220:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save(out_path, "PNG")
        print("Success.")
    except Exception as e:
        print(f"Error: {e}")

src = r"C:\Users\Nikhil\.gemini\antigravity-ide\brain\5b21e791-22c8-455c-a647-f088b6ed7694\media__1781475973371.png"
logo_out = r"c:\Users\Nikhil\OneDrive\New cloud folder\OneDrive\Documents\Satya Solar\frontend\public\logo.png"
icon_out = r"c:\Users\Nikhil\OneDrive\New cloud folder\OneDrive\Documents\Satya Solar\frontend\public\app-icon.png"

# Save icon
remove_white_bg(src, logo_out)
remove_white_bg(src, icon_out)
