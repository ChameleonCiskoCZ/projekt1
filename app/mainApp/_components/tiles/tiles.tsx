import { RefObject, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { AddTile } from "./addTile";
import { Cards } from "../cards/cards";
import { AddCard } from "../cards/addCard";
import { TileMenu } from "./tileMenu";
import { Tile } from "../../page";
import { Card } from "../../page";
import { useAddTile } from "../../_hooks/tiles/useAddTile";
import { useTileMenu } from "../../_hooks/tiles/useTileMenu";
import { useAddCard } from "../../_hooks/cards/useAddCard";
import { Dispatch, SetStateAction } from "react";
import { useTileNameChange } from "../../_hooks/tiles/useTileNameChange";

interface TilesProps {
  tiles: Tile[];
  setTiles: Dispatch<SetStateAction<Tile[]>>;
  handleDragEnd: (result: any) => void; // Replace with the actual type of the result
  removedTileIds: Set<string>;
  setRemovedTileIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedTile: React.Dispatch<React.SetStateAction<Tile | null>>;
  setSelectedCard: React.Dispatch<React.SetStateAction<Card | null>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Tiles: React.FC<TilesProps> = ({
  tiles,
  setTiles,
  handleDragEnd,
  removedTileIds,
  setRemovedTileIds,
  setSelectedTile,
  setSelectedCard,
  setIsModalOpen,
}) => {
  const tileRef = useRef<HTMLDivElement>(null);

  //hook for changing tile name
  const {
    editingTileId,
    setEditingTileId,
    newName,
    setNewName,
    handleNameChange,
    textareaRef,
  } = useTileNameChange(tiles, setTiles);

  //handle for adding tiles
  const { name, setName, isClicked, setIsClicked, handleAddTile } = useAddTile(
    tiles,
    setTiles,
    tileRef
  );

  //hook for tile menu
  const {
    openTileId,
    menuRef,
    buttonRef,
    menuPosition,
    handleButtonClick,
    handleRemoveTile,
  } = useTileMenu(tiles, setTiles, removedTileIds, setRemovedTileIds);

  //hook for adding cards
  const {
    newCardName,
    setNewCardName,
    addCardRef,
    expandedTileId,
    handleAddCardClick,
    handleAddCard,
  } = useAddCard(tiles, setTiles);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="all-tiles" direction="horizontal" type="tile">
        {(provided) => (
          <div
            className="flex"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {tiles
              .sort((a, b) => a.position - b.position)
              .map((tile, index) => (
                <Draggable key={tile.id} draggableId={tile.id} index={index}>
                  {(provided) => (
                    <>
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="p-2 bg-white flex-shrink-0 rounded-2xl shadow-lg m-2 w-64 relative flex flex-col self-start"
                      >
                        {/* Add the ref to the button */}
                        <div className="grid grid-cols-12 gap-2 items-start">
                          <div className="col-span-10">
                            {editingTileId === tile.id ? (
                              <textarea
                                ref={textareaRef}
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onBlur={() => handleNameChange(tile.id)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleNameChange(tile.id)
                                }
                                autoFocus
                                className="text-xl resize-none w-full p-0.5 pl-2 font-bold overflow-hidden break-words rounded-xl flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500 block"
                              />
                            ) : (
                              <div
                                className="text-xl resize-none w-full p-0.5 pl-2 font-bold overflow-hidden break-words rounded-xl flex-grow cursor-pointer block"
                                onClick={() => {
                                  setEditingTileId(tile.id);
                                  setNewName(tile.name || "");
                                }}
                              >
                                <h2>{tile.name || "edit"}</h2>
                              </div>
                            )}
                          </div>
                          <button
                            ref={buttonRef}
                            onClick={(event) =>
                              handleButtonClick(tile.id, event)
                            }
                            className="col-span-2 text-xl p-2.5 rounded-xl hover:bg-gray-100 justify-self-end box-content"
                          >
                            <span className="w-4 h-0.5 bg-black block mb-1 rounded-full"></span>
                            <span className="w-4 h-0.5 bg-black block mb-1 rounded-full"></span>
                            <span className="w-4 h-0.5 bg-black block rounded-full"></span>
                          </button>
                        </div>
                        <div>
                          <Cards
                            setSelectedTile={setSelectedTile}
                            tile={tile}
                            setSelectedCard={setSelectedCard}
                            setIsModalOpen={setIsModalOpen}
                          />
                          <div>
                            <AddCard
                              expandedTileId={expandedTileId}
                              tile={tile}
                              addCardRef={addCardRef}
                              newCardName={newCardName}
                              setNewCardName={setNewCardName}
                              handleAddCard={handleAddCard}
                              handleAddCardClick={handleAddCardClick}
                            />
                          </div>
                        </div>
                      </div>
                      <TileMenu
                        openTileId={openTileId}
                        tile={tile}
                        menuPosition={menuPosition}
                        menuRef={menuRef}
                        handleRemoveTile={handleRemoveTile}
                      />
                    </>
                  )}
                </Draggable>
              ))}
            {provided.placeholder}
            <AddTile
              isClicked={isClicked}
              setIsClicked={setIsClicked}
              name={name}
              setName={setName}
              buttonRef={buttonRef}
              tileRef={tileRef}
              handleAddTile={handleAddTile}
            />
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
