'use strict';

class AutoplayHelper {

  // Every playable item is associated with a playlist, which is actually the 'queue' in
  // ytmusic (not to be confused with Volumio's queue). The autoplay context tells 
  // the plugin where to obtain further tracks for autoplay. See PlayController#_getAutoplayItems().
  static getAutoplayContext(data) {
    if (!data) {
      return null;
    }

    if (data.type === 'section') {
      let playlistId = data.playlistId || this._getCommonPlaylistIdFromEndpoints(data.contents);
      if (playlistId) {
        const items = data.contents?.filter((item) => item.type === 'song' || item.type === 'video') || [];
        if (items.length > 0) {
          return {
            playlistId,
            continueFromVideoId: items[items.length - 1].id
          };
        }
      }
      return null;
    }
    else if (data.type === 'song' || data.type === 'video') {
      return {
        playlistId: data.endpoint?.payload?.playlistId,
        params: data.endpoint?.payload?.params,
        continueFromVideoId: data.id
      };
    }
    
    return null;
  }

  static _getCommonPlaylistIdFromEndpoints(contents) {
    const hasOnlySongsAndVideos = contents?.length > 0 && 
      contents?.every((item)=> item.type === 'song' || item.type === 'video');
    if (hasOnlySongsAndVideos) {
      const playlistId = contents[0].endpoint?.payload?.playlistId;
      return contents.every((item) => item.endpoint?.payload?.playlistId === playlistId) ? playlistId : null;
    }
    return null;
  }
}

module.exports = AutoplayHelper
