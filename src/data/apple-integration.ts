import applescript from "node-osascript";

export const executor = async (script: string, variables: {[key: string]: any} | null = null): Promise<unknown> => {
    return new Promise((resolve, reject) => {
        let childProcess = applescript.execute(script, variables, (err: any, res: any, raw: any) => {
            if(err) reject(err);
            resolve(res);
        });

        setTimeout(() => {
            childProcess.stdin.pause();
            childProcess.kill();
            reject("Apple Script timed out")
        }, 30000)
    })
}

