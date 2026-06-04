<h1 align="center">🎓 EduVerse</h1>

<p align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/10180/10180874.png" width="140" alt="E-Learning Logo" />
</p>

<div align="center">

<strong>Build powerful, cost-effective online education platforms</strong><br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-v9+-red.svg)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blueviolet.svg)](https://www.prisma.io/)

</div>

---

## 🎯 Overview

**Elearning Backend API** is a scalable, modular backend tailored for modern eLearning platforms. Built with a **microservice-friendly architecture** using **NestJS** and **TypeScript**, it supports secure authentication, cloud storage, media delivery, and seamless user-role management.

---

## 🚀 Key Highlights

- **Enterprise-ready architecture** using NestJS & TypeScript
- **JWT + Cognito** authentication with **RBAC** role access
- **Future-ready** with analytics and GraphQL roadmap

---

## 🧰 Technology Stack

### Framework

- **NestJS** – Scalable Node.js framework with strong typing and modular design

### Database & ORM

- **AWS RDS** – Cloud-hosted PostgreSQL/MySQL
- **Prisma** – Modern, type-safe ORM

### Authentication & Authorization

- **JWT** – Stateless, token-based login
- **RBAC** – Role-based access control (Admin, Instructor, Student)

### API Docs & Validation

- **Swagger (OpenAPI)** – Interactive API docs
- **Zod** – Schema-based validation

### Testing

- **Postman** – Manual & automated endpoint testing

---

## 🌟 Features

### Authentication & User Management

- Secure login using JWT
- Google social login integration
- Role-based access control (RBAC)

### Course & Content Management

- APIs for courses, lessons, quizzes, and uploads
- File storage in S3

### Video & Media Hosting

- Optimized streaming via S3 + CloudFront

### Email Notifications

- Account verification, alerts, and reminders via AWS SES

---

## 🗂️ Project Structure

```bash
elearning-api-v2/
├── src/
│   ├── app.module.ts                 # Root AppModule
│   ├── main.ts                       # Entry point
│   ├── config/                       # Config files for .env, AWS, DB
│   │   ├── aws.config.ts
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   ├── auth/                         # Auth module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── guards/
│   │       └── roles.guard.ts
│   ├── users/                        # User module (Cognito/RBAC)
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │       └── create-user.dto.ts
│   ├── courses/                      # Course module
│   │   ├── courses.controller.ts
│   │   ├── courses.service.ts
│   │   └── dto/
│   │       └── create-course.dto.ts
│   ├── lessons/                      # Lesson module
│   ├── uploads/                      # File upload to S3
│   │   ├── s3.service.ts
│   │   └── upload.controller.ts
│   ├── mail/                         # Email using AWS SES
│   │   ├── mail.service.ts
│   │   └── templates/
│   │       └── welcome-email.html
│   ├── analytics/                    # (Optional) Progress tracking
│   ├── common/                       # Reusable interfaces, filters, pipes
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── utils/
│   ├── prisma/                       # Prisma ORM setup
│   │   ├── prisma.service.ts
│   │   └── schema.prisma
│   └── docs/                         # Swagger docs setup
│       └── swagger.config.ts
│
├── test/                             # Unit & e2e tests
│   └── auth.e2e-spec.ts
├── .env                              # Environment config
├── .gitignore
├── docker-compose.yml                # Optional: DB container
├── nest-cli.json
├── package.json
├── README.md
└── tsconfig.json
```

---

## ⚙️ Installation Guide

### 📦 1. Clone and Install

```bash
git clone https://github.com/500InternalServer/EduVerse_api.git
cd EduVerse_api
npm install
```

### 🔐 2. Configure Environment

Create a `.env` file:

```env
PORT=number
DATABASE_URL=your_aws_rds_url
JWT_SECRET=your_secret_key
REGION=us-east-1
ACCESS_KEY_ID=your_access_key
SECRET_ACCESS_KEY=your_secret_key
```

### 🧪 3. Start Development Server

```bash
npm run start:dev
```

---

# 🔎 Elasticsearch – Team Usage Guide (Local Development)

This document explains **how team members use Elasticsearch** for searching **Categories and Courses** in local development.

> This setup is **required** for search features to work correctly.

---

## ✅ What Elasticsearch Is Used For

- Search **Categories** and **Courses**
- Vietnamese **accent-insensitive** search (nhac → nhạc)
- **Case-insensitive** search (NHAC → nhac)
- Local development only
- No Kibana required

---

## 🧩 Requirements (Team)

Each team member needs:

- Windows 10 / 11
- Docker Desktop (WSL2 enabled)
- PowerShell
- Node.js installed

---

## 📁 Files Included in the Repository

These files are already included. **Do not delete or modify them.**

```
docker-compose.yml

scripts/
└── es/
    ├── courses.index.json        # Course search mapping
    ├── categories.index.json     # Category search mapping
    ├── setup-courses.ps1         # Setup Course index
    ├── setup-categories.ps1      # Setup Category index
    └── setup-all.ps1             # Setup ALL indexes (RUN THIS)
```

---

## 🚀 How Team Members Use Elasticsearch

### 1️⃣ Start Elasticsearch

```
docker compose up -d
```

Check if Elasticsearch is running:

```
http://localhost:9200
```

If you see a JSON response, Elasticsearch is running correctly.

---

### 2️⃣ Setup Search Indexes (REQUIRED)

Run this **once after cloning the repository**:

```
powershell -ExecutionPolicy Bypass -File .\scripts\es\setup-all.ps1
```

This script will:

- Create search indexes for **Courses** and **Categories**
- Enable search without Vietnamese accents
- Enable case-insensitive search

⚠️ You MUST run this step when:

- You clone the repository for the first time
- Docker volumes were removed
- Elasticsearch configuration was updated
- Search returns empty or incorrect results

---

### 3️⃣ Configure Environment Variables

Create a `.env` file if it does not exist and add:

```
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_API_KEY=
```

---

### 4️⃣ Start the API

```
npm install
npm run start:dev
```

---

## 🔍 How to Test Search

### Category Search

```
GET /categories?text=nhac
GET /categories?text=NHAC
GET /categories?text=lap trinh
```

---

### Course Search (Public)

```
GET /course/public?text=nhac
GET /course/public?text=xu ly du lieu
GET /course/public?text=NHAC
```

⚠️ Only courses with status **Approved** are searchable.

---

## 🔁 When to Re-run Setup

Run `setup-all.ps1` again if:

- Search does not return results
- Docker was restarted or reset
- You pulled changes related to Elasticsearch
- You cloned the project again

---

## 🌍 Production Note

Elasticsearch is **NOT run on Vercel**.

For production environments:

- Use **Elastic Cloud** or **AWS OpenSearch**
- Only update environment variables:

```
ELASTICSEARCH_NODE=<production-es-url>
ELASTICSEARCH_API_KEY=<api-key>
```

---

## 🧪 Quick Fix (If Search Fails)

Run the following commands in order:

```
docker compose down -v
docker compose up -d
powershell -ExecutionPolicy Bypass -File .\scripts\es\setup-all.ps1
```

Then restart the API.

---
## 🔍 API Documentation

Once running, access interactive docs at:

```
http://localhost:8080/api/v1
```

Use **Postman** or Swagger UI for quick testing and endpoint exploration.

---

## 🤝 Contributing

We welcome contributions! To get started:

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feat/your-feature
   ```
3. Commit changes:
   ```bash
   git commit -m "feat: add your feature"
   ```
4. Push and open a Pull Request.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 👥 Contributors

Built with ❤️ by the **New Bie Coder Team**:

<table align="center">
  <tr>
    <td align="center">
      <a href="https://github.com/Vix1311">
        <img src="https://avatars.githubusercontent.com/u/166972180?v=4" width="100px;" alt="Mai Kỳ Vĩ"/>
        <br /><sub><b>Mai Kỳ Vĩ</b></sub>
      </a><br />💻
    </td>
    <td align="center">
      <a href="https://github.com/truongquangquoc2011">
        <img src="https://avatars.githubusercontent.com/truongquangquoc2011" width="100px;" alt="Trương Quang Quốc"/>
        <br /><sub><b>Trương Quang Quốc</b></sub>
      </a><br />💻
    </td>
    <td align="center">
      <a href="https://github.com/GiaHuy88693">
        <img src="https://avatars.githubusercontent.com/GiaHuy88693" width="100px;" alt="Huỳnh Lê Gia Huy"/>
        <br /><sub><b>Huỳnh Lê Gia Huy</b></sub>
      </a><br />💻
    </td>
  </tr>
</table>

---

## 📝 License

This project is licensed under the **MIT License**.
See the full [LICENSE](./LICENSE) for usage rights.

---

<div align="center">
  Built with ❤️ by the <b>New Bie Coder Team</b><br />
  <a href="https://github.com/Newbies-Coder/elearning-aws-api.git">⭐ Star us on GitHub!</a>
</div>
