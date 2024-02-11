/*
 * Windows 96 WRT declarations.
 *
 * Copyright (C) Windows 96 Team 2024.
 */

declare const FS: FS;
declare const FSUtil: FSUtil;
declare const current: WRTRunContext;
declare const env: any;

/**
 * System requirements checking function
 * @param features The features to check for.
 * @param options The options to set.
 */
declare function require_check(features: string[], options: ReqCheckParams): Promise<boolean>;

/**
 * Represents a Windows 96 application class.
 * 
 * This class must be inherited to create an application, it's useless on its own.
 */
declare const WApplication: {
    /**
     * Creates a new application instance.
     */
    new(): WApplicationInstance;
    prototype: WApplicationInstance;

    /**
     * Kills the specified process.
     * @param appId The id of the process/application to kill.
     * @param force Specifies whether to force the operation.
     */
    kill(appId: number, force: boolean): Promise<void>;

    /**
     * Execute the specified application instance asynchronously.
     * @param appInstance The application instance to execute asynchronously.
     */
    execAsync(appInstance: WApplicationInstance, args: string[], executionContext?: WApplicationExecCtx): Promise<any>;
}

/** Include helper function. Added by WRT automatically. */
declare function include(path: string, opts?: WRTIncludeOptions): Promise<any>;