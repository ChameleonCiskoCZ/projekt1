import { Card, Tile } from "../../page";
import { useModal } from "../../_hooks/cards/useCardModal";
import { Cards } from "./cards";

interface CardModalProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedCard: Card | null;
  setSelectedCard: React.Dispatch<React.SetStateAction<Card | null>>;
  selectedTile: Tile | null;
  tiles: Tile[];
  handleRemoveCard: (tileId: string, cardId: string) => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  tiles,
  handleRemoveCard,
  isModalOpen,
  setIsModalOpen,
  selectedCard,
  setSelectedCard,
  selectedTile,
}) => {
  const { descriptionRef, nameRef } = useModal(selectedCard, isModalOpen);
  return (
    <div>
      {isModalOpen && selectedCard && selectedTile && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white  rounded-2xl p-2 shadow flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between space-x-40 items-center font-bold text-lg mb-2">
              <textarea
                ref={nameRef}
                className="flex-grow resize-none p-0.5 pl-2 ml-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCard.name}
                onChange={(e) => {
                  setSelectedCard({ ...selectedCard, name: e.target.value });
                  // Find the card in the tiles state and update its name
                  tiles.forEach((tile) => {
                    tile.cards.forEach((card) => {
                      if (card.id === selectedCard.id) {
                        card.name = e.target.value;
                      }
                    });
                  });
                }}
              />
              <button
                className="m-1 p-4 ml-4 w-6 h-6 flex items-center justify-center rounded-xl hover:bg-red-100"
                onClick={() => setIsModalOpen(false)}
              >
                ✖
              </button>
            </div>
            <div className="flex justify-between space-x-16 items-start">
              <div className="p-2">
                <label className="text-lg pl-1 font-bold">Description</label>
                <textarea
                  ref={descriptionRef}
                  className="mt-2 resize-none rounded-xl p-2 w-full overflow-hidden h-20 border border-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" // Added "resize-none" to prevent resizing
                  value={selectedCard.description || ""}
                  onChange={(e) => {
                    setSelectedCard({
                      ...selectedCard,
                      description: e.target.value,
                    });
                    // Find the card in the tiles state and update its description
                    tiles.forEach((tile) => {
                      tile.cards.forEach((card) => {
                        if (card.id === selectedCard.id) {
                          card.description = e.target.value;
                        }
                      });
                    });
                  }}
                />
              </div>
              <div className="mt-10">
                <button
                  className="m-1 p-2 bg-red-300 hover:bg-red-500 text-white rounded-xl"
                  onClick={() => {
                    // Add your remove logic here
                    handleRemoveCard(selectedTile.id, selectedCard.id);
                    setIsModalOpen(false);
                  }}
                >
                  Remove Card
                </button>
                <button
                  className="m-1 p-2 bg-sky-300 hover:bg-sky-500 text-white rounded-xl"
                  onClick={handleOpenPopup}
                >
                  Assign Card
                </button>

                {isPopupOpen && (
                  <div>
                    {members.map((member) => (
                      <div onClick={() => handleAssignMember(member.id)}>
                        {member.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
