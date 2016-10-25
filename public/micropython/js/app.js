function showCode() {
    var content = document.getElementById('codeDiv');
    var code = Blockly.Python.workspaceToCode(workspace);
    MBlockly.App.result = code;
    content.textContent = code;
    if (typeof prettyPrintOne == 'function') {
        code = content.innerHTML;
        code = prettyPrintOne(code, 'py');
        content.innerHTML = code;
    }
}

function loadXml() {
  var dropdown = document.getElementById('testUrl');
  var url = dropdown.options[dropdown.selectedIndex].value;
  if (!url) {
    url = window.prompt('Enter URL of test file.');
    if (!url) {
      return;
    }
  }
  var xmlText = fetchFile(url);
  if (xmlText !== null) {
    fromXml(xmlText);
  }
}

function toXml() {
    var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    console.log(xml);
}

function fetchFile(xmlUrl) {
  try {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open('GET', xmlUrl, false);
    xmlHttp.setRequestHeader('Content-Type', 'text/xml');
    xmlHttp.send('');
  } catch (e) {
    // Attempt to diagnose the problem.
    var msg = 'Error: Unable to load XML data.\n';
    if (window.location.protocol == 'file:') {
      msg += 'This may be due to a security restriction preventing\n' +
          'access when using the file:// protocol.\n' +
          'Use an http webserver, or a less paranoid browser.\n';
    }
    alert(msg + '\n' + e);
    return null;
  }
  return xmlHttp.responseText;
}

function fromXml(xmlText) {
  workspace.clear();
  try {
    var xmlDoc = Blockly.Xml.textToDom(xmlText);
  } catch (e) {
    alert('Error parsing XML:\n' + e);
    return;
  }
  Blockly.Xml.domToWorkspace(xmlDoc, workspace);
}

function clear() {
    workspace.clear();
}

function setOutput(text) {
  var output = document.getElementById('importExport');
  output.value = text;
  output.focus();
  // output.select();
}



MBlockly.App = {
    result: null
};

MBlockly.App.registerEvents = function() {
    var control = MBlockly.Control;
    var app = MBlockly.App;
    var eventType = getEventType();

    workspace.addChangeListener(showCode);

    $('.preview').on(eventType, function() {
        control.sendContent(1, app.result);
    });

    $('.upload').on(eventType, function() {
        control.sendContent(2, app.result);
    });

    $('.openFirmata').on(eventType, function() {
        control.send([0x07]);
    });

    $('.clear').on(eventType, function() {
        clear();
    });

    $('.toXml').on(eventType, function() {
        toXml();
    });
};



$(function() {
    var app = MBlockly.App;

    app.registerEvents();

    if(typeof TellNative == 'undefined') {
        TellNative = {
            requestLoadProject: function(){},
            reportCurrentWidget: function(){},
            saveControlPanel: function(){},
            sendValueToWidget: function(){},
            sendViaBluetooth: function(){},
            requestBluetoothReconnect: function(){},
            sendViaBluetoothUnreliably: function(){}
        };
    }
});