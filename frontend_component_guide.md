Frontend Component Guide

## 1. `VocabList.tsx`

### What it does

Shows the vocabulary list for the current module. It displays each word, its mastery stars, and the user's overall progress.

### Main features

- Shows the main word first and the translation when the user hovers over it.
- Gives each word 0–3 stars using `usageCounts`.
- Marks a word as mastered when its usage count reaches 3.
- Moves mastered words to the bottom of the list.
- Lets the user open or close the vocabulary panel.
- Shows progress with a horizontal progress bar.
- Shows a hint button for words that are not mastered.
- Includes an optional reset button.
- Contains an older circular progress bar that is commented out.

### Props

| Prop | Type | What it is used for |
|---|---|---|
| `wordsFront` / `wordsBack` | `string[]` | Matching word and translation lists. The items at the same index belong together. |
| `usageCounts` | `number[]` | Stores how many times each word was used correctly. |
| `progress` | `number` | Progress percentage from 0 to 100. |
| `termIDs` | `number[]` | IDs for the vocabulary words. The component returns `null` if these are missing. |
| `masteredTermIDs` | `number[]?` | Passed into the component, but currently not used for mastery. |
| `onHintClick` | `(word: string) => void` | Runs when the user clicks the hint button. |
| `onReset` | `() => void` | Runs when the user clicks **Reset List**. |

### Developer notes

- Be careful with `wordFront` and `wordBack`. They may look backwards because one is shown normally and the other appears on hover. Check the JSX before renaming them.
- The old `used` boolean was replaced with `usageCounts`. If you still see `used` in another file or API response, check that it works with the new count system.
- `masteredTermIDs` is passed in and changed into a `Set`, but the component does not use it anymore. Check whether the backend still needs it before removing it.
- The old circular progress bar is still commented out in this file. It can be reused if a future group wants that design again.
- Make sure `wordsFront`, `wordsBack`, `usageCounts`, and `termIDs` stay in the same order. A mismatch can connect the wrong word, count, or ID.

### Connected files

- A hint click may add a new message to `Messages.tsx` through the parent page.
- The selected module usually decides which words and progress are passed into this component.
- `VocabList.tsx` and `Messages.tsx` both use `Arrow.png` for opening and closing sections.

---




## 2. `ModuleButton.tsx`

### What it does

Shows one module button in the module list or sidebar.

This component only handles the button's appearance and click action. The parent component stores the selected module and the module data.

### Main features

- Changes the background when the button is hovered over or selected.
- Rotates the arrow when the module is selected.
- Shortens long module names so they do not break the layout.

### Props

| Prop | Type | What it is used for |
|---|---|---|
| `moduleName` | `String` | The module name shown on the button. |
| `onClick` | `() => void` | Runs when the button is clicked. |
| `isSelected` | `boolean` | Controls the selected style and arrow direction. |

### Developer notes

- `moduleName` uses `String` with a capital **S**. It should normally be `string` with a lowercase **s**. This can be safely cleaned up later.
- Keep the selected module state in the parent component. Do not add separate selected state inside every `ModuleButton`.
- The parent should compare module IDs and pass the correct `isSelected` value to each button.
- If more than one module looks selected, check the parent's selection logic first.

### Connected files

Selecting a module usually changes the data shown in:

- `VocabList.tsx`
- `Messages.tsx`
- `AnalyticsMenu.tsx`

If the wrong module data appears, check that the parent is passing the same selected module ID to all of these components.

---




## 3. `Settings.tsx`

### What it does

Shows a settings popup for music and chat font options.

### Main features

- Lets the user choose songs from a list of 10 songs.
- Lets the user add or remove songs using checkboxes.
- Includes a **Shuffle All** option.
- Lets Tito choose the music using the AI Music option.
- Lets the user select a chat font size.
- Saves playlist and font changes when the user presses **Apply**.
- Keeps its local values updated when parent values change.
- Contains a commented-out text-to-speech mute feature.

