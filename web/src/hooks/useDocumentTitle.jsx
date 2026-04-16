// I created this custom hook to manage the document title dynamically based on the current page or component.
import { useEffect } from "react";

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = `${title} • Chihwa Rentals`;
  }, [title]);
}