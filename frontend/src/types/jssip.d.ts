declare module 'jssip' {
    export class WebSocketInterface {
        constructor(url: string);
    }

    export class UA {
        constructor(config: any);
        start(): void;
        stop(): void;
        call(target: string, options?: any): any;
        on(event: string, handler: (...args: any[]) => void): void;
    }
}
