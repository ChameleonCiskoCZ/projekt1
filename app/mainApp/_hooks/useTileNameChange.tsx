import { useState } from "react";
import { Tile } from "../page"; // adjust the path according to your directory structure

export const useTileNameChange = (
  tiles: Tile[],
  setTiles: React.Dispatch<React.SetStateAction<Tile[]>>
) => {
  const [editingTileId, setEditingTileId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const handleNameChange = (id: string) => {
    const newTiles = tiles.map((tile) =>
      tile.id === id ? { ...tile, name: newName } : tile
    );
    setTiles(newTiles);
    setEditingTileId(null);
    setNewName("");
  };

  return {
    editingTileId,
    setEditingTileId,
    newName,
    setNewName,
    handleNameChange,
  };
};
