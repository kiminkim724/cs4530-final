import { mock, mockClear, MockProxy } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { KaraokeArea } from '../generated/client';
import TownController from './TownController';
import KaraokeAreaController, { KaraokeAreaEvents } from './KaraokeAreaController';

describe('KaraokeSessionAreaController', () => {
  let testArea: KaraokeAreaController;
  let testAreaModel: KaraokeArea;
  const townController: MockProxy<TownController> = mock<TownController>();
  const mockListeners = mock<KaraokeAreaEvents>();
  beforeEach(() => {
    testAreaModel = {
      id: nanoid(),
      title: nanoid(),
      currentSong: '',
      songQueue: [],
      isSongPlaying: false,
      elapsedTimeSec: 0,
    };
    testArea = new KaraokeAreaController(testAreaModel);
    mockClear(townController);
    mockClear(mockListeners.karaokeTitleChange);
    mockClear(mockListeners.playbackChange);
    mockClear(mockListeners.progressChange);
    mockClear(mockListeners.songChange);
    mockClear(mockListeners.songQueueChange);
    testArea.addListener('songChange', mockListeners.songChange);
    testArea.addListener('karaokeTitleChange', mockListeners.karaokeTitleChange);
    testArea.addListener('progressChange', mockListeners.progressChange);
    testArea.addListener('playbackChange', mockListeners.playbackChange);
    testArea.addListener('songQueueChange', mockListeners.songQueueChange);
  });
  describe('Setting current property', () => {
    it('updates the property and emits a songChange event if the property changes', () => {
      const newSong = nanoid();
      testArea.currentSong = newSong;
      expect(mockListeners.songChange).toBeCalledWith(newSong);
      expect(testArea.currentSong).toEqual(newSong);
    });
    it('does not emit a songChange event if the star property does not change', () => {
      testArea.currentSong = testAreaModel.currentSong;
      expect(mockListeners.songChange).not.toBeCalled();
    });
  });
  describe('Setting title property', () => {
    it('updates the property and emits a karaokeTitleChange event if the property changes', () => {
      const newTitle = nanoid();
      testArea.title = newTitle;
      expect(mockListeners.karaokeTitleChange).toBeCalledWith(newTitle);
      expect(testArea.title).toEqual(newTitle);
    });
    it('does not emit a karaokeTitleChange event if the title property does not change', () => {
      testArea.title = `${testAreaModel.title}`;
      expect(mockListeners.karaokeTitleChange).not.toBeCalled();
    });
  });
  describe('Setting elapsedTimeSec property', () => {
    it('updates the property and emits playbackChange event if the property changes', () => {
      const newProgress = 3;
      testArea.elapsedTimeSec = newProgress;
      expect(mockListeners.progressChange).toBeCalledWith(newProgress);
      expect(testArea.elapsedTimeSec).toEqual(newProgress);
    });
    it('does not emit a playbackChange event if the title property does not change', () => {
      testArea.elapsedTimeSec = testAreaModel.elapsedTimeSec;
      expect(mockListeners.progressChange).not.toBeCalled();
    });
  });
  describe('Setting isPlaying property', () => {
    it('updates the property and emits playbackChange event if the property changes', () => {
      const newIsPlaying = true;
      testArea.isPlaying = newIsPlaying;
      expect(mockListeners.playbackChange).toBeCalledWith(newIsPlaying);
      expect(testArea.isPlaying).toEqual(newIsPlaying);
    });
    it('does not emit a playbackChange event if the title property does not change', () => {
      testArea.isPlaying = testAreaModel.isSongPlaying;
      expect(mockListeners.playbackChange).not.toBeCalled();
    });
  });
  describe('Setting songQueueChange property', () => {
    it('updates the property and emits playbackChange event if the property changes', () => {
      const newSongQueue = [nanoid()];
      testArea.songQueue = newSongQueue;
      expect(mockListeners.songQueueChange).toBeCalledWith(newSongQueue);
      expect(testArea.songQueue).toEqual(newSongQueue);
    });
    it('does not emit a playbackChange event if the title property does not change', () => {
      testArea.songQueue = testAreaModel.songQueue;
      expect(mockListeners.songQueueChange).not.toBeCalled();
    });
  });
  describe('karaokeAreaModel', () => {
    it('Carries through all of the properties', () => {
      const model = testArea.KaraokeAreaModel();
      expect(model).toEqual(testAreaModel);
    });
  });
  describe('updateFrom', () => {
    it('Updates the title, currentSong, isPlaying, and songQueue properties', () => {
      const newModel: KaraokeArea = {
        id: testAreaModel.id,
        title: 'New Title',
        currentSong: 'New Test Song',
        songQueue: ['Test Song 2'],
        isSongPlaying: true,
        elapsedTimeSec: 0,
      };
      testArea.updateFrom(newModel);
      expect(testArea.title).toEqual(newModel.title);
      expect(testArea.currentSong).toEqual(newModel.currentSong);
      expect(testArea.songQueue).toEqual(newModel.songQueue);
      expect(mockListeners.songChange).toBeCalledWith(newModel.currentSong);
      expect(mockListeners.playbackChange).toBeCalledWith(newModel.isSongPlaying);
      expect(mockListeners.karaokeTitleChange).toBeCalledWith(newModel.title);
    });
    it('Does not update the id property', () => {
      const existingID = testArea.id;
      const newModel: KaraokeArea = {
        id: nanoid(),
        title: nanoid(),
        currentSong: '',
        songQueue: [],
        isSongPlaying: false,
        elapsedTimeSec: 0,
      };
      testArea.updateFrom(newModel);
      expect(testArea.id).toEqual(existingID);
    });
  });
});
