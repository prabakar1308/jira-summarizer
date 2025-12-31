# JiraSummarizer AI 🚀

A high-performance, AI-driven analysis engine that summarizes and analyzes Jira tickets and Excel data using LangGraph, Next.js, and NestJS.

## 🌟 Overview

JiraSummarizer is a monorepo application designed to streamline project management by providing intelligent insights into your tasks. Whether your data is in Jira or an Excel spreadsheet, our AI agent can fetch, analyze, and present summaries in a clean, professional format.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: Vanilla CSS with modern aesthetics (Glassmorphism, gradients)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown**: [React Markdown](https://github.com/remarkjs/react-markdown) with GFM support

### Backend
- **Framework**: [NestJS](https://nestjs.com/)
- **AI Orchestration**: [LangChain](https://js.langchain.com/) & [LangGraph](https://langchain-ai.github.io/langgraphjs/)
- **LLM Providers**: [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) & [Groq](https://groq.com/) (Llama 3.3)
- **Database**: SQLite with [TypeORM](https://typeorm.io/)
- **Vector Search**: [sqlite-vec](https://github.com/asg017/sqlite-vec) for RAG (Retrieval-Augmented Generation)
- **Protocol**: [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) for tool integration
- **Data Parsing**: `xlsx` for Excel processing

---

## 🚀 Project Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/jira-summarizer.git
   cd jira-summarizer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add the following:
   ```env
   # LLM Configuration
   PREFERRED_LLM=groq # or 'azure'
   GROQ_API_KEY=your_groq_key
   AZURE_OPENAI_API_KEY=your_azure_key
   AZURE_OPENAI_ENDPOINT=your_endpoint
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

   # Data Source
   DATA_SOURCE=jira # or 'excel'
   EXCEL_FILE_PATH=./data/tickets.xlsx

   # Jira Configuration
   JIRA_HOST=https://your-domain.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your_jira_token

   # Database
   DATABASE_URL=data/jira_summarizer.db
   ```

### Running the Application
You can start both the backend and frontend simultaneously from the root:

- **Start Backend**: `npm run dev:backend`
- **Start Frontend**: `npm run dev:frontend`

---

## 🧠 Using RAG (Retrieval-Augmented Generation)

The project includes a built-in RAG system using `sqlite-vec`. This allows the AI to search for tickets based on semantic meaning rather than just keywords.

### Steps to Use:

1.  **Configure Embeddings**:
    Ensure your `.env` has the following Azure OpenAI credentials, as they are used to generate vector embeddings:
    ```env
    AZURE_OPENAI_API_KEY=...
    AZURE_OPENAI_ENDPOINT=...
    AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-ada-002 # Use your embedding model name
    ```

2.  **Sync/Index Data**:
    Before you can search, you need to "index" your Jira or Excel data into the vector database.
    - Send a `POST` request to `http://localhost:3001/rag/sync`.
    - This will fetch all tickets from your current `DATA_SOURCE` and store their embeddings in the SQLite vector table.

3.  **Perform Semantic Search**:
    Once indexed, you can find tickets that are semantically related to a query.
    - Send a `GET` request to `http://localhost:3001/rag/search?query=Your Search Term`.
    - **Example**: `GET /rag/search?query=login issues` will return tickets related to authentication even if they don't contain the exact word "login".

4.  **Automatic Integration**:
    The `RagService` is available throughout the backend. You can easily integrate it into the `AgentService` workflow by adding a search node before the summarization step to provide the LLM with the most relevant historical context.

---

## 🤖 Agent Flow & Orchestration

The heart of JiraSummarizer is its **LangGraph-powered AI Agent**. The flow is designed to be resilient and extensible:

### The Summarization Workflow
1. **Fetch Data (`fetch_data` node)**: 
   - Dynamically switches source based on `DATA_SOURCE` env.
   - For Jira: Connects via REST API and pulls recent issues.
   - For Excel: Parses the local sheet using `xlsx`.
2. **Summarize (`summarize` node)**:
   - Injects the fetched data into a high-context System Message.
   - Employs a specific LLM (Llama 3.3 or GPT-4) to analyze the user's query.
   - **Formatting Enforcement**: The agent is hard-coded to return data in an **ordered list** format, focusing on:
     - `Key`
     - `Summary`
     - `Status`
     - `Priority`
     - `Assignee`

### RAG Integration (Vector Search)
When indexing is enabled, the `RagService`:
1. Generates OpenAI Embeddings for each ticket.
2. Stores them in a `sqlite-vec` virtual table.
3. Allows the agent to "search" for similar historical tickets to provide better context.

---

## 💡 Real-Time Examples

### Case 1: Jira Analysis
**User Query**: *"What is the status of the authentication bugs?"*
**Agent Action**: Fetches Jira tickets matching 'authentication', filters by 'bug' type.
**Response**: 
1. **[SEC-402]** - User login failing on Safari
   - **Status**: In Progress
   - **Priority**: High
   - **Assignee**: Alex Rivers
2. **[SEC-405]** - MFA timeout too short
   - **Status**: Todo
   - **Priority**: Medium
   - **Assignee**: Sam Smith

### Case 2: Excel Summarization
**User Query**: *"Give me a summary of priority 1 tasks in the spreadsheet"*
**Agent Action**: Loads local `xlsx`, filters rows where priority is 1.
**Response**:
1. **[TASK-01]** - Database Migration
   - **Status**: Completed
   - **Priority**: 1
   - **Assignee**: DevOps Team

---

## 📂 Repository Structure
```text
.
├── apps/
│   ├── backend/          # NestJS Server & AI Logic
│   └── frontend/         # Next.js UI & Dashboard
├── data/                 # SQLite DB & Excel files
├── package.json          # Monorepo workspaces config
└── .env                  # Environment secrets
```

---

## ⚖️ License
UNLICENSED (Proprietary)
