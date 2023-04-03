///  <reference types="@types/spotify-web-playback-sdk"/>
import { Modal, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';
import React, { useState, useEffect, useRef } from 'react';
import Searcher from './KaraokeAreaComponents/Searcher';
import SongQueue from './KaraokeAreaComponents/songQueue';

function transferPlaybackHere(deviceID: string, token: string) {
  // https://beta.developer.spotify.com/documentation/web-api/reference/player/transfer-a-users-playback/
  console.log('transferring');
  fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: {
      'authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device_ids: [deviceID],
      // true: start playing music if it was paused on the other device
      // false: paused if paused on other device, start playing music otherwise
      play: true,
    }),
  }).then(() => console.log('transferred'));
}

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
}): JSX.Element {
  const [isPaused, setPaused] = useState(false);
  const [player, setPlayer] = useState<Spotify.Player>();
  const [currentTrack, setTrack] = useState<Spotify.Track>();
  const [currentQueue, setQueue] = useState([
    '7ouMYWpwJ422jRcDASZB7P',
    '4VqPOruhp5EdPBeR92t6lQ',
    '2takcwOaAZWiXQijPHIx7B',
  ]);
  const [deviceID, setDeviceID] = useState('');
  const [currentTime, setTime] = useState(0);
  const [intervalID, setIntervalID] = useState<NodeJS.Timer>();
  const timeRef = useRef(currentTime);
  const queueRef = useRef(currentQueue);
  const trackRef = useRef(currentTrack);

  const setMyTrack = (data: Spotify.Track) => {
    trackRef.current = data;
    setTrack(data);
  };

  const setMyQueue = (data: string[]) => {
    queueRef.current = data;
    setQueue(data);
  };

  const setMyTime = (data: number) => {
    timeRef.current = data;
    setTime(data);
  };

  const addSong = (id: string) => {
    if (id && currentQueue.find(song => song === id)) {
      console.log('song already in queue');
    } else {
      console.log('adding song to queue');
      setMyQueue(queueRef.current.concat(id));
    }
  };

  const playSong = async (id: string) => {
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
              position_ms: 0,
            }),
          },
          3,
        ).catch(error => console.log(error));
      });
    });
  };

  const playNextSong = async () => {
    console.log(queueRef.current);
    if (currentQueue.length > 0) {
      const id = queueRef.current[0];
      console.log(id);
      setMyQueue(queueRef.current.splice(1));
      playSong(id);
    } else {
      console.log('No songs in queue');
    }
  };

  useEffect(() => {
    console.log(currentQueue);
  }, [currentQueue]);

  useEffect(() => {}, [currentTrack]);

  useEffect(() => {}, [currentTime]);

  useEffect(() => {}, [intervalID]);

  useEffect(() => {
    /*const getToken = async () => {
          const data = await fetch('/auth/gen').then(result => result.json().then(genToken => genToken));
          setToken(data.gen_token);
        };
        getToken();*/
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

      setPlayer(tempPlayer);

      tempPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceID(device_id);
        transferPlaybackHere(device_id, props.token);
      });

      tempPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
      });

      tempPlayer.addListener('player_state_changed', async state => {
        if (!state) {
          return;
        }

        if (trackRef.current && state.track_window.current_track.id != trackRef.current.id) {
          if (trackRef.current.id) {
            playSong(trackRef.current.id);
          }
        } else {
          setMyTrack(state.track_window.current_track);
        }

        if (state.position === state.duration) {
          console.log(queueRef.current);
          if (queueRef.current.length > 0) {
            console.log('Track ended');
            playNextSong();
          } else {
            tempPlayer.pause();
          }
        } else {
          setPaused(state.paused);
        }
      });

      tempPlayer.connect();

      const interval = setInterval(() => {
        tempPlayer.getCurrentState().then(state => {
          if (state) {
            setMyTime(state.position);
          }
        });
      }, 1000);
      setIntervalID(interval);
      return () => {
        console.log('test');
        player?.disconnect();
        clearInterval(interval);
      };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!player) {
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
          console.log('test');
          clearInterval(intervalID);
          player?.removeListener('ready');
          player?.removeListener('not_ready');
          player?.removeListener('player_state_changed');
          player?.disconnect();
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
                      ? millisToMinutesAndSeconds(currentTime) +
                        '/' +
                        millisToMinutesAndSeconds(currentTrack.duration_ms)
                      : 'N/A'}
                  </div>

                  <button
                    className='btn-spotify'
                    onClick={() => {
                      player.togglePlay();
                    }}>
                    {isPaused ? 'PLAY' : 'PAUSE'}
                  </button>

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
