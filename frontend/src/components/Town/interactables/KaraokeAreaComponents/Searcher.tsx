///  <reference types="@types/spotify-web-playback-sdk"/>
import React, { SetStateAction, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, InputGroup, FormControl, Button, Row, Card } from 'react-bootstrap';

function Searcher(props: { addSong: (id: string) => void; token: string }) {
  const [searchInput, setSearchInput] = useState('');
  const [tracks, setTracks] = useState<Spotify.Track[]>([]);

  const accessToken = props.token;

  const searchTrack = async () => {
    if (searchInput) {
      const songLimit = 8;
      const trackResults = await fetch(
        'https://api.spotify.com/v1/search?q=' + searchInput + `&type=track&limit=${songLimit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        },
      )
        .then(response => response.json())
        .then(data => data.tracks);

      console.log(trackResults);
      setTracks(trackResults.items);
    }
  };

  return (
    <>
      <Container>
        <InputGroup className='mt-3 mb-3' size='lg'>
          <FormControl
            type='input'
            placeholder='Search By Track Name ...'
            value={searchInput}
            onKeyPress={(event: { key: string }) => {
              if (event.key == 'Enter') {
                searchTrack();
              }
            }}
            onChange={(event: { target: { value: SetStateAction<string> } }) => {
              setSearchInput(event.target.value);
            }}
          />
          <Button onClick={searchTrack}>Search</Button>
          <Button
            className='bg-danger'
            onClick={() => {
              setTracks([]);
              setSearchInput('');
            }}>
            Clear
          </Button>
        </InputGroup>
      </Container>
      <Container>
        <Row className='mx-2 row row-cols-4'>
          {tracks.map(track => (
            <Card key={track.id} className='bg-secondary'>
              <Card.Img src={track.album.images[0].url} />
              <Card.Body>
                <Card.Title className='text-dark'>{track.name}</Card.Title>
                <Card.Subtitle className='text-white'>{track.artists[0].name}</Card.Subtitle>
              </Card.Body>
              <Button className='mb-2' onClick={() => track.id ? props.addSong(track.id) : console.log('empty track') }>
                Add to queue
              </Button>
            </Card>
          ))}
        </Row>
      </Container>
    </>
  );
}

export default Searcher;
