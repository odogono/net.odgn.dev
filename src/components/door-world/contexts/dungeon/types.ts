import type {
  DungeonData,
  Room,
  StrategyType
} from '@door-world/model/dungeon';

export interface DungeonContextType {
  dungeon: DungeonData | null;
  generateRoomsAround: (options: GenerateRoomsAroundProps) => Promise<void>;
  // percent
  generationProgress: number;
  isGenerating: boolean;
  regenerate: (options: RegenerateDungeonOptions) => Promise<void>;
  seed: number;
  setSeed: (seed: number) => void;
}

export interface RegenerateDungeonOptions {
  maxRooms?: number;
  seed?: number;
  strategy?: StrategyType;
}

export interface GenerateRoomsOptions {
  maxAttempts?: number;
  onProgress?: (dungeon: DungeonData) => void;
  roomCount?: number;
}

export interface GenerateRoomsAroundProps {
  recurseCount?: number;
  room: Room;
  roomCount: number;
}
