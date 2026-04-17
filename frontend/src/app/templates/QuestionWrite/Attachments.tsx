import React from "react";
const PDFIcon = require("../../../assets/img/pdfIcon.png");

type FileMeta = { name: string; url: string; size?: number; type?: string };

const apiBase = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const toAbsUrl = (p: string) =>
  p && p.startsWith("http") ? p : `${apiBase}${p.startsWith("/") ? "" : "/"}${p}`;

const Attachments: React.FC<{ files: FileMeta[] }> = ({ files }) => (
  <div className="mt-2 flex flex-wrap gap-3">
    {files.map((f, i) => (
      <Attachment key={i} file={f} />
    ))}
  </div>
);

const Attachment: React.FC<{ file: FileMeta }> = ({ file }) => {
  const href = toAbsUrl(file.url);

  const handleDownload = async (e: React.MouseEvent) => {
    console.log("work click?")
    //e.preventDefault();
    try {
      console.log("🟢 href перед fetch:", href);
      const res = await fetch(href, {
        method: "GET",
        credentials: "include", // добавляем cookie
      });

      
      console.log("res:", res.status, res.headers.get("content-type"));
      if (!res.ok) throw new Error(`Ошибка загрузки: ${res.status}`);
      
      const blob = await res.blob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Не удалось скачать файл:", err);
    }
  };

  const isImg =
    file.type?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name);
  const isPdf =
    file.type === "application/pdf" || /\.pdf$/i.test(file.name);

  if (isImg) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-[220px]"
      >
        <img
          src={href}
          alt={file.name}
          className="max-w-[220px] rounded-md"
          loading="lazy"
        />
        <div className="text-xs mt-1 truncate max-w-[220px]">{file.name}</div>
      </a>
    );
  }

  // PDF и все прочие типы — скачиваются вручную
  return (
    <a
      href={href}
      onClick={handleDownload}
      className="inline-flex items-center gap-2 underline"
    >
      {isPdf && <img src={PDFIcon} className="w-5 h-5" alt="" />}
      <span className="truncate max-w-[220px]">{file.name}</span>
      {file.size ? (
        <span className="text-xs opacity-70">
          ({Math.round(file.size / 1024)} KB)
        </span>
      ) : null}
    </a>
  );
};

export default Attachments;


  