
import React, { memo, useContext, useState, useCallback,useEffect } from "react";
import Slider from "react-slick";
import { ToastContainer } from "react-toastify";
import "./updateSection.scss";
import { PromotionContext } from "../../../contexts/promotionContext";
import { BACK_OFFICE_IMAGES } from "../../../data/Endpoints-API";
import Spinner from "../../utils/spinner/Spinner";
import CustomTitleCarousel from "./CustomCarousal";
// import { Carousel } from "flowbite-react";

const UpdateSection = () => {
  const { updates, loading } = useContext(PromotionContext); // Access context values
  const [currentPage, setCurrentPage] = useState(0);

  // Memoized handlers to avoid unnecessary re-renders
  // const handleTitleClick = useCallback((index) => {
  //   setCurrentPage(index);
  // }, []);

  // const handleNext = useCallback(() => {
  //   setCurrentPage((prev) => (prev + 1) % updates.length); // Sync title and content
  // }, [updates.length]);

  // const handlePrevious = useCallback(() => {
  //   setCurrentPage((prev) => (prev - 1 + updates.length) % updates.length); // Go to previous update
  // }, [updates.length]);
   // Synchronize the carousel's active slide with the currentPage state
   useEffect(() => {
    const carouselElement = document.querySelector('#titlesCarousel');
    
    const handleSlide = (event) => {
      const index = event.relatedTarget ? event.relatedTarget.dataset.bsSlideTo : 0;
      setCurrentPage(Number(index));
    };

    if (carouselElement) {
      carouselElement.addEventListener('slide.bs.carousel', handleSlide);
    }

    return () => {
      if (carouselElement) {
        carouselElement.removeEventListener('slide.bs.carousel', handleSlide);
      }
    };
  }, []);
  if (loading) {
    return (
      <div>
        Loading updates...
        <Spinner />
      </div>
    );
  }

  // If no updates are available, return a message
  if (!updates || updates.length === 0) {
    return <div>No updates available at the moment.</div>;
  }

  // Destructure the current update for convenience
  const currentUpdate = updates[currentPage];

  const showArrows = Array.isArray(currentUpdate.images) && currentUpdate.images.length > 1;

  const sliderSettings = {
    // dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    adaptiveHeight: true,
    arrows: showArrows,
  };

  return (
    <div className="update-section" >
      {/* <ToastContainer /> */}
      
      {/* <CustomTitleCarousel updates={updates} onTitleClick={handleTitleClick} currentPage={currentPage}/> */}

      <div className="main-row1">
        {/* <h2 className="main-row-h1">{currentUpdate.title}</h2> */}
        <div className="update-container">
        <Slider {...sliderSettings} style={{ height: "auto" }}>
            {Array.isArray(currentUpdate.images) && currentUpdate.images.length > 0 ? (
              currentUpdate.images.map((imgUrl, index) => {
                const imageUrl = `${BACK_OFFICE_IMAGES()}/${imgUrl}`;
                return (
                  <div key={index} className="slider-item">
                    <a href={currentUpdate.button_link} target="_blank" rel="noopener noreferrer" style={{width:"100%"}}>
                      {imgUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${currentUpdate.title} - ${index + 1}`}
                          className="slider-image"
                        />
                        
                      ) : (
                        
                        <div
                        className="bottom-margin"
                          style={{
                            // width: "100%",
                            // height: "120px",
                            backgroundColor: currentUpdate.background_color || "#ccc",
                          }}
                        ></div>
                      )}
                    </a>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "120px",
                  backgroundColor: currentUpdate.background_color || "#ccc",
                }}
              ></div>
            )}
          </Slider>
            <div
              className="updates-content"
              style={{
                position: "absolute",
                top: Array.isArray(currentUpdate.images) && currentUpdate.images.length > 0 && currentUpdate.images[0] !== "" ? "35%" : "15%",
                // top: "35%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "100%",
                textAlign: "center",
                // overflow: "auto",
                zIndex: 2, // Ensure it appears above the slider
                pointerEvents: "none", // Prevent it from blocking clicks
              }}
            >
              <h2
                className="main-row-h1"
                style={{
                  color: currentUpdate.title_color ? currentUpdate.title_color : "20px !important",
                  fontSize: currentUpdate.title_font_size ? `${currentUpdate.title_font_size}px` : "20px !important",
                }}
              >
                {currentUpdate.title && (
                <h2
                  className="main-row-h1"
                  style={{
                    color: currentUpdate.title_color || "black",
                    fontSize: currentUpdate.title_font_size ? `${currentUpdate.title_font_size}px` : "20px",
                  }}
                >
                  {currentUpdate.title}
                </h2>
              )}
              </h2>
              <p
                style={{
                  color: currentUpdate.description_color ? currentUpdate.description_color : "",
                  fontSize: currentUpdate.description_font_size ? `${currentUpdate.description_font_size}px` : "",
                }}
              >
                {currentUpdate.description && (
                <p
                  style={{
                    color: currentUpdate.description_color || "black",
                    fontSize: currentUpdate.description_font_size ? `${currentUpdate.description_font_size}px` : "16px",
                  }}
                >
                  {currentUpdate.description}
                </p>
              )}
              </p>
              {currentUpdate.button_text ? (
                
                <button
                  className="learn-more-button"
                  onClick={() => window.open(currentUpdate.button_link, "_blank")}
                  style={{ pointerEvents: "auto", backgroundColor:currentUpdate.button_color? currentUpdate.button_color : '#21c46d' , color:currentUpdate.buttonTextCol? currentUpdate.buttonTextCol : 'white'}} // Allow button to be clickable
                >
                  {currentUpdate.button_text}
                </button>
              ) : null}
            </div>
        </div>



        {/* Pagination Buttons */}
        {/* <div className="pagination-buttons">
          <button className="prev-button" onClick={handlePrevious} aria-label="Previous update">
            Previous
          </button>
          <button className="next-button" onClick={handleNext} aria-label="Next update">
            Next
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default memo(UpdateSection);
