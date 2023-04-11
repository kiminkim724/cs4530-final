import assert from 'assert';
import dotenv from 'dotenv';
import {
  Body,
  Controller,
  Delete,
  Example,
  Get,
  Header,
  Patch,
  Path,
  Post,
  Response,
  Request,
  Route,
  Tags,
  Query,
} from 'tsoa';
import * as express from 'express';
import axios from 'axios';
import { Town, TownCreateParams, TownCreateResponse } from '../api/Model';
import InvalidParametersError from '../lib/InvalidParametersError';
import CoveyTownsStore from '../lib/TownsStore';
import {
  ConversationArea,
  CoveyTownSocket,
  TownSettingsUpdate,
  ViewingArea,
  PosterSessionArea,
  KaraokeArea,
} from '../types/CoveyTownSocket';
import PosterSessionAreaReal from './PosterSessionArea';
import { isKaraokeArea, isPosterSessionArea } from '../TestUtils';
import KaraokeDao from '../daos/KaraokeDao';
import SongSchema from '../daos/SongSchema';

dotenv.config();

dotenv.config();

/**
 * This is the town route
 */
@Route('towns')
@Tags('towns')
// TSOA (which we use to generate the REST API from this file) does not support default exports, so the controller can't be a default export.
// eslint-disable-next-line import/prefer-default-export
export class TownsController extends Controller {
  private _townsStore: CoveyTownsStore = CoveyTownsStore.getInstance();

  /**
   * List all towns that are set to be publicly available
   *
   * @returns list of towns
   */
  @Get()
  public async listTowns(): Promise<Town[]> {
    return this._townsStore.getTowns();
  }

  /**
   * Create a new town
   *
   * @param request The public-facing information for the new town
   * @example request {"friendlyName": "My testing town public name", "isPubliclyListed": true}
   * @returns The ID of the newly created town, and a secret password that will be needed to update or delete this town.
   */
  @Example<TownCreateResponse>({ townID: 'stringID', townUpdatePassword: 'secretPassword' })
  @Post()
  public async createTown(@Body() request: TownCreateParams): Promise<TownCreateResponse> {
    const { townID, townUpdatePassword } = await this._townsStore.createTown(
      request.friendlyName,
      request.isPubliclyListed,
      request.mapFile,
    );
    return {
      townID,
      townUpdatePassword,
    };
  }

  /**
   * Updates an existing town's settings by ID
   *
   * @param townID  town to update
   * @param townUpdatePassword  town update password, must match the password returned by createTown
   * @param requestBody The updated settings
   */
  @Patch('{townID}')
  @Response<InvalidParametersError>(400, 'Invalid password or update values specified')
  public async updateTown(
    @Path() townID: string,
    @Header('X-CoveyTown-Password') townUpdatePassword: string,
    @Body() requestBody: TownSettingsUpdate,
  ): Promise<void> {
    const success = this._townsStore.updateTown(
      townID,
      townUpdatePassword,
      requestBody.friendlyName,
      requestBody.isPubliclyListed,
    );
    if (!success) {
      throw new InvalidParametersError('Invalid password or update values specified');
    }
  }

  /**
   * Deletes a town
   * @param townID ID of the town to delete
   * @param townUpdatePassword town update password, must match the password returned by createTown
   */
  @Delete('{townID}')
  @Response<InvalidParametersError>(400, 'Invalid password or update values specified')
  public async deleteTown(
    @Path() townID: string,
    @Header('X-CoveyTown-Password') townUpdatePassword: string,
  ): Promise<void> {
    const success = this._townsStore.deleteTown(townID, townUpdatePassword);
    if (!success) {
      throw new InvalidParametersError('Invalid password or update values specified');
    }
  }

  /**
   * Creates a conversation area in a given town
   * @param townID ID of the town in which to create the new conversation area
   * @param sessionToken session token of the player making the request, must match the session token returned when the player joined the town
   * @param requestBody The new conversation area to create
   */
  @Post('{townID}/conversationArea')
  @Response<InvalidParametersError>(400, 'Invalid values specified')
  public async createConversationArea(
    @Path() townID: string,
    @Header('X-Session-Token') sessionToken: string,
    @Body() requestBody: ConversationArea,
  ): Promise<void> {
    const town = this._townsStore.getTownByID(townID);
    if (!town?.getPlayerBySessionToken(sessionToken)) {
      throw new InvalidParametersError('Invalid values specified');
    }
    const success = town.addConversationArea(requestBody);
    if (!success) {
      throw new InvalidParametersError('Invalid values specified');
    }
  }