### Props

| Prop | Type | What it is used for |
|---|---|---|
| `onSetPlaylist` | `(song: Song[]) => void` | Sends the selected playlist to the parent. |
| `apply` | `() => void` | Closes the settings popup. |
| `onSetFont` | `(chatFont: string) => void` | Sends the selected font setting to the parent. |
| `onSetAIChoice` | `(AIChoice: boolean) => void` | Updates the AI Music setting. |
| `titoMusicChoice` | `boolean` | Current AI Music setting from the parent. |
| `parentPlaylist` | `Song[]` | Current saved playlist from the parent. |
| `parentFont` | `string` | Current saved font setting from the parent. |

### Developer notes

- Playlist and font changes are not saved until the user presses **Apply**.
- The AI Music option updates as soon as the user clicks it. It does not wait for **Apply**.
- If you add more settings, decide whether each one should save right away or wait for **Apply**. Try to keep the behavior clear for users.
- Pressing the **x** closes the popup without saving playlist or font changes. Check that this is still the behavior your group wants.
- **Shuffle All** replaces the current playlist with all songs in a random order. It does not only shuffle the songs the user already selected.
- The song list is hardcoded in this file. Move it to a config file or the backend if songs need to be changed often.
- The text-to-speech mute code is commented out. Before deleting it, check whether your group plans to finish that feature.
- The prop named `apply` is really being used to close the popup. Renaming it to something like `onClose` could make the code easier to understand.

### Connected files

- The selected font should be passed from the parent into `Messages.tsx`.
- Music playback is controlled somewhere outside this component using the playlist and AI Music values.
- Re-enabling the mute feature will also require changes in the parent component that renders `Settings`.

---




## 4. `Messages.tsx`

### What it does

Shows the conversation between the user and Tito.

It also shows language feedback such as score, correction, error, and explanation when that information is included with a user message.

### Main features

- Uses `Messages` for the full chat list and `Message` for one message bubble.
- Uses different styles for user messages and Tito messages.
- Lets the user open a feedback section under their message.
- Changes the feedback background based on the score.
- Scrolls to the newest message automatically.
- Shows three bouncing dots while Tito is creating a reply.
- Uses the selected chat font size.
- Shows timestamps using the user's local date and time format.

### Props

#### `Messages`

| Prop | Type | What it is used for |
|---|---|---|
| `messages` | `ChatMessage[]` | All chat messages in order. |
| `chatFontSize` | `string` | Font size used inside each message bubble. |
| `isThinking` | `boolean?` | Shows or hides the typing dots. |

#### `ChatMessage`

```ts
{
  value: string;
  timestamp: string;
  source: "user" | "llm";
  metadata?: {
    score?: number;
    error?: string;
    correction?: string;
    explanation?: string;
  };
}
```

### Developer notes

- Feedback is only shown for user messages. This is intentional because the feedback is Tito's review of what the user wrote.
- If a future feature needs feedback on Tito's messages, update the `hasMetadata && fromUser` check.
- The chat automatically scrolls when the number of messages changes or when `isThinking` changes.
- Editing an existing message will not trigger scrolling because the message count stays the same.
- `chatFontSize` is used directly as a CSS font size. Make sure the parent sends a real CSS value such as `16px`, not only a label such as `medium`.
- If font changes do not work, check how the value moves from `Settings.tsx`, through the parent, and into this component.
- Score colors are controlled by `scoreToRGBA()`. Update that function if the score ranges or colors need to change.

### Connected files

- `Settings.tsx` controls the font value used here.
- A hint from `VocabList.tsx` may be added to the messages list by the parent component.
- `VocabList.tsx` and `Messages.tsx` both use `Arrow.png`.

---




## 5. `AnalyticsMenu.tsx`

### What it does

Shows session information and lets the user export chat or audio files.

### Main features

