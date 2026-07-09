BACKGROUND MUSIC & SOUNDS DIRECTORY

To customize the background music and sound effects on this website, simply place your audio files in this directory:

1. Background Music:
   Rename your main audio track (e.g. an anime opening theme) to `background_op.mp3` and place it directly in this folder.
   If this file is missing, the site will automatically fall back to an online royalty-free synthwave soundtrack.

2. Sound Effects:
   The website programmatically synthesizes its own "whoosh", "charge hum", and "level-up chime" sound effects using the Web Audio API, so no sound files are required for normal operation.
   If you want to use custom sound files, you can modify the JS loading triggers in `app.js` to play local audio files instead.
