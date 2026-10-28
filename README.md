# BiasharaFlow Dashboard

Merchant dashboard for BiasharaFlow: forecast a duka's M-PESA cash cycle, see an affordable restock limit, accept an offer and track capped repayments. **All data is simulated.**

## Quick start

```bash
npm install
cp .env.example .env     # VITE_API_MODE=mock works with no backend
npm run dev              # http://localhost:5173
npm run check            # lint + typecheck + tests + build (run before every commit)
npm run test:contract:live   # check a real backend against the contract (see docs/INTEGRATION.md)
```

## Docs

- [FRONTEND_PLAN.md](FRONTEND_PLAN.md): approach and screens
- [docs/ROADMAP.md](docs/ROADMAP.md): delivery phases and gates
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): layers and folder layout
- [docs/API_CONTRACT.md](docs/API_CONTRACT.md): endpoint contract
- [docs/INTEGRATION.md](docs/INTEGRATION.md): switching to the real backend (for backend engineers)
- [docs/DECISIONS.md](docs/DECISIONS.md): why things are the way they are
- [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md): questions for the backend pair
- [CONTRIBUTING.md](CONTRIBUTING.md): working rules
