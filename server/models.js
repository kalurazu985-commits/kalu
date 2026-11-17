const m = require('mongoose');
const { Schema } = m;

const User = m.model('User', new Schema({
  username: { type: String, unique: true, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  color: { type: String, default: '#7c5cff' }
}, { timestamps: true }));

const roomSchema = new Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, unique: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });
roomSchema.index({ members: 1 });
const Room = m.model('Room', roomSchema);

const msgSchema = new Schema({
  roomId: { type: Schema.Types.ObjectId, required: true },
  sender: String, name: String, color: String,
  type: { type: String, default: 'text' },
  text: String, media: String, duration: Number,
  replyTo: { id: String, name: String, text: String },
  reactions: { type: Schema.Types.Mixed, default: {} },
  // Message deletion (additive; existing documents simply lack these fields).
  deleted: { type: Boolean, default: false },   // "Delete for everyone"
  deletedFor: { type: [String], default: [] }   // "Delete for me" (user ids)
}, { timestamps: true, minimize: false });
msgSchema.index({ roomId: 1, createdAt: -1 });
const Message = m.model('Message', msgSchema);

module.exports = { User, Room, Message };
