# Project Setup Readme

This readme provides step-by-step instructions for setting up and running the boilerplate application with Shopify integration. Follow the steps below to get started:

## Prerequisites
- Docker
- Python
- Pyenv

## Installation
1. Clone the repository and navigate to the project directory.
2. Install Docker, Python, and Pyenv on your system.

## Environment Setup
1. Create a new `.env` file in the project root directory.
2. Obtain your Shopify API client and secret keys and add them to the `.env` file.

## Shopify App Configuration
1. Go to your Shopify dashboard -> App setup -> URLs.
2. Set the following values:
   - App URL: `http://localhost:8000/shopify_login`
   - Allowed redirect URLs: `http://localhost:8000/shopify_login` and `http://localhost:8000/shopify_token`

## Virtual Environment Setup
1. Create a new virtual environment using python3 venv:
    - python3 -m venv venv
2. Activate the virtual environment:
    - source ./venv/bin/activate

## Requirements Installation
1. Inside your virtual environment, install the required packages from `requirements.txt`: 
    - pip install -r requirements.txt --use-deprecated=legacy-resolver

## Database Setup
1. Run Docker Compose to start the database: 
    - docker-compose up -d
2. Perform database migrations: 
    - python3 manage.py migrate
3. Create a superuser for the application: 
    - python manage.py createsuperuser

## Running the Server
1. Start the development server:
    - python manage.py runserver 
2. Test your setup by visiting the admin page and logging in:
    - http://localhost:8000/admin/

## Deployment
To deploy the application, follow these steps:

1. Add all the required environment variables to the GitHub environment:
    - Make sure to include the same variables from the `.env` file in your GitHub repository's environment settings.

2. Obtain the JSON configuration for the ECS (Elastic Container Service) service you will deploy on AWS.

3. Add the JSON configuration obtained in step 2 to the folder `.github/workflows` in your GitHub repository.

Now your application is ready for deployment on AWS using the configured GitHub Actions workflow. If you face any issues during the deployment process, refer to this readme or seek assistance from your team members. Happy deploying! 🚀

## Custom Commands

### Reset Webhooks

This command is useful for forcing the update (reset) of all users in the database who have a connected shop. The Shopify webhook will be reset to point to the current API URL present in the environment variables. This command was originally created for use after migrating from the Jubilee and Smarti apps, but it can also be useful in a development environment when, for example, you want to use an ngrok server to test anything related to the Shopify webhooks.

```bash
    python manage.py reset_webhooks
```

You can specify the maximum number of workers to parallelize the deletion and creation of webhooks.

```bash
    python manage.py reset_webhooks --max-workers 5
```

With the flag "--skip-delete", you can skip the deletion of current webhooks and just create new ones, keeping the old ones intact.

```bash
    python manage.py reset_webhooks --skip-delete
```
