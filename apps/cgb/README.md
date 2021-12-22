# Custom Gadget Bridge

Manage event of gadget bridge (alternative to Android bangle app).
Dispatch many event in bangle and another app can listen here events

## How to install in my app
```js
// apps.json
{
    "id": "myapp",
    "name": "My app",
    "shortName": "app",
    "version": "0.01",
    "description": "bip bip",
    "dependencies": { "cgb": "app" },
}

// myapp/app.js
global.GadgetBridge.onEvent("notify", (event) => {
    // Your code
});
```

## Features

### Api describe
```ts
global.GadgetBridge: {
    onEvent(eventName: EventName, callback: Callback, option?: Option)
    removeEventListener(eventName: EventName, callback: Callback)
    sendEvent(message: string)
    musicControl(command: string) // play/pause/next/previous/volumeup/volumedown
    messageResponse(msg: Object, opened: boolean) // opened true or false, msg is the message to which you wish to reply
    callResponse(call: Object, accepted: boolean) // accepted true or false, call is the call to which you wish to reply
}

type EventName = String; // See list of events
interface Callback {
    (event: any, stopPropagation: () => void): void
}
interface Option {
    layer: number // default Infinity
}
```

List of events:
- notify
- find
- musicstate
- musicinfo
- call
- connect
- disconnect

### Default Features
 - Send Health tracking to GadgetBridge
 - Send Battery status to GadgetBridge
 - Vibration on find event (It can be disabled, see stop propagations part)

## Exemples

For listen a gadgetbridge event :
```js
// file boot.js
function boot() {
    global.GadgetBridge.onEvent("notify", (event) => {
        // Your code
    });
}
setTimeout(boot, 1000); // Necessary to make sure that all are well loaded
```

For stop listening

```js
// file boot.js
function boot() {
    var onNotify = (event) => {
        // Your code
    };
    global.GadgetBridge.onEvent("notify", onNotify);
    global.GadgetBridge.removeEventListener("notify", onNotify);
}
setTimeout(boot, 1000);
```

### To Know

Event manager sort callback by layer. If you want start your callback behind another you must add lower layer.

For exemple:
```js
// file boot.js
function boot() {
    global.GadgetBridge.onEvent("notify",  (event) => {
        console.log("from boot.js");
    }, { layer: 2 });
}
setTimeout(boot, 1000);

// file another.boot.js
function boot() {
    global.GadgetBridge.onEvent("notify",  (event) => {
        console.log("from another.boot.js");
    }, { layer: 1 });
}
setTimeout(boot, 1000);

// logs
// -> "from another.boot.js"
// -> "from boot.js"
```

Event manager also proposes to stop the propagation (callbacks with a higher layer will not be called). This is useful if you want to disable another behavior

For exemple:
```js
// file boot.js
function boot() {
    global.GadgetBridge.onEvent("notify",  (event) => {
        console.log("It's never call");
    }, { layer: 2 });
}
setTimeout(boot, 1000);

// file another.boot.js
function boot() {
    global.GadgetBridge.onEvent("notify",  (event, stopPropagation) => {
        console.log("from another.boot.js");
        stopPropagation();
    }, { layer: 1 });
}
setTimeout(boot, 1000);

// logs
// -> "from another.boot.js"
```