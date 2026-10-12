"""Validate the encoded MP4 and measure its final AAC, without changing it."""
import argparse,json,re,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
profile=json.loads((root/'standards/douyin-profile.json').read_text())
p=argparse.ArgumentParser();p.add_argument('video');p.add_argument('--seconds',type=float,required=True);p.add_argument('--draft',action='store_true');p.add_argument('--silent',action='store_true');a=p.parse_args()
video=(root/a.video).resolve();out=video.parent
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video');audio=next((s for s in probe['streams'] if s['codec_type']=='audio'),None)
scale=profile['draft']['scale'] if a.draft else 1
assert (v['width'],v['height'])==(round(profile['video']['width']*scale),round(profile['video']['height']*scale)), '尺寸错误'
n,d=map(int,v['r_frame_rate'].split('/'));assert abs(n/d-profile['video']['fps'])<1e-6,'帧率错误'
assert v['codec_name']==profile['encoding']['video_codec'] and v['pix_fmt']==profile['encoding']['pixel_format'],'编码/像素格式错误'
assert abs(float(probe['format']['duration'])-a.seconds)<=.25,'时长与时间轴不符'
(out/'ffprobe.json').write_text(json.dumps(probe,indent=2)+'\n')
report={'video':video.name,'valid':True,'duration':float(probe['format']['duration']),'audio':None}
if not a.silent:
 assert audio and audio['codec_name']==profile['audio']['codec'],'缺少AAC音频'
 log=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(video),'-vn','-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True).stderr
 summary=log.rsplit('Summary:',1)[-1]
 integrated=float(re.search(r'Integrated loudness:\s*I:\s*(-?[\d.]+)',summary).group(1));peak=float(re.search(r'True peak:\s*Peak:\s*(-?[\d.]+)',summary).group(1))
 assert abs(integrated-profile['audio']['integrated_lufs'])<=profile['audio']['lufs_tolerance'],'响度未达标'
 assert peak<=profile['audio']['maximum_true_peak_dbtp'],'真峰值超标'
 report['audio']={'integrated_lufs':integrated,'true_peak_dbtp':peak}
 (out/'ebur128-verification.log').write_text(log)
(out/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print('成品验证通过:',json.dumps(report,ensure_ascii=False))
