"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore";
import firebase_app from "@/firebase";
import { Tiles } from "./_components/tiles/tiles";
import { useHandleDrag } from "./_hooks/useHandleDrag";
import { useSave } from "./_hooks/useSave";
import { CardModal } from "./_components/cards/cardModal";
import { useRemoveCard } from "./_hooks/cards/useRemoveCard";
import { useAuth } from "../_hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Settings from "./_components/settings/settings";

// Define the types for the cards and tiles
export type Card = {
  id: string;
  name: string;
  position: number;
  description: string;
  assignedTo: string;
};

export type Tile = {
  id: string;
  name: string;
  position: number;
  cards: Card[];
};

export interface Role {
  name: string;
  changePermissions: boolean;
  addRemoveRole: boolean;
  moveCard: boolean;
  addRemoveCard: boolean;
  moveTile: boolean;
  addRemoveTile: boolean;
}

export default function MainApp() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const db = getFirestore(firebase_app);
  const [removedTileIds, setRemovedTileIds] = useState<Set<string>>(new Set());
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');
  //const workspaceId = sessionStorage.getItem("workspaceId");
  const ownerUsername = sessionStorage.getItem("ownerUsername");
  //modal consts idk
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const username = useAuth();
  const [userRole, setUserRole] = useState<Role | null>(null);


  

  // Fetch tiles from Firebase on initial render
  useEffect(() => {
    const fetchTiles = async () => {
      if (ownerUsername && workspaceId) {
        // Fetch the user's document from the users collection
        const tileCollection = collection(
          db,
          "users",
          ownerUsername,
          "workspaces",
          workspaceId,
          "tiles"
        );

        // Set up a listener for data changes
        const unsubscribe = onSnapshot(tileCollection, async (tileSnapshot) => {
          const tiles = await Promise.all(
            tileSnapshot.docs.map(async (doc) => {
              const tileData = doc.data();
              const cardCollection = collection(
                tileCollection,
                doc.id,
                "cards"
              );
              const cardSnapshot = await getDocs(cardCollection);
              const cards = cardSnapshot.docs.map(
                (doc) => ({ id: doc.id, ...doc.data() } as Card)
              );
              return { id: doc.id, ...tileData, cards } as Tile;
            })
          );
          setTiles(tiles);
        });

        // Return the unsubscribe function to clean up the listener on component unmount
        return unsubscribe;
      }
    };

    fetchTiles();
  }, [ownerUsername, workspaceId, db]);

   useEffect(() => {
     const fetchUserRole = () => {
       if (ownerUsername && workspaceId && username) {
         const memberRef = doc(
           db,
           "users",
           ownerUsername,
           "workspaces",
           workspaceId,
           "members",
           username
         );
         const unsubscribeFromMember = onSnapshot(
           memberRef,
           (memberSnapshot) => {
             const memberData = memberSnapshot.data();
             if (memberData) {
               const role = memberData.role;

               // Fetch data from workspaceId, "roles", userRole
               const roleRef = doc(
                 db,
                 "users",
                 ownerUsername,
                 "workspaces",
                 workspaceId,
                 "roles",
                 role
               );
               const unsubscribeFromRole = onSnapshot(
                 roleRef,
                 (roleSnapshot) => {
                   const roleData = roleSnapshot.data();
                   setUserRole(roleData as Role);
                 }
               );

               // Return cleanup function for role snapshot
               return () => unsubscribeFromRole();
             }
           }
         );

         // Return cleanup function for member snapshot
         return () => unsubscribeFromMember();
       }
     };

     // Call fetchUserRole and store cleanup function
     const unsubscribe = fetchUserRole();

     // Cleanup function for useEffect
     return () => {
       if (unsubscribe) {
         unsubscribe();
       }
     };
   }, [db, ownerUsername, workspaceId, username]);

  const { removedCardIds, setRemovedCardIds, handleRemoveCard } =
    useRemoveCard(setTiles, userRole);

  //handle dragging
  const { handleDragEnd, isDragging, movedCards } = useHandleDrag(
    tiles,
    setTiles,
    userRole
  );

  //save in firebase
  const { handleSave } = useSave(
    ownerUsername || "",
    db,
    tiles,
    removedTileIds,
    setRemovedTileIds,
    movedCards,
    removedCardIds,
    setRemovedCardIds,
    workspaceId || "" // Provide a default value of an empty string
  );

 

  return (
    <div className="min-h-screen bg-gray-100">
      
        <Settings
          workspaceId={workspaceId || ""}
          ownerUsername={ownerUsername || ""}
          userRole={userRole as Role}
        />
      

      <Tiles
        tiles={tiles}
        setTiles={setTiles}
        handleDragEnd={handleDragEnd}
        removedTileIds={removedTileIds}
        setRemovedTileIds={setRemovedTileIds}
        setSelectedTile={setSelectedTile}
        setSelectedCard={setSelectedCard}
        setIsModalOpen={setIsModalOpen}
        userRole={userRole}
      />

      <div className="fixed bottom-0 left-0 w-full flex justify-center pb-4">
        <button
          disabled={isDragging}
          onClick={handleSave}
          className={`p-4 w-40 mt-4 text-white rounded-2xl bg-green-400 ${
            isDragging ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          Save
        </button>
      </div>
      <CardModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        selectedCard={selectedCard}
        setSelectedCard={setSelectedCard}
        selectedTile={selectedTile}
        tiles={tiles}
        handleRemoveCard={handleRemoveCard}
      />
    </div>
  );
}
