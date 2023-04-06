import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useKaraokeAreaController } from '../../../classes/TownController';
import KaraokeArea from './KaraokeArea';
import { KaraokeArea as KaraokeAreaModel } from '../../../types/CoveyTownSocket';
import useTownController from '../../../hooks/useTownController';

export default function SelectKaraokeModal({
  isOpen,
  close,
  karaokeArea,
}: {
  isOpen: boolean;
  close: () => void;
  karaokeArea: KaraokeArea;
}): JSX.Element {
  const coveyTownController = useTownController();
  const karaokeAreaController = useKaraokeAreaController(karaokeArea?.id);
  console.log('first?'); // LOOK HERE FIRST
  const [title, setTitle] = useState<string | undefined>(karaokeArea?.defaultTitle || '');
  // const [posterFileContents, setImageContents] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      coveyTownController.pause();
      console.log('isOpen');
    } else {
      coveyTownController.unPause();
    }
  }, [coveyTownController, isOpen]);

  const closeModal = useCallback(() => {
    coveyTownController.unPause();
    console.log('isClosed');
    close();
  }, [coveyTownController, close]);

  const toast = useToast();

  const createRoom = useCallback(async () => {
    console.log('secod create?');
    if (title && karaokeAreaController) {
      console.log('karaoke room name: ' + title);
      const songToSet: KaraokeAreaModel = {
        id: karaokeAreaController.id,
        title: title,
        songQueue: [''],
        isPlaying: true,
        elapsedTimeSec: 0,
      };
      try {
        await coveyTownController.createKaraokeArea(songToSet);
        toast({
          title: 'Karaoke Area created!',
          status: 'success',
        });
        setTitle('');
        coveyTownController.unPause();
        closeModal();
      } catch (err) {
        if (err instanceof Error) {
          toast({
            title: 'Unable to create karaoke',
            description: err.toString(),
            status: 'error',
          });
        } else {
          console.trace(err);
          toast({
            title: 'Unexpected Error',
            status: 'error',
          });
        }
      }
    }
  }, [title, setTitle, coveyTownController, karaokeAreaController, closeModal, toast]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        coveyTownController.unPause();
      }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create a Karaoke Area in {karaokeAreaController?.id} </ModalHeader>
        <ModalCloseButton />
        <form
          onSubmit={ev => {
            ev.preventDefault();
            createRoom();
          }}>
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel htmlFor='title'>Title of Song</FormLabel>
              <Input
                id='title'
                placeholder='Share the name of your karaoke room'
                name='title'
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={createRoom}>
              Create
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
