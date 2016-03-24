# sensorium-tester
sensorium-tester is a hardware test framework for makeblock. It bases on hardware protocol defined in makeblock，and covers
all the hardware products. The mainboard includes `mcore`,`auriga`,`orion`,`megaPi`.

![demo ui](/public/images/demo.png)

# To Start

    npm install & npm start

then visit `http:localhost:3003` in your browser.

# Description of files

- **source/mboardControl.js** different hardware protocol.Inclue `mcore`,`auriga`,`orion`,`megaPi` etc.
- **source/servoControl.js** servo test
- **app.js** start file
- **base.js** util functions
- **public/**  test web interface. includes `images/`, `css/`, `js/`, `*.html`

# Change log
【20160323 v0.1.1】
>1. feat: add api doc
2. feat: add smart servo support
【20160216 v0.1.0】
>1. feat: sensors tip info
2.  imporve: add more sensors

