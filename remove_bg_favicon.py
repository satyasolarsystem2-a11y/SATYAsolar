import sys
from PIL import Image
import os

def remove_white_bg(img_path, out_path, is_ico=False):
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
        
        if is_ico:
            # Resize for ICO format
            img = img.resize((32, 32), Image.Resampling.LANCZOS)
            img.save(out_path, format="ICO")
        else:
            img.save(out_path, "PNG")
        print("Success.")
    except Exception as e:
        print(f"Error: {e}")

src = r"C:\Users\Nikhil\.gemini\antigravity-ide\brain\5b21e791-22c8-455c-a647-f088b6ed7694\media__1781475973371.png"
favicon_out = r"c:\Users\Nikhil\OneDrive\New cloud folder\OneDrive\Documents\Satya Solar\frontend\public\favicon.ico"

remove_white_bg(src, favicon_out, is_ico=True)
