import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Card, Tile } from "../../page";

interface CardsComponentProps {
  tile: Tile;
  setSelectedTile: (tile: Tile | null) => void; // Added missing property
  setSelectedCard: (card: Card | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
}

export const Cards: React.FC<CardsComponentProps> = ({
  tile,
  setSelectedTile,
  setSelectedCard,
  setIsModalOpen,
}) => {
  // Updated parameter name
  return (
    <Droppable droppableId={`tile-${tile.id}`} type="card">
      {(provided) => (
        <div {...provided.droppableProps} ref={provided.innerRef}>
          {tile.cards
            .sort((a, b) => a.position - b.position) // Sort the cards by position
            .map((card, cardIndex) => (
              <Draggable key={card.id} draggableId={card.id} index={cardIndex}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className=" bg-sky-300 bg-opacity-40 p-2 rounded-xl mt-2 backdrop-blur relative"
                    onClick={() => {
                      setSelectedTile(tile);
                      setSelectedCard(card);
                      setIsModalOpen(true);
                    }}
                  >
                    <div>
                      <h3 className="text-lg font-semibold break-words">
                        {card.name}
                      </h3>
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
