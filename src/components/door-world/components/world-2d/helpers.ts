import type { Theme } from '@door-world/contexts/theme/types';
import {
  DOOR_HEIGHT,
  DOOR_WIDTH,
  getRoomCenter,
  type DungeonData,
  type Room
} from '@door-world/model/dungeon';
import type { Position, RoomId } from '@door-world/model/dungeon/types';
import { darkenColor } from '@helpers/colour';

interface RenderDungeonOptions {
  generationProgress?: number;
  highlightRoomId?: RoomId;
  isGenerating?: boolean;
  showConnections?: boolean;
  showDoors?: boolean;
  showLegend?: boolean;
  showRooms?: boolean;
  theme?: Theme;
}

export const renderDungeon = (
  canvas: HTMLCanvasElement | null,
  dungeon: DungeonData | null,
  viewportOffset: Position,
  options: RenderDungeonOptions = {}
) => {
  const {
    generationProgress = 0,
    isGenerating = false,
    showConnections = true,
    showDoors = true,
    showLegend = true,
    showRooms = true,
    theme = 'dark'
  } = options;

  if (!canvas || !dungeon) {
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  // Clear canvas
  ctx.fillStyle = theme === 'dark' ? '#1e1e1e' : '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Apply viewport transform
  ctx.save();
  ctx.translate(viewportOffset.x, viewportOffset.y);

  if (showRooms) {
    renderRooms(ctx, dungeon, options);
  }
  if (showDoors) {
    renderDoors(ctx, dungeon);
  }
  if (showConnections) {
    renderConnections(ctx, dungeon);
  }

  ctx.restore();

  if (showLegend) {
    // Draw room count and generation progress
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(
      `Rooms: ${dungeon.rooms.length}`,
      canvas.width - 10,
      canvas.height - 10
    );

    if (isGenerating) {
      ctx.textAlign = 'left';
      ctx.fillText(
        `Generating... ${Math.round(generationProgress)}%`,
        10,
        canvas.height - 10
      );
    }
  }

  return ctx;
};

export const renderRooms = (
  ctx: CanvasRenderingContext2D,
  dungeon: DungeonData,
  options: RenderDungeonOptions
) => {
  const { highlightRoomId } = options;
  const colourIncrement = 1 / (dungeon.maxDepth || 1);

  dungeon.rooms.forEach(room => {
    renderRoom({
      colourIncrement,
      ctx,
      isHighlighted: room.id === highlightRoomId,
      room
    });
  });
};

export const renderDoors = (
  ctx: CanvasRenderingContext2D,
  dungeon: DungeonData
) => {
  dungeon.doors.forEach(door => {
    ctx.fillStyle = '#FF893F';
    ctx.fillRect(door.position.x, door.position.y, DOOR_WIDTH, DOOR_HEIGHT);
  });
};

export const renderConnections = (
  ctx: CanvasRenderingContext2D,
  dungeon: DungeonData
) => {
  ctx.strokeStyle = '#00ff00aa';
  ctx.lineWidth = 2;

  dungeon.doors.forEach(door => {
    const center1 = getRoomCenter(dungeon, door.room1);
    const center2 = getRoomCenter(dungeon, door.room2);
    if (!center1 || !center2) {
      return;
    }
    ctx.beginPath();
    ctx.moveTo(center1.x, center1.y);
    ctx.lineTo(center2.x, center2.y);
    ctx.stroke();
  });
};

interface RenderRoomProps {
  colourIncrement: number;
  ctx: CanvasRenderingContext2D;
  isHighlighted?: boolean;
  room: Room;
}

export const renderRoom = ({
  colourIncrement,
  ctx,
  isHighlighted = false,
  room
}: RenderRoomProps) => {
  if (room.isCentral) {
    ctx.fillStyle = '#4a9eff';
  } else {
    const baseColor = '#e0e0e0';
    const depth = room.depth || 0;
    ctx.fillStyle = darkenColor(baseColor, depth * colourIncrement);
  }
  ctx.fillRect(room.area.x, room.area.y, room.area.width, room.area.height);

  // if (isHighlighted) {
  //   ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  //   ctx.fillRect(room.area.x, room.area.y, room.area.width, room.area.height);
  // }

  ctx.strokeStyle = isHighlighted ? '#f00' : '#AAA';
  ctx.lineWidth = isHighlighted ? 2 : 1;
  ctx.strokeRect(room.area.x, room.area.y, room.area.width, room.area.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    room.isCentral ? 'Start' : `${room.depth || 0}`,
    room.area.x + room.area.width / 2,
    room.area.y + room.area.height / 2
  );
};
