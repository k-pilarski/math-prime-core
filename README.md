# Online Course Platform (LMS)

A full-stack web application for selling and hosting online courses. The platform features time-restricted premium access control (7-day pass model), secure authentication, and integration with unlisted YouTube videos for content delivery.

## 🚀 Tech Stack

### Core
* **Language:** TypeScript (Frontend & Backend)
* **Runtime:** Node.js
* **Package Manager:** npm
* **Architecture:** Monorepo (Client + Server)

### Backend (`/server`)
* **Framework:** Express.js
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Authentication:** JWT (JSON Web Tokens) + bcryptjs
* **Validation:** Zod
* **Payments:** Stripe (planned)

### Frontend (`/client`)
* **Framework:** React
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **HTTP Client:** Axios
* **Video:** react-player

## 📂 Project Structure

The project follows a Monorepo structure:

```bash
math-prime-core/
├── client/         # React Frontend application
│   ├── src/
│   ├── public/
│   └── ...
├── server/         # Express Backend API
│   ├── src/
│   ├── prisma/     # Database schema and migrations
│   └── ...
└── README.md