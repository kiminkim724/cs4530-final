import mongoose from 'mongoose';
import SongSchema, { schema } from './SongSchema';

const DATABASE_NAME = 'coveytown';
const URL = `mongodb+srv://dbUser:ycKZuSVSismRDcFI@coveytown.uelevvd.mongodb.net/${DATABASE_NAME}?retryWrites=true&w=majority`;

export default class KaraokeDao {
  private _songModel = mongoose.model<SongSchema>('SongModel', schema);

  /**
   * Constructs a new KaraokeDao.
   */
  public constructor() {
    this._init();
  }

  /**
   * Initializes the database client with the connection URL.
   */
  private async _init(): Promise<void> {
    try {
      mongoose.connect(URL);
    } catch (err) {
      throw new Error('Could not connect to database.');
    }
  }

  public async addRatingToSong(songID: string, rating: 1 | 2 | 3 | 4 | 5) {
    const data = await this._songModel.findOne({ id: songID });
    if (!data) {
      const newSong = {
        id: songID,
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
      };
      newSong.ratings[rating] = 1;
      this._songModel.create(newSong);
    } else {
      const newValue: number = data.ratings[rating] + 1;
      await this._songModel.findOneAndUpdate(
        { id: songID },
        { $set: { [`ratings.${rating}`]: newValue } },
      );
    }
  }

  public async getSongInfo(songID: string): Promise<SongSchema> {
    const data = await this._songModel.findOne({ id: songID });
    if (!data) {
      throw new Error('Song does not exist in database.');
    }
    const ret: SongSchema = {
      id: data.toJSON().id,
      ratings: data.toJSON().ratings,
      reactions: data.toJSON().reactions,
    };

    return ret;
  }
}
