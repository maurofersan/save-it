"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import classes from "./ImagePicker.module.css";

export function ImagePicker({
  label,
  name,
  accept = "image/*",
  hint,
  error,
  required,
}: {
  label: string;
  name: string;
  accept?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}) {
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPickedImage(null);
      return;
    }
    const fileReader = new FileReader();
    fileReader.onload = () => setPickedImage(String(fileReader.result ?? ""));
    fileReader.readAsDataURL(file);
  };

  return (
    <div className={classes.imagePicker}>
      <label className={classes.imagePicker__label} htmlFor={name}>
        {label}
      </label>
      <div className={classes.imagePicker__controls}>
        <div className={classes.imagePicker__preview}>
          {!pickedImage ? (
            <p className={classes.imagePicker__previewText}>
              Aún no seleccionaste una imagen.
            </p>
          ) : (
            <Image
              fill
              sizes="160px"
              src={pickedImage}
              alt="Vista previa de la evidencia seleccionada."
              className="object-cover"
            />
          )}
        </div>

        <div className={classes.imagePicker__actions}>
          <input
            id={name}
            name={name}
            type="file"
            accept={accept}
            required={required}
            className={classes.imagePicker__input}
            ref={inputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            className={classes.imagePicker__button}
            onClick={handlePick}
          >
            Elegir imagen
          </button>
          {hint ? <div className={classes.imagePicker__hint}>{hint}</div> : null}
          {error ? (
            <div className={classes.imagePicker__error}>{error}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