- Shows time spent, terms used, and average score.
- Hides terms used and average score during free-talk sessions.
- Lets the user export the chat as a CSV file.
- Lets the user export module audio as an MP3 file.
- Checks that the user and needed IDs are available before showing active export buttons.
- Prints export errors in the browser console instead of crashing the page.
- Uses `classId = 1` when no class ID is passed in.

### Props

| Prop | Type | What it is used for |
|---|---|---|
| `timeSpent` | `string` | Time value that is already formatted for display. |
| `termScore` | `string` | Terms-used value that is already formatted for display. |
| `averageScore` | `number` | Average score, shown with two decimal places. |
| `chatbotId` | `number?` | Used when exporting the chat. |
| `moduleId` | `number?` | Used when exporting module audio. |
| `classId` | `number?` | Used when exporting audio. Defaults to `1`. |
| `isFreeTalk` | `boolean` | Decides whether term and score information should be shown. |
| `onClose` | `() => void` | Closes the analytics popup. |

### Developer notes

- `classId` defaults to `1` if nothing is passed in. This worked for our project, but it may export the wrong data if the app supports multiple classes. Removing the default and disabling the button may be safer.
- The audio export downloads all audio for the module, not only the current chat session.
- Export errors are only printed in the browser console. If an export stops working, check the console first.
- It would be helpful to show the user a popup, toast, or message when an export fails.
- `timeSpent` and `termScore` arrive as formatted strings, but `averageScore` arrives as a number. Remember this difference when passing the props from the parent.
- The export buttons show **Loading...** when the user or needed ID is missing. This can also mean that a required prop was never passed in, so check the parent if the loading text never goes away.

### Connected files

- `chatbotId`, `moduleId`, and `classId` should match the module selected through `ModuleButton.tsx`.
- If analytics or exports use the wrong module, check the IDs passed down by the parent page.

---




## 6. `TitoCloudBubble.tsx`

### What it does

Shows a temporary cloud-shaped message above Tito.

When `trigger` changes to a true value, the cloud appears, shows the text from `message`, and disappears after 8 seconds.

### Main features

- Uses the same cloud image as the vocabulary section.
- Shows any text passed through the `message` prop.
- Appears when `trigger` becomes active.
- Fades in and out using opacity classes.
- Automatically hides after 8 seconds.
- Includes three small circles that act as the cloud's thought-bubble tail.

### Props

| Prop | Type | What it is used for |
|---|---|---|
| `message` | `string` | Text shown inside the cloud. |
| `trigger` | `any` | Makes the cloud appear when its value changes and is true. |

### Developer notes

- We disabled this component because it covered too much of the chat area.
- The cloud stayed visible for 8 seconds, which felt too long when users were trying to read or continue the chat.
- If your group brings it back, try a shorter timer, a smaller cloud, or a location that does not block messages.
- The timer is set with `8000`, which means 8,000 milliseconds or 8 seconds.
- Even when its opacity is `0`, the cloud can still sit over the chat and block clicks. Consider returning `null` when it is hidden or adding `pointer-events-none`.
- `trigger` currently uses the type `any`. Change it to a clearer type such as `boolean`, `number`, or `string`, depending on how the parent uses it.
- The position uses fixed percentage values such as `bottom-[90%]` and `left-[10%]`. Test it on different screen sizes before enabling it again.
- The classes `translate-x--6` and `translate-x--10` may not be valid Tailwind classes. If the tail circles are in the wrong place, check these classes first.

### Connected files

- The parent chat page controls the `message` and `trigger` values.
- The component uses the same `vocab cloud.png` image as the vocabulary design.
- It was meant to appear near Tito, so its position depends on the layout used in `ChatScreen.tsx`.

---




## 7. `UserBackground.tsx`

### What it does

Loads a user's selected background image and shows the username over the image.

The image file is loaded from the `UserBackgrounds` folder using the filename passed through `backgroundFilepath`.

### Main features

