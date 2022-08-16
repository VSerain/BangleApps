(function() {
    var onCallbacks = {};

    function dispatchEvent(eventName, data) {
        if (!onCallbacks[eventName]) {
            console.log(eventName + " not found in callbacks");
            return;
        }
        var stop = false;
        const stopCallback = () => stop = true;

        onCallbacks[eventName].forEach(eventCallback => {
            if (stop) return;
            console.log(stop);
            eventCallback.callback(data, stopCallback);
        });
    }

    // Disposed public API
    global.GadgetBridge = {
        send: (message) => {
            Bluetooth.println("");
            Bluetooth.println(JSON.stringify(message)); 
        },
        onEvent: (eventName, callback, option = {}) => {
            if (!option) { 
                option = {};
            }
            if (!onCallbacks[eventName]) {
                onCallbacks[eventName] = [];
            }
            if (!option.layer) option.layer = Infinity;
    
            onCallbacks[eventName].push({callback: callback, layer: option.layer});
            onCallbacks[eventName].sort((a, b) => a.layer - b.layer);
        },
        removeEventListener: (eventName, callback) => {
            if (!onCallbacks[eventName]) return;
    
            const index = onCallbacks[eventName].findIndex(event => event.callback === callback);
            if (index == -1) return;
            onCallbacks[eventName].splice(index, 1);
        },
        musicControl: cmd => {
            // play/pause/next/previous/volumeup/volumedown
            global.GadgetBridge.send({ t: "music", n: cmd });
        },
        messageResponse: (msg, response) => {
            if (!isFinite(msg.id)) return;
            global.GadgetBridge.send({ t: "notify", n: response ? "OPEN" : "DISMISS", id: msg.id });
        },

        findPhone: (search) => {
            global.GadgetBridge.send({ t: "findPhone", n: search})
        },
        // Call response
        callResponse: (msg, response) => {
            if (msg.id != "call") return;
            global.GadgetBridge.send({ t: "call", n:response ? "ACCEPT" : "REJECT" });
        },
        "__private__" : { // Just for debbuging in WebIde
            dispatchEvent: dispatchEvent
        },
        isConnected: false,
    };

    NRF.on("connect", () => {
      GadgetBridge.isConnected = true;
      dispatchEvent("connect", {})
    });
    NRF.on("disconnect", () => {
      GadgetBridge.isConnected = false;
      dispatchEvent("disconnect", {})
    });

    var HANDLERS = {
        // {t:"notify",id:int, src,title,subject,body,sender,tel:string} add
        "notify" : function(event) { 
            dispatchEvent("notify", Object.assign(event, { t: "add", positive: true, negative: true }));
        },
        // {t:"notify~",id:int, title:string} // modified
        "notify~" : function(event) {
            event.t = "modify";
            dispatchEvent("notify", event);
        },
        // {t:"notify-",id:int} // remove
        "notify-" : function(event) { 
            event.t = "remove";
            dispatchEvent("notify", event);
        },
        // {t:"find", n:bool} // find my phone
        "find" : (event) => dispatchEvent("find", event),
        // {t:"musicstate", state:"play/pause",position,shuffle,repeat}
        "musicstate" : function(event) {
            dispatchEvent("musicstate", { t: "modify", id: "music", title: "Music", state: event.state });
        },
        // {t:"musicinfo", artist,album,track,dur,c(track count),n(track num}
        "musicinfo" : function(event) {
            dispatchEvent("musicinfo", Object.assign(event, { t: "modify", id: "music", title: "Music" }));
        },
        // {"t":"call","cmd":"incoming/end","name":"Bob","number":"12421312"})
        "call" : function(event) {
            dispatchEvent("call", Object.assign(event, 
                {
                    t: event.cmd == "incoming",
                    id:"call",
                    src:"Phone",
                    positive:true,
                    negative:true,
                    title:event.name || "Call",
                    body:"Incoming call\n"+event.number
                }
            ));
        },
    };

    var _GB = global.GB;
    global.GB = (event) => {
        // feed a copy to other handlers if there were any
        if (_GB) setTimeout(_GB,0,Object.assign({},event));

        var handler = HANDLERS[event.t];
        if (handler) handler(event);
        else dispatchEvent(event.t, event);
    };
})();


