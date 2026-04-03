import ytmusic from '../../YTMusicContext';
import { MPVService, VLCService } from 'volumio-ext-players';

export type ExternalPlayer = 'vlc' | 'mpv';

type PlayerMap = Record<ExternalPlayer, MPVService | VLCService | null>;

async function startMpv() {
  ytmusic.toast('info', ytmusic.getI18n('YTMUSIC_STARTING_PLAYER', 'mpv'));
  try {
    const mpv = new MPVService({
      serviceName: 'ytmusic',
      logger: ytmusic.getLogger(),
      volumio: {
        commandRouter: ytmusic.volumioCoreCommand,
        mpdPlugin: ytmusic.getMpdPlugin(),
        statemachine: ytmusic.getStateMachine()
      }
    });
    await mpv.start();
    return mpv;
  }
  catch (error) {
   throw Error(ytmusic.getErrorMessage(ytmusic.getI18n('YTMUSIC_ERR_PLAYER_START', 'mpv'), error));
  }
}

async function startVLC() {
  ytmusic.toast('info', ytmusic.getI18n('YTMUSIC_STARTING_PLAYER', 'VLC'));
  try {
    const vlc = new VLCService({
      serviceName: 'ytmusic',
      logger: ytmusic.getLogger(),
      volumio: {
        commandRouter: ytmusic.volumioCoreCommand,
        mpdPlugin: ytmusic.getMpdPlugin(),
        statemachine: ytmusic.getStateMachine()
      }
    });
    await vlc.start();
    return vlc;
  }
  catch (error) {
    throw Error(ytmusic.getErrorMessage(ytmusic.getI18n('YTMUSIC_ERR_PLAYER_START', 'VLC'), error));
  }
}

export class ExternalPlayers {
  static #players: PlayerMap = {
    vlc: null,
    mpv: null
  };

  static async get(player: ExternalPlayer) {
    if (this.#players[player]) {
      return this.#players[player];
    }
    let startPromise;
    switch (player) {
      case 'mpv':
        startPromise = startMpv();
        break;
      case 'vlc':
        startPromise = startVLC();
        break;
    }
    ytmusic.getLogger().info(`[ytmusic] Going to start ${player} for playback`);
    const playerName = this.#getPlayerName(player);
    try {
      const p = await startPromise;
      p.once('close', (code) => {
        if (code && code !== 0) {
          ytmusic.toast('warning', ytmusic.getI18n('YTMUSIC_PLAYER_CLOSED_UNEXPECTEDLY', playerName))
        }
        ytmusic.getLogger().info(`[ytmusic] ${player} process closed`);
        this.#players[player] = null;
      });
      this.#players[player] = p;
      return p;
    }
    catch (error) {
      ytmusic.toast('error', ytmusic.getErrorMessage(ytmusic.getI18n('YTMUSIC_ERR_PLAYER_START', playerName), error));
      return null;
    }
  }

  static stop(player: ExternalPlayer) {
    const p = this.#players[player];
    if (p && p.isActive()) {
      return p.stop();
    }
  }

  static getActive() {
    return Object.values(this.#players).find((p) => p && p.isActive()) ?? null;
  }

  static async quit(player: ExternalPlayer) {
    const p = this.#players[player];
    if (p) {
      try {
        await p.quit();
      }
      catch (error) {
        ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_PLAYER_QUIT', this.#getPlayerName(player), ytmusic.getErrorMessage('', error, false)));
      }
      finally {
        this.#players[player] = null;
      }
    }
  }

  static quitAll() {
    return Promise.all(Object.keys(this.#players).map((player) => this.quit(player as ExternalPlayer)));
  }

  static #getPlayerName(player: ExternalPlayer) {
    switch (player) {
      case 'mpv':
        return 'mpv';
      case 'vlc':
        return 'VLC';
    }
  }
}