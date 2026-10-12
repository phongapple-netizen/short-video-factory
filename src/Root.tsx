import React from 'react';
import {Composition} from 'remotion';
import {RegisteredVideos} from './videos/registered';
import {PirateCoins} from './videos/PirateCoins';
import {FactoryDemo} from './videos/FactoryDemo';
import {RemotionRoot as CubeCases} from './videos/cube/root';
import {Root as TrapezoidAndHistoryCases} from './videos/trapezoid/root';

export const RemotionRoot: React.FC = () => (
  <>
    <RegisteredVideos />
    <CubeCases />
    <TrapezoidAndHistoryCases />
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
