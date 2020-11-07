import { logger } from "../tools";
import { AppleData, QueryString } from "../interfaces";
import Engine from './BlackApple';

class AppleApi {
    private static instance: AppleApi;
    private engine:Engine;
    private constructor() { 
        this.engine = new Engine();
    }
    public static get Instance() {
        return this.instance || (this.instance = new this());
    }

    submit(query: QueryString): Promise<AppleData> {
        logger(this, "Processing Query", query);
        return this.engine.process(query);
    }
}

export default AppleApi.Instance;

