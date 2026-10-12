"""Verify real GitHub downloads; urllib uses standard proxy/CA environment settings."""
import argparse,json,re
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen
p=argparse.ArgumentParser();p.add_argument('--repository',required=True);p.add_argument('--branch',required=True);p.add_argument('--files',required=True);p.add_argument('--output',required=True);a=p.parse_args()
results=[]
for file in json.loads(a.files):
 url=f'https://raw.githubusercontent.com/{a.repository}/{quote(a.branch,safe="")}/{quote(file,safe="/")}'
 with urlopen(url,timeout=30) as response:
  status=response.status;head=response.read(96)
 assert status==200,f'链接不可用: HTTP{status}: {url}'
 if file.endswith('.mp4'):assert b'ftyp' in head[:64],f'返回内容不是MP4: {url}'
 if file.endswith('.png'):assert head.startswith(b'\x89PNG'),f'返回内容不是PNG: {url}'
 if file.endswith('.srt'):assert re.match(r'\d+\r?\n\d{2}:\d{2}:',head.decode('utf-8-sig',errors='replace')),f'返回内容不是SRT: {url}'
 results.append({'file':file,'url':url,'status':status});print('已验证',url)
out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
