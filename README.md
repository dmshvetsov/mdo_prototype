#Magic duel online game prototype

This is a try to make a great game about magical duels, with power of node.js, socket.io and angular.js. But this try fails because of the poor code design. Work on this prototype is finished.

##Core ideas

- the game is turn-based, but each round players make simultaneously;
- the principle of rock, scissors, paper;
- a health and a mana is the same, if you have mana/health you can resist if not you lose;
- this is RPG, so you can grow your own magician.

##Project structure

* doc               (all documentation)
* lib               (project library)
* public            (client files)
* app.js            (node js application)
* package.json      (metadata relevant to the project)
* README.md         (this file)

##How to use

1. clone this repo
2. type in terminal/cmd: cd mdo_prototype
3. type in terminal/cmd: npm install
4. type in terminal/cmd: node app.js
5. open in browser: localhost:8080
6. explore the app and check the documentation

##License

The MIT License (MIT)

Copyright (c) [2014] [Dmitry Shvetsov]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.