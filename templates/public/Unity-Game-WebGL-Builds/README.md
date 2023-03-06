This website hosts the ELLE Card Game, ELLE Maze Game, and AnimELLE Crossing Game using their Unity WebGL builds. For versioning sake, the games are not included in this repository. You must find them and put them in their respective folders here (e.g. put Maze Game build files in folder named "Maze Game").

You can ignore the `.gitkeep` files present in the folders here. They're there so that I could add empty folders to the repository.

### Important
The CardGame.js and MazeGame.js pages rely on the Unity build files being named "Build" e.g. `Build.loader.js`. To see what I mean, refer to the paths used by `const unityContext = new UnityContext({` in CardGame.js and MazeGame.js.

If your Unity WebGL build doesn't produce 4 files like this, your game will NOT run on the website. You need these 4 files in order to host it on the React site:
```
Build.data
Build.framework.js
Build.loader.js
Build.wasm
```