  /**
   * Creates a viewing area in a given town
   *
   * @param townID ID of the town in which to create the new viewing area
   * @param sessionToken session token of the player making the request, must
   *        match the session token returned when the player joined the town
   * @param requestBody The new viewing area to create
   *
   * @throws InvalidParametersError if the session token is not valid, or if the
   *          viewing area could not be created
   */
  @Post('{townID}/viewingArea')
  @Response<InvalidParametersError>(400, 'Invalid values specified')
  public async createViewingArea(
    @Path() townID: string,
    @Header('X-Session-Token') sessionToken: string,
    @Body() requestBody: ViewingArea,
  ): Promise<void> {
    const town = this._townsStore.getTownByID(townID);
    if (!town) {
      throw new InvalidParametersError('Invalid values specified');
    }
    if (!town?.getPlayerBySessionToken(sessionToken)) {
      throw new InvalidParametersError('Invalid values specified');
    }
    const success = town.addViewingArea(requestBody);
    if (!success) {
      throw new InvalidParametersError('Invalid values specified');
    }
  }

  /**
   * Creates a karaoke area in a given town
   *
   * @param townID ID of the town in which to create the new karaoke area
   * @param sessionToken session token of the player making the request, must
   *        match the session token returned when the player joined the town
   * @param requestBody The new karaoke area to create
   *
   * @throws InvalidParametersError if the session token is not valid, or if the
   *          karaoke area could not be created
   */
  @Post('{townID}/karaokeArea')
  @Response<InvalidParametersError>(400, 'Invalid values specified')
  public async createKaraokeArea(
    @Path() townID: string,
    @Header('X-Session-Token') sessionToken: string,
    @Body() requestBody: KaraokeArea,
  ): Promise<void> {
    const town = this._townsStore.getTownByID(townID);
    if (!town) {
      throw new InvalidParametersError('Invalid values specified');
    }
    if (!town?.getPlayerBySessionToken(sessionToken)) {
      throw new InvalidParametersError('Invalid values specified');
    }
    const success = town.addKaraokeArea(requestBody);
    if (!success) {
      throw new InvalidParametersError('Invalid values specified');
    }
  }

  /**
   * Updates the current song rating, or add a rating to an unrated song
   *
   * @param townID ID of the town in which to update the karaoke area image contents
   * @param karaokeAreaId interactable ID of the karaoke
   * @param sessionToken session token of the player making the request, must
   *        match the session token returned when the player joined the town
   *
   * @throws InvalidParametersError if the session token is not valid, or if the
   *          karaoke session specified does not exist
   */
  @Patch('{townID}/songRating')
  @Response<InvalidParametersError>(400, 'Invalid values specified')
  public async updateSongRating(
    @Path() townID: string,
    @Query() songID: string,
    @Query() rating: 1 | 2 | 3 | 4 | 5,
    @Header('X-Session-Token') sessionToken: string,
  ): Promise<void> {
    const curTown = this._townsStore.getTownByID(townID);
    if (!curTown) {
      throw new InvalidParametersError('Invalid town ID');
    }
    if (!curTown.getPlayerBySessionToken(sessionToken)) {
      throw new InvalidParametersError('Invalid session ID');
    }
    const karaokeDao = new KaraokeDao();
    const success = karaokeDao.addRatingToSong(songID, rating);
    if (!success) {
      throw new Error('Fail to add/update rating to song');
    }
  }

