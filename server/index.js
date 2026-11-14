require('dotenv').config();
const path = require('path');
const fastify = require('fastify')({ logger: false });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');
const { User, Room, Message } = require('./models');

const PROD = process.env.NODE_ENV === 'production';
const SECRET = process.env.JWT_SECRET || (PROD ? null : 'dev-secret');
if (!SECRET) throw new Error('JWT_SECRET is required in production');
const sign = (u) => jwt.sign({ id: String(u._id), name: u.username, color: u.color }, SECRET, { expiresIn: '30d' });
const pub = (u) => ({ id: String(u._id), username: u.username, color: u.color });
const ser = (m) => { const o = m.toObject ? m.toObject() : m; return { ...o, roomId: String(o.roomId) }; };

fastify.register(require('@fastify/static'), { root: path.join(__dirname, '../client/dist') });
fastify.setNotFoundHandler((req, reply) =>
  req.url.startsWith('/api') ? reply.code(404).send({ error: 'Not found' }) : reply.sendFile('index.html'));

fastify.decorateRequest('user', null);
const guard = async (req, reply) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET); }
  catch { return reply.code(401).send({ error: 'Please sign in again' }); }
};

fastify.post('/api/auth/signup', async (req, reply) => {
  const { username, email, password, color } = req.body || {};
  const cleanUsername = String(username || '').trim().slice(0, 24);
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = typeof password === 'string' ? password : '';
  if (cleanUsername.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanPassword.length < 6 || cleanPassword.length > 128)
    return reply.code(400).send({ error: 'Enter a valid username, email and password (6–128 characters)' });
  if (await User.findOne({ $or: [{ username: cleanUsername }, { email: cleanEmail }] }))
    return reply.code(409).send({ error: 'Username or email is already taken' });
  const u = await User.create({ username: cleanUsername, email: cleanEmail, password: await bcrypt.hash(cleanPassword, 10), color: /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#7c5cff' });
  return { token: sign(u), user: pub(u) };
});

fastify.post('/api/auth/login', async (req, reply) => {
  const { email, password } = req.body || {};
  const u = await User.findOne({ email: String(email || '').trim().toLowerCase() });
  if (!u || !(await bcrypt.compare(typeof password === 'string' ? password : '', u.password)))
    return reply.code(401).send({ error: 'Wrong email or password' });
  return { token: sign(u), user: pub(u) };
});

const populate = (q) => q.populate('members', 'username color');
const makeCode = async () => {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (;;) {
    const c = Array.from({ length: 6 }, () => A[Math.floor(Math.random() * A.length)]).join('');
    if (!(await Room.exists({ code: c }))) return c;
  }
};

fastify.get('/api/rooms', { preHandler: guard }, async (req) =>
  populate(Room.find({ members: req.user.id }).sort({ updatedAt: -1 })).lean());

fastify.post('/api/rooms', { preHandler: guard }, async (req, reply) => {
  const name = String((req.body || {}).name || '').trim();
  if (!name) return reply.code(400).send({ error: 'Room name is required' });
  const r = await Room.create({ name, code: await makeCode(), owner: req.user.id, members: [req.user.id] });
  return populate(Room.findById(r._id)).lean();
});

fastify.post('/api/rooms/join', { preHandler: guard }, async (req, reply) => {
  const code = String((req.body || {}).code || '').trim().toUpperCase();
  const r = await Room.findOneAndUpdate({ code }, { $addToSet: { members: req.user.id } }, { new: true });
  if (!r) return reply.code(404).send({ error: 'No room found with that code' });
  const full = await populate(Room.findById(r._id)).lean();
  io.to(String(r._id)).emit('room:updated', full);
  return full;
});

fastify.get('/api/rooms/:id/messages', { preHandler: guard }, async (req, reply) => {
  if (!(await Room.exists({ _id: req.params.id, members: req.user.id }))) return reply.code(403).send({ error: 'Not a member' });
  const { before } = req.query;
  const list = await Message.find({ roomId: req.params.id, ...(before ? { createdAt: { $lt: new Date(before) } } : {}) })
    .sort({ createdAt: -1 }).limit(40).lean();
  return list.reverse().map((m) => ({ ...m, roomId: String(m.roomId) }));
});

const io = new Server(fastify.server, { transports: ['websocket'], maxHttpBufferSize: 8e6, cors: { origin: true } });
const online = new Map();

io.use((s, next) => {
  try { s.user = jwt.verify(s.handshake.auth.token, SECRET); next(); } catch { next(new Error('auth')); }
});

io.on('connection', async (s) => {
  const uid = s.user.id;
  online.set(uid, (online.get(uid) || 0) + 1);
  (await Room.find({ members: uid }, '_id').lean()).forEach((r) => s.join(String(r._id)));
  s.emit('presence:all', [...online.keys()]);
  io.emit('presence', { userId: uid, online: true });

  s.on('room:join', async (id) => { if (await Room.exists({ _id: id, members: uid })) s.join(String(id)); });

  s.on('message:send', async (d, ack) => {
    if (!d || !s.rooms.has(String(d.roomId))) return;
    const type = ['image', 'audio'].includes(d.type) ? d.type : 'text';
    const text = String(d.text || '').slice(0, 4000);
    if (type === 'text' && !text.trim()) return;
    const media = typeof d.media === 'string' && d.media.length <= 7_500_000 ? d.media : undefined;
    if (type !== 'text' && !media) { if (typeof ack === 'function') ack({ error: 'Media is missing or too large (maximum 5 MB)' }); return; }
    const msg = ser(await Message.create({
      roomId: d.roomId, sender: uid, name: s.user.name, color: s.user.color, type, text,
      media: type === 'text' ? undefined : media, duration: Number.isFinite(Number(d.duration)) ? Math.max(0, Math.min(600, Number(d.duration))) : undefined,
      replyTo: d.replyTo ? { id: d.replyTo.id, name: d.replyTo.name, text: String(d.replyTo.text || '').slice(0, 120) } : undefined
    }));
    s.to(String(d.roomId)).emit('message:new', msg);
    if (typeof ack === 'function') ack(msg);
  });

  s.on('message:react', async ({ id, emoji } = {}) => {
    if (typeof emoji !== 'string' || emoji.length > 16) return;
    const msg = await Message.findById(id).catch(() => null);
    if (!msg || !s.rooms.has(String(msg.roomId))) return;
    const r = { ...msg.reactions };
    const a = r[emoji] || [];
    r[emoji] = a.includes(uid) ? a.filter((x) => x !== uid) : [...a, uid];
    if (!r[emoji].length) delete r[emoji];
    msg.reactions = r; msg.markModified('reactions');
    await msg.save();
    io.to(String(msg.roomId)).emit('message:reaction', { id, reactions: r });
  });

  s.on('typing', (roomId) => { if (s.rooms.has(String(roomId))) s.to(String(roomId)).emit('typing', { roomId, userId: uid, name: s.user.name }); });

  s.on('disconnect', () => {
    const n = (online.get(uid) || 1) - 1;
    if (n <= 0) { online.delete(uid); io.emit('presence', { userId: uid, online: false }); } else online.set(uid, n);
  });
});

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI is missing in .env file!');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Atlas Connected Successfully! 🚀');
    return fastify.listen({ port: Number(process.env.PORT) || 5000, host: '0.0.0.0' });
  })
  .then((address) => {
    console.log(`Kalu Server is running live at ${address} 🟢`);
  })
  .catch((e) => {
    console.error('Database connection or Server startup error:', e);
    process.exit(1);
  });