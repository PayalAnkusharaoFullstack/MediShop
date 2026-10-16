# MediShop

MediShop is a React and Vite medicine marketplace with separate supplier, customer, doctor, admin, super-admin, and medical representative dashboards.

Customer, supplier, doctor, Medical Representative, admin, and Super Admin sign-in use the shared account page. Customer, supplier, doctor, and Medical Representative accounts can register there after selecting a role; admin accounts must be provisioned by a Super Admin. The first Super Admin account is created through one-time setup in the browser. Authentication uses localStorage for this demo and is not suitable for production access control.

## Run locally

```sh
npm install
npm run dev
```

## Checks

```sh
npm run build
npm run lint
```

Dashboard data is currently stored in browser localStorage. Use a backend with authentication and access controls before deploying with real customer or medical data.
