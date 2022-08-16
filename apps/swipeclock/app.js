var WIDTH =  g.getWidth();
var SIZE = Math.floor(WIDTH / (7*6));

function rotationString(fullTrackName, width, sizeOfChar, speed) {
    const d = new Date();
    const maxCharVisible = Math.ceil(width / sizeOfChar)
    const position =(d.getSeconds() * speed) % (fullTrackName.length - maxCharVisible);
    return fullTrackName.length > maxCharVisible 
        ? fullTrackName.slice(position, position + maxCharVisible + 1) 
        : fullTrackName
}

const screens = [
    {
        name: "clock",
        watchUiState: {
            nightMode: false,
            forceDraw: true,
            width: WIDTH,
            size: SIZE,
            x: (WIDTH / 2) - SIZE * 6,
            y: (g.getHeight()/2) - SIZE *7
        },
        render: () => {
            var watchUiState = screens[currentScreen].watchUiState;
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
            
            g.clearRect(width * 0.8, y + size * 18 , width , y + size * 26);
            if (musicState && GadgetBridge.isConnected) {
                g.setFont("6x8", size/2).setFontAlign(0,-1);
                g.drawString(musicState.state === "play" ? "||" : '>', width * 0.9, y + size * 20);
            }

            g.clearRect(width * 0.4, y - size * 12 , width , y - size * 8);
            if (musicInfo && GadgetBridge.isConnected) {
                const fullTrackName = musicInfo.track + " - " + musicInfo.artist;
                g.setFont("6x8", size/2).setFontAlign(0,-1);

                g.drawString(rotationString(fullTrackName, width * 0.6, 6 * (size/2), 2), width * 0.68, y - size * 12)
            }
            
            if ((d.getMinutes() % 2 == 0 && d.getSeconds() == 0) || watchUiState.forceDraw) {
                var bat = E.getBattery();
                var color = bat <= 20 || watchUiState.nightMode ? "#ff1100" : "#ffffff";
                
                if (Bangle.isCharging()) {
                    color = "#ffc413";
                }
                
                g.setColor(color);
                g.setFont("6x8", size/1.5).setFontAlign(0,-1);
                g.clearRect(0, y - size * 10, width ,  y - size * 6);
                g.drawString(bat + "%", width / 8 + 10, y - size * 10);
            }
            
            watchUiState.forceDraw = false;
        },
        onButtonClick: (btn) => {
            var watchUiState = screens[currentScreen].watchUiState;
            if (btn == 1) {
                watchUiState.nightMode = !watchUiState.nightMode;
                if (watchUiState.nightMode) Bangle.setLCDBrightness(0.2);
                else Bangle.setLCDBrightness(1);
                
                watchUiState.forceDraw = true;
                screens[currentScreen].render();
            } else if (btn == 3) {
                if (GadgetBridge.isConnected) GadgetBridge.musicControl(musicState && musicState.state === "play" ? "pause" : 'play');
            }
        },
    },
];

