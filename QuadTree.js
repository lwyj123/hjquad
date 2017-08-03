(function(global) {
    var QuadTree = function QuadTree(bounds, level) {
        if (!(this instanceof QuadTree)) return;
        this.objects = [];
        this.nodes = [];
        this.level = typeof level === 'undefined' ? 0 : level;
        this.bounds = bounds;
    },
    cacheArr = [],
    concatArr, spliceArr;

    concatArr = function(targetArr) {
        var arr, i;
        for (i = 1; i < arguments.length; i++) {
            arr = arguments[i];
            Array.prototype.push.apply(targetArr, arr);
        }
    };

    spliceArr = function(arr, index, num) {
        var i, len;
        for (i = index + num, len = arr.length; i < len; i++) {
            arr[i - num] = arr[i];
        }
        arr.length = len - num;
    };

    // 常量
    QuadTree.prototype.MAX_OBJECTS = 10;
    QuadTree.prototype.MAX_LEVELS = 5;

    // 清空子节点
    QuadTree.prototype.clear = function() {
        var nodes = this.nodes,
            subnode;
        this.objects.splice(0, this.objects.length);
        while (nodes.length) {
            subnode = nodes.shift();
            subnode.clear();
        }
    };

    // 分裂
    QuadTree.prototype.split = function() {
        var level = this.level,
            bounds = this.bounds,
            x = bounds.x,
            y = bounds.y,
            sWidth = bounds.sWidth,
            sHeight = bounds.sHeight;

        this.nodes.push(
            new QuadTree(new Rect(bounds.cX, y, sWidth, sHeight), level + 1),
            new QuadTree(new Rect(x, y, sWidth, sHeight), level + 1),
            new QuadTree(new Rect(x, bounds.cY, sWidth, sHeight), level + 1),
            new QuadTree(new Rect(bounds.cX, bounds.cY, sWidth, sHeight), level + 1)
        );
    };

    // 获取象限号
    QuadTree.prototype.getIndex = function(rect, checkIsInner) {
        var bounds = this.bounds,
            onTop = rect.y + rect.h <=  bounds.cY,
            onBottom = rect.y >= bounds.cY,
            onLeft = rect.x + rect.w <= bounds.cX,
            onRight = rect.x >= bounds.cX;

        // 检测矩形是否溢出象限界限
        if (checkIsInner &&
            (Math.abs(rect.cX - bounds.cX) + rect.sWidth > bounds.sWidth ||
            Math.abs(rect.cY - bounds.cY) + rect.sHeight > bounds.sHeight)) {

            return -1;
        }

        if (onTop) {
            if (onRight) {
                return 0;
            } else if (onLeft) {
                return 1;
            }
        } else if (onBottom) {
            if (onLeft) {
                return 2;
            } else if (onRight) {
                return 3;
            }
        }

        return -1;
    };

    // 插入
    QuadTree.prototype.insert = function(rect) {
        var objs = this.objects,
            i, index;

        if (this.nodes.length) {
            index = this.getIndex(rect);
            if (index !== -1) {
                this.nodes[index].insert(rect);
                return;
            }
        }
        objs.push(rect);

        if (!this.nodes.length &&
            this.objects.length > this.MAX_OBJECTS &&
            this.level < this.MAX_LEVELS) {

            this.split();

            for (i = objs.length - 1; i >= 0; i--) {
                index = this.getIndex(objs[i]);
                if (index !== -1) {
                    this.nodes[index].insert(objs.splice(i, 1)[0]);
                }
            }
        }
    };

    // 动态刷新
    QuadTree.prototype.refresh = function(root) {
        var objs = this.objects,
            rect, index, i, len;

        root = root || this;

        for (i = objs.length - 1; i >= 0; i--) {
            index = this.getIndex(objs[i], true);

            // 如果被吸收了 直接删除
            if (objs[i].w === 0 || objs[i].h === 0) {
                spliceArr(objs, i, 1);
                return;
            }
            // 如果矩形不属于该象限，则将该矩形重新插入
            if (index === -1) {
                if (this !== root) {
                    rect = objs[i];
                    spliceArr(objs, i, 1);
                    root.insert(rect);
                    // root.insert(objs.splice(i, 1)[0]);
                    
                }

            // 如果矩形属于该象限 且 该象限具有子象限，则
            // 将该矩形安插到子象限中
            } else if (this.nodes.length) {
                rect = objs[i];
                spliceArr(objs, i, 1);
                this.nodes[index].insert(rect);
                // this.nodes[index].insert(objs.splice(i, 1)[0]);
            }
        }

        // 递归刷新子象限
        for (i = 0, len = this.nodes.length; i < len; i++) {
            this.nodes[i].refresh(root);
        }
    };

    // 检索
    QuadTree.prototype.retrieve = function(rect) {
        var result = cacheArr,
            arr, i, index;

        if (this.level === 0) result.length = 0;

        concatArr(result, this.objects);

        if (this.nodes.length) {
            index = this.getIndex(rect);
            if (index !== -1) {
                this.nodes[index].retrieve(rect);
            } else {
                arr = rect.carve(this.bounds.cX, this.bounds.cY);
                for (i = arr.length - 1; i >= 0; i--) {
                    index = this.getIndex(arr[i]);
                    this.nodes[index].retrieve(rect);
                    
                }
            }
        }

        return result;
    };

    global.QuadTree = QuadTree;
})(window);

