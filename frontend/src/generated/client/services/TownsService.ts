/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationArea } from '../models/ConversationArea';
import type { KaraokeArea } from '../models/KaraokeArea';
import type { PosterSessionArea } from '../models/PosterSessionArea';
import type { SongSchema } from '../models/SongSchema';
import type { Town } from '../models/Town';
import type { TownCreateParams } from '../models/TownCreateParams';
import type { TownCreateResponse } from '../models/TownCreateResponse';
import type { TownSettingsUpdate } from '../models/TownSettingsUpdate';
import type { ViewingArea } from '../models/ViewingArea';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class TownsService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * List all towns that are set to be publicly available
     * @returns Town list of towns
     * @throws ApiError
     */
    public listTowns(): CancelablePromise<Array<Town>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/towns',
        });
    }

    /**
     * Create a new town
     * @param requestBody The public-facing information for the new town
     * @returns TownCreateResponse The ID of the newly created town, and a secret password that will be needed to update or delete this town.
     * @throws ApiError
     */
    public createTown(
        requestBody: TownCreateParams,
    ): CancelablePromise<TownCreateResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/towns',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Updates an existing town's settings by ID
     * @param townId town to update
     * @param xCoveyTownPassword town update password, must match the password returned by createTown
     * @param requestBody The updated settings
     * @returns void
     * @throws ApiError
     */
    public updateTown(
        townId: string,
        xCoveyTownPassword: string,
        requestBody: TownSettingsUpdate,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/towns/{townID}',
            path: {
                'townID': townId,
            },
            headers: {
                'X-CoveyTown-Password': xCoveyTownPassword,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid password or update values specified`,
            },
        });
    }

    /**
     * Deletes a town
     * @param townId ID of the town to delete
     * @param xCoveyTownPassword town update password, must match the password returned by createTown
     * @returns void
     * @throws ApiError
     */
    public deleteTown(
        townId: string,
        xCoveyTownPassword: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/towns/{townID}',
            path: {
                'townID': townId,
            },
            headers: {
                'X-CoveyTown-Password': xCoveyTownPassword,
            },
            errors: {
                400: `Invalid password or update values specified`,
            },
        });
    }

    /**
     * Creates a conversation area in a given town
     * @param townId ID of the town in which to create the new conversation area
     * @param xSessionToken session token of the player making the request, must match the session token returned when the player joined the town
     * @param requestBody The new conversation area to create
     * @returns void
     * @throws ApiError
     */
    public createConversationArea(
        townId: string,
        xSessionToken: string,
        requestBody: ConversationArea,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/towns/{townID}/conversationArea',
            path: {
                'townID': townId,
            },
            headers: {
                'X-Session-Token': xSessionToken,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid values specified`,
            },
        });
    }

    /**
     * Creates a viewing area in a given town
     * @param townId ID of the town in which to create the new viewing area
     * @param xSessionToken session token of the player making the request, must
     * match the session token returned when the player joined the town
     * @param requestBody The new viewing area to create
     * @returns void
     * @throws ApiError
     */
    public createViewingArea(
        townId: string,
        xSessionToken: string,
        requestBody: ViewingArea,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/towns/{townID}/viewingArea',
            path: {
                'townID': townId,
            },
            headers: {
                'X-Session-Token': xSessionToken,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid values specified`,
            },
        });
    }

    /**
     * Creates a karaoke area in a given town
     * @param townId ID of the town in which to create the new karaoke area
     * @param xSessionToken session token of the player making the request, must
     * match the session token returned when the player joined the town
     * @param requestBody The new karaoke area to create
     * @returns void
     * @throws ApiError
     */
    public createKaraokeArea(
        townId: string,
        xSessionToken: string,
        requestBody: KaraokeArea,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/towns/{townID}/karaokeArea',
            path: {
                'townID': townId,
            },
            headers: {
                'X-Session-Token': xSessionToken,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid values specified`,
            },
        });
    }

    /**
     * Updates the current song rating, or add a rating to an unrated song
     * @param townId ID of the town in which to update the karaoke area image contents
     * @param songId ID of the song to update
     * @param rating
     * @param xSessionToken session token of the player making the request, must
     * match the session token returned when the player joined the town
     * @returns void
     * @throws ApiError
     */
    public updateSongRating(
        townId: string,
        songId: string,
        rating: 1 | 2 | 3 | 4 | 5,
        xSessionToken: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/towns/{townID}/songRating',
            path: {
                'townID': townId,
            },
            headers: {
                'X-Session-Token': xSessionToken,
            },
            query: {
                'songID': songId,
                'rating': rating,
            },
            errors: {
                400: `Invalid values specified`,
            },
        });
    }

    /**
     * Updates the current song rating, or add a rating to an unrated song
     * @param townId ID of the town in which to update the karaoke area image contents
     * @param songId ID of the song to update
     * @param reaction
     * @param xSessionToken session token of the player making the request, must
     * match the session token returned when the player joined the town
     * @returns void
     * @throws ApiError
     */
    public updateSongReaction(
        townId: string,
        songId: string,
        reaction: 'likes' | 'dislikes',
        xSessionToken: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/towns/{townID}/songReaction',
            path: {
                'townID': townId,
            },
            headers: {
                'X-Session-Token': xSessionToken,
            },
            query: {
                'songID': songId,
                'reaction': reaction,
            },
            errors: {
                400: `Invalid values specified`,
            },
        });
    }

    /**
     * Gets the song information of a given karaoke area in a given town, based on the song id
     * @param townId ID of the town in which to get the karaoke area song information
     * @param songId ID of the song to retrieve
     * @param xSessionToken session token of the player making the request, must
     * match the session token returned when the player joined the town
     * @returns SongSchema Ok
     * @throws ApiError
     */
    public getSongInfo(
        townId: string,
        songId: string,
        xSessionToken: string,
    ): CancelablePromise<SongSchema> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/towns/{townID}/songInfo',
            path: {
                'townID': townId,
            },
            headers: {
                'X-Session-Token': xSessionToken,
            },
            query: {
                'songID': songId,
            },
            errors: {
                400: `Invalid values specified`,
            },
        });
    }

    /**
     * Gets the song information of a given karaoke area in a given town, based on the song id
     * @param townId ID of the town in which to get the karaoke area song information
     * @param n number of songs to retrieve
     * @param xSessionToken session token of the player making the request, must
     * match the session token returned when the player joined the town
     * @returns SongSchema Ok
     * @throws ApiError
     */
    public getTopSongs(
        townId: string,
        n: number,
        xSessionToken: string,
    ): CancelablePromise<Array<SongSchema>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/towns/{townID}/topSongs',
            path: {
                'townID': townId,
            },
            headers: {
                'X-Session-Token': xSessionToken,
            },
            query: {
                'n': n,
            },
            errors: {
                400: `Invalid values specified`,
            },
        });
    }

    /**
     * @param codeChallenge
     * @param state
     * @returns void
     * @throws ApiError
     */
    public spotifyAuthorize(
        codeChallenge: string,
        state: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/towns/authorize',
            query: {
                'codeChallenge': codeChallenge,
                'state': state,
            },
        });
    }

    /**
     * @param codeVerifier
     * @returns void
     * @throws ApiError
     */
    public spotifyCallback(
        codeVerifier: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/towns/callback',
            query: {
                'codeVerifier': codeVerifier,
            },
        });
    }

    /**
     * @param townId
     * @param karaokeSessionId
     * @param xSessionToken
     * @returns void
     * @throws ApiError
     */
    public spotifyClientCredentials(
        townId: string,
        karaokeSessionId: string,
        xSessionToken: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/towns/{townID}/{karaokeSessionId}/clientCredentials',
            path: {
                'townID': townId,
                'karaokeSessionId': karaokeSessionId,
            },
            headers: {
                'X-Session-Token': xSessionToken,
            },
            errors: {
                400: `Invalid values specified`,
            },
        });
    }

    /**
     * Creates a poster session area in a given town
     * @param townId ID of the town in which to create the new poster session area
     * @param xSessionToken session token of the player making the request, must
     * match the session token returned when the player joined the town
     * @param requestBody The new poster session area to create
     * @returns void
     * @throws ApiError
     */
    public createPosterSessionArea(
        townId: string,
        xSessionToken: string,
        requestBody: PosterSessionArea,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/towns/{townID}/posterSessionArea',
            path: {
                'townID': townId,
            },
            headers: {
                'X-Session-Token': xSessionToken,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid values specified`,
            },
        });
    }

    /**
     * Gets the image contents of a given poster session area in a given town
     * @param townId ID of the town in which to get the poster session area image contents
     * @param posterSessionId interactable ID of the poster session
     * @param xSessionToken session token of the player making the request, must
     * match the session token returned when the player joined the town
     * @returns string Ok
     * @throws ApiError
     */
    public getPosterAreaImageContents(
        townId: string,
        posterSessionId: string,
        xSessionToken: string,
    ): CancelablePromise<string> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/towns/{townID}/{posterSessionId}/imageContents',
            path: {
                'townID': townId,
                'posterSessionId': posterSessionId,
            },
            headers: {
                'X-Session-Token': xSessionToken,
            },
            errors: {
                400: `Invalid values specified`,
            },
        });
    }

    /**
     * Increment the stars of a given poster session area in a given town, as long as there is
     * a poster image. Returns the new number of stars.
     * @param townId ID of the town in which to get the poster session area image contents
     * @param posterSessionId interactable ID of the poster session
     * @param xSessionToken session token of the player making the request, must
     * match the session token returned when the player joined the town
     * @returns number Ok
     * @throws ApiError
     */
    public incrementPosterAreaStars(
        townId: string,
        posterSessionId: string,
        xSessionToken: string,
    ): CancelablePromise<number> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/towns/{townID}/{posterSessionId}/incStars',
            path: {
                'townID': townId,
                'posterSessionId': posterSessionId,
            },
            headers: {
                'X-Session-Token': xSessionToken,
            },
            errors: {
                400: `Invalid values specified`,
            },
        });
    }

}
