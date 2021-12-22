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
            global.GadgetBridge.send({ t: "music", n:cmd });
        },
        messageResponse: (msg, response) => {
            if (!isFinite(msg.id)) return;
            global.GadgetBridge.send({ t: "notify", n:response ? "OPEN" : "DISMISS", id: msg.id });
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
        }
    };

    NRF.on("connect", () => dispatchEvent("connect", {}));
    NRF.on("disconnect", () => dispatchEvent("disconnect", {}));

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
