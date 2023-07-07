import Innertube, { IParsedResponse, Parser, SectionListContinuation, YTNodes } from 'volumio-youtubei.js';
import ytmusic from '../YTMusicContext';

const MAX_APPEND_SECTIONS_COUNT = 10;

export abstract class BaseModel {

  protected getInnertube() {
    return ytmusic.get<Innertube>('innertube');
  }

  protected async expandSectionList(response: IParsedResponse, url: '/browse' | '/search') {
    const innertube = this.getInnertube();
    if (!innertube) {
      throw Error('Innertube API not ready');
    }
    const sectionList = response.contents_memo?.getType(YTNodes.SectionList)?.first();
    if (sectionList) {
      let sectionListContinuation = sectionList.continuation;
      if (sectionList.continuation_type !== 'next') {
        sectionListContinuation = undefined;
      }
      let appendCount = 0;
      while (sectionListContinuation && appendCount < MAX_APPEND_SECTIONS_COUNT) {
        const response = await innertube.actions.execute(url, { token: sectionListContinuation, client: 'YTMUSIC' });
        const page = Parser.parseResponse(response.data);
        if (page.continuation_contents instanceof SectionListContinuation && page.continuation_contents.contents) {
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