  /**
   * Updates the current song rating, or add a rating to an unrated song
   *
   * @param townID ID of the town in which to update the karaoke area image contents
   * @param karaokeAreaId interactable ID of the karaoke
   * @param sessionToken session token of the player making the request, must
   *        match the session token returned when the player joined the town
   *
   * @throws InvalidParametersError if the session token is not valid, or if the
   *          karaoke session specified does not exist
   */
  @Patch('{townID}/songReaction')
  @Response<InvalidParametersError>(400, 'Invalid values specified')
  public async updateSongReaction(
    @Path() townID: string,
    @Query() songID: string,
    @Query() reaction: 'likes' | 'dislikes',
    @Header('X-Session-Token') sessionToken: string,
  ): Promise<void> {
    const curTown = this._townsStore.getTownByID(townID);
    if (!curTown) {
      throw new InvalidParametersError('Invalid town ID');
    }
    if (!curTown.getPlayerBySessionToken(sessionToken)) {
      throw new InvalidParametersError('Invalid session ID');
    }
    const karaokeDao = new KaraokeDao();
    const success = karaokeDao.addReactionToSong(songID, reaction);
    if (!success) {
      throw new Error('Fail to add/update rating to song');
    }
  }

  /**
   * Gets the song information of a given karaoke area in a given town, based on the song id
   *
   * @param townID ID of the town in which to get the karaoke area song information
   * @param karaokeAreaId interactable ID of the karaoke area
   * @param sessionToken session token of the player making the request, must
   *        match the session token returned when the player joined the town
   *
   * @throws InvalidParametersError if the session token is not valid, or if the
   *          karaoke area specified does not exist
   */
  @Get('{townID}/songInfo')
  @Response<InvalidParametersError>(400, 'Invalid values specified')
  public async getSongInfo(
    @Path() townID: string,
    @Query() songID: string,
    @Header('X-Session-Token') sessionToken: string,
  ): Promise<SongSchema> {
    const curTown = this._townsStore.getTownByID(townID);
    if (!curTown) {
      throw new InvalidParametersError('Invalid town ID');
    }
    if (!curTown.getPlayerBySessionToken(sessionToken)) {
      throw new InvalidParametersError('Invalid session ID');
    }
    const karaokeDao = new KaraokeDao();
    const success = await karaokeDao.getSongInfo(songID);
    if (!success) {
      throw new Error('Fail to get song info');
    } else {
      return success;
    }
  }

  // @Get('{townID}/{karaokeSessionId}/authorize')
  // @Response<InvalidParametersError>(400, 'Invalid values specified')
  @Get('/authorize')
  public async spotifyAuthorize(
    // @Path() townID: string,
    // @Path() karaokeSessionId: string,
    // @Header('X-Session-Token') sessionToken: string,
    @Query() codeChallenge: string,
    @Query() state: string,
    @Request() req: express.Request,
  ): Promise<void> {
    // const curTown = this._townsStore.getTownByID(townID);
    // if (!curTown) {
    //   throw new InvalidParametersError('Invalid town ID');
    // }
    // if (!curTown.getPlayerBySessionToken(sessionToken)) {
    //   throw new InvalidParametersError('Invalid session ID');
    // }

    // const karaokeSessionArea = curTown.getInteractable(karaokeSessionId);
    // if (!karaokeSessionArea || !isPosterSessionArea(karaokeSessionArea)) {
    //   throw new InvalidParametersError('Invalid karaoke session ID');
    // }

    const scope = 'user-read-private user-read-email streaming';
    const clientId = process.env.CLIENT_ID || null;
    const redirect = process.env.REDIRECT_URI || null;
    const res = (<any>req).res as express.Response;

    if (clientId && redirect) {
      // redirect to Spotify login page
      res.redirect(
        `https://accounts.spotify.com/authorize?${new URLSearchParams({
          client_id: clientId,
          response_type: 'code',
          // eslint-disable-next-line object-shorthand
          scope: scope,
          redirect_uri: redirect,
          // eslint-disable-next-line object-shorthand
          state: state,
          code_challenge_method: 'S256',
          code_challenge: codeChallenge,
        })}`,
      );
    }
  }

