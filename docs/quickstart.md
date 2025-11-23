# ELLE Website and API Quickstart Guide

Welcome to the setup guide for the ELLE Website and API. Follow these instructions to set up a local instance of the ELLE Website and API on your machine.

## Prerequisites

-   Python 3.11 or higher installed on your system.
-   Node.js version 20 or above installed on your system.
-   MySQL Community Server (8.0.43-0ubuntu0.24.04.2) [If running a local DB instance]

## Installation Steps

1. Clone the repository to your local machine.

2. Navigate to the root directory of the cloned repository.

3. Install Python dependencies by running the following command:

    ```bash
    pip install -r requirements.txt
    ```

4. Create a file named `.env` in the main directory with the following properties:

    ```python
    MYSQL_DATABASE_USER='elle'
    MYSQL_DATABASE_PASSWORD='password'
    MYSQL_DATABASE_DB='elle_database'   # 'elle2020' is the DB used in CHDR
    MYSQL_DATABASE_HOST='localhost'
    SECRET_KEY='ian'
    ```

    If you wish to change any of these values, make sure to reflect those changes in the subsequent steps.

5. Navigate to the `./templates` directory and install Node.js dependencies by running:

    ```bash
    npm install
    ```

6. Setup MySQL Database:

    - Using the `schema-no-triggers.sql`, set up a MySQL Database named `elle_database`. For the following steps, it is assumed you are running `mysqlserver` in a Linux (or WSL) environment. Using MySQL Workbench should work as well, however.
        - Login to MySQL as either the root user or a user with administrative privilege.
        - Create a MySQL user with all privileges on localhost named `elle` with password `password`. Below is the command to create such a user:
            ```sql
            CREATE USER 'elle'@'localhost' IDENTIFIED BY 'password';
            GRANT ALL PRIVILEGES ON elle_database.* TO 'elle'@'localhost';
            FLUSH PRIVILEGES;
            ```
        - Create a database called `elle_database`.
            ```sql
            CREATE DATABASE `elle_database`;
            ```
        - Exit MySQL and run the following command to import the table schema into the database, making sure you're in the same directory as the schema file:
            ```bash
            mysql -u elle -p elle_database < schema-no-triggers.sql
            ```

7. Once the database setup is complete, navigate back to the root directory.

8. Start the API by running the following command:

    ```bash
    python __init__.py
    ```

9. Start the website by running the following command from the `./templates` directory:

    ```bash
    npm run dev
    ```

10. If no issues occur when running the API and website, congratulations! You have successfully set up the [ELLE Website](http://localhost:3000/elle/home) and [API](http://localhost:5050/elleapi) on your local machine.

Note: The website is located on the `/elle/` subpath to replicate the [Production website](https://chdr.cs.ucf.edu/elle/home). Accessing the domain (at http://localhost:3000/) should redirect you to the homepage located at `/elle/home`.