- Loads a background image when `backgroundFilepath` changes.
- Does not load an image when the filepath is empty.
- Displays the username in the center of the background.
- Shows `<username>` when no username is passed in.
- Prints the loaded background image value in the browser console.

### Props

| Prop | Type | What it is used for |
|---|---|---|
| `username` | `string?` | Name shown in the middle of the background. |
| `backgroundFilepath` | `string` | Filename of the image inside the `UserBackgrounds` folder. |

### Developer notes

- The file is named `UserBackground.tsx`, but the exported function is named `Settings`. This is confusing and should be renamed to `UserBackground` when it is safe to do so.
- The component loads the image with a dynamic `import()`. If the image does not appear, check whether the imported value needs `.default` before being passed to the Next.js `Image` component.
- There is no `try/catch` around the image import. A missing or incorrect filename may cause an error. Adding a fallback image or error message would make this safer.
- The second `useEffect` only prints the image value to the console. It can be removed when debugging is finished.
- The username is centered with absolute positioning. Make sure it stays readable on light and dark background images.
- The `Image` component currently has an empty `className`. Add sizing classes if backgrounds appear at different sizes or affect the layout.
- Consider using a clearer interface name such as `UserBackgroundProps` instead of `propsInterface`.

### Connected files

- The parent component passes the selected background filename and username.
- The image must exist inside `@/public/static/images/ConversAItionELLE/UserBackgrounds/`.
- This component is likely placed as part of the main layout that is controlled by `ChatScreen.tsx`.

---

---

## 8. `ChatScreen.tsx`

### What it does

Acts as the main parent component for the Talking with Tito chat experience. 

This file connects the chat messages, vocabulary lists, settings menu, analytics menu, selected module data, and backend API calls. Most of the smaller frontend components handle one specific part of the page, but `ChatScreen.tsx` is where those pieces are brought together into the full student chat screen.

### Main features

- Stores and updates the current chat messages.
- Sends the user's typed message to the backend.
- Receives Tito's response and adds it to the chat.
- Shows a thinking/loading state while Tito is generating a response.
- Loads vocabulary terms for the selected module.
- Tracks vocabulary usage counts and module progress.
- Passes vocabulary data into `VocabList.tsx`.
- Passes chat messages and font size into `Messages.tsx`.
- Opens and closes the settings popup.
- Opens and closes the analytics popup.
- Passes playlist, font, and AI music settings between the settings menu and the parent state.
- Passes module, class, and chatbot IDs into analytics/export features.
- Handles hint clicks from the vocabulary list by adding the hint into the chat flow.
- Controls the main responsive layout of the chat page.
- Contains older lore-related logic that was disabled after sponsor feedback.

### Important state

| State | What it is used for |
|---|---|
| `messages` | Stores the current conversation shown in `Messages.tsx`. |
| `isThinking` | Shows the typing/loading dots while Tito is creating a response. |
| `wordsFront` / `wordsBack` | Stores the vocabulary words and translations for the selected module. |
| `usageCounts` | Tracks how many times each vocabulary word has been used correctly. |
| `progress` | Stores the current vocabulary/module progress percentage. |
| `termIDs` | Stores the backend IDs for each vocabulary term. |
| `chatFontSize` | Stores the selected font size from `Settings.tsx`. |
| `playlist` | Stores the selected music playlist from `Settings.tsx`. |
| `titoMusicChoice` | Tracks whether the AI Music option is turned on. |
| `showSettings` | Controls whether the settings popup is visible. |
| `showAnalytics` | Controls whether the analytics popup is visible. |
| `chatbotId` | Used to connect the current chat session to backend/export features. |
| `moduleId` | Used to load the correct module terms, progress, audio, and analytics. |
| `classId` | Used for class-specific module or export data. |

### Backend connections

`ChatScreen.tsx` is one of the main frontend files that communicates with the backend.

It may call endpoints related to:

