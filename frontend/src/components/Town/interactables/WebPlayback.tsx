import { Modal, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';
import React, { useState, useEffect, useRef } from 'react';
import KaraokeAreaController from '../../../classes/KaraokeAreaController';
import useTownController from '../../../hooks/useTownController';
import Searcher from './KaraokeAreaComponents/Searcher';
import SongQueue from './KaraokeAreaComponents/songQueue';

const ALLOWED_DRIFT = 1;

const fetchPlus: (
  url: string,
  options: RequestInit,
  retries: number,
) => Promise<void | Response | undefined> = async (
  url: string,
  options: RequestInit,
  retries: number,
) =>
  fetch(url, options)
    .then(res => {
      if (res.ok) {
        return res;
      }
      if (retries > 0) {
        console.log('retrying');
        setTimeout(() => {
          return fetchPlus(url, options, retries - 1);
        }, 1000);
      }
      //throw new Error(res.status)
    })
    .catch(error => console.error(error.message));

function millisToMinutesAndSeconds(millis: number): string {
  const minutes = Math.floor(millis / 60000);
  const seconds = parseInt(((millis % 60000) / 1000).toFixed(0));
  return seconds == 60 ? minutes + 1 + ':00' : minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

function WebPlayback(props: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  token: string;
  controller: KaraokeAreaController;
  player?: Spotify.Player;
  setPlayer: (data: Spotify.Player) => void;
  intervalID?: NodeJS.Timer;
  setIntervalID: (data: NodeJS.Timer) => void;
}): JSX.Element {
  const townController = useTownController();
  const [isPlaying, setPlaying] = useState<boolean>(props.controller.isPlaying);
  const [currentTrack, setTrack] = useState<Spotify.Track | undefined>();
  const [currentTime, setTime] = useState<number>(props.controller.elapsedTimeSec);
  const [currentQueue, setQueue] = useState<string[]>(props.controller.songQueue);
  const [deviceID, setDeviceID] = useState('');

  const timeRef = useRef(currentTime);
  const trackRef = useRef(currentTrack);

  const setMyTrack = (data: Spotify.Track) => {
    trackRef.current = data;
    setTrack(data);
  };

  const setMyTime = (data: number) => {
    timeRef.current = data;
    setTime(data);
  };

  const playSong = async (id: string | undefined) => {
    if (id === undefined) {
      console.log('ID is undefined');
      return;
    }
    await fetchPlus(
      `https://api.spotify.com/v1/tracks/${id}`,
      {
        method: 'GET',
        headers: {
          'authorization': `Bearer${props.token}`,
          'Content-Type': 'application/json',
        },
      },
      3,
    ).then(response => {
      response?.json().then(async (result: Spotify.Track) => {
        console.log(props.controller.elapsedTimeSec * 1000);
        setMyTrack(result);
        await fetchPlus(
          `https://api.spotify.com/v1/me/player/play`,
          {
            method: 'PUT',
            headers: {
              'authorization': `Bearer ${props.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              device_id: deviceID,
              uris: [result.uri],
              position_ms: props.controller.elapsedTimeSec * 1000,
            }),
          },
          3,
        ).catch(error => console.log(error));
        props.controller.isPlaying = true;
        townController.emitKaraokeAreaUpdate(props.controller);
      });
    });
  };

  function transferPlaybackHere(device_id: string) {
    // https://beta.developer.spotify.com/documentation/web-api/reference/player/transfer-a-users-playback/
    console.log('transferring');
    fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        'authorization': `Bearer ${props.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_ids: [device_id],
        // true: start playing music if it was paused on the other device
        // false: paused if paused on other device, start playing music otherwise
        play: true,
      }),
    }).then(() => {
      playSong(props.controller.currentSong);
      console.log('transferred');
    });
  }

  const addSong = (id: string) => {
    if (id && props.controller.songQueue.find(song => song === id)) {
      console.log('song already in queue');
    } else {
      console.log('adding song to queue');
      props.controller.songQueue = props.controller.songQueue.concat(id);
      townController.emitKaraokeAreaUpdate(props.controller);
    }
  };

  const playNextSong = async () => {
    if (props.controller.songQueue.length > 0) {
      const id = props.controller.songQueue[0];
      console.log(id);
      props.controller.currentSong = id;
      props.controller.songQueue = props.controller.songQueue.splice(1);
      props.controller.elapsedTimeSec = 0;
      townController.emitKaraokeAreaUpdate(props.controller);
      playSong(id);
    } else {
      console.log('No songs in queue');
    }
  };

  useEffect(() => {}, [currentQueue]);

  useEffect(() => {
    console.log(props.controller);
    const progressListener = (newTime: number) => {
      props.player?.getCurrentState().then(state => {
        if (state) {
          if (trackRef.current?.id !== props.controller.currentSong) {
            playSong(props.controller.currentSong);
          }
          if (
            timeRef.current !== undefined &&
            Math.abs(timeRef.current / 1000 - newTime) > ALLOWED_DRIFT
          ) {
            console.log('seek');
            props.player?.seek(newTime * 1000);
          }
        }
      });
    };

    props.controller.addListener('progressChange', progressListener);
    props.controller.addListener('playbackChange', setPlaying);
    props.controller.addListener('songChange', playSong);
    props.controller.addListener('songQueueChange', setQueue);
    return () => {
      props.controller.removeListener('playbackChange', setPlaying);
      props.controller.removeListener('progressChange', progressListener);
      props.controller.removeListener('songQueueChange', setQueue);
      props.controller.removeListener('songChange', playSong);
    };
  }, [props.controller]);

  useEffect(() => {}, [currentTrack, currentTime]);

  useEffect(() => {
    console.log(props.intervalID);
  }, [props.intervalID]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log(props.token);
      const tempPlayer = new window.Spotify.Player({
        name: 'Web Playback SDK',
        getOAuthToken: cb => {
          cb(props.token);
        },
        volume: 0.5,
      });

      props.setPlayer(tempPlayer);

      tempPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceID(device_id);
        transferPlaybackHere(device_id);
      });

      tempPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
      });

      tempPlayer.addListener('player_state_changed', async state => {
        if (!state) {
          return;
        }

        if (state.position === state.duration) {
          if (currentQueue.length > 0) {
            console.log('Track ended');
            playNextSong();
          } else {
            props.player?.pause();
            props.controller.isPlaying = false;
            townController.emitKaraokeAreaUpdate(props.controller);
          }
        } else {
          setPlaying(true);
        }
      });

      tempPlayer.connect();

      const interval = setInterval(() => {
        console.log(tempPlayer);
        tempPlayer.getCurrentState().then(state => {
          console.log(state);
          if (state) {
            setMyTime(state.position);
            const currTime = Math.floor(state.position / 1000);
            console.log(currTime);
            if (currTime != 0 && currTime != props.controller.elapsedTimeSec) {
              props.controller.elapsedTimeSec = currTime;
              townController.emitKaraokeAreaUpdate(props.controller);
            }
          }
        });
      }, 1000);
      console.log(interval);
      props.setIntervalID(interval);
      return () => {
        console.log('test');
        props.player?.disconnect();
        clearInterval(interval);
      };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!props.player) {
    return (
      <>
        <div className='container'>
          <div className='main-wrapper'>
            <b> Instance not active. Transfer your playback using your Spotify app </b>
          </div>
        </div>
      </>
    );
  } else {
    return (
      <Modal
        isOpen={props.isOpen}
        size={'4xl'}
        onClose={() => {
          props.onClose();
        }}>
        <ModalOverlay />
        <ModalContent>
          {<ModalHeader>{props.title} </ModalHeader>}
          <div>
            <div>
              <Searcher token={props.token} addSong={addSong} />
            </div>
            <div className='container'>
              <div className='main-wrapper'>
                <img
                  src={currentTrack?.album.images[0].url}
                  className='now-playing__cover'
                  alt=''
                />

                <div className='now-playing__side'>
                  <div className='now-playing__name'>{currentTrack?.name}</div>
                  <div className='now-playing__artist'>{currentTrack?.artists[0].name}</div>
                  <div className='now-playing__artist'>
                    {currentTrack
                      ? millisToMinutesAndSeconds(timeRef.current) +
                        '/' +
                        millisToMinutesAndSeconds(currentTrack.duration_ms)
                      : 'N/A'}
                  </div>

                  <button
                    className='btn-spotify'
                    onClick={() => {
                      playNextSong();
                    }}>
                    Skip
                  </button>
                </div>
              </div>
            </div>
            <div>
              <SongQueue queue={currentQueue} token={props.token} />
            </div>
          </div>
          <ModalCloseButton />
        </ModalContent>
      </Modal>
    );
  }
}

export default WebPlayback;
