# Slime Schedule

A Tensura (That Time I Got Reincarnated as a Slime) inspired scheduling app. Add tasks as "quests," pick a threat rank, and get a browser notification plus an in-page toast the moment a reminder is due.

## Features

- Interactive squishy blob mascot: elastic morph, cursor-follow eyes, random blinking, and a little jump when you poke it
- Cursor trail of mini slime droplets while the mouse moves
- Scroll-triggered staggered reveals on every section
- Magnetic buttons that pull toward the cursor
- Ambient floating jelly particles drifting in the background
- Active nav indicator that slides to the section in view while scrolling
- Full scheduling system: add, filter (all, today, upcoming, cleared), mark done, or dismiss quests
- Threat rank system (Goblin, Ogre, Catastrophe) used as task priority, each with its own color
- Live countdown to your next upcoming quest
- Browser notifications plus an audio chime when a quest becomes due
- Everything saved locally in the browser, so your list is still there next time you visit

## Files

```
index.html      Markup and page structure
css/style.css   Theme, layout, and all animations
js/script.js    Interactions, scheduling logic, and the reminder engine
```

## Running locally

Open `index.html` with a Live Server extension in VS Code (or any static file server). No build step, no dependencies to install.

## Deploying

Works as-is on GitHub Pages: push this folder to a repo, then enable Pages on the `main` branch in Settings.

## Notes

Notifications require the "Enable Alerts" button to be clicked once, since browsers require a user gesture before granting permission. If a task's time has already passed when you load the page, it will trigger its reminder right away rather than staying silent.

## Credits

Built by Justin Karl Sulit.

- GitHub: [github.com/jkarldysulit](https://github.com/jkarldysulit)
- Email: jkarldysulit@gmail.com
- LinkedIn: [justin-karl-sulit](https://www.linkedin.com/in/justin-karl-sulit-7649a5352)

This is a fan-made, non-commercial tribute project and is not affiliated with the Tensura franchise.
