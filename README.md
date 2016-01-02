# sensorium-tester
sensorium-tester is a hardware test framework for makeblock. It bases on hardware protocol defined in makeblock，and covers
all the product in makeblock. The mainboard includes `mcore`,`2560`,`orion`,`zeroPI`.


# Description of files

- **protocol.js** different hardware protocol.Inclue `mcore`,`2560`,`orion`,`zeroPI` etc.
- **control.js** communicate with protocol.js
- **action.js** communicate with control
- **config.js** global settings
- **app.js** start file
- **base.js** util functions
- **public/**  test web interface. includes `images/`, `css/`, `js/`, `index.html`


***


# sensorium
sensorium is for detecting sensors' data and providing web server api for invoking.

# To Install

	npm install

# To Start
	node server.js

open your browser with `http://yourip:9615/ultrasonic`
