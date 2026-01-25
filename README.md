# FlickWatch - Movie Discovery and Watchlist App

FlickWatch is a mobile app built with Expo and React Native using the TMDB API. Users can browse movies and TV shows, search for titles, view details, and save items to a watchlist.



## Screenshots


### App Screens
- Home Screen:

<img width="1008" height="2244" alt="Screenshot_20260124-152418" src="https://github.com/user-attachments/assets/5df8e524-0cf0-4e71-8504-e90cbca17ee5" />



- Search Screen:

<img width="1008" height="2244" alt="Screenshot_20260124-152445" src="https://github.com/user-attachments/assets/9f0248c0-b132-4523-8362-a4f1a2d39af3" />



- Detail Screen:

<img width="1008" height="2244" alt="Screenshot_20260124-152525" src="https://github.com/user-attachments/assets/ba1a0de5-d645-42d8-a909-569518630766" />

- Watchlist Screen:
  
<img width="1008" height="2244" alt="Screenshot_20260124-152555" src="https://github.com/user-attachments/assets/6f2cfabf-1c28-4743-b259-6e642d353277" />

  

### Video Demo
- Demo Link: https://drive.google.com/file/d/13ms-sw0RvPXZkNeasBt-k8CJd_v9ArHs/view?usp=sharing

---

## Features

### 1. Navigation
- Bottom tabs with three sections: Home, Search, and Watchlist
- Stack navigation to view detail screens

### 2. Home Screen
- Shows popular movies using /movie/popular
- Displays trending content from /trending/all/week
- Lists top rated TV shows from /tv/top_rated
- Has loading and error states with retry option
- Click on any item to see details

### 3. Search Screen
- Search input with 500ms delay for better performance
- Uses /search/multi endpoint
- Shows results in grid with poster, title and type
- Handles empty results, loading and errors
- Manual page navigation with Previous/Next buttons

### 4. Detail Screen
- Shows poster and backdrop images
- Displays title, overview, rating, release date, genres and runtime
- Button to add or remove from watchlist
- Shows top 5-6 cast members with photos

### 5. Watchlist Screen
- Lists all saved movies and TV shows
- Each item has a remove button with confirmation
- Shows empty state when no items saved
- Data saved using AsyncStorage

### 6. State Management
- Uses Zustand for watchlist state
- No need to pass data through multiple components
- Automatically saves changes
- Loads saved data when app starts

---

## Technology Used

- Expo and React Native
- React Navigation for tabs and screens
- Axios for API calls
- Zustand for state management
- AsyncStorage for data persistence
- TypeScript



## API Key Setup

The TMDB API key is loaded from environment variable and not hardcoded in the code.

Create a .env file with:

EXPO_PUBLIC_TMDB_API_KEY=YOUR_TMDB_KEY

----------------------------------------------------------
The app reads it using:

process.env.EXPO_PUBLIC_TMDB_API_KEY

---------------------------------------------------------


## Installation and Running

### Install Dependencies

npm install

### Start the App

npx expo start


## How It Works

1. User opens the app and sees popular movies and TV shows on home screen
2. User can search for specific titles using the search screen
3. Clicking on any item shows full details including cast
4. User can add items to watchlist which saves locally
5. Watchlist screen shows all saved items
6. Data persists even after closing the app


## State Management Choice (Why Zustand)

I used Zustand instead of Context API or Redux Toolkit because:

1. Minimal boilerplate: no reducers/actions setup required (faster, cleaner code).
2. Global store without prop drilling: any screen can read/write watchlist directly.
3. Selective subscriptions: screens can subscribe only to needed store slices to reduce rerenders.
4. Easy persistence control: manual AsyncStorage save/load is straightforward and predictable.



## AI Usage Reflection
Top prompts used

1. help me create a zustand watchlist store using asyncstorage so items stay saved even after closing and reopening the app. include add/remove/toggle and hydrate

2. in detail screen, i want an add/remove watchlist button that updates zustand store and shows a small toast feedback (added/removed). implement without breaking existing ui

3. in my detail screen, when content is short the bottom spacing becomes too large and doesn’t adjust. fix the layout so it looks consistent regardless of content height

4. replace infinite scroll pagination with a pager bar (prev/next + page numbers). clicking a page should request that page from tmdb and update results.

5. write 2–3 simple jest + react testing library tests for my watchlist- store add/remove/toggle + hydrate from asyncstorage, and one screen test for removing via modal confirm



## What the AI output got right

* Created a Zustand watchlist store with AsyncStorage persistence so items stay saved after the app closes (hydrate + add/remove/toggle).
* Helped connect the Detail screen button to the store (Add/Remove) and added a simple toast message for user feedback.
* Fixed the pagination flow by adding a pager bar (Prev/Next + page numbers) and making page clicks fetch the correct TMDB page.
* Provided basic Jest tests for watchlist logic (add/remove/toggle + hydrate) and a simple screen test for removing an item via modal confirm.

## What the AI output got wrong / needed changes

* Some testing setup didn’t work immediately because Expo/React Native modules caused Jest config + mocking issues, so extra mocks/config updates were required.
* A few pagination parts needed small fixes so the selected page number actually updates results (not repeating page 1).
* Some UI edge cases needed manual tweaks (like hiding the pager when only one page exists and keeping the pager layout from overflowing).


## Manual improvements / edge cases I handled

* double-checked page button click really loads the selected TMDB page (not repeating page 1).

* hid the pagination bar when there is only one page of results.

* fixed the pager layout so numbers don’t break the UI by making them scroll horizontally.

* adjusted the Detail screen spacing so the bottom space looks normal even when content is short.

* updated Jest setup with extra mocks so tests run without Expo/React Native module errors.

* confirmed watchlist data stays saved after closing and reopening the app using AsyncStorage hydration.
