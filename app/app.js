var app = new PIXI.Application(320, 200);
document.body.appendChild(app.view);

$.getJSON('levels.json', function(data) {});

var request = new XMLHttpRequest();
request.open("GET", "levels.json", false);
request.send(null);
var json = JSON.parse(request.responseText);

var shrink = PIXI.Sprite.fromImage("assets/shrink.png");
var expand = PIXI.Sprite.fromImage("assets/expand.png");
var blue = PIXI.Sprite.fromImage("assets/blue.png");
var empty = PIXI.Sprite.fromImage("assets/empty.png");
var bigGrid = PIXI.Sprite.fromImage("assets/big_grid.png");
var smallGrid = PIXI.Sprite.fromImage("assets/small_grid.png");
var theEnd = PIXI.Sprite.fromImage("assets/the_end.png");

var graphics = new PIXI.Graphics();
graphics.lineStyle(8, 0xFFE400);
graphics.drawRect(0, 0, 320, 200);

graphics.lineStyle(4, 0x686868);
graphics.moveTo(50, 100);
graphics.lineTo(270, 100);

var currentLevel = 0;
loadLevel(currentLevel);

function loadFinalRect(level) {
    var finalRect = new PIXI.Graphics();
    var finalColor = level.final.color;
    finalColor = "0x" + finalColor.substr(1).toUpperCase();
    finalRect.beginFill(finalColor, 1);
    app.stage.addChild(finalRect);
    if (level.final.size == 1) {
        finalRect.drawRect(258, 88, 24, 24);
        smallGrid.x = 258;
        smallGrid.y = 88;
        app.stage.addChild(smallGrid);
    }
    else {
        finalRect.drawRect(258, 76, 24, 48);
        bigGrid.x = 258;
        bigGrid.y = 76;
        app.stage.addChild(bigGrid);
    }
    return finalColor;
}

function loadInitialRect(initialRect, initialColor, idx, level) {
    initialColor = "0x" + initialColor.substr(1).toUpperCase();
    initialRect.beginFill(initialColor, 1);
    if (idx != 4) {
        initialRect.interactive = true;
        initialRect.buttonMode = true;
    }
    else {
        empty.interactive = true;
        empty.buttonMode = true;
    }
    initialRect.x = 38;
    if (level.initial.size == 1) {
        initialRect.drawRect(0, 0, 24, 24);
        initialRect.y = 88;
    }
    else {
        initialRect.drawRect(0, 0, 24, 48);
        initialRect.y = 76;
    }
    app.stage.addChild(initialRect);
    return initialColor;
}

function loadModifiers(modifierPos, level) {
    var modifiers = [];
    for (var i = 0; i < level.modifiers.length; i++) {
        var modifier;
        if (level.modifiers[i].type == 'resize')
            if (level.modifiers[i].size == 1)
                modifier = shrink;
            else
                modifier = expand;
        else if (level.modifiers[i].type == 'colorize')
            modifier = blue;
        else
            modifier = empty;
        modifier.x = modifierPos[i];
        modifier.y = 88;
        modifiers.push(modifier);
        app.stage.addChild(modifier);
    }
    return modifiers;
}

function setText(level) {
    var text = new PIXI.Text(level.name, {fontFamily: 'Arial', fontSize: 40, fill: 0xFFFFFF, align: 'center'});
    text.x = 160;
    text.y = 170;
    text.anchor.x = 0.5;
    text.anchor.y = 0.5;
    text.scale.x = 0.5;
    text.scale.y = 0.5;
    app.stage.addChild(text);
}

function loadLevel(idx){
    app.stage.removeChildren();
    app.stage.addChild(graphics);
    var level = json[idx];

    setText(level);

    var finalColor = loadFinalRect(level);
    
    var modifierPos = [];
    if (level.modifiers.length == 1)
        modifierPos.push(148);
    else {
        modifierPos.push(106);
        modifierPos.push(190);
    }

    var modifiers = loadModifiers(modifierPos, level);
    
    var initialRect = new PIXI.Graphics();
    var initialColor = loadInitialRect(initialRect, level.initial.color, idx, level);
    if (idx != 4)
        initialRect.on('pointerdown', startAnimation);
    else
        empty.on('pointerdown', changeModifier);

    function disableModifier(modifier) {
        modifier.interactive = false;
        modifier.buttonMode = false;
        modifier.off('pointerdown', changeModifier);
        app.stage.removeChild(modifier);
    }
    
    function enableModifier(modifier) {
        modifier.x = modifierPos[0];
        modifier.y = 88;
        modifier.interactive = true;
        modifier.buttonMode = true;
        modifier.on('pointerdown', changeModifier);
        app.stage.addChildAt(modifier, 3);
    }

    function changeModifier() {
        initialRect.interactive = true;
        initialRect.buttonMode = true;
        initialRect.on('pointerdown', startAnimation);
        var modifiersArray = [expand, shrink, blue];
        disableModifier(modifiers[0]);
        var index = 0;
        if (modifiers[0] != empty)
            index = modifiersArray.indexOf(modifiers[0]) + 1;
        modifiers = [modifiersArray[index % modifiersArray.length]];
        enableModifier(modifiers[0]);
    }

    function startAnimation() {
        initialRect.interactive = false;
        initialRect.buttonMode = false;
        modifiers[0].interactive = false;
        modifiers[0].buttonMode = false;
        moveToModifier(0);
    }

    function moveToModifier(i) {
        TweenMax.to(initialRect, 1.5, {x: modifierPos[i], ease: SteppedEase.config(6),
            onComplete: applyModifier, onCompleteParams:[i]});
    }

    function moveToValidation(i) {
        TweenMax.to(initialRect, 1.5, {x: 258, ease: SteppedEase.config(6), onComplete: validate});
    }

    function validate() {
        if (initialRect.height == 24*level.final.size && initialColor == finalColor)
            currentLevel++;
        if (currentLevel > 4)
            endApp();
        else
            loadLevel(currentLevel);
    }

    function applyModifier(i) {
        app.stage.removeChild(modifiers[i]);
        var nextFunction;
        if (i >= modifiers.length-1)
            nextFunction = moveToValidation;
        else
            nextFunction = moveToModifier;
        if (modifiers[i] == expand)
            TweenMax.to(initialRect, 1, {y: 76, height: 48, ease: SteppedEase.config(6),
                onComplete: nextFunction, onCompleteParams:[i+1]});
        else if (modifiers[i] == shrink)
            TweenMax.to(initialRect, 1, {y: 88, height: 24, ease: SteppedEase.config(6),
                onComplete: nextFunction, onCompleteParams:[i+1]});
        else if (modifiers[i] == blue)
            applyBlueModifier(nextFunction, i);
    }

    function applyBlueModifier(nextFunction, i) {
        var newRect = new PIXI.Graphics();
        newRect.beginFill(0x0000FF, 1);
        newRect.x = initialRect.x;
        newRect.y = initialRect.y;
        newRect.drawRect(0, 0, initialRect.width, initialRect.height);
        newRect.tint = 0xFFFFFF;
        initialRect.blendMode = PIXI.BLEND_MODES.ADD;
        TweenMax.to(initialRect, 1, {tint: 0x000000, ease: SteppedEase.config(6),
            onComplete: nextFunction, onCompleteParams:[i+1]});
        app.stage.addChildAt(newRect, app.stage.getChildIndex(initialRect));
        initialRect = newRect;
        initialColor = 0x0000FF;
    }
}

function endApp() {
    app.stage.removeChildren();
    app.stage.addChild(theEnd);
}

