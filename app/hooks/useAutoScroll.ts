import { useEffect, useRef, useState } from "react";

interface UseAutoScrollReturn {
  scrollRef: React.RefObject<HTMLDivElement>;
  isUserScrolling: boolean;
  scrollToBottom: () => void;
}

export function useAutoScroll(dependencies: any[]): UseAutoScrollReturn {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const isAutoScrollingRef = useRef(false);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      isAutoScrollingRef.current = true;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      // Reset after scroll completes
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 100);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current || isAutoScrollingRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    setIsUserScrolling(!isAtBottom);
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        scrollElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    // Always scroll to bottom on new messages
    setTimeout(() => {
      scrollToBottom();
    }, 0);
  }, dependencies);

  return {
    scrollRef,
    isUserScrolling,
    scrollToBottom,
  };
}

