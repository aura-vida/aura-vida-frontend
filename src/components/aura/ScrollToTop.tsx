import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router doesn't reset scroll position on navigation — without this,
// clicking a link while scrolled down on one page (e.g. a Modalities card
// near the bottom of the home page) lands you at the same pixel offset on
// the next page, which can be anywhere (mid-list, a footer, etc.) instead
// of the top. Scoped to pathname only, so in-page hash scrolling (e.g.
// Guides.tsx's own anchor-scroll effect) isn't fought over.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
