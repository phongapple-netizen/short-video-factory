import React from 'react';
import {SAFE_BOTTOM,SIDES,SUBTITLE_HEIGHT} from '../layout';
import {C,FONT} from './Frame';

export const CaptionBox:React.FC<{children:React.ReactNode}>=({children})=>
  <div data-caption style={{position:'absolute',...SIDES,top:SAFE_BOTTOM-SUBTITLE_HEIGHT,
    height:SUBTITLE_HEIGHT,boxSizing:'border-box',padding:'14px 22px',background:'#FFFFFF',
    border:`1px solid ${C.line}`,borderRadius:18,color:C.ink,fontFamily:FONT,fontSize:32,
    lineHeight:1.4,fontWeight:650,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center'}}>
    <span>{children}</span>
  </div>;
