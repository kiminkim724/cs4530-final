/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type KaraokeArea = {
    id: string;
    currentSong?: string;
    songQueue: string[];
    isPlaying: boolean;
    elapsedTimeSec: number;
  }