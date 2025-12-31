# Jira Summarizer Agentic AI

A high-performance monorepo for summarizing Jira tickets using state-of-the-art AI.

## Tech Stack
- **Backend**: NestJS
- **Frontend**: NextJS
- **Orchestration**: LangGraph
- **Database**: Postgres + pgvector
- **LLMs**: Azure OpenAI & Groq
- **Multi-modal**: Supports image analysis (e.g., Jira board screenshots)

## Getting Started

### 1. Prerequisites
- Node.js & npm
- Docker (for Postgres + pgvector)

### 2. Configuration
Copy `.env.example` to `.env` in the root and fill in the values:
```bash
cp .env.example .env
```

### 3. Start Database
```bash
docker-compose up -d
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Applications
```bash
# Start Backend
npm run dev:backend

# Start Frontend
npm run dev:frontend
```

## Features
- **Dynamic Source**: Toggle between Jira Cloud API and Local Excel files.
- **Agentic Workflow**: Uses LangGraph to manage complex reasoning and retrieval.
- **Vector Search**: pgvector powered RAG for semantic search across tickets.
- **Multi-modal**: Pass screenshots or diagrams to the agent for richer context.
- **Premium UI**: Modern dark-mode interface with smooth animations.
