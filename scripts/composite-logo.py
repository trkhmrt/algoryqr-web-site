from PIL import Image, ImageDraw

base_path = r"C:\Users\Tarik\.cursor\projects\c-Users-Tarik-Desktop-Services\assets\global-menu-premium-v2.png"
logo_path = r"c:\Users\Tarik\Desktop\Services\algoryqr-web-site\public\brand\algory-logo.png"
out_path = r"c:\Users\Tarik\Desktop\Services\algoryqr-web-site\public\images\global-menu-premium.png"

WHITE = (255, 255, 255, 255)

base = Image.open(base_path).convert("RGBA")
logo = Image.open(logo_path).convert("RGBA")

draw = ImageDraw.Draw(base)
draw.rectangle([220, 274, 268, 310], fill=WHITE)

resized = logo.copy()
resized.thumbnail((42, 36), Image.Resampling.LANCZOS)
lw, lh = resized.size
base.alpha_composite(resized, (222 + (42 - lw) // 2, 276 + (36 - lh) // 2))

final = base.convert("RGB")
final.save(out_path, quality=95)
print("saved", out_path)
