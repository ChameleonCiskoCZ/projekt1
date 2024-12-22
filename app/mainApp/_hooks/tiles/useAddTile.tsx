import { useState, useEffect, RefObject, useContext } from "react";
import { Role, Tile } from "../../page";
import { NotificationContext } from "@/app/_hooks/notify/notificationContext";
import { useAuth } from "@/app/_hooks/useAuth";

export const useAddTile = (
  tiles: Tile[],
  setTiles: (tiles: Tile[]) => void,
  tileRef: RefObject<HTMLDivElement>,
  userRole: Role | null,
) => {
  const [name, setName] = useState("");
  const [isClicked, setIsClicked] = useState(false);
  const { notify } = useContext(NotificationContext);
  const ownerUsername = sessionStorage.getItem("ownerUsername");
  const username = useAuth();
  // Add an effect to close the menu when clicking outside tile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tileRef.current && !tileRef.current.contains(event.target as Node)) {
        setIsClicked(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [tileRef]);

  const handleAddTile = () => {
    if (username !== ownerUsername) {
      if (!userRole?.addRemoveTile) {
        console.log("You do not have permission to add tiles.");
        notify("You do not have permission to add tiles.", "error");
        return;
      }
    }
    const newPosition = tiles.length;
    const newTile = {
      name,
      position: newPosition,
      id: `temp-${Math.random().toString(36).substr(2, 9)}`,
      cards: [],
    };
    setName("");
    // Add the new tile locally
    setTiles([...tiles, newTile]);
    setIsClicked(false);
  };

  return {
    name,
    setName,
    isClicked,
    setIsClicked,
    handleAddTile,
  };
};
