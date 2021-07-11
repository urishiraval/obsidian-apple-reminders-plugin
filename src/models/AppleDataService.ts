import applescript from "node-osascript";
import { logger } from "src/tools";
import * as scripts from "./scripts";

const DEFAULT_TIMEOUT = 30000;

export class AppleDataService {
  private static instance: AppleDataService;
  scripts:{[key:string]: string} = scripts;

  private constructor() { }

  public static getInstance(): AppleDataService {
      if (!AppleDataService.instance) {
          AppleDataService.instance = new AppleDataService();
      }

      return AppleDataService.instance;
  }

  async fetch (script: string, variables: any, timeout = false) {
    script = this.scripts[script];
    return new Promise<any>((resolve, reject) => {
      let childProcess = applescript.execute(
        script,
        variables,
        (err: any, res: any, raw: any) => {
          if (err) {
            reject(err);
          } else resolve({ res, raw });
        }
      );

      if (timeout) {
        setTimeout(() => {
          childProcess.stdin.pause();
          childProcess.kill();
        }, DEFAULT_TIMEOUT);
      }
    });
  }
}
