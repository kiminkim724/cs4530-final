import mongoose from 'mongoose';
import KaraokeDao from './KaraokeDao';

describe('KaraokeDao', () => {
  let testDao: KaraokeDao;

  beforeEach(() => {
    jest.spyOn(mongoose, 'connect').mockImplementation();
    testDao = new KaraokeDao();
    jest.clearAllMocks();
  });

  describe('getSongInfo', () => {
    it('Should return song info that the database returns', async () => {
      const findOneSpy = jest.spyOn(mongoose.Model, 'findOne').mockReturnValue({
        toJSON: () => ({
          id: '123',
          ratings: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 },
          reactions: { likes: 7, dislikes: 8 },
        }),
      } as any);
      const songInfo = await testDao.getSongInfo('123');
      expect(findOneSpy).toHaveBeenCalledWith({ id: '123' });
      expect(songInfo).toEqual({
        id: '123',
        ratings: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 },
        reactions: { likes: 7, dislikes: 8 },
      });
    });

    it('Should return default song info if song doesnt exist in db', async () => {
      const findOneSpy = jest.spyOn(mongoose.Model, 'findOne').mockReturnValue(undefined as any);
      const songInfo = await testDao.getSongInfo('456');
      expect(findOneSpy).toHaveBeenCalledWith({ id: '456' });
      expect(songInfo).toEqual({
        id: '456',
        ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        reactions: { likes: 0, dislikes: 0 },
      });
    });
  });

  describe('addReactionToSong', () => {
    it('Should update with correct reaction if the song exists in the database', async () => {
      const findOneSpy = jest.spyOn(mongoose.Model, 'findOne').mockReturnValue({
        id: '123',
        ratings: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 },
        reactions: { likes: 4, dislikes: 8 },
      } as any);
      const findOneAndUpdateSpy = jest
        .spyOn(mongoose.Model, 'findOneAndUpdate')
        .mockImplementation();
      await testDao.addReactionToSong('123', 'likes');
      expect(findOneSpy).toHaveBeenCalledWith({ id: '123' });
      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        { id: '123' },
        { $set: { 'reactions.likes': 5 } },
      );
    });

    it('Should add new song to the database with a reaction if it does not yet exist', async () => {
      const findOneSpy = jest.spyOn(mongoose.Model, 'findOne').mockReturnValue(undefined as any);
      const createSpy = jest.spyOn(mongoose.Model, 'create').mockImplementation();
      await testDao.addReactionToSong('456', 'dislikes');
      expect(findOneSpy).toHaveBeenCalledWith({ id: '456' });
      expect(createSpy).toHaveBeenCalledWith({
        id: '456',
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        reactions: {
          likes: 0,
          dislikes: 1,
        },
      });
    });
  });

  describe('addRatingToSong', () => {
    it('Should update with correct rating if the song exists in the database', async () => {
      const findOneSpy = jest.spyOn(mongoose.Model, 'findOne').mockReturnValue({
        id: '123',
        ratings: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 },
        reactions: { likes: 4, dislikes: 8 },
      } as any);
      const findOneAndUpdateSpy = jest
        .spyOn(mongoose.Model, 'findOneAndUpdate')
        .mockImplementation();
      await testDao.addRatingToSong('123', 2);
      expect(findOneSpy).toHaveBeenCalledWith({ id: '123' });
      expect(findOneAndUpdateSpy).toHaveBeenCalledWith({ id: '123' }, { $set: { 'ratings.2': 4 } });
    });

    it('Should add new song to the database with a reaction if it does not yet exist', async () => {
      const findOneSpy = jest.spyOn(mongoose.Model, 'findOne').mockReturnValue(undefined as any);
      const createSpy = jest.spyOn(mongoose.Model, 'create').mockImplementation();
      await testDao.addRatingToSong('456', 4);
      expect(findOneSpy).toHaveBeenCalledWith({ id: '456' });
      expect(createSpy).toHaveBeenCalledWith({
        id: '456',
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 1,
          5: 0,
        },
        reactions: {
          likes: 0,
          dislikes: 0,
        },
      });
    });
  });

  describe('getTopSongs', () => {
    it('Should return the single song with the highest ratings', async () => {
      const findOneSpy = jest
        .spyOn(mongoose.Model, 'findOne')
        .mockReturnValueOnce({
          id: '123',
          ratings: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
          reactions: { likes: 4, dislikes: 8 },
        } as any)
        .mockReturnValueOnce({
          id: '456',
          ratings: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2 },
          reactions: { likes: 4, dislikes: 8 },
        } as any);
      const findSpy = jest.spyOn(mongoose.Model, 'find').mockReturnValue([
        {
          id: '123',
          ratings: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
          reactions: { likes: 4, dislikes: 8 },
        },
        {
          id: '456',
          ratings: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2 },
          reactions: { likes: 4, dislikes: 8 },
        },
      ] as any);
      const topSongs = await testDao.getTopSongs(1);
      expect(findOneSpy).toHaveBeenCalledWith({ id: '123' });
      expect(findOneSpy).toHaveBeenCalledWith({ id: '456' });
      expect(topSongs).toEqual([
        {
          id: '456',
          ratings: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2 },
          reactions: { likes: 4, dislikes: 8 },
        },
      ]);
    });

    it('Should return the specified number of songs with the highest ratings', async () => {
      const findOneSpy = jest
        .spyOn(mongoose.Model, 'findOne')
        .mockReturnValueOnce({
          id: '123',
          ratings: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2 },
          reactions: { likes: 4, dislikes: 8 },
        } as any)
        .mockReturnValueOnce({
          id: '456',
          ratings: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
          reactions: { likes: 4, dislikes: 8 },
        } as any)
        .mockReturnValueOnce({
          id: '567',
          ratings: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 3 },
          reactions: { likes: 4, dislikes: 8 },
        } as any);
      const findSpy = jest.spyOn(mongoose.Model, 'find').mockReturnValue([
        {
          id: '123',
          ratings: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2 },
          reactions: { likes: 4, dislikes: 8 },
        },
        {
          id: '456',
          ratings: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
          reactions: { likes: 4, dislikes: 8 },
        },
        {
          id: '567',
          ratings: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 3 },
          reactions: { likes: 4, dislikes: 8 },
        },
      ] as any);
      const topSongs = await testDao.getTopSongs(2);
      expect(findOneSpy).toHaveBeenCalledWith({ id: '123' });
      expect(findOneSpy).toHaveBeenCalledWith({ id: '456' });
      expect(findOneSpy).toHaveBeenCalledWith({ id: '567' });
      expect(topSongs).toEqual([
        {
          id: '567',
          ratings: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 3 },
          reactions: { likes: 4, dislikes: 8 },
        },
        {
          id: '123',
          ratings: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2 },
          reactions: { likes: 4, dislikes: 8 },
        },
      ]);
    });
  });
});
