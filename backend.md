# Activity Companion: Backend Notes

Last updated: 2026-10-25
Frontend notes are in `FRONTEND.md`. Daily progress is in `PROJECT_NOTES.md`.
Never write real passwords, secrets, database URLs, keys, OTPs or tokens in this file. Write only variable names.

> 💬 **How to read this file:** every section has a "💬" line. It explains the section in very simple words.

---

## 1. What is this?

- Folder: `companion_server`
- It has small services behind one gateway. Docker Compose starts everything.
- Status: in development. Login is being fixed and tested. APIs for activities, chat and organizations do not exist yet (only the data models).

> 💬 The **backend** is the hidden part. It saves data, checks passwords and decides who can do what. The frontend only shows screens and asks the backend for help.

| Part | Status |
|---|---|
| Data models (user, session, media, address, activity, conversation, message, organization) | Done |
| User signup and CRUD | Written, needs Postman test |
| Password login, admin login, `/auth/me` | Written, needs test after Docker rebuild |
| OTP login (Redis and Fast2SMS) | Written, needs attempt limit per mobile |
| Role checks (`authenticate`, `authorize`, `selfOrAdmin`) | Done |
| Access and refresh tokens with sessions | Not started |
| Media upload (presigned URL, queue, workers) | Done, but not protected by login |
| Activity, chat, organization APIs | Not started |

---

## 2. Tech stack

- Node.js 22 and Express 5 (ES modules)
- MongoDB and Mongoose 9
- Redis (ioredis) and BullMQ (queues)
- JWT (`jsonwebtoken`) and `bcryptjs`
- `helmet`, `cors`, `express-rate-limit`
- Cloudflare R2 through the AWS S3 SDK (file storage)
- FFmpeg inside the media-service image (video and image work)
- Fast2SMS with axios (OTP SMS)
- Socket.IO (live events)
- Nginx (gateway), Docker and Docker Compose

> 💬 **Express** receives requests. **MongoDB** stores data. **Redis** is a fast short-term memory (OTP codes, cache). **BullMQ** is a to-do line for heavy jobs like video processing. **bcrypt** scrambles passwords so nobody can read them. **JWT** is the login ticket. **helmet, cors, rate-limit** protect the server. **Nginx** is the front door that sends each request to the right service.

---

## 3. Folder structure

```text
companion_server/
├── compose.yml, compose.dev.yml, .env, .env.example
├── gateway/            Dockerfile, nginx.conf, index.js
├── infrastructure/     redis.conf
└── services/
    ├── data-service/
    │   ├── app.js
    │   ├── config/        redis, r2, cloudflare, media, entity-registry
    │   ├── controllers/   auth, login, user, media
    │   ├── model/         user, session, media, address, activity,
    │   │                  conversation, message, organization, db
    │   ├── modules/auth/  auth.errors.js
    │   ├── queues/        media.queue.js, queue.service.js
    │   ├── routes/        auth, routes (users), media, otp (not used)
    │   ├── services/      user, media, r2, catche, user-cache, media-queue
    │   └── utils/
    │       ├── auth/jwt.js
    │       ├── helpers/encryption.js
    │       └── middelwares/auth.middleware.js   (folder name is misspelled)
    └── media-service/
        ├── app.js, config/, models/
        ├── processors/    image, video
        ├── queues/        image.worker, video.worker
        └── services/      media, socket, storage
```

> 💬 How a request travels: **route** (the address) -> **controller** (reads the request, sends the answer) -> **service** (does the real work) -> **model** (talks to the database). Keeping these apart makes the code easy to fix.

---

## 4. Services, ports and gateway

| Service | Inside port | How to reach it |
|---|---|---|
| Gateway (Nginx) | 80 | `http://localhost:8080` |
| data-service | 4000 | only through the gateway |
| media-service | 5000 | only through the gateway |
| Redis | 6379 | inside Docker |
| MongoDB | cloud URL from env | inside Docker |

| Public path | Goes to |
|---|---|
| `/api/auth/...` | data-service `/auth/...` |
| `/api/data/...` | data-service `/...` |
| `/api/media/...` | media-service `/...` |
| `/socket.io/...` | media-service socket |
| `/health` | gateway health check |

> 💬 The frontend only talks to `localhost:8080`. The gateway then forwards the request. Example: `POST /api/auth/login` becomes `POST /auth/login` inside data-service.

