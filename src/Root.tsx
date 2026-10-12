import React from 'react';
import {Composition} from 'remotion';
import {PirateCoins} from './videos/PirateCoins';
import {FactoryDemo} from './videos/FactoryDemo';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="PirateCoins"
      component={PirateCoins}
      durationInFrames={1800}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="FactoryDemo"
      component={FactoryDemo}
      durationInFrames={360}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
