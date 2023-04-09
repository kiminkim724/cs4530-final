///  <reference types="@types/spotify-web-playback-sdk"/>
import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import Player from '../lib/Player';
import {
  BoundingBox,
  TownEmitter,
  KaraokeArea as KaraokeAreaModel,
} from '../types/CoveyTownSocket';
import InteractableArea from './InteractableArea';

export default class KaraokeArea extends InteractableArea {
  private _currentSong?: string;

  private _title?: string;

  private _songQueue: string[];

  private _isSongPlaying: boolean;

  private _elapsedTimeSec: number;

  public get currentSong() {
    return this._currentSong;
  }

  public get title() {
    return this._title;
  }

  public get songQueue() {
    return this._songQueue;
  }

  public get elapsedTimeSec() {
    return this._elapsedTimeSec;
  }

  public get isSongPlaying() {
    return this._isSongPlaying;
  }

  /**
   * Creates a new KaraokeArea
   *
   * @param karaokeArea model containing this area's starting state
   * @param coordinates the bounding box that defines this karaoke area
   * @param townEmitter a broadcast emitter that can be used to emit updates to players
   */
  public constructor(
    {
      id,
      isSongPlaying: isPlaying,
      elapsedTimeSec: progress,
      currentSong,
      title,
    }: KaraokeAreaModel,
    coordinates: BoundingBox,
    townEmitter: TownEmitter,
  ) {
    super(id, coordinates, townEmitter);
    this._currentSong = currentSong;
    this._title = title;
    this._songQueue = [];
    this._elapsedTimeSec = progress;
    this._isSongPlaying = isPlaying;
  }

  /**
   * Removes a player from this Karaoke area.
   *
   * When the last player leaves, this method clears the karaoke area of this area and
   * emits that update to all of the players
   *
   * @param player
   */
  public remove(player: Player): void {
    super.remove(player);
    if (this._occupants.length === 0) {
      this._currentSong = undefined;
      this._title = undefined;
      this._songQueue = [];
      this._emitAreaChanged();
    }
  }

  /**
   * Updates the state of this KaraokeArea, setting the video, isPlaying and progress properties
   *
   * @param karaokeArea updated model
   */
  public updateModel({
    isSongPlaying: isPlaying,
    elapsedTimeSec: progress,
    currentSong,
    title,
    songQueue,
  }: KaraokeAreaModel) {
    this._currentSong = currentSong;
    this._title = title;
    this._songQueue = songQueue;
    this._isSongPlaying = isPlaying;
    this._elapsedTimeSec = progress;
  }

  /**
   * Convert this KaraokeArea instance to a simple KaraokeAreaModel suitable for
   * transporting over a socket to a client.
   */
  public toModel(): KaraokeAreaModel {
    return {
      id: this.id,
      currentSong: this._currentSong,
      songQueue: this._songQueue,
      isSongPlaying: this._isSongPlaying,
      elapsedTimeSec: this._elapsedTimeSec,
    };
  }

  /**
   * Creates a new KaraokeArea object that will represent a Karaoke Area object in the town map.
   * @param mapObject An ITiledMapObject that represents a rectangle in which this Karaoke area exists
   * @param townEmitter An emitter that can be used by this karaoke area to broadcast updates to players in the town
   * @returns
   */
  public static fromMapObject(mapObject: ITiledMapObject, townEmitter: TownEmitter): KaraokeArea {
    const { name, width, height } = mapObject;
    if (!width || !height) {
      throw new Error(`Malformed karaoke area ${name}`);
    }
    const rect: BoundingBox = { x: mapObject.x, y: mapObject.y, width, height };
    return new KaraokeArea(
      { isSongPlaying: false, id: name, elapsedTimeSec: 0, songQueue: [] },
      rect,
      townEmitter,
    );
  }
}
