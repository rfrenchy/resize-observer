import { ResizeObserverCallback } from './ResizeObserverCallback';
declare class ResizeObserver {
    constructor(callback: ResizeObserverCallback);
    observe(target: Element): void;
    unobserve(target: Element): void;
    disconnect(): void;
    destroy(): void;
}
declare const install: () => typeof ResizeObserver;
export { install, ResizeObserver, };
