"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ResizeObservation_1 = require("./ResizeObservation");
var ResizeObserverEntry_1 = require("./ResizeObserverEntry");
var resizeObservers = [];
var ResizeObserver = /** @class */ (function () {
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
}());
exports.ResizeObserver = ResizeObserver;
function callbackGuard(callback) {
    if (typeof (callback) === 'undefined') {
        return "Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.";
    }
    if (typeof (callback) !== 'function') {
        return "Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.";
    }
}
function targetGuard(functionName, target) {
    if (typeof (target) === 'undefined') {
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
var gatherActiveObservationsAtDepth = function (depth) {
    resizeObservers.forEach(function (ro) {
        ro.$$activeTargets = [];
        ro.$$skippedTargets = [];
        ro.$$observationTargets.forEach(function (ot) {
            if (ot.isActive()) {
                var targetDepth = calculateDepthForNode(ot.target);
                if (targetDepth > depth) {
                    ro.$$activeTargets.push(ot);
                }
                else {
                    ro.$$skippedTargets.push(ot);
                }
            }
        });
    });
};
var hasActiveObservations = function () {
    return resizeObservers.some(function (ro) { return !!ro.$$activeTargets.length; });
};
var hasSkippedObservations = function () {
    return resizeObservers.some(function (ro) { return !!ro.$$skippedTargets.length; });
};
var broadcastActiveObservations = function () {
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
var deliverResizeLoopErrorNotification = function () {
    var errorEvent = new window.ErrorEvent('ResizeLoopError', {
        message: 'ResizeObserver loop completed with undelivered notifications.',
    });
    window.dispatchEvent(errorEvent);
};
var calculateDepthForNode = function (target) {
    var depth = 0;
    while (target.parentNode) {
        target = target.parentNode;
        depth += 1;
    }
    return depth;
};
var notificationIteration = function () {
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
var startLoop = function () {
    if (animationFrameCancelToken)
        return;
    runLoop();
};
var runLoop = function () {
    animationFrameCancelToken = window.requestAnimationFrame(function () {
        notificationIteration();
        runLoop();
    });
};
var checkStopLoop = function () {
    if (animationFrameCancelToken && !resizeObservers.some(function (ro) { return !!ro.$$observationTargets.length; })) {
        window.cancelAnimationFrame(animationFrameCancelToken);
        animationFrameCancelToken = undefined;
    }
};
var install = function () {
    return window.ResizeObserver = ResizeObserver;
};
exports.install = install;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVzaXplT2JzZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvUmVzaXplT2JzZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5REFBd0Q7QUFFeEQsNkRBQTREO0FBRTVELElBQU0sZUFBZSxHQUFHLEVBQXNCLENBQUM7QUFFL0M7SUFVSSx3QkFBWSxRQUFnQztRQVA1QyxnQkFBZ0I7UUFDVCx5QkFBb0IsR0FBRyxFQUF5QixDQUFDO1FBQ3hELGdCQUFnQjtRQUNULG9CQUFlLEdBQUcsRUFBeUIsQ0FBQztRQUNuRCxnQkFBZ0I7UUFDVCxxQkFBZ0IsR0FBRyxFQUF5QixDQUFDO1FBR2hELElBQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4QyxJQUFJLE9BQU8sRUFBRTtZQUNULE1BQU0sU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUM7UUFDM0IsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRU0sZ0NBQU8sR0FBZCxVQUFlLE1BQWU7UUFDMUIsSUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMvQyxJQUFJLE9BQU8sRUFBRTtZQUNULE1BQU0sU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsSUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNqRSxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7WUFDWCxPQUFPO1NBQ1Y7UUFDRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLElBQUkscUNBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM5RCxTQUFTLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBRU0sa0NBQVMsR0FBaEIsVUFB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