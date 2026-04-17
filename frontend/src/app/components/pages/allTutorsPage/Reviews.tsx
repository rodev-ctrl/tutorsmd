
"use client";
import React, {
  FunctionComponent,
  useEffect,
  useState,
} from "react";

import { Review } from "../../../interfaces";

import { Box, Button, Card, Input, Typography } from "@mui/material";
const Edit = require("../../../../assets/img/edit.png");


type T = {
    teach: string,
      reviewsOfStudents: string,
      chooseDate: string,
      chooseTime: string,
      subjectLabel: string,
      nativeLangHeader: string,
      nativeLang: string,
      levelHeader: string,
      levelLabel: string,
      book: string,
      time: string,
      join: string,
      cancel: string,
      afterBooked: string,
      whyCancelled: string,
      complaint: string,
      afterComplaint: string,
      buttonsAfterComplaint: string[],
      afterCompletedBooking: string[], 
      subjectsTitle: string,
      moreAboutYou: string,
      back: string,
      next: string,
      writeReview: string,
      reviewPH: string,
      send: string,
      edit: string,
      reviews: string,
      showMore: string,
      collapse: string,
      likedLesson: string,
      pickDays: string,
      pickDaysFirst: string,
      changeDays: string,
      savePlan: string,
  }


type Props = {
    isTwoCols: boolean,
    currentReview: string, 
    setCurrentReview: (currentReview: string) => void,
    currentGrade: number, 
    setCurrentGrade: (currentGrade: number) => void,
    hoveredStar: number | null, 
    setHoveredStar: (hoveredStar: number | null) => void,
    Star: ({ filled, size }: { filled: boolean; size?: number }) => JSX.Element,
    submitReview: () => void,
    reviewsVisible: Array<Review>,
    reviews: Array<Review>,
    myReview: Review | null,
    visibleCountReviews: number,
    setVisibleCountReviews: (visibleCountReviews: number) => void,
    T: T
};



const Reviews: FunctionComponent<Props> = (props) => {

    const {
        isTwoCols,
        currentReview, setCurrentReview,
        currentGrade, setCurrentGrade,
        hoveredStar, setHoveredStar,
        Star,
        submitReview,
        reviewsVisible,
        reviews,
        myReview,
        visibleCountReviews,
        setVisibleCountReviews,
        T
    } = props;

    // ---- constants/helpers ----
const COMMENTS_PER_PAGE = 5;
const ITEMS_PER_PAGE = 3;

const [isEditReview, setIsEditReview] = useState<boolean>(false);


useEffect(() => {
   if(myReview) {
    setCurrentReview(myReview.comment);
    setCurrentGrade(myReview.grade);
   }
}, [myReview])

    return (
    <>
    
    <div className={`mt-10 p-4 grid ${isTwoCols ? "grid-cols-2" : "grid-cols-1"}`}>
      
      
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg w-full p-4">
        
        {isEditReview && (
            <>
            <h4 className="text-2xl font-bold mb-6 text-gray-800 text-center">{T.writeReview}</h4>

<Input
    type="text"
    placeholder={T.reviewPH}
    className="w-full p-4 mb-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    onChange={(e) => setCurrentReview(e.target.value)}
    value={currentReview}
/>

<div className="flex items-center space-x-2 mt-5 mb-5">
{[1, 2, 3, 4, 5].map((star) => (
<div
key={star}
onClick={() => setCurrentGrade(star)}
onMouseEnter={() => setHoveredStar(star)}
onMouseLeave={() => setHoveredStar(null)}
>
<Star filled={(hoveredStar ?? currentGrade) >= star} size={32} />
</div>
))}
</div>
            </>
        )}
        

  <div className="flex justify-center mt-6">
    <Button
      onClick={isEditReview ? () => submitReview() : () => setIsEditReview(true)}
      className="mx-auto font-semibold shadow-md"
      sx={{ backgroundColor: "orange", color: "white", borderRadius: "20px", width: "80%", height: "48px", "&:hover": { backgroundColor: "#ffb84d" } }}
    >
      {myReview ? T.edit : T.send}
    </Button>
  </div>
</div>

<div id="reviews" className="mt-6 p-6 bg-white rounded-2xl" style={{ boxShadow: "0 0 2rem rgba(0,0,0,.075), 0rem 1rem 1rem -1rem rgba(0,0,0,.1)" }}>
  <h3 className="text-xl font-semibold text-gray-800 mb-6">{T.reviews}</h3>

  <div className="space-y-4 mt-2">
    {reviewsVisible.map((r, idx) => (
      <Card key={idx} className="p-5 bg-gray-50 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center mb-2">
          <h6 className="text-lg font-medium text-gray-900">{r.first_name} {r.last_name}</h6>
          <div className="flex items-center space-x-1 ml-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} filled={r.grade >= s} size={14} />
            ))}
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed pl-2">{r.comment}</p>
      </Card>
    ))}

    {reviews.length > COMMENTS_PER_PAGE && (
      <div className="flex justify-center p-4">
        {visibleCountReviews < reviews.length ? (
          <Button
            onClick={() => setVisibleCountReviews(visibleCountReviews + COMMENTS_PER_PAGE)}
            className="font-semibold rounded-lg shadow-md"
            fullWidth
            sx={{ borderRadius: "20px", backgroundColor: "orange", color: "white", height: "48px", "&:hover": { backgroundColor: "#ffb84d" } }}
            color="warning"
          >
            {T.showMore}
          </Button>
        ) : (
          <Button
            onClick={() => setVisibleCountReviews(COMMENTS_PER_PAGE)}
            className="font-semibold rounded-lg shadow-md"
            fullWidth
            sx={{ borderRadius: "8px", backgroundColor: "orange", color: "white", height: "48px", "&:hover": { backgroundColor: "#ffb84d" } }}
            color="warning"
          >
            {T.collapse}
          </Button>
        )}
      </div>
    )}
  </div>
</div>
</div>
        </>
    )
}

export default React.memo(Reviews);