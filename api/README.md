# AutoService API

Express + MySQL API for the AutoService frontend.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Update `.env` with your MySQL credentials.

4. Start the server:

```bash
npm run dev
```

## Endpoints

- `GET /health` - Basic health check with DB connectivity.
- `GET /service-requests` - List service requests.
- `POST /service-requests` - Create a service request.

## Notes

The frontend should keep using `VITE_API_BASE_URL` (e.g. `http://localhost:3000`).
