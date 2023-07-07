import Innertube, { IParsedResponse } from 'volumio-youtubei.js';
export declare abstract class BaseModel {
    protected getInnertube(): Innertube | null;
    protected expandSectionList(response: IParsedResponse): Promise<void>;
}
//# sourceMappingURL=BaseModel.d.ts.map