import { useEffect, useRef } from "react";
import { Card } from "../../page";

export const useModal = (selectedCard: Card | null, isModalOpen: boolean) => {
  //modal card description
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const nameRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const resizeTextArea = () => {
      if (descriptionRef.current) {
        descriptionRef.current.style.height = "128px";
        descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
      }
    };

    resizeTextArea();

    if (descriptionRef.current) {
      descriptionRef.current.addEventListener("input", resizeTextArea);
      return () => {
        if (descriptionRef.current) {
          descriptionRef.current.removeEventListener("input", resizeTextArea);
        }
      };
    }
  }, [selectedCard?.description, isModalOpen]);

  //modal card name

  useEffect(() => {
    const resizeTextArea = () => {
      if (nameRef.current) {
        nameRef.current.style.height = "28px";
        nameRef.current.style.height = `${nameRef.current.scrollHeight}px`;
      }
    };

    resizeTextArea();

    if (nameRef.current) {
      nameRef.current.addEventListener("input", resizeTextArea);
      return () => {
        if (nameRef.current) {
          nameRef.current.removeEventListener("input", resizeTextArea);
        }
      };
    }
  }, [selectedCard?.name, isModalOpen]);

  return {
    descriptionRef,
    nameRef,
  };
};