- loading previous messages
- sending a new message
- receiving Tito's response
- loading module vocabulary terms
- updating vocabulary progress
- tracking time spent in the session
- uploading or connecting audio
- exporting chat or audio data through analytics-related props

Because this component depends on several backend values, many bugs in this file come from missing, outdated, or mismatched IDs.

### Developer notes

- This file is the best place to start when debugging wrong data on the chat page because it passes information into most of the child components.
- Be careful when changing the message flow. The user message, Tito response, feedback metadata, vocabulary progress, and loading state are all connected.
- `isThinking` should be turned on before waiting for Tito's response and turned off after the response finishes or fails.
- If the chat stops scrolling or messages do not appear, check both `ChatScreen.tsx` and `Messages.tsx`.
- If vocabulary progress looks wrong, check that `wordsFront`, `wordsBack`, `usageCounts`, and `termIDs` are being updated together and passed into `VocabList.tsx` in the same order.
- If analytics exports the wrong data, check that the selected `moduleId`, `chatbotId`, and `classId` are the same values being passed into `AnalyticsMenu.tsx`.
- If font settings do not update, check the path from `Settings.tsx` to `ChatScreen.tsx` to `Messages.tsx`.
- This file used to control lore bubble behavior through `TitoCloudBubble.tsx`. That feature was disabled because the sponsor felt lore was distracting from the learning experience.
- Avoid adding too much visual styling directly into this file unless it is part of the main layout. Smaller UI details should stay inside the child component when possible.
- Since this file is already doing a lot, future groups may want to split some logic into helper functions or custom hooks.

### Connected files

`ChatScreen.tsx` connects most of the Talking with Tito frontend components, including:

- `Messages.tsx`
- `VocabList.tsx`
- `Settings.tsx`
- `AnalyticsMenu.tsx`
- `ModuleButton.tsx`
- `TitoCloudBubble.tsx`
- `UserBackground.tsx`

It is also connected to backend API logic for chat messages, module terms, vocabulary progress, session tracking, and export-related data.

If a child component looks correct by itself but shows the wrong information on the page, check how `ChatScreen.tsx` is passing props into it.

---

## Quick notes for future groups

### Parent component

The parent page is the main connection between these files. In this project, that role is handled by `ChatScreen.tsx`, which stores shared data and passes it into the smaller UI components.

The parent stores shared data such as:

- selected module
- message list
- vocabulary progress
- font setting
- playlist setting
- module and class IDs

When the wrong information appears, the parent component is usually the first place to check.

### Shared UI patterns

- `Settings.tsx` and `AnalyticsMenu.tsx` use a similar full-screen popup layout.
- `VocabList.tsx` and `Messages.tsx` both use `Arrow.png` for open and close actions.
- New components should follow these patterns when possible so the page stays consistent.

### Settings behavior

`Settings.tsx` uses two different save styles:

- Playlist and font wait for **Apply**.
- AI Music saves immediately.

Keep this in mind before adding more settings.

### IDs

The project depends on several IDs:

- `moduleId`
- `chatbotId`
- `classId`
- `termIDs`

Many wrong-data problems happen because one of these IDs is missing, old, or does not match the selected module.

---

## Possible future frontend improvements

- Split some of the larger `ChatScreen.tsx` logic into helper functions or custom hooks, especially for message sending, vocabulary loading, settings handling, and backend API calls.
- Improve export error handling by showing a user-facing message or toast when chat or audio exports fail instead of only printing errors in the browser console.
- Improve audio and narration controls so users can more clearly enable, disable, or adjust Tito's speech features. 
- Standardize naming and types across components, such as changing `String` to `string`, renaming unclear props like `apply`, and replacing `any` types with more specific types.
- Keep testing the responsive layout on mobile, tablet, and desktop screen sizes so future UI changes do not reintroduce spacing or overlap issues.
- Improve the timestamp display where the date is shown once as a separator and individual message times appear beneath or near each message.
