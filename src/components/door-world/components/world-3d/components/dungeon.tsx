import { useCallback, useEffect } from 'react';

import {
  getRoomCenter,
  type Door as DoorModel
} from '@door-world/model/dungeon';
import { generateRandomColor } from '@helpers/colour';
import { createLog } from '@helpers/log';
import { djb2Hash } from '@helpers/random';

import { Door as Door3d, type DoorRef } from './door';
import { dungeonPositionToVector3 } from './helpers';
import { useInactivityTimeout } from './hooks/use-inactivity-timeout';
import { useMoveToRoom } from './hooks/use-move-to-room';
import type { IsometricCameraMoveToProps } from './isometric-camera';
import { Room as Room3d, type RoomRef, type RoomTouchEvent } from './room';

const log = createLog('Dungeon');

const INACTIVITY_TIMEOUT = 5000;

interface DungeonProps {
  moveCameraTo: (props: IsometricCameraMoveToProps) => Promise<void>;
}

export const Dungeon = ({ moveCameraTo }: DungeonProps) => {
  const {
    currentRoom,
    doorRefs,
    doors,
    dungeon,
    moveThroughDoor,
    nextDoorId,
    roomRefs,
    rooms
  } = useMoveToRoom({
    moveCameraTo
  });

  const onInactivityTimeout = useCallback(() => {
    log.debug('Inactivity - Moving through door', nextDoorId);

    if (nextDoorId) {
      moveThroughDoor(nextDoorId);
    }
  }, [nextDoorId, moveThroughDoor]);

  const { clearInactivityTimeout, resetInactivityTimeout } =
    useInactivityTimeout({
      onInactivityTimeout
    });

  const handleDoorTouch = useCallback(
    async (door: DoorModel) => {
      log.debug('Door clicked', door.id);

      clearInactivityTimeout();

      await moveThroughDoor(door.id);

      resetInactivityTimeout();
    },
    [clearInactivityTimeout, moveThroughDoor, resetInactivityTimeout]
  );

  const handleRoomTouch = useCallback(
    (event: RoomTouchEvent) => {
      log.debug('Room clicked', event.room.id, event.world);

      clearInactivityTimeout();

      moveCameraTo({
        position: event.world
      });

      resetInactivityTimeout();
    },
    [clearInactivityTimeout, moveCameraTo, resetInactivityTimeout]
  );

  useEffect(() => {
    if (!currentRoom) {
      return;
    }
    const roomPosition = getRoomCenter(dungeon, currentRoom.id);

    moveCameraTo({
      duration: 0,
      position: dungeonPositionToVector3(roomPosition)!
    });

    log.debug('currentRoom', currentRoom?.id, roomPosition);

    resetInactivityTimeout();

    // eslint-disable-next-line react-hooks/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom?.id]);

  return (
    <>
      {rooms.map(room => (
        <Room3d
          key={room.id}
          onTouch={handleRoomTouch}
          ref={(ref: RoomRef | null) => {
            if (ref) {
              roomRefs.current.set(room.id, ref);
            }
            return () => {
              roomRefs.current.delete(room.id);
            };
          }}
          room={room}
        />
      ))}
      {doors.map((door, index) => (
        <DoorContainer
          door={door}
          key={door.id}
          onTouch={handleDoorTouch}
          ref={(ref: DoorRef | null) => {
            if (ref) {
              // log.debug('Mounting door', door.id);
              doorRefs.current.set(door.id, ref);
            }
            return () => {
              // log.debug('Unmounting door', door.id);
              doorRefs.current.delete(door.id);
            };
          }}
        />
      ))}
    </>
  );
};

interface DoorContainerProps {
  color?: string;
  door: DoorModel;
  onTouch: (door: DoorModel) => void;
  ref: React.Ref<DoorRef>;
}

const DOOR_SIZE = 4;
const DoorContainer = ({ color, door, onTouch, ref }: DoorContainerProps) => {
  const { position, room1, room2 } = door;

  const position3d = dungeonPositionToVector3({
    x: position.x + DOOR_SIZE,
    y: position.y + DOOR_SIZE
  })!;

  const seed = djb2Hash(door.id);

  color = generateRandomColor(seed);

  // const position3d = new Vector3(
  //   position.x + DOOR_SIZE,
  //   0,
  //   position.y + DOOR_SIZE
  // );
  // position3d.multiplyScalar(SCALE);
  const rotationY = getDoorRotationY(door);

  const handleTouch = useCallback(() => {
    onTouch(door);
  }, [door, onTouch]);

  return (
    <Door3d
      doorColor={color}
      id={door.id}
      isMounted={false}
      isOpen={door.isOpen}
      onTouch={handleTouch}
      position={position3d}
      ref={ref}
      rotationY={rotationY}
    />
  );
};

const getDoorRotationY = (door: DoorModel) => {
  const { dir } = door;

  switch (dir) {
    case 'NORTH':
      return -Math.PI / 2;
    case 'EAST':
      return -Math.PI;
    case 'SOUTH':
      return Math.PI / 2;
    case 'WEST':
      return 0;
  }
};
