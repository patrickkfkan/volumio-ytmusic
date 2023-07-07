import { ModelType } from '../../../model';
import { PageContent, WatchContent, WatchContinuationContent } from '../../../types/Content';
import { BrowseContinuationEndpoint, BrowseEndpoint, WatchContinuationEndpoint, WatchEndpoint } from '../../../types/Endpoint';
import MusicFolderViewHandler, { MusicFolderView } from './MusicFolderViewHandler';

export interface PlaylistView extends MusicFolderView {
  name: 'playlist'
}

export default class PlaylistViewHandler extends MusicFolderViewHandler<PlaylistView> {

  protected modelGetContents(endpoint: WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint |
    BrowseContinuationEndpoint): Promise<PageContent | WatchContent | WatchContinuationContent | null> {
    const model = this.getModel(ModelType.Playlist);
    return model.getContents(endpoint);
  }
}
