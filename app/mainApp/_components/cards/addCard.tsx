import { Tile } from "../../page"; // adjust the path according to your directory structure

interface AddCardProps {
  expandedTileId: string | null;
  tile: Tile;
  addCardRef: React.RefObject<HTMLDivElement>;
  newCardName: string;
  setNewCardName: (name: string) => void;
  handleAddCard: (id: string) => void;
  handleAddCardClick: (id: string) => void;
}

export const AddCard: React.FC<AddCardProps> = ({
  expandedTileId,
  tile,
  addCardRef,
  newCardName,
  setNewCardName,
  handleAddCard,
  handleAddCardClick,
}) => {
  return (
    <div>
      {expandedTileId === tile.id ? (
        <div ref={addCardRef}>
          <input
            type="text"
            value={newCardName}
            onChange={(e) => setNewCardName(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleAddCard(tile.id);
              }
            }}
            autoFocus
            className="mt-2 border rounded-xl p-2"
          />
          <button
            onClick={() => handleAddCard(tile.id)}
            className="mt-2 bg-sky-100 rounded-xl p-2 hover:bg-sky-200"
          >
            Save
          </button>
        </div>
      ) : (
        <button
          onClick={() => handleAddCardClick(tile.id)}
          className="w-full mt-2 rounded-xl p-2 bg-sky-300 bg-opacity-20 hover:bg-gray-20 hover:bg-opacity-40"
        >
          <span className="text-2xl">+</span>
        </button>
      )}
    </div>
  );
};
