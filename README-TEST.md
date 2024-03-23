# ELLE Website and API Setup Guide

Welcome to the setup guide for the ELLE Website and API. Follow these instructions to set up a local instance of the ELLE Website and API on your machine.

## Prerequisites

-   Python 3.10 or higher installed on your system.
-   Node.js version 20 or above installed on your system.

## Installation Steps

1. Clone the repository to your local machine.

2. Navigate to the main directory of the cloned repository.

3. Install Python dependencies by running the following command:

    ```bash
    pip install -r requirements.txt
    ```

    Note: You might encounter issues installing `typed-ast`, which can usually be resolved by searching for solutions online.

4. Create a file named `.env` in the main directory with the following properties:

    ```
    MYSQL_DATABASE_USER='elle'
    MYSQL_DATABASE_PASSWORD='password'
    MYSQL_DATABASE_DB='elle_database'
    MYSQL_DATABASE_HOST='localhost'
    SECRET_KEY='ian'
    ```

    If you wish to change any of these values, make sure to reflect those changes in the subsequent steps.

5. Navigate to the `./templates` directory and install Node.js dependencies by running:

    ```bash
    npm install
    ```

6. Setup MySQL Database:

    - Using the provided SQL file, set up a MySQL Database named `elle_database`.
    - Import the SQL file into the database.
    - Create a MySQL user with all privileges on localhost named `elle` with password `password`. Below is the command to create such a user:
        ```sql
        CREATE USER 'elle'@'localhost' IDENTIFIED BY 'password';
        GRANT ALL PRIVILEGES ON elle_database.* TO 'elle'@'localhost';
        FLUSH PRIVILEGES;
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

10. If no issues occur during the setup process, congratulations! You have successfully set up the ELLE Website and API on your local machine.

## Modifying Virtuelle Mentor

-   The Virtuelle Mentor page component is located at `src/pages/games/virtuellementor`.
-   To run the Virtuelle Mentor game, provide all compiled game files in `./public/games/Card-Game`.
-   Ensure that the compiled game files are named as follows: `Build.wasm`, `Build.loader.js`, `Build.framework.js`, `Build.data`.

Feel free to reach out if you encounter any issues during the setup process. Enjoy using ELLE Website and API!
