import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { TownEmitter } from '../types/CoveyTownSocket';
import KaraokeDao from './KaraokeDao';

describe('KaraokeDao', () => {
  let testDao: KaraokeDao;
  const karaokeDao = mock<KaraokeDao>();
  //   const topic = nanoid();
  //   const id = nanoid();
  //   let newPlayer: Player;

  beforeEach(() => {
    mockClear(karaokeDao);
    testDao = new KaraokeDao();
  });
  describe('add', () => {
    it('Adds non existing song into the database', async () => {
      const testSongId = nanoid();
      expect(await testDao.getSongInfo(testSongId)).toEqual({
        id: testSongId,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        reactions: {
          likes: 0,
          dislikes: 0,
        },
      });
      await testDao.addReactionToSong(testSongId, 'likes');
      expect(testDao.getSongInfo(testSongId)).toEqual({
        id: testSongId,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        reactions: {
          likes: 1,
          dislikes: 0,
        },
      });
    });
  });
});
