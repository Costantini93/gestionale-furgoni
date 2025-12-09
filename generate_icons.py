from PIL import Image, ImageDraw, ImageFont
import os

def create_app_icon(size, output_path):
    # Crea immagine con sfondo verde
    img = Image.new('RGB', (size, size), color='#27AE60')
    draw = ImageDraw.Draw(img)
    
    # Aggiungi forma geometrica (rombo)
    margin = size // 6
    points = [
        (size // 2, margin),           # Top
        (size - margin, size // 2),    # Right
        (size // 2, size - margin),    # Bottom
        (margin, size // 2)            # Left
    ]
    draw.polygon(points, fill='white', outline='#2C3E50')
    
    # Aggiungi cerchio centrale
    center = size // 2
    radius = size // 8
    draw.ellipse([center-radius, center-radius, center+radius, center+radius], 
                 fill='#2C3E50', outline='#1e293b')
    
    # Salva
    img.save(output_path, 'PNG')
    print(f'✅ Creata icona: {output_path} ({size}x{size})')

# Directory output
output_dir = r'c:\Users\aleco\OneDrive\Desktop\ROBI GESTIONALE FURGONI\public\icons'
os.makedirs(output_dir, exist_ok=True)

# Genera icone
create_app_icon(192, os.path.join(output_dir, 'icon-192x192.png'))
create_app_icon(512, os.path.join(output_dir, 'icon-512x512.png'))

print('\n✅ Tutte le icone PWA sono state generate!')
print('📍 Posizione:', output_dir)
