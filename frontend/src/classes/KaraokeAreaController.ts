import { EventEmitter } from 'events';
import TypedEventEmitter from 'typed-emitter';
import { KaraokeArea as KaraokeAreaModel } from '../types/CoveyTownSocket';

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
   * due to the user scrubbing through the video, or from the natural progression of time.
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
   * A songQueueChange event indicates that the song queue for this karaoke area has changed.
   * Listeners are passed the new queue, which is either an empty array or a new array of strings
   * to indicate the new list of songs in the queue.
   */
  songQueueChange: (songQueue: string[]) => void;
  
};

/**
 * A KaraokeAreaController manages the state for a KaraokeArea in the frontend app, serving as a bridge between the video
 * that is playing in the user's browser and the backend TownService, ensuring that all players watching the same video
 * are synchronized in their playback.
 *
 * The KaraokeAreaController implements callbacks that handle events from the video player in this browser window, and
 * emits updates when the state is updated, @see KaraokeAreaEvents
 */
export default class KaraokeAreaController extends (EventEmitter as new () => TypedEventEmitter<KaraokeAreaEvents>) {
  private _model: KaraokeAreaModel;

  /**
   * Constructs a new KaraokeAreaController, initialized with the state of the
   * provided KaraokeAreaModel.
   *
   * @param karaokeAreaModel The viewing area model that this controller should represent
   */
  constructor(KaraokeAreaModel: KaraokeAreaModel) {
    super();
    this._model = KaraokeAreaModel;
  }

  /**
   * The ID of the viewing area represented by this viewing area controller
   * This property is read-only: once a KaraokeAreaController is created, it will always be
   * tied to the same viewing area ID.
   */
  public get id() {
    return this._model.id;
  }

  /**
   * The URL of the video assigned to this viewing area, or undefined if there is not one.
   */
  public get currentSong() {
    return this._model.currentSong;
  }

  /**
   * The URL of the video assigned to this viewing area, or undefined if there is not one.
   *
   * Changing this value will emit a 'videoChange' event to listeners
   */
  public set currentSong(song: string | undefined) {
    if (this._model.currentSong !== this.currentSong) {
      this._model.currentSong = song;
      this.emit('songChange', song);
    }
  }

  /**
   * The playback position of the video, in seconds (a floating point number)
   */
  public get elapsedTimeSec() {
    return this._model.elapsedTimeSec;
  }

  /**
   * The playback position of the video, in seconds (a floating point number)
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
   * The playback state - true indicating that the video is playing, false indicating
   * that the video is paused.
   */
  public get isPlaying() {
    return this._model.isPlaying;
  }

  /**
   * The playback state - true indicating that the video is playing, false indicating
   * that the video is paused.
   *
   * Changing this value will emit a 'playbackChange' event to listeners
   */
  public set isPlaying(isPlaying: boolean) {
    if (this._model.isPlaying != isPlaying) {
      this._model.isPlaying = isPlaying;
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
    if (this._model.songQueue != queue){
      this._model.songQueue = queue;
      this.emit('songQueueChange', queue)
    }
  }

  /**
   * @returns KaraokeAreaModel that represents the current state of this KaraokeAreaController
   */
  public KaraokeAreaModel(): KaraokeAreaModel {
    return this._model;
  }

  /**
   * Applies updates to this viewing area controller's model, setting the fields
   * isPlaying, elapsedTimeSec and video from the updatedModel
   *
   * @param updatedModel
   */
  public updateFrom(updatedModel: KaraokeAreaModel): void {
    this.isPlaying = updatedModel.isPlaying;
    this.elapsedTimeSec = updatedModel.elapsedTimeSec;
    this.currentSong = updatedModel.currentSong;
    this.songQueue = updatedModel.songQueue;
  }
}