/**
 * 
 * function drawMessage(message) {
  g.clearRect(0,g.getHeight() / 2 - g.getHeight() / 3, g.getWidth(), g.getHeight() / 2 + g.getHeight() / 4);
  // Draw Message rect
  g.setColor(1,1,1);
  g.fillRect(
    0,
    g.getHeight() / 2 - g.getHeight() / 3,
    g.getWidth(),
     g.getHeight() / 2 + g.getHeight() / 4
  );

  drawHeader(message);
  drawMessageTxt(message);
  drawActionsButtons();
}

function drawHeader(message) {
  g.setFont("6x8", 2.5).setFontAlign(-1,-1);
  g.setColor(0,0,0);

  g.drawString(
    message.sender.trim(),
    10,
    g.getHeight() / 2 - g.getHeight() / 3 + 10
  );
  if (message.src) {
    g.setFont("6x8", 1).setFontAlign(-1, 0);
    g.drawString(
      message.src.trim(),
      g.getWidth() - g.stringWidth(message.src.trim()) - 5,
      g.getHeight() / 2 - g.getHeight() / 3 + 7
    );
  }
}

function drawMessageTxt(message) {
  const width = g.getWidth() - 10;// Available width
  const height = (g.getHeight() / 2 + g.getHeight() / 4) - (g.getHeight() / 2 - g.getHeight() / 3) - 50;// Available height
  const lineHeight = 6 * 2;
  const nbLine = Math.ceil(height / (lineHeight+4));
  g.setFont("6x8", 2).setFontAlign(-1,-1);

  const words = message.body.replace("\n", "").split(" ");
  var currentWords = 0;
  for (var i = 0; i < nbLine; i++) {
    if (currentWords >= words.length) continue;
    var line = "";
    for(let x = currentWords; x < words.length; x++) {
      var word = words[x];
      if (g.stringWidth(line + " " + word) > width) {
        break;
      } else {
        line += " " + word;
        currentWords = x;
      }
    }
    currentWords++;
     g.drawString(
      line,
      5,
      g.getHeight() / 2 - g.getHeight() / 3 + 40 + ((lineHeight + 4) * i)
    );
  }
}

function drawActionsButtons() {
  g.setFont("6x8", 2.5).setFontAlign(0,0);

  // Draw Button actions
  g.setColor(0.278, 0.886, 0.235);
  g.fillCircle(
    g.getWidth() / 2 - g.getWidth() / 3.8,
    g.getHeight() / 2 + g.getHeight() / 4 + 20,
    35
  );
  g.setColor(0,0,0);
  g.drawString(
    "Seen",
    g.getWidth() / 2 - g.getWidth() / 3.8,
    g.getHeight() / 2 + g.getHeight() / 4 +20
  );

  g.setColor(0.886, 0.235, 0.466);
  g.fillCircle(
    g.getWidth() / 2 + g.getWidth() / 3.8,
    g.getHeight() / 2 + g.getHeight() / 4 + 20,
    35
  );

  g.setColor(0,0,0);
  g.drawString(
    "Not\nseen",
    g.getWidth() / 2 + g.getWidth() / 3.8,
    g.getHeight() / 2 + g.getHeight() / 4 +20
  );
}



function onMessage(message) {
  const oldMode = Bangle.getLCDMode();
  Bangle.setLCDMode("direct");
  Bangle.setLCDPower(1);
  //g.setLCDOffset(g.getHeight());
  drawMessage(message);
  Bangle.buzz();
  setTimeout( _ => Bangle.buzz(), 1000);
  let isClose = false;

  function close() {
    isClose = true;
    g.clearRect(0,g.getHeight() / 2 - g.getHeight() / 3, g.getWidth(), g.getHeight());
    Bangle.setLCDMode(oldMode);
    //g.setLCDOffset(0);
  }

  setWatch(() => {
    if (!global.GadgetBridge || isClose) return;
    global.GadgetBridge.messageResponse(message, true);
    close();
  }, BTN4, {edge:"both", repeat: false});

  setWatch(() => {
    if (!global.GadgetBridge || isClose) return;
    close();
    global.GadgetBridge.messageResponse(message, false);
  }, BTN5, {edge:"both", repeat: false});
}

onMessage({
  body: "slkdfjsljdf, sfsdfsdf",
  sender: "Victor",
  id: 23
});

global.GadgetBridge.onEvent("notify", (message) => onMessage(message));
 */