---

## 5. API list (data-service)

"Tested" means you ran it in Postman and saw the right answer. Change it to Yes only after that, and write the date.

| Method | Public URL | Login needed | Who can use it | Tested |
|---|---|---|---|---|
| GET | `/api/data/` | No | Health check | No |
| POST | `/api/data/users` | No | Anyone (signup) | No |
| GET | `/api/data/users` | Yes | Admin | No |
| GET | `/api/data/users/:id` | Yes | Own record or admin | No |
| PUT | `/api/data/users/:id` | Yes | Own record or admin | No |
| DELETE | `/api/data/users/:id` | Yes | Own record or admin (soft delete) | No |
| DELETE | `/api/data/users/hard/:id` | Yes | Admin | No |
| POST | `/api/auth/login` | No | Email and password | No |
| POST | `/api/auth/admin/login` | No | Admin and moderator only | No |
| GET | `/api/auth/me` | Yes | Current user | No |
| POST | `/api/auth/send-otp` | No | Anyone (rate limited) | No |
| POST | `/api/auth/verify-otp` | No | Anyone (rate limited) | No |
| POST | `/api/data/media/upload-url` | No (should be Yes) | Upload link | No |
| POST | `/api/data/media/create` | No (should be Yes) | Save media record | No |

Good answer: `{ success: true, data: { token, user } }`
Error answer: `{ success: false, message: "..." }`

> 💬 **Soft delete** = mark the user as deleted but keep the record. **Hard delete** = remove it forever (admin only). **:id** is the user's id in the URL.

Postman checks (use fake data only):
1. Health check returns `status: ok`
2. Signup works, and the answer has no password
3. Signup with `"role": "admin"` still gives role `user`
4. Login works, wrong password gives 401
5. `/auth/me` with token gives 200, without token gives 401
6. A normal user calling `GET /users` gives 403
7. A user editing another user's record gives 403
8. Admin login with a normal user gives 403
9. Six quick logins: the sixth gives 429

---

## 6. Login and permissions

How it works now:
1. Signup hashes the password with bcrypt. The fields `role`, `status`, verification fields and `deletedAt` are removed from the request.
2. Login checks email and password (or mobile and OTP). Inactive accounts are refused.
3. The server gives one JWT (7 days). It holds `sub` (user id) and `role`.
4. `authenticate` checks the token. `authorize(...roles)` checks the role. `selfOrAdmin` checks that you edit only your own record.
5. Rate limits: login 5 per minute, OTP send 3 per 10 minutes, OTP verify 5 per 10 minutes.

> 💬 **Authentication** = who are you? **Authorization** = what are you allowed to do? Example: a user is logged in (authentication), but still cannot open the admin list (authorization). **Rate limit** = a limit on tries, so nobody can guess passwords or OTPs again and again.

| Role | Can do |
|---|---|
| Guest | View public data, sign up, sign in |
| User (verified) | Own profile, join, create activities, chat, create organizations |
| Moderator | User rights plus review verifications, activities, reports |
| Admin | Everything |

The first admin will be created by a seed script (not written yet). Public signup can never make an admin.

Planned:
- Access token (15 minutes) plus refresh token, saved per session. Logout or block ends the session.
- A `permissions.js` file, `requirePermission(...)` and `requireVerified`
- OTP: count wrong tries per mobile, use a secure random OTP
- Protect and limit the media upload endpoints
- A log of role changes and admin actions

> 💬 Why a short access token? If someone steals it, it stops working in 15 minutes. The refresh token quietly gets a new one, so the user stays logged in.

---

## 7. Database models

| Model | File | What it stores |
|---|---|---|
| User | `model/user.model.js` | Name, email, mobile (unique), password (hidden), role, status, verification status, photos, address |
| Session | `model/session.model.js` | Login sessions and device info |
| Media | `model/media.model.js` | Uploaded files and their processing status |
| Address | `model/address.model.js` | Address (inside other models) |
| Activity, Organization, Conversation, Message | `model/*.model.js` | Defined, but no API yet |

Never send `password` to the client. A normal query hides it, but `aggregate` does not, so remove it with `$project: { password: 0 }`.

> 💬 A **model** is the shape of one kind of record, like a form with fields.

---

## 8. Media upload

