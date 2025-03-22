# DevTinder Backend

## 🚀 Overview
DevTinder is a developer-matching platform that connects developers based on skills, interests, and projects. This repository contains the **backend** services that power DevTinder, providing authentication, matchmaking, real-time chat, and user management.

The **frontend** repository is available at [DevTinder-Web](https://github.com/ayushhh101/devTinder-web).

## 🛠 Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ORM)
- **Authentication:** JWT (JSON Web Token) & Bcrypt
- **Real-time Communication:** Socket.io (for chat functionality)

## 🌟 Features
- 🔐 Secure JWT-based authentication
- 🏆 Developer profile creation & management
- 🔥 Swipe-based matchmaking system
- 💬 Real-time chat with WebSockets (Socket.io)
- 🎯 Skill-based search and filtering
- 🛡️ Middleware for authentication & authorization

## 📦 Installation & Setup
To run the backend locally, follow these steps:

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/ayushhh101/DevTinder-BE.git
cd DevTinder-BE
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Set Up Environment Variables
Create a `.env` file in the root directory and configure it as follows:
```env
PORT=5000
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-secret-key>
CLOUDINARY_API_KEY=<optional-cloud-storage-key>
```

### 4️⃣ Start the Server
```bash
npm start
```
The backend will be running at `http://localhost:5000/`.

## 📡 API Endpoints
Base URL: `http://localhost:5000/api`

### Authentication Routes
| Endpoint          | Method | Description                      |
|------------------|--------|----------------------------------|
| `/auth/signup`   | POST   | Register a new user             |
| `/auth/login`    | POST   | Authenticate user & get token   |
| `/auth/logout`   | POST   | Logout the user                 |

### User Routes
| Endpoint                     | Method | Description                                   |
|------------------------------|--------|-----------------------------------------------|
| `/user/requests/received`    | GET    | Fetch all pending connection requests        |
| `/user/connections`          | GET    | Fetch all accepted connections               |
| `/user/feed`                 | GET    | Fetch users for feed                         |

### Profile Routes
| Endpoint               | Method | Description                          |
|------------------------|--------|--------------------------------------|
| `/profile/view`        | GET    | View user profile                   |
| `/profile/edit`        | PATCH  | Edit user profile                    |
| `/profile/password`    | PATCH  | Update user password                 |

### Connection Request Routes
| Endpoint                          | Method | Description                                  |
|-----------------------------------|--------|----------------------------------------------|
| `/request/send/:status/:toUserId` | POST   | Send a connection request                   |
| `/request/review/:status/:requestId` | POST | Review a connection request                 |

### Chat Routes
| Endpoint                 | Method | Description                          |
|--------------------------|--------|--------------------------------------|
| `/chat/:targetUserId`    | GET    | Fetch chat messages between users   |

## 🚀 Deployment
To deploy the backend:

### Build & Start the Server
```bash
npm run build
npm start
```
You can deploy it on **Heroku, AWS EC2, or DigitalOcean**.

## 🤝 Contributing
We welcome contributions! Please **fork** the repository, create a feature branch, and submit a pull request.

## 📩 Contact
For queries or collaborations, reach out to **Ayushhh101** via GitHub or email.

---
💡 *DevTinder - Empowering developers to connect and collaborate!*
