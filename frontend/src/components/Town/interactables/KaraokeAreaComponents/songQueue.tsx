///  <reference types="@types/spotify-web-playback-sdk"/>

import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Row, Card, CardGroup, Col } from 'react-bootstrap';

interface Track {
  image: string;
  artist: { name: string };
  name: string;
  id: string;
}

function SongQueue(props: { queue: string[]; token: string }) {
  const [songQueue, setSongQueue] = useState<Track[]>([]);
  useEffect(() => {
    async function getSongs() {
      Promise.all(
        props.queue.map((id: string) =>
          fetch(`https://api.spotify.com/v1/tracks/${id}`, {
            method: 'GET',
            headers: {
              'authorization': `Bearer ${props.token}`,
              'Content-Type': 'application/json',
            },
          }),
        ),
      ).then(responses => {
        Promise.all(responses.map(res => res.json())).then(results =>
          setSongQueue(
            results.map(song => {
              const songInfo = {
                image: song.album.images[0].url,
                artist: song.album.artists[0],
                name: song.name,
                id: song.id,
              };
              return songInfo;
            }),
          ),
        );
      });
    }
    getSongs();
  }, [props]);

  return (
    <>
      <Col className='ml-2 mt-2'>
        <h2 className='text-center'>Song Queue:</h2>
      </Col>
      <Col xs={10}>
        <CardGroup className='m-2 d-block'>
          {songQueue.map(song => (
            <Card key={song.id} className='bg-secondary'>
              <Row className='row no-gutters'>
                <Col>
                  <Card.Img src={song.image} />
                </Col>
                <Col xs={10}>
                  <Card.Body>
                    <Card.Title className='text-white'>{song.name}</Card.Title>
                    <Card.Subtitle className='text-dark'>{song.artist.name}</Card.Subtitle>
                  </Card.Body>
                </Col>
              </Row>
            </Card>
          ))}
        </CardGroup>
      </Col>
    </>
  );
}

export default SongQueue;
