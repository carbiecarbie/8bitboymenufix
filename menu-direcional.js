/* 8BitBoy 1.5.3: snap the existing gamepad cursor to menu controls. */
(function () {
    'use strict';

    var menuIds = [297, 298, 301, 305, 313, 314, 315, 316, 317, 319, 320,
        321, 322, 323, 324, 341, 343, 344, 345, 348, 412, 413, 414, 415,
        416, 417, 418, 419, 420, 428, 436, 448, 452, 453, 499, 502, 503,
        568, 636, 665, 666, 672, 686, 775, 793];
    var menuLayouts = /^(TitleScreen|Worlds|LevelSelection|Difficulty|Credits|Manual\d*|LoadLast|Disclaimer)$/;
    var previous = [false, false, false, false];
    var selected = null;
    var lastLayout = null;

    function objects(runtime, id) {
        var type = runtime.qa[id];
        return type && type.F || [];
    }

    function findTargets(runtime) {
        var result = [], confirms = [], i, j, item, layer, cx, cy;
        if (!runtime.lb || !objects(runtime, 346).length) return result;
        // In levels the panel must actually be open; never steal movement in play.
        if (!menuLayouts.test(runtime.lb.name) && !objects(runtime, 310).length) return result;
        for (i = 0; i < menuIds.length; i++) {
            var all = objects(runtime, menuIds[i]);
            for (j = 0; j < all.length; j++) {
                item = all[j]; layer = item.T;
                if (!layer || !layer.visible || item.visible === false || item.opacity <= 0) continue;
                item.ib();
                cx = layer.pc((item.Cb.left + item.Cb.right) / 2, (item.Cb.top + item.Cb.bottom) / 2, true);
                cy = layer.pc((item.Cb.left + item.Cb.right) / 2, (item.Cb.top + item.Cb.bottom) / 2, false);
                if (!isFinite(cx) || !isFinite(cy) || cx < 0 || cy < 0 || cx >= runtime.width || cy >= runtime.height) continue;
                var target = { item: item, x: cx, y: cy, id: menuIds[i] };
                result.push(target);
                if (menuIds[i] === 322 || menuIds[i] === 323) confirms.push(target);
            }
        }
        return confirms.length ? confirms : result;
    }

    function navigate(runtime, targets, direction) {
        var cursor = objects(runtime, 346)[0], current = null, i;
        if (!cursor || !targets.length) return;
        for (i = 0; i < targets.length; i++) if (targets[i].item.uid === selected) current = targets[i];
        if (!current) {
            // A fresh menu starts with the first visible choice, or the last when going up.
            var extreme = targets[0].y;
            for (i = 1; i < targets.length; i++) {
                extreme = direction === 0 ? Math.max(extreme, targets[i].y) : Math.min(extreme, targets[i].y);
            }
            // Entries on one row can differ slightly in height and animation.
            current = null;
            for (i = 0; i < targets.length; i++) {
                if (Math.abs(targets[i].y - extreme) <= runtime.height * 0.02 &&
                    (!current || targets[i].x < current.x)) current = targets[i];
            }
        } else {
            var best = null, bestScore = Infinity, dx, dy, forward, sideways, score;
            for (i = 0; i < targets.length; i++) {
                dx = targets[i].x - current.x; dy = targets[i].y - current.y;
                forward = direction === 0 ? -dy : direction === 1 ? dy : direction === 2 ? -dx : dx;
                sideways = direction < 2 ? Math.abs(dx) : Math.abs(dy);
                if (forward <= 2) continue;
                score = forward + sideways * 2;
                if (score < bestScore) { bestScore = score; best = targets[i]; }
            }
            if (best) current = best;
        }
        selected = current.item.uid;
        // When the game's GamePad setting is off, its events copy the mouse
        // position back onto the cursor every frame. Keep both in sync.
        var mouse = objects(runtime, 299)[0];
        if (mouse) { mouse.hj = current.x; mouse.ij = current.y; }
        // Cursor hotspot is at its upper left; its collision polygon lies just inside it.
        cursor.x = cursor.T.Id(current.x, current.y, true) - 3;
        cursor.y = cursor.T.Id(current.x, current.y, false) - 3;
        cursor.X();
        runtime.Fa = true;
    }

    function install() {
        var r = window.cr_getC2Runtime && window.cr_getC2Runtime();
        var gamepad = r && objects(r, 23)[0];
        if (!gamepad || !gamepad.Ab) { window.setTimeout(install, 200); return; }
        var original = gamepad.Ab;
        gamepad.Ab = function () {
            original.apply(this, arguments);
            try {
                var pad = this.Vf && this.Vf[0];
                if (!pad || !pad.Jc || !r.lb) { previous = [false, false, false, false]; return; }
                var targets = findTargets(r);
                if (lastLayout !== r.lb.name) { selected = null; lastLayout = r.lb.name; }
                var i, pressed;
                for (i = 0; i < 4; i++) {
                    pressed = pad.Jc[12 + i] >= 50;
                    if (targets.length && pressed && !previous[i]) navigate(r, targets, i);
                    previous[i] = pressed;
                }
                // The game otherwise moves the cursor two pixels every frame.
                // Suppress only D-pad cursor movement while a recognized menu is open.
                if (targets.length) for (i = 12; i <= 15; i++) pad.Jc[i] = 0;
            } catch (ignore) {
                // A mod failure must not stop the game loop.
            }
        };
    }
    install();
}());
