"use client";
import React, { useState, FunctionComponent, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, shallowEqual } from "react-redux";
import Input from "@mui/material/Input";
import { Link } from "react-router-dom";
import "./Tutors.css";

import * as Types from "../../../interfaces/index";


type PropsTutorsComponent = {
  setCurrentNameTutor: (currentNameTutor: string) => void;
  setCurrentSurnameTutor: (currentSurnameTutor: string) => void;
  currentNameTutor: string;
  currentSurnameTutor: string;
  filteredTutorsLength?: number;
};

import Tutor from "./Tutor/Tutor";
import { useLanguage } from "../../../context/LanguageContext";

// ===== helpers =====

const norm = (s: string) => s.toLowerCase().trim();

function pickAllSubjectsFromTutor(t: Types.Tutor): string[] {
  // поддерживаем обе формы availableSubjects
  const asAny = t.availableSubjects as any;
  if (Array.isArray(asAny)) return asAny.map(String);
  const ru = (asAny?.ru ?? []).map(String);
  const de = (asAny?.de ?? []).map(String);
  return [...ru, ...de];
}

const Tutors: FunctionComponent<PropsTutorsComponent> = ({
  setCurrentNameTutor,
  setCurrentSurnameTutor,
  currentNameTutor,
  currentSurnameTutor,
  filteredTutorsLength,
}) => {
  

  const { language } = useLanguage();
  const tutors = useSelector((state: any) => {
    const data = language === "german" ? state.german : state.russian
    return data?.tutors;
  })
  // Тянем локализованные подписи предметов из стора
  const headerText = useSelector((state: any) => {
    // Проверяем, какая ветка сейчас активна в сторе
    const data = language === "german" ? state.german : state.russian
    return data?.headerText || ""; // Если данных нет, возвращаем пустой массив
  }, shallowEqual);
  const rawValues: string[] = headerText?.buttonSortTutors?.subjectValues ?? [];
  // rawValues = ["Все/Alle", "Математика/Mathe", "Немецкий/Deutsch", ...]
  const allLabel = language === "german" ? "Alle" : "Все";

  // Опции для выпадашки на текущем языке:
  // пропускаем первый элемент (это "Все/Alle") — его рисуем отдельно
  const subjectOptions: string[] = useMemo(() => {
    if (!Array.isArray(rawValues)) return [];
    // Если вдруг в массиве нет первого "Все/Alle" — просто используем как есть
    const arr = rawValues.slice();
    // Защита от несоответствия (когда первый элемент отличается от ожидаемого)
    const first = arr[0]?.toLowerCase();
    if (first === "alle" || first === "все") {
      arr.shift();
    }
    return arr;
  }, [rawValues, language]);

  // UI state
  const [gridClassName, setGridClassName] = useState<string>("grid grid-cols-1");
  const [selectSubjectsDisplay, setSelectSubjectsDisplay] = useState<string>("hidden");
  const [selectedSubjectLabel, setSelectedSubjectLabel] = useState<string>(allLabel);
  const [tutorsCopy, setTutorsCopy] = useState<Types.Tutor[]>([]);

  const ref = useRef<HTMLDivElement>(null);

  // i18n
  const i18n = {
    slogan: language === "german" ? "Finde perfekten Lehrer" : "Найдите идеального репетитора",
    headerSortValues: language === "german" ? "Wähl den Fach aus" : "Выбери предмет",
    allLabel,
  };

  const selectedLabelForButton = selectedSubjectLabel === allLabel ? i18n.headerSortValues : selectedSubjectLabel;

  // Сетка
  const applyGrid = () => {
    if (typeof window === "undefined") return;
    const effectiveLen =
      selectedSubjectLabel === allLabel ? (tutors?.length ?? 0) : (tutorsCopy?.length ?? 0);
    const oneCol = window.innerWidth <= 600 || (effectiveLen === 1 && window.innerWidth > 600);
    setGridClassName(oneCol ? "grid grid-cols-1" : "grid grid-cols-2");
  };

  useEffect(() => {
    applyGrid();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", applyGrid);
      return () => window.removeEventListener("resize", applyGrid);
    }
   
  }, [filteredTutorsLength, tutorsCopy.length, tutors.length, selectedSubjectLabel]);

  // Фильтрация по выбранной подписи (на текущем языке)
  function filterTutorsByLabel(label: string) {
    if (!label || label === allLabel) {
      setTutorsCopy(tutors);
      return;
    }
    const target = norm(label);

    const filtered = (tutors || []).filter((t: Types.Tutor) => {
      const pool = pickAllSubjectsFromTutor(t).map(norm);
      return pool.includes(target);
    });

    setTutorsCopy(filtered);
  }

  // Пересчёт при изменениях
  useEffect(() => {
    filterTutorsByLabel(selectedSubjectLabel);
  }, [selectedSubjectLabel, tutors, language]);

  // Изначально — все
  useEffect(() => {
    setTutorsCopy(tutors);
  }, [tutors]);

  return (
    <div key={language} className="tutors content-center w-full justify-center items-center" id="tutors" ref={ref}>
      <h3 className="text-center pt-5 pb-5 text-3xl">
        <Link to={`${process.env.REACT_APP_CLIENT_URL}/tutors`}>{i18n.slogan}</Link>
      </h3>

      {/* Выбор предмета */}
      <div className="choose mb-12 text-blue-500 text-center">
        <Input
          onClick={() => setSelectSubjectsDisplay((d) => (d === "hidden" ? "block" : "hidden"))}
          type="button"
          value={selectedLabelForButton}
          className="text-2xl w-60 border-4 border-black rounded-t-lg text-center p-4 hover:cursor-pointer sortButton"
        />

        <AnimatePresence>
          {selectSubjectsDisplay === "block" && (
            <motion.div
              className={`selectSubjects text-center m-auto rounded-b-lg w-60 hover:cursor-pointer ${selectSubjectsDisplay}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 320, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* Все / Alle */}
              <div
                key="all"
                className="py-4 text-2xl bg-gray-600 text-orange-300 hover:font-bold duration-200"
                onClick={() => {
                  setSelectedSubjectLabel(allLabel);
                  setSelectSubjectsDisplay("hidden");
                }}
              >
                {i18n.allLabel}
              </div>

              {/* Опции (локализованные из headerText.buttonSortTutors.subjectValues) */}
              {subjectOptions.map((label) => (
                <div
                  key={label}
                  className="py-4 text-2xl bg-gray-600 hover:font-bold duration-200"
                  onClick={() => {
                    setSelectedSubjectLabel(label);
                    setSelectSubjectsDisplay("hidden");
                  }}
                >
                  {label}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Список репетиторов */}
      <div className={`${gridClassName} justify-center mb-20`}>
        {(selectedSubjectLabel !== allLabel ? tutorsCopy : tutors)?.length === 0 ? (
          (tutors ?? []).map((tutor: Types.Tutor) => (
            <Tutor
              key={tutor.id}
              length={tutors?.length ?? 0}
              tutor={tutor}
              setCurrentNameTutor={setCurrentNameTutor}
              setCurrentSurnameTutor={setCurrentSurnameTutor}
              currentNameTutor={currentNameTutor}
              currentSurnameTutor={currentSurnameTutor}
              filteredTutorsLength={tutors?.length ?? 0}
            />
          ))
        ) : (
          <AnimatePresence>
            {(selectedSubjectLabel === allLabel ? tutors : tutorsCopy).map((tutor: Types.Tutor) => (
              <motion.div
                key={tutor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Tutor
                  length={tutors?.length ?? 0}
                  tutor={tutor}
                  setCurrentNameTutor={setCurrentNameTutor}
                  setCurrentSurnameTutor={setCurrentSurnameTutor}
                  currentNameTutor={currentNameTutor}
                  currentSurnameTutor={currentSurnameTutor}
                  filteredTutorsLength={tutors?.length ?? 0}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default React.memo(Tutors);
