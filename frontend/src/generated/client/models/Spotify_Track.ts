/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Album } from './Album';
import type { Entity } from './Entity';

export type Spotify_Track = {
    album: Album;
    artists: Array<Entity>;
    duration_ms: number;
    id: string | null;
    is_playable: boolean;
    name: string;
    uid: string;
    uri: string;
    media_type: Spotify_Track.media_type;
    type: Spotify_Track.type;
    track_type: Spotify_Track.track_type;
    linked_from: {
        id: string | null;
        uri: string | null;
    };
};

export namespace Spotify_Track {

    export enum media_type {
        AUDIO = 'audio',
        VIDEO = 'video',
    }

    export enum type {
        TRACK = 'track',
        EPISODE = 'episode',
        AD = 'ad',
    }

    export enum track_type {
        AUDIO = 'audio',
        VIDEO = 'video',
    }


}

