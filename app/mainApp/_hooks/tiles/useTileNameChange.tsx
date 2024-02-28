import { useEffect, useRef, useState } from "react";
import { Tile } from "../../page"; // adjust the path according to your directory structure

export const useTileNameChange = (
  tiles: Tile[],
  setTiles: React.Dispatch<React.SetStateAction<Tile[]>>
) => {
  const [editingTileId, setEditingTileId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleNameChange = (id: string) => {
    const newTiles = tiles.map((tile) =>
      tile.id === id ? { ...tile, name: newName } : tile
    );
    setTiles(newTiles);
    setEditingTileId(null);
    setNewName("");
  };
  
  //tile name
  useEffect(() => {
    const resizeTextArea = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "28px";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    resizeTextArea();

    if (textareaRef.current) {
      textareaRef.current.addEventListener("input", resizeTextArea);
      return () => {
        if (textareaRef.current) {
          textareaRef.current.removeEventListener("input", resizeTextArea);
        }
      };
    }
  }, [newName]);

  return {
    editingTileId,
    setEditingTileId,
    newName,
    setNewName,
    handleNameChange,
    textareaRef,
  };
};
