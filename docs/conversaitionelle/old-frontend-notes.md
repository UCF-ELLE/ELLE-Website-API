# ConversAItionELLE Frontend Documentation

# THIS IS DEPRECATED AND IS THE ORIGINAL CONVERSAITIONELLE's DOCUMENTATION 
See [THIS](../../templates/components/ProfessorConsole/README.md) for up to date frontend documentation from part 2 team
---




## Quick tour of app
ConversAItionELLE's frontend is located in the [templates folder](../../../templates), where we store our [home page](../../../templates/pages/games/talkwithtito.tsx) and our [components](../../../templates/components/TalkWithTito). Currently, the only two accounts that have access to the TalkWithTito game are the master account (ucf2) and our demo account (pleasedEagle1) which can be seen by their userIDs in the home page on lines 98 and 113. To open the game to all users, remove the surrounding `if` statements from both of the `setIsloading` function calls. For more clarity, the updated code for lines 92 through 117 are typed below:

```
const handleTransition = () => {
    // Tito fade in and out
    setIsFading(true);

    //Tito pop in
    setTimeout(() => {
      setIsLoading(!isLoading);
      setIsFading(false); // Restore opacity
    }, 700);

  };

  useEffect(() => {
    if (!userLoading && user) {
      const loadModules = async () => {
        const modules = await fetchModules(user?.jwt);
        setModules(modules);
      };
      loadModules();
      setIsLoading(false);
    }
  }, [user, userLoading]);
```

## How to run frontend locally
You can run the ELLE games app using the instructions in the [quickstart documentation](../../../docs/quickstart.md) (specifically the instructions located near the end).

## How to update frontend on the server[^1]
Commit frontend changes to this github and follow the instructions listed in [this document](https://github.com/UCF-ELLE/ELLE-Documentation/blob/main/docs/guides.md) [^2]


[^1]: requires you to have access to the CHDR server
[^2]: must be an Owner of this GitHub repo to view the document