Flow:
1. The client asks for an upload link (presigned URL).
2. The client uploads the file directly to storage.
3. The backend checks the file exists and saves a media record.
4. A job goes into the queue.
5. media-service workers compress the image or video and send progress with Socket.IO.

To do: protect the upload endpoints, check file type and size, check who owns the file, choose the final storage, and use FFmpeg and Sharp for compression.

> 💬 The big file goes straight to storage, not through your server. That keeps the server fast. The queue lets slow work (video) run in the background.

---

## 9. Environment variables (names only)

| Variable | Used by | Purpose |
|---|---|---|
| `NODE_ENV` | all | Use `production` on a real server |
| `PORT` | services | Port number |
| `DATABASE_URL` (sent as `MONGO_DB_URL`) | data, media | MongoDB connection |
| `REDIS_URL` | data, media | Redis connection |
| `JWT_SECRET` | data-service | Signs tokens (now) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_MINUTES`, `REFRESH_TOKEN_DAYS` | planned | Access and refresh tokens |
| `CLIENT_URL` | data, media | Allowed frontend address (CORS) |
| `FAST2SMS_API_KEY`, `FAST2SMS_OTP_ID` | data-service | OTP SMS |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | data, media | File storage |
| `MEGA_EMAIL`, `MEGA_PASSWORD` | media-service | Mega storage (to remove) |
| `ADMIN_EMAIL`, `ADMIN_MOBILE`, `ADMIN_PASSWORD` | seed script | First admin |

> 💬 A `.env` file keeps secrets out of the code. Never put it in Git or in a zip. Keep a clean `.env.example` with only the names.

---

## 10. How to run

Run these from the `companion_server` folder:

```powershell
docker compose config
docker compose up --build data-service gateway redis
docker compose ps -a
docker compose logs --tail=100 data-service
docker compose logs --tail=100 gateway
docker compose down
```

Good sign in the logs: `Data service listening on port 4000`.
A restart loop means the service crashes on start. Read the first error in the logs.
Use `--build` after every code change, because the code is copied into the image.

> 💬 `up --build` rebuilds and starts. `logs` shows what the service prints. `down` stops everything. A green "built" message does not mean it works. Always read the logs.

---

## 11. Security checklist

| Item | Status |
|---|---|
| Passwords hashed with bcrypt | Done |
| Protected fields removed on signup and update | Done |
| `helmet` and CORS limited to `CLIENT_URL` | In code. Set `CLIENT_URL` in compose |
| Login and OTP rate limits | Written, needs test |
| Ownership checks (`selfOrAdmin`) | Written, needs test |
| No password hash in `getAllUsers` and signup answer | To fix |
| OTP try limit per mobile, secure OTP | Not done |
| Test OTP only in development | Compose sets development now |
| Media endpoints need login and limits | Not done |
| No secrets in `compose.yml` or Git, change shared secrets | To do |
| Root `.gitignore` (`.env`, `node_modules`) | Missing |
| HTTPS in production | Not done |

---

## 12. Bugs to fix

| Bug | Fix |
|---|---|
| `auth.routes.js` has the placeholder `AUTH_MW_PATH` | Import `../utils/middelwares/auth.middleware.js` |
| `login.controller.js` import paths are wrong | Use `../utils/auth/jwt.js` and `../modules/auth/auth.errors.js` |
| OTP token uses `userId`, the rest use `sub` | Use `sub` everywhere |
| `compose.yml` has a database URL written inside it for media-service | Use `${DATABASE_URL}` and change the password |
| Rate limit sees the gateway IP, not the user | Add `app.set("trust proxy", 1)` |
| `NODE_ENV: development` turns on the fixed test OTP | Set it from env, use `production` on a server |

> 💬 The test OTP is `123456` for everyone. On a real server this would let anyone log in as anyone, so `NODE_ENV` must be `production` there.

---

## 13. To do list

1. Fix the three import and token bugs, rebuild Docker
2. Run the Postman checks
3. Remove the password hash from `getAllUsers` and the signup answer
4. Connect the frontend login
5. Seed script for the first admin
6. Access and refresh tokens with sessions
7. Activity API, then chat, then organization
8. Protect media endpoints, then free compression and storage
9. Security checklist to all Done

---

## 14. A feature is finished when

1. The backend code works
2. Input is checked and access rules are applied
3. Success and failure cases are tested in Postman
4. It works in Docker
5. These notes are updated
6. No secrets are saved in Git