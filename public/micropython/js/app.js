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

function runCode() {
    // Generate JavaScript code and run it.
    window.LoopTrap = 1000;
    Blockly.JavaScript.INFINITE_LOOP_TRAP =
        'if (--window.LoopTrap == 0) throw "Infinite loop.";\n';
    var code = Blockly.JavaScript.workspaceToCode(workspace);
    Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
    try {
        eval(code);
    } catch (e) {
        alert(e);
    }
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
};



$(function() {
    var app = MBlockly.App;

    app.registerEvents();
});

