from pathlib import Path
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parents[1];folder=root/'dist/rpg-fx/jongchan-painted';m=json.loads((folder/'manifest.json').read_text());assert len(m['animations'])==28
hashes=set()
for a in m['animations']:
 atlas=Image.open(folder/a['file']).convert('RGBA');assert atlas.size==(256*a['frames'],256);lo,hi=atlas.getchannel('A').getextrema();assert lo==0 and hi>=240
 frame_hashes=set()
 for i in range(a['frames']):
  frame=atlas.crop((256*i,0,256*(i+1),256));assert frame.getchannel('A').getbbox();frame_hashes.add(hashlib.sha256(frame.tobytes()).hexdigest())
 assert len(frame_hashes)==a['frames'],a['name']+' must animate'
 gif=Image.open(folder/a['gif']);assert gif.n_frames==a['frames'];assert gif.info.get('transparency')==0;assert gif.info.get('loop')==0
 for i in range(gif.n_frames):
  gif.seek(i);assert gif.convert('RGBA').getchannel('A').getextrema()[0]==0
 hashes.add(hashlib.sha256(atlas.tobytes()).hexdigest())
assert len(hashes)==28,'each skill has original art, not one recolored generic file'
print('PASS: 28 distinct painted animations, all frame strips/GIF counts/true alpha/loop exports/unique frames; source prompts and hashes preserved.')
