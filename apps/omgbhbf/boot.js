(function() {
    function boot() {
        // Battery monitor
        function sendBattery() { 
            global.GadgetBridge.send({ t: "status", bat: E.getBattery(), volt: E.getAnalogVRef(), chg: Bangle.isCharging() });
        }
        setInterval(sendBattery, 10*60*1000);

        global.GadgetBridge.onEvent("connect", () => setTimeout(sendBattery, 2000), { layer: 0 });
        
        // Health tracking
        Bangle.on('health', health => {
            global.GadgetBridge.send({ t: "act", stp: health.steps, hrm: health.bpm });
        });
        
        // Find event
        global.GadgetBridge.onEvent("find", (event) => {
            if (Bangle.findDeviceInterval) {
                clearInterval(Bangle.findDeviceInterval);
                delete Bangle.findDeviceInterval;
            }
            if (event.n) // Ignore quiet mode: we always want to find our watch
            Bangle.findDeviceInterval = setInterval( _ => Bangle.buzz(), 1000);
        });
    }
    setTimeout(boot, 0);
})();
