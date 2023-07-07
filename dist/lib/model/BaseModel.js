"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseModel = void 0;
const volumio_youtubei_js_1 = require("volumio-youtubei.js");
const YTMusicContext_1 = __importDefault(require("../YTMusicContext"));
const MAX_APPEND_SECTIONS_COUNT = 10;
class BaseModel {
    getInnertube() {
        return YTMusicContext_1.default.get('innertube');
    }
    async expandSectionList(response) {
        const innertube = this.getInnertube();
        if (!innertube) {
            throw Error('Innertube API not ready');
        }
        const sectionList = response.contents_memo?.getType(volumio_youtubei_js_1.YTNodes.SectionList)?.first();
        if (sectionList) {
            let sectionListContinuation = sectionList.continuation;
            if (sectionList.continuationType !== 'next') {
                sectionListContinuation = undefined;
            }
            let appendCount = 0;
            while (sectionListContinuation && appendCount < MAX_APPEND_SECTIONS_COUNT) {
                const response = await innertube.actions.execute('/browse', { token: sectionListContinuation, client: 'YTMUSIC' });
                const page = volumio_youtubei_js_1.Parser.parseResponse(response.data);
                if (page.continuation_contents instanceof volumio_youtubei_js_1.SectionListContinuation && page.continuation_contents.contents) {
                    sectionList.contents.push(...page.continuation_contents.contents);
                    sectionListContinuation = page.continuation_contents.continuation;
                    appendCount++;
                }
                else {
                    break;
                }
            }
            delete sectionList.continuation;
        }
    }
}
exports.BaseModel = BaseModel;
//# sourceMappingURL=BaseModel.js.map