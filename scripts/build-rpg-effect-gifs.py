from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
out=root.parent.parent/'outputs'
for name,file,w,h,cols,count,size in [('주먹-타격','melee-punch',64,64,5,10,220),('폭발-애니메이션','blast-fire',128,128,4,16,240),('지면-먼지','dust-impact',10,7,8,8,180)]:
 im=Image.open(root/'dist/rpg-fx'/f'{file}.png').convert('RGBA');frames=[]
 for i in range(count):
  f=im.crop((i%cols*w,i//cols*h,i%cols*w+w,i//cols*h+h));scale=min(size/w,size/h);f=f.resize((round(w*scale),round(h*scale)),Image.Resampling.NEAREST)
  canvas=Image.new('RGBA',(280,240),'#21382a');d=ImageDraw.Draw(canvas)
  for x in range(0,280,24):d.line((x,0,x,240),fill='#172c20')
  for y in range(0,240,24):d.line((0,y,280,y),fill='#172c20')
  canvas.alpha_composite(f,((280-f.width)//2,(240-f.height)//2));frames.append(canvas.convert('RGB'))
 frames[0].save(out/f'{name}.gif',save_all=True,append_images=frames[1:],duration=70,loop=0)
print('Created three animation GIF previews; source sprite sheets unchanged.')
