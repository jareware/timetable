# Description
A very simple HSL timetable showing "app". Select your bus stop and view the next buses scheduled to pass that stop.

# Development
Made with React.js and Bootstrap. 
Requirements: python, sass, npm and nodejs.

When starting for the first time, run ```npm install```.

Do your edits to the files in `src/`.

Run a simple HTTP server:

```
python -m SimpleHTTPServer
```

Run real time compiling of JSX and SASS:

```
node node_modules/babel-cli/bin/babel.js --presets es2015,react --watch src --out-dir dist
```

```
sass --watch src/styles.scss:dist/styles.css
```

Go to ```localhost:8000```.
