# Frontend Boilerplate

## Main Technologies

<a href="https://vitejs.dev/"><img src="https://vitejs.dev/logo.svg" alt="Vite" width="100" /></a>
<a href="https://tanstack.com/query/v3/"><img src="https://seeklogo.com/images/R/react-query-logo-1340EA4CE9-seeklogo.com.png" alt="Vite" width="100" /><a>
<a href="https://vitest.dev/"><img src="https://vitest.dev/logo.svg" alt="Vite" width="100" /></a>
<a href="https://www.typescriptlang.org/"><img src="https://w7.pngwing.com/pngs/915/519/png-transparent-typescript-hd-logo-thumbnail.png" alt="Vite" width="100" /></a>
<a href="https://pnpm.io/"><img src="https://static-00.iconduck.com/assets.00/file-type-light-pnpm-icon-1024x1024-87eokmgo.png" alt="Vite" width="100" /></a>

---

## Prerequisites

- [pnpm](https://pnpm.io/installation)
- [node](https://nodejs.org/en/download)
- [git](https://git-scm.com/downloads)

## Setup

### Install modules:

```sh
pnpm install
```

### Settting Envs:

Copy/paste the contents of the .env.example file into a new file named
.env, and add the required credentials without any angle brackets or placeholders.

### Run:

```sh
pnpm dev
```

### Build:

```sh
pnpm build
```

### Preview your build:

```sh
pnpm preview
```

---

## Setting Up GitHub Actions with Environments

GitHub provides environments to store and manage secrets and environment variables per environment. The following guide explains how to set up secrets and environment variables for two environments, "Staging" and "Production".

## Setting Up Secrets

- Navigate to your GitHub repository and click on Settings.

- From the sidebar, click on Environments.

- Create two environments by clicking on New Environment, name them as "Staging" and "Production".

- Enter each environment and click on Add secret.

For both environments, add the following secrets:

```sh
AWS_ACCESS_KEY_ID

AWS_SECRET_ACCESS_KEY

AWS_REGION

AWS_S3_BUCKET

AWS_CLOUDFRONT_DISTRIBUTION_ID

PAT_GITHUB
```

## Setting Up Environment Variables

Inside each environment ("Staging" and "Production"), click on Add environment variable.

For both environments, add the following environment variables:

```sh
API_URL

GA_MEASUREMENT_ID

STRIPE_PUBLISHABLE_KEY

INTERCOM_KEY
```

---

## Private Access Tokens

Private Access Tokens are necessary to provide additional access for specific operations, like cloning a repository within GitHub Actions. They should be set up as secrets due to their sensitive nature.

For GitHub Actions, use the secret github-actions-submodule (which should be a Personal Access Token, or PAT). This token will be used for actions such as cloning your spocketUI repository.

Set this token to expire in 1 year, and make sure to renew it before it expires.