  // @Get('{townID}/{karaokeSessionId}/callback')
  // @Response<InvalidParametersError>(400, 'Invalid values specified')
  @Get('/callback')
  public async spotifyCallback(
    // @Path() townID: string,
    // @Path() karaokeSessionId: string,
    // @Header('X-Session-Token') sessionToken: string,
    @Query() codeVerifier: string,
    @Request() req: express.Request,
  ): Promise<void> {
    // const curTown = this._townsStore.getTownByID(townID);
    // if (!curTown) {
    //   throw new InvalidParametersError('Invalid town ID');
    // }
    // if (!curTown.getPlayerBySessionToken(sessionToken)) {
    //   throw new InvalidParametersError('Invalid session ID');
    // }

    // const karaokeSessionArea = curTown.getInteractable(karaokeSessionId);
    // if (!karaokeSessionArea || !isPosterSessionArea(karaokeSessionArea)) {
    //   throw new InvalidParametersError('Invalid karaoke session ID');
    // }

    const code = req.query.code || null;
    const clientId = process.env.CLIENT_ID || null;
    const clientSecret = process.env.CLIENT_SECRET || null;
    const redirect = process.env.REDIRECT_URI || null;
    const res = (<any>req).res as express.Response;

    if (code && clientId && clientSecret && redirect) {
      const getToken = await axios
        .post(
          'https://accounts.spotify.com/api/token',
          new URLSearchParams({
            // eslint-disable-next-line object-shorthand
            code: code as string,
            redirect_uri: redirect,
            grant_type: 'authorization_code',
            client_id: clientId,
            code_verifier: codeVerifier,
          }),
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
                'base64',
              )}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        )
        // DO SOMETHING WITH THE RESPONSE LATER
        .then(response => {
          if (response.status === 200) {
            res.send(response.data);
          } else {
            res.send(response);
          }
        })
        .catch(error => {
          res.send(error);
        });
    }
  }

  @Get('{townID}/{karaokeSessionId}/clientCredentials')
  @Response<InvalidParametersError>(400, 'Invalid values specified')
  public async spotifyClientCredentials(
    @Path() townID: string,
    @Path() karaokeSessionId: string,
    @Header('X-Session-Token') sessionToken: string,
    @Request() req: express.Request,
  ): Promise<void> {
    const curTown = this._townsStore.getTownByID(townID);
    if (!curTown) {
      throw new InvalidParametersError('Invalid town ID');
    }
    if (!curTown.getPlayerBySessionToken(sessionToken)) {
      throw new InvalidParametersError('Invalid session ID');
    }

    const karaokeSessionArea = curTown.getInteractable(karaokeSessionId);
    if (!karaokeSessionArea || !isPosterSessionArea(karaokeSessionArea)) {
      throw new InvalidParametersError('Invalid karaoke session ID');
    }

    const clientId = process.env.CLIENT_ID || null;
    const clientSecret = process.env.CLIENT_SECRET || null;
    const res = (<any>req).res as express.Response;

    if (clientId && clientSecret) {
      const getToken = await axios
        .post(
          'https://accounts.spotify.com/api/token',
          new URLSearchParams({
            grant_type: 'client_credentials',
          }),
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
                'base64',
              )}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        )
        // DO SOMETHING WITH THE RESPONSE LATER
        .then(response => {
          if (response.status === 200) {
            res.send(response.data);
          } else {
            res.send(response);
          }
        })
        .catch(error => {
          res.send(error);
        });
    }
  }

  /**
   * Creates a poster session area in a given town
   *
   * @param townID ID of the town in which to create the new poster session area
   * @param sessionToken session token of the player making the request, must
   *        match the session token returned when the player joined the town
   * @param requestBody The new poster session area to create
   *
   * @throws InvalidParametersError if the session token is not valid, or if the
   *          poster session area could not be created
   */
  @Post('{townID}/posterSessionArea')
  @Response<InvalidParametersError>(400, 'Invalid values specified')
  public async createPosterSessionArea(
    @Path() townID: string,
    @Header('X-Session-Token') sessionToken: string,
    @Body() requestBody: PosterSessionArea,
  ): Promise<void> {
    // download file here TODO
    const curTown = this._townsStore.getTownByID(townID);
    if (!curTown) {
      throw new InvalidParametersError('Invalid town ID');
    }
    if (!curTown.getPlayerBySessionToken(sessionToken)) {
      throw new InvalidParametersError('Invalid session ID');
    }
    // add poster area to the town, throw error if it fails
    if (!curTown.addPosterSessionArea(requestBody)) {
      throw new InvalidParametersError('Invalid poster session area');
    }
  }

  /**
   * Gets the image contents of a given poster session area in a given town
   *
   * @param townID ID of the town in which to get the poster session area image contents
   * @param posterSessionId interactable ID of the poster session
   * @param sessionToken session token of the player making the request, must
   *        match the session token returned when the player joined the town
   *
   * @throws InvalidParametersError if the session token is not valid, or if the
   *          poster session specified does not exist
   */
  @Patch('{townID}/{posterSessionId}/imageContents')
  @Response<InvalidParametersError>(400, 'Invalid values specified')
  public async getPosterAreaImageContents(
    @Path() townID: string,
    @Path() posterSessionId: string,
    @Header('X-Session-Token') sessionToken: string,
  ): Promise<string | undefined> {
    const curTown = this._townsStore.getTownByID(townID);
    if (!curTown) {
      throw new InvalidParametersError('Invalid town ID');
    }
    if (!curTown.getPlayerBySessionToken(sessionToken)) {
      throw new InvalidParametersError('Invalid session ID');
    }
    const posterSessionArea = curTown.getInteractable(posterSessionId);
    if (!posterSessionArea || !isPosterSessionArea(posterSessionArea)) {
      throw new InvalidParametersError('Invalid poster session ID');
    }
    return posterSessionArea.imageContents;
  }

  /**
   * Increment the stars of a given poster session area in a given town, as long as there is
   * a poster image. Returns the new number of stars.
   *
   * @param townID ID of the town in which to get the poster session area image contents
   * @param posterSessionId interactable ID of the poster session
   * @param sessionToken session token of the player making the request, must
   *        match the session token returned when the player joined the town
   *
   * @throws InvalidParametersError if the session token is not valid, or if the
   *          poster session specified does not exist, or if the poster session specified
   *          does not have an image
   */
  @Patch('{townID}/{posterSessionId}/incStars')
  @Response<InvalidParametersError>(400, 'Invalid values specified')
  public async incrementPosterAreaStars(
    @Path() townID: string,
    @Path() posterSessionId: string,
    @Header('X-Session-Token') sessionToken: string,
  ): Promise<number> {
    const curTown = this._townsStore.getTownByID(townID);
    if (!curTown) {
      throw new InvalidParametersError('Invalid town ID');
    }
    if (!curTown.getPlayerBySessionToken(sessionToken)) {
      throw new InvalidParametersError('Invalid session ID');
    }
    const posterSessionArea = curTown.getInteractable(posterSessionId);
    if (!posterSessionArea || !isPosterSessionArea(posterSessionArea)) {
      throw new InvalidParametersError('Invalid poster session ID');
    }
    if (!posterSessionArea.imageContents) {
      throw new InvalidParametersError('Cant star a poster with no image');
    }
    const newStars = posterSessionArea.stars + 1;
    const updatedPosterSessionArea = {
      id: posterSessionArea.id,
      imageContents: posterSessionArea.imageContents,
      title: posterSessionArea.title,
      stars: newStars, // increment stars
    };
    (<PosterSessionAreaReal>posterSessionArea).updateModel(updatedPosterSessionArea);
    return newStars;
  }

  /**
   * Connects a client's socket to the requested town, or disconnects the socket if no such town exists
   *
   * @param socket A new socket connection, with the userName and townID parameters of the socket's
   * auth object configured with the desired townID to join and username to use
   *
   */
  public async joinTown(socket: CoveyTownSocket) {
    // Parse the client's requested username from the connection
    const { userName, townID } = socket.handshake.auth as { userName: string; townID: string };

    const town = this._townsStore.getTownByID(townID);
    if (!town) {
      socket.disconnect(true);
      return;
    }

    // Connect the client to the socket.io broadcast room for this town
    socket.join(town.townID);

    const newPlayer = await town.addPlayer(userName, socket);
    assert(newPlayer.videoToken);
    socket.emit('initialize', {
      userID: newPlayer.id,
      sessionToken: newPlayer.sessionToken,
      providerVideoToken: newPlayer.videoToken,
      currentPlayers: town.players.map(eachPlayer => eachPlayer.toPlayerModel()),
      friendlyName: town.friendlyName,
      isPubliclyListed: town.isPubliclyListed,
      interactables: town.interactables.map(eachInteractable => eachInteractable.toModel()),
    });
  }
}
