import React, { useEffect, useState } from 'react';
import { useInteractable, useKaraokeAreaController } from '../../../classes/TownController';
import KaraokeAreaController, { useTitle } from '../../../classes/KaraokeAreaController';
import useTownController from '../../../hooks/useTownController';
import SelectKaraokeModal from './SelectKaraokeModal';
import KaraokeSessionInteractable from './KaraokeArea';
import WebPlayback from './WebPlayback';

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
  const townController = useTownController();
  const title = useTitle(controller);
  console.log(title);
  console.log('first test');
  console.log(townController.karaokeAreas);
  const token = localStorage.getItem('access-token');

  if (token) {
    return (
      <WebPlayback
        isOpen={isOpen}
        onClose={() => {
          close();
          townController.unPause();
        }}
        title={title}
        token={token}
      />
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
  // console.log('122');
  const [selectIsOpen, setSelectIsOpen] = useState(karaokeAreaController.title == undefined);
  const karaokeRoomTitle = useTitle(karaokeAreaController);

  useEffect(() => {
    // console.log('125');
    const setTitle = (title: string | undefined) => {
      if (!title) {
        // console.log('126');
        townController.interactableEmitter.emit('endIteraction', karaokeAreaController);
      } else {
        // console.log('127');
        karaokeAreaController.title = title;
        console.log(title);
      }
    };
    karaokeAreaController.addListener('karaokeTitleChange', setTitle);
    // console.log('123');
    return () => {
      karaokeAreaController.removeListener('karaokeTitleChange', setTitle);
    };
  }, [karaokeAreaController, townController]);
  if (!karaokeRoomTitle) {
    console.log(karaokeRoomTitle);
    console.log('shouldnt go here');
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