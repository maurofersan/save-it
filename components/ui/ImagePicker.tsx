"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import classes from "./ImagePicker.module.css";

const DEFAULT_ATTACHMENT_ACCEPT =
  "image/png,image/jpeg,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.pdf,.doc,.docx,.xls,.xlsx";

const DEFAULT_ATTACHMENT_HINT =
  "Imágenes máx. 5 MB (PNG/JPG/WEBP). Documentos máx. 15 MB (PDF, Word, Excel).";

type PickerMode = "image" | "attachment";

export function ImagePicker({
  label,
  name,
  mode = "attachment",
  accept,
  hint,
  error,
  required,
}: {
  label: string;
  name: string;
  mode?: PickerMode;
  accept?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}) {
  const resolvedAccept =
    accept ??
    (mode === "attachment"
      ? DEFAULT_ATTACHMENT_ACCEPT
      : "image/png,image/jpeg,image/webp");
  const resolvedHint =
    hint ??
    (mode === "attachment"
      ? DEFAULT_ATTACHMENT_HINT
      : "Máx. 5MB · PNG/JPG/WEBP");

  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [isImageSelection, setIsImageSelection] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPickedImage(null);
      setPickedName(null);
      setIsImageSelection(false);
      return;
    }
    setPickedName(file.name);
    const isImg = file.type.startsWith("image/");
    setIsImageSelection(isImg);
    if (isImg) {
      const fileReader = new FileReader();
      fileReader.onload = () =>
        setPickedImage(String(fileReader.result ?? ""));
      fileReader.readAsDataURL(file);
    } else {
      setPickedImage(null);
    }
  };

  const chooseLabel = mode === "attachment" ? "Elegir archivo" : "Elegir imagen";
  const emptyCopy =
    mode === "attachment"
      ? "Aún no seleccionaste un archivo."
      : "Aún no seleccionaste una imagen.";

  return (
    <div className={classes.imagePicker}>
      <label className={classes.imagePicker__label} htmlFor={name}>
        {label}
      </label>
      <div className={classes.imagePicker__controls}>
        <div className={classes.imagePicker__preview}>
          {pickedImage && isImageSelection ? (
            <Image
              fill
              sizes="160px"
              src={pickedImage}
              alt="Vista previa de la evidencia seleccionada."
              className="object-cover"
            />
          ) : pickedName && !isImageSelection ? (
            <div className={classes.imagePicker__filePreview}>
              <span className={classes.imagePicker__fileIcon} aria-hidden>
                📎
              </span>
              <span className={classes.imagePicker__fileName}>{pickedName}</span>
            </div>
          ) : (
            <p className={classes.imagePicker__previewText}>{emptyCopy}</p>
          )}
        </div>

        <div className={classes.imagePicker__actions}>
          <input
            id={name}
            name={name}
            type="file"
            accept={resolvedAccept}
            required={required}
            className={classes.imagePicker__input}
            ref={inputRef}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className={classes.imagePicker__button}
            onClick={handlePick}
          >
            {chooseLabel}
          </button>
          {resolvedHint ? (
            <div className={classes.imagePicker__hint}>{resolvedHint}</div>
          ) : null}
          {error ? (
            <div className={classes.imagePicker__error}>{error}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
