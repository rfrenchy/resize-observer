(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ContentRect = function ContentRect(target) {
    if ('getBBox' in target) {
        var box = target.getBBox();
        return Object.freeze({
            height: box.height,
            left: 0,
            top: 0,
            width: box.width
        });
    } else {
        // if (target instanceof HTMLElement) { // also includes all other non-SVGGraphicsElements
        var styles = window.getComputedStyle(target);
        return Object.freeze({
            height: parseFloat(styles.height || '0'),
            left: parseFloat(styles.paddingLeft || '0'),
            top: parseFloat(styles.paddingTop || '0'),
            width: parseFloat(styles.width || '0')
        });
    }
};
exports.ContentRect = ContentRect;

},{}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ContentRect_1 = require("./ContentRect");
var ResizeObservation = /** @class */function () {
    function ResizeObservation(target) {
        this.target = target;
        this.$$broadcastWidth = this.$$broadcastHeight = 0;
    }
    Object.defineProperty(ResizeObservation.prototype, "broadcastWidth", {
        get: function get() {
            return this.$$broadcastWidth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ResizeObservation.prototype, "broadcastHeight", {
        get: function get() {
            return this.$$broadcastHeight;
        },
        enumerable: true,
        configurable: true
    });
    ResizeObservation.prototype.isActive = function () {
        var cr = ContentRect_1.ContentRect(this.target);
        return !!cr && (cr.width !== this.broadcastWidth || cr.height !== this.broadcastHeight);
    };
    return ResizeObservation;
}();
exports.ResizeObservation = ResizeObservation;

},{"./ContentRect":1}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ResizeObservation_1 = require("./ResizeObservation");
var ResizeObserverEntry_1 = require("./ResizeObserverEntry");
var resizeObservers = [];
var ResizeObserver = /** @class */function () {
    function ResizeObserver(callback) {
        /** @internal */
        this.$$observationTargets = [];
        /** @internal */
        this.$$activeTargets = [];
        /** @internal */
        this.$$skippedTargets = [];
        var message = callbackGuard(callback);
        if (message) {
            throw TypeError(message);
        }
        this.$$callback = callback;
        resizeObservers.push(this);
    }
    ResizeObserver.prototype.observe = function (target) {
        var message = targetGuard('observe', target);
        if (message) {
            throw TypeError(message);
        }
        var index = findTargetIndex(this.$$observationTargets, target);
        if (index > 0) {
            return;
        }
        this.$$observationTargets.push(new ResizeObservation_1.ResizeObservation(target));
        startLoop();
    };
    ResizeObserver.prototype.unobserve = function (target) {
        var message = targetGuard('unobserve', target);
        if (message) {
            throw TypeError(message);
        }
        var index = findTargetIndex(this.$$observationTargets, target);
        if (index < 0) {
            return;
        }
        this.$$observationTargets.splice(index, 1);
        checkStopLoop();
    };
    ResizeObserver.prototype.disconnect = function () {
        this.$$observationTargets = [];
        this.$$activeTargets = [];
    };
    ResizeObserver.prototype.destroy = function () {
        this.$$observationTargets = [];
        this.$$activeTargets = [];
        this.$$callback = undefined;
        resizeObservers.splice(resizeObservers.indexOf(this), 1);
    };
    return ResizeObserver;
}();
exports.ResizeObserver = ResizeObserver;
function callbackGuard(callback) {
    if (typeof callback === 'undefined') {
        return "Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.";
    }
    if (typeof callback !== 'function') {
        return "Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.";
    }
}
function targetGuard(functionName, target) {
    if (typeof target === 'undefined') {
        return "Failed to execute '" + functionName + "' on 'ResizeObserver': 1 argument required, but only 0 present.";
    }
    if (!(target instanceof window.Element)) {
        return "Failed to execute '" + functionName + "' on 'ResizeObserver': parameter 1 is not of type 'Element'.";
    }
}
function findTargetIndex(collection, target) {
    for (var index = 0; index < collection.length; index += 1) {
        if (collection[index].target === target) {
            return index;
        }
    }
    return -1;
}
var gatherActiveObservationsAtDepth = function gatherActiveObservationsAtDepth(depth) {
    resizeObservers.forEach(function (ro) {
        ro.$$activeTargets = [];
        ro.$$skippedTargets = [];
        ro.$$observationTargets.forEach(function (ot) {
            if (ot.isActive()) {
                var targetDepth = calculateDepthForNode(ot.target);
                if (targetDepth > depth) {
                    ro.$$activeTargets.push(ot);
                } else {
                    ro.$$skippedTargets.push(ot);
                }
            }
        });
    });
};
var hasActiveObservations = function hasActiveObservations() {
    return resizeObservers.some(function (ro) {
        return !!ro.$$activeTargets.length;
    });
};
var hasSkippedObservations = function hasSkippedObservations() {
    return resizeObservers.some(function (ro) {
        return !!ro.$$skippedTargets.length;
    });
};
var broadcastActiveObservations = function broadcastActiveObservations() {
    var shallowestTargetDepth = Infinity;
    resizeObservers.forEach(function (ro) {
        if (!ro.$$activeTargets.length) {
            return;
        }
        var entries = [];
        ro.$$activeTargets.forEach(function (obs) {
            var entry = new ResizeObserverEntry_1.ResizeObserverEntry(obs.target);
            entries.push(entry);
            obs.$$broadcastWidth = entry.contentRect.width;
            obs.$$broadcastHeight = entry.contentRect.height;
            var targetDepth = calculateDepthForNode(obs.target);
            if (targetDepth < shallowestTargetDepth) {
                shallowestTargetDepth = targetDepth;
            }
        });
        ro.$$callback(entries, ro);
        ro.$$activeTargets = [];
    });
    return shallowestTargetDepth;
};
var deliverResizeLoopErrorNotification = function deliverResizeLoopErrorNotification() {
    var errorEvent = new window.ErrorEvent('ResizeLoopError', {
        message: 'ResizeObserver loop completed with undelivered notifications.'
    });
    window.dispatchEvent(errorEvent);
};
var calculateDepthForNode = function calculateDepthForNode(target) {
    var depth = 0;
    while (target.parentNode) {
        target = target.parentNode;
        depth += 1;
    }
    return depth;
};
var notificationIteration = function notificationIteration() {
    var depth = 0;
    gatherActiveObservationsAtDepth(depth);
    while (hasActiveObservations()) {
        depth = broadcastActiveObservations();
        gatherActiveObservationsAtDepth(depth);
    }
    if (hasSkippedObservations()) {
        deliverResizeLoopErrorNotification();
    }
};
var animationFrameCancelToken;
var startLoop = function startLoop() {
    if (animationFrameCancelToken) return;
    runLoop();
};
var runLoop = function runLoop() {
    animationFrameCancelToken = window.requestAnimationFrame(function () {
        notificationIteration();
        runLoop();
    });
};
var checkStopLoop = function checkStopLoop() {
    if (animationFrameCancelToken && !resizeObservers.some(function (ro) {
        return !!ro.$$observationTargets.length;
    })) {
        window.cancelAnimationFrame(animationFrameCancelToken);
        animationFrameCancelToken = undefined;
    }
};
var install = function install() {
    return window.ResizeObserver = ResizeObserver;
};
exports.install = install;

},{"./ResizeObservation":2,"./ResizeObserverEntry":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ContentRect_1 = require("./ContentRect");
var ResizeObserverEntry = /** @class */function () {
    function ResizeObserverEntry(target) {
        this.target = target;
        this.contentRect = ContentRect_1.ContentRect(target);
    }
    return ResizeObserverEntry;
}();
exports.ResizeObserverEntry = ResizeObserverEntry;

},{"./ContentRect":1}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ResizeObserver_1 = require("./ResizeObserver");
ResizeObserver_1.install();

},{"./ResizeObserver":3}]},{},[5]);
