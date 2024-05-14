// useTileMenu.ts

import { useState, useEffect, useRef, useContext } from "react";
import { Role, Tile } from "../../page";
import { NotificationContext } from "@/app/_hooks/notify/notificationContext";
import { useAuth } from "@/app/_hooks/useAuth";

export const useTileMenu = (
  tiles: Tile[],
  setTiles: React.Dispatch<React.SetStateAction<Tile[]>>,
  removedTileIds: Set<string>,
  setRemovedTileIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  userRole: Role | null,
) => {
  const [openTileId, setOpenTileId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const { notify } = useContext(NotificationContext);
  const ownerUsername = sessionStorage.getItem("ownerUsername");
  const username = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpenTileId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleButtonClick = (id: string, event: React.MouseEvent) => {
    const rect = (event.currentTarget as Element).getBoundingClientRect();

    setOpenTileId(id);
    setMenuPosition({
      top: rect.top,
      left: rect.left,
    });
  };

  // handle removing tiles
  const handleRemoveTile = (id: string) => {
    if (username !== ownerUsername) {
      if (!userRole?.addRemoveTile) {
        console.log("You do not have permission to remove tiles.");
        notify("You do not have permission to remove tiles.", "error");
        return;
      }
    }
    setTiles(tiles.filter((tile) => tile.id !== id));
    setRemovedTileIds((prev) => new Set(prev).add(id));
  };

  return {
    openTileId,
    menuRef,
    buttonRef,
    menuPosition,
    handleButtonClick,
    handleRemoveTile,
    removedTileIds,
  };
};
