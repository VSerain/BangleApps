function main() {
    require("Font7x11Numeric7Seg").add(Graphics);
    var nightMode = false;
    var forceDraw = true;
    var width = g.getWidth();
    var size = Math.floor(width / (7*6));
    var x = (width / 2) - size * 6,
    y = (g.getHeight()/2) - size*7;

    function draw() {
        var d = new Date();
        g.reset();
        if (nightMode) {
        g.setColor("#ff1100");
        }

        g.setFont("7x11Numeric7Seg",size).setFontAlign(1,-1);
        if ((d.getMinutes() == 0 && d.getSeconds() == 0) || forceDraw) {
        g.clearRect(x - size * 9, y, x - size , y + size * 11);
        g.drawString(d.getHours(), x, y);
        }

        g.setFontAlign(-1,-1);

        if (d.getSeconds() % 2 == 0) g.drawString(":", x,y);
        else g.clearRect(x, y, x + size *4, y + size * 12);

        if (d.getSeconds() == 0|| forceDraw) {
            g.clearRect(x + size *4 , y, x + size * 17 , y + size * 11);
            g.drawString(("0"+d.getMinutes()).substr(-2),x+size*4,y);
        }

        // draw seconds
        g.setFont("7x11Numeric7Seg",size/2);
        g.clearRect(x+size*18,y + size*7,x+size*18 + size *8 ,y + size*12 );
        g.drawString(("0"+d.getSeconds()).substr(-2),x+size*18,y + size*7);

        if ((d.getHours() == 0 && d.getMinutes() == 0) || forceDraw) {
        // date
        var date = d.toString().split(" ");
        g.setFont("6x8", size/1.5).setFontAlign(0,-1);
        g.clearRect(width/4, y + size * 16, width/ 1.33 , y + size * 20);
        g.drawString(date[2] + " " + date[1], width / 2 , y + size * 16);
        }


        if ((d.getMinutes() % 2 == 0 && d.getSeconds() == 0) || forceDraw) {
        var bat = E.getBattery();
        var color = bat <= 20 || nightMode ? "#ff1100" : "#ffffff";

        if (Bangle.isCharging()) {
            color ="#ffc413";
        }

        g.setColor(color);
        g.setFont("6x8", size/1.5).setFontAlign(0,-1);
        g.clearRect(0, y - size * 10, width ,  y - size * 6);
        g.drawString(bat + "%", width / 8 + 10, y - size * 10);
        }
        forceDraw = false;
    }

    // Only update when display turns on
    if (process.env.BOARD!="SMAQ3") // hack for Q3 which is always-on
    Bangle.on('lcdPower', function(on) {
        if (secondInterval) clearInterval(secondInterval);
        if (on) {
        forceDraw = true;
        secondInterval = setInterval(draw, 1000);
        }
        draw();
    });

    setWatch(() => {
        nightMode = !nightMode;
        if (nightMode) Bangle.setLCDBrightness(0.2);
        else Bangle.setLCDBrightness(1);
        forceDraw = true;
        draw(); // needed for update color
    }, BTN1, {edge:"rising", debounce:50, repeat:true});

    g.clear();
    var secondInterval = setInterval(draw, 1000);
    draw();
    // Show launcher when button pressed
    Bangle.setUI("clock");
    Bangle.loadWidgets();
    Bangle.drawWidgets();
}
main();