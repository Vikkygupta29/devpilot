# DevPilot 🚀

[![Java](https://img.shields.io/badge/Java-21-orange.svg?style=flat-square&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1.1-6DB33F.svg?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg?style=flat-square&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_with_pgvector-336791.svg?style=flat-square&logo=postgresql)](https://github.com/pgvector/pgvector)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Inference-Groq_LPU_(300+_tps)-F55036.svg?style=flat-square)](https://groq.com/)

**DevPilot** is an enterprise-ready, AI-driven codebase intelligence platform and contextual coding assistant. It connects seamlessly to your GitHub repositories, indexes source files into a high-dimensional vector database (PostgreSQL with `pgvector` HNSW indexing), and provides real-time, citation-grounded code intelligence powered by lightning-fast Groq LPU inference.

---

## 📑 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Configure GitHub OAuth App](#2-configure-github-oauth-app)
  - [3. Start PostgreSQL with pgvector](#3-start-postgresql-with-pgvector)
  - [4. Configure and Run Backend](#4-configure-and-run-backend)
  - [5. Configure and Run Frontend](#5-configure-and-run-frontend)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [API Reference](#-api-reference)
  - [Authentication](#authentication)
  - [Repositories & Indexing](#repositories--indexing)
  - [Chat & Sessions](#chat--sessions)
- [Streaming Protocol (SSE)](#-streaming-protocol-sse)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)
- [License](#-license)

---

## 🏛️ Overview & Architecture

DevPilot bridges developer workflows with large language models through Retrieval-Augmented Generation (RAG) fine-tuned for source codebases.

```
                      ┌──────────────────────────────────────────────┐
                      │              Next.js 16 Client               │
                      │  (App Router, React 19, Tailwind v4, SSE)   │
                      └──────────────────────┬───────────────────────┘
                                             │ HTTP / SSE (Proxy / Next Rewrites)
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │          Spring Boot 4.1.1 Backend           │
                      │  - GitHub OAuth2 & Encrypted Tokens          │
                      │  - Code Tree Crawler & Semantic Chunker      │
                      │  - Spring AI Retrieval & RAG Prompt Builder  │
                      │  - Groq LPU Ultra-Fast Chat Engine           │
                      └──────────────┬────────────────────────┬──────┘
                                     │                        │
                 Embedding & Chunks  ▼                        ▼ LLM Completion (SSE)
     ┌──────────────────────────────────────────┐    ┌───────────────────────────────────┐
     │        PostgreSQL 16 + pgvector          │    │         Groq Cloud API            │
     │  - Vector Dimension: 768                 │    │  (openai/gpt-oss-120b,            │
     │  - Index: HNSW (Cosine Distance)         │    │   qwen/qwen3.8-27b, Fallback)     │
     │  - Encrypted User Tokens, Repos, History │    └───────────────────────────────────┘
     └──────────────────────────────────────────┘
```

1. **Authentication**: Users authenticate via GitHub OAuth. OAuth access tokens are encrypted with AES-256 before persisting in PostgreSQL.
2. **Repository Sync**: Repositories are fetched via the GitHub REST API and synchronized with metadata (stars, languages, visibility).
3. **Semantic Code Chunking**: Repositories are recursively traversed, ignoring binary assets, lockfiles, and vendor directories. Code files are divided into sliding 800-token chunks with 100-token overlaps, retaining precise line numbers.
4. **Vector Embeddings**: Chunks are embedded into 768-dimensional vector representations and stored in PostgreSQL using the `pgvector` extension with an HNSW cosine distance index.
5. **RAG-Powered Chat**: Developer prompts perform similarity search across the vector store. Context is merged with conversational history and streamed via Groq LPU inference (300+ tokens/second) over Server-Sent Events (SSE) with interactive file citations.

---

## ✨ Key Features

- **⚡ Blazing-Fast Inference**: Groq LPU engine delivers completions at 300+ tokens/sec with intelligent automatic failover to alternative models or Gemini Flash-Lite.
- **🔍 Grounded Source Citations**: Every AI response includes clickable citations indicating the exact file paths and line ranges (`file.py#L12-L45`) used to answer the question.
- **🛡️ Secure GitHub Integration**: GitHub OAuth 2.0 with session-based cookies (`DEVPILOT_SESSION`), CSRF protections, and AES-256 token encryption at rest.
- **🌲 Intelligent Code Tree Filtering**: Automatically filters out binaries, images, package caches (`node_modules`, `target`, `.git`), and large non-source files (>100KB).
- **📊 Real-Time Indexing Progress**: Non-blocking asynchronous indexing with live status updates (`PENDING`, `INDEXING`, `READY`, `FAILED`) polled via TanStack React Query.
- **🎨 Sleek Developer UI**: Designed with Tailwind CSS v4, dark and light mode support, responsive drawer/sidebars, and full markdown code block rendering.

---

## 🛠️ Tech Stack

### Backend
- **Language**: Java 21 (LTS)
- **Framework**: Spring Boot 4.1.1 (Spring Security, Spring WebMVC, Spring Data JPA)
- **AI Framework**: Spring AI 2.0.1
- **LLM Engine**: Groq Cloud API (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`) with Gemini fallback
- **Embeddings**: OpenRouter OpenAI-compatible API / Google Gemini Embeddings (768 dimensions)
- **Database**: PostgreSQL 16 with `pgvector` extension (HNSW Cosine Index)
- **Security**: Spring Security OAuth2 Client, Custom Token Encryption (`AES-GCM` / `PBEWithHmacSHA256AndAES_256`)

### Frontend
- **Framework**: Next.js 16.3.5 (App Router, Turbopack)
- **UI Library**: React 19.2.8, TypeScript 5
- **Styling**: Tailwind CSS v4, Base UI, Shadcn UI, Lucide Icons
- **State Management**: TanStack React Query v5
- **Streaming**: Native Server-Sent Events (SSE) reader (`stream-chat.ts`)
- **Markdown & Code**: Streamdown & syntax highlighting

---

## 📂 Project Structure

```text
devPilot/
├── docker-compose.yml              # PostgreSQL + pgvector container definition
├── docker/
│   └── postgres/
│       └── init-extensions.sql     # pgvector, hstore, and uuid-ossp initialization
├── backend/                        # Spring Boot Application
│   ├── pom.xml                     # Maven dependencies (Java 21, Spring Boot 4.1.1)
│   └── src/main/
│       ├── java/com/devpilot/
│       │   ├── BackendApplication.java
│       │   ├── config/             # Security, CORS, Encryption, App Config
│       │   ├── controllers/        # REST Controllers (Auth, Repos, Chat)
│       │   ├── dto/                # Request & Response DTOs
│       │   ├── entity/             # JPA Entities (User, Repository, ChatSession, ChatMessage)
│       │   ├── repository/         # Spring Data JPA Repositories
│       │   ├── security/           # OAuth2 User Service & Principal resolution
│       │   └── services/           # Business logic
│       │       ├── ai/             # GroqChatModel, CodeContextRetriever, RAG Prompting
│       │       ├── github/         # GitHub REST API client & Rate Limiter
│       │       └── indexing/       # Code chunker, filter & async indexing pipeline
│       └── resources/
│           └── application.properties # App properties & database configurations
└── client/                         # Next.js 16 App Router Client
    ├── package.json
    ├── next.config.ts              # API proxy rewrites to :8080 & redirect rules
    ├── proxy.ts                    # Edge session protection & auth gate
    ├── app/
    │   ├── layout.tsx              # Root app layout & theme provider
    │   ├── page.tsx                # Gateway router (redirects to /login or /dashboard)
    │   ├── login/page.tsx          # GitHub OAuth sign-in page
    │   ├── auth/callback/page.tsx  # OAuth token exchange & handshake page
    │   ├── dashboard/              # Repositories & overview dashboard
    │   └── chat/[repoId]/page.tsx  # Interactive codebase chat session view
    ├── components/
    │   ├── chat/                   # Composer, Message list, Citations, Index state
    │   ├── dashboard/              # Repo cards, filters, stats, sync actions
    │   └── ui/                     # Shadcn / Base UI components
    └── lib/
        ├── api.ts                  # Typed client API services & TanStack queries
        ├── stream-chat.ts          # SSE parser & stream consumer
        └── utils.ts
```

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

- **Java Development Kit (JDK)**: Version 21 or higher
- **Node.js**: Version 20.x or higher (along with `npm` or `pnpm`)
- **Docker & Docker Compose**: For running PostgreSQL with `pgvector`
- **GitHub Account**: To create an OAuth Application
- **Groq API Key**: Obtain a free API key at [Groq Console](https://console.groq.com/keys)
- **OpenRouter or Gemini API Key**: For generating chunk embeddings

---

## 🚀 Quick Start Guide

### 1. Clone Repository

```bash
git clone https://github.com/your-username/devPilot.git
cd devPilot
```

### 2. Configure GitHub OAuth App

1. Go to **[GitHub Developer Settings > OAuth Apps](https://github.com/settings/developers)**.
2. Click **New OAuth App**.
3. Set the following fields:
   - **Application name**: `DevPilot Local`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:8080/login/oauth2/code/github`
4. Register the application and generate a **Client Secret**.
5. Save your **Client ID** and **Client Secret**.

---

### 3. Start PostgreSQL with pgvector

Launch the preconfigured PostgreSQL 16 container with the `pgvector` extension enabled:

```bash
docker compose up -d
```

Verify that the container is healthy:

```bash
docker ps --filter "name=devpilot-postgres"
```

> **Note**: PostgreSQL is exposed on host port `5433` (mapped to internal `5432`) to avoid collisions with any local PostgreSQL instance.

---

### 4. Configure and Run Backend

Navigate to the `backend` directory:

```bash
cd backend
```

Set your environment variables (or export them in your shell):

#### Windows (PowerShell):
```powershell
$env:GROQ_API_KEY="gsk_your_groq_api_key_here"
$env:OPENROUTER_API_KEY="sk-or-your_openrouter_api_key_here"
$env:GITHUB_CLIENT_ID="your_github_client_id"
$env:GITHUB_CLIENT_SECRET="your_github_client_secret"
$env:TOKEN_ENCRYPTOR_PASSWORD="devpilot-local-encrypt-key-change-me"
```

#### Linux / macOS (Bash):
```bash
export GROQ_API_KEY="gsk_your_groq_api_key_here"
export OPENROUTER_API_KEY="sk-or-your_openrouter_api_key_here"
export GITHUB_CLIENT_ID="your_github_client_id"
export GITHUB_CLIENT_SECRET="your_github_client_secret"
export TOKEN_ENCRYPTOR_PASSWORD="devpilot-local-encrypt-key-change-me"
```

Start the Spring Boot backend using Maven:

```bash
./mvnw spring-boot:run
```
*(On Windows: `.\mvnw.cmd spring-boot:run`)*

The backend will start on **`http://localhost:8080`**.

---

### 5. Configure and Run Frontend

In a new terminal window, navigate to the `client` directory:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the Next.js development server:

```bash
npm run dev
```

Open your browser at **`http://localhost:3000`**.

---

## ⚙️ Configuration & Environment Variables

### Backend Configuration (`backend/src/main/resources/application.properties`)

| Environment Variable | Default Value | Description |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5433/devpilot` | PostgreSQL JDBC connection URL |
| `POSTGRES_USER` | `postgres` | Database username |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `PGVECTOR_DIMENSIONS` | `768` | Embedding dimensionality (must match embedding model) |
| `GROQ_API_KEY` | *(Required)* | Groq Cloud API key for ultra-fast chat completions |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Groq chat model identifier |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | Groq OpenAI-compatible endpoint |
| `EMBEDDING_PROVIDER` | `openrouter` | Embedding source (`openrouter` or `gemini`) |
| `OPENROUTER_API_KEY` | *(Required for OpenRouter)* | API key for generating vector embeddings |
| `OPENROUTER_EMBEDDING_MODEL` | `openai/text-embedding-3-small` | Model used for source code embeddings |
| `GEMINI_API_KEY` | *(Optional)* | Google Gemini API key used for fallback inference |
| `GITHUB_CLIENT_ID` | *(Required)* | GitHub OAuth application Client ID |
| `GITHUB_CLIENT_SECRET` | *(Required)* | GitHub OAuth application Client Secret |
| `TOKEN_ENCRYPTOR_PASSWORD` | *(Required)* | Master encryption key for user OAuth tokens |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed origin for authentication redirects & CORS |

### Frontend Configuration (`client/`)

| Environment Variable | Default Value | Description |
|---|---|---|
| `INTERNAL_BACKEND_URL` | `http://localhost:8080` | URL of the backend API used for Next.js server rewrites |

---

## 📡 API Reference

All requests to `/api/*` are session-authenticated using the `DEVPILOT_SESSION` cookie issued after GitHub OAuth login.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/login-url` | Returns the GitHub OAuth login initialization URL |
| `GET` | `/api/auth/me` | Returns current authenticated user profile |

### Repositories & Indexing

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/repos?refresh=true` | Syncs repositories from GitHub and returns list |
| `GET` | `/api/repos/{id}` | Gets stored repository details |
| `GET` | `/api/repos/{id}/status` | Checks real-time indexing status and file counts |
| `POST` | `/api/repos/{id}/index` | Triggers asynchronous code chunking and vector indexing |

#### Index Status Schema:
```json
{
  "repositoryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "indexStatus": "READY",
  "filesTotal": 142,
  "filesProcessed": 142,
  "chunkCount": 384,
  "indexedAt": "2026-10-11T10:15:30Z",
  "errorMessage": null
}
```

### Chat & Sessions

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat/sessions` | Creates a new chat thread for a repository |
| `GET` | `/api/chat/sessions?repositoryId={repoId}` | Lists all chat sessions for a repository |
| `GET` | `/api/chat/sessions/{id}` | Retrieves historical messages and citations for a session |
| `POST` | `/api/chat/sessions/{id}/messages` | Sends a prompt and streams back the assistant response (SSE) |

---

## 🌊 Streaming Protocol (SSE)

The message endpoint `POST /api/chat/sessions/{id}/messages` streams Server-Sent Events with `Content-Type: text/event-stream`.

### Event Flow:

1. **`user_message`**: Acknowledges and echoes the persisted user message.
   ```json
   data: {"id":"...","role":"USER","content":"Where is authentication configured?","citations":[]}
   ```
2. **`citations`**: Emits retrieved source code references with file paths and line numbers prior to text streaming.
   ```json
   data: [{"filePath":"backend/src/main/java/com/devpilot/config/SecurityConfig.java","startLine":1,"endLine":45,"language":"java"}]
   ```
3. **`chunk`**: Real-time token streaming from the Groq inference engine.
   ```json
   data: Authentication is configured in `SecurityConfig.java`...
   ```
4. **`done`**: Emits the final synthesized message payload.
5. **`error`**: Emitted in the event of an upstream model or retrieval failure.

---

## 🛠️ Troubleshooting & FAQs

### 1. Database Connection Refused (`port 5433`)
- Make sure Docker is running and verify the container is active:
  ```bash
  docker compose ps
  ```
- If your local environment has another service on `5433`, change the port mapping in `docker-compose.yml` (e.g., `"5434:5432"`) and update `spring.datasource.url` in `application.properties`.

### 2. GitHub OAuth Redirect Mismatch (`redirect_uri_mismatch`)
- Verify that your GitHub OAuth App **Authorization callback URL** is set to:
  `http://localhost:8080/login/oauth2/code/github`
- Ensure **Homepage URL** is set to `http://localhost:3000`.

### 3. Repository Indexing Fails on Rate Limits
- DevPilot includes an internal GitHub API rate limiter (`app.github.api-delay-ms=50`). For large enterprise repositories with thousands of files, GitHub API rate limits apply to personal access tokens. Ensure you are authenticated with an active GitHub account.

### 4. Vector Dimensions Mismatch
- If you change the embedding model (e.g. from 768 dimensions to 1536), you must update `PGVECTOR_DIMENSIONS` in `application.properties` and reset the vector schema in PostgreSQL:
  ```sql
  DROP TABLE IF EXISTS vector_store;
  ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Contributions and pull requests are welcome!
