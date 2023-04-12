import React, { useEffect, useRef, useState } from 'react';
import { useInteractable, useKaraokeAreaController } from '../../../classes/TownController';
import KaraokeAreaController, { useTitle } from '../../../classes/KaraokeAreaController';
import useTownController from '../../../hooks/useTownController';
import SelectKaraokeModal from './SelectKaraokeModal';
import KaraokeSessionInteractable from './KaraokeArea';
import WebPlayback from './WebPlayback';
import { Modal } from '@chakra-ui/react';

/**
 * The Karaoke Room Viewer component does the following:
 * -- renders the title of the karaoke area
 *
 * @param props: A 'controller', which is the KaraokeArea corresponding to the
 *               current karaoke area.
 *             : A 'isOpen' flag, denoting whether or not the modal should open (it should open if the karaoke area exists)
 *             : A 'close' function, to be called when the modal is closed
 */
export function KaraokeRoom({
  controller,
  isOpen,
  close,
}: {
  controller: KaraokeAreaController;
  isOpen: boolean;
  close: () => void;
}): JSX.Element {
  const title = useTitle(controller);
  const townController = useTownController();
  const [player, setPlayer] = useState<Spotify.Player>();
  const [intervalID, setIntervalID] = useState<NodeJS.Timer>();
  const intervalRef = useRef(intervalID);
  const playerRef = useRef(player);
  const setMyPlayer = (data: Spotify.Player) => {
    playerRef.current = data;
    setPlayer(data);
  };
  const setMyIntervalID = (data: NodeJS.Timer) => {
    intervalRef.current = data;
    setIntervalID(data);
  };
  const token = localStorage.getItem('access-token');
  useEffect(() => {}, [intervalID, player]);

  useEffect(() => {
    townController.pause();
    return () => {
      clearInterval(intervalRef.current);
      playerRef.current?.disconnect();
      playerRef.current?.removeListener('not_ready');
      playerRef.current?.removeListener('ready');
      playerRef.current?.removeListener('player_state_changed');
      townController.unPause();
      close();
    };
  }, [close, townController]);

  if (token && isOpen) {
    return (
      <Modal
        isOpen={isOpen}
        size={'4xl'}
        onClose={() => {
          close();
        }}>
        <WebPlayback
          isOpen={isOpen}
          onClose={() => {
            close();
          }}
          title={title}
          token={token}
          controller={controller}
          player={playerRef.current}
          setPlayer={setMyPlayer}
          intervalID={intervalRef.current}
          setIntervalID={setMyIntervalID}
        />
      </Modal>
    );
  } else {
    return <></>;
  }
}

/**
 * The KaraokeViewer monitors the player's interaction with a KaraokeArea on the map: displaying a blank screen showing the title of the song so far.
 *
 * @param props: the karaoke area interactable that is being interacted with
 */
export function KaraokeViewer({
  karaokeArea,
}: {
  karaokeArea: KaraokeSessionInteractable;
}): JSX.Element {
  const townController = useTownController();
  const karaokeAreaController = useKaraokeAreaController(karaokeArea.name);
  const [selectIsOpen, setSelectIsOpen] = useState(karaokeAreaController.title == undefined);
  const karaokeRoomTitle = useTitle(karaokeAreaController);

  useEffect(() => {
    const setTitle = (title: string | undefined) => {
      if (!title) {
        townController.interactableEmitter.emit('endIteraction', karaokeAreaController);
      } else {
        karaokeAreaController.title = title;
      }
    };
    karaokeAreaController.addListener('karaokeTitleChange', setTitle);
    return () => {
      karaokeAreaController.removeListener('karaokeTitleChange', setTitle);
    };
  }, [karaokeAreaController, townController]);
  if (!karaokeRoomTitle) {
    return (
      <SelectKaraokeModal
        isOpen={selectIsOpen}
        close={() => {
          setSelectIsOpen(false);
          // forces game to emit "karaokeArea" event again so that
          // repoening the modal works as expected
          townController.interactEnd(karaokeArea);
        }}
        karaokeArea={karaokeArea}
      />
    );
  }
  return (
    <>
      <KaraokeRoom
        controller={karaokeAreaController}
        isOpen={!selectIsOpen}
        close={() => {
          setSelectIsOpen(false);
          // forces game to emit "karaokeArea" event again so that
          // repoening the modal works as expected
          townController.interactEnd(karaokeArea);
        }}
      />
    </>
  );
}

/**
 * The KaraokeViewer is suitable to be *always* rendered inside of a town, and
 * will activate only if the player begins interacting with a karaoke area.
 */
export default function KaraokeViewerWrapper(): JSX.Element {
  const karaokeArea = useInteractable<KaraokeSessionInteractable>('karaokeArea');
  if (karaokeArea) {
    return <KaraokeViewer karaokeArea={karaokeArea} />;
  }
  return <></>;
}
