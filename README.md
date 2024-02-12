# ELLE 2023 Website & API

This repository contains both the backend API files and frontend React site files for the ELLE Fall 2022 - Spring 2023 Senior Design projects.

-   Old backend GitHub repo: https://github.com/kaarthikalagappan/ELLE-Backend-2020/tree/master
-   Old frontend GitHub repo: https://github.com/lint12/refinedELLEWebPortal/tree/master

The backend uses the Flask web framework and the Flask RESTful extension to make REST APIs in Python. The frontend is built using React and Bootstrap. The main database used is MySQL, with some endpoints using a Redis database to improve performance.

When "CHDR server" is mentioned, we're talking about the https://chdr.cs.ucf.edu server that the ELLE application is hosted on.

### Current State

**Production server:** The ELLE website is hosted at https://chdr.cs.ucf.edu/elle and the API is hosted at https://chdr.cs.ucf.edu/elleapi.

**Development server:** Future SD teams, create your own website and API development server by following [README-dev-server-setup.md](README-dev-server-setup.md).

## API

### Organization

-   `resources/`: API functions are defined under related files in this folder e.g. APIs related to terms are in the `terms.py` file under resources folder. Those functions are used in the `__init__.py` file to set up routing.
-   `.env`: All Python secrets are stored here in the root folder. Step 14 of [README-dev-server-setup.md](README-dev-server-setup.md) explains what goes into it.
-   `__init__.py`: Main/Starting function. All the APIs are imported there and are used to set up API endpoints.
-   `config.py`: Contains configuration variables used by the API
-   `utils.py`: Contains helper functions that are used by the API functions
    -   `app.db_utils.py`: Contains functions that interact with the database

### API Documentation

API documentation on Postman: https://documenter.getpostman.com/view/25426921/2s93JnT6RM

### Additional Services

-   The backend needs to be connected to an SMTP server (just an outgoing SMTP server is file) so that it can send out emails to the users (to reset password, to get the username, ...)
    -   The email APIs were tested with Postfix MTA
-   The backend uses a Redis database as an in-memory cache system to cache some information
    -   Once Redis is installed, install the Python Redis package (included in the requirements.txt file) and update the Redis config information in `config.py` so that the API can interact with the Redis database
-   The current backend implementation assumes that the website files are located under the `templates/build/` folder and redirects any calls to `/` endpoint to the `index.html` page located under the `build` folder

### Notes

-   It's not recommended to run the Flask app in debug mode using the built-in server in a production server. Consider using a different server such as WSGI to deploy the Flask app in a production server.

## Database

Terms, words and their translations along with other information:

-   Types:
    -   NN (Noun)
    -   VR (Verb)
    -   AJ (Adjective)+
    -   AV (Adverb)
    -   PH (Phrase)
-   Genders:
    -   MA (Male)
    -   FE (Female)
    -   NA (Nongendered)
-   Front/Back clarification
    -   Front is the word in the foreign language (prompt),
    -   Back is the word in the native language (answer)
    -   Types:
        -   MATCH (Base type, uses a term as the question prompt, only one answer)
        -   PHRASE (Identical to MATCH, but for whole phrases, only one answer)
        -   IMAGE (Select a word corresponding to an image, may have multiple answers)
        -   AUDIO (Select a word corresponding to audio, may have multiple answers)
        -   LONGFORM (Questions with a full text prompt, may have multiple answers)

## Website

### Organization

Since the front end was created using create-react-app, the file organization here is how a typical app created using it looks like.

```
templates/
├── node_modules/
├── public/
│   └── Unity-Game-WebGL-Builds/    # Unity game WebGL files go here in the respective folder!
│       ├── AnimELLE-Crossing/
│       ├── Card-Game/
│       ├── Maze-Game/
│       └── README.md
└── src/
    ├── Audio/                      # Audio used for website
    ├── components/                 # React components
    ├── Images/                     # Images used for website
    ├── lib/
    ├── pages/                      # React pages
    ├── stylesheets/
    ├── App.js                      # React router
    └── README.md                   # Previous group's website documentation
```

### Notes

-   Unity WebGL Games
    -   This website hosts the ELLE Card Game, ELLE Maze Game, and AnimELLE Crossing Game using their Unity WebGL builds. For versioning sake, the games are not included in this repository.
    -   Before hosting the game files on the website, see [this README](templates\public\Unity-Game-WebGL-Builds\README.md)
    -   If you want to put a Unity WebGL game on the website, it **must** be built using Unity 2020.3 (LTS) or higher! This is because the version of the react-unity-webgl package we are using only supports that Unity version
    -   When building the game for WebGL in Unity, click on `Player Settings...` in the build menu, then make sure that `Compression Format` is **disabled**.
        -   This is because the CHDR server is currently not setup to allow browsers to perform decompression natively while it downloads the build files.
        -   Info on where to find this setting: https://docs.unity3d.com/Manual/webgl-deploying.html

## Development

### Development Server Setup

See [README-dev-server-setup.md](README-dev-server-setup.md).

### Important config options

`__init__.py`

```python
# Change URL prefix of the API e.g. https://chdr.cs.ucf.edu/elleapi
API_ENDPOINT_PREFIX = '/elleapi/'

# Change port the API runs on
app.run(host='0.0.0.0', port='5050', debug=True)
```

`/templates/src/App.js`

```js
// Change API endpoint that React website uses
let flaskIP = "https://chdr.cs.ucf.edu/elleapi";
```

### Coding Conventions

#### SQL queries

-   SQL keywords in capital letters
-   Backticks around identifiers
-   Use `%s` in your query strings whenever possible as opposed to using f-strings. That avoids any chances of SQL injections

#### Functions

-   Use camelCase

#### Variables

-   Use underscore

#### Documentation within code

-   Use docstring as an overall summary of the API call
-   Otherwise use #

## CHDR Server

The UCF Center for Humanities and Digital Research server is currently hosting the ELLE website and API.

### CHDR Server specific edits done to files

`__init__.py`

```python
API_ENDPOINT_PREFIX = '/'
```

`/templates/src/App.js`

```diff
let flaskIP = 'https://chdr.cs.ucf.edu/elleapi';

-<Router>
+<Router basename='/elle/'>
```

`/templates/package.json`

```diff
   "devDependencies": {
     "json-loader": "^0.5.7"
   },
+  "homepage": "https://chdr.cs.ucf.edu/elle"
 }
```

More info about this here: https://create-react-app.dev/docs/deployment/#building-for-relative-paths.

## Archive

To view the previous README documentation we inherited, [go here](https://github.com/Naton-1/ELLE-2023-Website-API/blob/ed98a54c9578498f4b46f3f3914b4d690a834027/README.md).
