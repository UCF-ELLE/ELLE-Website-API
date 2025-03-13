declare module 'react-howler' {
    import { Component } from 'react';
  
    interface ReactHowlerProps {
      src: string | string[];
      playing?: boolean;
      loop?: boolean;
      mute?: boolean;
      volume?: number;
      preload?: boolean;
      onLoad?: () => void;
      onPlay?: () => void;
      onEnd?: () => void;
      onPause?: () => void;
      onStop?: () => void;
    }
  
    export default class ReactHowler extends Component<ReactHowlerProps> {}
  }