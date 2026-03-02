import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ICollection {
  _id: Types.ObjectId;
  first_id?: string;
  oState: string;
  user: Types.ObjectId;
  infoType: string;
  forType: string;
  spaceId?: string;
  content_id: string;
  emoji?: string;
  operateStamp: number;
  sortStamp: number;
}

const CollectionSchema = new Schema<ICollection>(
  {
    first_id: { type: String },
    oState: { type: String, default: 'OK' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    infoType: { type: String, default: 'FAVORITE' },
    forType: { type: String, default: 'THREAD' },
    spaceId: { type: String },
    content_id: { type: String, required: true },
    emoji: { type: String },
    operateStamp: { type: Number, default: () => Date.now() },
    sortStamp: { type: Number, default: () => Date.now() },
  },
  { timestamps: true }
);

CollectionSchema.index({ user: 1, content_id: 1, forType: 1 }, { unique: true });
CollectionSchema.index({ user: 1, oState: 1, sortStamp: -1 });

const Collection: Model<ICollection> =
  mongoose.models.Collection || mongoose.model<ICollection>('Collection', CollectionSchema);

export default Collection;