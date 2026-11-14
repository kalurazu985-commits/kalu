# KALU — Setup (Windows / Node.js 20)

## 1. Requirements
- Node.js 20 LTS (npm included)
- MongoDB Atlas database and a database user

## 2. Configure MongoDB
- Copy `.env.example` to `.env` in the project root.
- Set `MONGO_URI` to your Atlas connection string. Include a database name, e.g. `/kalu`.
- Set `JWT_SECRET` to a long random secret (32+ characters).
- In Atlas Network Access, allow the IP address of the computer/server running KALU. Do not leave `0.0.0.0/0` enabled permanently.
- Ensure the database user has read/write access to the `kalu` database. URL-encode special characters in the password.

## 3. Install and build
Double-click `INSTALL_AND_RUN.bat`, or run `npm install`, `npm install --prefix client`, then `npm run build --prefix client`.

## 4. Start
Double-click `START_KALU.bat` or run `npm start`. Open http://localhost:5000.

For development, run `npm run dev` after installing dependencies. Vite proxies API and Socket.IO requests to port 5000.

## Important
Never share `.env`, MongoDB credentials, or JWT secrets. The archive intentionally excludes environment files and `node_modules`; dependencies are installed on your machine.
