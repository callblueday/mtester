# sensorium-tester
sensorium-tester is a hardware test framework for makeblock. It bases on hardware protocol defined in makeblock，and covers
all the product in makeblock. The mainboard includes `mcore`,`2560`,`orion`,`zeroPI`.


# Description of files

- **source/mboardControl.js** cdifferent hardware protocol.Inclue `mcore`,`2560`,`orion`,`zeroPI` etc.
- **source/servoControl.js** cdifferent hardware protocol.Inclue `mcore`,`2560`,`orion`,`zeroPI` etc.
- **app.js** start file
- **base.js** util functions
- **public/**  test web interface. includes `images/`, `css/`, `js/`, `*.html`

# To Start
    
    npm install & npm start
