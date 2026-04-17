"use client";
import { forwardRef, useEffect, useState } from "react";
import MobileTutor from "./TutorDevice/MobileTutor";
import DekstopTutor from "./TutorDevice/DekstopTutor";
import React from "react";

import "../Tutors.css";

import * as Types from "../../../../interfaces/index";

type Props = React.ComponentProps<"div"> & {
  tutor: Types.Tutor;
  length: number;
  classOfAnimation?: string;
  setCurrentNameTutor: (currentNameTutor: string) => void;
  setCurrentSurnameTutor: (currentSurnameTutor: string) => void;
  currentNameTutor: string;
  currentSurnameTutor: string;
  filteredTutorsLength: number;
};

const Tutor = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const {
    tutor,
    classOfAnimation = "",
    setCurrentNameTutor,
    setCurrentSurnameTutor,
    currentNameTutor,
    currentSurnameTutor,
    filteredTutorsLength,
  } = props;


  const [commonClassname] = useState<string>(
    `tutor m-auto mb-20 justify-center w-11/12 shadow-[0_-3px_38px_-9px_rgba(0,0,0,1)] hover:cursor-pointer ${classOfAnimation}`
  );

  return (
    <div ref={ref}>
      {window.innerWidth < 1250 ? (
        <MobileTutor
          grade={tutor.rating_avg}
          tutor={tutor}
          commonClassname={commonClassname}
          setCurrentNameTutor={setCurrentNameTutor}
          setCurrentSurnameTutor={setCurrentSurnameTutor}
          currentNameTutor={currentNameTutor}
          currentSurnameTutor={currentSurnameTutor}
        />
      ) : (
        <DekstopTutor
          tutor={tutor}
          commonClassname={commonClassname}
        />
      )}
    </div>
  );
});

export default React.memo(Tutor);


