import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import Player from '../lib/Player';
import { getLastEmittedEvent } from '../TestUtils';
import { TownEmitter } from '../types/CoveyTownSocket';
import KaraokeArea from './KaraokeArea';

describe('KaraokeArea', () => {
  const testAreaBox = { x: 100, y: 100, width: 100, height: 100 };
  let testArea: KaraokeArea;
  const townEmitter = mock<TownEmitter>();
  let newPlayer: Player;
  const id = nanoid();
  const isPlaying = false;
  const progress = 0;
  const currentSong = 'Test Song';
  const title = 'Test Song Title';
  const songQueue = ['Test Song 2'];

  beforeEach(() => {
    mockClear(townEmitter);
    testArea = new KaraokeArea(
      {
        id,
        isSongPlaying: isPlaying,
        elapsedTimeSec: progress,
        currentSong,
        title,
        songQueue,
      },
      testAreaBox,
      townEmitter,
    );
    newPlayer = new Player(nanoid(), mock<TownEmitter>());
    testArea.add(newPlayer);
  });

  describe('[OMG2 remove]', () => {
    it('Removes the player from the list of occupants and emits an interactableUpdate event', () => {
      // Add another player so that we are not also testing what happens when the last player leaves
      const extraPlayer = new Player(nanoid(), mock<TownEmitter>());
      testArea.add(extraPlayer);
      testArea.remove(newPlayer);

      expect(testArea.occupantsByID).toEqual([extraPlayer.id]);
      const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
      expect(lastEmittedUpdate).toEqual({
        id,
        elapsedTimeSec: progress,
        isSongPlaying: isPlaying,
        currentSong,
        title,
        songQueue,
      });
    });
    it("Clears the player's interactableID and emits an update for their location", () => {
      testArea.remove(newPlayer);
      expect(newPlayer.location.interactableID).toBeUndefined();
      const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
      expect(lastEmittedMovement.location.interactableID).toBeUndefined();
    });
    it('Clears the karaoke area current song, title and queue when the last occupant leaves', () => {
      testArea.remove(newPlayer);
      const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
      expect(lastEmittedUpdate).toEqual({
        id,
        elapsedTimeSec: 0,
        isSongPlaying: false,
        currentSong: undefined,
        title: undefined,
        songQueue: [],
      });
      expect(testArea.title).toBeUndefined();
      expect(testArea.isSongPlaying).toEqual(false);
      expect(testArea.songQueue).toEqual([]);
    });
  });
  describe('add', () => {
    it('Adds the player to the occupants list', () => {
      expect(testArea.occupantsByID).toEqual([newPlayer.id]);
    });
    it("Sets the player's interactableID and emits an update for their location", () => {
      expect(newPlayer.location.interactableID).toEqual(id);

      const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
      expect(lastEmittedMovement.location.interactableID).toEqual(id);
    });
  });
  test('toModel sets the ID, isPlaying, elapsed time/progress, current song, title, and songQueue', () => {
    const model = testArea.toModel();
    expect(model).toEqual({
      id,
      isSongPlaying: isPlaying,
      elapsedTimeSec: progress,
      currentSong,
      title,
      songQueue,
    });
  });
  test('updateModel sets isPlaying, elapsed time/progress, current song, title, and songQueue', () => {
    const newId = 'spam';
    const newIsPlaying = true;
    const newElapsedTimeSec = 20;
    const newCurrentSong = 'New Current Song';
    const newTitle = 'New Test Song Title';
    const newSongQueue = ['New Song 2', 'New Song 3'];
    testArea.updateModel({
      id: newId,
      isSongPlaying: newIsPlaying,
      elapsedTimeSec: newElapsedTimeSec,
      currentSong: newCurrentSong,
      title: newTitle,
      songQueue: newSongQueue,
    });
    expect(testArea.id).toBe(id);
    expect(testArea.title).toBe(newTitle);
    expect(testArea.isSongPlaying).toBe(newIsPlaying);
    expect(testArea.elapsedTimeSec).toBe(newElapsedTimeSec);
    expect(testArea.songQueue).toBe(newSongQueue);
  });
  describe('fromMapObject', () => {
    it('Throws an error if the width or height are missing', () => {
      expect(() =>
        KaraokeArea.fromMapObject(
          { id: 1, name: nanoid(), visible: true, x: 0, y: 0 },
          townEmitter,
        ),
      ).toThrowError();
    });
    it('Creates a new karaoke area using the provided boundingBox and id, with no song, and emitter', () => {
      const x = 30;
      const y = 20;
      const width = 10;
      const height = 20;
      const name = 'name';
      const val = KaraokeArea.fromMapObject(
        { x, y, width, height, name, id: 10, visible: true },
        townEmitter,
      );
      expect(val.boundingBox).toEqual({ x, y, width, height });
      expect(val.id).toEqual(name);
      expect(val.title).toBeUndefined();
      expect(val.songQueue).toEqual([]);
      expect(val.isSongPlaying).toEqual(false);
      expect(val.elapsedTimeSec).toEqual(0);
      expect(val.occupantsByID).toEqual([]);
    });
  });
});
