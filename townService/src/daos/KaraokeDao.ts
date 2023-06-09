import mongoose from 'mongoose';
import SongSchema, { schema } from './SongSchema';

const DATABASE_NAME = 'coveytown';
const URL = `mongodb+srv://${process.env.DB_CREDENTIALS}@coveytown.uelevvd.mongodb.net/${DATABASE_NAME}?retryWrites=true&w=majority`;

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

  /**
   * Adds the specified rating to the given songID in the database
   * @param songID the song to update
   * @param rating the rating to add to
   */
  public async addRatingToSong(songID: string, rating: 1 | 2 | 3 | 4 | 5) {
    const data = await this._songModel.findOne({ id: songID });
    if (!data) {
      const newSong = this._freshSong(songID);
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

  /**
   * Creates a blank song with 0s for all data
   * @param songID id of song
   * @returns the new song
   */
  private _freshSong(songID: string): SongSchema {
    return {
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
  }

  /**
   * Retrieves and sums the ratings for a song in the database
   * @param songID the id of the song
   * @returns the sum of the song's ratings
   */
  private async _getRatings(songID: number): Promise<number> {
    const data = await this._songModel.findOne({ id: songID });
    let result = 0;
    if (data) {
      Object.values(data.ratings).forEach(rating => {
        result += rating;
      });
    }
    return result;
  }

  /**
   * Gets a list of top rated songs from the database
   * @param n the number of songs to get
   * @returns the list of songs
   */
  public async getTopSongs(n: number): Promise<SongSchema[]> {
    const songs = await this._songModel.find();
    const ratings = await Promise.all(songs.map(song => this._getRatings(song.id)));
    const songsByRating = songs.sort(
      (a, b) => ratings[songs.indexOf(b)] - ratings[songs.indexOf(a)],
    );
    return songsByRating.slice(0, n);
  }

  /**
   * Adds a specified reaction to the specified song in the database, adding 1 to the existing number
   * @param songID the song to react to
   * @param reaction the reaction
   */
  public async addReactionToSong(songID: string, reaction: 'likes' | 'dislikes') {
    const data = await this._songModel.findOne({ id: songID });
    if (!data) {
      const newSong = this._freshSong(songID);
      newSong.reactions[reaction] = 1;
      this._songModel.create(newSong);
    } else {
      const newValue: number = data.reactions[reaction] + 1;
      await this._songModel.findOneAndUpdate(
        { id: songID },
        { $set: { [`reactions.${reaction}`]: newValue } },
      );
    }
  }

  /**
   * Retrieves rating and reaction information about a song from the database. If the song does not yet
   * have a document in the database, a document with zeroes for all values is returned.
   * @param songID the id of the song
   * @returns the rating and reaction information
   */
  public async getSongInfo(songID: string): Promise<SongSchema> {
    const data = await this._songModel.findOne({ id: songID });
    if (!data) {
      return {
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
    }
    const ret: SongSchema = {
      id: data.toJSON().id,
      ratings: data.toJSON().ratings,
      reactions: data.toJSON().reactions,
    };

    return ret;
  }
}
