"""Generate Spaarvos app icons using only stdlib (no PIL needed)."""
import struct, zlib, math, os

def png(width, height, pixels):
    """pixels: list of (r,g,b,a) tuples, row by row."""
    def u32(n): return struct.pack('>I', n)
    def chunk(tag, data):
        c = zlib.crc32(tag + data) & 0xffffffff
        return u32(len(data)) + tag + data + u32(c)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', u32(width) + u32(height) + bytes([8,6,0,0,0]))
    rows = b''
    for y in range(height):
        row = b'\x00'
        for x in range(width):
            r,g,b,a = pixels[y*width+x]
            row += bytes([r,g,b,a])
        rows += row
    idat = chunk(b'IDAT', zlib.compress(rows, 9))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

def draw_icon(size):
    bg = (232, 87, 42, 255)      # #E8572A orange
    fg = (255, 255, 255, 255)    # white
    dark = (180, 60, 20, 255)    # dark orange for details
    transparent = (0, 0, 0, 0)

    pixels = [transparent] * (size * size)
    cx, cy, r = size//2, size//2, size//2

    def px(x, y, color):
        if 0 <= x < size and 0 <= y < size:
            pixels[y*size+x] = color

    def circle(x0, y0, radius, color, fill=True):
        for y in range(max(0,y0-radius-1), min(size,y0+radius+2)):
            for x in range(max(0,x0-radius-1), min(size,x0+radius+2)):
                d = math.sqrt((x-x0)**2+(y-y0)**2)
                if fill and d <= radius: px(x,y,color)
                elif not fill and abs(d-radius) < 1: px(x,y,color)

    def rect(x0,y0,x1,y1,color):
        for y in range(max(0,y0), min(size,y1)):
            for x in range(max(0,x0), min(size,x1)):
                px(x,y,color)

    def triangle(pts, color):
        # simple scanline
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        miny,maxy = min(ys),max(ys)
        for y in range(max(0,miny), min(size,maxy+1)):
            intersects = []
            n = len(pts)
            for i in range(n):
                x0,y0 = pts[i]; x1,y1 = pts[(i+1)%n]
                if (y0<=y<y1) or (y1<=y<y0):
                    if y1!=y0:
                        xi = x0 + (y-y0)*(x1-x0)/(y1-y0)
                        intersects.append(int(xi))
            intersects.sort()
            for i in range(0,len(intersects)-1,2):
                for x in range(max(0,intersects[i]), min(size,intersects[i+1]+1)):
                    px(x,y,color)

    s = size / 1024

    # Round background
    circle(cx, cy, int(r*0.96), bg)

    # Fox head (large circle, slightly above center)
    head_r = int(size * 0.30)
    head_cy = int(cy * 0.90)
    circle(cx, head_cy, head_r, fg)

    # Fox ears (two triangles)
    ear_w = int(size * 0.14)
    ear_h = int(size * 0.20)
    ear_top = head_cy - head_r + int(size*0.02)
    # left ear
    triangle([
        (cx - int(head_r*0.55), ear_top + ear_h),
        (cx - int(head_r*0.55) - ear_w, ear_top - ear_h//2),
        (cx - int(head_r*0.10), ear_top),
    ], bg)
    # right ear
    triangle([
        (cx + int(head_r*0.55), ear_top + ear_h),
        (cx + int(head_r*0.55) + ear_w, ear_top - ear_h//2),
        (cx + int(head_r*0.10), ear_top),
    ], bg)

    # Inner ears (dark orange)
    triangle([
        (cx - int(head_r*0.50), ear_top + ear_h - int(size*0.04)),
        (cx - int(head_r*0.50) - ear_w//2, ear_top - ear_h//4),
        (cx - int(head_r*0.15), ear_top + int(size*0.02)),
    ], dark)
    triangle([
        (cx + int(head_r*0.50), ear_top + ear_h - int(size*0.04)),
        (cx + int(head_r*0.50) + ear_w//2, ear_top - ear_h//4),
        (cx + int(head_r*0.15), ear_top + int(size*0.02)),
    ], dark)

    # Fox face orange mask
    face_r = int(head_r * 0.70)
    circle(cx, head_cy + int(size*0.05), face_r, bg)

    # White muzzle
    circle(cx, head_cy + int(head_r*0.40), int(head_r*0.38), fg)

    # Eyes
    eye_y = head_cy - int(head_r*0.05)
    eye_r = int(head_r * 0.13)
    circle(cx - int(head_r*0.35), eye_y, eye_r, (40,20,10,255))
    circle(cx + int(head_r*0.35), eye_y, eye_r, (40,20,10,255))
    # eye shine
    circle(cx - int(head_r*0.30), eye_y - int(eye_r*0.3), int(eye_r*0.35), fg)
    circle(cx + int(head_r*0.40), eye_y - int(eye_r*0.3), int(eye_r*0.35), fg)

    # Nose
    circle(cx, head_cy + int(head_r*0.38), int(head_r*0.09), (40,20,10,255))

    return pixels

sizes = {
    'apps/mobile/assets/icon.png': 1024,
    'apps/mobile/assets/adaptive-icon.png': 1024,
    'apps/mobile/assets/splash-icon.png': 200,
    'apps/mobile/assets/favicon.png': 64,
}

base = r'C:\Users\PC\Desktop\spaarvos'
for rel, sz in sizes.items():
    path = os.path.join(base, rel.replace('/', os.sep))
    pixels = draw_icon(sz)
    data = png(sz, sz, pixels)
    with open(path, 'wb') as f:
        f.write(data)
    print(f'OK {rel} ({sz}x{sz})')

print('Done!')
