# ELLE Backend 2020
This repository contains backend API files for ELLE 2020 (3rd) version.

This backend uses the Flask web framework and the Flask RESTful extension to make REST APIs in Python.
<br />

### Setup
Can run the command `bash setup.sh` to setup the backend faster
* **User should setup the MYSQL database before running the file and have the credentials at hand**
* After deploying this this repo, give the user read, write, and execute permissions
* The user should be able to edit the `/etc/environment` file
* If needed, run the command `python3 __init__.py` to start the Flask framework in debug mode

Or the following steps can be used to manually setup the backend on your local machine or a new server:
* Clone this repo
    * `git clone https://github.com/kaarthikalagappan/ELLE-Backend-2020.git`
* Install all the dependencies listed in the requirements.txt file by running the command `pip install -r requirements.txt` (run in virtual environment if required)
    * ```cd ELLE-Backend-2020 & pip install -r requirements.txt #CD into the download repo and install all dependcies```
* Setup a SQL server (this was originally developed on a MySQL database) and use the `schema.sql` file to create the required tables and fields
* Change the database configuration values in the `config.py` file to reflect the newly create database information
* Start the Flask framework by running `python3 __init__.py`
    * This starts Flask on debug mode and binded to port 5000

Note I: It isn't recommended to run the Flask app in debug mode using the built-in server in a production server. Consider using a different server such as WSGI to deploy the Flask app in a production server.

Note II: Avoid testing APIs on the production server. Host the database and API on a different server and test the APIs there.

## API Documentation
You can find the documentation for all available APIs here: https://documenter.getpostman.com/view/11718453/Szzhdy4c
### Organization
* The `__init__.py` is similar to the main or starting function. All the APIs are imported there and are used to set up API endpoints.
* The API functions are defined under related files under the resources folder (APIs related to terms are in the `terms.py` file under resources folder). Those functions are used in the `__init__.py` file to set up routing
* The `utils.py` file contains helper functions that are used by the API functions
    * The `db_utils.py` file contains functions that interact with the database
* The current backend implementation assumes that the website files are located under the `templates/build/` folder and redirects any calls to `/` endpoint to the `index.html` page located under the `build` folder
### Additional Services
* The backend needs to be connected to an SMTP server (just an outgoing SMTP server is file) so that it can send out emails to the users (to reset password, to get the username, ...)
    * The APIs were tested with Postfix MTA
* The backend uses the Redis database as an in-memory cache system to cache some information
    * The APIs will still work without Redis installed, but it recommended to install Redis on the server where the backend is deployed for a better experience
    * One redis is installed, install the Python redis package (included in the requirements.txt file) and update the Redis config information in the `config.py` file so that the API can interact with the redis database
* The backend was tested with Nginx reverse proxy to host the API and website files under the same port

### Coding Conventions
#### SQL queries
* SQL keywords in capital letters
* Backticks around identifiers
* Use `%s` in your query strings whenever possible as opposed to using f-strings. That avoids any chances of SQL injections
#### Functions
* Use camelCase
#### Variables
* Use underscore
#### Documentation within code
* Use docstring as an overall summary of the API call
* Otherwise use #
