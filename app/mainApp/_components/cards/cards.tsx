import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Card, Tile } from "../../page";
import "@fortawesome/fontawesome-free/css/all.css";
import { useAuth } from "@/app/_hooks/useAuth";

interface CardsComponentProps {
  tile: Tile;
  setSelectedTile: (tile: Tile | null) => void;
  setSelectedCard: (card: Card | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  showAssignedCards: boolean;
}

export const Cards: React.FC<CardsComponentProps> = ({
  tile,
  setSelectedTile,
  setSelectedCard,
  setIsModalOpen,
  showAssignedCards,
}) => {
  const username = useAuth();
  return (
    <Droppable droppableId={`tile-${tile.id}`} type="card">
      {(provided) => (
        <div {...provided.droppableProps} ref={provided.innerRef}>
          {tile.cards
            .sort((a, b) => a.position - b.position)
            .filter(
              (card) =>
                !showAssignedCards || card.assignedTo?.includes(username ?? "")
            )
            .map((card, cardIndex) => (
              <Draggable key={card.id} draggableId={card.id} index={cardIndex}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${
                      card.markedAsDone
                        ? "bg-lime-300 bg-opacity-40"
                        : "bg-sky-300 bg-opacity-40"
                    } p-2 rounded-xl mt-2 backdrop-blur relative`}
                    onClick={() => {
                      setSelectedTile(tile);
                      setSelectedCard(card);
                      setIsModalOpen(true);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold break-words overflow-wrap-anywhere">
                        {card.name}
                      </h3>
                      {card.assignedTo?.includes(username ?? "") && (
                        <i className="fas fa-user-check mr-1" />
                      )}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};
