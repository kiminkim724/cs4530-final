import mongoose from 'mongoose';

interface SongSchema {
  id: string;
  ratings: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  reactions: {
    likes: number;
    dislikes: number;
  };
}

export default SongSchema;

export const schema = new mongoose.Schema<SongSchema>(
  {
    id: { type: String, required: true },
    ratings: {
      1: { type: Number, required: true },
      2: { type: Number, required: true },
      3: { type: Number, required: true },
      4: { type: Number, required: true },
      5: { type: Number, required: true },
    },
    reactions: {
      likes: { type: Number, required: true },
      dislikes: { type: Number, required: true },
    },
  },
  { collection: 'songs' },
);
