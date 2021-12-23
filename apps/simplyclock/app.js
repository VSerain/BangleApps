var modeUi = "watch";
var WIDTH =  g.getWidth();
var SIZE = Math.floor(WIDTH / (7*6));
var watchUiState = {
    nightMode: false,
    forceDraw: true,
    width: WIDTH,
    size: SIZE,
    x: (WIDTH / 2) - SIZE * 6,
    y: (g.getHeight()/2) - SIZE *7
}
var stat = "play";
var doubleTouch = false;
var lastAction;
var actionTimeout;
var drawInterval;

function main() {
    require("Font7x11Numeric7Seg").add(Graphics);
    
    // Only update when display turns on
    if (process.env.BOARD!="SMAQ3") // hack for Q3 which is always-on
    
    g.clear();
    drawLoop(1000);
    Bangle.setUI("clock");
    Bangle.loadWidgets();
    Bangle.drawWidgets();
    
    listenEvent();
}


function drawWatch() {
    var d = new Date();
    var x = watchUiState.x;
    var y = watchUiState.y;
    var size = watchUiState.size;
    var width = watchUiState.width;
    
    g.reset();
    if (watchUiState.nightMode) {
        g.setColor("#ff1100");
    }
    
    g.setFont("7x11Numeric7Seg",size).setFontAlign(1,-1);
    if ((d.getMinutes() == 0 && d.getSeconds() == 0) || watchUiState.forceDraw) {
        g.clearRect(x - size * 14, y, x - size , y + size * 11);
        g.drawString(d.getHours(), x, y);
    }
    
    g.setFontAlign(-1,-1);
    
    if (d.getSeconds() % 2 == 0) g.drawString(":", x,y);
    else g.clearRect(x, y, x + size *4, y + size * 12);
    
    if (d.getSeconds() == 0|| watchUiState.forceDraw) {
        g.clearRect(x + size *4 , y, x + size * 17 , y + size * 11);
        g.drawString(("0"+d.getMinutes()).substr(-2),x+size*4,y);
    }
    
    // draw seconds
    g.setFont("7x11Numeric7Seg",size/2);
    g.clearRect(x+size*18,y + size*7,x+size*18 + size *8 ,y + size*12 );
    g.drawString(("0"+d.getSeconds()).substr(-2),x+size*18,y + size*7);
    
    if ((d.getHours() == 0 && d.getMinutes() == 0) || watchUiState.forceDraw) {
        // date
        var date = d.toString().split(" ");
        g.setFont("6x8", size/1.5).setFontAlign(0,-1);
        g.clearRect(width/4, y + size * 16, width/ 1.33 , y + size * 20);
        g.drawString(date[2] + " " + date[1], width / 2 , y + size * 16);
    }
    
    
    if ((d.getMinutes() % 2 == 0 && d.getSeconds() == 0) || watchUiState.forceDraw) {
        var bat = E.getBattery();
        var color = bat <= 20 || watchUiState.nightMode ? "#ff1100" : "#ffffff";
        
        if (Bangle.isCharging()) {
            color ="#ffc413";
        }
        
        g.setColor(color);
        g.setFont("6x8", size/1.5).setFontAlign(0,-1);
        g.clearRect(0, y - size * 10, width ,  y - size * 6);
        g.drawString(bat + "%", width / 8 + 10, y - size * 10);
    }

    g.clearRect(width * 0.30, y - size * 10 , width ,y - size * 2);
    if (lastAction && !lastAction.startsWith("volume")) {
        g.setFont("6x8", size/1.5).setFontAlign(0,-1);
        g.drawString(lastAction, width * 0.68, y - size * 10);
    }
    watchUiState.forceDraw = false;
}

function drawVolume() {
    g.reset();
    g.setFont("6x8", SIZE / 1.5).setFontAlign(-1,-1);
    
    g.drawString("Volume", WIDTH / 4, watchUiState.y - SIZE * 5);
    
    g.setFont("6x8", SIZE * 1.5).setFontAlign(0,-1);

    g.drawString("-", WIDTH / 4, watchUiState.y + SIZE * 3);
    g.drawString("+", WIDTH / 2 + WIDTH /4, watchUiState.y + SIZE * 3);

    g.clearRect(WIDTH/6, watchUiState.y + SIZE * 16, WIDTH , watchUiState.y + SIZE * 21);
    if (lastAction) {
        if (lastAction == "volumeup") { 
            g.setFont("6x8", SIZE / 1.5).setFontAlign(-1,-1);
            g.drawString("Volume up", WIDTH / 5, watchUiState.y + SIZE * 16);
        }
        else if (lastAction == "volumedown") {
            g.setFont("6x8", SIZE / 1.5).setFontAlign(-1,-1);
            g.drawString("Volume down", WIDTH / 6, watchUiState.y + SIZE * 16);
        }
    }
}

function draw() {
    if (modeUi == "volume") {
        drawVolume();
    } else {
        drawWatch();
    }
}


function listenEvent() {
    setWatch(() => {
        if (modeUi == "volume") { return; }
        
        watchUiState.nightMode = !watchUiState.nightMode;
        if (watchUiState.nightMode) Bangle.setLCDBrightness(0.2);
        else Bangle.setLCDBrightness(1);
        
        watchUiState.forceDraw = true;
        drawWatch(); // needed for update color
    }, BTN1, {edge:"rising", debounce:50, repeat:true});
    
    setWatch(() => {
        modeUi = modeUi == "watch" ? "volume" : "watch";
        watchUiState.forceDraw = true;
        g.clearRect(0, watchUiState.y - SIZE * 10, WIDTH, g.getHeight());
        drawLoop(1000);
    }, BTN3, {edge:"rising", debounce: 50, repeat:true});
    
    setWatch(() => {
        if (modeUi != "volume") {
            if (BTN5.read()) {
                togglePlay();
                setAction(stat);
                doubleTouch = true;
                setTimeout(() => doubleTouch = false, 200);
            } else {
                setAction("previous");
            }
        } else {
            setAction("volumedown");
        }
    }, BTN4, {edge:"rising", debounce: 50, repeat:true});
    
    setWatch(() => {
        if (modeUi != "volume") {
            if (doubleTouch) return;
            setAction("next");
            
        } else {
            setAction("volumeup");
        }
    }, BTN5, {edge:"rising", debounce: 50, repeat:true});
    
    Bangle.on('lcdPower', function(on) {
        if (drawInterval) clearInterval(drawInterval);
        g.clearRect(0, watchUiState.y - SIZE * 10, WIDTH, g.getHeight());
        if (on) {
            modeUi = "watch";
            watchUiState.forceDraw = true;
            drawLoop(1000);
        }
    });
}

function togglePlay() {
    stat = (stat==="play" ? "pause" : "play");
}

function setAction(action) {
    if (actionTimeout) clearTimeout(actionTimeout);
    actionTimeout = setTimeout(() => lastAction = null, 1000);
    lastAction = action;

    Bluetooth.println(JSON.stringify({t:"music", n: action}));
    draw();
}

function drawLoop(time) {
    if (drawInterval) clearInterval(drawInterval);
    drawInterval = setInterval(draw, time);
    draw();
}

main();