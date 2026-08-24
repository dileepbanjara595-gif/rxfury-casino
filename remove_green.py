import sys
from PIL import Image

def remove_green(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    for item in datas:
        r, g, b, a = item
        # Relaxed green threshold for better edge detection
        if g > r + 15 and g > b + 15 and g > 80:
            newData.append((255, 255, 255, 0)) # Transparent
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")

if __name__ == '__main__':
    remove_green(sys.argv[1], sys.argv[2])
