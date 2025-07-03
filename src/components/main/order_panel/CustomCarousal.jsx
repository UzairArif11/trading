import React, { useState, useCallback } from 'react';

const CustomTitleCarousel = ({ updates, onTitleClick, currentPage }) => {
  // const [currentPage, setCurrentPage] = useState(0);
  const totalUpdates = updates.length;

  const nextItem = useCallback(() => {
    onTitleClick((currentPage + 1) % totalUpdates); 
  }, [onTitleClick, currentPage, totalUpdates]);

  const prevItem = useCallback(() => {
    onTitleClick((currentPage - 1 + totalUpdates) % totalUpdates); // Sync with parent
  }, [onTitleClick, currentPage, totalUpdates]);

  const handleTitleClick = (index) => {
    onTitleClick(index); 
  };

  const styles = {
    carouselContainer: {
      position: 'relative',
      width: '80%',
      maxWidth: '800px',
      margin: '0 auto',
      overflow: 'hidden',
      backgroundColor: '#232323',
      borderRadius: '10px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    carouselInner: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      width: '100%',
    },
    carouselItem: {
      flex: '0 0 33%', // Show 3 items at a time
      textAlign: 'center',
      opacity: 0.6, // Default opacity for non-selected items
      transform: 'scale(0.8)', // Default scale for non-selected items
      transition: 'all 0.5s ease-in-out',
    },
    selectedItem: {
      opacity: 1, // Full opacity for selected item
      transform: 'scale(1)', // Enlarged scale for selected item
      color: '#21C46D',
    },
    prevButton: {
      position: 'absolute',
      top: '50%',
      left: '10px',
      transform: 'translateY(-50%)',
      backgroundColor: 'rgba(63, 57, 57, 0.5)',
      color: 'white',
      border: 'none',
      padding: '10px',
      cursor: 'pointer',
      zIndex: 1,
    },
    nextButton: {
      position: 'absolute',
      top: '50%',
      right: '10px',
      transform: 'translateY(-50%)',
      backgroundColor: 'rgba(63, 57, 57, 0.5)',
      color: 'white',
      border: 'none',
      padding: '10px',
      cursor: 'pointer',
      zIndex: 1,
    },
    carouselTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      margin: '0',
      cursor: 'pointer',
      color: '#fff',
      textTransform: 'capitalize',
    },
  };

  return (
    <div style={styles.carouselContainer}>
      <button
        style={styles.prevButton}
        onClick={prevItem}
        aria-label="Previous update"
      >
        &#10094;
      </button>

      <div style={styles.carouselInner}>
        {updates.map((update, index) => {
          // Determine the position relative to the currentPage
          const isSelected = index === currentPage;
          const isPrev =
            index === (currentPage - 1 + totalUpdates) % totalUpdates;
          const isNext =
            index === (currentPage + 1) % totalUpdates;

          // Style adjustments based on position
          let style = { ...styles.carouselItem };
          if (isSelected) style = { ...style, ...styles.selectedItem };
          if (!isSelected && !isPrev && !isNext) style.display = 'none'; // Hide non-visible items

          return (
            <div
              key={update.id}
              style={style}
              onClick={() => handleTitleClick(index)}
            >
              <h3 style={styles.carouselTitle}>{update.title}</h3>
            </div>
          );
        })}
      </div>

      <button
        style={styles.nextButton}
        onClick={nextItem}
        aria-label="Next update"
      >
        &#10095;
      </button>
    </div>
  );
};

export default CustomTitleCarousel;
