Note: This folder contains **HACKY** solutions for overcoming the fact that `router.events` was removed in Next.JS v13.

Blocking navigation is currently "being investigated" as per [this comment](https://github.com/vercel/next.js/discussions/41934#discussioncomment-8996669) in a reasonably cranky Github discussion chain.

If Vercel figures out and releases a solution, PLEASE use that over this. This folder just contains "Current Solutions" as per the comment linked above.

-   Official Comment
    > "For blocking the navigations, we’re going to investigate if there is a built-in approach that works for most use-cases. For example, you don’t want to prevent all React Transitions, because that means you can’t submit the form anymore (as that is a React Transition, too)."

I do not like this, but to properly get the page unload logic working on the games pages, this is necessary.

-   Zander
