/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module 'react-lottie' {
  import { Component } from 'react';

  export interface Options {
    loop?: boolean;
    autoplay?: boolean;
    animationData: any;
    rendererSettings?: {
      preserveAspectRatio?: string;
    };
  }

  export interface LottieProps {
    options: Options;
    height?: number | string;
    width?: number | string;
    isStopped?: boolean;
    isPaused?: boolean;
    eventListeners?: Array<{
      eventName: string;
      callback: () => void;
    }>;
    speed?: number;
    direction?: number;
    ariaRole?: string;
    ariaLabel?: string;
    isClickToPauseDisabled?: boolean;
    title?: string;
  }

  export default class Lottie extends Component<LottieProps> {}
}