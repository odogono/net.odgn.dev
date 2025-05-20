import { createLog } from '@helpers/log';

import { DOOR_HEIGHT, DOOR_WIDTH } from './constants';
import { roomsTouch } from './room';
import type {
  CompassDirection,
  Door,
  DungeonData,
  Position,
  Room
} from './types';

const log = createLog('Dungeon.Door');

export const findDoorPosition = (
  room1: Room,
  room2: Room
): [CompassDirection, Position] | null => {
  const targetRoom = room1.allowedEdges ? room1 : room2;
  const otherRoom = room1.allowedEdges ? room2 : room1;

  const allowedEdges = targetRoom.allowedEdges || [
    'NORTH',
    'EAST',
    'SOUTH',
    'WEST'
  ];

  let touchingEdge: CompassDirection | null = null;

  if (otherRoom.area.y + otherRoom.area.height === targetRoom.area.y) {
    touchingEdge = 'NORTH';
  } else if (targetRoom.area.y + targetRoom.area.height === otherRoom.area.y) {
    touchingEdge = 'SOUTH';
  } else if (otherRoom.area.x + otherRoom.area.width === targetRoom.area.x) {
    touchingEdge = 'WEST';
  } else if (targetRoom.area.x + targetRoom.area.width === otherRoom.area.x) {
    touchingEdge = 'EAST';
  }

  if (!touchingEdge || !allowedEdges.includes(touchingEdge)) {
    return null;
  }

  let xOverlap: number;
  let yOverlap: number;

  if (touchingEdge === 'NORTH' || touchingEdge === 'SOUTH') {
    xOverlap =
      Math.min(
        targetRoom.area.x + targetRoom.area.width,
        otherRoom.area.x + otherRoom.area.width
      ) - Math.max(targetRoom.area.x, otherRoom.area.x);

    if (xOverlap >= DOOR_WIDTH) {
      const x =
        Math.max(targetRoom.area.x, otherRoom.area.x) +
        (xOverlap - DOOR_WIDTH) / 2;
      const y =
        touchingEdge === 'NORTH'
          ? targetRoom.area.y - DOOR_HEIGHT / 2
          : targetRoom.area.y + targetRoom.area.height - DOOR_HEIGHT / 2;
      return [touchingEdge, { x, y }];
    }
  } else {
    yOverlap =
      Math.min(
        targetRoom.area.y + targetRoom.area.height,
        otherRoom.area.y + otherRoom.area.height
      ) - Math.max(targetRoom.area.y, otherRoom.area.y);

    if (yOverlap >= DOOR_HEIGHT) {
      const y =
        Math.max(targetRoom.area.y, otherRoom.area.y) +
        (yOverlap - DOOR_HEIGHT) / 2;
      const x =
        touchingEdge === 'WEST'
          ? targetRoom.area.x - DOOR_WIDTH / 2
          : targetRoom.area.x + targetRoom.area.width - DOOR_WIDTH / 2;
      return [touchingEdge, { x, y }];
    }
  }

  return null;
};

const getRoomCenter = (room: Room): Position => ({
  x: room.area.x + room.area.width / 2,
  y: room.area.y + room.area.height / 2
});

const getDoorDirection = (room1: Room, room2: Room): CompassDirection => {
  const fromRoom = getRoomCenter(room1);
  const toRoom = getRoomCenter(room2);

  const dx = toRoom.x - fromRoom.x;
  const dy = toRoom.y - fromRoom.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'EAST' : 'WEST';
  } else {
    return dy < 0 ? 'NORTH' : 'SOUTH';
  }
};

export const findDoors = (_dungeon: DungeonData, rooms: Room[]): Door[] => {
  const doors: Door[] = [];

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      if (roomsTouch(rooms[i], rooms[j])) {
        const doorProps = findDoorPosition(rooms[i], rooms[j]);
        if (doorProps) {
          const id = `d-${rooms[i].id}-${rooms[j].id}`;
          const dir = getDoorDirection(rooms[i], rooms[j]);
          doors.push({
            dir,
            id,
            position: doorProps[1],
            room1: rooms[i].id,
            room2: rooms[j].id
          });
        }
      }
    }
  }

  return doors;
};

export const getRoomDoors = (
  dungeon: DungeonData | null | undefined,
  room: Room | null | undefined
): Door[] => {
  if (!dungeon || !room) {
    return [];
  }
  return dungeon.doors.filter(
    door => door.room1 === room.id || door.room2 === room.id
  );
};

export const getRoomDoorsExcluding = (
  dungeon: DungeonData | null | undefined,
  roomId: number,
  excludeRoomId: number = -1
): Door[] => {
  if (!dungeon) {
    return [];
  }

  const roomDoors = dungeon.doors.filter(
    door =>
      (door.room1 === roomId || door.room2 === roomId) &&
      door.room1 !== excludeRoomId &&
      door.room2 !== excludeRoomId
  );

  return roomDoors;
};
