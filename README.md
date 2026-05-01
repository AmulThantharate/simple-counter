# Simple Counter

A modern, production-ready full-stack application built with **TanStack Start**, featuring a robust CI/CD pipeline and automated Kubernetes deployments.

## 🚀 Features

- **Frontend**: Built with React and [TanStack Start](https://tanstack.com/start).
- **Styling**: Modern UI using **Tailwind CSS** and **Radix UI** components.
- **State Management**: Leveraging **TanStack Query** for efficient data fetching and state handling.
- **Testing**: Comprehensive test suite using **Vitest**.
- **CI/CD**: Fully automated pipeline with **Jenkins**, **SonarQube**, and **Trivy**.
- **Deployment**: GitOps-based deployment using **ArgoCD** on **Kubernetes**.

## 🛠️ Tech Stack

- **Core**: React 19, TypeScript
- **Routing**: TanStack Router
- **UI Components**: Radix UI, Lucide React
- **Validation**: Zod
- **Build Tool**: Vite
- **Testing**: Vitest, React Testing Library
- **Containerization**: Docker
- **Orchestration**: Kubernetes (ArgoCD)

## 📦 Getting Started

### Prerequisites

- Node.js (v20 or later)
- npm or bun

### Local Development

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/AmulThantharate/simple-counter.git
    cd simple-counter
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:3000`.

4.  **Run tests**:
    ```bash
    npm run test
    ```

## 🏗️ CI/CD Pipeline

The project includes a sophisticated Jenkins pipeline (`Jenkinsfile`) that ensures code quality and security:

1.  **Install Dependencies**: Clean install of all project dependencies.
2.  **Lint**: Code quality check using ESLint.
3.  **Test**: Unit and smoke tests using Vitest.
4.  **SonarQube**: Static code analysis and quality gate verification.
5.  **Security Scans**:
    - **Trivy File System Scan**: Checks for vulnerabilities in dependencies.
    - **Trivy Image Scan**: Scans the Docker image for security flaws.
    - **Confest Policy Check**: Validates Kubernetes manifests against security policies.
6.  **Docker Build & Push**: Automatically builds and pushes images to Docker Hub.
7.  **ArgoCD Sync**: Updates the Kubernetes deployment manifests in the repository, triggering an automated sync by ArgoCD.

## ☸️ Deployment

Deployment is managed via **ArgoCD**. The configuration can be found in `argo.yaml`.

- **Namespace**: `simple-counter`
- **Path**: `k8s/`
- **Auto-Sync**: Enabled with self-healing and pruning.

## 📄 License

This project is licensed under the MIT License.
