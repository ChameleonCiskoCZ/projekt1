"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
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
import InvoicePopup from "./_components/invoice/invoicePopup";
import Navbar from "../components/Navbar";
import { useNavbar } from "../components/NavbarContext";

// Define the types for the cards and tiles
export type Card = {
  id: string;
  name: string;
  position: number;
  description: string;
  assignedTo: string[];
  elapsedTime: number;
  images?: string[];
};

export type Tile = {
  id: string;
  name: string;
  position: number;
  cards: Card[];
};

export interface Member {
  username: string;
  role: string;
}

export interface Role {
  name: string;
  changePermissions: boolean;
  addRemoveRole: boolean;
  moveCard: boolean;
  addRemoveCard: boolean;
  moveTile: boolean;
  addRemoveTile: boolean;
  assignCard: boolean;
}

export default function MainApp() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const db = getFirestore(firebase_app);
  const [removedTileIds, setRemovedTileIds] = useState<Set<string>>(new Set());
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  //const workspaceId = sessionStorage.getItem("workspaceId");
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  //modal consts idk
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const username = useAuth();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [showAssignedCards, setShowAssignedCards] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [isInvoicePopupOpen, setIsInvoicePopupOpen] = useState(false);
  const { isNavbarCollapsed } = useNavbar();

  const [loading, setLoading] = useState(true);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedOwnerUsername = sessionStorage.getItem("ownerUsername");
    const storedUserRole = sessionStorage.getItem("userRole");
    const storedMembers = sessionStorage.getItem("members");

   if (storedOwnerUsername && storedOwnerUsername !== "undefined") {
     setOwnerUsername(storedOwnerUsername);
   }
   if (storedUserRole && storedUserRole !== "undefined") {
     setUserRole(JSON.parse(storedUserRole));
   }
   if (storedMembers && storedMembers !== "undefined") {
     setMembers(JSON.parse(storedMembers));
   }
  }, []);

  


  // Fetch tiles from Firebase on initial render
 useEffect(() => {
   const fetchTilesAndCards = async () => {
     setLoading(true);
     if (!ownerUsername || !workspaceId) {
       setLoading(false);
       return;
     }

     try {
       const tileCollection = collection(
         db,
         "users",
         ownerUsername,
         "workspaces",
         workspaceId,
         "tiles"
       );

       const unsubscribeTiles = onSnapshot(tileCollection, (tileSnapshot) => {
         const tilePromises = tileSnapshot.docs.map(async (tileDoc) => {
           const tileData = tileDoc.data();
           const cardCollection = collection(tileDoc.ref, "cards");

           const unsubscribeCards = onSnapshot(
             cardCollection,
             (cardSnapshot) => {
               const cards = cardSnapshot.docs.map(
                 (cardDoc) => ({ id: cardDoc.id, ...cardDoc.data() } as Card)
               );

               setTiles((prevTiles) => {
                 const updatedTiles = prevTiles.map((tile) => {
                   if (tile.id === tileDoc.id) {
                     return { ...tile, cards };
                   }
                   return tile;
                 });

                 return updatedTiles;
               });
             }
           );

           return { id: tileDoc.id, name: tileData.name, position: tileData.position, cards: [], unsubscribeCards } as Tile;
         });

         Promise.all(tilePromises).then((tiles) => {
           setTiles(tiles);
           setLoading(false);
         });
       });

       return () => {
         unsubscribeTiles();
         setTiles((prevTiles) => {
           prevTiles.forEach((tile) => {
             // No need to unsubscribe from cards as it is not part of the Tile type
           });
           return [];
         });
       };
     } catch (error) {
       console.error("Error fetching tiles and cards:", error);
       setLoading(false);
     }
   };

   fetchTilesAndCards();
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

              if (role) {
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
                    if (roleData) {
                      setUserRole(roleData as Role);
                      sessionStorage.setItem(
                        "userRole",
                        JSON.stringify(roleData)
                      );
                    } else {
                      setUserRole(null);
                      sessionStorage.removeItem("userRole");
                    }
                  }
                );

                // Return cleanup function for role snapshot
                return () => unsubscribeFromRole();
              } else {
                setUserRole(null);
                sessionStorage.removeItem("userRole");
              }
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

  useEffect(() => {
    const fetchMembers = async () => {
      if (ownerUsername && workspaceId) {
        const membersCollection = collection(
          db,
          "users",
          ownerUsername,
          "workspaces",
          workspaceId,
          "members"
        );
        const membersSnapshot = await getDocs(membersCollection);
        const membersList = membersSnapshot.docs.map((doc) => ({
          ...(doc.data() as Member),
        }));
        setMembers(membersList);
        sessionStorage.setItem("members", JSON.stringify(membersList));
      }
    };

    fetchMembers();
  }, [db, ownerUsername, workspaceId]);

  const { removedCardIds, setRemovedCardIds, handleRemoveCard } = useRemoveCard(
    setTiles,
    userRole
  );

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
    workspaceId || ""
  );

  useEffect(() => {
    if (!loading && !isDragging) {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
        handleSave();
      }, 100); 
    }
  }, [tiles, selectedCard]);

  const rightButtons = (
    <>
      <Settings
        workspaceId={workspaceId || ""}
        ownerUsername={ownerUsername || ""}
        userRole={userRole as Role}
        members={members}
      />
      <i
        className="fas mt-0.5 text-xl fa-filter cursor-pointer p-2 rounded-xl hover:bg-sky-100"
        onClick={() => setShowAssignedCards(!showAssignedCards)}
      ></i>
      <i
        className="fas fa-file-invoice text-xl mt-0.5 cursor-pointer p-2 rounded-xl hover:bg-sky-100"
        onClick={() => setIsInvoicePopupOpen(true)}
      ></i>
    </>
  );

  return (
    <div className="min-h-max min-w-max bg-gray-100 flex">
      <Navbar rightButtons={rightButtons} />

      <InvoicePopup
        tiles={tiles}
        isOpen={isInvoicePopupOpen}
        onClose={() => setIsInvoicePopupOpen(false)}
      />

      <div
        className={`mt-12 ${
          isNavbarCollapsed ? "ml-16" : "ml-48"
        } transition-margin duration-300 p-2`}
      >
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
          showAssignedCards={showAssignedCards}
        />
      </div>

      <div className="fixed bottom-0 left-0 w-full flex justify-center pb-4">
        {/*
          <button
          disabled={isDragging}
          onClick={handleSave}
          className={`p-4 w-40 mt-4 text-white rounded-2xl bg-green-400 ${isDragging ? "cursor-not-allowed opacity-50" : ""
            }`}
        >
          Save
        </button>*/}
      </div>
      <CardModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        selectedCard={selectedCard}
        setSelectedCard={setSelectedCard}
        selectedTile={selectedTile}
        tiles={tiles}
        handleRemoveCard={handleRemoveCard}
        workspaceId={workspaceId || ""}
        ownerUsername={ownerUsername || ""}
        members={members}
        userRole={userRole}
      />
    </div>
  );
}
