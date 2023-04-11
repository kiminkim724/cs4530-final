/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type KaraokeArea = {
    id: string;
    title?: string;
    currentSong?: string;
    songQueue: Array<string>;
    isSongPlaying: boolean;
    elapsedTimeSec: number;
};
