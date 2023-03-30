import React, { useState, useEffect, useRef } from 'react';
import Searcher from './KaraokeAreaComponents/Searcher';
import SongQueue from './KaraokeAreaComponents/songQueue';
import 'spotify-web-playback-sdk';

type StateChange = {
    track_window: { current_track: { id: any; name?: String; album?: { images: [{ url: string; }]; }; artists?: [{ name: string; }]; }; }; position: any; duration: any; paused: boolean | ((prevState: boolean) => boolean);
}


function transferPlaybackHere(deviceID: string, token: String) {
    // https://beta.developer.spotify.com/documentation/web-api/reference/player/transfer-a-users-playback/
    console.log('transferring')
    fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "device_ids": [deviceID],
            // true: start playing music if it was paused on the other device
            // false: paused if paused on other device, start playing music otherwise
            "play": true,
        }),
    }).then(() => console.log('transferred'))
};

const fetchPlus: (url: string, options: {} | undefined, retries: number) => Promise<any> = async (url: string, options = {}, retries: number) =>
    await fetch(url, options)
        .then(res => {
            if (res.ok) {
                return res
            }
            if (retries > 0) {
                console.log('retrying')
                return fetchPlus(url, options, retries - 1)
            }
            //throw new Error(res.status)
        })
        .catch(error => console.error(error.message))

function millisToMinutesAndSeconds(millis: number): string {
    const minutes = Math.floor(millis / 60000);
    const seconds = parseInt(((millis % 60000) / 1000).toFixed(0));
    return (
        seconds == 60 ?
            (minutes + 1) + ":00" :
            minutes + ":" + (seconds < 10 ? "0" : "") + seconds
    );
}

function WebPlayback(props: { token: string }): JSX.Element {
    const [token, setToken] = useState('')
    const [is_paused, setPaused] = useState(false);
    const [is_active, setActive] = useState(false);
    const [player, setPlayer] = useState<Spotify.Player>();
    const [current_track, setTrack] = useState<Spotify.Track>();
    const [current_queue, setQueue] = useState(['7ouMYWpwJ422jRcDASZB7P', '4VqPOruhp5EdPBeR92t6lQ', '2takcwOaAZWiXQijPHIx7B'])
    const [deviceID, setDeviceID] = useState('');
    const [current_time, setTime] = useState(0);
    const timeRef = useRef(current_time);
    const queueRef = useRef(current_queue);
    const trackRef = useRef(current_track);

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
        if (current_queue.find(song => song === id)) {
            console.log("song already in queue")
        } else {
            console.log("adding song to queue")
            setMyQueue(queueRef.current.concat(id));
        }
    }

    const playSong = async (id: string) => {
        if (id === undefined) {
            console.log("ID is undefined");
            return;
        }
        await fetchPlus(`https://api.spotify.com/v1/tracks/${id}`, {
            method: "GET",
            headers: {
                authorization: `Bearer ${props.token}`,
                "Content-Type": "application/json",
            },
        }, 3)
            .then(response => {
                response.json().then(async (result: Spotify.Track) => {
                    setMyTrack(result);
                    await fetchPlus(`https://api.spotify.com/v1/me/player/play`, {
                        method: "PUT",
                        headers: {
                            authorization: `Bearer ${props.token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            "device_id": deviceID,
                            "uris": [response.uri],
                            "position_ms": 0
                        })
                    }, 3).catch(error => console.log(error))
                })
            })
    }

    const playNextSong = async () => {
        console.log(queueRef.current)
        if (current_queue.length > 0) {
            const id = queueRef.current[0];
            setMyQueue(queueRef.current.splice(1))
            playSong(id);
        } else {
            console.log('No songs in queue')
        }
    }

    useEffect(() => {
        console.log(current_queue)
    }, [current_queue])

    useEffect(() => {
    }, [current_track])

    useEffect(() => {
    }, [current_time])

    useEffect(() => {
    }, [token])

    useEffect(() => {

        const getToken = async () => {
            const data = await fetch("/auth/gen").then(result => result.json().then(token => token))
            setToken(data.gen_token);
        }
        getToken()
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {

            const player = new window.Spotify.Player({
                name: 'Web Playback SDK',
                getOAuthToken: cb => { cb(props.token); },
                volume: 0.5
            });

            setPlayer(player);

            player.addListener('ready', ({ device_id }: { device_id: string }) => {
                console.log('Ready with Device ID', device_id);
                setDeviceID(device_id);
                transferPlaybackHere(device_id, props.token)
            });

            player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
                console.log('Device ID has gone offline', device_id);
            });

            player.addListener('player_state_changed', (async (state) => {

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
                    console.log(queueRef.current)
                    if (queueRef.current.length > 0) {
                        console.log('Track ended');
                        playNextSong();
                    } else {
                        player.pause();
                    }
                } else {
                    setPaused(state.paused);
                }
                player.getCurrentState().then(state => {
                    (!state) ? setActive(false) : setActive(true)
                });

            }));

            player.connect();

            const interval = setInterval(() => {
                player.getCurrentState().then(state => {
                    if (state) {
                        setMyTime(state.position);
                    }
                })
            }, 1000);
            return () => clearInterval(interval);

        };
    }, []);



    if (!player) {
        return (
            <>
                <div className="container">
                    <div className="main-wrapper">
                        <b> Instance not active. Transfer your playback using your Spotify app </b>
                    </div>
                </div>
            </>)
    } else {
        return (
            <>
                <div>
                    <div>
                        <Searcher token={token} addSong={addSong} />
                    </div>
                    <div className="container">
                        <div className="main-wrapper">

                            <img src={current_track?.album.images[0].url} className="now-playing__cover" alt="" />

                            <div className="now-playing__side">
                                <div className="now-playing__name">{current_track?.name}</div>
                                <div className="now-playing__artist">{current_track?.artists[0].name}</div>
                                <div className="now-playing__artist">
                                    {current_track ? 
                                    millisToMinutesAndSeconds(current_time)+ "/" + millisToMinutesAndSeconds(current_track.duration_ms)
                                    : "N/A"}

                                </div>

                                <button className="btn-spotify" onClick={() => { player.togglePlay() }} >
                                    {is_paused ? "PLAY" : "PAUSE"}
                                </button>

                                <button className="btn-spotify" onClick={() => {
                                    playNextSong()
                                }} >
                                    Skip
                                </button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <SongQueue queue={current_queue} token={token} />
                    </div>
                </div>
            </>
        );
    }
}

export default WebPlayback
