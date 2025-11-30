# ELLE 2024 Website & API

This repository contains both the backend API files and frontend React site files for the EndLessLEarner team at the University Of Central Florida's Center for Humanities and Digital Research.

The backend uses the Flask web framework and the Flask RESTful extension to make REST APIs in Python. The frontend is built using React and Bootstrap and bundled with Webpack and Next.JS. The main database used is MySQL, with some endpoints using a Redis database to improve performance and other endpoints using a mailing server for sending emails.

When "CHDR server" or "Production" is mentioned, we're talking about the [CHDR server](https://chdr.cs.ucf.edu) (located at https://chdr.cs.ucf.edu) that the ELLE application is hosted on.

**To get started, check the [quick start guide](docs/quickstart.md)!**

**For access relating to the CHDR server AND documentations of previous ELLE projects, [See this Repo](https://github.com/UCF-ELLE/ELLE-Documentation) (requires access from Dr. Johnson)**

## Current State

**Production server:** The [ELLE website](https://chdr.cs.ucf.edu/elle/home) is hosted at https://chdr.cs.ucf.edu/elle and the [API](https://chdr.cs.ucf.edu/elleapi) is hosted at https://chdr.cs.ucf.edu/elleapi.

**Development server:** Future SD teams, create your own website and API development server by following [the dev server guide](docs/dev-server-setup.md).

**If you would like to improve upon the website, please check out [the todo list](docs/todo.md)!**

## Requirements

**Python Version**: >= 3.11
**Node Version**: >= v20.11.0

## API

### Organization

- `resources/`: API functions are defined under related files in this folder e.g. APIs related to terms are in the `terms.py` file under resources folder. Those functions are used in the `__init__.py` file to set up routing.
- `.env`: All Python secrets are stored here in the root folder. Step 14 of [the dev server guide](docs/dev-server-setup.md) explains what goes into it.
- `__init__.py`: Main file that starts the API. All the APIs are imported there as resources and are used to set up API endpoints.
- `config.py`: Contains configuration variables used by the API.
- `utils.py`: Contains helper functions that are used by the API functions.
- `db_utils.py`: Contains functions that interact with the database.
- `exceptions_util.py`: Contains functions that deal with exceptions within the API resources.

### API Documentation

API documentation on Postman: https://documenter.getpostman.com/view/25426921/2s93JnT6RM (To be updated)

### Additional Services

- The backend needs to be connected to an SMTP server (just an outgoing SMTP server is file) so that it can send out emails to the users (to reset password, to get the username, ...)
  - The email APIs were tested with Postfix MTA
- The backend uses a Redis database as an in-memory cache system to cache some information
  - Once Redis is installed, install the Python Redis package (included in the requirements.txt file) and update the Redis config information in `config.py` so that the API can interact with the Redis database
- The current backend implementation assumes that the website files are located under the `templates/build/` folder and redirects any calls to `/` endpoint to the `index.html` page located under the `build` folder

### Notes

- It's not recommended to run the Flask app in debug mode using the built-in server in a production server. Consider using a different server such as WSGI to deploy the Flask app in a production server. (As of Spring 2023, this reccommendation is currently not being followed.)

## Database

Terms, words and their translations along with other information:

- Types:
  - NN (Noun)
  - VR (Verb)
  - AJ (Adjective)+
  - AV (Adverb)
  - PH (Phrase)
- Genders:
  - MA (Male)
  - FE (Female)
  - NA (Nongendered)
- Front/Back clarification
  - Front is the word in the foreign language (prompt),
  - Back is the word in the native language (answer)
  - Types:
    - MATCH (Base type, uses a term as the question prompt, only one answer)
    - PHRASE (Identical to MATCH, but for whole phrases, only one answer)
    - IMAGE (Select a word corresponding to an image, may have multiple answers)
    - AUDIO (Select a word corresponding to audio, may have multiple answers)
    - LONGFORM (Questions with a full text prompt, may have multiple answers)

## Website

### Organization

Since the front end was created using nextjs, the file organization here is how a typical app created using it looks like.

```
templates/
├── .next/    # Contains the build files that are created when the build command is read and are read by production/development servers
├── app/    # Contains layouts for the pages and various global settings for TypeScript to use. Currently only has one and might not be the best implementation
├── components/    # Contains all of the React components used within the website. Some directories might be a bit messier than others.
├── hooks/    # Contains a couple of custom hooks for authentication and Pasta Kerfuff-ELLE related data (Should be added to! See `usePasta()` for an implementation)
├── lib/    # Library files for some of the (likely outdated) libraries we use. Bootstrap was recently updated to v5 as of Spring 2024.
├── node_modules/
├── pages/    # Contains the page files for the Next.JS server to identify and host on an identically-named path. ('home.tsx' -> 'http://localhost:3000/elle/home')
├── public/
│    ├── games/    # Unity game WebGL files go here in the respective folder!
│    │    ├── AnimELLE-Crossing/
│    │    ├── Card-Game/
│    │    ├── Maze-Game/
│    │    ├── Pasta-Game/
│    │    └── README.md
│    └── static/    # Contains static files (images, css, json, etc.) for the application. While games are technically static, they are not included here.
├── services/    # Contains services that replace the need for long axios calls in components. Used primarily by the custom hooks above (Should be added to!)
├── types/    # Contains type definitions for the api and database. Any type definitions should be included here.
├── middleware.ts    # This file intercepts page navigations and or api calls to run code prior to their execution. Mostly used for redirects.
└── next.config.js    # The main configuration file for Next.JS. Contains Webpack configuration rules and redirect/rewrite rules.
```

### Notes

- Unity WebGL Games
  - This website hosts VirtuELLE Mentor, The ELLE MAZEing Race, AnimELLE Crossing, and Pasta Kerfuff-ELLE using their Unity WebGL builds. For versioning sake, the games are not included in this repository.
    - [VirtuELLE Mentor repository](https://github.com/UCF-ELLE/Card-Game)
    - [AnimELLE Crossing repository](https://github.com/UCF-ELLE/AnimELLECrossing)
    - [Pasta Kerfuff-ELLE repository](https://github.com/UCF-ELLE/Pasta-Kerfuff-ELLE)
  - Before hosting the game files on the website, see [this README](templates/public/games/README.md)
  - If you want to put a Unity WebGL game on the website, it **must** be built using Unity 2020.3 or higher! This is because the version of the react-unity-webgl package we are using only supports that Unity version
    - It is suggested to be using the [latest Unity LTS version](https://unity.com/releases/editor/qa/lts-releases).
  - When building the game for WebGL in Unity, click on `Player Settings...` in the build menu, then make sure that `Compression Format` is **disabled**.
    - This is because the CHDR server is currently not setup to allow browsers to perform decompression natively while it downloads the build files.
    - [Info on finding and using this setting](https://docs.unity3d.com/Manual/webgl-deploying.html)

## Development

### Development Server Setup

See the [dev server setup guide](docs/dev-server-setup.md).

### Important API config options

`__init__.py`

```python
# Change URL prefix of the API e.g. https://chdr.cs.ucf.edu/elleapi
API_ENDPOINT_PREFIX = '/elleapi/'

# Change port the API runs on
app.run(host='0.0.0.0', port='5050', debug=True)
```

### Coding Conventions

#### SQL queries

- SQL keywords in capital letters
- Backticks around identifiers
- Use `%s` in your query strings whenever possible as opposed to using f-strings. That avoids any chances of SQL injections

#### Functions

- Use camelCase

#### Variables

- Use underscore

#### Documentation within code

- Use docstring as an overall summary of the API call
- Otherwise use #

## CHDR Server

The UCF Center for Humanities and Digital Research server is currently hosting the ELLE website and API.

### CHDR Server specific edits done to files

`__init__.py`

```diff
# The website redirects the API to be located at /elleapi/, so we need to change the endpoint prefix.
- API_ENDPOINT_PREFIX = '/elleapi/'
+ API_ENDPOINT_PREFIX = '/'
```

`/templates/package.json`

```diff
    "scripts": {
        "dev": "next dev",
        "build": "next build",
	// A service is already using the port 3000 in production, so we need to use 3001.
-       "start": "next start",
+       "start": "PORT=3001 next start",
        "lint": "next lint"
    },

```

## Archive

To view the previous README documentation we inherited, [go here](https://github.com/Naton-1/ELLE-2023-Website-API/blob/ed98a54c9578498f4b46f3f3914b4d690a834027/README.md).
