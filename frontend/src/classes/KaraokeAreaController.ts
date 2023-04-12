import { EventEmitter } from 'events';
import TypedEventEmitter from 'typed-emitter';
import { KaraokeArea as KaraokeAreaModel } from '../types/CoveyTownSocket';
import { useEffect, useState } from 'react';

/**
 * The events that a KaraokeAreaController can emit
 */
export type KaraokeAreaEvents = {
  /**
   * A playbackChange event indicates that the playing/paused state has changed.
   * Listeners are passed the new state in the parameter `isPlaying`
   */
  playbackChange: (isPlaying: boolean) => void;
  /**
   * A progressChange event indicates that the progress of the song has changed, either
   * due to the user scrubbing through the song, or from the natural progression of time.
   * Listeners are passed the new playback time elapsed in seconds.
   */
  progressChange: (elapsedTimeSec: number) => void;
  /**
   * A songChange event indicates that the song selected for this karaoke area has changed.
   * Listeners are passed the new song, which is either a string (the Spotify URI), or
   * the value `undefined` to indicate that there is no song set.
   */
  songChange: (currentSong: string | undefined) => void;

  /**
   * A karaokeTitleChange event indicates that the title selected for this karaoke area has changed.
   * Listeners are passed the new title, which is a string, or the value `undefined` to indicate
   * that there is no song set.
   */
  karaokeTitleChange: (title: string | undefined) => void;

  /**
   * A songQueueChange event indicates that the song queue for this karaoke area has changed.
   * Listeners are passed the new queue, which is either an empty array or a new array of strings
   * to indicate the new list of songs in the queue.
   */
  songQueueChange: (songQueue: string[]) => void;
};

/**
 * A KaraokeAreaController manages the state for a KaraokeArea in the frontend app, serving as a bridge between the song
 * that is playing in the user's browser and the backend TownService, ensuring that all players listening to the same song
 * are synchronized in their playback.
 *
 * The KaraokeAreaController implements callbacks that handle events from the song player in this browser window, and
 * emits updates when the state is updated, @see KaraokeAreaEvents
 */
export default class KaraokeAreaController extends (EventEmitter as new () => TypedEventEmitter<KaraokeAreaEvents>) {
  private _model: KaraokeAreaModel;

  /**
   * Constructs a new KaraokeAreaController, initialized with the state of the
   * provided KaraokeAreaModel.
   *
   * @param karaokeAreaModel The karaoke area model that this controller should represent
   */
  // eslint-disable-next-line @typescript-eslint/no-shadow
  constructor(KaraokeAreaModel: KaraokeAreaModel) {
    super();
    this._model = KaraokeAreaModel;
  }

  /**
   * The ID of the karaoke area represented by this karaoke area controller
   * This property is read-only: once a KaraokeAreaController is created, it will always be
   * tied to the same karaoke area ID.
   */
  public get id() {
    return this._model.id;
  }

  /**
   * The URL of the song assigned to this karaoke area, or undefined if there is not one.
   */
  public get currentSong() {
    return this._model.currentSong;
  }

  /**
   * The URL of the song assigned to this karaoke area, or undefined if there is not one.
   *
   * Changing this value will emit a 'songChange' event to listeners
   */
  public set currentSong(song: string | undefined) {
    if (this._model.currentSong !== song) {
      this._model.currentSong = song;
      this.emit('songChange', song);
    }
  }

  /**
   * The title assigned to this karaoke area, or undefined if there is not one.
   */
  public get title() {
    return this._model.title;
  }

  /**
   * The title assigned to this karaoke area, or undefined if there is not one.
   *
   * Changing this value will emit a 'karaokeTitleChange' event to listeners
   */
  public set title(title: string | undefined) {
    if (this._model.title !== title) {
      this._model.title = title;
      this.emit('karaokeTitleChange', title);
    }
  }

  /**
   * The playback position of the song, in seconds (a floating point number)
   */
  public get elapsedTimeSec() {
    return this._model.elapsedTimeSec;
  }

  /**
   * The playback position of the song, in seconds (a floating point number)
   *
   * Changing this value will emit a 'progressChange' event to listeners
   */
  public set elapsedTimeSec(elapsedTimeSec: number) {
    if (this._model.elapsedTimeSec != elapsedTimeSec) {
      this._model.elapsedTimeSec = elapsedTimeSec;
      this.emit('progressChange', elapsedTimeSec);
    }
  }

  /**
   * The playback state - true indicating that the song is playing, false indicating
   * that the song is paused.
   */
  public get isPlaying() {
    return this._model.isSongPlaying;
  }

  /**
   * The playback state - true indicating that the song is playing, false indicating
   * that the song is paused.
   *
   * Changing this value will emit a 'playbackChange' event to listeners
   */
  public set isPlaying(isPlaying: boolean) {
    if (this._model.isSongPlaying != isPlaying) {
      this._model.isSongPlaying = isPlaying;
      this.emit('playbackChange', isPlaying);
    }
  }

  /**
   * The current queue of songs, a list of strings of the song's Spotify URI
   */
  public get songQueue() {
    return this._model.songQueue;
  }

  /**
   * The current queue of songs, a list of strings of the song's Spotify URI,
   *
   * Changing this value will emit a songQueueChange event
   */
  public set songQueue(queue: string[]) {
    if (this._model.songQueue != queue) {
      this._model.songQueue = queue;
      this.emit('songQueueChange', queue);
    }
  }

  /**
   * @returns KaraokeAreaModel that represents the current state of this KaraokeAreaController
   */
  public KaraokeAreaModel(): KaraokeAreaModel {
    return this._model;
  }

  /**
   * Applies updates to this karaoke area controller's model, setting the fields
   * isPlaying, elapsedTimeSec, currentSong and songQueue from the updatedModel
   *
   * @param updatedModel
   */
  public updateFrom(updatedModel: KaraokeAreaModel): void {
    this.isPlaying = updatedModel.isSongPlaying;
    this.title = updatedModel.title;
    this.elapsedTimeSec = updatedModel.elapsedTimeSec;
    this.currentSong = updatedModel.currentSong;
    this.songQueue = updatedModel.songQueue;
  }
}
/**
 * A hook that returns the title for the karaoke area with the given controller
 */
export function useTitle(controller: KaraokeAreaController): string | undefined {
  const [title, setTitle] = useState(controller.title);
  useEffect(() => {
    controller.addListener('karaokeTitleChange', setTitle);
    return () => {
      controller.removeListener('karaokeTitleChange', setTitle);
    };
  }, [controller]);
  return title;
}