const musicView = {
    name: "music",
    watchUiState: {
        nightMode: false,
        forceDraw: true,
        width: WIDTH,
        size: SIZE,
        x: (WIDTH / 2) - SIZE * 6,
        y: (g.getHeight()/2) - SIZE *7
    },
    render: () => {
        var watchUiState = musicView.watchUiState;
        var y = watchUiState.y;
        var size = watchUiState.size;
        var width = watchUiState.width;

        g.reset();
        if (watchUiState.nightMode) {
            g.setColor("#ff1100");
        }
        
        g.clearRect(0, y - size * 4 , width , y + size * 4);
        if (musicInfo) {
            if (musicInfo.track && GadgetBridge.isConnected) {
                g.setFont("6x8", size/1.5).setFontAlign(0,-1);
                const charSize = 6 * (size/1.5);
                const margin = charSize * 2;
                g.drawString(rotationString(musicInfo.track, width - margin, charSize, 1), width * 0.5 + (margin / 4), y - size * 4)
            }
    
            g.clearRect(0, y + size * 2 , width , y + size * 6 );
            if (musicInfo.artist && GadgetBridge.isConnected) {
                g.setFont("6x8", size/2).setFontAlign(0,-1);
                g.drawString(rotationString("BY: " + musicInfo.artist, width, 6 * (size/2), 1), width * 0.5, y + size * 2)
            }
        } else {
            g.setFont("6x8", size/1.5).setFontAlign(0,-1);
            const charSize = 6 * (size/1.5);
            const margin = charSize * 2;
            g.drawString(rotationString("No Song.", width - margin, charSize, 1), width * 0.5 + (margin / 4), y - size * 4)
        }
        
        g.clearRect(0, y + size * 10 , width , y + size * 18 );
        if (musicState && musicState.state && GadgetBridge.isConnected) {
            g.setFont("6x8", size/2).setFontAlign(0,-1);
            g.drawString(musicState.state == "play" ? "Playing" : "Paused", width * 0.5, y + size * 10)
        }

        g.clearRect(0, y + size * 18 , width , y + size * 24);
        if (GadgetBridge.isConnected) {
            g.setFont("6x8", size/2).setFontAlign(0,-1);
            g.drawString("<<", width * 0.25, y + size * 18)
            g.drawString(">>", width * 0.75, y + size * 18)
            g.drawString("+", width * 0.9, y - size * 12)
            g.drawString("-", width * 0.9, y + size * 22)
        }

        const d = new Date()
        g.setFont("6x8", size/2).setFontAlign(0,-1);
        g.clearRect(0, y - size * 10, (6 *(size/2)) * 5 ,  y - size * 6);
        g.drawString(("0"+d.getHours()).substr(-2)+":"+("0"+d.getMinutes()).substr(-2), width / 8 + 10, y - size * 10);
    },
    onButtonClick: (btn) => {
        if (btn == 1) {
            GadgetBridge.musicControl("volumeup");
        } else if (btn == 3) {
            GadgetBridge.musicControl("volumedown");
        } else if (btn == 4) {
            GadgetBridge.musicControl("previous");
        } else if (btn == 5) {
            GadgetBridge.musicControl("next");
        }
    },
};

let currentScreen = 0;
let onSwipe = false;
let buttonTimeout;
let musicInfo = null;
let musicState = null;

function clearScreen() {
    g.clear();
    g.clearRect(0,0, g.getHeight(), WIDTH)
    Bangle.setUI("clock");
    Bangle.loadWidgets();
    Bangle.drawWidgets();
    
    if (screens[currentScreen].watchUiState) screens[currentScreen].watchUiState.forceDraw = true;
}


function draw() {
    screens[currentScreen].render();
}

function onButtonClick(button) {
    if (onSwipe) return;
    
    if (buttonTimeout) clearTimeout(buttonTimeout);
    buttonTimeout = setTimeout(() => {
        screens[currentScreen].onButtonClick(button);
    }, 150);
}

function onScreenSwipe(direction) {
    if (screens.length === 1) return;
    if (buttonTimeout) clearTimeout(buttonTimeout);

    onSwipe = true;
    const newScreenPos =  currentScreen + direction;

    if (newScreenPos >= 0) {
        currentScreen = newScreenPos % screens.length;
    } else {
        currentScreen = screens.length + newScreenPos;
    }
    
    clearScreen();
    setTimeout(() => onSwipe = false, 150);
}

function addMusicView() {
    if (screens.find(v => v === musicView)) return;
    screens.push(musicView);
}

function main() {
    require("Font7x11Numeric7Seg").add(Graphics);
    
    // Only update when display turns on
    if (process.env.BOARD!="SMAQ3") // hack for Q3 which is always-on
    setWatch(() => onButtonClick(1), BTN1, { edge:"rising", debounce: 50, repeat:true });
    setWatch(() => onButtonClick(2), BTN2, { edge:"rising", debounce: 50, repeat:true });
    setWatch(() => onButtonClick(3), BTN3, { edge:"rising", debounce: 50, repeat:true });
    setWatch(() => onButtonClick(4), BTN4, { edge:"rising", debounce: 50, repeat:true });
    setWatch(() => onButtonClick(5), BTN5, { edge:"rising", debounce: 50, repeat:true });
    
    Bangle.on('swipe', (direction) => onScreenSwipe(direction));
    
    GadgetBridge.onEvent('musicinfo', (info) =>{
        musicInfo = info;
        GadgetBridge.__private__.info = info;
    });
    GadgetBridge.onEvent('musicstate', (state) => {
        musicState = state;
        GadgetBridge.__private__.state = state;
    });
    GadgetBridge.onEvent('connect', addMusicView);
    GadgetBridge.onEvent('disconnect', () => {
        const musicViewIndex = screens.findIndex(v => v === musicView);
        if (index == -1) return

        if (currentScreen === musicViewIndex) currentScreen = 0;

        screens.splice(musicViewIndex, 1);
    });


    if (GadgetBridge.isConnected) addMusicView();
    
    clearScreen();
    
    setInterval(draw, 1000);
}
main();