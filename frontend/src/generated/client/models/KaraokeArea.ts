/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Spotify_Track } from './Spotify_Track';

export type KaraokeArea = {
    id: string;
    title?: string;
    currentSong?: Spotify_Track;
    songQueue: Array<string>;
    isPlaying: boolean;
    elapsedTimeSec: number;
};
