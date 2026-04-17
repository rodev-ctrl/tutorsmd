import React, { useEffect, useState, FunctionComponent, useRef } from "react";
import { useLocation } from "react-router-dom";

interface SelfiProps {
  ImageSelfi: string;
  name: string;
  surname: string;
  width: string;     // например "100%" или "98%"
  height: string;    // например "245px"
  maxHeight: string; // например "245px"
  radius: string;    // например "20px"
}

const Selfi: FunctionComponent<SelfiProps> = ({
  ImageSelfi,
  name,
  surname,
  width,
  height,
  maxHeight,
  radius,
}) => {
  const location = useLocation();
  const [borderBottomLeftRadius, setBorderBottomLeftRadius] = useState("20px");
  const [borderBottomRightRadius, setBorderBottomRightRadius] = useState("20px");

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const onTutors = location.pathname.includes("/tutors");
    const hasName = qs.has("name");
    const hasSurname = qs.has("surname");

    if (onTutors && hasName && hasSurname) {
      setBorderBottomLeftRadius("20px");
      setBorderBottomRightRadius("20px");
    } else {
      setBorderBottomLeftRadius("5px");
      setBorderBottomRightRadius("0px");
    }
  }, [location.pathname, location.search]);
const parentRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className={`selfi ${(window.innerWidth > 550) ? "" : "w-full"}`}
      ref={parentRef}
      style={{
        width: window.innerWidth > 550 ? width : "100%",
        maxHeight: window.innerWidth > 550 ? maxHeight : "none",
        position: "relative",
        borderRadius: radius,
        overflow: "hidden",
        margin: window.innerWidth <= 550 ? "0 auto" : undefined,
      }}
    >
      <img
        src={ImageSelfi}
        alt="Selfi"
        className="block w-full"
        style={{
          objectFit: "cover",
          width: "100%",
          height: window.innerWidth > 550 ? height : "auto",
          aspectRatio: window.innerWidth <= 550 ? "1 / 1" : undefined,
          borderRadius: radius,
        }}
      />

     
    </div>
  );
};

export default React.memo(Selfi);




