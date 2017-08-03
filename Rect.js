(function(global) {
    var Rect = function Rect(x, y, width, height, speedArr) {
        if (!(this instanceof Rect)) return;
        this.speedArr = speedArr || [20, 20];
        this.nextSpeedArr = this.speedArr.slice();
        this.resize(width, height);
        this.moveTo(x, y);
    }, 
    tempRectArr = [];

    Rect.prototype.moveTo = function(x, y) {
        this.x = x;
        this.y = y;
        this.cX = x + this.sWidth;
        this.cY = y + this.sHeight;
    };

    Rect.prototype.resize = function(width, height) {
        this.w = width;
        this.h = height;
        this.sWidth = width / 2;
        this.sHeight = height / 2;
    };

    tempRectArr.push(
        new Rect(0, 0, 0, 0),
        new Rect(0, 0, 0, 0)
    );

    Rect.prototype.draw = function(cxt) {
        cxt.save();
        cxt.beginPath();
        cxt.rect(this.x, this.y, this.w, this.h);
        cxt.closePath();
        cxt.restore();
    };

    Rect.prototype.run = function(time) {
        time = time || 16;
        this.speedArr[0] = this.nextSpeedArr[0];
        this.speedArr[1] = this.nextSpeedArr[1];

        this.moveTo(
            this.x + this.speedArr[0] * time / 1000,
            this.y + this.speedArr[1] * time / 1000
        );
    };

    Rect.prototype.copy = function(rect) {
        this.resize(rect.w, rect.h);
        this.moveTo(rect.x, rect.y);
        this.nextSpeedArr[0] = rect.speedArr[0];
        this.nextSpeedArr[1] = rect.speedArr[1];
    };

    Rect.prototype.init = function(x, y, w, h, speedArr) {
        this.resize(w, h);
        this.moveTo(x, y);
    };

    // 改变碰撞后运动方向
    Rect.prototype.collide = function(rect, isInner) {
        if (!(rect instanceof Rect)) return;

        var tRect1 = tempRectArr[0], 
            tRect2 = tempRectArr[1],
            thisRect, sWidthSum, sHeightSum, dWidth, dHeight,
            onHorizontal, onVertical, focusPoint;

        if (!isInner) {

            tRect1.copy(this);
            tRect2.copy(rect);

            // 判断碰撞方向
            sWidthSum = tRect1.sWidth + tRect2.sWidth;
            sHeightSum = tRect1.sHeight + tRect2.sHeight;
            dWidth = sWidthSum - Math.abs(tRect1.cX - tRect2.cX);
            dHeight = sHeightSum - Math.abs(tRect1.cY - tRect2.cY);

            while (dWidth > 0 && dHeight > 0) {
                tRect1.run(-16);
                tRect2.run(-16);
                dWidth = sWidthSum - Math.abs(tRect1.cX - tRect2.cX);
                dHeight = sHeightSum - Math.abs(tRect1.cY - tRect2.cY);
            }

            onHorizontal = dWidth <= 0;
            onVertical = dHeight <= 0;

            // 改变方向
            if (onHorizontal) {
                focusPoint = this.cX > rect.cX ? 1 : -1;
                this.nextSpeedArr[0] = focusPoint * 
                    (Math.abs(this.nextSpeedArr[0]) + Math.abs(rect.speedArr[0])) / 2;
            }

            if (onVertical) {
                focusPoint = tRect1.cY > tRect2.cY ? 1 : -1;
                this.nextSpeedArr[1] = focusPoint * 
                    (Math.abs(this.nextSpeedArr[1]) + Math.abs(rect.speedArr[1])) / 2;
            }

        } else {
            if (Math.abs(this.cX - rect.cX) + this.sWidth > rect.sWidth) {
                this.nextSpeedArr[0] = -(this.nextSpeedArr[0] || this.speedArr[0]);
                this.moveTo(this.cX > rect.cX ? 
                    rect.x + rect.w - this.w : rect.x, this.y);
            }
            if (Math.abs(this.cY - rect.cY) + this.sHeight > rect.sHeight) {
                this.nextSpeedArr[1] = -(this.nextSpeedArr[1] || this.speedArr[1]);
                this.moveTo(this.x, this.cY > rect.cY ? 
                    rect.y + rect.h - this.h : rect.y);
            }
        }
    };

    Rect.prototype.carve = function(cX, cY) {
        var result = [],
            temp = [],
            dX = cX - this.x,
            dY = cY - this.y,
            carveX = dX > 0 && dX < this.w,
            carveY = dY > 0 && dY < this.h;

        // 切割XY方向
        if (carveX && carveY) {
            temp = this.carve(cX, this.y);
            while (temp.length) {
                result = result.concat(temp.shift().carve(this.x, cY));
            }

        // 只切割X方向
        } else if (carveX) {
            result.push(
                new Rect(this.x, this.y, dX, this.h),
                new Rect(cX, this.y, this.w - dX, this.h)
            );
        
        // 只切割Y方向
        } else if (carveY) {
            result.push(
                new Rect(this.x, this.y, this.w, dY),
                new Rect(this.x, cY, this.w, this.h - dY)
            );
        }

        return result;
    };

    // 检查两个矩形是否互相接近
    Rect.isApproach = function(rect1, rect2) {
        // var tempRect1 = rect1.copy(),
        //     tempRect2 = rect2.copy();

        // tempRect1.run();
        // tempRect2.run();

        // return +(Math.pow(rect1.cX - rect2.cX, 2) - Math.pow(tempRect1.cX - tempRect2.cX, 2) +
        //     Math.pow(rect1.cY - rect2.cY, 2) - Math.pow(tempRect1.cY - tempRect2.cY, 2)).toFixed(6) > 0 ?
        //     true : false;

        var tRect1 = tempRectArr[0],
            tRect2 = tempRectArr[1];

        tRect1.copy(rect1);
        tRect2.copy(rect2);

        tRect1.run();
        tRect2.run();

        return +(Math.pow(rect1.cX - rect2.cX, 2) - Math.pow(tRect1.cX - tRect2.cX, 2) +
            Math.pow(rect1.cY - rect2.cY, 2) - Math.pow(tRect1.cY - tRect2.cY, 2)).toFixed(6) > 0 ?
            true : false;


        // var dX, dY;

        // dX = rect1.cX + rect1.speedArr[0] * 0.016 - rect2.cX + rect2.speedArr[0] * 0.016;
        // dY = rect1.cY + rect1.speedArr[1] * 0.016 - rect2.cY + rect2.speedArr[1] * 0.016;

        // return +(Math.pow(rect1.cX - rect2.cX, 2) - Math.pow(dX, 2) +
        //     Math.pow(rect1.cY - rect2.cY, 2) - Math.pow(dY, 2)).toFixed(6) > 0 ?
        //     true : false;
    };

    // 检查矩形是否发生碰撞
    Rect.isCollide = function(rect1, rect2) {
        if (Math.abs(rect1.cX - rect2.cX) < rect1.sWidth + rect2.sWidth &&
            Math.abs(rect1.cY - rect2.cY) < rect1.sHeight + rect2.sHeight &&
            Rect.isApproach(rect1, rect2)) {

            rect1.collide(rect2);
            rect2.collide(rect1);
            return true;
        }
        return false;
    };

    global.Rect = Rect;
})(window);