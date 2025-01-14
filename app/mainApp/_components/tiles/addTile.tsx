import React, { RefObject } from "react";

interface AddTileProps {
  isClicked: boolean;
  setIsClicked: (clicked: boolean) => void;
  name: string;
  setName: (name: string) => void;
  buttonRef: RefObject<HTMLButtonElement>;
  tileRef: RefObject<HTMLDivElement>;
  handleAddTile: () => void;
}

export const AddTile: React.FC<AddTileProps> = ({
  isClicked,
  setIsClicked,
  name,
  setName,
  buttonRef,
  tileRef,
  handleAddTile,
}) => {
  return (
    <div
      ref={tileRef}
      onClick={(event) => {
        if (
          buttonRef.current &&
          buttonRef.current.contains(event.target as Node)
        ) {
          return;
        }
        event.stopPropagation();
        setIsClicked(true);
      }}
      className={`self-start p-4 rounded-2xl shadow m-2 w-64 flex-shrink-0 relative ${
        isClicked
          ? "bg-white"
          : "bg-sky-50 shadow  hover:bg-sky-100  cursor-pointer"
      } ${isClicked ? "h-auto" : "min-h-20"} ${
        isClicked ? "" : "flex items-center justify-center"
      }`}
    >
      {isClicked ? (
        <div className="flex flex-col">
          <input
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault(); // Prevent form submission
                handleAddTile();
              }
            }}
            autoFocus
            className="mb-2 px-2 py-1 border-2 border-gray-200 rounded-xl w-full"
          />
          <button
            ref={buttonRef}
            onClick={handleAddTile}
            className="px-4 py-2 bg-sky-100 hover:bg-sky-200 rounded-xl w-full"
          >
            Add Tile
          </button>
        </div>
      ) : (
        <p className="text-4xl">+</p>
      )}
    </div>
  );
};
