import ReactDOM from "react-dom";
import { Tile } from "../../page";

interface TileMenuProps {
  openTileId: string | null;
  tile: Tile;
  menuPosition: { top: number; left: number };
  menuRef: React.RefObject<HTMLDivElement>;
  handleRemoveTile: (id: string) => void;
}

export const TileMenu: React.FC<TileMenuProps> = ({
  openTileId,
  tile,
  menuPosition,
  menuRef,
  handleRemoveTile,
}) => {
  return (
    <>
      {openTileId === tile.id &&
        ReactDOM.createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              ...menuPosition,
            }}
            className="mt-10 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
          >
            <div
              className="py-1"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="options-menu"
            >
              <button
                onClick={() => handleRemoveTile(tile.id)}
                className="block w-full rounded-xl text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                Remove
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
