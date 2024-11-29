// Create a new file: useKeyboardFix.js
import { useEffect } from 'react';

export const useKeyboardFix = () => {
  useEffect(() => {
    // Save the original viewport height
    const originalViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    let viewportHandler;

    const handleViewportChange = () => {
      if (!window.visualViewport) return;
      
      const currentViewportHeight = window.visualViewport.height;
      
      // Check if keyboard is visible (viewport height decreased significantly)
      const keyboardVisible = currentViewportHeight < originalViewportHeight * 0.8;
      
      if (keyboardVisible) {
        // When keyboard is visible, ensure the focused element is in view
        const focusedElement = document.activeElement;
        if (focusedElement && focusedElement.tagName === 'INPUT') {
          setTimeout(() => {
            focusedElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }, 100);
        }
      }
    };

    if (window.visualViewport) {
      viewportHandler = window.visualViewport.addEventListener('resize', handleViewportChange);
    }

    // Cleanup
    return () => {
      if (window.visualViewport && viewportHandler) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
    };
  }, []);
};